'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { useAiDraft, type AiDraftType } from '@/components/office/AiDraftContext';
import { useActiveDocument } from '@/components/office/ActiveDocumentContext';
import { createClient } from '@/lib/supabase/client';
import { createFuelLog } from '@/lib/fuel/actions';
import { format } from 'date-fns';
import { 
  Sparkles, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  ChevronDown,
  MessageSquare,
  Check,
  Loader2,
  Trash2,
  Copy,
  Volume2,
  Radio,
  RefreshCcw,
  ExternalLink,
  Undo2,
  Car,
  ShieldAlert
} from 'lucide-react';

const SUGGESTIONS = [
  "Create a quotation",
  "Draft a follow-up email",
  "Create an invoice"
];

const VOICE_PAUSE_MS = 3500;
const VOICE_SESSION_TIMEOUT_MS = 20000;
const HANDS_FREE_IDLE_TIMEOUT_MS = 10000;
const VOICE_PAUSE_OPTIONS = [
  { label: 'Short', value: 2500 },
  { label: 'Normal', value: 3500 },
  { label: 'Long', value: 5000 },
];
const CONFIRMATION_PHRASES = ["yes", "confirm", "go ahead", "send it", "do it", "proceed", "correct", "that's right", "yep", "ja"];
const CANCELLATION_PHRASES = ["no", "cancel", "stop", "don't", "nope", "negative"];

// Tools that the AI should execute directly without showing a confirmation button
const DIRECT_ACTION_TOOLS = new Set([
  'addLineItem',
  'removeLineItem',
  'updateLineItem',
  'updateDocumentField',
  'saveDocument',
  'closeDocument',
  'navigateTo',
  'openExistingDocument',
]);

const NAVIGATION_ROUTES: Record<string, string> = {
  dashboard: '/office/dashboard',
  invoices: '/office/invoices',
  quotes: '/office/quotes',
  clients: '/office/clients',
  expenses: '/office/expenses',
  reports: '/office/reports',
  settings: '/office/settings',
  emails: '/office/emails',
  travel: '/office/travel',
  vat: '/office/vat',
  reminders: '/office/reminders',
  timeline: '/office/timeline',
  certificates: '/office/certificates',
  'purchase-orders': '/office/purchase-orders',
  'credit-notes': '/office/credit-notes',
};

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

type AssistantLanguagePreference = 'south_african_english' | 'british_english';

type AssistantRuntimeSettings = {
  requireConfirmationBeforeSend: boolean;
  conciseResponses: boolean;
  languagePreference: AssistantLanguagePreference;
  alwaysIncludeVat: boolean;
  defaultEmailSignature: string;
  handsFreeMode: boolean;
};

const DEFAULT_EMAIL_SIGNATURE = 'Kind regards, [owner name] | Touch Teqniques Engineering Services | +27 72 552 2110 | info@touchteq.co.za';
const DEFAULT_ASSISTANT_SETTINGS: AssistantRuntimeSettings = {
  requireConfirmationBeforeSend: true,
  conciseResponses: true,
  languagePreference: 'south_african_english',
  alwaysIncludeVat: true,
  defaultEmailSignature: DEFAULT_EMAIL_SIGNATURE,
  handsFreeMode: true,
};

function sanitizeAssistantSettings(raw: any): AssistantRuntimeSettings {
  const documentSettings = raw?.document_settings || {};
  const aiPreferences = documentSettings?.ai_preferences || {};
  const emailSettings = raw?.email_settings || {};

  return {
    requireConfirmationBeforeSend: aiPreferences?.require_confirmation_before_send !== false,
    conciseResponses: aiPreferences?.concise_responses !== false,
    languagePreference: aiPreferences?.language_preference === 'british_english' ? 'british_english' : 'south_african_english',
    alwaysIncludeVat: documentSettings?.always_include_vat !== false,
    defaultEmailSignature: emailSettings?.default_email_signature || DEFAULT_EMAIL_SIGNATURE,
    handsFreeMode: aiPreferences?.hands_free_mode !== false,
  };
}

function normalizeVoiceCommand(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesVoiceIntent(value: string, phrases: string[]) {
  const normalizedValue = ` ${normalizeVoiceCommand(value)} `;
  return phrases.some((phrase) => normalizedValue.includes(` ${normalizeVoiceCommand(phrase)} `));
}

function parseLineItemIndex(value: string) {
  const lineMatch = value.match(/\bline\s+(\d+)\b/i);
  if (lineMatch) {
    return Math.max(Number(lineMatch[1]) - 1, 0);
  }

  if (/\bsecond\b/i.test(value)) return 1;
  if (/\bthird\b/i.test(value)) return 2;
  if (/\bfourth\b/i.test(value)) return 3;

  return 0;
}

function parseCurrencyValue(value: string) {
  const cleaned = value.replace(/,/g, '').replace(/[^\d.]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDocumentEditCommand(value: string) {
  const lineIndex = parseLineItemIndex(value);

  const addLineItemMatch = value.match(/\badd\s+line\s+item\b(?:\s+(.+))?$/i);
  if (addLineItemMatch) {
    return {
      action: 'add_line_item' as const,
      description: addLineItemMatch[1]?.trim() || '',
    };
  }

  if (/\b(?:remove|delete)\b.*\bline\s+\d+\b/i.test(value)) {
    return {
      action: 'remove_line_item' as const,
      lineItemIndex: lineIndex,
    };
  }

  const quantityMatch = value.match(/\b(?:change|update|set)\b.*\bquantity\b(?:\s+(?:to|at|as|for))?\s+(\d+(?:\.\d+)?)/i);
  if (quantityMatch) {
    return {
      action: 'update_line_item' as const,
      field: 'quantity',
      value: Number(quantityMatch[1]),
      lineItemIndex: lineIndex,
    };
  }

  const unitPriceMatch = value.match(/\b(?:change|update|set)\b.*\b(?:unit\s+price|price)\b(?:\s+(?:to|at|as|for))?\s*r?\s*([\d,]+(?:\.\d+)?)/i);
  if (unitPriceMatch) {
    return {
      action: 'update_line_item' as const,
      field: 'unitPrice',
      value: parseCurrencyValue(unitPriceMatch[1]) ?? 0,
      lineItemIndex: lineIndex,
    };
  }

  const clientNameMatch = value.match(/\b(?:change|update|set)\b.*\bclient\s+name\b(?:\s+(?:to|as|for))?\s+(.+)$/i);
  if (clientNameMatch) {
    return {
      action: 'update_field' as const,
      field: 'clientName',
      value: clientNameMatch[1].trim(),
    };
  }

  const notesMatch = value.match(/\b(?:change|update|set)\b.*\bnotes?\b(?:\s+(?:to|as|for))?\s+(.+)$/i);
  if (notesMatch) {
    return {
      action: 'update_field' as const,
      field: 'notes',
      value: notesMatch[1].trim(),
    };
  }

  return null;
}

function getDocumentTotals(documentData: Record<string, any> | null) {
  const lineItems = Array.isArray(documentData?.lineItems) ? documentData.lineItems : [];
  const itemCount = lineItems.length;
  const total = lineItems.reduce((sum, item) => {
    const quantity = Number(item?.quantity ?? 0);
    const unitPrice = Number(item?.unitPrice ?? item?.unit_price ?? 0);
    return sum + quantity * unitPrice;
  }, 0);

  return { itemCount, total };
}

function formatRand(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(value).replace('ZAR', 'R');
}

export default function AiAssistant() {
  const router = useRouter();
  const toast = useOfficeToast();
  const supabase = useMemo(() => createClient(), []);
  const { setAiDraft } = useAiDraft();
  const {
    documentType: activeDocumentType,
    documentId: activeDocumentId,
    documentData: activeDocumentData,
    isOpen: activeDocumentIsOpen,
    updateField,
    addLineItem,
    removeLineItem,
    updateLineItem,
    clearDocumentSession,
  } = useActiveDocument();

  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I can help you create quotes, invoices, and emails. What do you need?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toolCall, setToolCall] = useState<any>(null);
  const [autoListen, setAutoListen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [thinkingTime, setThinkingTime] = useState(false);
  const [actionHistory, setActionHistory] = useState<{ id: string, type: 'quote' | 'invoice' | 'certificate' }[]>([]);
  const [lastCreatedDoc, setLastCreatedDoc] = useState<{ type: 'Quotation' | 'Invoice' | 'Certificate', ref: string, time: string } | null>(null);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [assistantSettings, setAssistantSettings] = useState<AssistantRuntimeSettings>(DEFAULT_ASSISTANT_SETTINGS);
  const [voicePauseMs, setVoicePauseMs] = useState(VOICE_PAUSE_MS);
  const [showDriveModeTip, setShowDriveModeTip] = useState(false);

  // Persist TTS Setting
  useEffect(() => {
    const saved = localStorage.getItem('touchteq_assistant_tts');
    if (saved !== null) setIsTtsEnabled(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('touchteq_assistant_tts', String(isTtsEnabled));
  }, [isTtsEnabled]);
  const [wasLastInputVoice, setWasLastInputVoice] = useState(false);
  const [isTtsActive, setIsTtsActive] = useState(false);
  const [driveMode, setDriveMode] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; data: any } | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestTranscriptRef = useRef('');
  const committedTranscriptRef = useRef('');
  const isNearBottomRef = useRef(true);
  const shouldAutoSendTranscriptRef = useRef(false);
  const manualStopRef = useRef(false);
  const autoActivatedRef = useRef(false);
  const suppressAutoRestartRef = useRef(false);
  const confirmationHandledRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  const isRecordingRef = useRef(isRecording);
  const autoListenRef = useRef(autoListen);
  const assistantSettingsRef = useRef(assistantSettings);
  const driveModeRef = useRef(driveMode);
  const pendingActionRef = useRef(pendingAction);
  const activeDocumentSessionRef = useRef({
    documentType: activeDocumentType,
    documentId: activeDocumentId,
    documentData: activeDocumentData,
    isOpen: activeDocumentIsOpen,
  });
  const handleSendRef = useRef<(fromVoice?: boolean, textOverride?: string) => void | Promise<void>>(() => undefined);
  const sendStagedEmailRef = useRef<(args: any) => void | Promise<void>>(() => undefined);
  const executeDirectToolCallRef = useRef<(name: string, args: any) => boolean>(() => false);
  const confirmPendingActionRef = useRef<() => void | Promise<void>>(() => undefined);
  const cancelPendingConfirmationRef = useRef<() => void>(() => undefined);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toolCallRef = useRef<any>(null);
  const thinkingRef = useRef<NodeJS.Timeout | null>(null);
  const undoRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    toolCallRef.current = toolCall;
  }, [toolCall]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    autoListenRef.current = autoListen;
  }, [autoListen]);

  useEffect(() => {
    assistantSettingsRef.current = assistantSettings;
  }, [assistantSettings]);

  useEffect(() => {
    driveModeRef.current = driveMode;
  }, [driveMode]);

  useEffect(() => {
    pendingActionRef.current = pendingAction;
  }, [pendingAction]);

  useEffect(() => {
    confirmationHandledRef.current = false;
  }, [toolCall, pendingAction]);

  useEffect(() => {
    activeDocumentSessionRef.current = {
      documentType: activeDocumentType,
      documentId: activeDocumentId,
      documentData: activeDocumentData,
      isOpen: activeDocumentIsOpen,
    };
  }, [activeDocumentData, activeDocumentId, activeDocumentIsOpen, activeDocumentType]);

  // Load Preferences & Persistence
  useEffect(() => {
    const applyAssistantSettings = (next: AssistantRuntimeSettings) => {
      setAssistantSettings(next);
      setAutoListen(next.handsFreeMode);
    };

    const readAssistantSettingsFromLocalStorage = () => {
      const saved = localStorage.getItem('touchteq_assistant_settings');
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved);
        applyAssistantSettings(sanitizeAssistantSettings(parsed));
      } catch {}
    };

    const loadAssistantSettingsFromDatabase = async () => {
      const { data } = await supabase
        .from('business_profile')
        .select('document_settings, email_settings')
        .single();

      if (!data) return;
      const sanitized = sanitizeAssistantSettings(data);
      applyAssistantSettings(sanitized);
      localStorage.setItem(
        'touchteq_assistant_settings',
        JSON.stringify({
          document_settings: data.document_settings || {},
          email_settings: data.email_settings || {},
        })
      );
    };

    const tooltipDismissed = localStorage.getItem('touchteq_ai_tooltip_dismissed');
    if (!tooltipDismissed) setShowTooltip(true);

    const savedAutoListen = localStorage.getItem('touchteq_ai_auto_listen');
    if (savedAutoListen) setAutoListen(savedAutoListen === 'true');

    const savedVoicePause = localStorage.getItem('touchteq_ai_voice_pause_ms');
    if (savedVoicePause) {
      const parsedPause = Number(savedVoicePause);
      if (VOICE_PAUSE_OPTIONS.some((option) => option.value === parsedPause)) {
        setVoicePauseMs(parsedPause);
      }
    }

    const driveTipDismissed = localStorage.getItem('touchteq_ai_drive_tip_dismissed');
    if (!driveTipDismissed) setShowDriveModeTip(true);

    const savedHistory = sessionStorage.getItem('touchteq_ai_history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setMessages(history.slice(-10).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {
        console.error("Failed to restore history", e);
      }
    }

    readAssistantSettingsFromLocalStorage();
    void loadAssistantSettingsFromDatabase();

    const onSettingsChange = () => readAssistantSettingsFromLocalStorage();
    window.addEventListener('touchteq-settings-change', onSettingsChange);
    return () => {
      window.removeEventListener('touchteq-settings-change', onSettingsChange);
    };
  }, [supabase]);

  // Persist History
  useEffect(() => {
    if (messages.length > 1) {
      sessionStorage.setItem('touchteq_ai_history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('touchteq_ai_voice_pause_ms', String(voicePauseMs));
  }, [voicePauseMs]);

  useEffect(() => {
    localStorage.setItem('touchteq_ai_auto_listen', String(autoListen));
  }, [autoListen]);

  // Handle Unread Notification
  useEffect(() => {
    if (!isOpen && messages.length > 0 && messages[messages.length - 1].sender === 'assistant') {
      setUnreadCount(prev => prev + 1);
    }
    if (isOpen) setUnreadCount(0);
  }, [messages, isOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeout = timeoutRef.current;
    const silenceTimeout = silenceTimeoutRef.current;
    const undoTimeout = undoRef.current;
    const thinkingTimeout = thinkingRef.current;
    const activeAudio = audioRef.current;

    return () => {
      if (timeout) clearTimeout(timeout);
      if (silenceTimeout) clearTimeout(silenceTimeout);
      if (undoTimeout) clearTimeout(undoTimeout);
      if (thinkingTimeout) clearTimeout(thinkingTimeout);
      if (activeAudio) {
        activeAudio.pause();
        if (audioRef.current === activeAudio) {
          audioRef.current = null;
        }
      }
    };
  }, []);
  useEffect(() => {
    if (!isOpen) {
      manualStopRef.current = true;
      suppressAutoRestartRef.current = true;
      try {
        recognitionRef.current?.stop();
      } catch {}
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setIsTtsActive(false);
      setMessages([{
        id: '1',
        text: "Hi! I can help you create quotes, invoices, and emails. What do you need?",
        sender: 'assistant',
        timestamp: new Date()
      }]);
      setToolCall(null);
      latestTranscriptRef.current = '';
      committedTranscriptRef.current = '';
      shouldAutoSendTranscriptRef.current = false;
    }
  }, [isOpen]);

  const appendAssistantMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        sender: 'assistant',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Safety Timeout for Mic
  const startTimeout = useCallback((durationMs = VOICE_SESSION_TIMEOUT_MS) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (recognitionRef.current && isRecordingRef.current) {
        const hasTranscript = Boolean(latestTranscriptRef.current.trim());
        const isHandsFreeSession = autoActivatedRef.current || driveModeRef.current;

        if (autoActivatedRef.current && !hasTranscript) {
          manualStopRef.current = true;
          suppressAutoRestartRef.current = true;
          shouldAutoSendTranscriptRef.current = false;
          recognitionRef.current.stop();
          return;
        }

        shouldAutoSendTranscriptRef.current = Boolean(isHandsFreeSession && hasTranscript);
        recognitionRef.current.stop();
        setHasError(true);
        setTimeout(() => setHasError(false), 500);
      }
    }, durationMs);
  }, []);

  const startListening = useCallback((mode: 'manual' | 'hands-free' = 'manual') => {
    if (!recognitionRef.current) {
      return;
    }

    if (mode === 'hands-free' && (!autoListenRef.current || !isOpenRef.current || manualStopRef.current)) {
      return;
    }

    autoActivatedRef.current = mode === 'hands-free';
    suppressAutoRestartRef.current = false;
    shouldAutoSendTranscriptRef.current = false;
    latestTranscriptRef.current = '';
    committedTranscriptRef.current = '';

    try {
      recognitionRef.current.start();
    } catch {
      try {
        recognitionRef.current.stop();
      } catch {}

      window.setTimeout(() => {
        try {
          recognitionRef.current?.start();
        } catch {}
      }, 100);
    }
  }, []);

  const stopAudioPlayback = useCallback(() => {
    if (!audioRef.current) {
      setIsTtsActive(false);
      return;
    }

    audioRef.current.onended = null;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
    setIsTtsActive(false);
  }, []);

  const playAudio = useCallback(async (base64Audio: string, mimeType = 'audio/mp3', onEnd?: () => void) => {
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    const audioSourceString = `data:${mimeType};base64,${base64Audio}`;

    let audio: HTMLAudioElement | null = null;
    try {
      audio = new Audio(audioSourceString);
      audioRef.current = audio;
      
      audio.onplay = () => setIsTtsActive(true);
      audio.onended = () => {
        setIsTtsActive(false);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        if (onEnd) onEnd();
      };
      
      try {
        await audio.play();
      } catch {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        if (onEnd) onEnd();
      }
    } catch (e) {
      console.error('Failed to decode audio:', e);
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      if (onEnd) onEnd();
    }
  }, []);

  const cancelPendingConfirmation = useCallback(() => {
    setPendingAction(null);
    setToolCall(null);
    setInputText('');
    appendAssistantMessage("Action cancelled.");
  }, [appendAssistantMessage]);

  const resolveConfirmationIntent = useCallback((value: string) => {
    if ((!toolCallRef.current && !pendingActionRef.current) || confirmationHandledRef.current) {
      return false;
    }

    if (matchesVoiceIntent(value, CONFIRMATION_PHRASES)) {
      confirmationHandledRef.current = true;
      void confirmPendingActionRef.current();

      setInputText('');
      return true;
    }

    if (matchesVoiceIntent(value, CANCELLATION_PHRASES)) {
      confirmationHandledRef.current = true;
      cancelPendingConfirmationRef.current();
      return true;
    }

    return false;
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = assistantSettingsRef.current.languagePreference === 'british_english' ? 'en-GB' : 'en-ZA';

    recognition.onstart = () => {
      manualStopRef.current = false;
      setIsRecording(true);
      setHasError(false);
      startTimeout(autoActivatedRef.current ? HANDS_FREE_IDLE_TIMEOUT_MS : VOICE_SESSION_TIMEOUT_MS);
    };

    recognition.onresult = (event: any) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      
      let committedTranscript = committedTranscriptRef.current;
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0]?.transcript?.trim();
        if (!transcriptPart) continue;

        if (result.isFinal) {
          committedTranscript = [committedTranscript, transcriptPart].filter(Boolean).join(' ').trim();
        } else {
          interimTranscript = [interimTranscript, transcriptPart].filter(Boolean).join(' ').trim();
        }
      }

      committedTranscriptRef.current = committedTranscript;
      const transcript = [committedTranscript, interimTranscript].filter(Boolean).join(' ').trim();
      latestTranscriptRef.current = transcript;

      if (transcript && resolveConfirmationIntent(transcript)) {
        recognition.stop();
        return;
      }

      setInputText(transcript);
      
      const hasFinalResult = Array.from(event.results)
        .slice(event.resultIndex)
        .some((result: any) => result.isFinal);

      if (hasFinalResult) {
        setIsTranscribing(true);
        setTimeout(() => setIsTranscribing(false), 500);
        
        if ((driveModeRef.current || autoActivatedRef.current) && transcript.trim()) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && isRecordingRef.current) {
              shouldAutoSendTranscriptRef.current = true;
              recognitionRef.current.stop();
            }
          }, voicePauseMs);
        }
      } else {
        startTimeout(autoActivatedRef.current ? HANDS_FREE_IDLE_TIMEOUT_MS : VOICE_SESSION_TIMEOUT_MS);
      }
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      if (event.error === 'no-speech') {
        if ((autoListenRef.current || driveModeRef.current) && isOpenRef.current && !suppressAutoRestartRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch {}
          }, 300);
        }
        return;
      }
      console.error('Speech Recognition Error:', event.error);
      if (event.error === 'not-allowed') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "Microphone access denied. You can still type below.",
          sender: 'assistant',
          timestamp: new Date()
        }]);
      } else {
        setHasError(true);
        setTimeout(() => setHasError(false), 500);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      
      const pendingTranscript = latestTranscriptRef.current.trim();
      const shouldAutoSend = shouldAutoSendTranscriptRef.current;
      const wasAutoActivated = autoActivatedRef.current;
      autoActivatedRef.current = false;
      shouldAutoSendTranscriptRef.current = false;

      if ((driveModeRef.current || wasAutoActivated) && pendingTranscript && shouldAutoSend) {
        latestTranscriptRef.current = '';
        committedTranscriptRef.current = '';
        void handleSendRef.current(true, pendingTranscript);
        return;
      }

      if ((driveModeRef.current || autoListenRef.current) && isOpenRef.current && !manualStopRef.current && !suppressAutoRestartRef.current) {
        setTimeout(() => {
          try {
            startListening(driveModeRef.current ? 'hands-free' : 'hands-free');
          } catch {}
        }, 250);
      }
    };

    recognitionRef.current = recognition;
  }, [resolveConfirmationIntent, startListening, startTimeout, voicePauseMs]);

  useEffect(() => {
    if (!recognitionRef.current) {
      return;
    }
    recognitionRef.current.lang = assistantSettings.languagePreference === 'british_english' ? 'en-GB' : 'en-ZA';
  }, [assistantSettings.languagePreference]);

  useEffect(() => {
    if (!isOpen || !toolCall || !isSupported) {
      return;
    }

    if (isRecordingRef.current || manualStopRef.current) {
      return;
    }

    const isConfirmationStep = toolCall.name !== 'logTrip';
    if (!isConfirmationStep) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (isOpenRef.current && !isRecordingRef.current && !manualStopRef.current) {
        startListening('hands-free');
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [isOpen, isSupported, startListening, toolCall]);

  const toggleAutoListen = () => {
    const newVal = !autoListen;
    setAutoListen(newVal);
    localStorage.setItem('touchteq_ai_auto_listen', String(newVal));
    if (!newVal) {
      suppressAutoRestartRef.current = true;
    }
  };

  const dismissDriveModeTip = () => {
    setShowDriveModeTip(false);
    localStorage.setItem('touchteq_ai_drive_tip_dismissed', 'true');
  };

  const toggleRecording = useCallback(() => {
    stopAudioPlayback();

    if (isRecording) {
      manualStopRef.current = true;
      suppressAutoRestartRef.current = true;
      shouldAutoSendTranscriptRef.current = false;
      recognitionRef.current?.stop();
    } else {
      startListening('manual');
    }
  }, [isRecording, startListening, stopAudioPlayback]);

  const resolveDocumentReference = useCallback(async (value: string) => {
    const match = value.match(/\b(?:amend|edit)\s+(invoice|quote|quotation)\s+([a-z0-9-]+)/i);
    if (!match) {
      return false;
    }

    const documentType = match[1].toLowerCase().startsWith('invoice') ? 'invoice' : 'quote';
    const documentRef = match[2].toUpperCase();
    const table = documentType === 'invoice' ? 'invoices' : 'quotes';
    const numberField = documentType === 'invoice' ? 'invoice_number' : 'quote_number';

    const { data, error } = await supabase
      .from(table)
      .select(`id, ${numberField}`)
      .ilike(numberField, documentRef)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      appendAssistantMessage(`I couldn't find ${documentType} ${documentRef}.`);
      return true;
    }

    const resolvedRecord = data as { id: string; invoice_number?: string; quote_number?: string };
    const referenceNumber = documentType === 'invoice' ? resolvedRecord.invoice_number ?? documentRef : resolvedRecord.quote_number ?? documentRef;
    const isMatchingLiveSession =
      activeDocumentIsOpen &&
      activeDocumentType === documentType &&
      activeDocumentId === resolvedRecord.id;

    if (isMatchingLiveSession) {
      appendAssistantMessage(`${documentType === 'invoice' ? 'Invoice' : 'Quote'} ${referenceNumber} is already open. What would you like to change?`);
      return true;
    }

    const route =
      documentType === 'invoice'
        ? `/office/invoices/${data.id}/edit`
        : `/office/quotes/${data.id}/edit`;

    router.push(route);
    appendAssistantMessage(`${documentType === 'invoice' ? 'Invoice' : 'Quote'} ${referenceNumber} is opening now.`);
    return true;
  }, [activeDocumentId, activeDocumentIsOpen, activeDocumentType, appendAssistantMessage, router, supabase]);

  const applyActiveDocumentAmendment = useCallback((value: string) => {
    if (!activeDocumentIsOpen || !activeDocumentType) {
      return false;
    }

    const amendment = parseDocumentEditCommand(value);
    if (!amendment) {
      return false;
    }

    if (amendment.action === 'add_line_item') {
      const nextLineCount = Array.isArray(activeDocumentData?.lineItems) ? activeDocumentData.lineItems.length + 1 : 1;
      const lineItem = amendment.description
        ? { description: amendment.description, quantity: 1, unitPrice: 0, total: 0, line_total: 0 }
        : { description: '', quantity: 1, unitPrice: 0, total: 0, line_total: 0 };
      const nextDocument = addLineItem(lineItem);
      const { itemCount, total } = getDocumentTotals(nextDocument);
      appendAssistantMessage(`Done - line item added. Your ${activeDocumentType} now has ${itemCount || nextLineCount} items totalling ${formatRand(total)}.`);
      return true;
    }

    if (amendment.action === 'remove_line_item') {
      const targetIndex = amendment.lineItemIndex;
      const nextDocument = removeLineItem(targetIndex);
      const { itemCount, total } = getDocumentTotals(nextDocument);
      appendAssistantMessage(`Done - line ${targetIndex + 1} removed. Your ${activeDocumentType} now has ${itemCount} items totalling ${formatRand(total)}.`);
      return true;
    }

    if (amendment.action === 'update_line_item') {
      const nextDocument = updateLineItem(amendment.lineItemIndex, amendment.field, amendment.value);
      const { itemCount, total } = getDocumentTotals(nextDocument);
      const label = amendment.field === 'quantity' ? 'quantity' : 'price';
      appendAssistantMessage(`Done - line ${amendment.lineItemIndex + 1} ${label} updated. Your ${activeDocumentType} now has ${itemCount} items totalling ${formatRand(total)}.`);
      return true;
    }

    if (amendment.action === 'update_field') {
      const nextDocument = updateField(amendment.field, amendment.value);
      const { itemCount, total } = getDocumentTotals(nextDocument);
      appendAssistantMessage(`Done - ${String(amendment.field).replace(/([A-Z])/g, ' $1').toLowerCase()} updated. Your ${activeDocumentType} now has ${itemCount} items totalling ${formatRand(total)}.`);
      return true;
    }

    return false;
  }, [activeDocumentData, activeDocumentIsOpen, activeDocumentType, addLineItem, appendAssistantMessage, removeLineItem, updateField, updateLineItem]);

  const handleLocalAssistantIntent = useCallback(async (value: string) => {
    if (resolveConfirmationIntent(value)) {
      return true;
    }

    if (await resolveDocumentReference(value)) {
      return true;
    }

    if (applyActiveDocumentAmendment(value)) {
      return true;
    }

    return false;
  }, [applyActiveDocumentAmendment, resolveConfirmationIntent, resolveDocumentReference]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!scrollRef.current || !isNearBottomRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, isTyping]);

  const handleSend = useCallback(async (fromVoice = false, textOverride?: string) => {
    const userText = (textOverride ?? inputText).trim();
    if (!userText) return;
    setWasLastInputVoice(fromVoice);

    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    latestTranscriptRef.current = '';
    committedTranscriptRef.current = '';
    shouldAutoSendTranscriptRef.current = false;
    suppressAutoRestartRef.current = false;
    manualStopRef.current = false;
    
    if (await handleLocalAssistantIntent(userText)) {
      setIsTyping(false);
      setThinkingTime(false);
      return;
    }

    setIsTyping(true);
    setToolCall(null);
    setThinkingTime(false);

    // Thinking Timer
    if (thinkingRef.current) clearTimeout(thinkingRef.current);
    thinkingRef.current = setTimeout(() => setThinkingTime(true), 10000);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort(new DOMException('Request timed out', 'AbortError'));
    }, 45000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            history: messages.map(m => ({ sender: m.sender, text: m.text })),
            message: userText,
            wantsAudio: isTtsEnabled || driveMode || fromVoice,
            activeDocumentSession: {
              documentType: activeDocumentType,
              documentId: activeDocumentId,
              documentData: activeDocumentData,
              isOpen: activeDocumentIsOpen,
            },
            assistantPreferences: {
              requireConfirmationBeforeSend: assistantSettings.requireConfirmationBeforeSend,
              conciseResponses: assistantSettings.conciseResponses,
              languagePreference: assistantSettings.languagePreference,
              alwaysIncludeVat: assistantSettings.alwaysIncludeVat,
            },
        }),
        signal: abortController.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Could not connect to the AI brain. Check your network or API keys in .env.local.";
        let parsedError = null;
        
        try {
          parsedError = JSON.parse(errorText);
          if (parsedError.error) {
            errorMessage = parsedError.error;
            if (errorMessage.includes("API key is not configured")) {
              setApiKeyMissing(true);
            }
          }
        } catch (e) {
          // not JSON, fallback to generic error message
        }
        
        console.error(`AI request failed with status ${response.status}`, parsedError || errorText);
        
        toast.error({ 
          title: "AI Response Failed", 
          message: errorMessage
        });
        
        throw new Error(`API rejected request with status ${response.status}`);
      }
      const payload = await response.json();
      const chunk = payload;

      const assistantText = chunk.text || "";
      const audioBase64 = chunk.audio || chunk.audioBase64 || "";
      const audioMimeType = chunk.audioMimeType || chunk.mimeType || "audio/mp3";
      const toolCall = chunk.toolCall || null;

      setIsTyping(false);
      if (thinkingRef.current) clearTimeout(thinkingRef.current);
      setThinkingTime(false);
      
      const assistantId = Date.now().toString();
      
      setMessages(prev => [...prev, {
        id: assistantId,
        text: assistantText,
        sender: 'assistant',
        timestamp: new Date()
      }]);

      const resumeListening = () => {
        if (autoListenRef.current && isOpenRef.current && !manualStopRef.current) {
          window.setTimeout(() => {
            if (!isRecordingRef.current) {
              startListening('hands-free');
            }
          }, 500);
        }
      };

      if (audioBase64 && (isTtsEnabled || driveMode || fromVoice)) {
        void playAudio(audioBase64, audioMimeType, resumeListening);
      } else {
        resumeListening();
      }

      if (toolCall) {
        setFailCount(0);

        // Check if this is a direct-action tool that should be executed immediately
        if (DIRECT_ACTION_TOOLS.has(toolCall.name)) {
          const directArgs = toolCall.args || toolCall.arguments || {};
          const directResult = executeDirectToolCallRef.current(toolCall.name, directArgs);
          if (directResult) {
            // Action already executed — just resume listening
            resumeListening();
          }
          return;
        }

        // For non-direct tools, show the confirmation button
        setToolCall(toolCall);

        if (toolCall.name === 'stageEmailForConfirmation' && !assistantSettings.requireConfirmationBeforeSend) {
          void sendStagedEmailRef.current(toolCall.args || toolCall.arguments || {});
          return;
        }
        
        // In Drive Mode, add a voice prompt message
        if (driveMode && wasLastInputVoice) {
          const promptMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: "Say 'Yes' to proceed or 'No' to cancel.",
            sender: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, promptMsg]);
        }
      } else {
        setToolCall(null);
      }

    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setIsTyping(false);
        if (thinkingRef.current) clearTimeout(thinkingRef.current);
        setThinkingTime(false);
        return;
      }
      console.error(err);
      setIsTyping(false);
      if (thinkingRef.current) clearTimeout(thinkingRef.current);
      setThinkingTime(false);
      setFailCount(prev => prev + 1);
      
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          id: 'error',
          text: failCount >= 1 
            ? "The AI seems to be having trouble. Check your internet connection or try again in a moment."
            : "Something went wrong on my end. Please try again.",
          sender: 'assistant',
          timestamp: new Date()
        }]);
      }
    } finally {
      if (thinkingRef.current) clearTimeout(thinkingRef.current);
      setThinkingTime(false);
    }
  }, [activeDocumentData, activeDocumentId, activeDocumentIsOpen, activeDocumentType, assistantSettings, clearDocumentSession, driveMode, failCount, handleLocalAssistantIntent, inputText, isTtsEnabled, messages, playAudio, router, startListening, supabase, toast, wasLastInputVoice]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success({ title: "Copied", message: "Message copied to clipboard" });
  };

  const clearChat = () => {
    if (confirm("Clear conversation history?")) {
      setMessages([{
        id: '1',
        text: "Hi! I can help you create quotes, invoices, and emails. What do you need?",
        sender: 'assistant',
        timestamp: new Date()
      }]);
      setToolCall(null);
      latestTranscriptRef.current = '';
      committedTranscriptRef.current = '';
      shouldAutoSendTranscriptRef.current = false;
      sessionStorage.removeItem('touchteq_ai_history');
    }
  };

  const handleToolClick = useCallback(async () => {
    if (!toolCall && !pendingAction) return;
    
    const toolToUse = toolCall || pendingAction?.data;
    if (!toolToUse) return;
    
    let type: AiDraftType = 'quote';
    let path = '/office/quotes/new';
    
    if (toolToUse.name === 'openInvoiceManager') {
      type = 'invoice';
      path = '/office/invoices/new';
    } else if (toolToUse.name === 'composeEmail') {
      type = 'email';
      path = '/office/emails/new';
    } else if (toolToUse.name === 'generateCertificate') {
      type = 'certificate';
      path = '/office/certificates/new';
    }
    
    // Gemini uses .args, while some other models might use .arguments
    let args = { ...(toolToUse.args || toolToUse.arguments || {}) };
    
    // ENFORCE STRICT GUARDRAILS (.antigravityrules) - Non-negotiable
    if (args.clientName) {
      args.clientName = args.clientName.replace(/[0-9]/g, '').trim();
    }
    if (args.phoneNumber) {
      args.phoneNumber = args.phoneNumber.replace(/[a-zA-Z]/g, '').trim();
    }
    if (args.clientPhone) {
      args.clientPhone = args.clientPhone.replace(/[a-zA-Z]/g, '').trim();
    }
    if (toolToUse.name === 'composeEmail') {
      const signature = assistantSettingsRef.current.defaultEmailSignature.trim();
      const existingBody = String(args.body || '').trim();
      if (signature && !existingBody.includes(signature)) {
        args.body = existingBody ? `${existingBody}\n\n${signature}` : signature;
      }
    }
    
    // Server-side tools — these execute in the API route and return text.
    // If a tool call somehow reaches the client, just ignore it.
    const SERVER_SIDE_TOOL_NAMES = ['logTrip', 'queryBusinessData', 'createClient', 'logExpense', 'recordPayment', 'draftQuote', 'draftInvoice'];
    if (SERVER_SIDE_TOOL_NAMES.includes(toolToUse.name)) {
      setToolCall(null);
      setPendingAction(null);
      return;
    }
    
    const isDocumentTool = toolToUse.name === 'openQuotationBuilder' || toolToUse.name === 'openInvoiceManager';
    const liveDocumentType = toolToUse.name === 'openInvoiceManager' ? 'invoice' : toolToUse.name === 'openQuotationBuilder' ? 'quote' : null;
    const liveSession = activeDocumentSessionRef.current;

    if (isDocumentTool && liveDocumentType && liveSession.isOpen && liveSession.documentType === liveDocumentType) {
      let nextSessionData = liveSession.documentData;

      if (args.clientName) {
        nextSessionData = updateField('clientName', args.clientName) || nextSessionData;
      }

      const lineItems = Array.isArray(args.lineItems) ? args.lineItems : [];

      if (liveDocumentType === 'invoice' && args.invoiceDate) {
        nextSessionData = updateField('issue_date', args.invoiceDate) || nextSessionData;
      }
      if (liveDocumentType === 'invoice' && args.dueDate) {
        nextSessionData = updateField('due_date', args.dueDate) || nextSessionData;
      }
      if (args.notes) {
        nextSessionData = updateField('notes', args.notes) || nextSessionData;
      }
      if (args.internal_notes) {
        nextSessionData = updateField('internal_notes', args.internal_notes) || nextSessionData;
      }

      if (lineItems.length > 0) {
        const currentItems = Array.isArray(nextSessionData?.lineItems) ? nextSessionData.lineItems : [];
        while (currentItems.length > lineItems.length) {
          nextSessionData = removeLineItem(currentItems.length - 1) || nextSessionData;
          currentItems.pop();
        }
        while (currentItems.length < lineItems.length) {
          nextSessionData = addLineItem({ description: '', quantity: 1, unitPrice: 0, total: 0, line_total: 0 }) || nextSessionData;
          currentItems.push({});
        }

        lineItems.forEach((item: any, index: number) => {
          if (item.description) {
            nextSessionData = updateLineItem(index, 'description', item.description) || nextSessionData;
          }
          if (typeof item.quantity !== 'undefined') {
            nextSessionData = updateLineItem(index, 'quantity', Number(item.quantity) || 1) || nextSessionData;
          }
          if (typeof item.unitPrice !== 'undefined') {
            nextSessionData = updateLineItem(index, 'unitPrice', Number(item.unitPrice) || 0) || nextSessionData;
          }
        });
      }

      activeDocumentSessionRef.current = {
        ...liveSession,
        documentData: nextSessionData,
      };
      const nextTotals = getDocumentTotals(nextSessionData);
      toast.success({
        title: `${liveDocumentType === 'quote' ? 'Quotation' : 'Invoice'} Updated`,
        message: `Applied the requested changes in the open document session.`
      });
      appendAssistantMessage(`Done - your ${liveDocumentType} is already open. I updated it here. ${nextTotals.itemCount} items now total ${formatRand(nextTotals.total)}.`);
      setPendingAction(null);
      setToolCall(null);
      return;
    }

    if (toolToUse.name === 'logFuelPurchase') {
      try {
        const payload = {
          date: args.date || new Date().toISOString().split('T')[0],
          supplier_name: args.supplierName,
          fuel_type: args.fuelType || 'Diesel',
          litres: Number(args.litres || 0),
          price_per_litre: Number(args.pricePerLitre || 0),
          total_amount: Number(args.totalAmount || 0),
          odometer: Number(args.odometer || 0),
          payment_method: args.paymentMethod || 'Card',
          vehicle_id: ''
        };
        
        // Find vehicle ID if possible
        if (args.vehicleName) {
           const { data: vData } = await supabase.from('vehicles').select('id').ilike('vehicle_description', `%${args.vehicleName}%`).eq('is_active', true).limit(1).maybeSingle();
           if (vData) payload.vehicle_id = vData.id;
        }

        const res = await createFuelLog(payload);
        if (res.success) {
          toast.success({ title: "Fuel Log Saved", message: `Successfully recorded fill-up at ${args.supplierName}` });
          appendAssistantMessage(`All set! I've logged that fuel purchase of ${args.totalAmount} ZAR at ${args.supplierName}. Anything else?`);
        } else {
          toast.error({ title: "Error Saving Log", message: "Could not save the fuel log." });
        }
      } catch (err: any) {
        toast.error({ title: "Failed to Save", message: err.message });
      }
      setPendingAction(null);
      setToolCall(null);
      return;
    }

    setAiDraft(type, args);
    router.push(path);
    
    toast.success({
      title: `${type === 'quote' ? 'Quotation' : 'Invoice'} Initialized`,
      message: `Form pre-populated with AI data. Verify before saving.`
    });

    // Clear pending action after execution
    setPendingAction(null);
    
    // Start 10s undo window (UI only for now as requested)
    clearTimeout(undoRef.current!);
  }, [autoListen, isOpen, isRecording, pendingAction, router, setAiDraft, toast, toggleRecording, toolCall, wasLastInputVoice]);

  const handleUndo = () => {
    setActionHistory([]);
    toast.info({ title: "Action Undone", message: "New document draft cancelled." });
    router.back();
  };

  const sendStagedEmail = useCallback(async (args: any) => {
    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });

      if (!response.ok) throw new Error("Failed to send");

      const ref = args.documentReference || 'N/A';
      const type = args.documentType || 'Email';
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `${type} sent successfully. ${ref !== 'N/A' ? `Reference: ${ref}` : ''}`,
        sender: 'assistant',
        timestamp: new Date()
      }]);
      
      toast.success({
        title: "Email Sent",
        message: `Successfully delivered to ${args.recipientEmail || 'recipient'}`
      });

      if (args.documentType === 'quotation' || args.documentType === 'invoice' || args.documentType === 'certificate') {
        setLastCreatedDoc({
          type: args.documentType === 'quotation' ? 'Quotation' : args.documentType === 'invoice' ? 'Invoice' : 'Certificate',
          ref: ref,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      setToolCall(null);
    } catch (err: any) {
      toast.error({ title: "Send Failed", message: err.message });
    } finally {
      setIsSendingEmail(false);
    }
  }, [toast]);

  const handleConfirmSend = useCallback(async () => {
    if (!toolCall || toolCall.name !== 'stageEmailForConfirmation') return;
    const args = toolCall.args || toolCall.arguments || {};
    await sendStagedEmail(args);
  }, [sendStagedEmail, toolCall]);

  const confirmPendingAction = useCallback(async () => {
    if (!toolCallRef.current) {
      return;
    }

    if (toolCallRef.current.name === 'stageEmailForConfirmation') {
      await handleConfirmSend();
      return;
    }

    await handleToolClick();
  }, [handleConfirmSend, handleToolClick]);

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  useEffect(() => {
    sendStagedEmailRef.current = sendStagedEmail;
  }, [sendStagedEmail]);

  useEffect(() => {
    confirmPendingActionRef.current = confirmPendingAction;
  }, [confirmPendingAction]);

  useEffect(() => {
    cancelPendingConfirmationRef.current = cancelPendingConfirmation;
  }, [cancelPendingConfirmation]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Execute a direct-action tool call immediately without showing a button.
  // This is the heart of the "smart AI" fix — these actions happen instantly.
  const executeDirectToolCallInline = useCallback((name: string, args: any): boolean => {
    const session = activeDocumentSessionRef.current;

    switch (name) {
      case 'addLineItem': {
        if (!session.isOpen || !session.documentType) {
          appendAssistantMessage("No document is currently open. Please create or open a document first.");
          return true;
        }
        const item = {
          description: args.description || '',
          quantity: Number(args.quantity) || 1,
          unitPrice: Number(args.unitPrice) || 0,
          total: (Number(args.quantity) || 1) * (Number(args.unitPrice) || 0),
          line_total: (Number(args.quantity) || 1) * (Number(args.unitPrice) || 0),
        };
        const nextDoc = addLineItem(item);
        const { itemCount, total } = getDocumentTotals(nextDoc);
        appendAssistantMessage(`Done — added "${args.description || 'New item'}". Your ${session.documentType} now has ${itemCount} items totalling ${formatRand(total)}.`);
        return true;
      }

      case 'removeLineItem': {
        if (!session.isOpen || !session.documentType) {
          appendAssistantMessage("No document is currently open.");
          return true;
        }
        const idx = Number(args.index) || 0;
        const currentItems = Array.isArray(session.documentData?.lineItems) ? session.documentData.lineItems : [];
        if (idx < 0 || idx >= currentItems.length) {
          appendAssistantMessage(`Line ${idx + 1} doesn't exist. You have ${currentItems.length} items.`);
          return true;
        }
        const removedDesc = currentItems[idx]?.description || `Line ${idx + 1}`;
        const nextDoc2 = removeLineItem(idx);
        const { itemCount: ic2, total: t2 } = getDocumentTotals(nextDoc2);
        appendAssistantMessage(`Done — removed "${removedDesc}". ${ic2} items remaining, totalling ${formatRand(t2)}.`);
        return true;
      }

      case 'updateLineItem': {
        if (!session.isOpen || !session.documentType) {
          appendAssistantMessage("No document is currently open.");
          return true;
        }
        const lineIdx = Number(args.index) || 0;
        const field = args.field || 'description';
        let val: any = args.value;
        if (field === 'quantity' || field === 'unitPrice') {
          val = Number(val) || 0;
        }
        const nextDoc3 = updateLineItem(lineIdx, field, val);
        const { itemCount: ic3, total: t3 } = getDocumentTotals(nextDoc3);
        const fieldLabel = field === 'unitPrice' ? 'price' : field;
        appendAssistantMessage(`Done — line ${lineIdx + 1} ${fieldLabel} updated to ${val}. Total: ${formatRand(t3)}.`);
        return true;
      }

      case 'updateDocumentField': {
        if (!session.isOpen || !session.documentType) {
          appendAssistantMessage("No document is currently open.");
          return true;
        }
        const nextDoc4 = updateField(args.field, args.value);
        const fieldName = String(args.field).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase().trim();
        appendAssistantMessage(`Done — ${fieldName} updated.`);
        return true;
      }

      case 'saveDocument': {
        if (!session.isOpen || !session.documentType) {
          appendAssistantMessage("No document is currently open to save.");
          return true;
        }
        // Dispatch a custom event that the invoice/quote page can listen to
        window.dispatchEvent(new CustomEvent('touchteq-ai-save-document'));
        appendAssistantMessage("Saving your document now.");
        toast.success({ title: 'Saving', message: 'AI triggered save on your open document.' });
        return true;
      }

      case 'closeDocument': {
        if (!session.isOpen || !session.documentType) {
          appendAssistantMessage("No document is currently open.");
          return true;
        }
        // Dispatch save first, then navigate
        window.dispatchEvent(new CustomEvent('touchteq-ai-save-document'));
        clearDocumentSession();
        const closeDest = args.navigateTo || 'dashboard';
        const closeRoute = NAVIGATION_ROUTES[closeDest] || NAVIGATION_ROUTES.dashboard;
        setTimeout(() => router.push(closeRoute), 500);
        appendAssistantMessage(`Document closed. Opening ${closeDest}.`);
        return true;
      }

      case 'navigateTo': {
        const dest = String(args.destination || 'dashboard').toLowerCase().trim();
        const route = NAVIGATION_ROUTES[dest];
        if (!route) {
          appendAssistantMessage(`I don't recognise "${dest}" as a destination. Available: ${Object.keys(NAVIGATION_ROUTES).join(', ')}.`);
          return true;
        }
        router.push(route);
        const destLabel = dest.charAt(0).toUpperCase() + dest.slice(1);
        appendAssistantMessage(`Opening your ${destLabel}.`);
        return true;
      }

      case 'openExistingDocument': {
        const docType = String(args.documentType || 'invoice').toLowerCase();
        const ref = String(args.reference || '').toUpperCase();
        if (!ref) {
          appendAssistantMessage("Please provide a document reference number (e.g., INV-0001 or QT-0023).");
          return true;
        }
        // Look up the document in Supabase
        const table = docType === 'quote' ? 'quotes' : docType === 'certificate' ? 'certificates' : 'invoices';
        const numberField = docType === 'quote' ? 'quote_number' : docType === 'certificate' ? 'certificate_number' : 'invoice_number';
        supabase
          .from(table)
          .select(`id, ${numberField}`)
          .ilike(numberField, ref)
          .limit(1)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error || !data) {
              appendAssistantMessage(`I couldn't find ${docType} ${ref}. Please check the reference number.`);
              return;
            }
            const route = docType === 'quote'
              ? `/office/quotes/${data.id}/edit`
              : docType === 'certificate'
                ? `/office/certificates/${data.id}`
                : `/office/invoices/${data.id}/edit`;
            router.push(route);
            appendAssistantMessage(`Opening ${docType} ${ref} now.`);
          });
        return true;
      }

      default:
        return false;
    }
  }, [addLineItem, appendAssistantMessage, clearDocumentSession, removeLineItem, router, supabase, toast, updateField, updateLineItem]);

  useEffect(() => {
    executeDirectToolCallRef.current = executeDirectToolCallInline;
  }, [executeDirectToolCallInline]);

  const getToolLabel = (name: string) => {
    switch(name) {
      case 'openQuotationBuilder': return "Open Quotation Builder";
      case 'openInvoiceManager': return "Open Invoice Manager";
      case 'generateCertificate': return "Generate Certificate";
      case 'composeEmail': return "Compose Email";
      case 'addLineItem': return "Add Line Item";
      case 'removeLineItem': return "Remove Line Item";
      case 'updateLineItem': return "Update Line Item";
      case 'updateDocumentField': return "Update Field";
      case 'saveDocument': return "Save Document";
      case 'closeDocument': return "Close Document";
      case 'navigateTo': return "Navigate";
      case 'openExistingDocument': return "Open Document";
      case 'logTrip': return "Log Trip";
      case 'queryBusinessData': return "Query Data";
      case 'createClient': return "Create Client";
      case 'logExpense': return "Log Expense";
      case 'recordPayment': return "Record Payment";
      case 'draftQuote': return "Draft Quote";
      case 'draftInvoice': return "Draft Invoice";
      case 'logFuelPurchase': return "Confirm Fuel Log";
      default: return "Execute Action";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mb-4 w-full md:w-[440px] h-[88vh] md:h-[720px] bg-[#151B28] border border-slate-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#0B0F19] p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Touch Teq AI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Powered by Gemini</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Drive Mode Toggle */}
                <button 
                  onClick={() => {
                    if (isTtsActive) {
                      stopAudioPlayback();
                    }
                    const newDriveMode = !driveMode;
                    setDriveMode(newDriveMode);
                    if (newDriveMode) {
                      setAutoListen(true);
                      setIsTtsEnabled(true);
                      window.setTimeout(() => {
                        if (!isRecordingRef.current && isOpenRef.current) {
                          startListening('hands-free');
                        }
                      }, 300);
                    }
                  }}
                  className={`p-2 rounded-lg transition-all ${driveMode ? 'text-green-500 bg-green-500/10' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                  aria-label="Toggle Drive Mode"
                  title={driveMode ? "Drive Mode ON - Hands-free active" : "Drive Mode - Hands-free voice control"}
                >
                  <Car size={18} />
                </button>
                <button 
                  onClick={() => {
                    if (isTtsActive) {
                      stopAudioPlayback();
                      return;
                    }
                    setIsTtsEnabled(!isTtsEnabled);
                  }}
                  className={`p-2 rounded-lg transition-all ${isTtsEnabled ? 'text-orange-500 bg-orange-500/10' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                  aria-label={isTtsActive ? "Stop Voice Reply" : "Toggle Voice Responses"}
                  title={isTtsActive ? "Stop current voice reply" : "Voice replies on or off"}
                >
                  <Volume2 size={18} className={isTtsActive ? 'animate-pulse' : ''} />
                </button>
                <button 
                  onClick={toggleAutoListen}
                  className={`p-2 rounded-lg transition-all ${autoListen ? 'text-orange-500 bg-orange-500/10' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                  aria-label="Toggle Hands-free Mode"
                  title={autoListen ? "Hands-free mode ON - mic reopens after replies" : "Hands-free mode OFF - manual mic only"}
                >
                  <Radio size={18} />
                </button>
                <button 
                  onClick={clearChat}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  aria-label="Clear Chat"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  aria-label="Close Assistant"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-4 py-2 bg-[#111724] border-b border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] ${driveMode ? 'bg-green-500/15 text-green-300 border border-green-500/25' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                Car = hands-free
              </span>
              <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] ${isTtsEnabled ? 'bg-orange-500/15 text-orange-300 border border-orange-500/25' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                Speaker = voice replies
              </span>
              <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] ${autoListen ? 'bg-sky-500/15 text-sky-300 border border-sky-500/25' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                Radio = hands-free mode
              </span>
            </div>

            {/* Banner for long conversations */}
            {messages.length > 50 && (
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Long conversation — clear for speed</span>
                <button onClick={clearChat} className="text-[10px] text-orange-500 font-bold uppercase">Clear Now</button>
              </div>
            )}

            {driveMode && showDriveModeTip && (
              <div className="mx-4 mt-3 rounded-2xl border border-green-500/20 bg-green-500/8 px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black text-green-300 uppercase tracking-[0.22em]">Hands-free tip</p>
                  <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                    Take your time when speaking. The assistant now waits longer before sending, and you can tap the mic or the stop button any time to interrupt a reply.
                  </p>
                </div>
                <button
                  onClick={dismissDriveModeTip}
                  className="shrink-0 rounded-full border border-slate-700 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 hover:border-green-400 hover:text-white transition-all"
                >
                  Hide
                </button>
              </div>
            )}

            {apiKeyMissing && (
              <div className="mx-4 mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 backdrop-blur-md">
                <p className="text-[11px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert size={14} /> Setup Required
                </p>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed font-medium">
                  Your Gemini API key is missing. The assistant cannot process requests.
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/office/settings?tab=api-keys');
                  }}
                  className="mt-3 w-full rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 text-[11px] font-bold uppercase tracking-widest py-2.5 transition-all"
                >
                  Configure API Keys
                </button>
              </div>
            )}

            {/* Message Area */}
            <div 
              ref={scrollRef}
              onScroll={() => {
                const el = scrollRef.current;
                if (!el) return;
                const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                isNearBottomRef.current = distanceFromBottom < 80;
              }}
              onWheel={(e) => {
                const el = e.currentTarget;
                if (el.scrollHeight > el.clientHeight) {
                  e.preventDefault();
                  e.stopPropagation();
                  el.scrollTop += e.deltaY;
                }
              }}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 no-scrollbar"
            >
              {isTtsActive && (
                <div className="sticky top-0 z-10 flex justify-end pb-2">
                  <button
                    onClick={stopAudioPlayback}
                    className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-[#0B0F19]/95 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300 shadow-xl backdrop-blur-md hover:bg-orange-500/15"
                  >
                    <Volume2 size={12} />
                    Stop Voice Reply
                  </button>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div 
                      className={`px-4 py-3 rounded-2xl text-[16px] md:text-sm font-medium leading-relaxed shadow-lg relative ${
                        msg.sender === 'user' 
                          ? 'bg-orange-500 text-white rounded-br-none' 
                          : 'bg-[#151B28] text-white border border-slate-800 rounded-bl-none'
                      }`}
                      aria-live={msg.sender === 'assistant' ? "polite" : undefined}
                    >
                      {msg.text}
                      
                      {msg.sender === 'assistant' && (
                        <button 
                          onClick={() => copyToClipboard(msg.text)}
                          className="absolute -right-10 top-2 p-2 text-slate-600 hover:text-orange-500 transition-all opacity-0 group-hover:opacity-100 hidden md:block min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="Copy message"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Suggestions Chips */}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 py-2">
                  {SUGGESTIONS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => { setInputText(chip); setTimeout(handleSend, 10); }}
                      className="px-4 py-2 bg-slate-800/50 hover:bg-orange-500/20 text-slate-300 hover:text-orange-400 border border-slate-700 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2"
                >
                  <div className="bg-[#0B0F19] border border-slate-800 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 w-fit">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
                  </div>
                  {thinkingTime && (
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse ml-2">Still thinking...</span>
                  )}
                </motion.div>
              )}

              {/* Retry pill if failed */}
              {failCount > 0 && !isTyping && (
                <button 
                  onClick={() => handleSend(false)}
                  className="mx-auto flex items-center gap-2 bg-slate-800 hover:bg-orange-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <RefreshCcw size={12} />
                  Retry Request
                </button>
              )}

              {/* Undo Pill after Document Creation */}
              {actionHistory.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center"
                >
                  <button 
                    onClick={handleUndo}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-2 rounded-full border border-red-500/20 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl"
                  >
                    <Undo2 size={12} />
                    Undo Creation (10s)
                  </button>
                </motion.div>
              )}

              {/* Last Sent Info Chip */}
              {lastCreatedDoc && (
                <div className="flex justify-center flex-col items-center gap-2 py-2">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                      <Check size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">{lastCreatedDoc.type} Sent</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{lastCreatedDoc.ref} at {lastCreatedDoc.time}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push(lastCreatedDoc.type === 'Quotation' ? '/office/quotes' : '/office/invoices')}
                    className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                  >
                    View in Manager <ExternalLink size={10} />
                  </button>
                </div>
              )}

               {/* Tool Call Pill Buttons */}
              {toolCall && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="flex justify-start pl-2"
                >
                  {toolCall.name === 'stageEmailForConfirmation' ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={confirmPendingAction}
                        disabled={isSendingEmail}
                        className="group flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl border border-orange-400 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl disabled:opacity-50"
                      >
                        {isSendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Confirm Send
                      </button>
                      <button 
                        onClick={cancelPendingConfirmation}
                        disabled={isSendingEmail}
                        className="group flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-6 py-3 rounded-xl border border-slate-700 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                ) : driveMode ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={confirmPendingAction}
                          className="group flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl border border-orange-400 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl"
                        >
                          <Check size={14} />
                          {getToolLabel(toolCall.name)} (Tap to Confirm)
                        </button>
                        <button
                          onClick={cancelPendingConfirmation}
                          className="group flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-6 py-3 rounded-xl border border-slate-700 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                        Or say &quot;Yes&quot; to proceed, &quot;No&quot; to cancel
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={confirmPendingAction}
                        className="group flex items-center gap-3 bg-white/10 hover:bg-orange-500 text-white px-6 py-3 rounded-xl border border-white/10 hover:border-orange-400 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md"
                      >
                        {getToolLabel(toolCall.name)}
                      </button>
                      <button
                        onClick={cancelPendingConfirmation}
                        className="group flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-6 py-3 rounded-xl border border-slate-700 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#0B0F19] border-t border-slate-800 relative safe-bottom">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Voice pause</span>
                {VOICE_PAUSE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setVoicePauseMs(option.value)}
                    className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                      voicePauseMs === option.value
                        ? 'border-orange-400 bg-orange-500/15 text-orange-300'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  Current pause {Math.round(voicePauseMs / 100) / 10}s
                </span>
              </div>

              <AnimatePresence>
                {(isRecording || isTranscribing || isTtsActive) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute -top-10 left-4 flex items-center gap-2 bg-[#0B0F19]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800"
                  >
                    <span className={`w-2 h-2 rounded-full ${isTtsActive ? 'bg-orange-400 animate-pulse' : isTranscribing ? 'bg-blue-500 animate-spin' : 'bg-orange-500 animate-pulse'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                      {isTtsActive ? 'Speaking... tap mic or speaker to interrupt' : isTranscribing ? 'Transcribing...' : 'Listening...'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                {isSupported ? (
                  <motion.button 
                    onClick={toggleRecording}
                    aria-label={isRecording ? "Stop Recording" : "Start Voice Input"}
                    animate={hasError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                    className={`p-4 md:p-3 rounded-xl transition-all shadow-lg w-16 h-16 md:w-12 md:h-12 flex items-center justify-center overflow-hidden relative ${
                      isRecording 
                        ? 'bg-orange-500 text-white shadow-orange-500/40' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title={isRecording ? "Stop Recording" : "Voice Input"}
                  >
                    {isRecording && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute inset-0 bg-white/30 rounded-full"
                      />
                    )}
                    {isRecording ? <MicOff size={28} className="md:w-5 md:h-5" /> : <Mic size={28} className="md:w-5 md:h-5" />}
                  </motion.button>
                ) : (
                  <div 
                    className="w-16 h-16 md:w-12 md:h-12 bg-slate-900 border border-slate-800 text-slate-700 rounded-xl cursor-not-allowed group relative flex items-center justify-center"
                    aria-label="Voice input not supported"
                  >
                    <MicOff size={28} className="md:w-5 md:h-5" />
                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black text-[9px] uppercase font-bold tracking-widest text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      Voice input not supported on this browser. Please use Chrome.
                    </div>
                  </div>
                )}
                
                <div className="flex-1 relative">
                  <textarea 
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    aria-label="Message Input"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 transition-all rounded-xl px-4 py-3 text-[16px] md:text-sm text-white placeholder:text-slate-600 outline-none resize-none max-h-32"
                  />
                </div>

                <button 
                  onClick={() => handleSend(false)}
                  aria-label="Send Message"
                  disabled={!inputText.trim()}
                  className="w-14 h-14 md:w-12 md:h-12 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center shrink-0"
                >
                  <Send size={24} className="md:w-5 md:h-5 ml-1" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <div className="relative group">
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div 
              initial={{ opacity: 0, x: 10, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-[#0B0F19] border border-orange-500/50 p-4 rounded-2xl shadow-2xl z-[110] w-[200px]"
            >
              <div className="flex gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shrink-0">
                  <Sparkles size={16} />
                </div>
                <p className="text-[11px] font-black text-white uppercase tracking-wider leading-tight">New — Meet your AI Assistant</p>
              </div>
              <p className="text-[10px] text-slate-400 mb-3 font-medium">Create quotes, invoices and emails hands-free.</p>
              <button 
                onClick={() => { setShowTooltip(false); localStorage.setItem('touchteq_ai_tooltip_dismissed', 'true'); }}
                className="w-full py-2 bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
              >
                Get Started
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-y-[6px] border-y-transparent border-l-[6px] border-l-[#0B0F19]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread Indicator */}
        {!isOpen && unreadCount > 0 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 border-2 border-[#151B28] rounded-full flex items-center justify-center z-[105]"
          >
            <span className="text-[10px] text-white font-black">{unreadCount}</span>
          </motion.div>
        )}

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all relative z-[100] ${
            isOpen ? 'bg-[#0B0F19] text-white border border-slate-800' : 'bg-orange-500 text-white'
          }`}
        >
          {isOpen ? (
            <ChevronDown size={28} />
          ) : (
            <>
              {/* Pulse effect */}
              <div className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-25" />
              <Sparkles size={28} className="relative z-10" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

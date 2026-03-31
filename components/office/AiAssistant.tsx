'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useOfficeToast } from '@/components/office/OfficeToastContext';
import { useAiDraft, type AiDraftType } from '@/components/office/AiDraftContext';
import { useActiveDocument } from '@/components/office/ActiveDocumentContext';
import { createClient } from '@/lib/supabase/client';
import AiMorningBriefing from '@/components/office/AiMorningBriefing';
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
  ShieldAlert,
  Paperclip,
  Command,
  Plus,
  FileText,
  Mail,
  Package,
  SendHorizonal,
  Gauge,
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  Clock
} from 'lucide-react';

type ActionStatusType = "confirmed" | "attempted" | "could_not_verify" | "failed" | "need_info" | "unsupported";

interface ParsedActionStatus {
  action: string;
  targetType: string;
  targetReference: string;
  toolUsed: string;
  status: ActionStatusType;
  attempted: boolean;
  verified: boolean;
  summary: string;
  error: string | null;
  nextStep: string;
}

function extractActionStatus(text: string): ParsedActionStatus | null {
  try {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) return null;
    const parsed = JSON.parse(match[1]);
    if (parsed?.actionStatus && parsed.actionStatus.status) {
      return parsed.actionStatus as ParsedActionStatus;
    }
    if (parsed?.action && parsed?.status) {
      return parsed as ParsedActionStatus;
    }
  } catch {
    // Not JSON
  }
  return null;
}

function cleanActionText(text: string): string {
  return text.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
}

const STATUS_CONFIG: Record<ActionStatusType, { color: string; bg: string; border: string; icon: React.FC<any>; label: string }> = {
  confirmed: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: Check, label: 'Confirmed' },
  attempted: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Clock, label: 'Attempted' },
  could_not_verify: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Unverified' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, label: 'Failed' },
  need_info: { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: Info, label: 'Need Info' },
  unsupported: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: AlertCircle, label: 'Unsupported' },
};

function ActionStatusBadge({ actionStatus }: { actionStatus: ParsedActionStatus }) {
  const config = STATUS_CONFIG[actionStatus.status] || STATUS_CONFIG.attempted;
  const StatusIcon = config.icon;

  return (
    <div className={`mt-2 rounded-lg border ${config.border} ${config.bg} p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <StatusIcon size={12} className={config.color} />
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${config.color}`}>{config.label}</span>
        {actionStatus.targetReference && (
          <span className="text-[9px] font-bold text-slate-400 ml-auto">{actionStatus.targetReference}</span>
        )}
      </div>
      {actionStatus.summary && (
        <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{actionStatus.summary}</p>
      )}
      {actionStatus.error && (
        <p className="text-[11px] text-red-400 font-medium mt-1">{actionStatus.error}</p>
      )}
      {actionStatus.nextStep && actionStatus.status !== 'confirmed' && (
        <p className="text-[10px] text-slate-500 font-bold mt-1.5">{actionStatus.nextStep}</p>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  "Create a quotation",
  "Draft a follow-up email",
  "Create an invoice"
];

const SHORTCUT_ITEMS = [
  { icon: FileText, label: 'Create Invoice', command: '/invoice', starter: 'Create an invoice for ' },
  { icon: FileText, label: 'Create Quotation', command: '/quote', starter: 'Create a quotation for ' },
  { icon: Package, label: 'Create Purchase Order', command: '/po', starter: 'Create a purchase order for ' },
  { icon: FileText, label: 'Create Credit Note', command: '/creditnote', starter: 'Create a credit note for invoice ' },
  { icon: Mail, label: 'Draft Email', command: '/email', starter: 'Draft an email to ' },
  { icon: Car, label: 'Log a Trip', command: '/trip', starter: 'Log a trip to ' },
  { icon: Gauge, label: 'Log Fuel', command: '/fuel', starter: 'Log fuel purchase, ' },
  { icon: ShieldAlert, label: 'Generate Certificate', command: '/certificate', starter: 'Generate a commissioning certificate for ' },
] as const;

const QUICK_ACTIONS = [
  {
    title: 'Create Invoice',
    description: 'Generate a new tax invoice for a client',
    command: '/invoice',
    starter: 'Create an invoice for ',
    Icon: FileText,
  },
  {
    title: 'Create Quote',
    description: 'Draft a quotation with line items',
    command: '/quote',
    starter: 'Create a quotation for ',
    Icon: FileText,
  },
  {
    title: 'Draft Email',
    description: 'Compose a professional business email',
    command: '/email',
    starter: 'Draft an email to ',
    Icon: Mail,
  },
  {
    title: 'Purchase Order',
    description: 'Raise a PO for equipment or services',
    command: '/po',
    starter: 'Create a purchase order for ',
    Icon: Package,
  },
] as const;

const SHORTCUT_STARTERS: Record<string, string> = {
  '/invoice': 'Create an invoice for ',
  '/quote': 'Create a quotation for ',
  '/po': 'Create a purchase order for ',
  '/creditnote': 'Create a credit note for invoice ',
  '/email': 'Draft an email to ',
  '/trip': 'Log a trip to ',
  '/fuel': 'Log fuel purchase, ',
  '/certificate': 'Generate a commissioning certificate for ',
};

const VOICE_PAUSE_MS = 3500;
const VOICE_SESSION_TIMEOUT_MS = 20000;
const HANDS_FREE_IDLE_TIMEOUT_MS = 10000;
const VOICE_PAUSE_OPTIONS = [
  { label: '2.5 sec', value: 2500 },
  { label: '3.5 sec', value: 3500 },
  { label: '5 sec', value: 5000 },
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
  'ai-assistant': '/office/ai-assistant',
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
  attachments?: AttachmentSummary[];
}

let messageIdCounter = 0;

function createMessageId(prefix = 'msg') {
  messageIdCounter += 1;
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${messageIdCounter}-${randomPart}`;
}

function createWelcomeMessage(): Message {
  return {
    id: createMessageId('welcome'),
    text: "Hi! I can help you create quotes, invoices, and emails. What do you need?",
    sender: 'assistant',
    timestamp: new Date(),
  };
}

type AttachmentSummary = {
  name: string;
  type: string;
  size: number;
};

type PendingAttachment = AttachmentSummary & {
  dataUrl: string;
};

type AiAssistantProps = {
  mode?: 'floating' | 'page';
};

type CachedBusinessProfile = {
  business_name?: string;
  vat_number?: string;
  address?: string;
  email?: string;
} | null;

type CachedClient = {
  id?: string;
  company_name?: string;
  email?: string;
  phone?: string;
};

type CachedAiMemory = {
  category: string;
  key: string;
  value: string;
};

type AssistantSessionCache = {
  businessProfile: CachedBusinessProfile;
  clients: CachedClient[];
  aiMemory: CachedAiMemory[];
};

type AssistantLanguagePreference = 'south_african_english' | 'british_english';

type AssistantRuntimeSettings = {
  requireConfirmationBeforeSend: boolean;
  conciseResponses: boolean;
  languagePreference: AssistantLanguagePreference;
  alwaysIncludeVatInvoice: boolean;
  alwaysIncludeVatQuote: boolean;
  personalEmailSignature: string;
  accountsEmailSignature: string;
  handsFreeMode: boolean;
};

const DEFAULT_PERSONAL_SIGNATURE = `Kind regards,
Thabo Matona | Pr Tech Eng (Elec)
Founder & Principal Engineer
Touch Teqniques Engineering Services
T: +27 72 552 2110
E: sales@touchteq.co.za
W: www.touchteq.co.za
SAQCC Fire Reg: DGS15/0130 | B-BBEE Level 1`;

const DEFAULT_ACCOUNTS_SIGNATURE = `Kind regards,
Touch Teq Accounts
Touch Teqniques Engineering Services
T: +27 72 552 2110
E: accounts@touchteq.co.za
W: www.touchteq.co.za`;
const DEFAULT_ASSISTANT_SETTINGS: AssistantRuntimeSettings = {
  requireConfirmationBeforeSend: true,
  conciseResponses: true,
  languagePreference: 'south_african_english',
  alwaysIncludeVatInvoice: true,
  alwaysIncludeVatQuote: true,
  personalEmailSignature: DEFAULT_PERSONAL_SIGNATURE,
  accountsEmailSignature: DEFAULT_ACCOUNTS_SIGNATURE,
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
    alwaysIncludeVatInvoice: documentSettings?.invoice_always_include_vat !== false,
    alwaysIncludeVatQuote: documentSettings?.quote_always_include_vat !== false,
    personalEmailSignature: emailSettings?.personal_email_signature || DEFAULT_PERSONAL_SIGNATURE,
    accountsEmailSignature: emailSettings?.accounts_email_signature || DEFAULT_ACCOUNTS_SIGNATURE,
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

function getGreetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) return { text: 'Good morning, Thabo. What are we working on today?', isTwoLine: false };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon, Thabo. Ready to get things done?', isTwoLine: false };
  if (hour >= 17 && hour < 21) return { text: "Good evening, Thabo.<br/>Let's wrap up the day.", isTwoLine: true };
  return { text: "Working late, Thabo.<br/>I'm here to help.", isTwoLine: true };
}

function formatAttachmentSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
  return `${Math.round(size / 104857.6) / 10} MB`;
}

function compactMessageSnippet(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 140);
}

function buildCompressedHistory(history: Message[]) {
  if (history.length <= 10) {
    return history.map((message) => ({ sender: message.sender, text: message.text }));
  }

  const recentMessages = history.slice(-4);
  const olderMessages = history.slice(0, -4);
  const userTopics = olderMessages
    .filter((message) => message.sender === 'user')
    .slice(-3)
    .map((message) => compactMessageSnippet(message.text));
  const assistantOutcomes = olderMessages
    .filter((message) => message.sender === 'assistant')
    .slice(-2)
    .map((message) => compactMessageSnippet(message.text));
  const attachmentMention = olderMessages.some((message) => (message.attachments?.length || 0) > 0)
    ? 'Files were attached earlier for context.'
    : '';

  const summaryParts = [
    userTopics.length > 0 ? `Earlier requests focused on ${userTopics.join('; ')}.` : '',
    assistantOutcomes.length > 0 ? `Assistant progress so far: ${assistantOutcomes.join('; ')}.` : '',
    attachmentMention,
  ].filter(Boolean);

  return [
    {
      sender: 'user' as const,
      text: `Conversation summary: ${summaryParts.slice(0, 3).join(' ')}`,
    },
    ...recentMessages.map((message) => ({ sender: message.sender, text: message.text })),
  ];
}

function selectRelevantClients(clients: CachedClient[], query: string) {
  const normalizedQuery = query.toLowerCase();
  const ranked = clients
    .map((client) => {
      const haystack = `${client.company_name || ''} ${client.email || ''} ${client.phone || ''}`.toLowerCase();
      let score = 0;
      if (client.company_name && normalizedQuery.includes(client.company_name.toLowerCase())) score += 4;
      if (client.email && normalizedQuery.includes(client.email.toLowerCase())) score += 3;
      if (client.phone && normalizedQuery.includes(client.phone.toLowerCase())) score += 2;
      if (haystack && normalizedQuery.split(/\s+/).some((token) => token.length > 2 && haystack.includes(token))) score += 1;
      return { client, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((entry) => entry.client);

  return ranked.length > 0 ? ranked : clients.slice(0, 5);
}

export default function AiAssistant({ mode = 'floating' }: AiAssistantProps) {
  const isPageMode = mode === 'page';
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

  const [isOpen, setIsOpen] = useState(isPageMode);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [inputText, setInputText] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Close shortcuts menu when clicking outside
  const shortcutsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showShortcuts) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (shortcutsRef.current && !shortcutsRef.current.contains(event.target as Node)) {
        setShowShortcuts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShortcuts]);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [messages, setMessages] = useState<Message[]>([createWelcomeMessage()]);
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
  const [sessionCache, setSessionCache] = useState<AssistantSessionCache>({
    businessProfile: null,
    clients: [],
    aiMemory: [],
  });
  const [sessionCacheStatus, setSessionCacheStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceModeStatus, setVoiceModeStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [voiceModePaused, setVoiceModePaused] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; data: any } | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestTranscriptRef = useRef('');
  const committedTranscriptRef = useRef('');
  const isNearBottomRef = useRef(true);
  const shouldAutoSendTranscriptRef = useRef(false);
  const manualStopRef = useRef(false);
  const autoActivatedRef = useRef(false);
  const suppressAutoRestartRef = useRef(false);
  const speechNetworkErrorCountRef = useRef(0);
  const speechRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        const restoredMessages = history.slice(-10).map((m: any) => ({
          ...m,
          id: createMessageId(m.sender || 'restored'),
          timestamp: new Date(m.timestamp),
        }));
        setMessages(restoredMessages.length > 0 ? restoredMessages : [createWelcomeMessage()]);
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

  const loadSessionCache = useCallback(async () => {
    if (!isPageMode) return;

    setSessionCacheStatus('loading');
    try {
      const response = await fetch('/api/office/assistant-context', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load assistant context');
      }

      const payload = await response.json();
      setSessionCache({
        businessProfile: payload.businessProfile || null,
        clients: payload.clients || [],
        aiMemory: payload.aiMemory || [],
      });
      setSessionCacheStatus('ready');
    } catch (error) {
      console.error('Failed to load assistant session context', error);
      setSessionCacheStatus('error');
    }
  }, [isPageMode]);

  useEffect(() => {
    void loadSessionCache();
  }, [loadSessionCache]);

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
      if (speechRestartTimeoutRef.current) clearTimeout(speechRestartTimeoutRef.current);
      if (activeAudio) {
        activeAudio.pause();
        if (audioRef.current === activeAudio) {
          audioRef.current = null;
        }
      }
    };
  }, []);
  useEffect(() => {
    if (isPageMode) {
      setIsOpen(true);
    }
  }, [isPageMode]);

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
      setMessages([createWelcomeMessage()]);
      setToolCall(null);
      latestTranscriptRef.current = '';
      committedTranscriptRef.current = '';
      shouldAutoSendTranscriptRef.current = false;
      setAttachments([]);
      setShowShortcuts(false);
    }
  }, [isOpen]);

  const appendAssistantMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId('assistant'),
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
      speechNetworkErrorCountRef.current = 0;
      if (speechRestartTimeoutRef.current) {
        clearTimeout(speechRestartTimeoutRef.current);
        speechRestartTimeoutRef.current = null;
      }
      setIsRecording(true);
      setHasError(false);
      startTimeout(autoActivatedRef.current ? HANDS_FREE_IDLE_TIMEOUT_MS : VOICE_SESSION_TIMEOUT_MS);
    };

    recognition.onresult = (event: any) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      
      // Reset idle timer in Voice Mode
      if (voiceMode && !voiceModePaused) {
        resetVoiceModeIdleTimer();
      }
      
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
      if (event.error === 'network') {
        speechNetworkErrorCountRef.current += 1;

        const canAutoRecover =
          (autoListenRef.current || driveModeRef.current || autoActivatedRef.current) &&
          isOpenRef.current &&
          !manualStopRef.current &&
          !suppressAutoRestartRef.current;

        if (canAutoRecover) {
          if (speechRestartTimeoutRef.current) {
            clearTimeout(speechRestartTimeoutRef.current);
          }

          const retryDelay = Math.min(1500, 300 * speechNetworkErrorCountRef.current);
          speechRestartTimeoutRef.current = setTimeout(() => {
            speechRestartTimeoutRef.current = null;
            try {
              startListening('hands-free');
            } catch {}
          }, retryDelay);

          if (speechNetworkErrorCountRef.current >= 3) {
            setHasError(true);
            setTimeout(() => setHasError(false), 500);
          }
        } else {
          setMessages(prev => [
            ...prev,
            {
              id: createMessageId('assistant'),
              text: "Voice input lost its network connection. Please try the mic again, or type your request below.",
              sender: 'assistant',
              timestamp: new Date(),
            },
          ]);
          setHasError(true);
          setTimeout(() => setHasError(false), 500);
        }
        return;
      }

      console.error('Speech Recognition Error:', event.error);
      if (event.error === 'not-allowed') {
        setMessages(prev => [...prev, {
          id: createMessageId('assistant'),
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

  const voiceModeIdleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetVoiceModeIdleTimer = useCallback(() => {
    if (voiceModeIdleTimeoutRef.current) clearTimeout(voiceModeIdleTimeoutRef.current);
    voiceModeIdleTimeoutRef.current = setTimeout(() => {
      if (voiceMode && !voiceModePaused) {
        setVoiceModePaused(true);
        setVoiceModeStatus('idle');
        if (isRecording) {
          manualStopRef.current = true;
          suppressAutoRestartRef.current = true;
          recognitionRef.current?.stop();
        }
      }
    }, 30000);
  }, [voiceMode, voiceModePaused, isRecording]);

  const toggleVoiceMode = useCallback(() => {
    if (voiceMode) {
      // Exit Voice Mode
      setVoiceMode(false);
      setVoiceModeStatus('idle');
      setVoiceModePaused(false);
      if (voiceModeIdleTimeoutRef.current) clearTimeout(voiceModeIdleTimeoutRef.current);
      manualStopRef.current = true;
      suppressAutoRestartRef.current = true;
      if (isRecording) {
        recognitionRef.current?.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current) {
          audioRef.current = null;
        }
      }
      setIsTtsActive(false);
    } else {
      // Enter Voice Mode
      setVoiceMode(true);
      setVoiceModePaused(false);
      setVoiceModeStatus('listening');
      setIsOpen(true);
      // Start listening after a short delay
      setTimeout(() => {
        try {
          startListening('hands-free');
          resetVoiceModeIdleTimer();
        } catch {}
      }, 300);
    }
  }, [voiceMode, isRecording, startListening, resetVoiceModeIdleTimer]);

  const resumeVoiceMode = useCallback(() => {
    setVoiceModePaused(false);
    setVoiceModeStatus('listening');
    setTimeout(() => {
      try {
        startListening('hands-free');
        resetVoiceModeIdleTimer();
      } catch {}
    }, 300);
  }, [startListening, resetVoiceModeIdleTimer]);

  // Voice Mode: Auto-restart listening after TTS finishes speaking
  useEffect(() => {
    if (!voiceMode || voiceModePaused) return;
    
    if (!isTtsActive && !isRecording) {
      const timer = setTimeout(() => {
        if (voiceMode && !voiceModePaused && !isRecording) {
          setVoiceModeStatus('listening');
          try {
            startListening('hands-free');
            resetVoiceModeIdleTimer();
          } catch {}
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTtsActive, voiceMode, voiceModePaused, isRecording, startListening, resetVoiceModeIdleTimer]);

  // Voice Mode: Update status based on recording/TTS state
  useEffect(() => {
    if (!voiceMode) return;
    if (isTtsActive) {
      setVoiceModeStatus('speaking');
    } else if (isRecording) {
      setVoiceModeStatus('listening');
    } else if (isTyping) {
      setVoiceModeStatus('thinking');
    } else if (!voiceModePaused) {
      setVoiceModeStatus('idle');
    }
  }, [isTtsActive, isRecording, isTyping, voiceMode, voiceModePaused]);

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

  const readAttachment = useCallback((file: File) => new Promise<PendingAttachment>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error(`Could not read ${file.name}.`));
        return;
      }
      resolve({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: result,
      });
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  }), []);

  const handleAttachmentSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(event.target.files || []);
    if (!fileList.length) {
      return;
    }

    const supportedFiles = fileList.filter((file) => file.type.startsWith('image/') || file.type === 'application/pdf');
    if (supportedFiles.length !== fileList.length) {
      toast.error({
        title: 'Unsupported file',
        message: 'Please attach a PDF or image file.',
      });
    }

    try {
      const nextFiles = await Promise.all(supportedFiles.map(readAttachment));
      setAttachments((prev) => [...prev, ...nextFiles].slice(0, 4));
      inputRef.current?.focus();
    } catch (error: any) {
      toast.error({
        title: 'Attachment failed',
        message: error?.message || 'The file could not be attached.',
      });
    } finally {
      event.target.value = '';
    }
  }, [readAttachment, toast]);

  const removeAttachment = useCallback((name: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name));
  }, []);

  const handleSend = useCallback(async (fromVoice = false, textOverride?: string) => {
    const userText = (textOverride ?? inputText).trim();
    if (!userText) return;
    setWasLastInputVoice(fromVoice);
    const outgoingAttachments = attachments;

    const userMsg: Message = {
      id: createMessageId('user'),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
      attachments: outgoingAttachments.map(({ name, type, size }) => ({ name, type, size })),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAttachments([]);
    setShowShortcuts(false);
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
    const assistantId = createMessageId('assistant');
    const timeoutId = setTimeout(() => {
      abortController.abort(new DOMException('Request timed out', 'AbortError'));
    }, 45000);

    try {
      const requestHistory = buildCompressedHistory(messages);
      const relevantClients = selectRelevantClients(sessionCache.clients, userText);

      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          text: '',
          sender: 'assistant',
          timestamp: new Date(),
        },
      ]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            history: requestHistory,
            message: userText,
            attachments: outgoingAttachments.map(({ name, type, dataUrl, size }) => ({
              name,
              type,
              size,
              dataUrl,
            })),
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
              alwaysIncludeVatInvoice: assistantSettings.alwaysIncludeVatInvoice,
              alwaysIncludeVatQuote: assistantSettings.alwaysIncludeVatQuote,
            },
            sessionContext: {
              businessProfile: sessionCache.businessProfile,
              clients: relevantClients,
              aiMemory: sessionCache.aiMemory,
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

      if (!response.body) {
        throw new Error('Streaming response body was empty.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalPayload: any = null;
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          const event = JSON.parse(line);
          if (event.type === 'start') {
            setIsStreamingResponse(true);
          }

          if (event.type === 'delta') {
            accumulatedText += event.text || '';
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, text: accumulatedText }
                  : message
              )
            );
          }

          if (event.type === 'done') {
            finalPayload = event;
          }

          if (event.type === 'error') {
            throw new Error(event.error || 'Streaming failed');
          }
        }
      }

      if (!finalPayload) {
        throw new Error('No final payload received from assistant stream.');
      }

      const assistantText = finalPayload.text || accumulatedText;
      const audioBase64 = finalPayload.audio || finalPayload.audioBase64 || '';
      const audioMimeType = finalPayload.audioMimeType || finalPayload.mimeType || 'audio/mp3';
      const toolCall = finalPayload.toolCall || null;

      setIsTyping(false);
      setIsStreamingResponse(false);
      if (thinkingRef.current) clearTimeout(thinkingRef.current);
      setThinkingTime(false);

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text:
                  assistantText ||
                  (toolCall
                    ? `I triggered ${toolCall.name}, but I didn't receive a readable summary back.`
                    : "I finished processing that, but I didn't receive a readable response back."),
              }
            : message
        )
      );

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
            id: createMessageId('assistant'),
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
        setIsStreamingResponse(false);
        if (thinkingRef.current) clearTimeout(thinkingRef.current);
        setThinkingTime(false);
        return;
      }
      console.error(err);
      setIsTyping(false);
      setIsStreamingResponse(false);
      setMessages((prev) => prev.filter((message) => !(message.id === assistantId && !message.text.trim())));
      if (thinkingRef.current) clearTimeout(thinkingRef.current);
      setThinkingTime(false);
      setFailCount(prev => prev + 1);
      
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          id: createMessageId('error'),
          text: failCount >= 1 
            ? "The AI seems to be having trouble. Check your internet connection or try again in a moment."
            : "Something went wrong on my end. Please try again.",
          sender: 'assistant',
          timestamp: new Date()
        }]);
      }
    } finally {
      clearTimeout(timeoutId);
      if (thinkingRef.current) clearTimeout(thinkingRef.current);
      setThinkingTime(false);
    }
  }, [activeDocumentData, activeDocumentId, activeDocumentIsOpen, activeDocumentType, assistantSettings, attachments, driveMode, failCount, handleLocalAssistantIntent, inputText, isTtsEnabled, messages, playAudio, sessionCache, startListening, toast, wasLastInputVoice]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success({ title: "Copied", message: "Message copied to clipboard" });
  };

  const clearChat = () => {
    if (!isPageMode && !confirm("Clear conversation history?")) {
      return;
    }

    setMessages([createWelcomeMessage()]);
    setToolCall(null);
    setAttachments([]);
    setInputText('');
    latestTranscriptRef.current = '';
    committedTranscriptRef.current = '';
    shouldAutoSendTranscriptRef.current = false;
    sessionStorage.removeItem('touchteq_ai_history');
    if (isPageMode) {
      void loadSessionCache();
    }
    window.setTimeout(() => inputRef.current?.focus(), 20);
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
      const settings = assistantSettingsRef.current;
      const senderEmail = String(args.senderEmail || '').toLowerCase();
      const signature = senderEmail.includes('accounts') 
        ? settings.accountsEmailSignature.trim()
        : settings.personalEmailSignature.trim();
      const existingBody = String(args.body || '').trim();
      if (signature && !existingBody.includes(signature)) {
        args.body = existingBody ? `${existingBody}\n\n${signature}` : signature;
      }
    }
    
    // Server-side tools — these execute in the API route and return text.
    // If a tool call somehow reaches the client, just ignore it.
    const SERVER_SIDE_TOOL_NAMES = ['logTrip', 'queryBusinessData', 'createClient', 'logExpense', 'recordPayment', 'draftQuote', 'draftInvoice', 'logFuelPurchase'];
    if (SERVER_SIDE_TOOL_NAMES.includes(toolToUse.name)) {
      appendAssistantMessage(`I started ${toolToUse.name}, but the server did not return a client action for me to complete here.`);
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
  }, [appendAssistantMessage, autoListen, isOpen, isRecording, pendingAction, router, setAiDraft, toast, toggleRecording, toolCall, wasLastInputVoice]);

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
        id: createMessageId('assistant'),
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

const triggerShortcut = (command: string, starter?: string) => {
    const text = starter || SHORTCUT_STARTERS[command] || command;
    setInputText(text);
    setShowShortcuts(false);
    window.setTimeout(() => {
      inputRef.current?.focus();
      // Place cursor at the end of the text
      if (inputRef.current) {
        inputRef.current.setSelectionRange(text.length, text.length);
      }
    }, 10);
  };

  const hasConversationStarted = messages.some((message) => message.sender === 'user');
  const showHero = isPageMode && !hasConversationStarted;
  const currentGreeting = getGreetingForHour(new Date().getHours());
  const orbIsProcessing = isTyping || thinkingTime || isStreamingResponse;
  const orbIsActive = isRecording || isTranscribing;

  const toggleDriveMode = () => {
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
  };

  const renderOrb = (size: 'large' | 'small') => {
    const dimensions = size === 'large' ? 'h-36 w-36 md:h-44 md:w-44' : 'h-14 w-14';

    return (
      <motion.div
        animate={
          orbIsActive
            ? { scale: [1, 1.08, 1], opacity: [0.95, 1, 0.95] }
            : orbIsProcessing
              ? { scale: [1, 1.04, 1], opacity: [0.95, 1, 0.95] }
              : { scale: [1, 1.02, 1], opacity: [0.92, 1, 0.92] }
        }
        transition={{
          duration: orbIsActive ? 1.1 : orbIsProcessing ? 1.8 : 3.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`relative ${dimensions}`}
      >
        <div className="absolute inset-[-30%] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.38),rgba(249,115,22,0.08)_45%,transparent_72%)] blur-2xl" />
        {orbIsActive && <div className="absolute inset-[-18%] rounded-full border border-orange-300/40 animate-ping" />}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,243,228,0.9),rgba(251,146,60,0.92)_24%,rgba(234,88,12,0.92)_55%,rgba(124,45,18,0.95)_100%)] shadow-[0_0_40px_rgba(249,115,22,0.35),inset_0_6px_24px_rgba(255,255,255,0.3),inset_0_-20px_30px_rgba(124,45,18,0.75)]" />
        <div className="absolute inset-[16%] rounded-full border border-white/15 bg-white/5 backdrop-blur-sm" />
        <div className="absolute left-[24%] top-[20%] h-[22%] w-[22%] rounded-full bg-white/60 blur-md" />
      </motion.div>
    );
  };

  const renderToolActions = () =>
    toolCall ? (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-start">
        {toolCall.name === 'stageEmailForConfirmation' ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={confirmPendingAction}
              disabled={isSendingEmail}
              className="group flex items-center gap-3 rounded-xl border border-orange-400 bg-orange-500 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all disabled:opacity-50"
            >
              {isSendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Confirm Send
            </button>
            <button
              onClick={cancelPendingConfirmation}
              disabled={isSendingEmail}
              className="group flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 transition-all disabled:opacity-50 hover:bg-slate-700 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : driveMode ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={confirmPendingAction}
                className="group flex items-center gap-3 rounded-xl border border-orange-400 bg-orange-500 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all"
              >
                <Check size={14} />
                {getToolLabel(toolCall.name)} (Tap to Confirm)
              </button>
              <button
                onClick={cancelPendingConfirmation}
                className="group flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </button>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Or say &quot;Yes&quot; to proceed, &quot;No&quot; to cancel
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={confirmPendingAction}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl backdrop-blur-md transition-all hover:border-orange-400 hover:bg-orange-500"
            >
              {getToolLabel(toolCall.name)}
            </button>
            <button
              onClick={cancelPendingConfirmation}
              className="group flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}
      </motion.div>
    ) : null;

  const renderMessageList = (className: string) => (
    <div
      ref={scrollRef}
      onScroll={() => {
        const el = scrollRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        isNearBottomRef.current = distanceFromBottom < 80;
      }}
      className={className}
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

      {messages.map((msg) => {
        const actionStatus = msg.sender === 'assistant' ? extractActionStatus(msg.text) : null;
        const cleanText = actionStatus ? cleanActionText(msg.text) : msg.text;

        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div className="flex max-w-[88%] flex-col gap-2">
              <div
                className={`relative rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-lg ${
                  msg.sender === 'user'
                    ? 'rounded-br-none bg-orange-500 text-white'
                    : 'rounded-bl-none border border-slate-800 bg-[#151B28] text-white'
                }`}
                aria-live={msg.sender === 'assistant' ? 'polite' : undefined}
              >
                <p>{cleanText || msg.text}</p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.attachments.map((file) => (
                      <span
                        key={`${msg.id}-${file.name}`}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                          msg.sender === 'user'
                            ? 'border-white/20 bg-white/10 text-orange-50'
                            : 'border-orange-500/20 bg-orange-500/10 text-orange-300'
                        }`}
                      >
                        <Paperclip size={10} />
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}
                {actionStatus && <ActionStatusBadge actionStatus={actionStatus} />}
              </div>
            </div>
          </motion.div>
        );
      })}

      {isTyping && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
          <div className="flex w-fit gap-1 rounded-2xl rounded-bl-none border border-slate-800 bg-[#0B0F19] px-4 py-3">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-500" />
          </div>
          {thinkingTime && (
            <span className="ml-2 animate-pulse text-[10px] font-black uppercase tracking-widest text-slate-500">Still thinking...</span>
          )}
        </motion.div>
      )}

      {renderToolActions()}
    </div>
  );

  const renderInputArea = () => (
    <div className="relative mx-auto w-full max-w-4xl">
<AnimatePresence>
        {showShortcuts && (
          <motion.div
            ref={shortcutsRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="-top-[19rem] md:-top-[16.5rem] absolute left-0 right-0 z-20 rounded-3xl border border-white/10 bg-[#06080f]/95 p-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="grid gap-1">
              {SHORTCUT_ITEMS.map((item) => (
<button
                  key={item.command}
                  type="button"
                  onClick={() => triggerShortcut(item.command, item.starter)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white">
                    <item.icon size={18} className="text-slate-400 hover:text-white" />
                    {item.label}
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">{item.command}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,26,38,0.94),rgba(12,16,24,0.96))] px-5 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl md:px-6 md:py-6">
        {/* Animated border - appears on left, disappears on right */}
        <div className="absolute inset-0 rounded-[28px] border-2 border-transparent pointer-events-none [-inset:1px] [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
          <motion.div
            className="absolute aspect-square bg-gradient-to-r from-transparent via-orange-500 to-transparent pointer-events-none"
            style={{
              width: 150,
              offsetPath: `rect(0 auto auto 0 round 28px)`,
            }}
            animate={{
              offsetDistance: ['0%', '100%'],
              opacity: [0, 1, 1, 0, 0],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 6.5,
              ease: 'linear',
              times: [0, 0.02, 0.25, 0.45, 1],
            }}
          />
        </div>

        <div className="flex flex-col gap-4">
          {/* Text area fills full width */}
          <div>
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((file) => (
                  <button
                    key={file.name}
                    type="button"
                    onClick={() => removeAttachment(file.name)}
                    className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-orange-200"
                  >
                    <Paperclip size={10} />
                    {file.name}
                    <span className="text-orange-300/70">{formatAttachmentSize(file.size)}</span>
                    <X size={10} />
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={inputRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a command, ask a question, or use your voice"
              aria-label="Message Input"
              className="min-h-[104px] w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-base text-white outline-none transition-all placeholder:text-base placeholder:text-slate-500"
            />
          </div>

          {/* Bottom row: Attach + Menu on left, Voice pause + mic + send on right */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:border-orange-400/60 hover:bg-orange-500/10 hover:text-white"
                aria-label="Attach a file"
              >
                <Paperclip size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowShortcuts((prev) => !prev)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                  showShortcuts
                    ? 'border-orange-400/60 bg-orange-500/12 text-orange-200'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-orange-400/60 hover:bg-orange-500/10 hover:text-white'
                }`}
                aria-label="Open shortcuts"
              >
                <Command size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mr-1">Voice pause</span>
              {VOICE_PAUSE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setVoicePauseMs(option.value)}
                  className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] transition-all ${
                    voicePauseMs === option.value
                      ? 'bg-orange-500/15 text-orange-300'
                      : 'bg-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              <motion.button
                onClick={toggleRecording}
                aria-label={isRecording ? 'Stop Recording' : 'Start Voice Input'}
                animate={hasError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl transition-all ${
                  isRecording
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40'
                    : 'border border-white/10 bg-white/5 text-slate-300 hover:border-orange-400/60 hover:bg-orange-500/10 hover:text-white'
                }`}
                title={isRecording ? 'Stop Recording' : 'Voice Input'}
              >
                {isRecording && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute inset-0 rounded-full bg-white/30"
                  />
                )}
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </motion.button>
              <button
                onClick={() => handleSend(false)}
                aria-label="Send Message"
                disabled={!inputText.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SendHorizonal size={16} className="rotate-[-60deg]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        multiple
        className="hidden"
        onChange={handleAttachmentSelect}
      />
    </div>
  );

  if (isPageMode) {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0B0F19] lg:-m-8">
        {/* Voice Mode Overlay */}
        <AnimatePresence>
          {voiceMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-[#0B0F19] flex flex-col items-center justify-center"
              onClick={voiceModePaused ? resumeVoiceMode : undefined}
            >
              {/* Background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(249,115,22,0.12),transparent_50%)]" />
              
              {/* Orb */}
              <div className="relative z-10 flex flex-col items-center">
                <motion.div
                  animate={
                    voiceModeStatus === 'listening'
                      ? { scale: [1, 1.05, 1], boxShadow: ['0 0 30px rgba(249,115,22,0.3)', '0 0 50px rgba(249,115,22,0.5)', '0 0 30px rgba(249,115,22,0.3)'] }
                      : voiceModeStatus === 'speaking'
                      ? { scale: [1, 1.08, 1] }
                      : voiceModeStatus === 'thinking'
                      ? { scale: [1, 1.03, 1], rotate: [0, 5, -5, 0] }
                      : { scale: 1, opacity: voiceModePaused ? 0.4 : 0.6 }
                  }
                  transition={{ repeat: Infinity, duration: voiceModeStatus === 'thinking' ? 2 : 1.5, ease: 'easeInOut' }}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30"
                >
                  <Sparkles size={48} className="text-white md:w-14 md:h-14" />
                </motion.div>

                {/* Status text */}
                <motion.p
                  key={voiceModeStatus + (voiceModePaused ? '-paused' : '')}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-slate-400"
                >
                  {voiceModePaused ? 'Tap anywhere to resume' : voiceModeStatus === 'listening' ? 'Listening...' : voiceModeStatus === 'thinking' ? 'Thinking...' : voiceModeStatus === 'speaking' ? 'Speaking...' : 'Idle'}
                </motion.p>

                {/* Paused hint */}
                {voiceModePaused && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600"
                  >
                    Paused after 30s of inactivity
                  </motion.p>
                )}
              </div>

              {/* End Voice Mode button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVoiceMode();
                }}
                className="absolute bottom-12 md:bottom-16 flex items-center gap-3 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 px-8 py-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-[0.2em]"
              >
                <MicOff size={18} />
                End Voice Mode
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden px-6 py-8 md:px-10 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(249,115,22,0.16),transparent_35%),radial-gradient(circle_at_50%_55%,rgba(249,115,22,0.08),transparent_45%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.18),transparent_60%)] blur-3xl" />

          <div className="relative z-10 flex min-h-[calc(100vh-6rem)] flex-col">
            <div className="mb-6 flex items-center justify-between gap-4">
              {!showHero ? (
                <div className="flex items-center gap-4">
                  {renderOrb('small')}
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">Touch Teq AI Assistant</p>
                    <p className="text-sm text-slate-400">Powered by Gemini with document and voice context</p>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Touch Teq AI Assistant</div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={toggleVoiceMode} className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${voiceMode ? 'border-orange-400 bg-orange-500/20 text-orange-200' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>Voice Mode</button>
                <button type="button" onClick={toggleDriveMode} className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${driveMode ? 'border-green-500/30 bg-green-500/12 text-green-300' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>Car Mode</button>
                <button type="button" onClick={toggleAutoListen} className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${autoListen ? 'border-sky-500/30 bg-sky-500/12 text-sky-200' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>Hands-Free</button>
                <button type="button" onClick={() => void loadSessionCache()} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition-all hover:text-white">
                  {sessionCacheStatus === 'loading' ? 'Refreshing...' : 'Refresh Context'}
                </button>
                <button type="button" onClick={() => router.push('/office/settings?tab=assistant')} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition-all hover:text-white">AI Settings</button>
                <button type="button" onClick={clearChat} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all hover:border-orange-400/40 hover:bg-orange-500/10">New Conversation</button>
              </div>
            </div>

            <div className={`flex flex-1 flex-col ${showHero ? 'justify-center' : 'gap-6'}`}>
              <AnimatePresence mode="wait">
                {showHero ? (
                  <motion.div key="hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
                    <AiMorningBriefing />
                    <div className="mb-8">{renderOrb('large')}</div>
                    <h2 className={`max-w-3xl font-semibold tracking-tight text-white leading-tight ${currentGreeting.isTwoLine ? 'text-[40px] md:text-[48px]' : 'text-[40px] md:text-[43px]'}`}>
                      <span dangerouslySetInnerHTML={{ __html: currentGreeting.text }} />
                    </h2>
                    <p className="mt-4 text-base text-slate-400 md:text-lg">Type a command, ask a question, or use your voice</p>
                    <div className="mt-10 w-full">{renderInputArea()}</div>
<div className="mt-10 grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {QUICK_ACTIONS.map((action) => (
                        <button key={action.command} type="button" onClick={() => triggerShortcut(action.command, action.starter)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-orange-400/40 hover:bg-white/[0.05]">
                          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-300">
                            <action.Icon size={20} />
                          </div>
                          <h3 className="text-base font-semibold text-white">{action.title}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-slate-400">{action.description}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="conversation" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,16,24,0.72),rgba(12,16,24,0.46))]">
                      {renderMessageList('h-full overflow-y-auto space-y-4 p-5 md:p-6')}
                    </div>
                    <div className="mt-6">{renderInputArea()}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Voice Mode Overlay */}
      <AnimatePresence>
        {voiceMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0B0F19] flex flex-col items-center justify-center"
            onClick={voiceModePaused ? resumeVoiceMode : undefined}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(249,115,22,0.12),transparent_50%)]" />
            
            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                animate={
                  voiceModeStatus === 'listening'
                    ? { scale: [1, 1.05, 1], boxShadow: ['0 0 30px rgba(249,115,22,0.3)', '0 0 50px rgba(249,115,22,0.5)', '0 0 30px rgba(249,115,22,0.3)'] }
                    : voiceModeStatus === 'speaking'
                    ? { scale: [1, 1.08, 1] }
                    : voiceModeStatus === 'thinking'
                    ? { scale: [1, 1.03, 1], rotate: [0, 5, -5, 0] }
                    : { scale: 1, opacity: voiceModePaused ? 0.4 : 0.6 }
                }
                transition={{ repeat: Infinity, duration: voiceModeStatus === 'thinking' ? 2 : 1.5, ease: 'easeInOut' }}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30"
              >
                <Sparkles size={48} className="text-white md:w-14 md:h-14" />
              </motion.div>

              <motion.p
                key={voiceModeStatus + (voiceModePaused ? '-paused' : '')}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-slate-400"
              >
                {voiceModePaused ? 'Tap anywhere to resume' : voiceModeStatus === 'listening' ? 'Listening...' : voiceModeStatus === 'thinking' ? 'Thinking...' : voiceModeStatus === 'speaking' ? 'Speaking...' : 'Idle'}
              </motion.p>

              {voiceModePaused && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600"
                >
                  Paused after 30s of inactivity
                </motion.p>
              )}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                toggleVoiceMode();
              }}
              className="absolute bottom-12 md:bottom-16 flex items-center gap-3 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 px-8 py-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-[0.2em]"
            >
              <MicOff size={18} />
              End Voice Mode
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

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
                {/* Voice Mode Toggle */}
                <button 
                  onClick={toggleVoiceMode}
                  className={`p-2 rounded-lg transition-all ${voiceMode ? 'text-orange-400 bg-orange-500/10' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                  aria-label="Toggle Voice Mode"
                  title={voiceMode ? "Voice Mode ON" : "Pure Voice Mode - Distraction-free"}
                >
                  <Radio size={18} />
                </button>
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

              <div className="flex flex-col gap-3">
                {/* Text area fills full width */}
                <textarea 
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  aria-label="Message Input"
                  className="w-full bg-transparent transition-all rounded-xl px-4 py-3 text-[16px] md:text-sm text-white placeholder:text-slate-600 outline-none resize-none max-h-32"
                />

                {/* Bottom row: Voice pause + buttons + mic + send */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mr-1">Voice pause</span>
                    {VOICE_PAUSE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setVoicePauseMs(option.value)}
                        className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] transition-all ${
                          voicePauseMs === option.value
                            ? 'bg-orange-500/15 text-orange-300'
                            : 'bg-transparent text-slate-400 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

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

                     <button 
                       onClick={() => handleSend(false)}
                       aria-label="Send Message"
                       disabled={!inputText.trim()}
                       className="w-14 h-14 md:w-12 md:h-12 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center shrink-0"
                     >
                       <Send size={28} className="md:w-5 md:h-5 ml-1 rotate-[-60deg]" />
                     </button>
                  </div>
                </div>
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

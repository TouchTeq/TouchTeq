'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { dispatchToolAck, dispatchSaveAck, dispatchStaleSessionEvent, dispatchSaveEvent, AI_TOOL_EVENT_NAMES, generateToolCallId, SaveEventResult } from '@/lib/office/ai-tool-ack';

export type ActiveDocumentType = 'invoice' | 'quote' | 'purchase_order' | 'credit_note';
export type ActiveDocumentFieldValue = string | number | boolean | null | undefined;
export type ActiveDocumentLineItem = Record<string, any>;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'partial_save';
export type DocumentEditMode = 'view' | 'edit' | 'create';

export interface ActiveDocumentData {
  [key: string]: any;
  lineItems?: ActiveDocumentLineItem[];
}

export interface ActiveDocumentSession {
  documentType: ActiveDocumentType | null;
  documentId: string | null;
  /** Human-readable reference like "QT-2026-042" or "INV-2026-007" */
  documentReference: string | null;
  documentData: ActiveDocumentData | null;
  isOpen: boolean;
  /** Whether the user is creating a new document or editing an existing one */
  mode: DocumentEditMode;
  /** Whether there are unsaved changes in the session */
  isDirty: boolean;
  /** When the document was last successfully persisted to the server */
  lastSavedAt: number | null;
  /** Result of the most recent save attempt */
  lastSaveStatus: SaveStatus;
  /** Error message from the last failed save, if any */
  lastSaveError: string | null;
  /** When the last AI tool acknowledgement was received */
  lastToolAckAt: number | null;
  /** Monotonic version counter — increments on every mutation */
  version: number;
  /** Line item count snapshot for quick reference */
  lineItemCount: number;
  /** Timestamp when the session was registered; stale detection uses this */
  registeredAt: number | null;
  /** Server document version/hash if available; for concurrency checks */
  serverVersion: string | null;
  /** Number of AI tool call acknowledgements received in this session */
  toolAckCount: number;
}

export interface RegisterDocumentSessionInput {
  documentType: ActiveDocumentType | null;
  documentId: string | null;
  documentReference?: string | null;
  documentData?: ActiveDocumentData | null;
  isOpen?: boolean;
  mode?: DocumentEditMode;
  serverVersion?: string | null;
}

export interface ActiveDocumentContextValue extends ActiveDocumentSession {
  registerDocumentSession: (session: RegisterDocumentSessionInput) => ActiveDocumentData | null;
  clearDocumentSession: () => void;
  updateField: (field: string, value: ActiveDocumentFieldValue) => ActiveDocumentData | null;
  addLineItem: (item?: ActiveDocumentLineItem) => ActiveDocumentData | null;
  removeLineItem: (index: number) => ActiveDocumentData | null;
  updateLineItem: (index: number, field: string, value: any) => ActiveDocumentData | null;
  /** Mark the document as having been saved successfully on the server */
  markSaved: () => void;
  /** Mark a save attempt as failed */
  markSaveError: (error: string) => void;
  /** Validate that the session still matches the provided id/type; returns false if stale */
  validateSession: (documentType: ActiveDocumentType | null, documentId: string | null) => boolean;
  /** Force-clear dirty state without persisting (user discarded changes) */
  discardChanges: () => void;
  /** Get a snapshot of the session state for AI tool verification */
  getSnapshot: () => ActiveDocumentSession;
  /** Set the document data from a server response (after save) */
  hydrateFromServer: (data: ActiveDocumentData) => void;
  /** Set session into 'saving' optimistic state */
  beginSave: () => void;
}

const STORAGE_KEY = 'touchteq_active_document_session';
/** How long a persisted session can sit without being refreshed before we consider it stale (7 days) */
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** If registeredAt is set and older than this, the session was not actively re-registered by the page */
const SESSION_FRESHNESS_MS = 30 * 60 * 1000;

const DEFAULT_SESSION: ActiveDocumentSession = {
  documentType: null,
  documentId: null,
  documentReference: null,
  documentData: null,
  isOpen: false,
  mode: 'view',
  isDirty: false,
  lastSavedAt: null,
  lastSaveStatus: 'idle',
  lastSaveError: null,
  lastToolAckAt: null,
  version: 0,
  lineItemCount: 0,
  registeredAt: null,
  serverVersion: null,
  toolAckCount: 0,
};

const ActiveDocumentContext = createContext<ActiveDocumentContextValue | undefined>(undefined);

function cloneLineItems(lineItems: ActiveDocumentLineItem[] | undefined) {
  return (lineItems || []).map((item) => ({ ...item }));
}

function normalizeDocumentData(data: ActiveDocumentData | null | undefined): ActiveDocumentData | null {
  if (!data) {
    return null;
  }

  return {
    ...data,
    lineItems: cloneLineItems(data.lineItems),
  };
}

function calculateLineItemCount(data: ActiveDocumentData | null | undefined): number {
  return Array.isArray(data?.lineItems) ? data.lineItems.length : 0;
}

function getLineItemTotal(item: ActiveDocumentLineItem) {
  const quantity = Number(item.quantity ?? 0);
  const unitPrice = Number(item.unitPrice ?? item.unit_price ?? 0);
  const total = Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : 0;
  return total;
}

function readStoredSession(): ActiveDocumentSession {
  if (typeof window === 'undefined') {
    return DEFAULT_SESSION;
  }

  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return DEFAULT_SESSION;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<ActiveDocumentSession>;
    // A session is stale if it was registered more than SESSION_FRESHNESS_MS ago
    // (meaning the page never re-registered it after reload)
    // OR if it's been sitting for more than SESSION_MAX_AGE_MS
    const ageSinceRegistration = parsed.registeredAt ? Date.now() - parsed.registeredAt : Number.MAX_SAFE_INTEGER;
    const ageSinceLastSave = parsed.lastSavedAt ? Date.now() - parsed.lastSavedAt : Number.MAX_SAFE_INTEGER;

    if (ageSinceRegistration > SESSION_FRESHNESS_MS || ageSinceLastSave > SESSION_MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      dispatchStaleSessionEvent('session_expired_on_restore');
      return DEFAULT_SESSION;
    }

    return {
      documentType: parsed.documentType ?? null,
      documentId: parsed.documentId ?? null,
      documentReference: parsed.documentReference ?? null,
      documentData: parsed.documentData ?? null,
      isOpen: Boolean(parsed.isOpen && parsed.documentType),
      mode: parsed.mode ?? 'edit',
      isDirty: Boolean(parsed.isDirty),
      lastSavedAt: parsed.lastSavedAt ?? null,
      lastSaveStatus: parsed.lastSaveStatus ?? 'idle',
      lastSaveError: parsed.lastSaveError ?? null,
      lastToolAckAt: parsed.lastToolAckAt ?? null,
      version: parsed.version ?? 0,
      lineItemCount: parsed.lineItemCount ?? 0,
      registeredAt: parsed.registeredAt ?? Date.now(),
      serverVersion: parsed.serverVersion ?? null,
      toolAckCount: parsed.toolAckCount ?? 0,
    };
  } catch (error) {
    console.error('[ActiveDocument] Failed to load active document session', error);
    sessionStorage.removeItem(STORAGE_KEY);
    return DEFAULT_SESSION;
  }
}

export function ActiveDocumentProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ActiveDocumentSession>(() => readStoredSession());
  const sessionRef = useRef<ActiveDocumentSession>(session);
  const toolAckCounterRef = useRef<Map<string, boolean>>(new Map());

  React.useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Persist session to sessionStorage whenever it changes meaningfully
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (session.isOpen && session.documentType) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const clearDocumentSession = useCallback(() => {
    setSession((prev) => ({
      ...DEFAULT_SESSION,
      // Preserve the registeredAt so we can track when the session was cleared
    }));
    dispatchStaleSessionEvent('session_cleared');
  }, []);

  const registerDocumentSession = useCallback((input: RegisterDocumentSessionInput) => {
    const nextDocumentData = normalizeDocumentData(input.documentData);
    const lineItemCount = calculateLineItemCount(nextDocumentData);
    const now = Date.now();

    setSession((prev) => {
      // If the document reference or id changed, the previous open doc was replaced.
      // If the old doc was dirty, we dispatch a stale event so the AI knows.
      if (prev.isOpen && prev.isDirty && (prev.documentId !== input.documentId || prev.documentType !== input.documentType)) {
        dispatchStaleSessionEvent('document_switched_with_unsaved_changes');
      } else if (prev.isOpen && (prev.documentId !== input.documentId || prev.documentType !== input.documentType)) {
        dispatchStaleSessionEvent('document_switched');
      }

      return {
        ...prev,
        documentType: input.documentType,
        documentId: input.documentId,
        documentReference: input.documentReference ?? prev.documentReference ?? null,
        documentData: nextDocumentData,
        isOpen: input.isOpen ?? true,
        mode: input.mode ?? (input.documentId ? 'edit' : 'create'),
        isDirty: false,
        lastSavedAt: prev.documentId === input.documentId ? prev.lastSavedAt : now,
        lastSaveStatus: prev.documentId === input.documentId ? prev.lastSaveStatus : 'idle',
        lastSaveError: null,
        lastToolAckAt: null,
        version: prev.documentId === input.documentId && prev.documentType === input.documentType ? prev.version : 0,
        lineItemCount,
        registeredAt: now,
        serverVersion: input.serverVersion ?? prev.serverVersion ?? null,
        toolAckCount: 0,
      };
    });

    return nextDocumentData;
  }, []);

  /** Internal helper: increment dirty state and version */
  const bumpMutation = useCallback((updater: (prev: ActiveDocumentData | null) => ActiveDocumentData | null) => {
    const prev = sessionRef.current;
    if (!prev.isOpen || !prev.documentType) {
      return prev.documentData;
    }

    setSession((ps) => ({
      ...ps,
      documentData: updater(ps.documentData),
      isDirty: true,
      lastSaveStatus: 'idle',
      lastSaveError: null,
      version: ps.version + 1,
    }));

    const newData = updater(sessionRef.current.documentData);
    return newData;
  }, []);

  const updateField = useCallback((field: string, value: ActiveDocumentFieldValue) => {
    return bumpMutation((prevData) => {
      const current = normalizeDocumentData(prevData);
      if (!current) return { [field]: value, lineItems: [] };
      return { ...current, [field]: value };
    });
  }, [bumpMutation]);

  const addLineItem = useCallback((item: ActiveDocumentLineItem = {}) => {
    return bumpMutation((prevData) => {
      const current = normalizeDocumentData(prevData) || {};
      const lineItems = cloneLineItems(current.lineItems);
      const nextItem = { ...item };
      if (typeof nextItem.total === 'undefined' && typeof nextItem.line_total === 'undefined') {
        const total = getLineItemTotal(nextItem);
        nextItem.total = total;
        nextItem.line_total = total;
      }
      lineItems.push(nextItem);
      return { ...current, lineItems };
    });
  }, [bumpMutation]);

  const removeLineItem = useCallback((index: number) => {
    return bumpMutation((prevData) => {
      const current = normalizeDocumentData(prevData) || {};
      const lineItems = cloneLineItems(current.lineItems).filter((_, itemIndex) => itemIndex !== index);
      return { ...current, lineItems };
    });
  }, [bumpMutation]);

  const updateLineItem = useCallback((index: number, field: string, value: any) => {
    return bumpMutation((prevData) => {
      const current = normalizeDocumentData(prevData) || {};
      const lineItems = cloneLineItems(current.lineItems);
      if (!lineItems[index]) {
        return current;
      }
      const nextItem = { ...lineItems[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice' || field === 'unit_price') {
        const total = getLineItemTotal(nextItem);
        nextItem.total = total;
        nextItem.line_total = total;
      }
      if (field === 'total' || field === 'line_total') {
        nextItem.total = Number(value) || 0;
        nextItem.line_total = Number(value) || 0;
      }
      lineItems[index] = nextItem;
      return { ...current, lineItems };
    });
  }, [bumpMutation]);

  // --- Save / Dirty management actions ---

  const markSaved = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isDirty: false,
      lastSavedAt: Date.now(),
      lastSaveStatus: 'saved',
      lastSaveError: null,
    }));
  }, []);

  const markSaveError = useCallback((error: string) => {
    setSession((prev) => ({
      ...prev,
      lastSaveStatus: 'error',
      lastSaveError: error,
      // Keep isDirty true so the user knows the edit still needs saving
    }));
  }, []);

  const beginSave = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      lastSaveStatus: 'saving',
      lastSaveError: null,
    }));
  }, []);

  const hydrateFromServer = useCallback((data: ActiveDocumentData) => {
    setSession((prev) => ({
      ...prev,
      documentData: normalizeDocumentData(data),
      lineItemCount: calculateLineItemCount(data),
      lastSaveStatus: 'idle',
      lastSaveError: null,
      version: prev.version + 1,
    }));
  }, []);

  const discardChanges = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isDirty: false,
      lastSaveStatus: 'idle',
      lastSaveError: null,
    }));
  }, []);

  const validateSession = useCallback((docType: ActiveDocumentType | null, docId: string | null) => {
    const current = sessionRef.current;
    // If no document is open in the session
    if (!current.isOpen || !current.documentType) {
      return false;
    }
    // If the caller is asking about the currently open document
    if (current.documentType === docType && current.documentId === docId) {
      return true;
    }
    // Session has a different document open — the context is stale for this call
    return false;
  }, []);

  const getSnapshot = useCallback((): ActiveDocumentSession => {
    return { ...sessionRef.current };
  }, []);

  // --- AI tool event listeners ---
  // These read from the live sessionRef so they never use stale closures.
  useEffect(() => {
    const handleAddLineItem = (event: Event) => {
      const { toolCallId, description, quantity, unitPrice } = (event as CustomEvent).detail || {};
      const prev = sessionRef.current;
      if (!prev.isOpen || !prev.documentType) {
        dispatchToolAck(toolCallId, 'addLineItem', false, {
          error: 'No document is currently open. Open a document first.',
          data: { activeDocument: null },
        });
        return;
      }
      try {
        const item = {
          description: String(description || '').trim(),
          quantity: Number(quantity) || 1,
          unitPrice: Number(unitPrice) || 0,
        };
        const nextDoc = addLineItem(item);
        const lineItems = Array.isArray(nextDoc?.lineItems) ? nextDoc.lineItems : [];
        const total = lineItems.reduce((sum: number, li: any) => {
          const q = Number(li.quantity ?? 0);
          const p = Number(li.unitPrice ?? li.unit_price ?? 0);
          return sum + (Number.isFinite(q) && Number.isFinite(p) ? q * p : 0);
        }, 0);

        dispatchToolAck(toolCallId, 'addLineItem', true, {
          message: `Added "${description || 'New item'}" (Qty: ${quantity || 1}, Price: R${unitPrice || 0}) — applied locally. Save the document to persist.`,
          data: {
            applied: 'local',
            itemCount: lineItems.length,
            total,
            version: sessionRef.current.version,
            isDirty: true,
          },
        });
      } catch (err: any) {
        dispatchToolAck(toolCallId, 'addLineItem', false, {
          error: `Failed to add line item: ${err.message}`,
        });
      }
    };

    const handleRemoveLineItem = (event: Event) => {
      const { toolCallId, index } = (event as CustomEvent).detail || {};
      const prev = sessionRef.current;
      if (!prev.isOpen || !prev.documentType) {
        dispatchToolAck(toolCallId, 'removeLineItem', false, {
          error: 'No document is currently open.',
        });
        return;
      }
      try {
        const currentItems = Array.isArray(prev.documentData?.lineItems) ? prev.documentData.lineItems : [];
        const idx = Number(index);
        if (idx < 0 || idx >= currentItems.length) {
          dispatchToolAck(toolCallId, 'removeLineItem', false, {
            error: `Line ${idx + 1} doesn't exist. You have ${currentItems.length} items.`,
          });
          return;
        }
        const removedDesc = currentItems[idx]?.description || `Line ${idx + 1}`;
        const nextDoc = removeLineItem(idx);
        const remaining = Array.isArray(nextDoc?.lineItems) ? nextDoc.lineItems.length : 0;
        const total = Array.isArray(nextDoc?.lineItems) ? nextDoc.lineItems.reduce((sum: number, li: any) => {
          const q = Number(li.quantity ?? 0);
          const p = Number(li.unitPrice ?? li.unit_price ?? 0);
          return sum + (Number.isFinite(q) && Number.isFinite(p) ? q * p : 0);
        }, 0) : 0;

        dispatchToolAck(toolCallId, 'removeLineItem', true, {
          message: `Removed "${removedDesc}". ${remaining} items remaining. Applied locally — save to persist.`,
          data: { applied: 'local', itemCount: remaining, total, removedDescription: removedDesc, isDirty: true, version: sessionRef.current.version },
        });
      } catch (err: any) {
        dispatchToolAck(toolCallId, 'removeLineItem', false, {
          error: `Failed to remove line item: ${err.message}`,
        });
      }
    };

    const handleUpdateLineItem = (event: Event) => {
      const { toolCallId, index, field, value } = (event as CustomEvent).detail || {};
      const prev = sessionRef.current;
      if (!prev.isOpen || !prev.documentType) {
        dispatchToolAck(toolCallId, 'updateLineItem', false, {
          error: 'No document is currently open.',
        });
        return;
      }
      try {
        const lineIdx = Number(index);
        const currentItems = Array.isArray(prev.documentData?.lineItems) ? prev.documentData.lineItems : [];
        if (lineIdx < 0 || lineIdx >= currentItems.length) {
          dispatchToolAck(toolCallId, 'updateLineItem', false, {
            error: `Line ${lineIdx + 1} doesn't exist. You have ${currentItems.length} items.`,
          });
          return;
        }
        const nextDoc = updateLineItem(lineIdx, String(field), value);
        const total = Array.isArray(nextDoc?.lineItems) ? nextDoc.lineItems.reduce((sum: number, li: any) => {
          const q = Number(li.quantity ?? 0);
          const p = Number(li.unitPrice ?? li.unit_price ?? 0);
          return sum + (Number.isFinite(q) && Number.isFinite(p) ? q * p : 0);
        }, 0) : 0;

        dispatchToolAck(toolCallId, 'updateLineItem', true, {
          message: `Updated line ${lineIdx + 1} — ${field}: ${value}. Applied locally — save to persist.`,
          data: { applied: 'local', lineIndex: lineIdx, field, value, total, itemCount: Array.isArray(nextDoc?.lineItems) ? nextDoc.lineItems.length : 0, isDirty: true, version: sessionRef.current.version },
        });
      } catch (err: any) {
        dispatchToolAck(toolCallId, 'updateLineItem', false, {
          error: `Failed to update line item: ${err.message}`,
        });
      }
    };

    const handleUpdateDocumentField = (event: Event) => {
      const { toolCallId, field, value } = (event as CustomEvent).detail || {};
      const prev = sessionRef.current;
      if (!prev.isOpen || !prev.documentType) {
        dispatchToolAck(toolCallId, 'updateDocumentField', false, {
          error: 'No document is currently open.',
        });
        return;
      }
      try {
        updateField(String(field), value);
        dispatchToolAck(toolCallId, 'updateDocumentField', true, {
          message: `Updated ${String(field).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase().trim()}. Applied locally — save to persist.`,
          data: { applied: 'local', field, value, isDirty: true, version: sessionRef.current.version },
        });
      } catch (err: any) {
        dispatchToolAck(toolCallId, 'updateDocumentField', false, {
          error: `Failed to update field: ${err.message}`,
        });
      }
    };

    // Save handler — waits for server call, receives result via dispatchSaveAck
    const handleSaveDocument = async (event: Event) => {
      const { toolCallId, documentType, documentId, documentData, saveUrl, savePayload } = (event as CustomEvent).detail || {};
      const prev = sessionRef.current;

      if (!prev.isOpen || !prev.documentType) {
        dispatchToolAck(toolCallId, 'saveDocument', false, {
          error: 'No document is currently open to save.',
          data: { saveStatus: 'no_document' },
        });
        return;
      }

      if (documentType && documentId && prev.validateSession?.(documentType, documentId) === false) {
        dispatchToolAck(toolCallId, 'saveDocument', false, {
          error: `Session mismatch. You tried to save ${documentType} ${documentId} but ${prev.documentType} ${prev.documentId} is open.`,
          data: { saveStatus: 'stale_session', currentType: prev.documentType, currentId: prev.documentId },
        });
        return;
      }

      if (!saveUrl) {
        // No URL to save to — acknowledge the local state is dirty but cannot persist
        dispatchSaveAck(toolCallId, false, {
          message: 'No save endpoint available. Document remains dirty.',
          error: 'save_url_missing',
          data: { saveStatus: 'no_endpoint', isDirty: true },
        });
        return;
      }

      // Set optimistic saving state
      setSession((ps) => ({ ...ps, lastSaveStatus: 'saving', lastSaveError: null }));

      try {
        const response = await fetch(saveUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savePayload || { documentData: prev.documentData }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          setSession((ps) => ({ ...ps, lastSaveStatus: 'error', lastSaveError: `Server returned ${response.status}` }));
          dispatchSaveAck(toolCallId, false, {
            message: `Save failed with status ${response.status}`,
            error: errorText,
            data: { saveStatus: 'server_error', statusCode: response.status },
          });
          return;
        }

        const result = await response.json();
        setSession((ps) => ({
          ...ps,
          lastSaveStatus: 'saved',
          lastSavedAt: Date.now(),
          lastSaveError: null,
          isDirty: false,
        }));
        dispatchSaveAck(toolCallId, true, {
          message: 'Document saved successfully.',
          data: { saveStatus: 'saved', serverVersion: result?.version ?? result?.updated_at ?? null },
        });
      } catch (err: any) {
        setSession((ps) => ({ ...ps, lastSaveStatus: 'error', lastSaveError: err.message }));
        dispatchSaveAck(toolCallId, false, {
          message: 'Save request failed: network error',
          error: err.message,
          data: { saveStatus: 'network_error' },
        });
      }
    };

    window.addEventListener(AI_TOOL_EVENT_NAMES.addLineItem, handleAddLineItem);
    window.addEventListener(AI_TOOL_EVENT_NAMES.removeLineItem, handleRemoveLineItem);
    window.addEventListener(AI_TOOL_EVENT_NAMES.updateLineItem, handleUpdateLineItem);
    window.addEventListener(AI_TOOL_EVENT_NAMES.updateDocumentField, handleUpdateDocumentField);
    window.addEventListener(AI_TOOL_EVENT_NAMES.saveDocument, handleSaveDocument);

    return () => {
      window.removeEventListener(AI_TOOL_EVENT_NAMES.addLineItem, handleAddLineItem);
      window.removeEventListener(AI_TOOL_EVENT_NAMES.removeLineItem, handleRemoveLineItem);
      window.removeEventListener(AI_TOOL_EVENT_NAMES.updateLineItem, handleUpdateLineItem);
      window.removeEventListener(AI_TOOL_EVENT_NAMES.updateDocumentField, handleUpdateDocumentField);
      window.removeEventListener(AI_TOOL_EVENT_NAMES.saveDocument, handleSaveDocument);
    };
  }, [addLineItem, removeLineItem, updateLineItem, updateField]);

  return (
    <ActiveDocumentContext.Provider
      value={{
        ...session,
        registerDocumentSession,
        clearDocumentSession,
        updateField,
        addLineItem,
        removeLineItem,
        updateLineItem,
        markSaved,
        markSaveError,
        beginSave,
        validateSession: (t, i) => {
          const current = sessionRef.current; // Use ref for stale-check safety
          if (!current.isOpen || !current.documentType) return false;
          return current.documentType === t && current.documentId === i;
        },
        discardChanges,
        getSnapshot,
        hydrateFromServer,
      }}
    >
      {children}
    </ActiveDocumentContext.Provider>
  );
}

export function useActiveDocument() {
  const context = useContext(ActiveDocumentContext);
  if (!context) {
    throw new Error('useActiveDocument must be used within an ActiveDocumentProvider');
  }

  return context;
}

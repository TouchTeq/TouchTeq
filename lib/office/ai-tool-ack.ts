export interface AiToolAckEvent {
  toolCallId: string;
  toolName: string;
  success: boolean;
  message?: string;
  error?: string;
  data?: Record<string, any>;
}

export type SaveStatus = 'saved' | 'server_error' | 'network_error' | 'no_endpoint' | 'stale_session' | 'no_document';

/**
 * Acknowledgement for a save attempt.
 * Distinguishes between local application and server persistence.
 */
export interface AiSaveAckEvent {
  toolCallId: string;
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    saveStatus: SaveStatus;
    serverVersion?: string | null;
    statusCode?: number;
    isDirty?: boolean;
    [key: string]: any;
  };
}

/**
 * Fired when the active document session becomes stale or changes unexpectedly.
 */
export interface StaleSessionEvent {
  reason: 'session_expired_on_restore' | 'session_cleared' | 'document_switched' | 'document_switched_with_unsaved_changes' | 'session_timed_out';
  previousDocumentType: string | null;
  previousDocumentId: string | null;
  timestamp: number;
}

/**
 * Result returned after dispatching a save event and waiting for the
 * acknowledgement (combines local apply status + server save status).
 */
export interface SaveEventResult {
  appliedLocally: boolean;
  savedToServer: boolean;
  toolCallId: string;
  success: boolean;
  message: string;
  error?: string;
  saveStatus: SaveStatus;
}

export const AI_TOOL_ACK_EVENT_NAME = 'ai-tool-ack';

/**
 * Event name for save-specific acknowledgements.
 * The AI can listen for this to know when a document has been actually persisted.
 */
export const AI_SAVE_ACK_EVENT_NAME = 'ai-save-ack';

/**
 * Event name for stale session notifications.
 * The AI can listen for this to know when the document context has changed or gone stale.
 */
export const AI_STALE_SESSION_EVENT_NAME = 'ai-stale-session';

export const AI_TOOL_EVENT_NAMES = {
  addLineItem: 'ai-tool-addLineItem',
  removeLineItem: 'ai-tool-removeLineItem',
  updateLineItem: 'ai-tool-updateLineItem',
  updateDocumentField: 'ai-tool-updateDocumentField',
  saveDocument: 'ai-tool-saveDocument',
  closeDocument: 'ai-tool-closeDocument',
} as const;

export function generateToolCallId(toolName: string): string {
  return `tc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${toolName}`;
}

/**
 * Wait for a tool acknowledgement event.
 * Returns a promise that resolves with the ack event or times out.
 * If no ack arrives within `timeoutMs`, resolves with a failure event
 * so the caller never hangs indefinitely.
 */
export function waitForToolAck(toolCallId: string, timeoutMs: number = 5000): Promise<AiToolAckEvent> {
  return new Promise((resolve) => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<AiToolAckEvent>;
      if (customEvent.detail?.toolCallId === toolCallId) {
        window.removeEventListener(AI_TOOL_ACK_EVENT_NAME, handler);
        clearTimeout(timeoutTimer);
        resolve(customEvent.detail);
      }
    };

    window.addEventListener(AI_TOOL_ACK_EVENT_NAME, handler);

    const timeoutTimer = setTimeout(() => {
      window.removeEventListener(AI_TOOL_ACK_EVENT_NAME, handler);
      resolve({
        toolCallId,
        toolName: 'unknown',
        success: false,
        error: 'No acknowledgement received within timeout. The action may not have been executed. Please check the document manually.',
      });
    }, timeoutMs);
  });
}

/**
 * Wait for a save acknowledgement event (distinct from regular tool acks).
 * Used when the AI has requested a save and needs to know whether it persisted.
 */
export function waitForSaveAck(toolCallId: string, timeoutMs: number = 15000): Promise<AiSaveAckEvent> {
  return new Promise((resolve) => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<AiSaveAckEvent>;
      if (customEvent.detail?.toolCallId === toolCallId) {
        window.removeEventListener(AI_SAVE_ACK_EVENT_NAME, handler);
        clearTimeout(timeoutTimer);
        resolve(customEvent.detail);
      }
    };

    window.addEventListener(AI_SAVE_ACK_EVENT_NAME, handler);

    const timeoutTimer = setTimeout(() => {
      window.removeEventListener(AI_SAVE_ACK_EVENT_NAME, handler);
      resolve({
        toolCallId,
        success: false,
        error: 'Save acknowledgement not received. The document may still be dirty or the save may have failed.',
        data: { saveStatus: 'network_error' as const },
      });
    }, timeoutMs);
  });
}

/**
 * Wait for a stale session notification.
 * Useful for the AI to know if the open document changed while it was working.
 */
export function waitForStaleSession(timeoutMs: number = 30000): Promise<StaleSessionEvent | null> {
  return new Promise((resolve) => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<StaleSessionEvent>;
      window.removeEventListener(AI_STALE_SESSION_EVENT_NAME, handler);
      clearTimeout(timeoutTimer);
      resolve(customEvent.detail);
    };

    window.addEventListener(AI_STALE_SESSION_EVENT_NAME, handler);

    const timeoutTimer = setTimeout(() => {
      window.removeEventListener(AI_STALE_SESSION_EVENT_NAME, handler);
      resolve(null);
    }, timeoutMs);
  });
}

/**
 * Dispatch a standard tool acknowledgement (edit applied locally).
 */
export function dispatchToolAck(toolCallId: string, toolName: string, success: boolean, options?: { message?: string; error?: string; data?: Record<string, any> }) {
  window.dispatchEvent(new CustomEvent(AI_TOOL_ACK_EVENT_NAME, {
    detail: {
      toolCallId,
      toolName,
      success,
      message: options?.message,
      error: options?.error,
      data: options?.data,
    } as AiToolAckEvent,
  }));
}

/**
 * Dispatch a save acknowledgement (result of a server-side persist attempt).
 */
export function dispatchSaveAck(toolCallId: string, success: boolean, options?: { message?: string; error?: string; data?: AiSaveAckEvent['data'] }) {
  window.dispatchEvent(new CustomEvent(AI_SAVE_ACK_EVENT_NAME, {
    detail: {
      toolCallId,
      success,
      message: options?.message,
      error: options?.error,
      data: options?.data,
    } as AiSaveAckEvent,
  }));
}

/**
 * Dispatch a save event to request the active document context to
 * persist the current document to the server.
 */
export function dispatchSaveEvent(toolCallId: string, documentType: string | null, documentId: string | null, saveUrl: string, savePayload?: Record<string, any>) {
  window.dispatchEvent(new CustomEvent(AI_TOOL_EVENT_NAMES.saveDocument, {
    detail: {
      toolCallId,
      documentType,
      documentId,
      saveUrl,
      savePayload,
    },
  }));
}

/**
 * Dispatch a stale session notification so any listener (AI or UI)
 * knows the document context has changed or gone stale.
 */
export function dispatchStaleSessionEvent(reason: StaleSessionEvent['reason'], previousDocumentType?: string | null, previousDocumentId?: string | null) {
  window.dispatchEvent(new CustomEvent(AI_STALE_SESSION_EVENT_NAME, {
    detail: {
      reason,
      previousDocumentType: previousDocumentType ?? null,
      previousDocumentId: previousDocumentId ?? null,
      timestamp: Date.now(),
    } as StaleSessionEvent,
  }));
}

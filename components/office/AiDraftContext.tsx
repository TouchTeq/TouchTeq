'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type AiDraftType = 'quote' | 'invoice' | 'email' | 'certificate';
export type ActiveOfficeDocumentType = 'quote' | 'invoice' | 'certificate';
export type OfficeDocumentMode = 'new' | 'edit';
export type OfficeDocumentAmendmentField = 'client_name' | 'quantity' | 'unit_price';

export interface AiDraft {
  type: AiDraftType;
  data: any;
  timestamp: number;
}

export interface ActiveOfficeDocument {
  type: ActiveOfficeDocumentType;
  id: string | null;
  reference: string | null;
  route: string;
  mode: OfficeDocumentMode;
  clientName?: string | null;
}

export interface OfficeDocumentAmendment {
  id: string;
  documentType: ActiveOfficeDocumentType;
  documentId: string | null;
  reference: string | null;
  field: OfficeDocumentAmendmentField;
  value: string | number;
  lineItemIndex?: number;
  createdAt: number;
}

interface AiDraftContextType {
  draft: AiDraft | null;
  setAiDraft: (type: AiDraftType, data: any) => void;
  clearAiDraft: () => void;
  activeDocument: ActiveOfficeDocument | null;
  setActiveDocument: (document: ActiveOfficeDocument | null) => void;
  clearActiveDocument: () => void;
  amendments: OfficeDocumentAmendment[];
  queueAmendment: (amendment: Omit<OfficeDocumentAmendment, 'id' | 'createdAt'>) => OfficeDocumentAmendment;
  consumeAmendment: (amendmentId: string) => void;
}

const AiDraftContext = createContext<AiDraftContextType | undefined>(undefined);

export function AiDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<AiDraft | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const saved = sessionStorage.getItem('touchteq_ai_draft');
    if (!saved) {
      return null;
    }

    try {
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
        return parsed;
      }

      sessionStorage.removeItem('touchteq_ai_draft');
      return null;
    } catch (e) {
      console.error("Failed to load AI draft", e);
      return null;
    }
  });

  const [activeDocument, setActiveDocumentState] = useState<ActiveOfficeDocument | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const saved = sessionStorage.getItem('touchteq_ai_active_document');
    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved) as ActiveOfficeDocument;
    } catch (e) {
      console.error("Failed to load active AI document", e);
      return null;
    }
  });

  const [amendments, setAmendments] = useState<OfficeDocumentAmendment[]>([]);

  const setAiDraft = useCallback((type: AiDraftType, data: any) => {
    const newDraft = {
      type,
      data,
      timestamp: Date.now()
    };
    setDraft(newDraft);
    sessionStorage.setItem('touchteq_ai_draft', JSON.stringify(newDraft));
  }, []);

  const clearAiDraft = useCallback(() => {
    setDraft(null);
    sessionStorage.removeItem('touchteq_ai_draft');
  }, []);

  const setActiveDocument = useCallback((document: ActiveOfficeDocument | null) => {
    setActiveDocumentState(document);

    if (document) {
      sessionStorage.setItem('touchteq_ai_active_document', JSON.stringify(document));
      return;
    }

    sessionStorage.removeItem('touchteq_ai_active_document');
  }, []);

  const clearActiveDocument = useCallback(() => {
    setActiveDocument(null);
  }, [setActiveDocument]);

  const queueAmendment = useCallback((amendment: Omit<OfficeDocumentAmendment, 'id' | 'createdAt'>) => {
    const nextAmendment: OfficeDocumentAmendment = {
      ...amendment,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };

    setAmendments((prev) => [...prev, nextAmendment]);
    return nextAmendment;
  }, []);

  const consumeAmendment = useCallback((amendmentId: string) => {
    setAmendments((prev) => prev.filter((amendment) => amendment.id !== amendmentId));
  }, []);

  return (
    <AiDraftContext.Provider
      value={{
        draft,
        setAiDraft,
        clearAiDraft,
        activeDocument,
        setActiveDocument,
        clearActiveDocument,
        amendments,
        queueAmendment,
        consumeAmendment,
      }}
    >
      {children}
    </AiDraftContext.Provider>
  );
}

export function useAiDraft() {
  const context = useContext(AiDraftContext);
  if (context === undefined) {
    throw new Error('useAiDraft must be used within an AiDraftProvider');
  }
  return context;
}

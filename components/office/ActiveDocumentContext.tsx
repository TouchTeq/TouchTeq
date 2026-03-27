'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ActiveDocumentType = 'invoice' | 'quote';
export type ActiveDocumentFieldValue = string | number | boolean | null | undefined;
export type ActiveDocumentLineItem = Record<string, any>;

export interface ActiveDocumentData {
  [key: string]: any;
  lineItems?: ActiveDocumentLineItem[];
}

export interface ActiveDocumentSession {
  documentType: ActiveDocumentType | null;
  documentId: string | null;
  documentData: ActiveDocumentData | null;
  isOpen: boolean;
}

interface RegisterDocumentSessionInput {
  documentType: ActiveDocumentType | null;
  documentId: string | null;
  documentData?: ActiveDocumentData | null;
  isOpen?: boolean;
}

interface ActiveDocumentContextValue extends ActiveDocumentSession {
  registerDocumentSession: (session: RegisterDocumentSessionInput) => ActiveDocumentData | null;
  clearDocumentSession: () => void;
  updateField: (field: string, value: ActiveDocumentFieldValue) => ActiveDocumentData | null;
  addLineItem: (item?: ActiveDocumentLineItem) => ActiveDocumentData | null;
  removeLineItem: (index: number) => ActiveDocumentData | null;
  updateLineItem: (index: number, field: string, value: any) => ActiveDocumentData | null;
}

const STORAGE_KEY = 'touchteq_active_document_session';

const DEFAULT_SESSION: ActiveDocumentSession = {
  documentType: null,
  documentId: null,
  documentData: null,
  isOpen: false,
};

const ActiveDocumentContext = createContext<ActiveDocumentContextValue | undefined>(undefined);

function readStoredSession(): ActiveDocumentSession {
  if (typeof window === 'undefined') {
    return DEFAULT_SESSION;
  }

  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return DEFAULT_SESSION;
  }

  try {
    const parsed = JSON.parse(saved) as ActiveDocumentSession;
    return {
      documentType: parsed.documentType ?? null,
      documentId: parsed.documentId ?? null,
      documentData: parsed.documentData ?? null,
      isOpen: Boolean(parsed.isOpen && parsed.documentType),
    };
  } catch (error) {
    console.error('Failed to load active document session', error);
    return DEFAULT_SESSION;
  }
}

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

function getLineItemTotal(item: ActiveDocumentLineItem) {
  const quantity = Number(item.quantity ?? 0);
  const unitPrice = Number(item.unitPrice ?? item.unit_price ?? 0);
  const total = Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : 0;
  return total;
}

export function ActiveDocumentProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ActiveDocumentSession>(() => readStoredSession());
  const sessionRef = React.useRef<ActiveDocumentSession>(session);

  React.useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (session.isOpen && session.documentType) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return;
    }

    sessionStorage.removeItem(STORAGE_KEY);
  }, [session]);

  const clearDocumentSession = useCallback(() => {
    setSession(DEFAULT_SESSION);
  }, []);

  const registerDocumentSession = useCallback((input: RegisterDocumentSessionInput) => {
    const nextDocumentData = normalizeDocumentData(input.documentData);

    setSession({
      documentType: input.documentType,
      documentId: input.documentId,
      documentData: nextDocumentData,
      isOpen: input.isOpen ?? true,
    });

    return nextDocumentData;
  }, []);

  const updateField = useCallback((field: string, value: ActiveDocumentFieldValue) => {
    const prev = sessionRef.current;
    if (!prev.isOpen || !prev.documentType) {
      return prev.documentData;
    }

    const current = normalizeDocumentData(prev.documentData) || {};
    const nextDocumentData = {
      ...current,
      [field]: value,
    };

    setSession((prevSession) => ({
      ...prevSession,
      documentData: nextDocumentData,
    }));

    return nextDocumentData;
  }, []);

  const addLineItem = useCallback((item: ActiveDocumentLineItem = {}) => {
    const prev = sessionRef.current;
    if (!prev.isOpen || !prev.documentType) {
      return prev.documentData;
    }

    const current = normalizeDocumentData(prev.documentData) || {};
    const lineItems = cloneLineItems(current.lineItems);
    const nextItem = {
      ...item,
    };

    if (typeof nextItem.total === 'undefined' && typeof nextItem.line_total === 'undefined') {
      const total = getLineItemTotal(nextItem);
      nextItem.total = total;
      nextItem.line_total = total;
    }

    lineItems.push(nextItem);
    const nextDocumentData = {
      ...current,
      lineItems,
    };

    setSession((prevSession) => ({
      ...prevSession,
      documentData: nextDocumentData,
    }));

    return nextDocumentData;
  }, []);

  const removeLineItem = useCallback((index: number) => {
    const prev = sessionRef.current;
    if (!prev.isOpen || !prev.documentType) {
      return prev.documentData;
    }

    const current = normalizeDocumentData(prev.documentData) || {};
    const lineItems = cloneLineItems(current.lineItems).filter((_, itemIndex) => itemIndex !== index);
    const nextDocumentData = {
      ...current,
      lineItems,
    };

    setSession((prevSession) => ({
      ...prevSession,
      documentData: nextDocumentData,
    }));

    return nextDocumentData;
  }, []);

  const updateLineItem = useCallback((index: number, field: string, value: any) => {
    const prev = sessionRef.current;
    if (!prev.isOpen || !prev.documentType) {
      return prev.documentData;
    }

    const current = normalizeDocumentData(prev.documentData) || {};
    const lineItems = cloneLineItems(current.lineItems);
    if (!lineItems[index]) {
      return current;
    }

    const nextItem = {
      ...lineItems[index],
      [field]: value,
    };

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
    const nextDocumentData = {
      ...current,
      lineItems,
    };

    setSession((prevSession) => ({
      ...prevSession,
      documentData: nextDocumentData,
    }));

    return nextDocumentData;
  }, []);

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

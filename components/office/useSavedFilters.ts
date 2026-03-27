'use client';

import { useCallback } from 'react';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function useSavedFilters<T extends Record<string, any>>(storageKey: string) {
  const load = useCallback((): T | null => {
    if (typeof window === 'undefined') return null;
    return safeParse<T>(window.localStorage.getItem(storageKey));
  }, [storageKey]);

  const save = useCallback(
    (value: T) => {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    },
    [storageKey]
  );

  const clear = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { load, save, clear };
}


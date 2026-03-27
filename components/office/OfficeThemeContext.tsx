'use client';

import React, { createContext, useContext } from 'react';

export type OfficeTheme = 'dark' | 'light';

type OfficeThemeContextValue = {
  theme: OfficeTheme;
  setTheme: (theme: OfficeTheme) => void;
  toggleTheme: () => void;
};

const OfficeThemeContext = createContext<OfficeThemeContextValue | undefined>(undefined);

export function OfficeThemeProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: OfficeThemeContextValue;
}) {
  return <OfficeThemeContext.Provider value={value}>{children}</OfficeThemeContext.Provider>;
}

export function useOfficeTheme() {
  const ctx = useContext(OfficeThemeContext);
  if (!ctx) {
    throw new Error('useOfficeTheme must be used within OfficeThemeProvider');
  }
  return ctx;
}

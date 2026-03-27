'use client';

import React, { createContext, useContext } from 'react';

type OfficeBrandingContextValue = {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
};

const OfficeBrandingContext = createContext<OfficeBrandingContextValue | undefined>(undefined);

export function OfficeBrandingProvider({
  value,
  children,
}: {
  value: OfficeBrandingContextValue;
  children: React.ReactNode;
}) {
  return <OfficeBrandingContext.Provider value={value}>{children}</OfficeBrandingContext.Provider>;
}

export function useOfficeBranding() {
  const ctx = useContext(OfficeBrandingContext);
  if (!ctx) throw new Error('useOfficeBranding must be used within OfficeBrandingProvider');
  return ctx;
}


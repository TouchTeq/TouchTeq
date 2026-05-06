'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const consent = document.cookie
        .split('; ')
        .find(row => row.startsWith('tt_cookie_consent='));

      setVisible(!consent);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setConsent = (value: 'accepted' | 'essential') => {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `tt_cookie_consent=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
    setVisible(false);

    if (value === 'accepted') {
      window.location.reload();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0A1120] border-t border-white/10 shadow-2xl max-h-[75dvh] overflow-y-auto">
      <div className="container mx-auto px-4 md:px-8 py-4 md:py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="flex-1">
            <p className="text-white text-xs sm:text-sm font-medium leading-relaxed mb-2">
              We use essential cookies to keep this website working. With your permission, we also use analytics cookies to understand how visitors use our site. Read our{' '}
              <Link href="/privacy" className="text-orange-500 hover:underline font-bold">
                Privacy Policy
              </Link>
              {' '}for more details.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setConsent('essential')}
              className="px-5 sm:px-6 py-3 border border-white/20 text-white font-black text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-widest hover:bg-white/5 transition-all rounded-md whitespace-nowrap"
            >
              Essential Only
            </button>
            <button
              onClick={() => setConsent('accepted')}
              className="px-5 sm:px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-widest transition-all rounded-md shadow-lg shadow-orange-500/20 whitespace-nowrap"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

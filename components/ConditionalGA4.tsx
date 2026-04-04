'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function ConditionalGA4() {
  const [gaEnabled, setGaEnabled] = useState(false);

  useEffect(() => {
    const consent = document.cookie
      .split('; ')
      .find(row => row.startsWith('tt_cookie_consent='));

    if (consent && consent.split('=')[1] === 'accepted') {
      setGaEnabled(true);
    }

    const observer = new MutationObserver(() => {
      const c = document.cookie
        .split('; ')
        .find(row => row.startsWith('tt_cookie_consent='));
      if (c && c.split('=')[1] === 'accepted') {
        setGaEnabled(true);
      }
    });

    observer.observe(document, { subtree: true, childList: true });

    return () => observer.disconnect();
  }, []);

  if (!gaEnabled || !process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}

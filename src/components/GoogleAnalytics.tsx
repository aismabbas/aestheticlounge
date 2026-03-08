'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { hasConsent } from '@/lib/consent';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;
  const [analyticsConsented, setAnalyticsConsented] = useState(false);

  useEffect(() => {
    // Check initial consent
    setAnalyticsConsented(hasConsent('analytics'));

    // Listen for consent changes
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setAnalyticsConsented(detail?.analytics ?? false);

      // Update Google consent mode dynamically
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: detail?.analytics ? 'granted' : 'denied',
          ad_storage: detail?.marketing ? 'granted' : 'denied',
          ad_user_data: detail?.marketing ? 'granted' : 'denied',
          ad_personalization: detail?.marketing ? 'granted' : 'denied',
        });
      }
    };

    window.addEventListener('al_consent_change', handler);
    return () => window.removeEventListener('al_consent_change', handler);
  }, []);

  if (!gaId) return null;

  return (
    <>
      {/* Always load gtag with consent mode defaults (denied) */}
      <Script
        id="google-consent-defaults"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              wait_for_update: 500,
            });
          `,
        }}
      />

      {/* Only load GA4 script if analytics consent is given */}
      {analyticsConsented && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                if (!window.gtag) { function gtag(){dataLayer.push(arguments);} window.gtag = gtag; }
                gtag('js', new Date());
                gtag('consent', 'update', {
                  analytics_storage: 'granted',
                  ad_storage: 'granted',
                  ad_user_data: 'granted',
                  ad_personalization: 'granted',
                });
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}
    </>
  );
}

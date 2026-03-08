'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { hasConsent } from '@/lib/consent';

export default function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const [marketingConsented, setMarketingConsented] = useState(false);

  useEffect(() => {
    // Check initial consent
    setMarketingConsented(hasConsent('marketing'));

    // Listen for consent changes
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const granted = detail?.marketing ?? false;
      setMarketingConsented(granted);

      // If consent was just granted and fbq is already loaded, fire PageView
      if (granted && typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq('consent', 'grant');
        window.fbq('track', 'PageView');
      }
    };

    window.addEventListener('al_consent_change', handler);
    return () => window.removeEventListener('al_consent_change', handler);
  }, []);

  if (!pixelId) return null;

  // Don't inject the pixel script at all without marketing consent
  if (!marketingConsented) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('consent', 'grant');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureUTMParams } from '@/lib/utm';
import { trackPageView } from '@/lib/tracking';

export default function TrackingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Capture UTM params once on mount
  useEffect(() => {
    captureUTMParams();
  }, []);

  // Fire PageView on every route change
  useEffect(() => {
    trackPageView();
  }, [pathname]);

  return <>{children}</>;
}

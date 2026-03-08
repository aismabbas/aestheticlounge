'use client';

import { useEffect } from 'react';
import { captureUTMParams } from '@/lib/utm';
import { trackViewContent, trackPageView } from '@/lib/tracking';

export default function LPTracking({ treatment }: { treatment: string }) {
  useEffect(() => {
    captureUTMParams();
    trackPageView();
    trackViewContent(treatment, 'landing_page');
  }, [treatment]);

  return null;
}

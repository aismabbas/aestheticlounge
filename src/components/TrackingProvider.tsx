'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { captureUTMParams } from '@/lib/utm';
import { trackPageView } from '@/lib/tracking';
import { hasConsent } from '@/lib/consent';

// ── Visitor identity ───────────────────────────────────────────────

function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  const STORAGE_KEY = 'al_visitor';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  // Also set as cookie for server-side matching
  document.cookie = `al_visitor=${id};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  return id;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  const SESSION_KEY = 'al_session_id';
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// ── Event types ────────────────────────────────────────────────────

interface BehaviorEvent {
  visitor_id: string;
  event_type: string;
  page_url: string;
  page_title: string;
  metadata: Record<string, unknown>;
  session_id: string;
  timestamp: string;
}

// ── Event queue + flush ────────────────────────────────────────────

const eventQueue: BehaviorEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

async function flushEvents(): Promise<void> {
  if (isFlushing || eventQueue.length === 0) return;

  isFlushing = true;
  const batch = eventQueue.splice(0, eventQueue.length);

  try {
    const res = await fetch('/api/tracking/behavior', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true, // survives page unload
    });
    if (!res.ok) {
      // Put events back on failure
      eventQueue.unshift(...batch);
    }
  } catch {
    eventQueue.unshift(...batch);
  }

  isFlushing = false;
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, 30_000); // 30 seconds
}

function queueEvent(event: BehaviorEvent): void {
  eventQueue.push(event);
  scheduleFlush();
}

// ── Component ──────────────────────────────────────────────────────

export default function TrackingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageEnteredAt = useRef<number>(Date.now());
  const maxScrollDepth = useRef<number>(0);
  const visitorId = useRef<string>('');
  const sessionId = useRef<string>('');
  const [analyticsConsented, setAnalyticsConsented] = useState(false);
  const [marketingConsented, setMarketingConsented] = useState(false);

  // Check consent on mount and listen for changes
  useEffect(() => {
    setAnalyticsConsented(hasConsent('analytics'));
    setMarketingConsented(hasConsent('marketing'));

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setAnalyticsConsented(detail?.analytics ?? false);
      setMarketingConsented(detail?.marketing ?? false);
    };

    window.addEventListener('al_consent_change', handler);
    return () => window.removeEventListener('al_consent_change', handler);
  }, []);

  // Init visitor and session IDs once (necessary cookies — always allowed)
  useEffect(() => {
    visitorId.current = getVisitorId();
    sessionId.current = getSessionId();
    captureUTMParams();

    // Flush on page unload
    const handleUnload = () => {
      // Only send behavior events if analytics consent is given
      if (!hasConsent('analytics')) {
        flushEvents(); // flush any remaining queued events
        return;
      }

      // Send time-on-page event before leaving
      const timeSpent = Math.round((Date.now() - pageEnteredAt.current) / 1000);
      if (timeSpent > 1) {
        queueEvent({
          visitor_id: visitorId.current,
          event_type: 'time_on_page',
          page_url: window.location.pathname,
          page_title: document.title,
          metadata: { seconds: timeSpent },
          session_id: sessionId.current,
          timestamp: new Date().toISOString(),
        });
      }

      // Send scroll depth
      if (maxScrollDepth.current > 0) {
        queueEvent({
          visitor_id: visitorId.current,
          event_type: 'scroll',
          page_url: window.location.pathname,
          page_title: document.title,
          metadata: { depth_percent: maxScrollDepth.current },
          session_id: sessionId.current,
          timestamp: new Date().toISOString(),
        });
      }

      flushEvents();
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleUnload();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track scroll depth (only if analytics consented)
  useEffect(() => {
    if (!analyticsConsented) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const depth = Math.round((window.scrollY / scrollHeight) * 100);
      if (depth > maxScrollDepth.current) {
        maxScrollDepth.current = depth;
      }
    };

    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [analyticsConsented]);

  // Track page views on route change
  useEffect(() => {
    // Only fire Meta Pixel PageView if marketing consent is given
    if (marketingConsented) {
      trackPageView();
    }

    // Only send behavior events if analytics consent is given
    if (!analyticsConsented) {
      // Still reset timing refs
      pageEnteredAt.current = Date.now();
      maxScrollDepth.current = 0;
      return;
    }

    // Send time-on-page for the PREVIOUS page (if any)
    const timeSpent = Math.round((Date.now() - pageEnteredAt.current) / 1000);
    if (timeSpent > 1 && visitorId.current) {
      queueEvent({
        visitor_id: visitorId.current,
        event_type: 'time_on_page',
        page_url: pathname,
        page_title: document.title,
        metadata: { seconds: timeSpent },
        session_id: sessionId.current,
        timestamp: new Date().toISOString(),
      });
    }

    // Send scroll depth for previous page
    if (maxScrollDepth.current > 0 && visitorId.current) {
      queueEvent({
        visitor_id: visitorId.current,
        event_type: 'scroll',
        page_url: pathname,
        page_title: document.title,
        metadata: { depth_percent: maxScrollDepth.current },
        session_id: sessionId.current,
        timestamp: new Date().toISOString(),
      });
    }

    // Reset for new page
    pageEnteredAt.current = Date.now();
    maxScrollDepth.current = 0;

    // Queue page_view event
    if (visitorId.current) {
      queueEvent({
        visitor_id: visitorId.current,
        event_type: 'page_view',
        page_url: pathname,
        page_title: document.title,
        metadata: { referrer: document.referrer || '' },
        session_id: sessionId.current,
        timestamp: new Date().toISOString(),
      });
    }
  }, [pathname, analyticsConsented, marketingConsented]);

  // Track CTA clicks via event delegation (respects analytics consent)
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!visitorId.current) return;
    if (!hasConsent('analytics')) return;

    const target = e.target as HTMLElement;
    const ctaEl = target.closest<HTMLElement>(
      '[data-cta], a[href*="wa.me"], a[href^="tel:"], a[href*="book"], button[data-cta]',
    );
    if (!ctaEl) return;

    const ctaType =
      ctaEl.getAttribute('data-cta') ||
      (ctaEl.getAttribute('href')?.includes('wa.me') ? 'whatsapp' : '') ||
      (ctaEl.getAttribute('href')?.startsWith('tel:') ? 'call' : '') ||
      (ctaEl.getAttribute('href')?.includes('book') ? 'book_now' : 'cta');

    queueEvent({
      visitor_id: visitorId.current,
      event_type: 'cta_click',
      page_url: window.location.pathname,
      page_title: document.title,
      metadata: {
        cta_type: ctaType,
        cta_text: ctaEl.textContent?.trim().slice(0, 100) || '',
        cta_href: ctaEl.getAttribute('href') || '',
      },
      session_id: sessionId.current,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return <div onClick={handleClick}>{children}</div>;
}

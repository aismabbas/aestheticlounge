/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Client-side tracking utilities for Meta Pixel and custom analytics.
 * All calls are safe — they no-op if the pixel script hasn't loaded.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

function fbq(...args: any[]): void {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
}

// ── Meta Pixel events ──────────────────────────────────────────────

export function trackPageView(): void {
  fbq('track', 'PageView');
}

export function trackViewContent(
  contentName: string,
  contentCategory: string,
): void {
  fbq('track', 'ViewContent', {
    content_name: contentName,
    content_category: contentCategory,
  });
}

export function generateEventId(eventName: string): string {
  return `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function trackLead(contentName?: string, eventId?: string): void {
  const eid = eventId || generateEventId('Lead');
  fbq('track', 'Lead', contentName ? { content_name: contentName } : undefined, { eventID: eid });
}

export function trackSchedule(contentName?: string, value?: number, eventId?: string): void {
  const eid = eventId || generateEventId('Schedule');
  fbq('track', 'Schedule', {
    ...(contentName && { content_name: contentName }),
    ...(value != null && { value, currency: 'PKR' }),
  }, { eventID: eid });
}

export function trackContact(contentName?: string): void {
  fbq('track', 'Contact', contentName ? { content_name: contentName } : undefined);
}

// ── Custom / internal analytics ────────────────────────────────────

export function trackEvent(
  name: string,
  data?: Record<string, unknown>,
): void {
  fbq('trackCustom', name, data);
}

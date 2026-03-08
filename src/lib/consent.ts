'use client';

/**
 * Cookie consent utilities for Aesthetic Lounge.
 * Manages consent state in localStorage + cookie for server-side access.
 */

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
  version: string;
}

const STORAGE_KEY = 'al_cookie_consent';
const COOKIE_NAME = 'al_consent';
const CONSENT_VERSION = '1.0';

/**
 * Read consent from localStorage. Returns null if no consent has been given.
 */
export function getConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save consent to localStorage and a cookie (for server-side reading).
 */
export function saveConsent(prefs: Omit<ConsentPreferences, 'necessary' | 'timestamp' | 'version'>): ConsentPreferences {
  const consent: ConsentPreferences = {
    necessary: true,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    functional: prefs.functional,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));

  // Set cookie (1 year, SameSite=Lax)
  const encoded = encodeURIComponent(JSON.stringify(consent));
  document.cookie = `${COOKIE_NAME}=${encoded};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;

  // Dispatch custom event so other components can react
  window.dispatchEvent(new CustomEvent('al_consent_change', { detail: consent }));

  return consent;
}

/**
 * Accept all cookies.
 */
export function acceptAll(): ConsentPreferences {
  return saveConsent({ analytics: true, marketing: true, functional: true });
}

/**
 * Reject all non-essential cookies.
 */
export function rejectNonEssential(): ConsentPreferences {
  return saveConsent({ analytics: false, marketing: false, functional: true });
}

/**
 * Check if a specific consent category is granted.
 */
export function hasConsent(category: 'analytics' | 'marketing' | 'functional'): boolean {
  const consent = getConsent();
  if (!consent) return false;
  return consent[category];
}

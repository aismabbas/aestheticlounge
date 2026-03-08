/**
 * UTM parameter capture and retrieval.
 * Stores params in a cookie with 30-day expiry.
 */

const COOKIE_NAME = 'al_utm';
const COOKIE_DAYS = 30;

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
] as const;

type UTMParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  fbp?: string;
  fbc?: string;
};

// ── Helpers ────────────────────────────────────────────────────────

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Read UTM params from the current URL and persist to cookie.
 * Call once on page load (e.g. inside TrackingProvider).
 */
export function captureUTMParams(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const params: Record<string, string> = {};
  let hasUTM = false;

  for (const key of UTM_KEYS) {
    const val = url.searchParams.get(key);
    if (val) {
      params[key] = val;
      hasUTM = true;
    }
  }

  // Also capture fbclid → fbc cookie format
  const fbclid = url.searchParams.get('fbclid');
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    params.fbc = fbc;
    hasUTM = true;
  }

  if (hasUTM) {
    // Merge with any existing stored params (new values overwrite)
    const existing = getUTMParams();
    const merged = { ...existing, ...params };
    setCookie(COOKIE_NAME, JSON.stringify(merged), COOKIE_DAYS);
  }
}

/**
 * Retrieve stored UTM params + Meta cookie IDs.
 */
export function getUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};

  const raw = getCookie(COOKIE_NAME);
  const stored: UTMParams = raw ? JSON.parse(raw) : {};
  const meta = getMetaCookies();

  return { ...stored, ...meta };
}

/**
 * Read _fbp and _fbc cookies set by Meta Pixel.
 */
export function getMetaCookies(): { fbp?: string; fbc?: string } {
  if (typeof window === 'undefined') return {};

  return {
    fbp: getCookie('_fbp') || undefined,
    fbc: getCookie('_fbc') || undefined,
  };
}

/**
 * GA4 Measurement Protocol + Data API helpers.
 *
 * Server-side event sending and user-level analytics retrieval.
 * Gracefully no-ops when env vars are missing.
 *
 * Required env vars:
 *   GA4_MEASUREMENT_ID   - e.g. G-XXXXXXXXXX
 *   GA4_API_SECRET       - Measurement Protocol API secret
 *   GA4_PROPERTY_ID      - numeric property ID for Data API
 *   GOOGLE_SERVICE_ACCOUNT_JSON - service account key JSON (stringified)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ──────────────────────────────────────────────────────────

export interface GA4Event {
  name: string;
  params?: Record<string, string | number | boolean>;
}

interface GA4DataRow {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;
}

// ── Config ─────────────────────────────────────────────────────────

function getConfig() {
  return {
    measurementId: process.env.GA4_MEASUREMENT_ID || '',
    apiSecret: process.env.GA4_API_SECRET || '',
    propertyId: process.env.GA4_PROPERTY_ID || '',
    serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
  };
}

function isMeasurementEnabled(): boolean {
  const c = getConfig();
  return !!(c.measurementId && c.apiSecret);
}

function isDataApiEnabled(): boolean {
  const c = getConfig();
  return !!(c.propertyId && c.serviceAccountJson);
}

// ── Access Token (Data API) ────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (!isDataApiEnabled()) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  try {
    const sa = JSON.parse(getConfig().serviceAccountJson);
    const now = Math.floor(Date.now() / 1000);

    // Build JWT
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      }),
    );

    // Sign with crypto (Node.js)
    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${payload}`);
    const signature = sign.sign(sa.private_key, 'base64url');

    const jwt = `${header}.${payload}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!res.ok) {
      console.error('[ga4] Token request failed:', await res.text());
      return null;
    }

    const data = await res.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };
    return cachedToken.token;
  } catch (err) {
    console.error('[ga4] Access token error:', err);
    return null;
  }
}

// ── Data API helper ────────────────────────────────────────────────

async function runReport(body: Record<string, any>): Promise<GA4DataRow[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const propertyId = getConfig().propertyId;

  try {
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      console.error('[ga4] Report error:', await res.text());
      return [];
    }

    const data = await res.json();
    return (data.rows as GA4DataRow[]) || [];
  } catch (err) {
    console.error('[ga4] Report fetch error:', err);
    return [];
  }
}

function defaultDateRange(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

// ── Measurement Protocol ───────────────────────────────────────────

/**
 * Send server-side events to GA4 via Measurement Protocol.
 */
export async function sendGA4Event(
  clientId: string,
  events: GA4Event[],
): Promise<void> {
  if (!isMeasurementEnabled()) return;

  const { measurementId, apiSecret } = getConfig();

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          events: events.map((e) => ({
            name: e.name,
            params: e.params || {},
          })),
        }),
      },
    );

    if (!res.ok) {
      console.error('[ga4] Measurement Protocol error:', res.status);
    }
  } catch (err) {
    console.error('[ga4] Measurement Protocol send error:', err);
  }
}

// ── Data API: User-level queries ───────────────────────────────────

/**
 * Get page views for a specific user by client_id.
 */
export async function getPageViewsForUser(
  clientId: string,
  dateRange?: DateRange,
): Promise<{ page: string; title: string; views: number; date: string }[]> {
  const range = dateRange || defaultDateRange();

  const rows = await runReport({
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    dimensions: [
      { name: 'pagePath' },
      { name: 'pageTitle' },
      { name: 'date' },
    ],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customUser:client_id',
        stringFilter: { matchType: 'EXACT', value: clientId },
      },
    },
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: true }],
    limit: 100,
  });

  return rows.map((r) => ({
    page: r.dimensionValues[0].value,
    title: r.dimensionValues[1].value,
    views: parseInt(r.metricValues[0].value, 10),
    date: r.dimensionValues[2].value,
  }));
}

/**
 * Get the pages a user visited most.
 */
export async function getTopPagesViewed(
  clientId: string,
): Promise<{ page: string; title: string; views: number }[]> {
  const range = defaultDateRange();

  const rows = await runReport({
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customUser:client_id',
        stringFilter: { matchType: 'EXACT', value: clientId },
      },
    },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 20,
  });

  return rows.map((r) => ({
    page: r.dimensionValues[0].value,
    title: r.dimensionValues[1].value,
    views: parseInt(r.metricValues[0].value, 10),
  }));
}

/**
 * Get session-level data: total sessions, avg duration, bounce rate.
 */
export async function getUserSessionData(
  clientId: string,
): Promise<{
  sessions: number;
  avgDurationSeconds: number;
  bounceRate: number;
} | null> {
  const range = defaultDateRange();

  const rows = await runReport({
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    dimensions: [],
    metrics: [
      { name: 'sessions' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'customUser:client_id',
        stringFilter: { matchType: 'EXACT', value: clientId },
      },
    },
  });

  if (rows.length === 0) return null;

  return {
    sessions: parseInt(rows[0].metricValues[0].value, 10),
    avgDurationSeconds: parseFloat(rows[0].metricValues[1].value),
    bounceRate: parseFloat(rows[0].metricValues[2].value),
  };
}

/**
 * Get traffic source that brought the user (first session).
 */
export async function getTrafficSource(
  clientId: string,
): Promise<{
  source: string;
  medium: string;
  campaign: string;
} | null> {
  const range = defaultDateRange();

  const rows = await runReport({
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    dimensions: [
      { name: 'firstUserSource' },
      { name: 'firstUserMedium' },
      { name: 'firstUserCampaignName' },
    ],
    metrics: [{ name: 'sessions' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customUser:client_id',
        stringFilter: { matchType: 'EXACT', value: clientId },
      },
    },
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 1,
  });

  if (rows.length === 0) return null;

  return {
    source: rows[0].dimensionValues[0].value,
    medium: rows[0].dimensionValues[1].value,
    campaign: rows[0].dimensionValues[2].value,
  };
}

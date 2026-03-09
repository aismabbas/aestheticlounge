import { google, searchconsole_v1 } from 'googleapis';
import { getGoogleCredentials, isGoogleConfigured } from './google-auth';

/* ------------------------------------------------------------------ */
/* Google Search Console API client                                    */
/* Uses the AL service account for authentication.                     */
/* Requires the service account to be added as a user in GSC.          */
/* ------------------------------------------------------------------ */

let gscClient: searchconsole_v1.Searchconsole | null = null;

const SITE_URL = process.env.GOOGLE_SEARCH_CONSOLE_SITE || 'https://aestheticloungeofficial.com';

/**
 * Returns true if the required env vars are set for GSC.
 */
export function isGSCConfigured(): boolean {
  return isGoogleConfigured() && !!process.env.GOOGLE_SEARCH_CONSOLE_SITE;
}

/**
 * Lazily initialize and return the GSC client.
 */
function getGSC(): searchconsole_v1.Searchconsole {
  if (gscClient) return gscClient;

  const credentials = getGoogleCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  gscClient = google.searchconsole({ version: 'v1', auth });
  return gscClient;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface SearchPerformance {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface DailyPerformance {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Get aggregate search performance for a date range.
 */
export async function getSearchPerformance(
  startDate: string,
  endDate: string,
): Promise<SearchPerformance> {
  const gsc = getGSC();
  const res = await gsc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: [],
    },
  });

  const rows = res.data.rows || [];
  if (rows.length === 0) {
    return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }

  const row = rows[0];
  return {
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  };
}

/**
 * Get daily performance data for chart.
 */
export async function getDailyPerformance(
  startDate: string,
  endDate: string,
): Promise<DailyPerformance[]> {
  const gsc = getGSC();
  const res = await gsc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date'],
    },
  });

  return (res.data.rows || []).map((row) => ({
    date: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

/**
 * Get top queries.
 */
export async function getTopQueries(
  startDate: string,
  endDate: string,
  limit = 20,
): Promise<SearchRow[]> {
  const gsc = getGSC();
  const res = await gsc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: limit,
    },
  });

  return (res.data.rows || []).map((row) => ({
    keys: row.keys || [],
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

/**
 * Get top pages.
 */
export async function getTopPages(
  startDate: string,
  endDate: string,
  limit = 20,
): Promise<SearchRow[]> {
  const gsc = getGSC();
  const res = await gsc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: limit,
    },
  });

  return (res.data.rows || []).map((row) => ({
    keys: row.keys || [],
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

/**
 * Get indexing status — list of sitemaps submitted.
 */
export async function getSitemaps() {
  const gsc = getGSC();
  const res = await gsc.sitemaps.list({ siteUrl: SITE_URL });
  return (res.data.sitemap || []).map((s) => ({
    path: s.path || '',
    lastSubmitted: s.lastSubmitted || '',
    isPending: s.isPending || false,
    warnings: Number(s.warnings || 0),
    errors: Number(s.errors || 0),
    contents: (s.contents || []).map((c) => ({
      type: c.type || '',
      submitted: Number(c.submitted || 0),
      indexed: Number(c.indexed || 0),
    })),
  }));
}

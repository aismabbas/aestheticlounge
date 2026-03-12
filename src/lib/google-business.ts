/**
 * Google Business Profile API helper
 *
 * Uses a Google Service Account to interact with the Business Profile API.
 * Env vars required:
 *   Google SA credentials (via google-auth helper)
 *   GBP_ACCOUNT_ID             — accounts/{id}
 *   GBP_LOCATION_ID            — locations/{id}
 */

import { getGoogleCredentialsAsync, isGoogleConfigured } from './google-auth';

/* ---------- types ---------- */

export interface GBPLocationInfo {
  name: string;
  title: string;
  address: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    regionCode: string;
  };
  phoneNumbers: { primaryPhone: string };
  websiteUri: string;
  regularHours?: {
    periods: { openDay: string; openTime: string; closeDay: string; closeTime: string }[];
  };
  categories?: { primaryCategory?: { displayName: string }; additionalCategories?: { displayName: string }[] };
  metadata?: { hasGoogleUpdated: boolean; canOperateLocalPost: boolean };
  profile?: { description: string };
  storefrontAddress?: Record<string, unknown>;
}

export interface GBPReview {
  name: string;
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

export interface GBPInsights {
  searchViews: number;
  mapViews: number;
  websiteClicks: number;
  directionRequests: number;
  phoneCalls: number;
  topSearchQueries: { query: string; count: number }[];
}

export interface GBPPost {
  name: string;
  summary: string;
  media?: { sourceUrl: string; mediaFormat: string }[];
  callToAction?: { actionType: string; url: string };
  createTime: string;
  updateTime: string;
  state: string;
}

export interface GBPPhoto {
  name: string;
  mediaFormat: string;
  googleUrl: string;
  category: string;
  createTime: string;
}

/* ---------- helpers ---------- */

const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
export function starToNumber(star: string): number {
  return STAR_MAP[star] ?? 0;
}

function isConfigured(): boolean {
  return !!(
    isGoogleConfigured() &&
    process.env.GBP_ACCOUNT_ID &&
    process.env.GBP_LOCATION_ID
  );
}

export function getConfigStatus(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!isGoogleConfigured()) missing.push('Google Service Account');
  if (!process.env.GBP_ACCOUNT_ID) missing.push('GBP_ACCOUNT_ID');
  if (!process.env.GBP_LOCATION_ID) missing.push('GBP_LOCATION_ID');
  return { configured: missing.length === 0, missing };
}

/* ---------- auth ---------- */

async function getAccessToken(): Promise<string> {
  if (!isConfigured()) throw new Error('Google Business Profile API not configured');

  const key = await getGoogleCredentialsAsync();
  const now = Math.floor(Date.now() / 1000);

  // Build JWT
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/business.manage',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  ).toString('base64url');

  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(key.private_key, 'base64url');

  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google auth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function gbpFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const base = 'https://mybusinessbusinessinformation.googleapis.com/v1';
  // Some endpoints use different bases
  let url: string;
  if (path.startsWith('https://')) {
    url = path;
  } else {
    url = `${base}/${path}`;
  }
  return fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}

/* ---------- location ---------- */

const accountId = () => process.env.GBP_ACCOUNT_ID!;
const locationId = () => process.env.GBP_LOCATION_ID!;
const locationPath = () => `${accountId()}/${locationId()}`;

export async function getLocationInfo(): Promise<GBPLocationInfo> {
  const res = await gbpFetch(locationPath());
  if (!res.ok) throw new Error(`Failed to fetch location: ${res.status}`);
  return res.json();
}

export async function updateLocationInfo(
  updates: Partial<Pick<GBPLocationInfo, 'title' | 'phoneNumbers' | 'websiteUri' | 'regularHours' | 'profile'>>,
): Promise<GBPLocationInfo> {
  const updateMask = Object.keys(updates).join(',');
  const res = await gbpFetch(`${locationPath()}?updateMask=${updateMask}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update location: ${res.status}`);
  return res.json();
}

/* ---------- reviews ---------- */

export async function getReviews(pageSize = 50): Promise<{ reviews: GBPReview[]; totalReviewCount: number; averageRating: number }> {
  const base = 'https://mybusiness.googleapis.com/v4';
  const res = await gbpFetch(`${base}/${accountId()}/${locationId()}/reviews?pageSize=${pageSize}`);
  if (!res.ok) throw new Error(`Failed to fetch reviews: ${res.status}`);
  const data = await res.json();
  return {
    reviews: data.reviews || [],
    totalReviewCount: data.totalReviewCount || 0,
    averageRating: data.averageRating || 0,
  };
}

export async function replyToReview(reviewId: string, reply: string): Promise<void> {
  const base = 'https://mybusiness.googleapis.com/v4';
  const path = `${base}/${accountId()}/${locationId()}/reviews/${reviewId}/reply`;
  const res = await gbpFetch(path, {
    method: 'PUT',
    body: JSON.stringify({ comment: reply }),
  });
  if (!res.ok) throw new Error(`Failed to reply to review: ${res.status}`);
}

/* ---------- insights ---------- */

export async function getInsights(startDate: string, endDate: string): Promise<GBPInsights> {
  const base = 'https://mybusiness.googleapis.com/v4';
  const metrics = [
    'QUERIES_DIRECT',
    'QUERIES_INDIRECT',
    'VIEWS_MAPS',
    'VIEWS_SEARCH',
    'ACTIONS_WEBSITE',
    'ACTIONS_DRIVING_DIRECTIONS',
    'ACTIONS_PHONE',
  ];
  const res = await gbpFetch(
    `${base}/${accountId()}/${locationId()}/reportInsights`,
    {
      method: 'POST',
      body: JSON.stringify({
        locationNames: [`${accountId()}/${locationId()}`],
        basicRequest: {
          metricRequests: metrics.map((m) => ({ metric: m })),
          timeRange: { startTime: `${startDate}T00:00:00Z`, endTime: `${endDate}T23:59:59Z` },
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`Failed to fetch insights: ${res.status}`);
  const data = await res.json();

  // Parse the response into a flat structure
  const metricValues: Record<string, number> = {};
  const locationMetrics = data.locationMetrics?.[0]?.metricValues || [];
  for (const mv of locationMetrics) {
    const total = mv.totalValue?.value || mv.dimensionalValues?.reduce((s: number, d: { value: number }) => s + (d.value || 0), 0) || 0;
    metricValues[mv.metric] = Number(total);
  }

  return {
    searchViews: (metricValues.QUERIES_DIRECT || 0) + (metricValues.QUERIES_INDIRECT || 0),
    mapViews: metricValues.VIEWS_MAPS || 0,
    websiteClicks: metricValues.ACTIONS_WEBSITE || 0,
    directionRequests: metricValues.ACTIONS_DRIVING_DIRECTIONS || 0,
    phoneCalls: metricValues.ACTIONS_PHONE || 0,
    topSearchQueries: [], // Requires separate Performance API call
  };
}

/* ---------- posts ---------- */

export async function createPost(post: {
  summary: string;
  media?: { url: string };
  callToAction?: { actionType: string; url: string };
}): Promise<GBPPost> {
  const base = 'https://mybusiness.googleapis.com/v4';
  const body: Record<string, unknown> = {
    languageCode: 'en',
    summary: post.summary,
    topicType: 'STANDARD',
  };
  if (post.media) {
    body.media = [{ sourceUrl: post.media.url, mediaFormat: 'PHOTO' }];
  }
  if (post.callToAction) {
    body.callToAction = post.callToAction;
  }

  const res = await gbpFetch(`${base}/${accountId()}/${locationId()}/localPosts`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create post: ${res.status}`);
  return res.json();
}

export async function listPosts(): Promise<GBPPost[]> {
  const base = 'https://mybusiness.googleapis.com/v4';
  const res = await gbpFetch(`${base}/${accountId()}/${locationId()}/localPosts`);
  if (!res.ok) throw new Error(`Failed to list posts: ${res.status}`);
  const data = await res.json();
  return data.localPosts || [];
}

/* ---------- photos ---------- */

export async function getPhotos(): Promise<GBPPhoto[]> {
  const base = 'https://mybusiness.googleapis.com/v4';
  const res = await gbpFetch(`${base}/${accountId()}/${locationId()}/media`);
  if (!res.ok) throw new Error(`Failed to list photos: ${res.status}`);
  const data = await res.json();
  return data.mediaItems || [];
}

export async function uploadPhoto(category: string, url: string): Promise<GBPPhoto> {
  const base = 'https://mybusiness.googleapis.com/v4';
  const res = await gbpFetch(`${base}/${accountId()}/${locationId()}/media`, {
    method: 'POST',
    body: JSON.stringify({
      mediaFormat: 'PHOTO',
      locationAssociation: { category },
      sourceUrl: url,
    }),
  });
  if (!res.ok) throw new Error(`Failed to upload photo: ${res.status}`);
  return res.json();
}

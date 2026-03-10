/**
 * Google Calendar API integration for appointment sync.
 *
 * Uses the existing Google Service Account to create/update/delete
 * calendar events when appointments are booked, modified, or cancelled.
 *
 * Required env vars:
 *   Google SA credentials (via google-auth helper)
 *   GOOGLE_CALENDAR_ID — the calendar to sync with (e.g. primary or a specific calendar ID)
 */

import { getGoogleCredentials, isGoogleConfigured } from './google-auth';

const CALENDAR_ID = () => process.env.GOOGLE_CALENDAR_ID || 'primary';
const TIMEZONE = 'Asia/Karachi'; // Lahore clinic timezone

// ── Auth ──────────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (!isCalendarConfigured()) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  try {
    const sa = getGoogleCredentials();
    const now = Math.floor(Date.now() / 1000);

    const toBase64Url = (str: string) => Buffer.from(str).toString('base64url');
    const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = toBase64Url(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/calendar',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      }),
    );

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
      console.error('[google-calendar] Token request failed:', await res.text());
      return null;
    }

    const data = await res.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };
    return cachedToken.token;
  } catch (err) {
    console.error('[google-calendar] Access token error:', err);
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────

export function isCalendarConfigured(): boolean {
  return isGoogleConfigured() && !!process.env.GOOGLE_CALENDAR_ID;
}

interface AppointmentData {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  treatment: string;
  doctor?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration_min?: number;
  notes?: string | null;
  status?: string;
}

function buildEvent(appt: AppointmentData) {
  const startDateTime = `${appt.date}T${appt.time}:00`;
  const durationMs = (appt.duration_min || 30) * 60 * 1000;
  const endDate = new Date(new Date(startDateTime).getTime() + durationMs);
  const endHours = String(endDate.getHours()).padStart(2, '0');
  const endMins = String(endDate.getMinutes()).padStart(2, '0');
  const endDateTime = `${appt.date}T${endHours}:${endMins}:00`;

  const description = [
    `Treatment: ${appt.treatment}`,
    appt.doctor ? `Doctor: ${appt.doctor}` : null,
    `Phone: ${appt.phone}`,
    appt.email ? `Email: ${appt.email}` : null,
    appt.notes ? `\nNotes: ${appt.notes}` : null,
    `\nStatus: ${appt.status || 'scheduled'}`,
    `Appointment ID: ${appt.id}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    summary: `${appt.name} — ${appt.treatment}`,
    description,
    start: { dateTime: startDateTime, timeZone: TIMEZONE },
    end: { dateTime: endDateTime, timeZone: TIMEZONE },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 120 }, // 2h before
        { method: 'popup', minutes: 1440 }, // 24h before
      ],
    },
  };
}

// ── CRUD Operations ──────────────────────────────────────────────

/**
 * Create a calendar event for an appointment.
 * Returns the Google Calendar event ID, or null if calendar is not configured.
 */
export async function createCalendarEvent(appt: AppointmentData): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const event = buildEvent(appt);
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID())}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    );

    if (!res.ok) {
      console.error('[google-calendar] Create event failed:', await res.text());
      return null;
    }

    const data = await res.json();
    console.info(`[google-calendar] Created event ${data.id} for appointment ${appt.id}`);
    return data.id;
  } catch (err) {
    console.error('[google-calendar] Create event error:', err);
    return null;
  }
}

/**
 * Update an existing calendar event when appointment details change.
 */
export async function updateCalendarEvent(
  calendarEventId: string,
  appt: AppointmentData,
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const event = buildEvent(appt);
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID())}/events/${encodeURIComponent(calendarEventId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    );

    if (!res.ok) {
      console.error('[google-calendar] Update event failed:', await res.text());
      return false;
    }

    console.info(`[google-calendar] Updated event ${calendarEventId} for appointment ${appt.id}`);
    return true;
  } catch (err) {
    console.error('[google-calendar] Update event error:', err);
    return false;
  }
}

/**
 * Delete a calendar event when an appointment is cancelled.
 */
export async function deleteCalendarEvent(calendarEventId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID())}/events/${encodeURIComponent(calendarEventId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!res.ok && res.status !== 410) {
      console.error('[google-calendar] Delete event failed:', await res.text());
      return false;
    }

    console.info(`[google-calendar] Deleted event ${calendarEventId}`);
    return true;
  } catch (err) {
    console.error('[google-calendar] Delete event error:', err);
    return false;
  }
}

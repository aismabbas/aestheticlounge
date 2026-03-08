import { createHash } from 'crypto';

/**
 * Server-side Meta Conversions API (CAPI) helper.
 * Use in API routes / server actions only — never import on the client.
 */

type CAPIEventName = 'Lead' | 'Schedule' | 'Purchase' | 'ViewContent' | 'Contact';

interface CAPIParams {
  eventName: CAPIEventName;
  eventSourceUrl: string;
  userData: {
    email?: string;
    phone?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_category?: string;
  };
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export async function sendCAPIEvent(params: CAPIParams): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('[CAPI] Missing META_PIXEL_ID or META_ACCESS_TOKEN — skipping event');
    return;
  }

  const { eventName, eventSourceUrl, userData, customData } = params;

  const userDataPayload: Record<string, string | undefined> = {};
  if (userData.email) userDataPayload.em = sha256(userData.email);
  if (userData.phone) userDataPayload.ph = sha256(userData.phone.replace(/\D/g, ''));
  if (userData.fbp) userDataPayload.fbp = userData.fbp;
  if (userData.fbc) userDataPayload.fbc = userData.fbc;

  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userDataPayload,
    ...(customData && { custom_data: customData }),
  };

  const url = `https://graph.facebook.com/v21.0/${pixelId}/events`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [event],
        access_token: accessToken,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[CAPI] ${eventName} failed (${res.status}):`, body);
    }
  } catch (err) {
    console.error(`[CAPI] ${eventName} network error:`, err);
  }
}

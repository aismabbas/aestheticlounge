import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendCAPIEvent } from '@/lib/capi';
import { ulid } from '@/lib/ulid';
import { getNextAssignee, assignLead } from '@/lib/lead-assignment';

/* ------------------------------------------------------------------ */
/*  GET — Meta Webhook Verification Handshake                          */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error('[meta-webhook] META_WEBHOOK_VERIFY_TOKEN not configured');
    return new NextResponse('Server not configured', { status: 500 });
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[meta-webhook] Verification successful');
    // Meta expects the raw challenge value as plain text
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[meta-webhook] Verification failed — token mismatch');
  return new NextResponse('Forbidden', { status: 403 });
}

/* ------------------------------------------------------------------ */
/*  POST — Receive leadgen webhook events from Meta                    */
/* ------------------------------------------------------------------ */

interface MetaLeadValue {
  form_id: string;
  leadgen_id: string;
  created_time: number;
  page_id: string;
  ad_id?: string;
  adgroup_id?: string;
}

interface MetaChange {
  field: string;
  value: MetaLeadValue;
}

interface MetaEntry {
  id: string;
  time: number;
  changes: MetaChange[];
}

interface MetaWebhookPayload {
  object: string;
  entry: MetaEntry[];
}

interface MetaFieldData {
  name: string;
  values: string[];
}

interface MetaLeadData {
  id: string;
  created_time: string;
  field_data: MetaFieldData[];
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  form_name?: string;
}

export async function POST(req: NextRequest) {
  // Respond 200 immediately — Meta requires fast acknowledgement
  // Process asynchronously via fire-and-forget
  let payload: MetaWebhookPayload;

  try {
    payload = await req.json();
  } catch {
    console.error('[meta-webhook] Invalid JSON body');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (payload.object !== 'page') {
    return NextResponse.json({ received: true });
  }

  // Process each lead event (fire-and-forget so we return 200 quickly)
  const leadEvents: MetaLeadValue[] = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field === 'leadgen') {
        leadEvents.push(change.value);
      }
    }
  }

  if (leadEvents.length > 0) {
    // Process in background — don't await
    processLeadEvents(leadEvents).catch((err) =>
      console.error('[meta-webhook] Background processing error:', err),
    );
  }

  return NextResponse.json({ received: true });
}

/* ------------------------------------------------------------------ */
/*  Background lead processing                                         */
/* ------------------------------------------------------------------ */

async function processLeadEvents(events: MetaLeadValue[]): Promise<void> {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('[meta-webhook] META_ACCESS_TOKEN not configured — cannot fetch lead data');
    return;
  }

  for (const event of events) {
    try {
      await processOneLead(event, accessToken);
    } catch (err) {
      console.error(`[meta-webhook] Failed to process lead ${event.leadgen_id}:`, err);
    }
  }
}

async function processOneLead(event: MetaLeadValue, accessToken: string): Promise<void> {
  // 1. Fetch full lead data from Meta Graph API
  const graphUrl = `https://graph.facebook.com/v19.0/${event.leadgen_id}?access_token=${accessToken}`;
  const res = await fetch(graphUrl);

  if (!res.ok) {
    const body = await res.text();
    console.error(`[meta-webhook] Graph API error (${res.status}):`, body);
    return;
  }

  const leadData: MetaLeadData = await res.json();
  console.log(`[meta-webhook] Fetched lead ${event.leadgen_id}:`, JSON.stringify(leadData));

  // 2. Extract form fields
  const fields = extractFields(leadData.field_data || []);

  const name = fields.full_name || fields.name || 'Unknown';
  const phone = fields.phone_number || fields.phone || '';
  const email = fields.email || '';
  const treatment = fields.treatment || fields.treatment_interest || fields.service || '';
  const message = fields.message || fields.comments || '';

  // 3. Insert into al_leads
  const leadId = ulid();
  const campaignName = leadData.campaign_name || '';

  await query(
    `INSERT INTO al_leads (
      id, name, phone, email, treatment, message, source,
      utm_source, utm_medium, utm_campaign, utm_content,
      form_id, ad_id, landing_page, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, 'meta_form',
      'facebook', 'paid', $7, $8,
      $9, $10, $11, NOW()
    )`,
    [
      leadId,
      name,
      phone,
      email || null,
      treatment || null,
      message || null,
      campaignName || null,
      leadData.adset_name || null,
      event.form_id || leadData.form_id || null,
      event.ad_id || leadData.ad_id || null,
      leadData.form_name || null,
    ],
  );

  console.log(`[meta-webhook] Inserted lead ${leadId} (${name})`);

  // 3b. Auto-assign to call center staff (round-robin)
  try {
    const staffId = await getNextAssignee();
    if (staffId) {
      await assignLead(leadId, staffId);
      console.log(`[meta-webhook] Assigned lead ${leadId} to staff ${staffId}`);
    }
  } catch (err) {
    console.error('[meta-webhook] auto-assign error:', err);
  }

  // 4. Fire Meta CAPI Lead event to close the loop
  sendCAPIEvent({
    eventName: 'Lead',
    eventSourceUrl: 'https://aestheticloungeofficial.com',
    userData: {
      email: email || undefined,
      phone: phone || undefined,
    },
    customData: {
      content_name: treatment || 'meta_form_lead',
    },
  }).catch((err) => console.error('[meta-webhook] CAPI error:', err));

}

/**
 * Extract key-value pairs from Meta form field_data array.
 * field_data format: [{ name: "full_name", values: ["John Doe"] }, ...]
 */
function extractFields(fieldData: MetaFieldData[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of fieldData) {
    if (field.values && field.values.length > 0) {
      result[field.name] = field.values[0];
    }
  }
  return result;
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendCAPIEvent } from '@/lib/capi';
import { ulid } from '@/lib/ulid';

/* ------------------------------------------------------------------ */
/*  POST — Simulate a Meta lead form submission for testing            */
/* ------------------------------------------------------------------ */

interface TestLeadPayload {
  name: string;
  phone: string;
  email?: string;
  treatment?: string;
  message?: string;
  form_id?: string;
  ad_id?: string;
  campaign_name?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: TestLeadPayload = await req.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'name and phone are required' },
        { status: 400 },
      );
    }

    const leadId = ulid();

    // Insert into al_leads matching the real webhook flow
    await query(
      `INSERT INTO al_leads (
        id, name, phone, email, treatment, message, source,
        utm_source, utm_medium, utm_campaign, utm_content,
        form_id, ad_id, landing_page, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'meta_form',
        'facebook', 'paid', $7, NULL,
        $8, $9, 'test_submission', NOW()
      )`,
      [
        leadId,
        body.name,
        body.phone,
        body.email || null,
        body.treatment || null,
        body.message || null,
        body.campaign_name || 'test_campaign',
        body.form_id || 'test_form_001',
        body.ad_id || 'test_ad_001',
      ],
    );

    // Fire CAPI event (same as real flow)
    sendCAPIEvent({
      eventName: 'Lead',
      eventSourceUrl: 'https://aestheticloungeofficial.com',
      userData: {
        email: body.email,
        phone: body.phone,
      },
      customData: {
        content_name: body.treatment || 'test_meta_form_lead',
      },
    }).catch((err) => console.error('[meta-webhook-test] CAPI error:', err));

    console.log(`[meta-webhook-test] Created test lead ${leadId} (${body.name})`);

    return NextResponse.json({ success: true, leadId });
  } catch (err) {
    console.error('[meta-webhook-test] error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

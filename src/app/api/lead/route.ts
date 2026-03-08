import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendCAPIEvent } from '@/lib/capi';
import { ulid } from '@/lib/ulid';

interface LeadPayload {
  name: string;
  phone: string;
  email?: string;
  treatment?: string;
  message?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  landing_page?: string;
  form_id?: string;
  ad_id?: string;
  fbp?: string;
  fbc?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: LeadPayload = await req.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'name and phone are required' },
        { status: 400 },
      );
    }

    const leadId = ulid();

    // Insert into al_leads
    await query(
      `INSERT INTO al_leads (id, name, phone, email, treatment, message,
        utm_source, utm_medium, utm_campaign, utm_content,
        landing_page, form_id, ad_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [
        leadId,
        body.name,
        body.phone,
        body.email || null,
        body.treatment || null,
        body.message || null,
        body.utm_source || null,
        body.utm_medium || null,
        body.utm_campaign || null,
        body.utm_content || null,
        body.landing_page || null,
        body.form_id || null,
        body.ad_id || null,
      ],
    );

    // Fire Meta CAPI Lead event
    const eventSourceUrl = req.headers.get('referer') || 'https://aestheticloungeofficial.com';
    sendCAPIEvent({
      eventName: 'Lead',
      eventSourceUrl,
      userData: {
        email: body.email,
        phone: body.phone,
        fbp: body.fbp,
        fbc: body.fbc,
      },
      customData: {
        content_name: body.treatment || 'general_inquiry',
      },
    }).catch((err) => console.error('[lead] CAPI error:', err));

    // Trigger n8n webhook
    fetch('https://webhook.awansoft.ca/webhook/al-marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'new_lead',
        leadId,
        name: body.name,
        phone: body.phone,
        email: body.email,
        treatment: body.treatment,
        message: body.message,
        utm_source: body.utm_source,
        utm_medium: body.utm_medium,
        utm_campaign: body.utm_campaign,
      }),
    }).catch((err) => console.error('[lead] n8n webhook error:', err));

    return NextResponse.json({ success: true, leadId });
  } catch (err) {
    console.error('[lead] error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

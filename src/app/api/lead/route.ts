import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendCAPIEvent } from '@/lib/capi';
import { ulid } from '@/lib/ulid';
import { getNextAssignee, assignLead } from '@/lib/lead-assignment';

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
    let body: LeadPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'name and phone are required' },
        { status: 400 },
      );
    }

    const leadId = ulid();

    // Insert into al_leads
    await query(
      `INSERT INTO al_leads (id, name, phone, email, treatment, message, source,
        utm_source, utm_medium, utm_campaign, utm_content,
        landing_page, form_id, ad_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
      [
        leadId,
        body.name,
        body.phone,
        body.email || null,
        body.treatment || null,
        body.message || null,
        'website',
        body.utm_source || null,
        body.utm_medium || null,
        body.utm_campaign || null,
        body.utm_content || null,
        body.landing_page || null,
        body.form_id || null,
        body.ad_id || null,
      ],
    );

    // Auto-assign lead to call center staff (round-robin)
    getNextAssignee()
      .then((staffId) => {
        if (staffId) return assignLead(leadId, staffId);
      })
      .catch((err) => console.error('[lead] auto-assign error:', err));

    // Fire Meta CAPI Lead event
    const eventSourceUrl = req.headers.get('referer') || 'https://aestheticloungeofficial.com';
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
    const clientUa = req.headers.get('user-agent') || undefined;
    sendCAPIEvent({
      eventName: 'Lead',
      eventSourceUrl,
      userData: {
        email: body.email,
        phone: body.phone,
        fbp: body.fbp,
        fbc: body.fbc,
        clientIpAddress: clientIp,
        clientUserAgent: clientUa,
      },
      customData: {
        content_name: body.treatment || 'general_inquiry',
      },
    }).catch((err) => console.error('[lead] CAPI error:', err));

    return NextResponse.json({ success: true, leadId });
  } catch (err) {
    console.error('[lead] error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

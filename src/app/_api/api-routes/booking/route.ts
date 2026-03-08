import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendCAPIEvent } from '@/lib/capi';
import { ulid } from '@/lib/ulid';

interface BookingPayload {
  name: string;
  phone: string;
  email?: string;
  treatment: string;
  date: string;
  time: string;
  notes?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  fbp?: string;
  fbc?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: BookingPayload = await req.json();

    if (!body.name || !body.phone || !body.treatment || !body.date || !body.time) {
      return NextResponse.json(
        { success: false, error: 'name, phone, treatment, date, and time are required' },
        { status: 400 },
      );
    }

    const appointmentId = ulid();
    const leadId = ulid();

    // Upsert into al_leads (create or update by phone)
    await query(
      `INSERT INTO al_leads (id, name, phone, email, treatment,
        utm_source, utm_medium, utm_campaign, utm_content, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (phone) DO UPDATE SET
         name = EXCLUDED.name,
         email = COALESCE(EXCLUDED.email, al_leads.email),
         treatment = EXCLUDED.treatment,
         updated_at = NOW()`,
      [
        leadId,
        body.name,
        body.phone,
        body.email || null,
        body.treatment,
        body.utm_source || null,
        body.utm_medium || null,
        body.utm_campaign || null,
        body.utm_content || null,
      ],
    );

    // Insert into al_appointments
    await query(
      `INSERT INTO al_appointments (id, name, phone, email, treatment, date, time, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        appointmentId,
        body.name,
        body.phone,
        body.email || null,
        body.treatment,
        body.date,
        body.time,
        body.notes || null,
      ],
    );

    // Fire Meta CAPI Schedule event
    const eventSourceUrl = req.headers.get('referer') || 'https://aestheticloungeofficial.com';
    sendCAPIEvent({
      eventName: 'Schedule',
      eventSourceUrl,
      userData: {
        email: body.email,
        phone: body.phone,
        fbp: body.fbp,
        fbc: body.fbc,
      },
      customData: {
        content_name: body.treatment,
      },
    }).catch((err) => console.error('[booking] CAPI error:', err));

    // Trigger n8n webhook
    fetch('https://webhook.awansoft.ca/webhook/al-marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'new_booking',
        appointmentId,
        name: body.name,
        phone: body.phone,
        email: body.email,
        treatment: body.treatment,
        date: body.date,
        time: body.time,
        notes: body.notes,
        utm_source: body.utm_source,
        utm_medium: body.utm_medium,
        utm_campaign: body.utm_campaign,
      }),
    }).catch((err) => console.error('[booking] n8n webhook error:', err));

    return NextResponse.json({ success: true, appointmentId });
  } catch (err) {
    console.error('[booking] error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

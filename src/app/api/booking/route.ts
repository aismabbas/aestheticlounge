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

    // Check if lead exists by phone, update or create
    const existing = await query(
      `SELECT id FROM al_leads WHERE phone = $1 LIMIT 1`,
      [body.phone],
    );

    if (existing.rows.length > 0) {
      await query(
        `UPDATE al_leads SET name = $1, email = COALESCE($2, email), treatment = $3, updated_at = NOW()
         WHERE phone = $4`,
        [body.name, body.email || null, body.treatment, body.phone],
      );
    } else {
      await query(
        `INSERT INTO al_leads (id, name, phone, email, treatment, source,
          utm_source, utm_medium, utm_campaign, utm_content, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          leadId,
          body.name,
          body.phone,
          body.email || null,
          body.treatment,
          'booking',
          body.utm_source || null,
          body.utm_medium || null,
          body.utm_campaign || null,
          body.utm_content || null,
        ],
      );
    }

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
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
    const clientUa = req.headers.get('user-agent') || undefined;
    sendCAPIEvent({
      eventName: 'Schedule',
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
        content_name: body.treatment,
      },
    }).catch((err) => console.error('[booking] CAPI error:', err));

    return NextResponse.json({ success: true, appointmentId });
  } catch (err) {
    console.error('[booking] error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

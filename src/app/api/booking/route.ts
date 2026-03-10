import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendCAPIEvent } from '@/lib/capi';
import { ulid } from '@/lib/ulid';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { createCalendarEvent } from '@/lib/google-calendar';

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

// Strip HTML tags to prevent stored XSS
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BOOKING_DAYS_AHEAD = 180; // 6 months

export async function POST(req: NextRequest) {
  // Rate limit: 5 bookings per IP per 10 minutes
  const ip = getClientIp(req.headers);
  if (isRateLimited(`booking:${ip}`, 10 * 60_000, 5)) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  try {
    let body: BookingPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    // Sanitize inputs first, then validate
    if (body.name) body.name = stripHtml(body.name).slice(0, 200);
    if (body.phone) body.phone = body.phone.trim().slice(0, 30);
    if (body.treatment) body.treatment = stripHtml(body.treatment).slice(0, 200);

    if (!body.name || !body.phone || !body.treatment || !body.date || !body.time) {
      return NextResponse.json(
        { success: false, error: 'name, phone, treatment, date, and time are required' },
        { status: 400 },
      );
    }
    if (body.notes) body.notes = stripHtml(body.notes).slice(0, 2000);
    if (body.email) {
      body.email = body.email.trim().slice(0, 200);
      if (!EMAIL_REGEX.test(body.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 },
        );
      }
    }

    // Validate date and time format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!dateRegex.test(body.date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 },
      );
    }
    if (!timeRegex.test(body.time)) {
      return NextResponse.json(
        { success: false, error: 'Invalid time format. Use HH:MM (00:00-23:59)' },
        { status: 400 },
      );
    }

    // Reject past dates (use clinic timezone: Asia/Karachi, UTC+5)
    const bookingDate = new Date(body.date + 'T00:00:00');
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date' },
        { status: 400 },
      );
    }
    // Get today's date in Lahore timezone
    const lahoreNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
    const today = new Date(lahoreNow.getFullYear(), lahoreNow.getMonth(), lahoreNow.getDate());
    if (bookingDate < today) {
      return NextResponse.json(
        { success: false, error: 'Booking date cannot be in the past' },
        { status: 400 },
      );
    }
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + MAX_BOOKING_DAYS_AHEAD);
    if (bookingDate > maxDate) {
      return NextResponse.json(
        { success: false, error: `Booking date cannot be more than ${MAX_BOOKING_DAYS_AHEAD} days in the future` },
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

    // Sync to Google Calendar (fire-and-forget)
    createCalendarEvent({
      id: appointmentId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      treatment: body.treatment,
      date: body.date,
      time: body.time,
    }).then(async (eventId) => {
      if (eventId) {
        await query(
          `UPDATE al_appointments SET calendar_event_id = $1 WHERE id = $2`,
          [eventId, appointmentId],
        );
      }
    }).catch((err) => console.error('[booking] Calendar sync error:', err));

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

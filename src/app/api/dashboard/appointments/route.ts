import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';
import { checkAuth } from '@/lib/api-auth';
import { createCalendarEvent } from '@/lib/google-calendar';

export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const date = req.nextUrl.searchParams.get('date');
    const doctor = req.nextUrl.searchParams.get('doctor');
    const status = req.nextUrl.searchParams.get('status');
    const range = req.nextUrl.searchParams.get('range');

    let sql = 'SELECT * FROM al_appointments';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (date) {
      params.push(date);
      conditions.push(`date = $${params.length}`);
    } else if (range) {
      if (range === 'today') {
        conditions.push(`date = CURRENT_DATE`);
      } else if (range === 'week') {
        conditions.push(`date >= CURRENT_DATE AND date < CURRENT_DATE + INTERVAL '7 days'`);
      } else if (range === 'month') {
        conditions.push(`date >= CURRENT_DATE AND date < CURRENT_DATE + INTERVAL '30 days'`);
      }
    }

    if (doctor) {
      params.push(doctor);
      conditions.push(`doctor = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY date ASC, time ASC';

    const result = await query(sql, params);
    return NextResponse.json({ appointments: result.rows });
  } catch (err) {
    console.error('[dashboard/appointments] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, treatment, doctor, date, time, duration_min, notes, source } = body;

    if (!name || !phone || !treatment || !date || !time) {
      return NextResponse.json(
        { error: 'name, phone, treatment, date, and time are required' },
        { status: 400 },
      );
    }

    const appointmentId = ulid();

    const result = await query(
      `INSERT INTO al_appointments (id, name, phone, treatment, doctor, date, time, duration_min, notes, source, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled', NOW())
       RETURNING *`,
      [appointmentId, name, phone, treatment, doctor || null, date, time, duration_min || 30, notes || null, source || 'dashboard'],
    );

    // Upsert lead: create if phone not found, update stage if exists
    const existingLead = await query('SELECT id FROM al_leads WHERE phone = $1', [phone]);
    if (existingLead.rows.length === 0) {
      const leadId = ulid();
      await query(
        `INSERT INTO al_leads (id, name, phone, treatment, stage, source, created_at)
         VALUES ($1, $2, $3, $4, 'booked', $5, NOW())`,
        [leadId, name, phone, treatment, source || 'dashboard'],
      );
    } else {
      await query(
        `UPDATE al_leads SET treatment = $1, stage = 'booked', updated_at = NOW() WHERE phone = $2`,
        [treatment, phone],
      );
    }

    // Sync to Google Calendar (fire-and-forget)
    createCalendarEvent({
      id: appointmentId,
      name,
      phone,
      treatment,
      doctor,
      date,
      time,
      duration_min: duration_min || 30,
      notes,
    }).then(async (eventId) => {
      if (eventId) {
        await query(
          `UPDATE al_appointments SET calendar_event_id = $1 WHERE id = $2`,
          [eventId, appointmentId],
        );
      }
    }).catch((err) => console.error('[dashboard/appointments] Calendar sync error:', err));

    return NextResponse.json({ appointment: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[dashboard/appointments] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

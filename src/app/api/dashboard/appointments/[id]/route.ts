import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAuth } from '@/lib/api-auth';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const result = await query('SELECT * FROM al_appointments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('[dashboard/appointments/[id]] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const allowedFields = ['status', 'notes', 'price', 'doctor', 'date', 'time', 'duration_min'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        values.push(body[field]);
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const sql = `UPDATE al_appointments SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;

    const result = await query(sql, values);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const appointment = result.rows[0];

    // Sync calendar event (awaited — Netlify kills background tasks after response)
    try {
      if (appointment.calendar_event_id) {
        if (body.status === 'cancelled') {
          await deleteCalendarEvent(appointment.calendar_event_id);
        } else if (body.date || body.time || body.doctor || body.status || body.duration_min || body.notes) {
          await updateCalendarEvent(appointment.calendar_event_id, appointment);
        }
      } else if (body.status !== 'cancelled') {
        const calEventId = await createCalendarEvent(appointment);
        if (calEventId) {
          await query(
            `UPDATE al_appointments SET calendar_event_id = $1 WHERE id = $2`,
            [calEventId, appointment.id],
          );
        }
      }
    } catch (err) {
      console.error('[appointments] Calendar sync error:', err);
    }

    // When status changes to 'completed', update lead and client records
    if (body.status === 'completed') {
      const phone = appointment.phone;
      const price = appointment.price || 0;

      // Update lead stage
      await query(
        `UPDATE al_leads SET stage = 'visited', updated_at = NOW() WHERE phone = $1`,
        [phone],
      );

      // Update client visit_count, total_spent, last_visit
      await query(
        `UPDATE al_clients
         SET visit_count = visit_count + 1,
             total_spent = total_spent + $1,
             last_visit = NOW()
         WHERE phone = $2`,
        [price, phone],
      );
    }

    return NextResponse.json(appointment);
  } catch (err) {
    console.error('[dashboard/appointments/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

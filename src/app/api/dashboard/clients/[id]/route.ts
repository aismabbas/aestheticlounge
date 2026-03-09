import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAuth } from '@/lib/api-auth';

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

    const client = await query('SELECT * FROM al_clients WHERE id = $1', [id]);
    if (client.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const [appointments, photos, payments] = await Promise.all([
      query(
        'SELECT * FROM al_appointments WHERE phone = $1 ORDER BY date DESC, time DESC',
        [client.rows[0].phone],
      ),
      query(
        'SELECT * FROM al_client_photos WHERE client_id = $1 ORDER BY taken_at DESC',
        [id],
      ),
      query(
        'SELECT * FROM al_payments WHERE client_id = $1 ORDER BY created_at DESC',
        [id],
      ),
    ]);

    return NextResponse.json({
      client: client.rows[0],
      appointments: appointments.rows,
      photos: photos.rows,
      payments: payments.rows,
    });
  } catch (err) {
    console.error('[dashboard/clients/[id]] error:', err);
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

    const allowedFields = [
      'name', 'phone', 'email', 'notes', 'preferred_doctor', 'treatments',
      'photo_consent', 'do_not_disturb', 'medical_history',
      'skin_type', 'allergies', 'gender', 'date_of_birth', 'tags', 'wa_opted_in',
    ];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'treatments' || field === 'medical_history') {
          values.push(JSON.stringify(body[field]));
        } else if (field === 'tags') {
          // Convert array to PostgreSQL text[] format
          const tagsArr = Array.isArray(body[field]) ? body[field] : [];
          values.push(tagsArr);
          updates.push(`${field} = $${values.length}::text[]`);
          continue;
        } else {
          values.push(body[field]);
        }
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const sql = `UPDATE al_clients SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;

    const result = await query(sql, values);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('[dashboard/clients/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

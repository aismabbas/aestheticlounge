import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('al_session');
  if (!session?.value) return null;
  try {
    const data = JSON.parse(session.value);
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const lead = await query('SELECT * FROM al_leads WHERE id = $1', [id]);
    if (lead.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const l = lead.rows[0];

    // Check if client already exists for this lead
    const existing = await query('SELECT id FROM al_clients WHERE lead_id = $1', [id]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Lead already converted', clientId: existing.rows[0].id },
        { status: 400 },
      );
    }

    const clientId = ulid();
    await query(
      `INSERT INTO al_clients (id, lead_id, name, phone, email, first_visit, last_visit, visit_count, total_spent, treatments, notes)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), 0, 0, '[]'::jsonb, $6)`,
      [clientId, id, l.name, l.phone, l.email, l.notes],
    );

    await query("UPDATE al_leads SET stage = 'visited', updated_at = NOW() WHERE id = $1", [id]);

    const client = await query('SELECT * FROM al_clients WHERE id = $1', [clientId]);

    return NextResponse.json({ client: client.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[dashboard/leads/[id]/convert] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

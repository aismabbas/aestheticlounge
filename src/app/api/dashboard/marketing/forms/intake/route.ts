import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await query(
      `SELECT f.id, f.client_id, f.token, f.status, f.sent_via, f.submitted_at, f.created_at,
              c.name AS client_name
       FROM al_intake_forms f
       LEFT JOIN al_clients c ON c.id = f.client_id
       ORDER BY f.created_at DESC
       LIMIT 100`,
    );

    return NextResponse.json({ forms: result.rows });
  } catch (err) {
    console.error('[forms/intake] GET error:', err);
    return NextResponse.json({ forms: [] });
  }
}

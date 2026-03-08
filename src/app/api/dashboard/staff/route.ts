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

export async function GET() {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await query('SELECT id, email, name, role, phone, active FROM al_staff ORDER BY name');
    return NextResponse.json({ staff: result.rows });
  } catch (err) {
    console.error('[dashboard/staff] GET error:', err);
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
    const { email, name, role, phone } = body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'email, name, and role are required' },
        { status: 400 },
      );
    }

    // Check for duplicate email
    const existing = await query('SELECT id FROM al_staff WHERE LOWER(email) = LOWER($1)', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Staff with this email already exists' }, { status: 400 });
    }

    const id = ulid();

    const result = await query(
      'INSERT INTO al_staff (id, email, name, role, phone, active) VALUES ($1, $2, $3, $4, $5, true) RETURNING id, email, name, role, phone, active',
      [id, email, name, role, phone || null],
    );

    return NextResponse.json({ staff: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[dashboard/staff] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

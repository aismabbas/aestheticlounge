import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import crypto from 'crypto';

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

export async function POST(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { client_id, sent_via } = body;

    if (!sent_via || !['whatsapp', 'email', 'ipad', 'link'].includes(sent_via)) {
      return NextResponse.json({ error: 'Invalid sent_via value' }, { status: 400 });
    }

    const token = crypto.randomUUID();

    const result = await query(
      `INSERT INTO al_intake_forms (client_id, token, status, sent_via)
       VALUES ($1, $2, 'pending', $3)
       RETURNING id, client_id, token, status, sent_via, created_at`,
      [client_id || null, token, sent_via],
    );

    const form = result.rows[0];
    const baseUrl = req.nextUrl.origin;
    const publicUrl = `${baseUrl}/intake/${token}`;

    return NextResponse.json({
      ...form,
      url: publicUrl,
    });
  } catch (err) {
    console.error('[api/intake] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* GET: List intake forms for a client (dashboard use) */
export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const clientId = req.nextUrl.searchParams.get('client_id');
    if (!clientId) {
      return NextResponse.json({ error: 'client_id required' }, { status: 400 });
    }

    const result = await query(
      `SELECT id, client_id, token, status, sent_via, submitted_at, created_at
       FROM al_intake_forms
       WHERE client_id = $1
       ORDER BY created_at DESC`,
      [clientId],
    );

    return NextResponse.json({ forms: result.rows });
  } catch (err) {
    console.error('[api/intake] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = req.nextUrl.searchParams.get('status');

    let sql = 'SELECT * FROM al_campaigns';
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      sql += ` WHERE status = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return NextResponse.json({ campaigns: result.rows });
  } catch (err) {
    console.error('[dashboard/campaigns] GET error:', err);
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
    const { name, treatment, budget_daily, headline, caption, creative_type } = body;

    if (!name || !treatment) {
      return NextResponse.json(
        { error: 'name and treatment are required' },
        { status: 400 },
      );
    }

    const id = ulid();

    const result = await query(
      `INSERT INTO al_campaigns (id, name, status, treatment, budget_daily, headline, caption, creative_type,
        budget_spent, impressions, clicks, leads, booked, revenue, cpl, cpa, roas, created_at)
       VALUES ($1, $2, 'draft', $3, $4, $5, $6, $7, 0, 0, 0, 0, 0, 0, 0, 0, 0, NOW())
       RETURNING *`,
      [id, name, treatment, budget_daily || 0, headline || null, caption || null, creative_type || null],
    );

    return NextResponse.json({ campaign: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[dashboard/campaigns] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

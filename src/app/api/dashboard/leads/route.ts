import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

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
    const stage = req.nextUrl.searchParams.get('stage');
    const source = req.nextUrl.searchParams.get('source');
    const search = req.nextUrl.searchParams.get('search');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);

    let sql = 'SELECT * FROM al_leads';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (stage) {
      params.push(stage);
      conditions.push(`stage = $${params.length}`);
    }
    if (source) {
      params.push(source);
      conditions.push(`utm_source = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR phone ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC';

    params.push(limit);
    sql += ` LIMIT $${params.length}`;

    const countSql = conditions.length > 0
      ? `SELECT COUNT(*) FROM al_leads WHERE ${conditions.join(' AND ')}`
      : 'SELECT COUNT(*) FROM al_leads';

    const [result, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, params.slice(0, -1)),
    ]);

    return NextResponse.json({
      leads: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error('[dashboard/leads] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

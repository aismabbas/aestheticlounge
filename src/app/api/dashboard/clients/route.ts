import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const search = req.nextUrl.searchParams.get('search');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);
    const sort = req.nextUrl.searchParams.get('sort') || 'last_visit';

    // Filter params
    const dnd = req.nextUrl.searchParams.get('dnd');
    const photoConsent = req.nextUrl.searchParams.get('photo_consent');
    const tag = req.nextUrl.searchParams.get('tag');
    const vip = req.nextUrl.searchParams.get('vip');
    const newClient = req.nextUrl.searchParams.get('new');

    const allowedSort = ['name', 'phone', 'visit_count', 'total_spent', 'last_visit', 'preferred_doctor', 'created_at'];
    const safeSort = allowedSort.includes(sort) ? sort : 'last_visit';

    let sql = 'SELECT * FROM al_clients';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(name ILIKE $${params.length} OR phone ILIKE $${params.length} OR $${params.length} ILIKE '%' || ANY(COALESCE(tags, '{}')) || '%')`
      );
    }

    if (dnd === 'true') {
      conditions.push('do_not_disturb = true');
    }

    if (photoConsent === 'true') {
      conditions.push('photo_consent = true');
    }

    if (tag) {
      params.push(tag);
      conditions.push(`$${params.length} = ANY(tags)`);
    }

    if (vip === 'true') {
      conditions.push('total_spent > 50000');
    }

    if (newClient === 'true') {
      conditions.push("first_visit >= NOW() - INTERVAL '30 days'");
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY ${safeSort} DESC NULLS LAST`;

    params.push(limit);
    sql += ` LIMIT $${params.length}`;

    const countConditions = conditions.length > 0
      ? ` WHERE ${conditions.join(' AND ')}`
      : '';
    const countSql = `SELECT COUNT(*) FROM al_clients${countConditions}`;

    const [result, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, params.slice(0, -1)),
    ]);

    // Collect all unique tags across clients for filter options
    const tagResult = await query(
      "SELECT DISTINCT unnest(tags) AS tag FROM al_clients WHERE tags IS NOT NULL AND tags != '{}' ORDER BY tag"
    );

    return NextResponse.json({
      clients: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      allTags: tagResult.rows.map((r: { tag: string }) => r.tag),
    });
  } catch (err) {
    console.error('[dashboard/clients] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

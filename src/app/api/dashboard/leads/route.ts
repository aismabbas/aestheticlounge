import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { getScoreLabel } from '@/lib/lead-scoring';

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
    const temperature = req.nextUrl.searchParams.get('temperature'); // hot|warm|cold
    const sort = req.nextUrl.searchParams.get('sort') || 'created_at';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);

    let sql = `SELECT id, name, phone, email, stage, quality, interest, source, campaign_id,
               created_at, notes, booked_treatment, actual_revenue,
               score, score_factors, utm_source, utm_medium, utm_campaign, utm_content,
               landing_page, pages_viewed, time_on_site, treatments_viewed,
               form_submissions, whatsapp_messages, last_activity_at,
               conversion_value, converted_at
               FROM al_leads`;
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
    if (temperature) {
      // Filter by score ranges
      if (temperature === 'hot') {
        conditions.push('score >= 70');
      } else if (temperature === 'warm') {
        conditions.push('score >= 40 AND score < 70');
      } else if (temperature === 'cold') {
        conditions.push('score < 40');
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Sort options
    if (sort === 'score') {
      sql += ' ORDER BY score DESC NULLS LAST, created_at DESC';
    } else if (sort === 'last_activity') {
      sql += ' ORDER BY last_activity_at DESC NULLS LAST, created_at DESC';
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    params.push(limit);
    sql += ` LIMIT $${params.length}`;

    // Count queries for stats (without limit)
    const baseWhere = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    const countParams = params.slice(0, -1); // exclude limit

    const [result, countResult, statsResult] = await Promise.all([
      query(sql, params),
      query(`SELECT COUNT(*) FROM al_leads${baseWhere}`, countParams),
      query(`SELECT
        COUNT(*)::int AS total_leads,
        COUNT(CASE WHEN score >= 70 THEN 1 END)::int AS hot_count,
        COUNT(CASE WHEN score >= 40 AND score < 70 THEN 1 END)::int AS warm_count,
        COUNT(CASE WHEN score < 40 OR score IS NULL THEN 1 END)::int AS cold_count,
        ROUND(AVG(COALESCE(score, 0)))::int AS avg_score,
        COUNT(CASE WHEN converted_at IS NOT NULL THEN 1 END)::int AS converted_count
      FROM al_leads`),
    ]);

    const stats = statsResult.rows[0];
    const conversionRate = stats.total_leads > 0
      ? Math.round((stats.converted_count / stats.total_leads) * 100)
      : 0;

    // Enrich leads with computed label
    const leads = result.rows.map((lead: Record<string, unknown>) => ({
      ...lead,
      score_label: getScoreLabel((lead.score as number) || 0),
    }));

    return NextResponse.json({
      leads,
      total: parseInt(countResult.rows[0].count, 10),
      stats: {
        total_leads: stats.total_leads,
        hot_count: stats.hot_count,
        warm_count: stats.warm_count,
        cold_count: stats.cold_count,
        conversion_rate: conversionRate,
        avg_score: stats.avg_score || 0,
      },
    });
  } catch (err) {
    console.error('[dashboard/leads] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getScoreLabel } from '@/lib/lead-scoring';
import { checkAuth } from '@/lib/api-auth';

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

    const assignedTo = req.nextUrl.searchParams.get('assigned_to');
    const myLeads = req.nextUrl.searchParams.get('my_leads') === 'true';

    let sql = `SELECT l.id, l.name, l.phone, l.email, l.stage, l.quality, l.interest, l.source, l.campaign_id,
               l.created_at, l.notes, l.booked_treatment, l.actual_revenue,
               l.score, l.score_factors, l.utm_source, l.utm_medium, l.utm_campaign, l.utm_content,
               l.landing_page, l.pages_viewed, l.time_on_site, l.treatments_viewed,
               l.form_submissions, l.whatsapp_messages, l.last_activity_at,
               l.conversion_value, l.converted_at, l.assigned_to,
               l.instagram_handle, l.facebook_id, l.whatsapp_number,
               l.booking_value, l.lifetime_value,
               s.name AS assigned_to_name,
               CASE WHEN rt.id IS NULL AND l.stage = 'new' THEN true ELSE false END AS is_uncontacted,
               COALESCE(appt_val.total_booked, 0) AS total_booked_value,
               COALESCE(appt_val.appt_count, 0) AS appointment_count,
               COALESCE(pay_val.total_paid, 0) AS total_paid_value,
               COALESCE(pay_val.pay_count, 0) AS payment_count,
               c.total_spent AS client_total_spent,
               c.id AS linked_client_id
               FROM al_leads l
               LEFT JOIN al_staff s ON s.id = l.assigned_to
               LEFT JOIN al_lead_response_times rt ON rt.lead_id = l.id
               LEFT JOIN al_clients c ON c.lead_id = l.id
               LEFT JOIN LATERAL (
                 SELECT COALESCE(SUM(CASE WHEN a.price IS NOT NULL THEN a.price::numeric ELSE 0 END), 0) AS total_booked,
                        COUNT(*) AS appt_count
                 FROM al_appointments a WHERE a.lead_id = l.id
               ) appt_val ON true
               LEFT JOIN LATERAL (
                 SELECT COALESCE(SUM(CASE WHEN p.amount IS NOT NULL THEN p.amount::numeric ELSE 0 END), 0) AS total_paid,
                        COUNT(*) AS pay_count
                 FROM al_payments p WHERE p.client_id = c.id AND p.status = 'completed'
               ) pay_val ON true`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (stage) {
      params.push(stage);
      conditions.push(`l.stage = $${params.length}`);
    }
    if (source) {
      params.push(source);
      conditions.push(`l.utm_source = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(l.name ILIKE $${params.length} OR l.phone ILIKE $${params.length})`);
    }
    if (temperature) {
      if (temperature === 'hot') {
        conditions.push('l.score >= 70');
      } else if (temperature === 'warm') {
        conditions.push('l.score >= 40 AND l.score < 70');
      } else if (temperature === 'cold') {
        conditions.push('l.score < 40');
      }
    }
    if (assignedTo) {
      params.push(assignedTo);
      conditions.push(`l.assigned_to = $${params.length}`);
    }
    if (myLeads) {
      params.push(user.staffId);
      conditions.push(`l.assigned_to = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Sort options
    if (sort === 'score') {
      sql += ' ORDER BY l.score DESC NULLS LAST, l.created_at DESC';
    } else if (sort === 'last_activity') {
      sql += ' ORDER BY l.last_activity_at DESC NULLS LAST, l.created_at DESC';
    } else {
      sql += ' ORDER BY l.created_at DESC';
    }

    params.push(limit);
    sql += ` LIMIT $${params.length}`;

    // Count queries for stats (without limit)
    const baseFrom = ` FROM al_leads l
      LEFT JOIN al_staff s ON s.id = l.assigned_to
      LEFT JOIN al_lead_response_times rt ON rt.lead_id = l.id`;
    const baseWhere = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    const countParams = params.slice(0, -1); // exclude limit

    const [result, countResult, statsResult, staffResult, valueResult] = await Promise.all([
      query(sql, params),
      query(`SELECT COUNT(*) ${baseFrom}${baseWhere}`, countParams),
      query(`SELECT
        COUNT(*)::int AS total_leads,
        COUNT(CASE WHEN score >= 70 THEN 1 END)::int AS hot_count,
        COUNT(CASE WHEN score >= 40 AND score < 70 THEN 1 END)::int AS warm_count,
        COUNT(CASE WHEN score < 40 OR score IS NULL THEN 1 END)::int AS cold_count,
        ROUND(AVG(COALESCE(score, 0)))::int AS avg_score,
        COUNT(CASE WHEN converted_at IS NOT NULL THEN 1 END)::int AS converted_count
      FROM al_leads`),
      query(`SELECT id, name, role FROM al_staff WHERE active = true AND role IN ('receptionist', 'manager', 'admin') ORDER BY name`),
      query(`SELECT
        COALESCE(SUM(CASE WHEN a.status IN ('confirmed', 'completed') THEN a.price::numeric ELSE 0 END), 0)::numeric AS total_pipeline,
        COALESCE((SELECT SUM(p.amount::numeric) FROM al_payments p WHERE p.status = 'completed'), 0)::numeric AS total_revenue
      FROM al_appointments a`),
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
        total_pipeline_value: parseFloat(valueResult.rows[0]?.total_pipeline || '0'),
        total_revenue: parseFloat(valueResult.rows[0]?.total_revenue || '0'),
      },
      staff: staffResult.rows,
    });
  } catch (err) {
    console.error('[dashboard/leads] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = req.nextUrl.searchParams;
    const staffFilter = params.get('staff_id');
    const channel = params.get('channel');
    const period = params.get('period') || 'today';

    const now = new Date();
    let dateFrom: string;
    let dateTo: string = now.toISOString();

    switch (period) {
      case 'yesterday': {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        y.setHours(0, 0, 0, 0);
        dateFrom = y.toISOString();
        const ye = new Date(y);
        ye.setDate(ye.getDate() + 1);
        dateTo = ye.toISOString();
        break;
      }
      case 'week': {
        const w = new Date(now);
        w.setDate(w.getDate() - 7);
        w.setHours(0, 0, 0, 0);
        dateFrom = w.toISOString();
        break;
      }
      case 'month': {
        const m = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFrom = m.toISOString();
        break;
      }
      default: {
        // today
        const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFrom = t.toISOString();
        break;
      }
    }

    // Override with explicit date params if provided
    if (params.get('date_from')) dateFrom = params.get('date_from')!;
    if (params.get('date_to')) dateTo = params.get('date_to')!;

    const channelFilter = channel ? `AND r.channel = '${channel}'` : '';
    const staffFilterSql = staffFilter ? `AND r.staff_id = '${staffFilter}'` : '';

    // Run all queries in parallel
    const [
      teamStatsResult,
      staffRankingsResult,
      waitingLeadsResult,
      myStatsResult,
      yesterdayResult,
      weekResult,
      monthResult,
    ] = await Promise.all([
      // Team stats
      query(
        `SELECT
          COUNT(*)::int AS total_leads,
          COALESCE(AVG(r.response_seconds), 0)::int AS avg_response_seconds,
          (SELECT COUNT(*)::int FROM al_leads l2
           WHERE l2.created_at >= $1 AND l2.created_at < $2
           AND NOT EXISTS (
             SELECT 1 FROM al_lead_response_times r2 WHERE r2.lead_id = l2.id
           )) AS leads_waiting
        FROM al_lead_response_times r
        WHERE r.created_at >= $1 AND r.created_at < $2
        ${channelFilter} ${staffFilterSql}`,
        [dateFrom, dateTo],
      ),

      // Staff rankings
      query(
        `SELECT
          r.staff_id,
          COALESCE(s.name, 'Unknown') AS name,
          COUNT(*)::int AS leads_handled,
          AVG(r.response_seconds)::int AS avg_response_seconds,
          MIN(r.response_seconds)::int AS fastest,
          MAX(r.response_seconds)::int AS slowest,
          ROUND(
            COUNT(*)::numeric * 100.0 / GREATEST(
              (SELECT COUNT(*) FROM al_leads WHERE created_at >= $1 AND created_at < $2), 1
            ), 1
          )::float AS response_rate
        FROM al_lead_response_times r
        LEFT JOIN al_staff s ON s.id = r.staff_id
        WHERE r.created_at >= $1 AND r.created_at < $2
        ${channelFilter}
        GROUP BY r.staff_id, s.name
        ORDER BY avg_response_seconds ASC`,
        [dateFrom, dateTo],
      ),

      // Waiting leads (no response yet)
      query(
        `SELECT
          l.id AS lead_id,
          l.name AS lead_name,
          l.created_at,
          EXTRACT(EPOCH FROM (NOW() - l.created_at))::int AS seconds_waiting
        FROM al_leads l
        WHERE l.created_at >= $1 AND l.created_at < $2
        AND NOT EXISTS (
          SELECT 1 FROM al_lead_response_times r WHERE r.lead_id = l.id
        )
        ORDER BY l.created_at ASC`,
        [dateFrom, dateTo],
      ),

      // My stats
      query(
        `SELECT
          COUNT(*)::int AS leads_handled,
          COALESCE(AVG(r.response_seconds), 0)::int AS avg_response_seconds,
          COALESCE(MIN(r.response_seconds), 0)::int AS fastest,
          COALESCE(MAX(r.response_seconds), 0)::int AS slowest
        FROM al_lead_response_times r
        WHERE r.staff_id = $1 AND r.created_at >= $2 AND r.created_at < $3
        ${channelFilter}`,
        [user.staffId, dateFrom, dateTo],
      ),

      // Yesterday stats (for comparison)
      (() => {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        y.setHours(0, 0, 0, 0);
        const ye = new Date(y);
        ye.setDate(ye.getDate() + 1);
        return query(
          `SELECT
            COUNT(*)::int AS total_leads,
            COALESCE(AVG(response_seconds), 0)::int AS avg_response_seconds
          FROM al_lead_response_times
          WHERE created_at >= $1 AND created_at < $2`,
          [y.toISOString(), ye.toISOString()],
        );
      })(),

      // This week stats
      (() => {
        const w = new Date(now);
        w.setDate(w.getDate() - 7);
        w.setHours(0, 0, 0, 0);
        return query(
          `SELECT
            COUNT(*)::int AS total_leads,
            COALESCE(AVG(response_seconds), 0)::int AS avg_response_seconds
          FROM al_lead_response_times
          WHERE created_at >= $1 AND created_at < $2`,
          [w.toISOString(), now.toISOString()],
        );
      })(),

      // This month stats
      (() => {
        const m = new Date(now.getFullYear(), now.getMonth(), 1);
        return query(
          `SELECT
            COUNT(*)::int AS total_leads,
            COALESCE(AVG(response_seconds), 0)::int AS avg_response_seconds
          FROM al_lead_response_times
          WHERE created_at >= $1 AND created_at < $2`,
          [m.toISOString(), now.toISOString()],
        );
      })(),
    ]);

    const teamStats = teamStatsResult.rows[0] || {
      total_leads: 0,
      avg_response_seconds: 0,
      leads_waiting: 0,
    };

    // Find fastest responder
    const fastestResponder = staffRankingsResult.rows.length > 0
      ? staffRankingsResult.rows[0]
      : null;

    return NextResponse.json({
      team_stats: {
        total_leads: teamStats.total_leads,
        avg_response_seconds: teamStats.avg_response_seconds,
        leads_waiting: teamStats.leads_waiting,
        fastest_responder: fastestResponder
          ? { name: fastestResponder.name, avg_seconds: fastestResponder.avg_response_seconds }
          : null,
      },
      staff_rankings: staffRankingsResult.rows,
      waiting_leads: waitingLeadsResult.rows,
      my_stats: myStatsResult.rows[0] || {
        leads_handled: 0,
        avg_response_seconds: 0,
        fastest: 0,
        slowest: 0,
      },
      trends: {
        today: {
          total_leads: teamStats.total_leads,
          avg_response_seconds: teamStats.avg_response_seconds,
        },
        yesterday: yesterdayResult.rows[0] || { total_leads: 0, avg_response_seconds: 0 },
        week: weekResult.rows[0] || { total_leads: 0, avg_response_seconds: 0 },
        month: monthResult.rows[0] || { total_leads: 0, avg_response_seconds: 0 },
      },
    });
  } catch (err) {
    console.error('[dashboard/performance] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

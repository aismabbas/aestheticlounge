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
    const period = req.nextUrl.searchParams.get('period') || 'month';

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = `AND created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateFilter = `AND created_at >= date_trunc('month', CURRENT_DATE)`;
    }
    // 'all' = no date filter

    let apptDateFilter = '';
    if (period === 'week') {
      apptDateFilter = `AND date >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      apptDateFilter = `AND date >= date_trunc('month', CURRENT_DATE)`;
    }

    // Revenue
    const revenueTotal = await query(
      `SELECT COALESCE(SUM(price), 0) AS total
       FROM al_appointments
       WHERE status = 'completed' ${apptDateFilter}`,
    );

    const revenueByTreatment = await query(
      `SELECT treatment, COALESCE(SUM(price), 0) AS revenue, COUNT(*) AS count
       FROM al_appointments
       WHERE status = 'completed' AND treatment IS NOT NULL ${apptDateFilter}
       GROUP BY treatment
       ORDER BY revenue DESC`,
    );

    // Leads
    const leadsTotal = await query(
      `SELECT COUNT(*) AS total FROM al_leads WHERE 1=1 ${dateFilter}`,
    );

    const leadsBySource = await query(
      `SELECT COALESCE(utm_source, 'direct') AS source, COUNT(*) AS count
       FROM al_leads
       WHERE 1=1 ${dateFilter}
       GROUP BY utm_source
       ORDER BY count DESC`,
    );

    const leadsByStage = await query(
      `SELECT stage, COUNT(*) AS count
       FROM al_leads
       WHERE 1=1 ${dateFilter}
       GROUP BY stage
       ORDER BY count DESC`,
    );

    // Appointments
    const appointmentsTotal = await query(
      `SELECT COUNT(*) AS total FROM al_appointments WHERE 1=1 ${apptDateFilter}`,
    );

    const appointmentsCompleted = await query(
      `SELECT COUNT(*) AS total FROM al_appointments WHERE status = 'completed' ${apptDateFilter}`,
    );

    const appointmentsNoShow = await query(
      `SELECT COUNT(*) AS total FROM al_appointments WHERE status = 'no_show' ${apptDateFilter}`,
    );

    const appointmentsCancelled = await query(
      `SELECT COUNT(*) AS total FROM al_appointments WHERE status = 'cancelled' ${apptDateFilter}`,
    );

    // Campaigns
    const campaignStats = await query(
      `SELECT
         COALESCE(SUM(budget_spent), 0) AS total_spend,
         COALESCE(AVG(NULLIF(cpl, 0)), 0) AS avg_cpl,
         COALESCE(AVG(NULLIF(cpa, 0)), 0) AS avg_cpa,
         COALESCE(AVG(NULLIF(roas, 0)), 0) AS roas
       FROM al_campaigns`,
    );

    const topCampaigns = await query(
      `SELECT name, treatment, status, budget_spent, leads, booked, cpl, cpa, roas
       FROM al_campaigns
       ORDER BY leads DESC NULLS LAST
       LIMIT 10`,
    );

    const cs = campaignStats.rows[0];

    return NextResponse.json({
      revenue: {
        total: Number(revenueTotal.rows[0].total),
        byTreatment: revenueByTreatment.rows.map((r: { treatment: string; revenue: string; count: string }) => ({
          treatment: r.treatment,
          revenue: Number(r.revenue),
          count: Number(r.count),
        })),
      },
      leads: {
        total: Number(leadsTotal.rows[0].total),
        bySource: leadsBySource.rows.map((r: { source: string; count: string }) => ({
          source: r.source,
          count: Number(r.count),
        })),
        byStage: leadsByStage.rows.map((r: { stage: string; count: string }) => ({
          stage: r.stage,
          count: Number(r.count),
        })),
      },
      appointments: {
        total: Number(appointmentsTotal.rows[0].total),
        completed: Number(appointmentsCompleted.rows[0].total),
        noShow: Number(appointmentsNoShow.rows[0].total),
        cancelled: Number(appointmentsCancelled.rows[0].total),
      },
      campaigns: {
        totalSpend: Number(cs.total_spend),
        avgCPL: Number(Number(cs.avg_cpl).toFixed(2)),
        avgCPA: Number(Number(cs.avg_cpa).toFixed(2)),
        roas: Number(Number(cs.roas).toFixed(2)),
        top: topCampaigns.rows,
      },
    });
  } catch (err) {
    console.error('[dashboard/analytics] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

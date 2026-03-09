import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth';
import { getAutoStopCandidates, generateInsights } from '@/lib/meta-ads';
import { query } from '@/lib/db';

/**
 * GET /api/dashboard/ads/performance?campaign_id=X&days=30
 * Returns daily performance data for charts, auto-stop candidates, and AI insights.
 */
export async function GET(req: NextRequest) {
  const { session, allowed } = await checkApiPermission('ads:view');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const campaignId = req.nextUrl.searchParams.get('campaign_id');
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');

    // Daily performance data
    let performanceResult;
    if (campaignId) {
      performanceResult = await query(
        `SELECT
           date,
           meta_campaign_id,
           meta_ad_id,
           impressions,
           reach,
           clicks,
           spend,
           leads,
           cpl,
           cpc,
           cpm,
           ctr,
           frequency
         FROM al_ad_performance
         WHERE meta_campaign_id = $1
           AND date >= CURRENT_DATE - $2::int
         ORDER BY date ASC, meta_ad_id ASC`,
        [campaignId, days],
      );
    } else {
      performanceResult = await query(
        `SELECT
           date,
           meta_campaign_id,
           meta_ad_id,
           impressions,
           reach,
           clicks,
           spend,
           leads,
           cpl,
           cpc,
           cpm,
           ctr,
           frequency
         FROM al_ad_performance
         WHERE date >= CURRENT_DATE - $1::int
         ORDER BY date ASC, meta_campaign_id ASC, meta_ad_id ASC`,
        [days],
      );
    }

    // Summary aggregation (campaign-level only, meta_ad_id IS NULL)
    const summaryResult = await query(
      `SELECT
         meta_campaign_id,
         c.name AS campaign_name,
         SUM(p.spend) AS total_spend,
         SUM(p.leads) AS total_leads,
         CASE WHEN SUM(p.leads) > 0 THEN SUM(p.spend) / SUM(p.leads) ELSE 0 END AS avg_cpl,
         SUM(p.impressions) AS total_impressions,
         SUM(p.clicks) AS total_clicks,
         CASE WHEN SUM(p.impressions) > 0 THEN SUM(p.clicks)::float / SUM(p.impressions) * 100 ELSE 0 END AS avg_ctr
       FROM al_ad_performance p
       JOIN al_ad_campaigns c ON c.meta_id = p.meta_campaign_id
       WHERE p.meta_ad_id IS NULL
         AND p.date >= CURRENT_DATE - $1::int
       GROUP BY meta_campaign_id, c.name
       ORDER BY total_spend DESC`,
      [days],
    );

    // Auto-stop candidates
    const autoStopCandidates = await getAutoStopCandidates(query);

    // AI insights for the requested campaign (or first campaign)
    let insights = null;
    const insightCampaignId = campaignId || (summaryResult.rows[0]?.meta_campaign_id as string) || null;
    if (insightCampaignId) {
      try {
        insights = await generateInsights(query, insightCampaignId);
      } catch {
        // Insights are best-effort
      }
    }

    return NextResponse.json({
      daily: performanceResult.rows,
      summary: summaryResult.rows,
      autoStopCandidates,
      insights,
      days,
      campaignId: campaignId || 'all',
    });
  } catch (err) {
    console.error('[ads/performance] GET error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch performance data' },
      { status: 500 },
    );
  }
}

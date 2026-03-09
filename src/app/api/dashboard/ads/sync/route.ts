import { NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth';
import { syncFromMeta, syncPerformance } from '@/lib/meta-ads';
import { query } from '@/lib/db';

/**
 * POST /api/dashboard/ads/sync — triggers full sync from Meta
 * Requires ads:edit permission.
 */
export async function POST() {
  const { session, allowed } = await checkApiPermission('ads:edit');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const syncResult = await syncFromMeta(query);
    const performanceRows = await syncPerformance(query);

    return NextResponse.json({
      success: true,
      campaigns: syncResult.campaigns,
      adSets: syncResult.adSets,
      ads: syncResult.ads,
      changes: syncResult.changes,
      performanceRows,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[ads/sync] POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/dashboard/ads/sync — returns last sync status
 * Requires ads:view permission.
 */
export async function GET() {
  const { session, allowed } = await checkApiPermission('ads:view');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const [lastSync, counts] = await Promise.all([
      query(`SELECT MAX(synced_at) AS last_synced FROM al_ad_campaigns`),
      query(`
        SELECT
          (SELECT COUNT(*) FROM al_ad_campaigns) AS campaigns,
          (SELECT COUNT(*) FROM al_ad_sets) AS ad_sets,
          (SELECT COUNT(*) FROM al_ad_creatives) AS ads
      `),
    ]);

    return NextResponse.json({
      lastSynced: lastSync.rows[0]?.last_synced || null,
      campaigns: parseInt(counts.rows[0]?.campaigns as string) || 0,
      adSets: parseInt(counts.rows[0]?.ad_sets as string) || 0,
      ads: parseInt(counts.rows[0]?.ads as string) || 0,
    });
  } catch (err) {
    console.error('[ads/sync] GET error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to get sync status' },
      { status: 500 },
    );
  }
}

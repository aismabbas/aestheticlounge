import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth';
import { pauseAd, activateAd, getAutoStopCandidates } from '@/lib/meta-ads';
import { query } from '@/lib/db';

/**
 * POST /api/dashboard/ads/[action]
 * action = 'pause' | 'activate' | 'auto-stop'
 *
 * Body for pause/activate: { metaId: string }
 * Body for auto-stop: {} — runs auto-stop check and pauses candidates
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { session, allowed } = await checkApiPermission('ads:edit');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { action } = await params;

  try {
    if (action === 'pause') {
      const body = await req.json();
      if (!body.metaId) {
        return NextResponse.json({ error: 'metaId is required' }, { status: 400 });
      }
      await pauseAd(query, body.metaId);
      return NextResponse.json({ success: true, action: 'paused', metaId: body.metaId });
    }

    if (action === 'activate') {
      const body = await req.json();
      if (!body.metaId) {
        return NextResponse.json({ error: 'metaId is required' }, { status: 400 });
      }
      await activateAd(query, body.metaId);
      return NextResponse.json({ success: true, action: 'activated', metaId: body.metaId });
    }

    if (action === 'auto-stop') {
      const candidates = await getAutoStopCandidates(query);
      const paused: string[] = [];
      const errors: { metaAdId: string; error: string }[] = [];

      for (const candidate of candidates) {
        try {
          await pauseAd(query, candidate.metaAdId);
          paused.push(candidate.metaAdId);
        } catch (err) {
          errors.push({
            metaAdId: candidate.metaAdId,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      return NextResponse.json({
        success: true,
        candidates: candidates.length,
        paused: paused.length,
        pausedIds: paused,
        errors,
        details: candidates,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error(`[ads/${action}] POST error:`, err);
    return NextResponse.json(
      { error: 'Action failed' },
      { status: 500 },
    );
  }
}

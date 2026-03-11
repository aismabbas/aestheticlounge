import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { runOptimizationCycle } from '@/lib/ads-optimizer';

/**
 * POST /api/ads/optimizer/run
 * Triggers an optimization cycle. Called by n8n cron (every 6h) or manually.
 * Query param ?source=cron|manual|dashboard (defaults to 'api')
 */
export async function POST(req: NextRequest) {
  // Allow cron calls with a secret header, or authenticated dashboard users
  const cronSecret = req.headers.get('x-optimizer-secret');
  const expectedSecret = process.env.OPTIMIZER_CRON_SECRET;

  if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
    // Cron call — authorized
  } else {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const source = req.nextUrl.searchParams.get('source') || 'api';

  try {
    const result = await runOptimizationCycle(source);
    return NextResponse.json({
      success: true,
      runId: result.id,
      adsEvaluated: result.adsEvaluated,
      actionsExecuted: result.actionsExecuted,
      actionsFlagged: result.actionsFlagged,
      monthlySpent: result.monthlySpent,
      budgetChange: {
        before: result.budgetBeforeCents,
        after: result.budgetAfterCents,
      },
    });
  } catch (err) {
    console.error('[optimizer/run] Error:', err);
    const message = err instanceof Error ? err.message : 'Optimizer run failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

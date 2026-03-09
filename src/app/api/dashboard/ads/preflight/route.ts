import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth';
import { preflight } from '@/lib/meta-ads';
import { query } from '@/lib/db';

/**
 * POST /api/dashboard/ads/preflight — validates budget before creation
 * Body: { dailyBudgetCents: number, campaignName?: string }
 * Returns: { ok, currentDailySpendCents, headroomCents, monthlyProjection, warnings, errors }
 */
export async function POST(req: NextRequest) {
  const { session, allowed } = await checkApiPermission('ads:view');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const dailyBudgetCents = parseInt(body.dailyBudgetCents);

    if (!dailyBudgetCents || dailyBudgetCents <= 0) {
      return NextResponse.json(
        { error: 'dailyBudgetCents must be a positive integer' },
        { status: 400 },
      );
    }

    const result = await preflight(query, dailyBudgetCents);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[ads/preflight] POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Preflight check failed' },
      { status: 500 },
    );
  }
}

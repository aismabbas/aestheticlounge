import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getMonthlyBudgetUsage } from '@/lib/market-research';

/**
 * GET /api/dashboard/ads/metrics
 * Returns budget usage metrics for the optimizer panel.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const budget = await getMonthlyBudgetUsage();
    return NextResponse.json({ budget });
  } catch (err) {
    console.error('[ads/metrics] Error:', err);
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOptimizerHistory, getRecentActions } from '@/lib/ads-optimizer';

/**
 * GET /api/ads/optimizer/history
 * Returns recent optimizer runs and executed actions.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [runs, actions] = await Promise.all([
      getOptimizerHistory(10),
      getRecentActions(20),
    ]);

    return NextResponse.json({ runs, actions });
  } catch (err) {
    console.error('[optimizer/history] Error:', err);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}

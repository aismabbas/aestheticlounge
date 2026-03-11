import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getActiveFlags, dismissFlag } from '@/lib/ads-optimizer';

/**
 * GET /api/ads/optimizer/flags — active Tier 3 flags
 * PATCH /api/ads/optimizer/flags — dismiss a flag
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const flags = await getActiveFlags();
    return NextResponse.json({ flags });
  } catch (err) {
    console.error('[optimizer/flags] Error:', err);
    return NextResponse.json({ error: 'Failed to load flags' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { actionId, note } = await req.json();
    if (!actionId) {
      return NextResponse.json({ error: 'actionId required' }, { status: 400 });
    }

    await dismissFlag(actionId, note);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[optimizer/flags] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to dismiss flag' }, { status: 500 });
  }
}

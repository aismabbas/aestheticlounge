import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth';
import { createCampaign, createAdSet, createAd } from '@/lib/meta-ads';
import { query } from '@/lib/db';

/**
 * POST /api/dashboard/ads/create
 * Body: { type: 'campaign' | 'adset' | 'ad', ...data }
 * All entities created as PAUSED — must activate separately.
 * Requires ads:edit permission.
 */
export async function POST(req: NextRequest) {
  const { session, allowed } = await checkApiPermission('ads:edit');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { type } = body;

    if (!type || !['campaign', 'adset', 'ad'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be "campaign", "adset", or "ad"' },
        { status: 400 },
      );
    }

    if (type === 'campaign') {
      const { name, objective, dailyBudget } = body;
      if (!name || !dailyBudget) {
        return NextResponse.json({ error: 'name and dailyBudget are required' }, { status: 400 });
      }
      const result = await createCampaign(query, {
        name,
        objective: objective || 'OUTCOME_LEADS',
        dailyBudget: parseFloat(dailyBudget),
      });
      return NextResponse.json({ success: true, type: 'campaign', ...result });
    }

    if (type === 'adset') {
      const { campaignId, name, dailyBudget, targeting, optimizationGoal } = body;
      if (!campaignId || !name || !dailyBudget || !targeting) {
        return NextResponse.json(
          { error: 'campaignId, name, dailyBudget, and targeting are required' },
          { status: 400 },
        );
      }
      const result = await createAdSet(query, {
        campaignId,
        name,
        dailyBudget: parseFloat(dailyBudget),
        targeting,
        optimizationGoal,
      });
      return NextResponse.json({ success: true, type: 'adset', ...result });
    }

    if (type === 'ad') {
      const { adSetId, name, headline, body: adBody, imageUrl, ctaType, leadFormId } = body;
      if (!adSetId || !name || !headline || !adBody || !imageUrl) {
        return NextResponse.json(
          { error: 'adSetId, name, headline, body, and imageUrl are required' },
          { status: 400 },
        );
      }
      const result = await createAd(query, {
        adSetId,
        name,
        headline,
        body: adBody,
        imageUrl,
        ctaType,
        leadFormId,
      });
      return NextResponse.json({ success: true, type: 'ad', ...result });
    }
  } catch (err) {
    console.error('[ads/create] POST error:', err);
    const message = err instanceof Error ? err.message : 'Creation failed';
    const status = message.startsWith('Preflight failed') ? 422 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

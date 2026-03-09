import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

const META_BASE = 'https://graph.facebook.com/v21.0';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Meta not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;

    // Fetch campaign details
    const fields =
      'id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time,updated_time,buying_type';
    const campaignRes = await fetch(
      `${META_BASE}/${id}?fields=${fields}&access_token=${accessToken}`,
    );

    if (!campaignRes.ok) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = await campaignRes.json();

    // Fetch ad sets with targeting details
    const adSetsRes = await fetch(
      `${META_BASE}/${id}/adsets?fields=id,name,status,effective_status,daily_budget,targeting,optimization_goal,bid_strategy&limit=50&access_token=${accessToken}`,
    );
    const adSetsData = adSetsRes.ok ? await adSetsRes.json() : { data: [] };

    // Fetch ads with full creative details + per-ad insights
    const adFields = [
      'id',
      'name',
      'status',
      'effective_status',
      'creative{id,title,body,call_to_action_type,image_url,thumbnail_url,object_story_spec}',
      'preview_shareable_link',
    ].join(',');
    const adsRes = await fetch(
      `${META_BASE}/${id}/ads?fields=${adFields}&limit=50&access_token=${accessToken}`,
    );
    const adsData = adsRes.ok ? await adsRes.json() : { data: [] };

    // Fetch per-ad insights in parallel
    const adInsightFields =
      'impressions,clicks,spend,actions,cost_per_action_type,cpc,cpm,ctr,reach';
    const adsWithInsights = await Promise.all(
      (adsData.data || []).map(async (ad: Record<string, unknown>) => {
        try {
          const aiRes = await fetch(
            `${META_BASE}/${ad.id}/insights?fields=${adInsightFields}&date_preset=last_30d&access_token=${accessToken}`,
          );
          const aiData = aiRes.ok ? await aiRes.json() : { data: [] };

          // Get the full image from creative if available
          let imageUrl =
            (ad.creative as Record<string, unknown>)?.image_url ||
            (ad.creative as Record<string, unknown>)?.thumbnail_url ||
            null;

          // Try to get image from object_story_spec
          const oss = (ad.creative as Record<string, unknown>)
            ?.object_story_spec as Record<string, unknown> | undefined;
          if (!imageUrl && oss) {
            const linkData = oss.link_data as
              | Record<string, unknown>
              | undefined;
            if (linkData?.image_url) imageUrl = linkData.image_url;
            if (linkData?.picture) imageUrl = linkData.picture;
          }

          // If we have a creative ID, fetch the full image
          const creativeId = (ad.creative as Record<string, string>)?.id;
          if (!imageUrl && creativeId) {
            try {
              const cRes = await fetch(
                `${META_BASE}/${creativeId}?fields=image_url,thumbnail_url,object_story_spec&access_token=${accessToken}`,
              );
              if (cRes.ok) {
                const cData = await cRes.json();
                imageUrl =
                  cData.image_url ||
                  cData.thumbnail_url ||
                  cData.object_story_spec?.link_data?.image_url ||
                  cData.object_story_spec?.link_data?.picture ||
                  null;
              }
            } catch {
              // ignore
            }
          }

          return {
            ...ad,
            image_url: imageUrl,
            insights: aiData.data?.[0] || null,
          };
        } catch {
          return { ...ad, image_url: null, insights: null };
        }
      }),
    );

    // Campaign-level insights (last 30 days)
    const insightFields =
      'impressions,clicks,spend,actions,cost_per_action_type,cpc,cpm,ctr,reach,frequency';
    const insightRes = await fetch(
      `${META_BASE}/${id}/insights?fields=${insightFields}&date_preset=last_30d&access_token=${accessToken}`,
    );
    const insightData = insightRes.ok
      ? await insightRes.json()
      : { data: [] };

    // Daily breakdown
    const dailyRes = await fetch(
      `${META_BASE}/${id}/insights?fields=spend,impressions,clicks,actions&date_preset=last_30d&time_increment=1&access_token=${accessToken}`,
    );
    const dailyData = dailyRes.ok ? await dailyRes.json() : { data: [] };

    return NextResponse.json({
      campaign,
      adSets: adSetsData.data || [],
      ads: adsWithInsights,
      insights: insightData.data?.[0] || null,
      dailyInsights: dailyData.data || [],
    });
  } catch (err) {
    console.error('[dashboard/campaigns/[id]] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Meta not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const newStatus = action === 'pause' ? 'PAUSED' : 'ACTIVE';

    const res = await fetch(`${META_BASE}/${id}?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Meta API error: ${err}` },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      status: newStatus.toLowerCase(),
    });
  } catch (err) {
    console.error('[dashboard/campaigns/[id]] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

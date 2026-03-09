import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

const META_BASE = 'https://graph.facebook.com/v21.0';

export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!adAccountId || !accessToken) {
    return NextResponse.json(
      { error: 'Meta Ad Account not configured', campaigns: [] },
      { status: 200 },
    );
  }

  try {
    const statusFilter = req.nextUrl.searchParams.get('status');
    const datePreset =
      req.nextUrl.searchParams.get('date_preset') || 'last_30d';

    // Fetch campaigns
    const fields =
      'id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time,updated_time';

    let url = `${META_BASE}/${adAccountId}/campaigns?fields=${fields}&limit=50&access_token=${accessToken}`;

    if (statusFilter) {
      const metaStatus = statusFilter.toUpperCase();
      url += `&filtering=[{"field":"effective_status","operator":"IN","value":["${metaStatus}"]}]`;
    }

    const campaignsRes = await fetch(url);
    if (!campaignsRes.ok) {
      const err = await campaignsRes.text();
      console.error('[campaigns] Meta API error:', err);
      return NextResponse.json({
        error: 'Failed to fetch campaigns from Meta',
        campaigns: [],
      });
    }

    const campaignsData = await campaignsRes.json();
    const metaCampaigns = campaignsData.data || [];

    // For each campaign: fetch insights + ads with creatives in parallel
    const insightFields =
      'impressions,clicks,spend,actions,cost_per_action_type,cpc,cpm,ctr,reach,frequency';

    const campaignsWithData = await Promise.all(
      metaCampaigns.map(
        async (campaign: Record<string, string | undefined>) => {
          try {
            // Fetch insights + ads in parallel
            const [insightRes, adsRes] = await Promise.all([
              fetch(
                `${META_BASE}/${campaign.id}/insights?fields=${insightFields}&date_preset=${datePreset}&access_token=${accessToken}`,
              ),
              fetch(
                `${META_BASE}/${campaign.id}/ads?fields=id,name,status,effective_status,creative{id,title,body,call_to_action_type,image_url,thumbnail_url,object_story_spec},preview_shareable_link&limit=10&access_token=${accessToken}`,
              ),
            ]);

            const insightData = insightRes.ok
              ? await insightRes.json()
              : { data: [] };
            const adsData = adsRes.ok
              ? await adsRes.json()
              : { data: [] };

            const insight = insightData.data?.[0] || null;
            const ads = adsData.data || [];

            // Extract ad previews
            const adPreviews = await Promise.all(
              ads.map(
                async (ad: Record<string, unknown>) => {
                  const creative = ad.creative as Record<string, unknown> | undefined;
                  let imageUrl =
                    creative?.image_url || creative?.thumbnail_url || null;

                  // Try object_story_spec
                  const oss = creative?.object_story_spec as
                    | Record<string, unknown>
                    | undefined;
                  if (!imageUrl && oss) {
                    const ld = oss.link_data as
                      | Record<string, unknown>
                      | undefined;
                    if (ld?.image_url) imageUrl = ld.image_url;
                    if (ld?.picture) imageUrl = ld.picture;
                  }

                  // Fetch full creative if still no image
                  const creativeId = creative?.id as string | undefined;
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
                    id: ad.id,
                    name: ad.name,
                    status: (
                      ad.effective_status as string
                    )?.toLowerCase(),
                    headline: creative?.title || null,
                    body: creative?.body || null,
                    cta: creative?.call_to_action_type || null,
                    image_url: imageUrl,
                    preview_link: ad.preview_shareable_link || null,
                  };
                },
              ),
            );

            const leads = insight?.actions?.find(
              (a: { action_type: string }) =>
                a.action_type === 'lead' ||
                a.action_type === 'onsite_conversion.lead_grouped',
            );
            const cpl = insight?.cost_per_action_type?.find(
              (a: { action_type: string }) =>
                a.action_type === 'lead' ||
                a.action_type === 'onsite_conversion.lead_grouped',
            );

            const dailyBudget = campaign.daily_budget
              ? parseFloat(campaign.daily_budget) / 100
              : campaign.lifetime_budget
                ? parseFloat(campaign.lifetime_budget) / 100
                : 0;

            const spend = insight ? parseFloat(insight.spend) : 0;
            const leadsCount = leads ? parseInt(leads.value) : 0;
            const impressions = insight ? parseInt(insight.impressions) : 0;
            const clicks = insight ? parseInt(insight.clicks) : 0;
            const ctrVal = insight?.ctr ? parseFloat(insight.ctr) : 0;
            const cplVal = cpl ? parseFloat(cpl.value) : 0;
            const reach = insight?.reach ? parseInt(insight.reach) : 0;
            const frequency = insight?.frequency
              ? parseFloat(insight.frequency)
              : 0;

            // Generate AI performance description
            const description = generateInsightDescription({
              name: campaign.name as string,
              status: (
                campaign.effective_status as string
              )?.toLowerCase(),
              spend,
              leads: leadsCount,
              cpl: cplVal,
              impressions,
              clicks,
              ctr: ctrVal,
              reach,
              frequency,
            });

            return {
              id: campaign.id,
              name: campaign.name,
              status: (
                campaign.effective_status as string
              )?.toLowerCase(),
              objective: campaign.objective || '',
              budget_daily: dailyBudget,
              budget_spent: spend,
              impressions,
              clicks,
              ctr: ctrVal,
              leads: leadsCount,
              cpl: cplVal,
              reach,
              frequency,
              created_at: campaign.created_time,
              updated_at: campaign.updated_time,
              ads: adPreviews,
              description,
            };
          } catch {
            return {
              id: campaign.id,
              name: campaign.name,
              status: (
                campaign.effective_status as string
              )?.toLowerCase(),
              objective: campaign.objective || '',
              budget_daily: 0,
              budget_spent: 0,
              impressions: 0,
              clicks: 0,
              ctr: 0,
              leads: 0,
              cpl: 0,
              reach: 0,
              frequency: 0,
              created_at: campaign.created_time,
              updated_at: campaign.updated_time,
              ads: [],
              description: '',
            };
          }
        },
      ),
    );

    return NextResponse.json({ campaigns: campaignsWithData });
  } catch (err) {
    console.error('[dashboard/campaigns] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error', campaigns: [] },
      { status: 500 },
    );
  }
}

// AI-generated performance insight based on campaign metrics
function generateInsightDescription(data: {
  name: string;
  status: string;
  spend: number;
  leads: number;
  cpl: number;
  impressions: number;
  clicks: number;
  ctr: number;
  reach: number;
  frequency: number;
}): string {
  const parts: string[] = [];

  if (data.status === 'paused') {
    parts.push('This campaign is currently paused.');
  }

  if (data.spend === 0 && data.impressions === 0) {
    parts.push('No delivery data yet — campaign may not have started or has no budget.');
    return parts.join(' ');
  }

  // Spend summary
  if (data.spend > 0) {
    parts.push(`Spent $${data.spend.toFixed(2)} CAD reaching ${data.reach.toLocaleString()} people.`);
  }

  // Lead performance
  if (data.leads > 0 && data.cpl > 0) {
    if (data.cpl < 2) {
      parts.push(
        `Excellent CPL of $${data.cpl.toFixed(2)} — ${data.leads} leads at well below industry average.`,
      );
    } else if (data.cpl < 4) {
      parts.push(
        `Good CPL of $${data.cpl.toFixed(2)} — ${data.leads} leads within target range.`,
      );
    } else {
      parts.push(
        `CPL of $${data.cpl.toFixed(2)} is above target — ${data.leads} leads. Consider refreshing creative or narrowing audience.`,
      );
    }
  } else if (data.impressions > 0 && data.leads === 0) {
    parts.push(
      'No leads captured yet despite delivery. Check lead form connection and creative relevance.',
    );
  }

  // CTR analysis
  if (data.ctr > 0) {
    if (data.ctr > 2) {
      parts.push(`Strong ${data.ctr.toFixed(2)}% CTR — creative is resonating well.`);
    } else if (data.ctr > 1) {
      parts.push(`${data.ctr.toFixed(2)}% CTR is average — test new headlines or visuals to improve.`);
    } else if (data.impressions > 1000) {
      parts.push(
        `Low ${data.ctr.toFixed(2)}% CTR — creative may need a refresh. Try doctor-featuring content or stronger hooks.`,
      );
    }
  }

  // Frequency warning
  if (data.frequency > 3) {
    parts.push(
      `Frequency at ${data.frequency.toFixed(1)}x — audience is seeing ads too often. Expand targeting or rotate creatives.`,
    );
  }

  return parts.join(' ');
}

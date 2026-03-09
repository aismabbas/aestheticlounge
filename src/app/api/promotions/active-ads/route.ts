import { NextResponse } from 'next/server';

const META_BASE = 'https://graph.facebook.com/v21.0';

/**
 * Public endpoint — returns active ad creatives for the promotions page.
 * No auth required (public-facing page).
 * Cached for 30 minutes.
 */
export async function GET() {
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!adAccountId || !accessToken) {
    return NextResponse.json({ ads: [] });
  }

  try {
    // Fetch only ACTIVE campaigns
    const campaignsRes = await fetch(
      `${META_BASE}/${adAccountId}/campaigns?fields=id,name&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]&limit=20&access_token=${accessToken}`,
    );

    if (!campaignsRes.ok) {
      return NextResponse.json({ ads: [] });
    }

    const campaignsData = await campaignsRes.json();
    const campaigns = campaignsData.data || [];

    if (campaigns.length === 0) {
      return NextResponse.json({ ads: [] });
    }

    // Fetch ads from active campaigns
    const allAds: {
      id: string;
      campaign: string;
      headline: string | null;
      body: string | null;
      cta: string | null;
      image_url: string | null;
      treatment: string;
    }[] = [];

    for (const campaign of campaigns) {
      const adsRes = await fetch(
        `${META_BASE}/${campaign.id}/ads?fields=id,name,effective_status,creative{title,body,call_to_action_type,image_url,thumbnail_url,object_story_spec}&limit=10&access_token=${accessToken}`,
      );

      if (!adsRes.ok) continue;
      const adsData = await adsRes.json();

      for (const ad of adsData.data || []) {
        if (ad.effective_status !== 'ACTIVE') continue;

        const creative = ad.creative || {};
        let imageUrl = creative.image_url || creative.thumbnail_url || null;

        // Try object_story_spec for image
        if (!imageUrl && creative.object_story_spec) {
          const ld = creative.object_story_spec.link_data;
          if (ld) imageUrl = ld.image_url || ld.picture || null;
        }

        // Fetch full creative if needed
        if (!imageUrl && creative.id) {
          try {
            const cRes = await fetch(
              `${META_BASE}/${creative.id}?fields=image_url,thumbnail_url,object_story_spec&access_token=${accessToken}`,
            );
            if (cRes.ok) {
              const cData = await cRes.json();
              imageUrl =
                cData.image_url ||
                cData.thumbnail_url ||
                cData.object_story_spec?.link_data?.image_url ||
                null;
            }
          } catch {
            // ignore
          }
        }

        // Extract treatment name from campaign name (e.g., "Ramadan Laser" → "Laser")
        const treatment = campaign.name
          .replace(/camp\s*\d+/i, '')
          .replace(/v\d+/i, '')
          .trim() || campaign.name;

        allAds.push({
          id: ad.id,
          campaign: campaign.name,
          headline: creative.title || null,
          body: creative.body || null,
          cta: creative.call_to_action_type || null,
          image_url: imageUrl,
          treatment,
        });
      }
    }

    return NextResponse.json(
      { ads: allAds },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      },
    );
  } catch (err) {
    console.error('[promotions/active-ads] error:', err);
    return NextResponse.json({ ads: [] });
  }
}

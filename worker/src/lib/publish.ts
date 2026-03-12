/**
 * Instagram + Facebook Publishing — extracted from al-pipeline.ts
 */

const IG_API = 'https://graph.facebook.com/v21.0';
const FB_API = 'https://graph.facebook.com/v21.0';

export async function publishToInstagram(opts: {
  type: 'photo' | 'carousel' | 'reel';
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  caption: string;
}): Promise<{ id: string; permalink?: string }> {
  const igAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  if (!igAccountId || !accessToken) {
    throw new Error('Instagram credentials not configured');
  }

  const { type, imageUrl, imageUrls, videoUrl, caption } = opts;

  if (type === 'photo' && imageUrl) {
    const containerRes = await fetch(
      `${IG_API}/${igAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const container = await containerRes.json();
    if (!container.id) throw new Error(`IG container error: ${JSON.stringify(container)}`);

    const publishRes = await fetch(
      `${IG_API}/${igAccountId}/media_publish?creation_id=${container.id}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const published = await publishRes.json();
    if (!published.id) throw new Error(`IG publish error: ${JSON.stringify(published)}`);
    return { id: published.id };
  }

  if (type === 'carousel' && imageUrls && imageUrls.length >= 2) {
    const childIds: string[] = [];
    for (const url of imageUrls) {
      const res = await fetch(
        `${IG_API}/${igAccountId}/media?image_url=${encodeURIComponent(url)}&is_carousel_item=true&access_token=${accessToken}`,
        { method: 'POST' },
      );
      const data = await res.json();
      if (data.id) {
        childIds.push(data.id);
      } else {
        console.error('[publishToInstagram] Child container failed:', data);
      }
    }

    if (childIds.length < 2) {
      throw new Error(`Carousel requires at least 2 uploaded images, only ${childIds.length} succeeded`);
    }

    const containerRes = await fetch(
      `${IG_API}/${igAccountId}/media?media_type=CAROUSEL&children=${childIds.join(',')}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const container = await containerRes.json();
    if (!container.id) throw new Error(`IG carousel error: ${JSON.stringify(container)}`);

    const publishRes = await fetch(
      `${IG_API}/${igAccountId}/media_publish?creation_id=${container.id}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const published = await publishRes.json();
    if (!published.id) throw new Error(`IG carousel publish error: ${JSON.stringify(published)}`);
    return { id: published.id };
  }

  if (type === 'reel' && videoUrl) {
    const containerRes = await fetch(
      `${IG_API}/${igAccountId}/media?media_type=REELS&video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const container = await containerRes.json();
    if (!container.id) throw new Error(`IG reel error: ${JSON.stringify(container)}`);

    let status = 'IN_PROGRESS';
    let attempts = 0;
    while (status === 'IN_PROGRESS' && attempts < 30) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(
        `${IG_API}/${container.id}?fields=status_code&access_token=${accessToken}`,
      );
      const statusData = await statusRes.json();
      status = statusData.status_code || 'ERROR';
      attempts++;
    }

    if (status !== 'FINISHED') throw new Error(`Reel processing failed: ${status}`);

    const publishRes = await fetch(
      `${IG_API}/${igAccountId}/media_publish?creation_id=${container.id}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const published = await publishRes.json();
    if (!published.id) throw new Error(`Reel publish failed: ${JSON.stringify(published)}`);
    return { id: published.id };
  }

  throw new Error(`Unsupported publish type: ${type}`);
}

export async function publishToFacebook(opts: {
  imageUrl: string;
  caption: string;
}): Promise<{ id: string }> {
  const pageId = '470913939437743';
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('META_ACCESS_TOKEN not configured');
  }

  const res = await fetch(
    `${FB_API}/${pageId}/photos?url=${encodeURIComponent(opts.imageUrl)}&message=${encodeURIComponent(opts.caption)}&access_token=${accessToken}`,
    { method: 'POST' },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Facebook publish error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return { id: data.id || data.post_id };
}

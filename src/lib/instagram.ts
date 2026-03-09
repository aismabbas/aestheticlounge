export interface InstagramPost {
  id: string;
  caption: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

// Module-level cache with 5-minute TTL
let cachedPosts: InstagramPost[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid(): boolean {
  return cachedPosts !== null && Date.now() - cacheTimestamp < CACHE_TTL;
}

/**
 * Fetch recent posts from the Instagram Graph API.
 * Returns an empty array if credentials are not configured.
 */
export async function fetchRecentPosts(
  limit: number = 6,
): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  const businessId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!token || !businessId) {
    return [];
  }

  // Return cached data if still fresh
  if (isCacheValid() && cachedPosts) {
    return cachedPosts.slice(0, limit);
  }

  try {
    const fields =
      "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
    const url = `https://graph.facebook.com/v21.0/${businessId}/media?fields=${fields}&limit=20&access_token=${token}`;

    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      console.error(
        `Instagram API error: ${res.status} ${res.statusText}`,
      );
      return [];
    }

    const data = await res.json();
    cachedPosts = (data.data ?? []) as InstagramPost[];
    cacheTimestamp = Date.now();

    return cachedPosts.slice(0, limit);
  } catch (err) {
    console.error("Instagram fetch failed:", err);
    return [];
  }
}

/**
 * Get oEmbed HTML for a given Instagram post URL.
 */
export async function getPostEmbed(url: string): Promise<string | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const apiUrl = `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${token}`;
    const res = await fetch(apiUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return data.html ?? null;
  } catch {
    return null;
  }
}

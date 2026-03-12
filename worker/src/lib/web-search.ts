/**
 * Web search + Meta Ad Library — gives the researcher real-world data.
 */

// ---------------------------------------------------------------------------
// Brave Search API
// ---------------------------------------------------------------------------

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

export async function braveSearch(query: string, count = 5): Promise<BraveSearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;

  const res = await fetch(url, {
    headers: { 'X-Subscription-Token': apiKey },
  });

  if (!res.ok) {
    console.error(`[brave-search] ${res.status}: ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return (data.web?.results || []).slice(0, count).map((r: { title: string; url: string; description: string }) => ({
    title: r.title,
    url: r.url,
    description: r.description,
  }));
}

// ---------------------------------------------------------------------------
// Meta Ad Library API
// ---------------------------------------------------------------------------

interface AdLibraryResult {
  id: string;
  page_name: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_delivery_start_time: string;
  ad_delivery_stop_time?: string;
  publisher_platforms?: string[];
  impressions?: { lower_bound: string; upper_bound: string };
  spend?: { lower_bound: string; upper_bound: string };
}

export async function searchMetaAdLibrary(searchTerm: string, opts?: {
  country?: string;
  limit?: number;
}): Promise<AdLibraryResult[]> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) return [];

  const country = opts?.country || 'PK';
  const limit = opts?.limit || 10;

  const params = new URLSearchParams({
    access_token: accessToken,
    search_terms: searchTerm,
    ad_type: 'ALL',
    ad_reached_countries: `["${country}"]`,
    ad_active_status: 'ACTIVE',
    fields: 'id,page_name,ad_creative_bodies,ad_creative_link_titles,ad_delivery_start_time,publisher_platforms',
    limit: String(limit),
  });

  const res = await fetch(`https://graph.facebook.com/v21.0/ads_archive?${params}`);

  if (!res.ok) {
    const err = await res.text();
    console.error(`[meta-ad-library] ${res.status}: ${err}`);
    return [];
  }

  const data = await res.json();
  return (data.data || []) as AdLibraryResult[];
}

// ---------------------------------------------------------------------------
// Instagram trending — scrape hashtag search via web
// ---------------------------------------------------------------------------

export async function searchInstagramTrends(query: string): Promise<BraveSearchResult[]> {
  return braveSearch(`site:instagram.com ${query} aesthetic clinic Pakistan 2026`, 5);
}

// ---------------------------------------------------------------------------
// Meta Ad Library via web scrape (fallback when API permission is missing)
// ---------------------------------------------------------------------------

export async function scrapeAdLibraryViaBrave(searchTerm: string): Promise<BraveSearchResult[]> {
  return braveSearch(`site:facebook.com/ads/library "${searchTerm}" Pakistan beauty aesthetic`, 5);
}

// ---------------------------------------------------------------------------
// Composite research — runs all sources in parallel
// ---------------------------------------------------------------------------

export interface ResearchData {
  webResults: BraveSearchResult[];
  competitorAds: AdLibraryResult[];
  trendingContent: BraveSearchResult[];
  industryInsights: BraveSearchResult[];
}

export async function gatherResearch(topic: string, treatment?: string): Promise<ResearchData> {
  const searchTopic = treatment || topic;

  const [webResults, trendingContent, industryInsights, competitorWeb] = await Promise.all([
    braveSearch(`${searchTopic} aesthetic clinic Lahore Pakistan trends 2026`, 5),
    braveSearch(`${searchTopic} Instagram marketing medical aesthetics Pakistan DHA Lahore trending`, 5),
    braveSearch(`${searchTopic} cosmetic dermatology Pakistan market growth statistics Pakistani women`, 3),
    braveSearch(`${searchTopic} competitor beauty clinic Lahore Instagram ads promotions`, 3),
  ]);

  return {
    webResults: [...webResults, ...competitorWeb],
    competitorAds: [], // Meta Ad Library API parked — needs identity verification + EU-only limitation
    trendingContent,
    industryInsights,
  };
}

export function formatResearchForPrompt(data: ResearchData): string {
  const sections: string[] = [];

  if (data.webResults.length > 0) {
    sections.push(`== WEB SEARCH RESULTS ==\n${data.webResults.map((r, i) =>
      `${i + 1}. [${r.title}](${r.url})\n   ${r.description}`
    ).join('\n')}`);
  }

  if (data.competitorAds.length > 0) {
    sections.push(`== COMPETITOR ADS (Meta Ad Library — Active in Pakistan) ==\n${data.competitorAds.map((ad, i) => {
      const body = ad.ad_creative_bodies?.[0]?.slice(0, 200) || 'N/A';
      const title = ad.ad_creative_link_titles?.[0] || '';
      return `${i + 1}. ${ad.page_name} (since ${ad.ad_delivery_start_time})\n   Title: ${title}\n   Copy: ${body}`;
    }).join('\n')}`);
  }

  if (data.trendingContent.length > 0) {
    sections.push(`== TRENDING CONTENT ==\n${data.trendingContent.map((r, i) =>
      `${i + 1}. ${r.title}\n   ${r.description}`
    ).join('\n')}`);
  }

  if (data.industryInsights.length > 0) {
    sections.push(`== INDUSTRY INSIGHTS ==\n${data.industryInsights.map((r, i) =>
      `${i + 1}. ${r.title}\n   ${r.description}`
    ).join('\n')}`);
  }

  if (sections.length === 0) {
    return '(No external research data available — web search and ad library keys not configured)';
  }

  return sections.join('\n\n');
}

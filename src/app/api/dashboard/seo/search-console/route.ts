import { NextRequest, NextResponse } from 'next/server';
import {
  isGSCConfigured,
  getSearchPerformance,
  getDailyPerformance,
  getTopQueries,
  getTopPages,
  getSitemaps,
} from '@/lib/google-search-console';

/**
 * GET /api/dashboard/seo/search-console?range=28
 * Returns search performance, daily data, top queries, top pages, sitemaps.
 */
export async function GET(req: NextRequest) {
  if (!isGSCConfigured()) {
    return NextResponse.json({
      configured: false,
      error: 'Google Search Console not configured. Set GOOGLE_SEARCH_CONSOLE_SITE env var.',
    });
  }

  const range = parseInt(req.nextUrl.searchParams.get('range') || '28', 10);
  const endDate = new Date();
  // GSC data has ~3 day delay
  endDate.setDate(endDate.getDate() - 3);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - range);

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const start = fmt(startDate);
  const end = fmt(endDate);

  try {
    const [performance, daily, queries, pages, sitemaps] = await Promise.all([
      getSearchPerformance(start, end),
      getDailyPerformance(start, end),
      getTopQueries(start, end, 20),
      getTopPages(start, end, 20),
      getSitemaps(),
    ]);

    return NextResponse.json({
      configured: true,
      range,
      startDate: start,
      endDate: end,
      performance,
      daily,
      queries,
      pages,
      sitemaps,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('GSC API error:', message);
    return NextResponse.json({
      configured: true,
      error: message,
    }, { status: 500 });
  }
}

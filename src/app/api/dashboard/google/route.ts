import { NextRequest, NextResponse } from 'next/server';
import {
  getConfigStatus,
  getLocationInfo,
  getReviews,
  getInsights,
  updateLocationInfo,
} from '@/lib/google-business';

export async function GET(req: NextRequest) {
  const status = getConfigStatus();
  if (!status.configured) {
    return NextResponse.json({ configured: false, missing: status.missing });
  }

  const type = req.nextUrl.searchParams.get('type') || 'overview';

  try {
    if (type === 'overview') {
      const [location, reviewData] = await Promise.all([
        getLocationInfo(),
        getReviews(5),
      ]);

      // Last 30 days insights
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      let insights = null;
      try {
        insights = await getInsights(
          start.toISOString().split('T')[0],
          end.toISOString().split('T')[0],
        );
      } catch {
        // insights may fail if not enough data
      }

      return NextResponse.json({
        configured: true,
        location,
        reviews: {
          total: reviewData.totalReviewCount,
          average: reviewData.averageRating,
          recent: reviewData.reviews.slice(0, 3),
        },
        insights,
      });
    }

    if (type === 'insights') {
      const startDate = req.nextUrl.searchParams.get('start');
      const endDate = req.nextUrl.searchParams.get('end');
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'start and end required' }, { status: 400 });
      }
      const insights = await getInsights(startDate, endDate);
      return NextResponse.json({ configured: true, insights });
    }

    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const status = getConfigStatus();
  if (!status.configured) {
    return NextResponse.json({ error: 'GBP not configured' }, { status: 400 });
  }

  try {
    const updates = await req.json();
    const result = await updateLocationInfo(updates);
    return NextResponse.json({ ok: true, location: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

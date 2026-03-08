import { NextRequest, NextResponse } from 'next/server';
import { getConfigStatus, getReviews, replyToReview } from '@/lib/google-business';

export async function GET(req: NextRequest) {
  const status = getConfigStatus();
  if (!status.configured) {
    return NextResponse.json({ configured: false, missing: status.missing });
  }

  try {
    const pageSize = Number(req.nextUrl.searchParams.get('pageSize') || '50');
    const data = await getReviews(pageSize);
    return NextResponse.json({ configured: true, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const status = getConfigStatus();
  if (!status.configured) {
    return NextResponse.json({ error: 'GBP not configured' }, { status: 400 });
  }

  try {
    const { reviewId, reply } = await req.json();
    if (!reviewId || !reply) {
      return NextResponse.json({ error: 'reviewId and reply are required' }, { status: 400 });
    }
    await replyToReview(reviewId, reply);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

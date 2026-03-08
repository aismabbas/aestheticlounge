import { NextRequest, NextResponse } from 'next/server';
import { getConfigStatus, getPhotos, uploadPhoto } from '@/lib/google-business';

export async function GET() {
  const status = getConfigStatus();
  if (!status.configured) {
    return NextResponse.json({ configured: false, missing: status.missing });
  }

  try {
    const photos = await getPhotos();
    return NextResponse.json({ configured: true, photos });
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
    const { category, url } = await req.json();
    if (!category || !url) {
      return NextResponse.json({ error: 'category and url are required' }, { status: 400 });
    }
    const photo = await uploadPhoto(category, url);
    return NextResponse.json({ ok: true, photo });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

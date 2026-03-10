import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { getConfigStatus, listPosts, createPost } from '@/lib/google-business';

export async function GET() {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = getConfigStatus();
  if (!status.configured) {
    return NextResponse.json({ configured: false, missing: status.missing });
  }

  try {
    const posts = await listPosts();
    return NextResponse.json({ configured: true, posts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await checkAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = getConfigStatus();
  if (!status.configured) {
    return NextResponse.json({ error: 'GBP not configured' }, { status: 400 });
  }

  try {
    const body = await req.json();
    if (!body.summary) {
      return NextResponse.json({ error: 'summary is required' }, { status: 400 });
    }
    const post = await createPost(body);
    return NextResponse.json({ ok: true, post });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

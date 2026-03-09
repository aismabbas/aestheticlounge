import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { fireCallback } from '@/lib/n8n';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { callbackId, title } = await req.json();

  if (!callbackId) {
    return NextResponse.json({ error: 'callbackId required' }, { status: 400 });
  }

  try {
    const result = await fireCallback(callbackId, title || session.name);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Callback error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

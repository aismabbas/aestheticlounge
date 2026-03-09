import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { triggerPipeline } from '@/lib/n8n';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, params } = body;

  if (!action) {
    return NextResponse.json({ error: 'Action required' }, { status: 400 });
  }

  try {
    const result = await triggerPipeline({ action, ...params, triggered_by: session.name });
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Pipeline error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

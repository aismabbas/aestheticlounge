/**
 * Ad Creative proxy — forwards POST to Railway worker.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const WORKER_URL = process.env.WORKER_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!WORKER_URL || !WORKER_SECRET) {
    return NextResponse.json({ error: 'Worker not configured' }, { status: 503 });
  }

  const body = await req.text();

  const res = await fetch(`${WORKER_URL}/ad-creative`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Worker-Secret': WORKER_SECRET,
    },
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

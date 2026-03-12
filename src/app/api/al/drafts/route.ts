/**
 * Drafts proxy — forwards GET/POST to Railway worker.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const WORKER_URL = process.env.W_URL;
const WORKER_SECRET = process.env.W_SEC;

async function proxyToWorker(req: NextRequest, method: string, path: string, body?: string) {
  if (!WORKER_URL || !WORKER_SECRET) {
    return NextResponse.json({ error: 'Worker not configured' }, { status: 503 });
  }

  const url = `${WORKER_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Worker-Secret': WORKER_SECRET,
    },
    ...(body ? { body } : {}),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stage = req.nextUrl.searchParams.get('stage') || '';
  const limit = req.nextUrl.searchParams.get('limit') || '20';
  const qs = new URLSearchParams();
  if (stage) qs.set('stage', stage);
  qs.set('limit', limit);

  return proxyToWorker(req, 'GET', `/drafts?${qs.toString()}`);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.text();
  return proxyToWorker(req, 'POST', '/drafts', body);
}

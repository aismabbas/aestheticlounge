/**
 * Ads Chat proxy — forwards SSE requests to Railway worker.
 */
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

const WORKER_URL = process.env.W_URL;
const WORKER_SECRET = process.env.W_SEC;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!WORKER_URL || !WORKER_SECRET) {
    return new Response(JSON.stringify({ error: 'Worker not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.text();

  const workerRes = await fetch(`${WORKER_URL}/ads/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Worker-Secret': WORKER_SECRET,
    },
    body,
  });

  if (!workerRes.ok || !workerRes.body) {
    const text = await workerRes.text().catch(() => 'Worker error');
    return new Response(JSON.stringify({ error: text }), {
      status: workerRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(workerRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

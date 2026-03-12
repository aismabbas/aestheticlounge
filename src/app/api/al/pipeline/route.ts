/**
 * Pipeline proxy — forwards all SSE requests to Railway worker.
 * Replaces the 1387-line original route.ts.
 */
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

// Allow up to 5 minutes for Opus + web research pipeline
export const maxDuration = 300;

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

  // 5-minute timeout — Opus + web search can take 2+ minutes
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000);

  let workerRes: Response;
  try {
    workerRes = await fetch(`${WORKER_URL}/pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': WORKER_SECRET,
      },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    return new Response(JSON.stringify({ error: 'Worker timeout or unreachable' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  clearTimeout(timeout);

  if (!workerRes.ok || !workerRes.body) {
    const text = await workerRes.text().catch(() => 'Worker error');
    return new Response(JSON.stringify({ error: text }), {
      status: workerRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Pipe SSE stream directly — zero buffering
  return new Response(workerRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

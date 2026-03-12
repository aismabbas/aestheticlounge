/**
 * Issues a short-lived HMAC token for direct browser→Railway pipeline calls.
 * This avoids Netlify proxy timeout issues with long-running Opus requests.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createHmac } from 'crypto';

const WORKER_SECRET = process.env.W_SEC || '';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Token valid for 10 minutes
  const expires = Math.floor(Date.now() / 1000) + 600;
  const payload = `pipeline:${expires}`;
  const sig = createHmac('sha256', WORKER_SECRET).update(payload).digest('hex');

  return NextResponse.json({
    token: `${payload}:${sig}`,
    workerUrl: process.env.W_URL,
    expires,
  });
}

import type { Context, Next } from 'hono';
import { createHmac } from 'crypto';

/**
 * Validate auth — accepts either:
 * 1. X-Worker-Secret header (from Netlify proxy)
 * 2. Authorization: Bearer <pipeline-token> (from browser direct call)
 */
export async function authMiddleware(c: Context, next: Next) {
  const expected = process.env.WORKER_SECRET;
  if (!expected) {
    return c.json({ error: 'WORKER_SECRET not configured' }, 500);
  }

  // Mode 1: Direct secret header (from Netlify proxy)
  const secret = c.req.header('X-Worker-Secret');
  if (secret && secret === expected) {
    await next();
    return;
  }

  // Mode 2: Signed pipeline token (from browser)
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const parts = token.split(':');
    if (parts.length === 3) {
      const [prefix, expiresStr, sig] = parts;
      const payload = `${prefix}:${expiresStr}`;
      const expectedSig = createHmac('sha256', expected).update(payload).digest('hex');

      if (sig === expectedSig) {
        const expires = parseInt(expiresStr, 10);
        if (expires > Math.floor(Date.now() / 1000)) {
          await next();
          return;
        }
      }
    }
  }

  return c.json({ error: 'Unauthorized' }, 401);
}

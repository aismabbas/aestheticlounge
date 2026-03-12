import type { Context, Next } from 'hono';

/**
 * Validate X-Worker-Secret header.
 * Netlify proxy adds this header after verifying the user session.
 */
export async function authMiddleware(c: Context, next: Next) {
  const secret = c.req.header('X-Worker-Secret');
  const expected = process.env.WORKER_SECRET;

  if (!expected) {
    return c.json({ error: 'WORKER_SECRET not configured' }, 500);
  }

  if (!secret || secret !== expected) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
}

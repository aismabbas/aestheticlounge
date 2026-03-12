/**
 * AL Worker — Hono server for heavy AI pipeline work.
 * Replaces Netlify serverless for pipeline, drafts, ad-creative, and ads chat.
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth.js';
import { pipelineRoute } from './routes/pipeline.js';
import { draftsRoute } from './routes/drafts.js';
import { adCreativeRoute } from './routes/ad-creative.js';
import { adsChatRoute } from './routes/ads-chat.js';

const app = new Hono();

// CORS — allow browser direct calls from Netlify site
app.use('*', cors({
  origin: ['https://aesthetic-lounge-dev.netlify.app', 'https://aestheticloungeofficial.com', 'http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Worker-Secret'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

// Health check — no auth needed (Railway uses this for auto-sleep wakeup)
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All worker routes require X-Worker-Secret
app.use('/pipeline', authMiddleware);
app.use('/drafts', authMiddleware);
app.use('/ad-creative', authMiddleware);
app.use('/ads/chat', authMiddleware);

// Routes
app.route('/pipeline', pipelineRoute);
app.route('/drafts', draftsRoute);
app.route('/ad-creative', adCreativeRoute);
app.route('/ads/chat', adsChatRoute);

// Start server
const port = parseInt(process.env.PORT || '3000');
console.log(`[al-worker] v4.2-delete Starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

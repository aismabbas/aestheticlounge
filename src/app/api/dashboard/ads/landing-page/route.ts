import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';
import {
  loadAgentMemory,
  buildSystemPrompt,
  callClaude,
  parseJSON,
  logDecision,
} from '@/lib/al-pipeline';

/**
 * POST /api/dashboard/ads/landing-page — Generate a new landing page via AI
 * GET /api/dashboard/ads/landing-page?slug=xxx — Get landing page by slug
 * PATCH /api/dashboard/ads/landing-page — Update landing page
 */

export async function POST(req: NextRequest) {
  const { session, allowed } = await checkApiPermission('ads:edit');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { treatment, campaignId } = await req.json();
    if (!treatment) {
      return NextResponse.json({ error: 'treatment is required' }, { status: 400 });
    }

    // Generate landing page content via Claude
    const copyMem = await loadAgentMemory('copywriter');
    const response = await callClaude({
      agent: 'copywriter',
      userMessage: `Generate a landing page for: ${treatment}

This is for a Meta ad campaign landing page for Aesthetic Lounge, a medical aesthetics clinic in DHA Phase 8, Lahore, Pakistan.

Output JSON:
{
  "slug": "kebab-case-url-slug",
  "headline": "Emotional headline with em-dash split (e.g. 'Silky Smooth — Permanently')",
  "subheadline": "2-3 sentences expanding the promise",
  "problem_points": ["3 pain points the audience relates to"],
  "solution_points": ["3 solution points showing how the treatment helps"],
  "steps": [
    {"title": "Step name", "description": "1-2 sentences"}
  ],
  "faqs": [
    {"q": "Common question", "a": "Detailed answer"}
  ],
  "price_display": "Starting from PKR XX,000",
  "cta_text": "Book Free Consultation",
  "whatsapp_message": "Hi, I'm interested in [treatment] at Aesthetic Lounge...",
  "meta_title": "SEO title | Aesthetic Lounge",
  "meta_description": "SEO description under 160 chars"
}

Include 4 steps, 5 FAQs. Medical disclaimer language where needed. No competitor names.`,
      systemPrompt: buildSystemPrompt(copyMem),
      temperature: 0.4,
      maxTokens: 4096,
    });

    const parsed = parseJSON<{
      slug: string;
      headline: string;
      subheadline: string;
      problem_points: string[];
      solution_points: string[];
      steps: { title: string; description: string }[];
      faqs: { q: string; a: string }[];
      price_display: string;
      cta_text: string;
      whatsapp_message: string;
      meta_title: string;
      meta_description: string;
    }>(response.text);

    if (!parsed?.slug || !parsed?.headline) {
      return NextResponse.json({ error: 'AI failed to generate valid landing page content' }, { status: 500 });
    }

    const id = ulid();
    await query(
      `INSERT INTO al_landing_pages
       (id, slug, treatment, headline, subheadline, problem_points, solution_points, steps, faqs,
        price_display, cta_text, whatsapp_message, meta_title, meta_description, campaign_id, status)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb,
        $10, $11, $12, $13, $14, $15, 'active')`,
      [
        id, parsed.slug, treatment, parsed.headline, parsed.subheadline,
        JSON.stringify(parsed.problem_points), JSON.stringify(parsed.solution_points),
        JSON.stringify(parsed.steps), JSON.stringify(parsed.faqs),
        parsed.price_display, parsed.cta_text, parsed.whatsapp_message,
        parsed.meta_title, parsed.meta_description, campaignId || null,
      ],
    );

    await logDecision('copywriter', 'landing_page_create', `Generated LP for ${treatment}`, id);

    return NextResponse.json({
      success: true,
      id,
      slug: parsed.slug,
      url: `/lp/${parsed.slug}`,
    });
  } catch (err) {
    console.error('[landing-page] POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate landing page' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await checkApiPermission('ads:view');
  if (!session.allowed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const slug = req.nextUrl.searchParams.get('slug');

  try {
    if (slug) {
      const { rows } = await query(`SELECT * FROM al_landing_pages WHERE slug = $1`, [slug]);
      if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ landingPage: rows[0] });
    }

    const { rows } = await query(
      `SELECT id, slug, treatment, headline, status, campaign_id, created_at
       FROM al_landing_pages ORDER BY created_at DESC LIMIT 50`,
    );
    return NextResponse.json({ landingPages: rows });
  } catch (err) {
    console.error('[landing-page] GET error:', err);
    return NextResponse.json({ error: 'Failed to load landing pages' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { session, allowed } = await checkApiPermission('ads:edit');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const allowedFields = ['headline', 'subheadline', 'problem_points', 'solution_points', 'steps', 'faqs', 'price_display', 'cta_text', 'whatsapp_message', 'meta_title', 'meta_description', 'status'];

    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedFields.includes(key)) continue;
      const isJsonb = ['problem_points', 'solution_points', 'steps', 'faqs'].includes(key);
      sets.push(`${key} = $${idx}${isJsonb ? '::jsonb' : ''}`);
      params.push(isJsonb ? JSON.stringify(value) : value);
      idx++;
    }

    if (sets.length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });

    sets.push(`updated_at = NOW()`);
    params.push(id);

    await query(`UPDATE al_landing_pages SET ${sets.join(', ')} WHERE id = $${idx}`, params);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[landing-page] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update landing page' }, { status: 500 });
  }
}

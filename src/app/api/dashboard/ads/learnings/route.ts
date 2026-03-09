import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission } from '@/lib/auth';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';

/**
 * GET /api/dashboard/ads/learnings?category=targeting
 * Returns all learnings, optionally filtered by category.
 *
 * POST /api/dashboard/ads/learnings
 * Body: { campaign_name, category, learning, impact }
 * Adds a new learning entry.
 */
export async function GET(req: NextRequest) {
  const { session, allowed } = await checkApiPermission('ads:view');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const category = req.nextUrl.searchParams.get('category');
    let result;

    if (category) {
      result = await query(
        `SELECT id, campaign_name, category, learning, impact, created_by, created_at
         FROM al_ad_learnings
         WHERE category = $1
         ORDER BY created_at DESC`,
        [category],
      );
    } else {
      result = await query(
        `SELECT id, campaign_name, category, learning, impact, created_by, created_at
         FROM al_ad_learnings
         ORDER BY created_at DESC`,
      );
    }

    return NextResponse.json({ learnings: result.rows });
  } catch (err) {
    console.error('[ads/learnings] GET error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch learnings' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const { session, allowed } = await checkApiPermission('ads:edit');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { campaign_name, category, learning, impact } = body;

    if (!category || !learning) {
      return NextResponse.json(
        { error: 'category and learning are required' },
        { status: 400 },
      );
    }

    const id = ulid();
    await query(
      `INSERT INTO al_ad_learnings (id, campaign_name, category, learning, impact, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, campaign_name || null, category, learning, impact || null, session.name, new Date().toISOString()],
    );

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('[ads/learnings] POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save learning' },
      { status: 500 },
    );
  }
}

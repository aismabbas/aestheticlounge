import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/al/status
 * Returns pipeline readiness and recent activity for the marketing studio.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasFalKey = !!process.env.FAL_KEY;
  const hasInstagram = !!process.env.INSTAGRAM_ACCOUNT_ID && !!(process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN);

  // Recent activity from decision log
  let recentActivity: Record<string, unknown>[] = [];
  try {
    const result = await query(
      `SELECT id, agent, action, decision, result, created_at
       FROM al_decision_log
       ORDER BY created_at DESC
       LIMIT 15`,
    );
    recentActivity = result.rows;
  } catch {
    // Table may not exist yet
  }

  // Draft counts by stage
  let draftCounts: Record<string, number> = {};
  try {
    const result = await query(
      `SELECT stage, COUNT(*)::int as count FROM al_pipeline_drafts GROUP BY stage`,
    );
    for (const row of result.rows) {
      draftCounts[row.stage] = row.count;
    }
  } catch {
    // Table may not exist yet
  }

  return NextResponse.json({
    ready: hasAnthropicKey && hasFalKey,
    services: {
      claude: hasAnthropicKey,
      falAi: hasFalKey,
      instagram: hasInstagram,
    },
    draftCounts,
    recentActivity,
  });
}

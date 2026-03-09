import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calculateLeadScore, buildFactorsFromLead } from '@/lib/lead-scoring';
import { checkAuth } from '@/lib/api-auth';

/**
 * POST /api/dashboard/leads/score
 * Body: { lead_id: string } or { bulk: true }
 *
 * Recalculates lead score from behavioral signals and updates the DB.
 */
export async function POST(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.bulk) {
      // Recalculate all leads
      const result = await query('SELECT * FROM al_leads');
      let updated = 0;

      for (const lead of result.rows) {
        const factors = buildFactorsFromLead(lead);

        // Check response speed from performance data
        const responseCheck = await query(
          `SELECT response_seconds FROM al_response_times WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [lead.id],
        ).catch(() => ({ rows: [] }));

        if (responseCheck.rows.length > 0 && responseCheck.rows[0].response_seconds < 300) {
          factors.responseSpeedUnder5Min = true;
        }

        const scoreResult = calculateLeadScore(factors);

        await query(
          `UPDATE al_leads SET score = $1, score_factors = $2, last_activity_at = COALESCE(last_activity_at, updated_at, created_at) WHERE id = $3`,
          [scoreResult.score, JSON.stringify(scoreResult.factors), lead.id],
        );
        updated++;
      }

      return NextResponse.json({ updated, message: `Recalculated scores for ${updated} leads` });
    }

    // Single lead
    const { lead_id } = body;
    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id required' }, { status: 400 });
    }

    const result = await query('SELECT * FROM al_leads WHERE id = $1', [lead_id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = result.rows[0];
    const factors = buildFactorsFromLead(lead);

    // Check response speed
    const responseCheck = await query(
      `SELECT response_seconds FROM al_response_times WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [lead_id],
    ).catch(() => ({ rows: [] }));

    if (responseCheck.rows.length > 0 && responseCheck.rows[0].response_seconds < 300) {
      factors.responseSpeedUnder5Min = true;
    }

    const scoreResult = calculateLeadScore(factors);

    await query(
      `UPDATE al_leads SET score = $1, score_factors = $2 WHERE id = $3`,
      [scoreResult.score, JSON.stringify(scoreResult.factors), lead_id],
    );

    return NextResponse.json({
      lead_id,
      ...scoreResult,
    });
  } catch (err) {
    console.error('[leads/score] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

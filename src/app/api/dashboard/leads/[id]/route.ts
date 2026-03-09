import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calculateLeadScore, buildFactorsFromLead } from '@/lib/lead-scoring';
import { checkAuth } from '@/lib/api-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const lead = await query('SELECT * FROM al_leads WHERE id = $1', [id]);
    if (lead.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const leadData = lead.rows[0];

    // Compute live score
    const factors = buildFactorsFromLead(leadData);

    // Check response speed
    const responseCheck = await query(
      `SELECT response_seconds FROM al_response_times WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [id],
    ).catch(() => ({ rows: [] }));

    if (responseCheck.rows.length > 0 && responseCheck.rows[0].response_seconds < 300) {
      factors.responseSpeedUnder5Min = true;
    }

    const scoreResult = calculateLeadScore(factors);

    const conversations = await query(
      'SELECT * FROM al_conversations WHERE lead_id = $1 ORDER BY created_at ASC',
      [id],
    );

    return NextResponse.json({
      lead: {
        ...leadData,
        computed_score: scoreResult.score,
        computed_label: scoreResult.label,
        score_breakdown: scoreResult.factors,
      },
      conversations: conversations.rows,
    });
  } catch (err) {
    console.error('[dashboard/leads/[id]] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const allowedFields = ['stage', 'quality', 'notes', 'interest', 'score', 'score_factors', 'conversion_value', 'converted_at', 'assigned_to'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'score_factors') {
          values.push(JSON.stringify(body[field]));
        } else {
          values.push(body[field]);
        }
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(new Date().toISOString());
    updates.push(`updated_at = $${values.length}`);
    updates.push(`last_activity_at = $${values.length}`);

    values.push(id);
    const sql = `UPDATE al_leads SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;

    const result = await query(sql, values);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('[dashboard/leads/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === 'convert_to_client') {
      const lead = await query('SELECT * FROM al_leads WHERE id = $1', [id]);
      if (lead.rows.length === 0) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }

      const l = lead.rows[0];
      const clientResult = await query(
        `INSERT INTO al_clients (name, phone, email, source, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id`,
        [l.name, l.phone, l.email, l.source],
      );

      // Mark lead as converted
      await query(
        `UPDATE al_leads SET stage = 'visited', converted_at = NOW() WHERE id = $1`,
        [id],
      );

      return NextResponse.json({ clientId: clientResult.rows[0].id });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[dashboard/leads/[id]] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

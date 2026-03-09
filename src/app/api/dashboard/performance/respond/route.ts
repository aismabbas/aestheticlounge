import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { lead_id, channel } = body;

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
    }

    // Look up the lead's created_at
    const leadResult = await query(
      'SELECT id, created_at FROM al_leads WHERE id = $1',
      [lead_id],
    );

    if (leadResult.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leadResult.rows[0];
    const leadCreatedAt = new Date(lead.created_at);
    const now = new Date();
    const responseSeconds = Math.floor((now.getTime() - leadCreatedAt.getTime()) / 1000);

    // Check if already responded
    const existing = await query(
      'SELECT id FROM al_lead_response_times WHERE lead_id = $1',
      [lead_id],
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({
        error: 'Response already recorded for this lead',
        response_seconds: responseSeconds,
      }, { status: 409 });
    }

    // Insert response time record
    const result = await query(
      `INSERT INTO al_lead_response_times
        (lead_id, staff_id, lead_created_at, first_response_at, response_seconds, channel)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [lead_id, user.staffId, leadCreatedAt.toISOString(), now.toISOString(), responseSeconds, channel || 'whatsapp'],
    );

    return NextResponse.json({
      success: true,
      response_seconds: responseSeconds,
      record: result.rows[0],
    });
  } catch (err) {
    console.error('[dashboard/performance/respond] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

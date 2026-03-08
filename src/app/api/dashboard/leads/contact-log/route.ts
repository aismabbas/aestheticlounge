import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('al_session');
  if (!session?.value) return null;
  try {
    const data = JSON.parse(session.value);
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { lead_id, channel, notes, outcome } = body;

    if (!lead_id || !channel || !outcome) {
      return NextResponse.json(
        { error: 'lead_id, channel, and outcome are required' },
        { status: 400 },
      );
    }

    const validChannels = ['phone', 'whatsapp', 'email'];
    const validOutcomes = ['connected', 'no_answer', 'busy', 'voicemail', 'callback_requested'];

    if (!validChannels.includes(channel)) {
      return NextResponse.json({ error: `Invalid channel. Must be: ${validChannels.join(', ')}` }, { status: 400 });
    }
    if (!validOutcomes.includes(outcome)) {
      return NextResponse.json({ error: `Invalid outcome. Must be: ${validOutcomes.join(', ')}` }, { status: 400 });
    }

    // Look up the lead
    const leadResult = await query(
      'SELECT id, created_at, stage FROM al_leads WHERE id = $1',
      [lead_id],
    );
    if (leadResult.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leadResult.rows[0];
    const leadCreatedAt = new Date(lead.created_at);
    const now = new Date();
    const responseSeconds = Math.floor((now.getTime() - leadCreatedAt.getTime()) / 1000);

    // Check if first response already recorded
    const existing = await query(
      'SELECT id FROM al_lead_response_times WHERE lead_id = $1',
      [lead_id],
    );

    if (existing.rows.length === 0) {
      // First contact — record response time
      await query(
        `INSERT INTO al_lead_response_times
          (lead_id, staff_id, lead_created_at, first_response_at, response_seconds, channel)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [lead_id, user.staffId, leadCreatedAt.toISOString(), now.toISOString(), responseSeconds, channel],
      );
    }

    // Append notes to lead if provided
    const noteEntry = `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] ${channel.toUpperCase()} - ${outcome}${notes ? ': ' + notes : ''}`;

    // Update lead: move from 'new' to 'contacted' and append note
    await query(
      `UPDATE al_leads
       SET stage = CASE WHEN stage = 'new' THEN 'contacted' ELSE stage END,
           notes = CASE
             WHEN notes IS NULL OR notes = '' THEN $1
             ELSE notes || E'\\n' || $1
           END,
           updated_at = NOW(),
           last_activity_at = NOW()
       WHERE id = $2`,
      [noteEntry, lead_id],
    );

    return NextResponse.json({
      success: true,
      response_seconds: responseSeconds,
      first_contact: existing.rows.length === 0,
      outcome,
    });
  } catch (err) {
    console.error('[dashboard/leads/contact-log] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

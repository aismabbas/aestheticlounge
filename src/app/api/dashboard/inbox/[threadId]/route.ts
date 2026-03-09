import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';
import { checkAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  PATCH — Update thread (assign, status)                             */
/* ------------------------------------------------------------------ */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { threadId } = await params;

  try {
    const body = await req.json();
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 0;

    if (body.assigned_to !== undefined) {
      idx++;
      updates.push(`assigned_to = $${idx}`);
      values.push(body.assigned_to || null);
    }

    if (body.lead_id !== undefined) {
      idx++;
      updates.push(`lead_id = $${idx}`);
      values.push(body.lead_id || null);
    }

    if (body.client_id !== undefined) {
      idx++;
      updates.push(`client_id = $${idx}`);
      values.push(body.client_id || null);
    }

    if (body.status !== undefined) {
      if (!['open', 'closed', 'snoozed'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      idx++;
      updates.push(`status = $${idx}`);
      values.push(body.status);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    idx++;
    values.push(threadId);

    await query(
      `UPDATE al_unified_inbox SET ${updates.join(', ')} WHERE id = $${idx}`,
      values,
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[inbox/thread] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Actions: create_lead, link_client                           */
/* ------------------------------------------------------------------ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { threadId } = await params;

  try {
    const body = await req.json();
    const { action } = body;

    // Get thread
    const threadRes = await query(
      `SELECT * FROM al_unified_inbox WHERE id = $1`,
      [threadId],
    );
    if (threadRes.rows.length === 0) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }
    const thread = threadRes.rows[0];

    if (action === 'create_lead') {
      const leadId = ulid();
      const name = body.name || thread.contact_name || 'Unknown';
      const phone = body.phone || thread.contact_phone || '';
      const email = body.email || '';
      const treatment = body.treatment || '';

      // Auto-populate social profiles from thread data
      const igHandle = thread.contact_ig_handle || null;
      const fbId = thread.contact_fb_id || null;
      const waNumber = thread.channel === 'whatsapp' ? (thread.contact_phone || null) : null;

      await query(
        `INSERT INTO al_leads (
          id, name, phone, email, booked_treatment, source,
          instagram_handle, facebook_id, whatsapp_number, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [leadId, name, phone, email || null, treatment || null, `inbox_${thread.channel}`,
         igHandle, fbId, waNumber],
      );

      await query(
        `UPDATE al_unified_inbox SET lead_id = $1 WHERE id = $2`,
        [leadId, threadId],
      );

      return NextResponse.json({ lead_id: leadId, name });
    }

    if (action === 'link_client') {
      const { client_id } = body;
      if (!client_id) {
        return NextResponse.json({ error: 'client_id required' }, { status: 400 });
      }

      await query(
        `UPDATE al_unified_inbox SET client_id = $1 WHERE id = $2`,
        [client_id, threadId],
      );

      return NextResponse.json({ ok: true, client_id });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[inbox/thread] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

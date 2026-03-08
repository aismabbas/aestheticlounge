import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';

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

      await query(
        `INSERT INTO al_leads (
          id, name, phone, email, treatment, source, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [leadId, name, phone, email || null, treatment || null, `inbox_${thread.channel}`],
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

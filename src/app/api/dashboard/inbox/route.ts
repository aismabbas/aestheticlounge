import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const threadId = req.nextUrl.searchParams.get('thread_id');

    // If thread_id provided, return messages for that thread
    if (threadId) {
      const messages = await query(
        `SELECT
          m.id, m.thread_id, m.external_id, m.direction, m.channel,
          m.content, m.media_url, m.media_type, m.sent_by, m.status,
          m.metadata, m.created_at,
          s.name AS sent_by_name
        FROM al_inbox_messages m
        LEFT JOIN al_staff s ON m.sent_by = s.id
        WHERE m.thread_id = $1
        ORDER BY m.created_at ASC`,
        [threadId],
      );

      // Mark as read
      await query(
        `UPDATE al_unified_inbox SET unread_count = 0 WHERE id = $1`,
        [threadId],
      );

      return NextResponse.json({ messages: messages.rows });
    }

    // List threads with filters
    const channel = req.nextUrl.searchParams.get('channel');
    const status = req.nextUrl.searchParams.get('status') || 'open';
    const assignedTo = req.nextUrl.searchParams.get('assigned_to');
    const search = req.nextUrl.searchParams.get('search');

    let sql = `
      SELECT
        t.id, t.channel, t.external_id, t.contact_name, t.contact_phone,
        t.contact_ig_handle, t.contact_fb_id, t.contact_avatar,
        t.lead_id, t.client_id, t.assigned_to, t.status,
        t.unread_count, t.last_message_at, t.created_at,
        s.name AS assigned_to_name,
        lm.content AS last_message,
        lm.media_type AS last_message_type
      FROM al_unified_inbox t
      LEFT JOIN al_staff s ON t.assigned_to = s.id
      LEFT JOIN LATERAL (
        SELECT content, media_type FROM al_inbox_messages
        WHERE thread_id = t.id
        ORDER BY created_at DESC LIMIT 1
      ) lm ON true
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIdx = 0;

    if (channel && channel !== 'all') {
      paramIdx++;
      sql += ` AND t.channel = $${paramIdx}`;
      params.push(channel);
    }

    if (status && status !== 'all') {
      paramIdx++;
      sql += ` AND t.status = $${paramIdx}`;
      params.push(status);
    }

    if (assignedTo) {
      paramIdx++;
      sql += ` AND t.assigned_to = $${paramIdx}`;
      params.push(assignedTo);
    }

    if (search) {
      paramIdx++;
      const searchPattern = `%${search}%`;
      sql += ` AND (
        t.contact_name ILIKE $${paramIdx}
        OR t.contact_phone ILIKE $${paramIdx}
        OR t.contact_ig_handle ILIKE $${paramIdx}
      )`;
      params.push(searchPattern);
    }

    sql += ` ORDER BY t.last_message_at DESC NULLS LAST LIMIT 100`;

    const threads = await query(sql, params);

    // Also get summary counts
    const summary = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open' AND unread_count > 0)::int AS total_unread_threads,
        COUNT(*) FILTER (WHERE channel = 'whatsapp' AND unread_count > 0 AND status = 'open')::int AS whatsapp_unread,
        COUNT(*) FILTER (WHERE channel = 'instagram_dm' AND unread_count > 0 AND status = 'open')::int AS ig_dm_unread,
        COUNT(*) FILTER (WHERE channel = 'messenger' AND unread_count > 0 AND status = 'open')::int AS messenger_unread,
        COUNT(*) FILTER (WHERE channel IN ('ig_comment', 'fb_comment') AND unread_count > 0 AND status = 'open')::int AS comments_unread,
        COUNT(*) FILTER (WHERE status = 'open')::int AS open_count,
        COUNT(*) FILTER (WHERE status = 'closed')::int AS closed_count,
        COUNT(*) FILTER (WHERE status = 'snoozed')::int AS snoozed_count
      FROM al_unified_inbox
    `);

    return NextResponse.json({
      threads: threads.rows,
      summary: summary.rows[0] || {},
    });
  } catch (err) {
    console.error('[dashboard/inbox] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

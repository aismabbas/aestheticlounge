import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const phone = req.nextUrl.searchParams.get('phone');

    if (phone) {
      // Get specific thread with all messages
      const messages = await query(
        `SELECT c.*, l.name
         FROM al_conversations c
         LEFT JOIN al_leads l ON c.lead_id = l.id
         WHERE c.phone = $1
         ORDER BY c.created_at ASC`,
        [phone],
      );

      const name = messages.rows.length > 0 ? messages.rows[0].name : null;
      const lastMsg = messages.rows.length > 0 ? messages.rows[messages.rows.length - 1] : null;

      return NextResponse.json({
        threads: [{
          phone,
          name,
          lastMessage: lastMsg?.content || null,
          unread: 0,
          messages: messages.rows,
        }],
      });
    }

    // Get all threads grouped by phone
    const threads = await query(
      `SELECT
         c.phone,
         l.name,
         0 AS unread,
         MAX(c.created_at) AS last_message_at
       FROM al_conversations c
       LEFT JOIN al_leads l ON c.lead_id = l.id
       GROUP BY c.phone, l.name
       ORDER BY last_message_at DESC`,
    );

    const threadList = [];
    for (const t of threads.rows) {
      const lastMsg = await query(
        `SELECT content, message FROM al_conversations WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`,
        [t.phone],
      );

      threadList.push({
        phone: t.phone,
        name: t.name,
        lastMessage: lastMsg.rows[0]?.content || lastMsg.rows[0]?.message || null,
        unread: parseInt(t.unread, 10),
        messages: [],
      });
    }

    return NextResponse.json({ threads: threadList });
  } catch (err) {
    console.error('[dashboard/conversations] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

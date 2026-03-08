import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';
import {
  getInstagramConversations,
  getMessengerConversations,
  getInstagramComments,
  getFacebookComments,
  getChannelStatus,
} from '@/lib/meta-conversations';

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

  const channels = getChannelStatus();
  const results = {
    instagram_dm: 0,
    messenger: 0,
    ig_comment: 0,
    fb_comment: 0,
    errors: [] as string[],
  };

  // Sync Instagram DMs
  if (channels.instagram_dm) {
    try {
      const convos = await getInstagramConversations(25);
      if (convos) {
        for (const convo of convos) {
          const participant = convo.participants?.data?.find(
            (p) => p.id !== process.env.INSTAGRAM_BUSINESS_ID,
          );
          if (!participant) continue;

          // Find or create thread
          let threadId = await findThread('instagram_dm', participant.id);
          if (!threadId) {
            threadId = ulid();
            await query(
              `INSERT INTO al_unified_inbox (
                id, channel, external_id, contact_name, contact_ig_handle,
                status, unread_count, last_message_at, created_at
              ) VALUES ($1, 'instagram_dm', $2, $3, $4, 'open', 0, NOW(), NOW())`,
              [threadId, participant.id, participant.name || participant.username, participant.username || null],
            );
          }

          // Insert messages
          if (convo.messages?.data) {
            for (const msg of convo.messages.data) {
              const inserted = await upsertMessage({
                threadId,
                externalId: msg.id,
                direction: msg.from.id === participant.id ? 'inbound' : 'outbound',
                channel: 'instagram_dm',
                content: msg.message || '',
                mediaUrl: msg.attachments?.data?.[0]?.image_data?.url || null,
                mediaType: msg.attachments?.data?.[0] ? 'image' : 'text',
                timestamp: msg.created_time,
              });
              if (inserted) results.instagram_dm++;
            }
          }

          // Update thread last_message_at
          await query(
            `UPDATE al_unified_inbox SET last_message_at = (
              SELECT MAX(created_at) FROM al_inbox_messages WHERE thread_id = $1
            ) WHERE id = $1`,
            [threadId],
          );
        }
      }
    } catch (err) {
      console.error('[inbox/sync] Instagram DM error:', err);
      results.errors.push('Instagram DM sync failed');
    }
  }

  // Sync Messenger conversations
  if (channels.messenger) {
    try {
      const convos = await getMessengerConversations(25);
      if (convos) {
        for (const convo of convos) {
          const participant = convo.participants?.data?.find(
            (p) => p.id !== process.env.META_PAGE_ID,
          );
          if (!participant) continue;

          let threadId = await findThread('messenger', participant.id);
          if (!threadId) {
            threadId = ulid();
            await query(
              `INSERT INTO al_unified_inbox (
                id, channel, external_id, contact_name, contact_fb_id,
                status, unread_count, last_message_at, created_at
              ) VALUES ($1, 'messenger', $2, $3, $4, 'open', 0, NOW(), NOW())`,
              [threadId, participant.id, participant.name, participant.id],
            );
          }

          if (convo.messages?.data) {
            for (const msg of convo.messages.data) {
              const inserted = await upsertMessage({
                threadId,
                externalId: msg.id,
                direction: msg.from.id === participant.id ? 'inbound' : 'outbound',
                channel: 'messenger',
                content: msg.message || '',
                mediaUrl: null,
                mediaType: 'text',
                timestamp: msg.created_time,
              });
              if (inserted) results.messenger++;
            }
          }

          await query(
            `UPDATE al_unified_inbox SET last_message_at = (
              SELECT MAX(created_at) FROM al_inbox_messages WHERE thread_id = $1
            ) WHERE id = $1`,
            [threadId],
          );
        }
      }
    } catch (err) {
      console.error('[inbox/sync] Messenger error:', err);
      results.errors.push('Messenger sync failed');
    }
  }

  // Sync Instagram comments
  if (channels.ig_comment) {
    try {
      const comments = await getInstagramComments();
      if (comments) {
        for (const comment of comments) {
          if (!comment.from) continue;
          const handle = comment.from.username || comment.from.name || 'unknown';

          let threadId = await findThread('ig_comment', comment.from.id || handle);
          if (!threadId) {
            threadId = ulid();
            await query(
              `INSERT INTO al_unified_inbox (
                id, channel, external_id, contact_name, contact_ig_handle,
                status, unread_count, last_message_at, created_at
              ) VALUES ($1, 'ig_comment', $2, $3, $4, 'open', 0, NOW(), NOW())`,
              [threadId, comment.from.id || handle, comment.from.name || handle, comment.from.username || null],
            );
          }

          const inserted = await upsertMessage({
            threadId,
            externalId: comment.id,
            direction: 'inbound',
            channel: 'ig_comment',
            content: comment.text,
            mediaUrl: null,
            mediaType: 'text',
            timestamp: comment.timestamp,
          });
          if (inserted) results.ig_comment++;
        }
      }
    } catch (err) {
      console.error('[inbox/sync] IG comments error:', err);
      results.errors.push('Instagram comments sync failed');
    }
  }

  // Sync Facebook comments
  if (channels.fb_comment) {
    try {
      const comments = await getFacebookComments();
      if (comments) {
        for (const comment of comments) {
          if (!comment.from) continue;

          let threadId = await findThread('fb_comment', comment.from.id || 'unknown');
          if (!threadId) {
            threadId = ulid();
            await query(
              `INSERT INTO al_unified_inbox (
                id, channel, external_id, contact_name, contact_fb_id,
                status, unread_count, last_message_at, created_at
              ) VALUES ($1, 'fb_comment', $2, $3, $4, 'open', 0, NOW(), NOW())`,
              [threadId, comment.from.id, comment.from.name, comment.from.id],
            );
          }

          const inserted = await upsertMessage({
            threadId,
            externalId: comment.id,
            direction: 'inbound',
            channel: 'fb_comment',
            content: comment.text,
            mediaUrl: null,
            mediaType: 'text',
            timestamp: comment.timestamp,
          });
          if (inserted) results.fb_comment++;
        }
      }
    } catch (err) {
      console.error('[inbox/sync] FB comments error:', err);
      results.errors.push('Facebook comments sync failed');
    }
  }

  // Also sync WhatsApp conversations from the legacy al_conversations table
  try {
    const legacyConvos = await query(
      `SELECT DISTINCT phone FROM al_conversations ORDER BY phone`,
    );
    for (const row of legacyConvos.rows) {
      let threadId = await findThread('whatsapp', row.phone);
      if (!threadId) {
        // Check by phone
        const existingByPhone = await query(
          `SELECT id FROM al_unified_inbox WHERE channel = 'whatsapp' AND contact_phone = $1 LIMIT 1`,
          [row.phone],
        );
        if (existingByPhone.rows.length > 0) {
          threadId = existingByPhone.rows[0].id;
        }
      }

      if (!threadId) {
        // Get lead name
        const leadInfo = await query(
          `SELECT l.name FROM al_conversations c
           LEFT JOIN al_leads l ON c.lead_id = l.id
           WHERE c.phone = $1 AND l.name IS NOT NULL
           LIMIT 1`,
          [row.phone],
        );
        threadId = ulid();
        await query(
          `INSERT INTO al_unified_inbox (
            id, channel, external_id, contact_name, contact_phone,
            status, unread_count, last_message_at, created_at
          ) VALUES ($1, 'whatsapp', $2, $3, $2, 'open', 0, NOW(), NOW())`,
          [threadId, row.phone, leadInfo.rows[0]?.name || null],
        );
      }

      // Import messages
      const msgs = await query(
        `SELECT id, direction, content, message, status, created_at
         FROM al_conversations WHERE phone = $1 ORDER BY created_at ASC`,
        [row.phone],
      );
      for (const msg of msgs.rows) {
        await upsertMessage({
          threadId: threadId!,
          externalId: msg.id,
          direction: msg.direction || 'inbound',
          channel: 'whatsapp',
          content: msg.content || msg.message || '',
          mediaUrl: null,
          mediaType: 'text',
          timestamp: msg.created_at,
        });
      }

      // Update thread timestamps
      await query(
        `UPDATE al_unified_inbox SET
          last_message_at = (SELECT MAX(created_at) FROM al_inbox_messages WHERE thread_id = $1),
          unread_count = (SELECT COUNT(*) FROM al_inbox_messages WHERE thread_id = $1 AND direction = 'inbound' AND status != 'read')
        WHERE id = $1`,
        [threadId],
      );
    }
  } catch (err) {
    console.error('[inbox/sync] WhatsApp legacy sync error:', err);
    // Not critical — legacy table may not exist
  }

  return NextResponse.json({
    synced: results,
    channels,
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function findThread(
  channel: string,
  externalId: string,
): Promise<string | null> {
  const res = await query(
    `SELECT id FROM al_unified_inbox WHERE channel = $1 AND external_id = $2 LIMIT 1`,
    [channel, externalId],
  );
  return res.rows[0]?.id || null;
}

async function upsertMessage(params: {
  threadId: string;
  externalId: string;
  direction: string;
  channel: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string;
  timestamp: string;
}): Promise<boolean> {
  // Check duplicate
  const existing = await query(
    `SELECT id FROM al_inbox_messages WHERE external_id = $1 AND channel = $2 LIMIT 1`,
    [params.externalId, params.channel],
  );
  if (existing.rows.length > 0) return false;

  const id = ulid();
  await query(
    `INSERT INTO al_inbox_messages (
      id, thread_id, external_id, direction, channel,
      content, media_url, media_type, status, metadata, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'delivered', '{}', $9)`,
    [
      id,
      params.threadId,
      params.externalId,
      params.direction,
      params.channel,
      params.content,
      params.mediaUrl,
      params.mediaType,
      params.timestamp,
    ],
  );
  return true;
}

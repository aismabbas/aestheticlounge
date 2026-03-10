import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';

/* ------------------------------------------------------------------ */
/*  GET — Meta Webhook Verification Handshake                          */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error('[inbox-webhook] META_WEBHOOK_VERIFY_TOKEN not configured');
    return new NextResponse('Server not configured', { status: 500 });
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.info('[inbox-webhook] Verification successful');
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

/* ------------------------------------------------------------------ */
/*  POST — Incoming messages from all Meta channels                    */
/* ------------------------------------------------------------------ */

interface WebhookEntry {
  id: string;
  time: number;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
      attachments?: Array<{
        type: string;
        payload: { url: string };
      }>;
    };
  }>;
  changes?: Array<{
    field: string;
    value: {
      // WhatsApp
      messaging_product?: string;
      metadata?: { phone_number_id: string; display_phone_number: string };
      contacts?: Array<{ profile: { name: string }; wa_id: string }>;
      messages?: Array<{
        id: string;
        from: string;
        timestamp: string;
        type: string;
        text?: { body: string };
        image?: { id: string; mime_type: string; caption?: string };
        video?: { id: string; mime_type: string; caption?: string };
        document?: { id: string; mime_type: string; filename?: string; caption?: string };
      }>;
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
      }>;

      // Comments
      item?: string; // "comment"
      comment_id?: string;
      parent_id?: string;
      sender_name?: string;
      sender_id?: string;
      message?: string;
      post_id?: string;
      created_time?: number;
      from?: { id: string; name?: string; username?: string };
      media?: { id: string };
    };
  }>;
}

interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

export async function POST(req: NextRequest) {
  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Process in background
  processWebhook(payload).catch((err) =>
    console.error('[inbox-webhook] Processing error:', err),
  );

  return NextResponse.json({ received: true });
}

/* ------------------------------------------------------------------ */
/*  Processing                                                         */
/* ------------------------------------------------------------------ */

async function processWebhook(payload: WebhookPayload): Promise<void> {
  const obj = payload.object;

  for (const entry of payload.entry || []) {
    // Instagram / Messenger DMs via messaging array
    if (entry.messaging) {
      for (const event of entry.messaging) {
        if (!event.message) continue;
        const channel = obj === 'instagram' ? 'instagram_dm' : 'messenger';
        await handleIncomingMessage({
          channel,
          externalId: event.message.mid,
          senderId: event.sender.id,
          senderName: null,
          content: event.message.text || '',
          mediaUrl: event.message.attachments?.[0]?.payload?.url || null,
          mediaType: event.message.attachments?.[0]?.type || 'text',
          timestamp: new Date(event.timestamp).toISOString(),
        });
      }
    }

    // Changes array — WhatsApp + Comments
    for (const change of entry.changes || []) {
      // WhatsApp messages
      if (change.value.messaging_product === 'whatsapp' && change.value.messages) {
        for (const msg of change.value.messages) {
          const contactName =
            change.value.contacts?.[0]?.profile?.name || null;
          let content = '';
          let mediaType = 'text';
          if (msg.type === 'text') {
            content = msg.text?.body || '';
          } else if (msg.type === 'image') {
            content = msg.image?.caption || '';
            mediaType = 'image';
          } else if (msg.type === 'video') {
            content = msg.video?.caption || '';
            mediaType = 'video';
          } else if (msg.type === 'document') {
            content = msg.document?.caption || msg.document?.filename || '';
            mediaType = 'document';
          }

          await handleIncomingMessage({
            channel: 'whatsapp',
            externalId: msg.id,
            senderId: msg.from,
            senderName: contactName,
            senderPhone: msg.from,
            content,
            mediaUrl: null,
            mediaType,
            timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
          });
        }
      }

      // WhatsApp status updates
      if (change.value.messaging_product === 'whatsapp' && change.value.statuses) {
        for (const status of change.value.statuses) {
          await handleStatusUpdate(status.id, status.status);
        }
      }

      // Comments (Instagram or Facebook)
      if (change.field === 'comments' || change.value.item === 'comment') {
        const v = change.value;
        const channel = obj === 'instagram' ? 'ig_comment' : 'fb_comment';
        await handleIncomingMessage({
          channel,
          externalId: v.comment_id || v.from?.id || ulid(),
          senderId: v.sender_id || v.from?.id || 'unknown',
          senderName: v.sender_name || v.from?.name || v.from?.username || null,
          senderIgHandle: v.from?.username || null,
          content: v.message || '',
          mediaUrl: null,
          mediaType: 'text',
          timestamp: v.created_time
            ? new Date(v.created_time * 1000).toISOString()
            : new Date().toISOString(),
          metadata: {
            post_id: v.post_id || v.media?.id || null,
            parent_id: v.parent_id || null,
          },
        });
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Upsert thread + insert message                                     */
/* ------------------------------------------------------------------ */

interface IncomingMsg {
  channel: string;
  externalId: string;
  senderId: string;
  senderName: string | null;
  senderPhone?: string | null;
  senderIgHandle?: string | null;
  senderFbId?: string | null;
  content: string;
  mediaUrl: string | null;
  mediaType: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

async function handleIncomingMessage(msg: IncomingMsg): Promise<void> {
  // 1. Check for duplicate message
  const dupeCheck = await query(
    `SELECT id FROM al_inbox_messages WHERE external_id = $1 AND channel = $2 LIMIT 1`,
    [msg.externalId, msg.channel],
  );
  if (dupeCheck.rows.length > 0) return;

  // 2. Find or create thread
  let threadId: string | null = null;

  // Try to find by external contact ID + channel
  const existing = await query(
    `SELECT id FROM al_unified_inbox
     WHERE channel = $1 AND (
       external_id = $2
       OR ($3 IS NOT NULL AND contact_phone = $3)
       OR ($4 IS NOT NULL AND contact_ig_handle = $4)
       OR ($5 IS NOT NULL AND contact_fb_id = $5)
     )
     ORDER BY last_message_at DESC LIMIT 1`,
    [
      msg.channel,
      msg.senderId,
      msg.senderPhone || null,
      msg.senderIgHandle || null,
      msg.senderFbId || msg.senderId,
    ],
  );

  if (existing.rows.length > 0) {
    threadId = existing.rows[0].id;
  } else {
    threadId = ulid();
    await query(
      `INSERT INTO al_unified_inbox (
        id, channel, external_id, contact_name, contact_phone,
        contact_ig_handle, contact_fb_id, status, unread_count, last_message_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', 0, $8, $8)`,
      [
        threadId,
        msg.channel,
        msg.senderId,
        msg.senderName,
        msg.senderPhone || null,
        msg.senderIgHandle || null,
        msg.senderFbId || (msg.channel === 'messenger' || msg.channel === 'fb_comment' ? msg.senderId : null),
        msg.timestamp,
      ],
    );

    // Try to match to existing lead/client
    await tryMatchContact(threadId, msg);
  }

  // 3. Insert message
  const messageId = ulid();
  await query(
    `INSERT INTO al_inbox_messages (
      id, thread_id, external_id, direction, channel,
      content, media_url, media_type, status, metadata, created_at
    ) VALUES ($1, $2, $3, 'inbound', $4, $5, $6, $7, 'delivered', $8, $9)`,
    [
      messageId,
      threadId,
      msg.externalId,
      msg.channel,
      msg.content,
      msg.mediaUrl,
      msg.mediaType,
      JSON.stringify(msg.metadata || {}),
      msg.timestamp,
    ],
  );

  // 4. Update thread
  await query(
    `UPDATE al_unified_inbox
     SET last_message_at = $1,
         unread_count = unread_count + 1,
         status = CASE WHEN status = 'closed' THEN 'open' ELSE status END,
         contact_name = COALESCE(contact_name, $2)
     WHERE id = $3`,
    [msg.timestamp, msg.senderName, threadId],
  );
}

async function tryMatchContact(
  threadId: string,
  msg: IncomingMsg,
): Promise<void> {
  try {
    // Match by phone (WhatsApp)
    if (msg.senderPhone) {
      const lead = await query(
        `SELECT id FROM al_leads WHERE phone LIKE '%' || $1 ORDER BY created_at DESC LIMIT 1`,
        [msg.senderPhone.slice(-10)],
      );
      if (lead.rows.length > 0) {
        await query(
          `UPDATE al_unified_inbox SET lead_id = $1 WHERE id = $2`,
          [lead.rows[0].id, threadId],
        );
        return;
      }

      const client = await query(
        `SELECT id FROM al_clients WHERE phone LIKE '%' || $1 ORDER BY created_at DESC LIMIT 1`,
        [msg.senderPhone.slice(-10)],
      );
      if (client.rows.length > 0) {
        await query(
          `UPDATE al_unified_inbox SET client_id = $1 WHERE id = $2`,
          [client.rows[0].id, threadId],
        );
      }
    }
  } catch (err) {
    console.error('[inbox-webhook] Contact match error:', err);
  }
}

async function handleStatusUpdate(
  externalMsgId: string,
  status: string,
): Promise<void> {
  const mapped =
    status === 'sent'
      ? 'sent'
      : status === 'delivered'
        ? 'delivered'
        : status === 'read'
          ? 'read'
          : status === 'failed'
            ? 'failed'
            : null;
  if (!mapped) return;

  await query(
    `UPDATE al_inbox_messages SET status = $1 WHERE external_id = $2`,
    [mapped, externalMsgId],
  ).catch(() => {});
}

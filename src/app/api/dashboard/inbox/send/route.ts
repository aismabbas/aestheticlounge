import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ulid } from '@/lib/ulid';
import {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  sendWhatsAppMedia,
  sendInstagramDM,
  sendMessengerMessage,
  replyToInstagramComment,
  replyToFacebookComment,
} from '@/lib/meta-conversations';
import { checkAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      thread_id,
      content,
      media_url,
      template_name,
      template_params,
    } = body;

    if (!thread_id || (!content && !template_name && !media_url)) {
      return NextResponse.json(
        { error: 'thread_id and content/template/media required' },
        { status: 400 },
      );
    }

    // Get thread info
    const threadRes = await query(
      `SELECT id, channel, external_id, contact_phone, contact_ig_handle, contact_fb_id
       FROM al_unified_inbox WHERE id = $1`,
      [thread_id],
    );

    if (threadRes.rows.length === 0) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const thread = threadRes.rows[0];
    let result: unknown = null;
    let status = 'sent';
    const messageContent = content || `[Template: ${template_name}]`;
    const mediaType = media_url
      ? (media_url.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : 'document')
      : 'text';

    // Send via appropriate channel
    switch (thread.channel) {
      case 'whatsapp':
        if (template_name) {
          result = await sendWhatsAppTemplate(
            thread.contact_phone,
            template_name,
            template_params || [],
          );
        } else if (media_url) {
          result = await sendWhatsAppMedia(
            thread.contact_phone,
            media_url,
            content || undefined,
          );
        } else {
          result = await sendWhatsAppMessage(thread.contact_phone, content);
        }
        break;

      case 'instagram_dm':
        result = await sendInstagramDM(thread.external_id, content);
        break;

      case 'messenger':
        result = await sendMessengerMessage(thread.external_id, content);
        break;

      case 'ig_comment': {
        // Get the last inbound message's external_id to reply to
        const lastComment = await query(
          `SELECT external_id FROM al_inbox_messages
           WHERE thread_id = $1 AND direction = 'inbound'
           ORDER BY created_at DESC LIMIT 1`,
          [thread_id],
        );
        const commentId = lastComment.rows[0]?.external_id || thread.external_id;
        result = await replyToInstagramComment(commentId, content);
        break;
      }

      case 'fb_comment': {
        const lastFbComment = await query(
          `SELECT external_id FROM al_inbox_messages
           WHERE thread_id = $1 AND direction = 'inbound'
           ORDER BY created_at DESC LIMIT 1`,
          [thread_id],
        );
        const fbCommentId = lastFbComment.rows[0]?.external_id || thread.external_id;
        result = await replyToFacebookComment(fbCommentId, content);
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported channel: ${thread.channel}` },
          { status: 400 },
        );
    }

    if (!result) {
      status = 'failed';
    }

    // Store outbound message
    const messageId = ulid();
    await query(
      `INSERT INTO al_inbox_messages (
        id, thread_id, external_id, direction, channel,
        content, media_url, media_type, sent_by, status, metadata, created_at
      ) VALUES ($1, $2, $3, 'outbound', $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        messageId,
        thread_id,
        null, // external_id populated by status webhook later
        thread.channel,
        messageContent,
        media_url || null,
        mediaType,
        user.staffId,
        status,
        JSON.stringify({}),
      ],
    );

    // Update thread
    await query(
      `UPDATE al_unified_inbox SET last_message_at = NOW() WHERE id = $1`,
      [thread_id],
    );

    return NextResponse.json({
      message: {
        id: messageId,
        thread_id,
        direction: 'outbound',
        channel: thread.channel,
        content: messageContent,
        media_url: media_url || null,
        media_type: mediaType,
        sent_by: user.staffId,
        sent_by_name: user.name,
        status,
        created_at: new Date().toISOString(),
      },
      api_result: result,
    });
  } catch (err) {
    console.error('[inbox/send] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

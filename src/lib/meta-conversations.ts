/**
 * Meta API helper for unified inbox — Instagram DMs, Messenger, Comments, WhatsApp.
 *
 * Uses env vars:
 *   META_PAGE_ACCESS_TOKEN, META_PAGE_ID, INSTAGRAM_BUSINESS_ID,
 *   WHATSAPP_PHONE_ID, WHATSAPP_TOKEN
 *
 * All functions return null/empty when the required env vars are missing
 * so the dashboard degrades gracefully.
 */

const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

/* ------------------------------------------------------------------ */
/*  Env helpers                                                        */
/* ------------------------------------------------------------------ */

function pageToken(): string | null {
  return process.env.META_PAGE_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || null;
}
function pageId(): string | null {
  return process.env.META_PAGE_ID || null;
}
function igId(): string | null {
  return process.env.INSTAGRAM_BUSINESS_ID || process.env.INSTAGRAM_ACCOUNT_ID || null;
}
function waPhoneId(): string | null {
  return process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || null;
}
function waToken(): string | null {
  return process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || null;
}

/* ------------------------------------------------------------------ */
/*  Generic Graph API fetch                                            */
/* ------------------------------------------------------------------ */

async function graphGet(path: string, token: string): Promise<unknown> {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${GRAPH_BASE}${path}${sep}access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error(`[meta-conversations] GET ${path} => ${res.status}:`, body);
    return null;
  }
  return res.json();
}

async function graphPost(
  path: string,
  token: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const url = `${GRAPH_BASE}${path}?access_token=${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[meta-conversations] POST ${path} => ${res.status}:`, text);
    return null;
  }
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Instagram DMs                                                      */
/* ------------------------------------------------------------------ */

export interface MetaConversation {
  id: string;
  participants?: { data: Array<{ id: string; name?: string; username?: string }> };
  messages?: {
    data: Array<{
      id: string;
      message?: string;
      from: { id: string; name?: string; username?: string };
      to?: { data: Array<{ id: string; name?: string }> };
      created_time: string;
      attachments?: { data: Array<{ mime_type: string; size: number; name: string; image_data?: { url: string }; video_data?: { url: string }; file_url?: string }> };
    }>;
  };
}

export async function getInstagramConversations(
  limit = 25,
): Promise<MetaConversation[] | null> {
  const token = pageToken();
  const id = igId();
  if (!token || !id) return null;

  const data = await graphGet(
    `/${id}/conversations?fields=participants,messages{message,from,to,created_time,attachments}&limit=${limit}`,
    token,
  ) as { data?: MetaConversation[] } | null;

  return data?.data ?? null;
}

export async function sendInstagramDM(
  recipientId: string,
  message: string,
): Promise<unknown> {
  const token = pageToken();
  const id = igId();
  if (!token || !id) return null;

  return graphPost(`/${id}/messages`, token, {
    recipient: { id: recipientId },
    message: { text: message },
  });
}

/* ------------------------------------------------------------------ */
/*  Facebook Messenger                                                 */
/* ------------------------------------------------------------------ */

export async function getMessengerConversations(
  limit = 25,
): Promise<MetaConversation[] | null> {
  const token = pageToken();
  const id = pageId();
  if (!token || !id) return null;

  const data = await graphGet(
    `/${id}/conversations?fields=participants,messages{message,from,to,created_time,attachments}&limit=${limit}`,
    token,
  ) as { data?: MetaConversation[] } | null;

  return data?.data ?? null;
}

export async function sendMessengerMessage(
  recipientId: string,
  message: string,
): Promise<unknown> {
  const token = pageToken();
  if (!token) return null;

  return graphPost('/me/messages', token, {
    recipient: { id: recipientId },
    message: { text: message },
    messaging_type: 'RESPONSE',
  });
}

/* ------------------------------------------------------------------ */
/*  Instagram Comments                                                 */
/* ------------------------------------------------------------------ */

export interface MetaComment {
  id: string;
  text: string;
  from?: { id: string; username?: string; name?: string };
  timestamp: string;
  replies?: { data: MetaComment[] };
}

export async function getInstagramComments(
  mediaId?: string,
): Promise<MetaComment[] | null> {
  const token = pageToken();
  const id = igId();
  if (!token || !id) return null;

  if (mediaId) {
    const data = await graphGet(
      `/${mediaId}/comments?fields=text,from,timestamp,replies{text,from,timestamp}`,
      token,
    ) as { data?: MetaComment[] } | null;
    return data?.data ?? null;
  }

  // Get recent media, then comments from all posts
  const media = (await graphGet(`/${id}/media?limit=25`, token)) as {
    data?: Array<{ id: string }>;
  } | null;
  if (!media?.data) return null;

  const allComments: MetaComment[] = [];
  for (const m of media.data) {
    const comments = await getInstagramComments(m.id);
    if (comments) allComments.push(...comments);
  }
  return allComments;
}

export async function replyToInstagramComment(
  commentId: string,
  message: string,
): Promise<unknown> {
  const token = pageToken();
  if (!token) return null;

  return graphPost(`/${commentId}/replies`, token, { message });
}

/* ------------------------------------------------------------------ */
/*  Facebook Comments                                                  */
/* ------------------------------------------------------------------ */

export async function getFacebookComments(
  postId?: string,
): Promise<MetaComment[] | null> {
  const token = pageToken();
  const id = pageId();
  if (!token || !id) return null;

  if (postId) {
    const data = await graphGet(
      `/${postId}/comments?fields=message,from,created_time`,
      token,
    ) as { data?: Array<{ id: string; message: string; from: { id: string; name: string }; created_time: string }> } | null;
    return (
      data?.data?.map((c) => ({
        id: c.id,
        text: c.message,
        from: c.from,
        timestamp: c.created_time,
      })) ?? null
    );
  }

  // Recent posts -> comments
  const posts = (await graphGet(`/${id}/posts?limit=10`, token)) as {
    data?: Array<{ id: string }>;
  } | null;
  if (!posts?.data) return null;

  const allComments: MetaComment[] = [];
  for (const p of posts.data.slice(0, 5)) {
    const comments = await getFacebookComments(p.id);
    if (comments) allComments.push(...comments);
  }
  return allComments;
}

export async function replyToFacebookComment(
  commentId: string,
  message: string,
): Promise<unknown> {
  const token = pageToken();
  if (!token) return null;

  return graphPost(`/${commentId}/comments`, token, { message });
}

/* ------------------------------------------------------------------ */
/*  WhatsApp Business API                                              */
/* ------------------------------------------------------------------ */

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
): Promise<unknown> {
  const token = waToken();
  const phoneId = waPhoneId();
  if (!token || !phoneId) return null;

  const url = `${GRAPH_BASE}/${phoneId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[meta-conversations] WhatsApp send error (${res.status}):`, body);
    return null;
  }
  return res.json();
}

export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  params: string[],
  language = 'en',
): Promise<unknown> {
  const token = waToken();
  const phoneId = waPhoneId();
  if (!token || !phoneId) return null;

  const url = `${GRAPH_BASE}/${phoneId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: params.length > 0
          ? [
              {
                type: 'body',
                parameters: params.map((p) => ({ type: 'text', text: p })),
              },
            ]
          : undefined,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[meta-conversations] WhatsApp template error (${res.status}):`, body);
    return null;
  }
  return res.json();
}

export async function sendWhatsAppMedia(
  phone: string,
  mediaUrl: string,
  caption?: string,
): Promise<unknown> {
  const token = waToken();
  const phoneId = waPhoneId();
  if (!token || !phoneId) return null;

  // Detect media type from URL
  const ext = mediaUrl.split('.').pop()?.toLowerCase() || '';
  let type: 'image' | 'video' | 'document' = 'document';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) type = 'image';
  else if (['mp4', 'mov', 'avi'].includes(ext)) type = 'video';

  const url = `${GRAPH_BASE}/${phoneId}/messages`;
  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to: phone,
    type,
    [type]: { link: mediaUrl, ...(caption ? { caption } : {}) },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[meta-conversations] WhatsApp media error (${res.status}):`, text);
    return null;
  }
  return res.json();
}

export async function markWhatsAppRead(messageId: string): Promise<unknown> {
  const token = waToken();
  const phoneId = waPhoneId();
  if (!token || !phoneId) return null;

  const url = `${GRAPH_BASE}/${phoneId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[meta-conversations] WhatsApp markRead error (${res.status}):`, text);
    return null;
  }
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Channel availability check                                         */
/* ------------------------------------------------------------------ */

export interface ChannelStatus {
  whatsapp: boolean;
  instagram_dm: boolean;
  messenger: boolean;
  ig_comment: boolean;
  fb_comment: boolean;
}

export function getChannelStatus(): ChannelStatus {
  // NOTE: instagram_dm, messenger, and fb_comment require Meta App Review approval
  // for pages_messaging, instagram_business_manage_messages, and pages_read_engagement.
  // Currently only ig_comment works. Enable others once App Review is approved.
  return {
    whatsapp: !!(waToken() && waPhoneId()),
    instagram_dm: false, // Needs instagram_business_manage_messages App Review
    messenger: false,    // Needs pages_messaging App Review
    ig_comment: !!(pageToken() && igId()),
    fb_comment: false,   // Needs pages_read_engagement App Review
  };
}

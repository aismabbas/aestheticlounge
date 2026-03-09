/**
 * n8n Pipeline Client — triggers webhooks, fires callbacks, polls executions
 */

const N8N_BASE = process.env.N8N_BASE_URL || 'https://n8n.awansoft.ca';
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const AL_WORKFLOW_ID = process.env.N8N_AL_WORKFLOW_ID || '7xM2l1XgnbGkJMGa';
const AL_WEBHOOK_PATH = 'al-marketing';
const AL_CALLBACK_NODE = 'alwhatsapptrigger';

const headers = { 'Content-Type': 'application/json' };
const apiHeaders = { ...headers, 'X-N8N-API-KEY': N8N_API_KEY };

/** Trigger the AL marketing pipeline webhook (fire-and-forget with 5s timeout) */
export async function triggerPipeline(payload: Record<string, unknown>) {
  const url = `${N8N_BASE}/webhook/${AL_WEBHOOK_PATH}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...payload, source: 'dashboard' }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const body = await res.text().catch(() => '');
    return { status: res.status, body };
  } catch (err: unknown) {
    clearTimeout(timeout);
    // AbortError means the webhook accepted but pipeline is still running — that's OK
    if (err instanceof Error && err.name === 'AbortError') {
      return { status: 202, body: 'Pipeline triggered (running in background)' };
    }
    throw err;
  }
}

/** Fire a callback (approve/reject) via WhatsApp button format */
export async function fireCallback(callbackId: string, title = 'Dashboard') {
  const url = `${N8N_BASE}/webhook/${AL_WORKFLOW_ID}/${AL_CALLBACK_NODE}/webhook`;
  const body = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'dashboard',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: 'dashboard', phone_number_id: 'dashboard' },
          contacts: [{ profile: { name: 'Dashboard' }, wa_id: 'dashboard' }],
          messages: [{
            from: 'dashboard',
            id: `dash_${Date.now()}`,
            timestamp: String(Math.floor(Date.now() / 1000)),
            type: 'interactive',
            interactive: {
              type: 'button_reply',
              button_reply: { id: callbackId, title },
            },
          }],
        },
        field: 'messages',
      }],
    }],
  };
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: res.status, body: await res.text().catch(() => '') };
}

/** Get recent n8n executions */
export async function getExecutions(status = 'running', limit = 20) {
  const url = `${N8N_BASE}/api/v1/executions?status=${status}&limit=${limit}`;
  const res = await fetch(url, { headers: apiHeaders });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

/** Get all active executions (running + waiting) */
export async function getAllActiveExecutions() {
  const [running, waiting] = await Promise.all([
    getExecutions('running', 10),
    getExecutions('waiting', 10),
  ]);
  return [...running, ...waiting];
}

/** Check n8n connectivity */
export async function checkConnection() {
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/executions?limit=1`, { headers: apiHeaders });
    return res.ok;
  } catch {
    return false;
  }
}

/** Pipeline action types */
export type PipelineAction =
  | 'al:new_post'
  | 'al:new_reel'
  | 'al:new_carousel'
  | 'al:check_status'
  | 'al:go_post:auto'
  | 'al:go_reel:auto'
  | 'al:go_carousel:auto'
  | 'research'
  | 'analyze';

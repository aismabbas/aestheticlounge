/**
 * AL Marketing Pipeline Engine — serverless replacement for n8n orchestration.
 *
 * Each agent: load memory from Postgres → call Claude → parse output → save memory → log decision.
 * No n8n, no WhatsApp — dashboard is the interface.
 */

import { query } from './db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentName = 'orchestrator' | 'researcher' | 'copywriter' | 'designer' | 'publisher' | 'analyst';

export interface AgentMemory {
  agent: AgentName;
  instructions: string;
  memory: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PipelineDraft {
  id: string;
  stage: 'pending_copy' | 'pending_design' | 'pending_publish' | 'published' | 'rejected';
  topic: string;
  contentType: string;
  caption?: string;
  headline?: string;
  designApproach?: string;
  imageUrl?: string;
  imageUrls?: string[];
  templateParams?: Record<string, unknown>;
  reelScenes?: Record<string, unknown>[];
  voiceoverText?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaudeResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

// ---------------------------------------------------------------------------
// Agent Memory — load/save from al_agent_memory
// ---------------------------------------------------------------------------

export async function loadAgentMemory(agent: AgentName): Promise<AgentMemory> {
  const result = await query(
    'SELECT agent, instructions, memory FROM al_agent_memory WHERE agent = $1',
    [agent],
  );
  if (result.rows.length === 0) {
    throw new Error(`Agent memory not found for: ${agent}`);
  }
  const row = result.rows[0];
  return {
    agent: row.agent,
    instructions: row.instructions || '',
    memory: typeof row.memory === 'string' ? JSON.parse(row.memory) : (row.memory || {}),
  };
}

/**
 * Build a full system prompt from agent instructions + memory JSON.
 * In n8n, both were sent to the agent. We replicate that here.
 */
export function buildSystemPrompt(mem: AgentMemory): string {
  const memoryStr = JSON.stringify(mem.memory, null, 2);
  if (!memoryStr || memoryStr === '{}') return mem.instructions;
  return `${mem.instructions}\n\n## YOUR MEMORY (learned patterns, rules, data from previous sessions)\n\`\`\`json\n${memoryStr}\n\`\`\``;
}

export async function saveAgentMemory(
  agent: AgentName,
  memory: Record<string, unknown>,
): Promise<void> {
  await query(
    'UPDATE al_agent_memory SET memory = $1 WHERE agent = $2',
    [JSON.stringify(memory), agent],
  );
}

export async function updateAgentInstructions(
  agent: AgentName,
  instructions: string,
): Promise<void> {
  await query(
    'UPDATE al_agent_memory SET instructions = $1 WHERE agent = $2',
    [instructions, agent],
  );
}

// ---------------------------------------------------------------------------
// Chat History — load/save from n8n_chat_histories (reuse existing table)
// ---------------------------------------------------------------------------

const SESSION_KEYS: Record<AgentName, string> = {
  orchestrator: 'al-orch',
  researcher: 'al-research',
  copywriter: 'al-copy',
  designer: 'al-design',
  publisher: 'al-publish',
  analyst: 'al-analyst',
};

export async function loadChatHistory(
  agent: AgentName,
  limit = 5,
): Promise<ChatMessage[]> {
  const sessionId = SESSION_KEYS[agent];
  const result = await query(
    `SELECT message AS data FROM n8n_chat_histories
     WHERE session_id = $1
     ORDER BY id DESC
     LIMIT $2`,
    [sessionId, limit * 2], // each exchange = 2 rows
  );

  const messages: ChatMessage[] = [];
  for (const row of result.rows.reverse()) {
    const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    if (data.role && data.content) {
      messages.push({ role: data.role, content: data.content });
    }
  }
  return messages;
}

export async function saveChatMessage(
  agent: AgentName,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  const sessionId = SESSION_KEYS[agent];
  // message column is JSONB — use ::jsonb cast for reliable type handling
  await query(
    `INSERT INTO n8n_chat_histories (session_id, message) VALUES ($1, $2::jsonb)`,
    [sessionId, JSON.stringify({ role, content: content.slice(0, 10000) })],
  );
}

// ---------------------------------------------------------------------------
// Decision Log — insert into al_decision_log
// ---------------------------------------------------------------------------

export async function logDecision(
  agent: AgentName,
  action: string,
  decision: string,
  result?: string,
): Promise<void> {
  // data column is jsonb — ensure value is valid JSON or null
  let jsonData: string | null = null;
  if (result) {
    try {
      JSON.parse(result); // validate it's already JSON
      jsonData = result;
    } catch {
      // Wrap plain strings as JSON string value
      jsonData = JSON.stringify({ value: result });
    }
  }
  await query(
    `INSERT INTO al_decision_log (agent, action, reasoning, data, timestamp)
     VALUES ($1, $2, $3, $4::jsonb, NOW())`,
    [agent, action, decision, jsonData],
  );
}

// ---------------------------------------------------------------------------
// Draft Queue — stored in al_pipeline_drafts table
// ---------------------------------------------------------------------------

export async function saveDraft(draft: PipelineDraft): Promise<string> {
  const result = await query(
    `INSERT INTO al_pipeline_drafts
     (id, stage, topic, content_type, caption, headline, design_approach,
      image_url, image_urls, template_params, reel_scenes, voiceover_text, model, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14, $15)
     ON CONFLICT (id) DO UPDATE SET
       stage = EXCLUDED.stage,
       caption = COALESCE(EXCLUDED.caption, al_pipeline_drafts.caption),
       headline = COALESCE(EXCLUDED.headline, al_pipeline_drafts.headline),
       design_approach = COALESCE(EXCLUDED.design_approach, al_pipeline_drafts.design_approach),
       image_url = COALESCE(EXCLUDED.image_url, al_pipeline_drafts.image_url),
       image_urls = COALESCE(EXCLUDED.image_urls, al_pipeline_drafts.image_urls),
       template_params = COALESCE(EXCLUDED.template_params, al_pipeline_drafts.template_params),
       reel_scenes = COALESCE(EXCLUDED.reel_scenes, al_pipeline_drafts.reel_scenes),
       voiceover_text = COALESCE(EXCLUDED.voiceover_text, al_pipeline_drafts.voiceover_text),
       model = COALESCE(EXCLUDED.model, al_pipeline_drafts.model),
       updated_at = EXCLUDED.updated_at
     RETURNING id`,
    [
      draft.id,
      draft.stage,
      draft.topic,
      draft.contentType,
      draft.caption || null,
      draft.headline || null,
      draft.designApproach || null,
      draft.imageUrl || null,
      draft.imageUrls ? JSON.stringify(draft.imageUrls) : null,
      draft.templateParams ? JSON.stringify(draft.templateParams) : null,
      draft.reelScenes ? JSON.stringify(draft.reelScenes) : null,
      draft.voiceoverText || null,
      draft.model || null,
      draft.createdAt,
      draft.updatedAt,
    ],
  );
  return result.rows[0].id;
}

export async function getDrafts(
  stage?: string,
  limit = 20,
): Promise<PipelineDraft[]> {
  const sql = stage
    ? 'SELECT * FROM al_pipeline_drafts WHERE stage = $1 ORDER BY updated_at DESC LIMIT $2'
    : 'SELECT * FROM al_pipeline_drafts ORDER BY updated_at DESC LIMIT $1';
  const params = stage ? [stage, limit] : [limit];
  const result = await query(sql, params);
  return result.rows.map(rowToDraft);
}

export async function getDraft(id: string): Promise<PipelineDraft | null> {
  const result = await query('SELECT * FROM al_pipeline_drafts WHERE id = $1', [id]);
  return result.rows.length > 0 ? rowToDraft(result.rows[0]) : null;
}

export async function updateDraftStage(id: string, stage: string): Promise<void> {
  await query(
    'UPDATE al_pipeline_drafts SET stage = $1, updated_at = NOW() WHERE id = $2',
    [stage, id],
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDraft(row: any): PipelineDraft {
  return {
    id: row.id,
    stage: row.stage,
    topic: row.topic,
    contentType: row.content_type,
    caption: row.caption,
    headline: row.headline,
    designApproach: row.design_approach,
    imageUrl: row.image_url,
    imageUrls: row.image_urls ? (typeof row.image_urls === 'string' ? JSON.parse(row.image_urls) : row.image_urls) : undefined,
    templateParams: row.template_params ? (typeof row.template_params === 'string' ? JSON.parse(row.template_params) : row.template_params) : undefined,
    reelScenes: row.reel_scenes ? (typeof row.reel_scenes === 'string' ? JSON.parse(row.reel_scenes) : row.reel_scenes) : undefined,
    voiceoverText: row.voiceover_text,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Claude API — direct fetch (no SDK needed)
// ---------------------------------------------------------------------------

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude(opts: {
  agent: AgentName;
  userMessage: string;
  systemPrompt?: string;
  chatHistory?: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  const {
    agent,
    userMessage,
    systemPrompt,
    chatHistory = [],
    model = 'claude-haiku-4-5-20251001',
    maxTokens = 2048,
    temperature = 0.3,
  } = opts;

  // Build messages array
  const messages = [
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  // 45s timeout — Haiku responds in 5-15s, this is a safety net
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages,
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';

  // Save to chat history
  await saveChatMessage(agent, 'user', userMessage);
  await saveChatMessage(agent, 'assistant', text);

  return {
    text,
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };
}

// ---------------------------------------------------------------------------
// JSON Parser — handles LLM output that may have markdown wrapping
// ---------------------------------------------------------------------------

export function parseJSON<T = Record<string, unknown>>(text: string): T | null {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting JSON from markdown code blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch { /* fall through */ }
    }
    // Try finding JSON object/array
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch { /* fall through */ }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// fal.ai Image Generation
// ---------------------------------------------------------------------------

export async function generateImage(opts: {
  prompt: string;
  referenceUrls?: string[];
  width?: number;
  height?: number;
  numImages?: number;
  guidanceScale?: number;
}): Promise<string[]> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error('FAL_KEY is not set');

  const {
    prompt,
    referenceUrls,
    width = 1080,
    height = 1350,
    numImages = 1,
    guidanceScale = 4.0,
  } = opts;

  const useEdit = referenceUrls && referenceUrls.length > 0;
  const endpoint = useEdit
    ? 'https://fal.run/fal-ai/nano-banana/edit'
    : 'https://fal.run/fal-ai/nano-banana-pro';

  const body: Record<string, unknown> = {
    prompt,
    image_size: { width, height },
    num_images: numImages,
    num_inference_steps: 8,
    guidance_scale: guidanceScale,
  };

  if (useEdit) {
    body.image_urls = referenceUrls;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`fal.ai error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return (data.images || []).map((img: { url: string }) => img.url);
}

// ---------------------------------------------------------------------------
// Instagram Publishing — direct Graph API (replaces social-poster.py)
// ---------------------------------------------------------------------------

const IG_API = 'https://graph.facebook.com/v21.0';

export async function publishToInstagram(opts: {
  type: 'photo' | 'carousel' | 'reel';
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  caption: string;
}): Promise<{ id: string; permalink?: string }> {
  const igAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  if (!igAccountId || !accessToken) {
    throw new Error('Instagram credentials not configured');
  }

  const { type, imageUrl, imageUrls, videoUrl, caption } = opts;

  if (type === 'photo' && imageUrl) {
    // Step 1: Create container
    const containerRes = await fetch(
      `${IG_API}/${igAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const container = await containerRes.json();
    if (!container.id) throw new Error(`IG container error: ${JSON.stringify(container)}`);

    // Step 2: Publish
    const publishRes = await fetch(
      `${IG_API}/${igAccountId}/media_publish?creation_id=${container.id}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const published = await publishRes.json();
    if (!published.id) throw new Error(`IG publish error: ${JSON.stringify(published)}`);
    return { id: published.id };
  }

  if (type === 'carousel' && imageUrls && imageUrls.length >= 2) {
    // Step 1: Create child containers (Instagram requires 2-10 items)
    const childIds: string[] = [];
    for (const url of imageUrls) {
      const res = await fetch(
        `${IG_API}/${igAccountId}/media?image_url=${encodeURIComponent(url)}&is_carousel_item=true&access_token=${accessToken}`,
        { method: 'POST' },
      );
      const data = await res.json();
      if (data.id) {
        childIds.push(data.id);
      } else {
        console.error('[publishToInstagram] Child container failed:', data);
      }
    }

    if (childIds.length < 2) {
      throw new Error(`Carousel requires at least 2 uploaded images, only ${childIds.length} succeeded`);
    }

    // Step 2: Create carousel container
    const containerRes = await fetch(
      `${IG_API}/${igAccountId}/media?media_type=CAROUSEL&children=${childIds.join(',')}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const container = await containerRes.json();
    if (!container.id) throw new Error(`IG carousel error: ${JSON.stringify(container)}`);

    // Step 3: Publish
    const publishRes = await fetch(
      `${IG_API}/${igAccountId}/media_publish?creation_id=${container.id}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const published = await publishRes.json();
    if (!published.id) throw new Error(`IG carousel publish error: ${JSON.stringify(published)}`);
    return { id: published.id };
  }

  if (type === 'reel' && videoUrl) {
    // Step 1: Create video container
    const containerRes = await fetch(
      `${IG_API}/${igAccountId}/media?media_type=REELS&video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const container = await containerRes.json();
    if (!container.id) throw new Error(`IG reel error: ${JSON.stringify(container)}`);

    // Step 2: Wait for processing then publish
    let status = 'IN_PROGRESS';
    let attempts = 0;
    while (status === 'IN_PROGRESS' && attempts < 30) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(
        `${IG_API}/${container.id}?fields=status_code&access_token=${accessToken}`,
      );
      const statusData = await statusRes.json();
      status = statusData.status_code || 'ERROR';
      attempts++;
    }

    if (status !== 'FINISHED') throw new Error(`Reel processing failed: ${status}`);

    const publishRes = await fetch(
      `${IG_API}/${igAccountId}/media_publish?creation_id=${container.id}&access_token=${accessToken}`,
      { method: 'POST' },
    );
    const published = await publishRes.json();
    if (!published.id) throw new Error(`Reel publish failed: ${JSON.stringify(published)}`);
    return { id: published.id };
  }

  throw new Error(`Unsupported publish type: ${type}`);
}

// ---------------------------------------------------------------------------
// Pipeline Orchestration — run full agent chain
// ---------------------------------------------------------------------------

export type PipelineAction =
  | 'research'
  | 'write_content'
  | 'design'
  | 'publish'
  | 'analyze'
  | 'orchestrate'
  | 'generate_model_photos'
  | 'create_model';

export async function generateDraftId(): Promise<string> {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// QA Validation — checks content against AL brand rules
// ---------------------------------------------------------------------------

export interface QACheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface QAResult {
  passed: boolean;
  checks: QACheck[];
}

export function qaValidate(draft: PipelineDraft, imageUrls?: string[]): QAResult {
  const checks: QACheck[] = [];
  const caption = draft.caption || '';
  const headline = draft.headline || '';

  // Caption length (150-300 words)
  const wordCount = caption.split(/\s+/).filter(Boolean).length;
  checks.push({
    name: 'Caption length',
    passed: wordCount >= 100 && wordCount <= 400,
    detail: `${wordCount} words (target: 150-300)`,
  });

  // Hook first line
  const firstLine = caption.split('\n')[0] || '';
  checks.push({
    name: 'Hook first line',
    passed: firstLine.length >= 10 && firstLine.length <= 150,
    detail: firstLine.length >= 10 ? 'Hook present' : 'First line too short — needs a hook',
  });

  // CTA present
  const ctaPatterns = /book|consult|dm|message|call|visit|click|link|schedule|appointment/i;
  checks.push({
    name: 'CTA present',
    passed: ctaPatterns.test(caption),
    detail: ctaPatterns.test(caption) ? 'CTA found' : 'No call-to-action detected',
  });

  // Medical disclaimer
  const disclaimerPattern = /individual results may vary|results vary|consult.*medical|consult.*professional/i;
  checks.push({
    name: 'Medical disclaimer',
    passed: disclaimerPattern.test(caption),
    detail: disclaimerPattern.test(caption) ? 'Disclaimer present' : 'Missing: "Individual results may vary..."',
  });

  // No prices mentioned
  const pricePattern = /\$\d|PKR\s*\d|Rs\.?\s*\d|\d+\s*PKR/i;
  checks.push({
    name: 'No prices',
    passed: !pricePattern.test(caption),
    detail: pricePattern.test(caption) ? 'Price found — remove from caption' : 'No prices mentioned',
  });

  // No competitor names
  const competitorPattern = /cosmo|derma\s*life|skin\s*logics|glow\s*up\s*clinic/i;
  checks.push({
    name: 'No competitors',
    passed: !competitorPattern.test(caption),
    detail: !competitorPattern.test(caption) ? 'No competitor names' : 'Competitor name detected',
  });

  // Headline length
  checks.push({
    name: 'Headline length',
    passed: headline.length > 0 && headline.length <= 60,
    detail: headline.length === 0 ? 'No headline' : `${headline.length} chars (max 60)`,
  });

  // Content-type specific checks
  if (draft.contentType === 'carousel') {
    const slideCount = draft.imageUrls?.length || 0;
    checks.push({
      name: 'Carousel slides',
      passed: slideCount >= 4,
      detail: `${slideCount} slides (min 4)`,
    });
  }

  if (draft.contentType === 'reel') {
    const sceneCount = draft.reelScenes?.length || 0;
    checks.push({
      name: 'Reel scenes',
      passed: sceneCount >= 3,
      detail: `${sceneCount} scenes (min 3)`,
    });
    checks.push({
      name: 'Voiceover present',
      passed: !!draft.voiceoverText,
      detail: draft.voiceoverText ? 'Voiceover script present' : 'Missing voiceover text',
    });
  }

  // Image check
  if (imageUrls && imageUrls.length > 0) {
    checks.push({
      name: 'Images available',
      passed: true,
      detail: `${imageUrls.length} image(s) ready`,
    });
  }

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}

// ---------------------------------------------------------------------------
// Facebook Publishing — direct Graph API
// ---------------------------------------------------------------------------

const FB_API = 'https://graph.facebook.com/v21.0';

export async function publishToFacebook(opts: {
  imageUrl: string;
  caption: string;
}): Promise<{ id: string }> {
  const pageId = '470913939437743';
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('META_ACCESS_TOKEN not configured');
  }

  const res = await fetch(
    `${FB_API}/${pageId}/photos?url=${encodeURIComponent(opts.imageUrl)}&message=${encodeURIComponent(opts.caption)}&access_token=${accessToken}`,
    { method: 'POST' },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Facebook publish error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return { id: data.id || data.post_id };
}

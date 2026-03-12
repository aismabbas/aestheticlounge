/**
 * Claude API client + Agent memory/chat history — extracted from al-pipeline.ts
 */

import { query } from './db.js';

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

// ---------------------------------------------------------------------------
// Chat History — load/save from n8n_chat_histories
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
    [sessionId, limit * 2],
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
  await query(
    `INSERT INTO n8n_chat_histories (session_id, message) VALUES ($1, $2::jsonb)`,
    [sessionId, JSON.stringify({ role, content: content.slice(0, 10000) })],
  );
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

  const messages = [
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  // Opus needs more time (up to 120s), others 45s
  const isOpus = model.includes('opus');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), isOpus ? 120000 : 45000);

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
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch { /* fall through */ }
    }
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch { /* fall through */ }
    }
    return null;
  }
}

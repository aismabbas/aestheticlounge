import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  loadAgentMemory,
  buildSystemPrompt,
  callClaude,
  loadChatHistory,
  logDecision,
  parseJSON,
} from '@/lib/al-pipeline';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, params } = body;

  if (!action) {
    return NextResponse.json({ error: 'Action required' }, { status: 400 });
  }

  try {
    // Route to the appropriate agent
    const mem = await loadAgentMemory('orchestrator');
    const history = await loadChatHistory('orchestrator', 3);

    const response = await callClaude({
      agent: 'orchestrator',
      userMessage: `Action: ${action}. Triggered by: ${session.name}. Params: ${JSON.stringify(params || {})}`,
      systemPrompt: buildSystemPrompt(mem),
      chatHistory: history,
      temperature: 0.2,
    });

    const parsed = parseJSON(response.text);

    await logDecision(
      'orchestrator',
      action,
      `Triggered by ${session.name}`,
      JSON.stringify(parsed),
    );

    return NextResponse.json({
      success: true,
      action,
      result: parsed || { raw: response.text },
      tokens: { input: response.inputTokens, output: response.outputTokens },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Pipeline error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

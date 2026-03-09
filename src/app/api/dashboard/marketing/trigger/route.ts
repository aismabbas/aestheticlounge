import { getSession } from '@/lib/auth';
import { NextRequest } from 'next/server';
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
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json();
  const { action, params } = body;

  if (!action) {
    return new Response(JSON.stringify({ error: 'Action required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const keepalive = setInterval(() => {
        try { controller.enqueue(encoder.encode(`data: {"type":"ping"}\n\n`)); } catch { /* */ }
      }, 5000);

      try {
        controller.enqueue(encoder.encode(`data: {"type":"step","step":"Loading agent memory"}\n\n`));

        const mem = await loadAgentMemory('orchestrator');
        const history = await loadChatHistory('orchestrator', 2);

        controller.enqueue(encoder.encode(`data: {"type":"step","step":"Running AI pipeline"}\n\n`));

        const response = await callClaude({
          agent: 'orchestrator',
          userMessage: `Action: ${action}. Triggered by: ${session.name}. Params: ${JSON.stringify(params || {})}`,
          systemPrompt: buildSystemPrompt(mem),
          chatHistory: history,
          temperature: 0.2,
        });

        const parsed = parseJSON(response.text);

        await logDecision('orchestrator', action, `Triggered by ${session.name}`, JSON.stringify(parsed));

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'result',
          success: true,
          action,
          result: parsed || { raw: response.text },
          tokens: { input: response.inputTokens, output: response.outputTokens },
        })}\n\n`));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Pipeline error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'result', success: false, error: message })}\n\n`));
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

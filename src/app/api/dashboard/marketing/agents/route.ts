import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import type { AgentName } from '@/lib/al-pipeline';

const VALID_AGENTS: AgentName[] = ['orchestrator', 'researcher', 'copywriter', 'designer', 'publisher', 'analyst'];

/**
 * GET /api/dashboard/marketing/agents
 * List all 6 agents with their instructions and memory.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await query(
      'SELECT agent, instructions, memory FROM al_agent_memory ORDER BY agent',
    );
    const agents = result.rows.map((row: Record<string, unknown>) => ({
      agent: row.agent,
      instructions: row.instructions || '',
      memory: typeof row.memory === 'string' ? JSON.parse(row.memory) : (row.memory || {}),
    }));
    return NextResponse.json({ agents });
  } catch (err) {
    console.error('[agents] GET error:', err);
    return NextResponse.json({ error: 'Failed to load agents' }, { status: 500 });
  }
}

/**
 * PATCH /api/dashboard/marketing/agents
 * Update an agent's instructions or memory.
 * Body: { agent, instructions?, memory? }
 */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { agent, instructions, memory } = body;

  if (!agent || !VALID_AGENTS.includes(agent)) {
    return NextResponse.json({ error: 'Invalid agent name' }, { status: 400 });
  }

  try {
    if (instructions !== undefined) {
      await query('UPDATE al_agent_memory SET instructions = $1 WHERE agent = $2', [instructions, agent]);
    }
    if (memory !== undefined) {
      const memStr = typeof memory === 'string' ? memory : JSON.stringify(memory);
      await query('UPDATE al_agent_memory SET memory = $1::jsonb WHERE agent = $2', [memStr, agent]);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[agents] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

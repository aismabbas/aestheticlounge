import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { analyzeThread, computeAgentPeriodScore, type ThreadMessage, type ThreadAnalysis } from '@/lib/message-analyzer';

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

function getDateRange(period: string) {
  const now = new Date();
  let dateFrom: string;
  const dateTo: string = now.toISOString();

  switch (period) {
    case 'today': {
      const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFrom = t.toISOString();
      break;
    }
    case 'week': {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      w.setHours(0, 0, 0, 0);
      dateFrom = w.toISOString();
      break;
    }
    case 'month': {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFrom = m.toISOString();
      break;
    }
    default: {
      const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFrom = t.toISOString();
      break;
    }
  }

  return { dateFrom, dateTo };
}

export async function GET(req: NextRequest) {
  const user = await checkAuth();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = req.nextUrl.searchParams;
    const period = params.get('period') || 'week';
    const staffFilter = params.get('staff_id');

    const { dateFrom, dateTo } = getDateRange(period);

    // Get all staff members
    const staffResult = await query(
      `SELECT id, name, role FROM al_staff WHERE active = true ORDER BY name`,
    );

    // Get all conversations in the period
    const allThreadsResult = await query(
      `SELECT DISTINCT c.phone
       FROM al_conversations c
       WHERE c.created_at >= $1 AND c.created_at < $2
         AND c.direction = 'outbound'
       ORDER BY c.phone`,
      [dateFrom, dateTo],
    );

    // Build per-agent thread analyses
    const agentThreads: Record<string, ThreadAnalysis[]> = {};

    for (const thread of allThreadsResult.rows) {
      const messagesResult = await query(
        `SELECT c.id, c.direction, COALESCE(c.content, c.message, '') AS content,
                c.created_at, c.agent
         FROM al_conversations c
         WHERE c.phone = $1 AND c.created_at >= $2 AND c.created_at < $3
         ORDER BY c.created_at ASC`,
        [thread.phone, dateFrom, dateTo],
      );

      if (messagesResult.rows.length === 0) continue;

      const threadMessages: ThreadMessage[] = messagesResult.rows.map(
        (m: { id: string; direction: string; content: string; created_at: string; agent: string }) => ({
          id: m.id,
          direction: m.direction as 'inbound' | 'outbound',
          content: m.content,
          created_at: m.created_at,
          agent: m.agent,
        }),
      );

      const analysis = analyzeThread(threadMessages, thread.phone);

      // Attribute to agents who sent outbound messages
      const agents = new Set(
        messagesResult.rows
          .filter((m: { direction: string; agent: string }) => m.direction === 'outbound' && m.agent)
          .map((m: { agent: string }) => m.agent),
      );

      for (const agentId of agents) {
        const aid = agentId as string;
        if (!agentThreads[aid]) agentThreads[aid] = [];
        agentThreads[aid].push(analysis);
      }
    }

    // Calculate scores for each agent
    const agentRankings = [];
    let teamTotalProfessionalism = 0;
    let teamTotalEmpathy = 0;
    let teamTotalResponseQuality = 0;
    let teamTotalOverall = 0;
    let teamAgentCount = 0;

    for (const staff of staffResult.rows) {
      const threads = agentThreads[staff.id] || [];
      const score = computeAgentPeriodScore(staff.id, dateFrom, dateTo, threads);

      if (score.messagesSent > 0) {
        teamTotalProfessionalism += score.professionalism;
        teamTotalEmpathy += score.empathy;
        teamTotalResponseQuality += score.responseQuality;
        teamTotalOverall += score.overall;
        teamAgentCount++;
      }

      agentRankings.push({
        staff_id: staff.id,
        name: staff.name,
        role: staff.role,
        overall_score: score.overall,
        professionalism: score.professionalism,
        empathy: score.empathy,
        response_quality: score.responseQuality,
        messages_sent: score.messagesSent,
        avg_client_sentiment: score.avgSentimentScore,
        flagged: score.flaggedConversations,
        strengths: score.strengths,
        improvements: score.improvements,
      });
    }

    // Sort by overall score descending
    agentRankings.sort((a, b) => b.overall_score - a.overall_score);

    // Filter to specific staff if requested
    const filteredRankings = staffFilter
      ? agentRankings.filter((a) => a.staff_id === staffFilter)
      : agentRankings;

    // My score
    const myScore = agentRankings.find((a) => a.staff_id === user.staffId) || null;

    // Team averages
    const teamAvg = {
      professionalism: teamAgentCount > 0 ? Math.round(teamTotalProfessionalism / teamAgentCount) : 0,
      empathy: teamAgentCount > 0 ? Math.round(teamTotalEmpathy / teamAgentCount) : 0,
      response_quality: teamAgentCount > 0 ? Math.round(teamTotalResponseQuality / teamAgentCount) : 0,
      overall: teamAgentCount > 0 ? Math.round(teamTotalOverall / teamAgentCount) : 0,
      total_agents: teamAgentCount,
    };

    // Get previous period scores for trend comparison
    const prevRange = getDateRange(
      period === 'today' ? 'today' : period === 'week' ? 'week' : 'month',
    );
    // Shift dates back by the period length
    const periodLength = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
    const prevFrom = new Date(new Date(dateFrom).getTime() - periodLength).toISOString();
    const prevTo = dateFrom;

    // Simple previous period check for trend
    const prevConversationsResult = await query(
      `SELECT COUNT(*)::int AS count
       FROM al_conversations c
       WHERE c.created_at >= $1 AND c.created_at < $2
         AND c.direction = 'outbound'`,
      [prevFrom, prevTo],
    );
    const hadPreviousData = (prevConversationsResult.rows[0]?.count || 0) > 0;

    return NextResponse.json({
      agent_rankings: filteredRankings,
      my_score: myScore,
      team_avg: teamAvg,
      period: { from: dateFrom, to: dateTo },
      has_previous_data: hadPreviousData,
    });
  } catch (err) {
    console.error('[dashboard/analytics/agent-quality] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

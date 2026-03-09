import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { analyzeSentiment, analyzeThread, type ThreadMessage } from '@/lib/message-analyzer';
import { checkAuth } from '@/lib/api-auth';

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
    const channelFilter = params.get('channel');

    const { dateFrom, dateTo } = getDateRange(period);

    // Build optional filter clauses
    const staffClause = staffFilter ? `AND c.agent = '${staffFilter}'` : '';
    const channelClause = channelFilter ? `AND c.channel = '${channelFilter}'` : '';

    // Get all conversations in the period grouped by phone (thread)
    const threadsResult = await query(
      `SELECT DISTINCT c.phone, l.name
       FROM al_conversations c
       LEFT JOIN al_leads l ON c.lead_id = l.id
       WHERE c.created_at >= $1 AND c.created_at < $2
       ${staffClause} ${channelClause}
       ORDER BY c.phone`,
      [dateFrom, dateTo],
    );

    let totalPositive = 0;
    let totalNeutral = 0;
    let totalNegative = 0;
    let totalAngry = 0;
    let allSentimentScores: number[] = [];
    const flaggedThreads: Array<{
      phone: string;
      name: string;
      sentiment: string;
      score: number;
      urgency: string;
      reasons: string[];
      topics: string[];
      channel: string;
    }> = [];
    const topicCounts: Record<string, { count: number; totalScore: number }> = {};
    const channelSentiment: Record<string, { scores: number[]; count: number }> = {};

    // Daily sentiment aggregation for trend line
    const dailySentiment: Record<string, { totalScore: number; count: number }> = {};

    for (const thread of threadsResult.rows) {
      // Get all messages for this thread in the period
      const messagesResult = await query(
        `SELECT c.id, c.direction, COALESCE(c.content, c.message, '') AS content,
                c.created_at, c.agent,
                COALESCE(c.channel, 'whatsapp') AS channel
         FROM al_conversations c
         WHERE c.phone = $1 AND c.created_at >= $2 AND c.created_at < $3
         ${staffClause}
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

      // Count sentiments from inbound messages
      for (const msg of analysis.messageAnalyses) {
        if (msg.direction === 'inbound') {
          switch (msg.sentiment) {
            case 'positive': totalPositive++; break;
            case 'neutral': totalNeutral++; break;
            case 'negative': totalNegative++; break;
            case 'angry': totalAngry++; break;
          }
          allSentimentScores.push(msg.sentimentScore);

          // Daily aggregation
          const day = new Date(threadMessages.find((m) => m.id === msg.messageId)?.created_at || '').toISOString().slice(0, 10);
          if (!dailySentiment[day]) dailySentiment[day] = { totalScore: 0, count: 0 };
          dailySentiment[day].totalScore += msg.sentimentScore;
          dailySentiment[day].count++;

          // Topic aggregation
          for (const topic of msg.topics) {
            if (!topicCounts[topic]) topicCounts[topic] = { count: 0, totalScore: 0 };
            topicCounts[topic].count++;
            topicCounts[topic].totalScore += msg.sentimentScore;
          }
        }
      }

      // Channel aggregation
      const channel = messagesResult.rows[0]?.channel || 'whatsapp';
      if (!channelSentiment[channel]) channelSentiment[channel] = { scores: [], count: 0 };
      channelSentiment[channel].scores.push(analysis.avgSentimentScore);
      channelSentiment[channel].count++;

      // Flagged threads
      if (analysis.flagged) {
        // Get the negative phrases from inbound messages
        const negativeMessages = analysis.messageAnalyses
          .filter((m) => m.direction === 'inbound' && (m.sentiment === 'negative' || m.sentiment === 'angry'))
          .map((m) => {
            const original = threadMessages.find((tm) => tm.id === m.messageId);
            return original?.content || '';
          })
          .filter((c) => c.length > 0)
          .slice(0, 3);

        flaggedThreads.push({
          phone: thread.phone,
          name: thread.name || thread.phone,
          sentiment: analysis.overallSentiment,
          score: analysis.avgSentimentScore,
          urgency: analysis.urgency,
          reasons: [...analysis.flagReasons, ...negativeMessages.map((m) => `"${m.slice(0, 80)}${m.length > 80 ? '...' : ''}"`),],
          topics: analysis.topics,
          channel,
        });
      }
    }

    // Build response
    const totalInbound = totalPositive + totalNeutral + totalNegative + totalAngry;
    const avgScore = allSentimentScores.length > 0
      ? Math.round((allSentimentScores.reduce((a, b) => a + b, 0) / allSentimentScores.length) * 100) / 100
      : 0;

    // Sentiment trend (daily)
    const sentimentTrend = Object.entries(dailySentiment)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        avg_score: Math.round((data.totalScore / data.count) * 100) / 100,
        count: data.count,
      }));

    // Topic breakdown
    const topicBreakdown = Object.entries(topicCounts)
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        avg_sentiment: Math.round((data.totalScore / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Channel sentiment
    const channelBreakdown = Object.entries(channelSentiment).map(([channel, data]) => ({
      channel,
      conversations: data.count,
      avg_score: data.scores.length > 0
        ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 100) / 100
        : 0,
    }));

    // Sort flagged by severity (angry first, then negative, then by score)
    const sentimentOrder: Record<string, number> = { angry: 0, negative: 1, neutral: 2, positive: 3 };
    flaggedThreads.sort((a, b) => {
      const orderDiff = (sentimentOrder[a.sentiment] ?? 2) - (sentimentOrder[b.sentiment] ?? 2);
      if (orderDiff !== 0) return orderDiff;
      return a.score - b.score;
    });

    return NextResponse.json({
      overall_sentiment: {
        positive_pct: totalInbound > 0 ? Math.round((totalPositive / totalInbound) * 100) : 0,
        neutral_pct: totalInbound > 0 ? Math.round((totalNeutral / totalInbound) * 100) : 0,
        negative_pct: totalInbound > 0 ? Math.round(((totalNegative + totalAngry) / totalInbound) * 100) : 0,
        avg_score: avgScore,
        total_messages: totalInbound,
      },
      sentiment_trend: sentimentTrend,
      flagged_threads: flaggedThreads,
      topic_breakdown: topicBreakdown,
      channel_sentiment: channelBreakdown,
    });
  } catch (err) {
    console.error('[dashboard/analytics/sentiment] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

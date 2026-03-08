'use client';

import { useState, useEffect, useCallback } from 'react';

interface SentimentData {
  overall_sentiment: {
    positive_pct: number;
    neutral_pct: number;
    negative_pct: number;
    avg_score: number;
    total_messages: number;
  };
  sentiment_trend: Array<{ date: string; avg_score: number; count: number }>;
  flagged_threads: Array<{
    phone: string;
    name: string;
    sentiment: string;
    score: number;
    urgency: string;
    reasons: string[];
    topics: string[];
    channel: string;
  }>;
  topic_breakdown: Array<{ topic: string; count: number; avg_sentiment: number }>;
  channel_sentiment: Array<{ channel: string; conversations: number; avg_score: number }>;
}

function sentimentEmoji(score: number): string {
  if (score >= 0.4) return '\u{1F60A}'; // 😊
  if (score >= 0.1) return '\u{1F642}'; // 🙂
  if (score >= -0.1) return '\u{1F610}'; // 😐
  if (score >= -0.4) return '\u{1F61F}'; // 😟
  return '\u{1F621}'; // 😡
}

function sentimentLabel(sentiment: string): string {
  const labels: Record<string, string> = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    angry: 'Angry',
  };
  return labels[sentiment] || sentiment;
}

function sentimentColor(sentiment: string): string {
  const colors: Record<string, string> = {
    positive: 'text-green-600',
    neutral: 'text-amber-600',
    negative: 'text-orange-600',
    angry: 'text-red-600',
  };
  return colors[sentiment] || 'text-text-muted';
}

function sentimentBg(sentiment: string): string {
  const colors: Record<string, string> = {
    positive: 'bg-green-50 border-green-200',
    neutral: 'bg-amber-50 border-amber-200',
    negative: 'bg-orange-50 border-orange-200',
    angry: 'bg-red-50 border-red-200',
  };
  return colors[sentiment] || 'bg-gray-50 border-gray-200';
}

function urgencyBadge(urgency: string): string {
  const styles: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  return styles[urgency] || 'bg-gray-100 text-gray-600';
}

function channelIcon(channel: string): string {
  const icons: Record<string, string> = {
    whatsapp: '\u{1F4AC}',   // 💬
    instagram: '\u{1F4F7}',  // 📷
    messenger: '\u{1F4E8}',  // 📨
    phone: '\u{1F4DE}',      // 📞
    email: '\u{1F4E7}',      // 📧
  };
  return icons[channel] || '\u{1F4AC}';
}

function scoreColor(score: number): string {
  if (score >= 0.3) return 'text-green-600';
  if (score >= 0) return 'text-amber-600';
  return 'text-red-600';
}

export default function SentimentPage() {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [channelFilter, setChannelFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [dismissedFlags, setDismissedFlags] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (channelFilter) params.set('channel', channelFilter);
    if (staffFilter) params.set('staff_id', staffFilter);

    const res = await fetch(`/api/dashboard/analytics/sentiment?${params}`);
    if (res.ok) {
      const d: SentimentData = await res.json();
      setData(d);
    }
    setLoading(false);
  }, [period, channelFilter, staffFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dismissFlag = (phone: string) => {
    setDismissedFlags((prev) => new Set(prev).add(phone));
  };

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-border-light rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-border-light rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <p className="text-text-muted">Failed to load sentiment data.</p>
      </div>
    );
  }

  const activeFlagged = data.flagged_threads.filter((f) => !dismissedFlags.has(f.phone));

  // Build SVG trend line
  const trendPoints = data.sentiment_trend;
  const trendSvgWidth = 600;
  const trendSvgHeight = 120;
  const trendPadding = 20;
  let trendPath = '';
  let trendDots: Array<{ x: number; y: number; score: number; date: string }> = [];

  if (trendPoints.length > 1) {
    const minScore = Math.min(...trendPoints.map((t) => t.avg_score), -0.5);
    const maxScore = Math.max(...trendPoints.map((t) => t.avg_score), 0.5);
    const range = maxScore - minScore || 1;

    trendDots = trendPoints.map((t, i) => ({
      x: trendPadding + (i / (trendPoints.length - 1)) * (trendSvgWidth - 2 * trendPadding),
      y: trendPadding + (1 - (t.avg_score - minScore) / range) * (trendSvgHeight - 2 * trendPadding),
      score: t.avg_score,
      date: t.date,
    }));

    trendPath = trendDots.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.x} ${d.y}`).join(' ');
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-text-dark">Sentiment Analysis</h1>
          <p className="text-text-muted text-sm mt-1">AI-powered client message sentiment tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
          >
            <option value="">All Channels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="messenger">Messenger</option>
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Sentiment Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Sentiment Gauge */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-xl shadow-sm border border-border-light p-5 flex flex-col items-center justify-center">
          <span className="text-5xl mb-2">{sentimentEmoji(data.overall_sentiment.avg_score)}</span>
          <p className={`text-2xl font-bold ${scoreColor(data.overall_sentiment.avg_score)}`}>
            {data.overall_sentiment.avg_score >= 0 ? '+' : ''}{data.overall_sentiment.avg_score.toFixed(2)}
          </p>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Overall Score</p>
        </div>

        {/* Positive */}
        <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-5">
          <p className="text-xs uppercase tracking-wider text-green-700">Positive</p>
          <p className="text-2xl font-semibold text-green-600 mt-2">{data.overall_sentiment.positive_pct}%</p>
          <div className="mt-2 w-full bg-green-200 rounded-full h-1.5">
            <div className="bg-green-500 rounded-full h-1.5" style={{ width: `${data.overall_sentiment.positive_pct}%` }} />
          </div>
        </div>

        {/* Neutral */}
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-5">
          <p className="text-xs uppercase tracking-wider text-amber-700">Neutral</p>
          <p className="text-2xl font-semibold text-amber-600 mt-2">{data.overall_sentiment.neutral_pct}%</p>
          <div className="mt-2 w-full bg-amber-200 rounded-full h-1.5">
            <div className="bg-amber-500 rounded-full h-1.5" style={{ width: `${data.overall_sentiment.neutral_pct}%` }} />
          </div>
        </div>

        {/* Negative */}
        <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-5">
          <p className="text-xs uppercase tracking-wider text-red-700">Negative</p>
          <p className="text-2xl font-semibold text-red-600 mt-2">{data.overall_sentiment.negative_pct}%</p>
          <div className="mt-2 w-full bg-red-200 rounded-full h-1.5">
            <div className="bg-red-500 rounded-full h-1.5" style={{ width: `${data.overall_sentiment.negative_pct}%` }} />
          </div>
        </div>

        {/* Flagged */}
        <div className={`rounded-xl shadow-sm border p-5 ${activeFlagged.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-border-light'}`}>
          <p className="text-xs uppercase tracking-wider text-text-muted">Flagged</p>
          <p className={`text-2xl font-semibold mt-2 ${activeFlagged.length > 0 ? 'text-red-600' : 'text-text-dark'}`}>
            {activeFlagged.length}
          </p>
          <p className="text-[10px] text-text-muted mt-1">need review</p>
        </div>
      </div>

      {/* Sentiment Trend */}
      {trendPoints.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-6 mb-6">
          <h2 className="font-serif text-lg text-text-dark mb-4">Sentiment Trend</h2>
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${trendSvgWidth} ${trendSvgHeight}`} className="w-full" style={{ maxHeight: '160px' }}>
              {/* Zero line */}
              <line
                x1={trendPadding}
                y1={trendSvgHeight / 2}
                x2={trendSvgWidth - trendPadding}
                y2={trendSvgHeight / 2}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              {/* Gradient fill */}
              <defs>
                <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              {/* Trend line */}
              {trendPath && (
                <path
                  d={trendPath}
                  fill="none"
                  stroke="#b08d57"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* Dots */}
              {trendDots.map((d, i) => (
                <g key={i}>
                  <circle cx={d.x} cy={d.y} r="4" fill="#b08d57" stroke="white" strokeWidth="2" />
                  <title>{d.date}: {d.score >= 0 ? '+' : ''}{d.score.toFixed(2)}</title>
                </g>
              ))}
              {/* X-axis labels */}
              {trendDots.map((d, i) => (
                i % Math.max(1, Math.floor(trendDots.length / 7)) === 0 && (
                  <text key={`label-${i}`} x={d.x} y={trendSvgHeight - 2} textAnchor="middle" className="text-[9px] fill-gray-400">
                    {new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </text>
                )
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* Channel Breakdown & Topic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Channel Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-6">
          <h2 className="font-serif text-lg text-text-dark mb-4">Channel Sentiment</h2>
          {data.channel_sentiment.length === 0 ? (
            <p className="text-sm text-text-muted py-4">No channel data available.</p>
          ) : (
            <div className="space-y-4">
              {data.channel_sentiment.map((ch) => (
                <div key={ch.channel} className="flex items-center gap-4">
                  <span className="text-xl w-8 text-center">{channelIcon(ch.channel)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-dark capitalize">{ch.channel}</span>
                      <span className={`text-sm font-semibold ${scoreColor(ch.avg_score)}`}>
                        {ch.avg_score >= 0 ? '+' : ''}{ch.avg_score.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`rounded-full h-2 transition-all ${ch.avg_score >= 0.1 ? 'bg-green-500' : ch.avg_score >= -0.1 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.max(5, ((ch.avg_score + 1) / 2) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5">{ch.conversations} conversations</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topic Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-6">
          <h2 className="font-serif text-lg text-text-dark mb-4">Topic Breakdown</h2>
          {data.topic_breakdown.length === 0 ? (
            <p className="text-sm text-text-muted py-4">No topics detected yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topic_breakdown.slice(0, 8).map((topic) => (
                <div key={topic.topic} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium capitalize bg-gold-pale text-gold-dark px-2.5 py-1 rounded-full">
                      {topic.topic}
                    </span>
                    <span className="text-sm text-text-muted">{topic.count} mentions</span>
                  </div>
                  <span className={`text-sm font-semibold ${scoreColor(topic.avg_sentiment)}`}>
                    {topic.avg_sentiment >= 0 ? '+' : ''}{topic.avg_sentiment.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Flagged Conversations */}
      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-text-dark">
            Flagged Conversations
            {activeFlagged.length > 0 && (
              <span className="ml-2 text-sm font-normal text-red-600">({activeFlagged.length})</span>
            )}
          </h2>
        </div>

        {activeFlagged.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">{'\u2705'}</span>
            <p className="text-text-muted text-sm">No flagged conversations. All clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeFlagged.map((flag) => (
              <div
                key={flag.phone}
                className={`border rounded-xl p-4 ${sentimentBg(flag.sentiment)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{channelIcon(flag.channel)}</span>
                      <span className="text-sm font-medium text-text-dark truncate">{flag.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sentimentColor(flag.sentiment)} ${sentimentBg(flag.sentiment)}`}>
                        {sentimentLabel(flag.sentiment)}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase ${urgencyBadge(flag.urgency)}`}>
                        {flag.urgency}
                      </span>
                    </div>

                    {/* Reasons / key phrases */}
                    <div className="mt-2 space-y-1">
                      {flag.reasons.slice(0, 4).map((reason, i) => (
                        <p key={i} className="text-xs text-text-muted">
                          {reason.startsWith('"') ? (
                            <span className="italic text-red-600">{reason}</span>
                          ) : (
                            <span>{'\u26A0'} {reason}</span>
                          )}
                        </p>
                      ))}
                    </div>

                    {/* Topics */}
                    {flag.topics.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {flag.topics.map((topic) => (
                          <span key={topic} className="text-[10px] bg-white/70 text-text-muted px-2 py-0.5 rounded-full capitalize">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-lg font-bold ${sentimentColor(flag.sentiment)}`}>
                      {flag.score.toFixed(2)}
                    </span>
                    <div className="flex flex-col gap-1">
                      <a
                        href={`/dashboard/conversations?phone=${encodeURIComponent(flag.phone)}`}
                        className="text-[10px] px-3 py-1.5 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors text-center"
                      >
                        Review
                      </a>
                      <button
                        onClick={() => dismissFlag(flag.phone)}
                        className="text-[10px] px-3 py-1.5 bg-white text-text-muted rounded-lg hover:bg-gray-50 border border-border-light transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

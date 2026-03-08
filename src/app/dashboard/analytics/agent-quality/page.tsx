'use client';

import { useState, useEffect, useCallback } from 'react';

interface AgentRanking {
  staff_id: string;
  name: string;
  role: string;
  overall_score: number;
  professionalism: number;
  empathy: number;
  response_quality: number;
  messages_sent: number;
  avg_client_sentiment: number;
  flagged: number;
  strengths: string[];
  improvements: string[];
}

interface QualityData {
  agent_rankings: AgentRanking[];
  my_score: AgentRanking | null;
  team_avg: {
    professionalism: number;
    empathy: number;
    response_quality: number;
    overall: number;
    total_agents: number;
  };
  period: { from: string; to: string };
  has_previous_data: boolean;
}

function scoreColorClass(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBgClass(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreBarBg(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 50) return 'bg-amber-100';
  return 'bg-red-100';
}

function gradeLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 30) return 'Needs Work';
  return 'Poor';
}

function ScoreBar({ label, score, teamAvg }: { label: string; score: number; teamAvg?: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-muted">{label}</span>
        <span className={`text-sm font-semibold ${scoreColorClass(score)}`}>{score}</span>
      </div>
      <div className={`w-full rounded-full h-2.5 ${scoreBarBg(score)}`}>
        <div
          className={`rounded-full h-2.5 transition-all duration-500 ${scoreBgClass(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {teamAvg !== undefined && (
        <div className="relative w-full h-0">
          <div
            className="absolute -top-2.5 w-0.5 h-2.5 bg-gray-800 opacity-40"
            style={{ left: `${teamAvg}%` }}
            title={`Team avg: ${teamAvg}`}
          />
        </div>
      )}
    </div>
  );
}

export default function AgentQualityPage() {
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    const res = await fetch(`/api/dashboard/analytics/agent-quality?${params}`);
    if (res.ok) {
      const d: QualityData = await res.json();
      setData(d);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <p className="text-text-muted">Failed to load agent quality data.</p>
      </div>
    );
  }

  const hasData = data.agent_rankings.some((a) => a.messages_sent > 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-text-dark">Agent Quality</h1>
          <p className="text-text-muted text-sm mt-1">Communication quality scoring and coaching</p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* My Score — Personal Scorecard */}
      {data.my_score && data.my_score.messages_sent > 0 && (
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2a2a2a] rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg">My Communication Score</h2>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${data.my_score.overall_score >= 80 ? 'text-green-400' : data.my_score.overall_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {data.my_score.overall_score}
              </span>
              <span className="text-white/40 text-sm">/ 100</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Professionalism</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div className={`rounded-full h-2 ${scoreBgClass(data.my_score.professionalism)}`} style={{ width: `${data.my_score.professionalism}%` }} />
                </div>
                <span className="text-sm font-semibold">{data.my_score.professionalism}</span>
              </div>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Empathy</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div className={`rounded-full h-2 ${scoreBgClass(data.my_score.empathy)}`} style={{ width: `${data.my_score.empathy}%` }} />
                </div>
                <span className="text-sm font-semibold">{data.my_score.empathy}</span>
              </div>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Response Quality</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div className={`rounded-full h-2 ${scoreBgClass(data.my_score.response_quality)}`} style={{ width: `${data.my_score.response_quality}%` }} />
                </div>
                <span className="text-sm font-semibold">{data.my_score.response_quality}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Strengths */}
            {data.my_score.strengths.length > 0 && (
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Strengths</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.my_score.strengths.map((s) => (
                    <span key={s} className="text-[10px] bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Improvements */}
            {data.my_score.improvements.length > 0 && (
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Tips to Improve</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.my_score.improvements.map((imp) => (
                    <span key={imp} className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full">
                      {imp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <p className="text-white/40 text-xs">{data.my_score.messages_sent} messages sent this period</p>
            {data.my_score.flagged > 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full">
                {data.my_score.flagged} flagged conversation{data.my_score.flagged > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Team Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">Team Overall</p>
          <p className={`text-2xl font-semibold mt-2 ${scoreColorClass(data.team_avg.overall)}`}>{data.team_avg.overall}</p>
          <p className="text-[10px] text-text-muted mt-1">{gradeLabel(data.team_avg.overall)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">Professionalism</p>
          <p className={`text-2xl font-semibold mt-2 ${scoreColorClass(data.team_avg.professionalism)}`}>{data.team_avg.professionalism}</p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div className={`rounded-full h-1.5 ${scoreBgClass(data.team_avg.professionalism)}`} style={{ width: `${data.team_avg.professionalism}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">Empathy</p>
          <p className={`text-2xl font-semibold mt-2 ${scoreColorClass(data.team_avg.empathy)}`}>{data.team_avg.empathy}</p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div className={`rounded-full h-1.5 ${scoreBgClass(data.team_avg.empathy)}`} style={{ width: `${data.team_avg.empathy}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">Response Quality</p>
          <p className={`text-2xl font-semibold mt-2 ${scoreColorClass(data.team_avg.response_quality)}`}>{data.team_avg.response_quality}</p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div className={`rounded-full h-1.5 ${scoreBgClass(data.team_avg.response_quality)}`} style={{ width: `${data.team_avg.response_quality}%` }} />
          </div>
        </div>
      </div>

      {/* Agent Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6">
        <h2 className="font-serif text-lg text-text-dark mb-4">Agent Leaderboard</h2>

        {!hasData ? (
          <p className="text-text-muted text-sm py-4">No agent data for this period.</p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-12 gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-text-muted border-b border-border-light">
              <div className="col-span-3">Agent</div>
              <div className="col-span-1 text-center">Overall</div>
              <div className="col-span-2 text-center">Professionalism</div>
              <div className="col-span-2 text-center">Empathy</div>
              <div className="col-span-2 text-center">Response Quality</div>
              <div className="col-span-1 text-center">Messages</div>
              <div className="col-span-1 text-center">Flagged</div>
            </div>

            {data.agent_rankings
              .filter((a) => a.messages_sent > 0)
              .map((agent, idx) => (
                <div key={agent.staff_id}>
                  {/* Agent Row */}
                  <button
                    onClick={() => setExpandedAgent(expandedAgent === agent.staff_id ? null : agent.staff_id)}
                    className={`w-full grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-lg text-left transition-colors hover:bg-warm-white ${
                      idx === 0 ? 'bg-gold-pale/30' : ''
                    } ${expandedAgent === agent.staff_id ? 'bg-warm-white' : ''}`}
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gold-pale flex items-center justify-center text-gold-dark text-xs font-semibold shrink-0">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-dark truncate">
                          {idx === 0 && <span className="mr-1" title="Top performer">{'\u{1F3C6}'}</span>}
                          {agent.name}
                        </p>
                        <p className="text-[10px] text-text-muted capitalize">{agent.role}</p>
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className={`text-lg font-bold ${scoreColorClass(agent.overall_score)}`}>
                        {agent.overall_score}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 rounded-full h-2 ${scoreBarBg(agent.professionalism)}`}>
                          <div className={`rounded-full h-2 ${scoreBgClass(agent.professionalism)}`} style={{ width: `${agent.professionalism}%` }} />
                        </div>
                        <span className={`text-xs font-medium w-6 text-right ${scoreColorClass(agent.professionalism)}`}>{agent.professionalism}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 rounded-full h-2 ${scoreBarBg(agent.empathy)}`}>
                          <div className={`rounded-full h-2 ${scoreBgClass(agent.empathy)}`} style={{ width: `${agent.empathy}%` }} />
                        </div>
                        <span className={`text-xs font-medium w-6 text-right ${scoreColorClass(agent.empathy)}`}>{agent.empathy}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 rounded-full h-2 ${scoreBarBg(agent.response_quality)}`}>
                          <div className={`rounded-full h-2 ${scoreBgClass(agent.response_quality)}`} style={{ width: `${agent.response_quality}%` }} />
                        </div>
                        <span className={`text-xs font-medium w-6 text-right ${scoreColorClass(agent.response_quality)}`}>{agent.response_quality}</span>
                      </div>
                    </div>
                    <div className="col-span-1 text-center text-sm text-text-dark">{agent.messages_sent}</div>
                    <div className="col-span-1 text-center">
                      {agent.flagged > 0 ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{agent.flagged}</span>
                      ) : (
                        <span className="text-xs text-text-muted">0</span>
                      )}
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {expandedAgent === agent.staff_id && (
                    <div className="bg-warm-white rounded-b-lg px-6 py-5 border-t border-border-light -mt-1">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Score Breakdown */}
                        <div>
                          <h3 className="text-xs uppercase tracking-wider text-text-muted mb-3">Score Breakdown</h3>
                          <div className="space-y-3">
                            <ScoreBar label="Professionalism" score={agent.professionalism} teamAvg={data.team_avg.professionalism} />
                            <ScoreBar label="Empathy" score={agent.empathy} teamAvg={data.team_avg.empathy} />
                            <ScoreBar label="Response Quality" score={agent.response_quality} teamAvg={data.team_avg.response_quality} />
                          </div>
                          <p className="text-[10px] text-text-muted mt-3">Dark line = team average</p>
                        </div>

                        {/* Strengths */}
                        <div>
                          <h3 className="text-xs uppercase tracking-wider text-text-muted mb-3">Strengths</h3>
                          {agent.strengths.length === 0 ? (
                            <p className="text-xs text-text-muted">No data yet</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {agent.strengths.map((s) => (
                                <span key={s} className="text-[11px] bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          <h3 className="text-xs uppercase tracking-wider text-text-muted mb-3 mt-5">Areas for Improvement</h3>
                          {agent.improvements.length === 0 ? (
                            <p className="text-xs text-text-muted">No suggestions</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {agent.improvements.map((imp) => (
                                <span key={imp} className="text-[11px] bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-medium">
                                  {imp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div>
                          <h3 className="text-xs uppercase tracking-wider text-text-muted mb-3">Quick Stats</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between py-2 border-b border-border-light">
                              <span className="text-xs text-text-muted">Messages Sent</span>
                              <span className="text-sm font-medium text-text-dark">{agent.messages_sent}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border-light">
                              <span className="text-xs text-text-muted">Client Sentiment</span>
                              <span className={`text-sm font-medium ${agent.avg_client_sentiment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {agent.avg_client_sentiment >= 0 ? '+' : ''}{agent.avg_client_sentiment.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border-light">
                              <span className="text-xs text-text-muted">Flagged Conversations</span>
                              <span className={`text-sm font-medium ${agent.flagged > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {agent.flagged}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <span className="text-xs text-text-muted">Grade</span>
                              <span className={`text-sm font-semibold ${scoreColorClass(agent.overall_score)}`}>
                                {gradeLabel(agent.overall_score)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {/* Agents with no messages */}
            {data.agent_rankings.filter((a) => a.messages_sent === 0).length > 0 && (
              <div className="mt-4 pt-3 border-t border-border-light">
                <p className="text-xs text-text-muted mb-2">No messages this period:</p>
                <div className="flex flex-wrap gap-2">
                  {data.agent_rankings
                    .filter((a) => a.messages_sent === 0)
                    .map((agent) => (
                      <span key={agent.staff_id} className="text-[11px] text-text-muted bg-gray-100 px-3 py-1 rounded-full">
                        {agent.name}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

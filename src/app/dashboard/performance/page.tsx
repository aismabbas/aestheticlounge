'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface StaffRanking {
  staff_id: string;
  name: string;
  leads_handled: number;
  avg_response_seconds: number;
  fastest: number;
  slowest: number;
  response_rate: number;
}

interface WaitingLead {
  lead_id: string;
  lead_name: string;
  created_at: string;
  seconds_waiting: number;
}

interface PerformanceData {
  team_stats: {
    total_leads: number;
    avg_response_seconds: number;
    leads_waiting: number;
    fastest_responder: { name: string; avg_seconds: number } | null;
  };
  staff_rankings: StaffRanking[];
  waiting_leads: WaitingLead[];
  my_stats: {
    leads_handled: number;
    avg_response_seconds: number;
    fastest: number;
    slowest: number;
  };
  trends: {
    today: { total_leads: number; avg_response_seconds: number };
    yesterday: { total_leads: number; avg_response_seconds: number };
    week: { total_leads: number; avg_response_seconds: number };
    month: { total_leads: number; avg_response_seconds: number };
  };
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function responseColor(seconds: number): string {
  if (seconds <= 0) return 'text-text-muted';
  if (seconds < 300) return 'text-green-600'; // < 5 min
  if (seconds < 900) return 'text-amber-600'; // < 15 min
  return 'text-red-600';
}

function responseBg(seconds: number): string {
  if (seconds <= 0) return 'bg-gray-100';
  if (seconds < 300) return 'bg-green-50 border-green-200';
  if (seconds < 900) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

type SortKey = 'name' | 'leads_handled' | 'avg_response_seconds' | 'fastest' | 'slowest' | 'response_rate';

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [channelFilter, setChannelFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('avg_response_seconds');
  const [sortAsc, setSortAsc] = useState(true);
  const [waitingTimers, setWaitingTimers] = useState<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ period });
    if (channelFilter) params.set('channel', channelFilter);
    if (staffFilter) params.set('staff_id', staffFilter);
    const res = await fetch(`/api/dashboard/performance?${params}`);
    if (res.ok) {
      const d: PerformanceData = await res.json();
      setData(d);
      // Initialize waiting timers
      const timers: Record<string, number> = {};
      d.waiting_leads.forEach((wl) => {
        timers[wl.lead_id] = wl.seconds_waiting;
      });
      setWaitingTimers(timers);
    }
    setLoading(false);
  }, [period, channelFilter, staffFilter]);

  useEffect(() => {
    fetchData();
    const refresh = setInterval(fetchData, 30000); // refresh data every 30s
    return () => clearInterval(refresh);
  }, [fetchData]);

  // Tick up waiting timers every second
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setWaitingTimers((prev) => {
        const next: Record<string, number> = {};
        for (const key in prev) {
          next[key] = prev[key] + 1;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'name' ? true : key === 'avg_response_seconds' || key === 'fastest');
    }
  };

  const sortedRankings = data?.staff_rankings
    ? [...data.staff_rankings].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === 'string' && typeof bv === 'string') {
          return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return sortAsc
          ? (av as number) - (bv as number)
          : (bv as number) - (av as number);
      })
    : [];

  function trendArrow(current: number, previous: number, lowerIsBetter = true): string {
    if (previous === 0) return '';
    const improved = lowerIsBetter ? current < previous : current > previous;
    const same = current === previous;
    if (same) return '  --';
    return improved ? '  ↓ improved' : '  ↑ worse';
  }

  function trendArrowClass(current: number, previous: number, lowerIsBetter = true): string {
    if (previous === 0 || current === previous) return 'text-text-muted';
    const improved = lowerIsBetter ? current < previous : current > previous;
    return improved ? 'text-green-600' : 'text-red-600';
  }

  if (loading) {
    return (
      <div className="p-8">
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
      <div className="p-8">
        <p className="text-text-muted">Failed to load performance data.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-text-dark">Staff Performance</h1>
          <p className="text-text-muted text-sm mt-1">Response time tracking and leaderboard</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
          >
            <option value="">All Channels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">Total Leads</p>
          <p className="text-2xl font-semibold text-text-dark mt-2">{data.team_stats.total_leads}</p>
        </div>
        <div className={`rounded-xl shadow-sm border p-5 ${responseBg(data.team_stats.avg_response_seconds)}`}>
          <p className="text-xs uppercase tracking-wider text-text-muted">Avg Response Time</p>
          <p className={`text-2xl font-semibold mt-2 ${responseColor(data.team_stats.avg_response_seconds)}`}>
            {formatTime(data.team_stats.avg_response_seconds)}
          </p>
        </div>
        <div className={`rounded-xl shadow-sm border p-5 ${data.team_stats.leads_waiting > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-border-light'}`}>
          <p className="text-xs uppercase tracking-wider text-text-muted">Leads Waiting</p>
          <p className={`text-2xl font-semibold mt-2 ${data.team_stats.leads_waiting > 0 ? 'text-red-600' : 'text-text-dark'}`}>
            {data.team_stats.leads_waiting}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">Fastest Responder</p>
          <p className="text-lg font-semibold text-text-dark mt-2 truncate">
            {data.team_stats.fastest_responder?.name || '--'}
          </p>
          {data.team_stats.fastest_responder && (
            <p className="text-xs text-green-600 mt-0.5">
              avg {formatTime(data.team_stats.fastest_responder.avg_seconds)}
            </p>
          )}
        </div>
      </div>

      {/* Waiting Leads — prominent if any */}
      {data.waiting_leads.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <h2 className="font-serif text-lg text-red-700 mb-3">
            Leads Waiting for Response ({data.waiting_leads.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.waiting_leads.map((wl) => (
              <div key={wl.lead_id} className="bg-white rounded-lg border border-red-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-dark">{wl.lead_name || 'Unknown'}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Since {new Date(wl.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600 tabular-nums">
                    {formatTime(waitingTimers[wl.lead_id] ?? wl.seconds_waiting)}
                  </p>
                  <p className="text-[10px] text-red-400 uppercase tracking-wider">waiting</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6 mb-6">
        <h2 className="font-serif text-lg text-text-dark mb-4">Leaderboard</h2>
        {sortedRankings.length === 0 ? (
          <p className="text-text-muted text-sm py-4">No response data for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light text-left">
                  {[
                    { key: 'name' as SortKey, label: 'Staff' },
                    { key: 'leads_handled' as SortKey, label: 'Leads' },
                    { key: 'avg_response_seconds' as SortKey, label: 'Avg Response' },
                    { key: 'fastest' as SortKey, label: 'Fastest' },
                    { key: 'slowest' as SortKey, label: 'Slowest' },
                    { key: 'response_rate' as SortKey, label: 'Rate %' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className="pb-3 text-text-muted font-medium cursor-pointer hover:text-text-dark select-none"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <span className="ml-1 text-gold">{sortAsc ? '▲' : '▼'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRankings.map((staff, idx) => (
                  <tr
                    key={staff.staff_id}
                    className={`border-b border-border-light last:border-0 ${idx === 0 ? 'bg-gold-pale/30' : ''}`}
                  >
                    <td className="py-3 text-text-dark font-medium">
                      {idx === 0 && <span className="mr-1.5" title="Fastest">&#x1F3C6;</span>}
                      {staff.name}
                    </td>
                    <td className="py-3 text-text-dark">{staff.leads_handled}</td>
                    <td className={`py-3 font-semibold ${responseColor(staff.avg_response_seconds)}`}>
                      {formatTime(staff.avg_response_seconds)}
                    </td>
                    <td className="py-3 text-green-600">{formatTime(staff.fastest)}</td>
                    <td className="py-3 text-red-600">{formatTime(staff.slowest)}</td>
                    <td className="py-3 text-text-dark">{staff.response_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6">
        <h2 className="font-serif text-lg text-text-dark mb-4">Trends</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today */}
          <div className="border border-border-light rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted mb-2">Today</p>
            <p className="text-xl font-semibold text-text-dark">{data.trends.today.total_leads} leads</p>
            <p className={`text-sm ${responseColor(data.trends.today.avg_response_seconds)}`}>
              avg {formatTime(data.trends.today.avg_response_seconds)}
            </p>
          </div>

          {/* Yesterday */}
          <div className="border border-border-light rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted mb-2">Yesterday</p>
            <p className="text-xl font-semibold text-text-dark">{data.trends.yesterday.total_leads} leads</p>
            <p className={`text-sm ${responseColor(data.trends.yesterday.avg_response_seconds)}`}>
              avg {formatTime(data.trends.yesterday.avg_response_seconds)}
            </p>
            <p className={`text-xs mt-1 ${trendArrowClass(data.trends.today.avg_response_seconds, data.trends.yesterday.avg_response_seconds)}`}>
              {trendArrow(data.trends.today.avg_response_seconds, data.trends.yesterday.avg_response_seconds)}
            </p>
          </div>

          {/* This Week */}
          <div className="border border-border-light rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted mb-2">This Week</p>
            <p className="text-xl font-semibold text-text-dark">{data.trends.week.total_leads} leads</p>
            <p className={`text-sm ${responseColor(data.trends.week.avg_response_seconds)}`}>
              avg {formatTime(data.trends.week.avg_response_seconds)}
            </p>
          </div>

          {/* This Month */}
          <div className="border border-border-light rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted mb-2">This Month</p>
            <p className="text-xl font-semibold text-text-dark">{data.trends.month.total_leads} leads</p>
            <p className={`text-sm ${responseColor(data.trends.month.avg_response_seconds)}`}>
              avg {formatTime(data.trends.month.avg_response_seconds)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

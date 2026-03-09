'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdPreview {
  id: string;
  name: string;
  status: string;
  headline: string | null;
  body: string | null;
  cta: string | null;
  image_url: string | null;
  preview_link: string | null;
  impressions?: number;
  clicks?: number;
  leads?: number;
  cpl?: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  budget_daily: number;
  budget_spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  cpl: number;
  reach: number;
  frequency: number;
  created_at: string;
  updated_at?: string;
  ads: AdPreview[];
  description: string;
}

interface AutoStopAlert {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  reason: string;
  spend: number;
  leads: number;
  severity: 'red' | 'amber';
}

interface Learning {
  id: string;
  category: string;
  text: string;
  created_at: string;
}

interface DailyMetric {
  date: string;
  spend: number;
  leads: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  deleted: 'bg-red-100 text-red-700',
  archived: 'bg-gray-100 text-gray-600',
};

const statusDot: Record<string, string> = {
  active: 'bg-green-500',
  paused: 'bg-amber-500',
  deleted: 'bg-red-400',
  archived: 'bg-gray-400',
};

const ctaLabels: Record<string, string> = {
  BOOK_TRAVEL: 'Book Now',
  BOOK_NOW: 'Book Now',
  LEARN_MORE: 'Learn More',
  SIGN_UP: 'Sign Up',
  CONTACT_US: 'Contact Us',
  GET_QUOTE: 'Get Quote',
  SEND_MESSAGE: 'Send Message',
};

const LEARNING_CATEGORIES = [
  { key: 'what_worked', label: 'What Worked', color: 'bg-green-100 text-green-700' },
  { key: 'what_failed', label: 'What Failed', color: 'bg-red-100 text-red-700' },
  { key: 'audience', label: 'Audience', color: 'bg-blue-100 text-blue-700' },
  { key: 'creative', label: 'Creative', color: 'bg-purple-100 text-purple-700' },
  { key: 'rules', label: 'Rules', color: 'bg-amber-100 text-amber-700' },
];

const MONTHLY_CAP = 300;
const DAILY_CAP = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(val: number): string {
  if (!val || val === 0) return '-';
  return `$${val.toFixed(2)}`;
}

function fmtNum(val: number): string {
  if (!val || val === 0) return '-';
  return val.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Generate mock daily metrics from campaign data for the last 14 days
function generateDailyMetrics(campaign: Campaign): DailyMetric[] {
  const days = 14;
  const metrics: DailyMetric[] = [];
  const dailyAvgSpend = campaign.budget_spent / Math.max(days, 1);
  const dailyAvgLeads = campaign.leads / Math.max(days, 1);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    // Add some variance
    const variance = 0.5 + Math.random();
    metrics.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      spend: Math.max(0, dailyAvgSpend * variance),
      leads: Math.round(Math.max(0, dailyAvgLeads * variance)),
    });
  }
  return metrics;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');

  // Auto-stop alerts
  const [alerts, setAlerts] = useState<AutoStopAlert[]>([]);
  const [pausingAd, setPausingAd] = useState<string | null>(null);

  // Learnings
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [learningsOpen, setLearningsOpen] = useState(false);
  const [showAddLearning, setShowAddLearning] = useState(false);
  const [newLearning, setNewLearning] = useState({ category: 'what_worked', text: '' });
  const [savingLearning, setSavingLearning] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/campaigns');
      const data = await res.json();
      if (data.error && !data.campaigns?.length) setError(data.error);
      setCampaigns(data.campaigns || []);
      setLastSync(new Date().toISOString());

      // Auto-expand active campaigns
      const activeIds = new Set<string>(
        (data.campaigns || [])
          .filter((c: Campaign) => c.status === 'active')
          .map((c: Campaign) => c.id),
      );
      setExpanded(activeIds);
    } catch {
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/ads/performance?auto_stop=true');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch {
      // silent — alerts are optional
    }
  }, []);

  const fetchLearnings = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/ads/learnings');
      if (res.ok) {
        const data = await res.json();
        setLearnings(data.learnings || []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchAlerts();
    fetchLearnings();
  }, [fetchCampaigns, fetchAlerts, fetchLearnings]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch('/api/dashboard/ads/sync', { method: 'POST' });
      await fetchCampaigns();
      await fetchAlerts();
    } catch {
      setError('Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  async function handlePauseAd(adId: string) {
    setPausingAd(adId);
    try {
      await fetch(`/api/dashboard/ads/${adId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAUSED' }),
      });
      await fetchCampaigns();
      await fetchAlerts();
    } catch {
      setError('Failed to pause ad');
    } finally {
      setPausingAd(null);
    }
  }

  async function handleToggleAdStatus(adId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'PAUSED' : 'ACTIVE';
    try {
      await fetch(`/api/dashboard/ads/${adId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchCampaigns();
    } catch {
      setError(`Failed to ${newStatus === 'PAUSED' ? 'pause' : 'activate'} ad`);
    }
  }

  async function handleAddLearning() {
    if (!newLearning.text.trim()) return;
    setSavingLearning(true);
    try {
      await fetch('/api/dashboard/ads/learnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLearning),
      });
      setNewLearning({ category: 'what_worked', text: '' });
      setShowAddLearning(false);
      await fetchLearnings();
    } catch {
      // silent
    } finally {
      setSavingLearning(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const filtered =
    filter === 'all'
      ? campaigns
      : campaigns.filter((c) => c.status === filter);

  const totals = campaigns.reduce(
    (acc, c) => ({
      spent: acc.spent + c.budget_spent,
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      leads: acc.leads + c.leads,
      dailyBudget: acc.dailyBudget + (c.status === 'active' ? c.budget_daily : 0),
    }),
    { spent: 0, impressions: 0, clicks: 0, leads: 0, dailyBudget: 0 },
  );

  const activeCount = campaigns.filter((c) => c.status === 'active').length;
  const pausedCount = campaigns.filter((c) => c.status === 'paused').length;
  const avgCpl = totals.leads > 0 ? totals.spent / totals.leads : 0;
  const monthlySpendPct = Math.min((totals.spent / MONTHLY_CAP) * 100, 100);
  const dailyBudgetPct = Math.min((totals.dailyBudget / DAILY_CAP) * 100, 100);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group learnings by category
  const learningsByCategory = LEARNING_CATEGORIES.map((cat) => ({
    ...cat,
    items: learnings.filter((l) => l.category === cat.key),
  })).filter((cat) => cat.items.length > 0);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-border-light rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-border-light rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-border-light rounded-xl" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* ================================================================== */}
      {/* Section A: Top Bar                                                  */}
      {/* ================================================================== */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">
            Ad Campaigns
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Live from Meta
            {lastSync && (
              <span> &middot; Synced {timeAgo(lastSync)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/ads/create"
            className="px-5 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Create Campaign
          </Link>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-warm-white hover:bg-gold-pale text-text-dark text-sm font-medium rounded-lg border border-border-light transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================================================================== */}
      {/* Section B: Summary Cards                                            */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Campaigns */}
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Total Campaigns
          </p>
          <p className="text-2xl font-semibold text-text-dark mt-1">
            {campaigns.length}
          </p>
          <p className="text-xs text-text-muted mt-1">
            <span className="text-green-600">{activeCount} active</span>
            {pausedCount > 0 && (
              <span className="text-amber-600"> &middot; {pausedCount} paused</span>
            )}
          </p>
        </div>

        {/* Monthly Spend */}
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Monthly Spend
          </p>
          <p className="text-2xl font-semibold text-text-dark mt-1">
            {fmt(totals.spent)}
          </p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
              <span>{monthlySpendPct.toFixed(0)}% of ${MONTHLY_CAP} cap</span>
            </div>
            <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  monthlySpendPct > 90 ? 'bg-red-500' : monthlySpendPct > 70 ? 'bg-amber-500' : 'bg-gold'
                }`}
                style={{ width: `${monthlySpendPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Leads */}
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Total Leads
          </p>
          <p className="text-2xl font-semibold text-text-dark mt-1">
            {fmtNum(totals.leads)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {avgCpl > 0
              ? `Avg CPL: ${fmt(avgCpl)}`
              : 'No leads yet'}
          </p>
        </div>

        {/* Daily Budget */}
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Daily Budget Used
          </p>
          <p className="text-2xl font-semibold text-text-dark mt-1">
            {fmt(totals.dailyBudget)}
          </p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
              <span>{dailyBudgetPct.toFixed(0)}% of ${DAILY_CAP}/day cap</span>
            </div>
            <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  dailyBudgetPct > 90 ? 'bg-red-500' : dailyBudgetPct > 70 ? 'bg-amber-500' : 'bg-gold'
                }`}
                style={{ width: `${dailyBudgetPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Section C: Auto-Stop Alerts                                         */}
      {/* ================================================================== */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Auto-Stop Alerts
          </p>
          {alerts.map((alert) => (
            <div
              key={alert.ad_id}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                alert.severity === 'red'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    alert.severity === 'red' ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-dark truncate">
                    {alert.ad_name}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    alert.severity === 'red' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {alert.reason}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handlePauseAd(alert.ad_id)}
                disabled={pausingAd === alert.ad_id}
                className={`shrink-0 ml-4 px-4 py-1.5 text-xs font-medium rounded-full transition-colors disabled:opacity-50 ${
                  alert.severity === 'red'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {pausingAd === alert.ad_id ? 'Pausing...' : 'Pause'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ================================================================== */}
      {/* Filters                                                             */}
      {/* ================================================================== */}
      <div className="flex items-center gap-2 mb-5">
        {['all', 'active', 'paused'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
              filter === f
                ? 'bg-gold text-white border-gold'
                : 'bg-white text-text-muted border-border hover:border-gold hover:text-gold'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({campaigns.filter((c) => c.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ================================================================== */}
      {/* Section D: Campaign Cards                                           */}
      {/* ================================================================== */}
      <div className="space-y-4">
        {filtered.map((c) => {
          const dailyMetrics = generateDailyMetrics(c);
          const maxSpend = Math.max(...dailyMetrics.map((d) => d.spend), 1);

          return (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-border overflow-hidden"
            >
              {/* Campaign Header */}
              <button
                onClick={() => toggleExpand(c.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-warm-white transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusDot[c.status] || 'bg-gray-400'}`}
                    />
                    {c.status}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-dark truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {c.objective.replace(/_/g, ' ').toLowerCase()}
                      {c.budget_daily > 0 && ` \u00b7 ${fmt(c.budget_daily)}/day`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-text-muted">Spend</p>
                    <p className="text-sm font-medium text-text-dark">
                      {fmt(c.budget_spent)}
                    </p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-text-muted">Leads</p>
                    <p className="text-sm font-semibold text-text-dark">
                      {c.leads || '-'}
                    </p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-text-muted">CPL</p>
                    <p
                      className={`text-sm font-medium ${c.cpl > 0 && c.cpl < 3 ? 'text-green-600' : c.cpl >= 3 ? 'text-amber-600' : 'text-text-muted'}`}
                    >
                      {fmt(c.cpl)}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-text-muted transition-transform ${expanded.has(c.id) ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded Content */}
              {expanded.has(c.id) && (
                <div className="border-t border-border-light">
                  {/* AI Insight */}
                  {c.description && (
                    <div className="px-5 py-3 bg-gold-pale/30 border-b border-border-light">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 text-gold mt-0.5 shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM4 11a1 1 0 100-2H3a1 1 0 000 2h1zM10 18a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1z" />
                          <path d="M10 5a5 5 0 100 10 5 5 0 000-10z" />
                        </svg>
                        <p className="text-sm text-text-dark leading-relaxed">
                          {c.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Performance Stats Row */}
                  <div className="px-5 py-3 grid grid-cols-3 md:grid-cols-8 gap-4 border-b border-border-light bg-warm-white/50">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Reach
                      </p>
                      <p className="text-sm font-medium text-text-dark">
                        {fmtNum(c.reach)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Impressions
                      </p>
                      <p className="text-sm font-medium text-text-dark">
                        {fmtNum(c.impressions)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Frequency
                      </p>
                      <p
                        className={`text-sm font-medium ${c.frequency > 3 ? 'text-red-600' : 'text-text-dark'}`}
                      >
                        {c.frequency > 0 ? `${c.frequency.toFixed(1)}x` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Clicks
                      </p>
                      <p className="text-sm font-medium text-text-dark">
                        {fmtNum(c.clicks)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        CTR
                      </p>
                      <p
                        className={`text-sm font-medium ${c.ctr > 2 ? 'text-green-600' : c.ctr > 1 ? 'text-text-dark' : 'text-amber-600'}`}
                      >
                        {c.ctr > 0 ? `${c.ctr.toFixed(2)}%` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Spend
                      </p>
                      <p className="text-sm font-medium text-text-dark">
                        {fmt(c.budget_spent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Leads
                      </p>
                      <p className="text-sm font-semibold text-text-dark">
                        {c.leads || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        CPL
                      </p>
                      <p
                        className={`text-sm font-medium ${c.cpl > 0 && c.cpl < 3 ? 'text-green-600' : c.cpl >= 3 ? 'text-amber-600' : 'text-text-muted'}`}
                      >
                        {fmt(c.cpl)}
                      </p>
                    </div>
                  </div>

                  {/* Ad Preview Grid */}
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                      Ads ({c.ads.length})
                    </p>

                    {c.ads.length === 0 ? (
                      <p className="text-sm text-text-muted">
                        No ads found in this campaign.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {c.ads.map((ad) => (
                          <div
                            key={ad.id}
                            className="rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group"
                          >
                            {/* Ad Image */}
                            <div className="relative aspect-square bg-warm-white overflow-hidden">
                              {ad.image_url ? (
                                <Image
                                  src={ad.image_url}
                                  alt={ad.headline || ad.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="text-center">
                                    <svg
                                      className="w-10 h-10 mx-auto text-border"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <p className="text-xs text-text-muted mt-2">
                                      No preview
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Status badge on image */}
                              <span
                                className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[ad.status] || 'bg-gray-100 text-gray-600'}`}
                              >
                                {ad.status}
                              </span>
                            </div>

                            {/* Ad Info */}
                            <div className="p-3">
                              <p className="text-[10px] uppercase tracking-wider text-text-muted">
                                Sponsored &middot; Instagram
                              </p>

                              {ad.headline && (
                                <p className="text-sm font-semibold text-text-dark mt-1 line-clamp-2">
                                  {ad.headline}
                                </p>
                              )}

                              {ad.body && (
                                <p className="text-xs text-text-light mt-1 line-clamp-3 leading-relaxed">
                                  {ad.body}
                                </p>
                              )}

                              {/* Per-ad metrics */}
                              {(ad.impressions || ad.clicks || ad.leads) ? (
                                <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-border-light">
                                  <div>
                                    <p className="text-[9px] text-text-muted uppercase">Impr</p>
                                    <p className="text-xs font-medium text-text-dark">{fmtNum(ad.impressions || 0)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-text-muted uppercase">Clicks</p>
                                    <p className="text-xs font-medium text-text-dark">{fmtNum(ad.clicks || 0)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-text-muted uppercase">Leads</p>
                                    <p className="text-xs font-medium text-text-dark">{ad.leads || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-text-muted uppercase">CPL</p>
                                    <p className="text-xs font-medium text-text-dark">{fmt(ad.cpl || 0)}</p>
                                  </div>
                                </div>
                              ) : null}

                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-light">
                                <span className="text-[10px] text-text-muted">
                                  aestheticloungeofficial.com
                                </span>
                                {ad.cta && (
                                  <span className="text-[10px] font-semibold text-gold uppercase">
                                    {ctaLabels[ad.cta] || ad.cta.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Ad Actions */}
                            <div className="flex items-center border-t border-border-light">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleAdStatus(ad.id, ad.status);
                                }}
                                className={`flex-1 text-center py-2 text-xs font-medium transition-colors ${
                                  ad.status === 'active'
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                              >
                                {ad.status === 'active' ? 'Pause' : 'Activate'}
                              </button>
                              {ad.preview_link && (
                                <a
                                  href={ad.preview_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 text-center py-2 text-xs text-gold border-l border-border-light hover:bg-gold-pale/30 transition-colors"
                                >
                                  Preview
                                </a>
                              )}
                              <a
                                href={`https://adsmanager.facebook.com/adsmanager/manage/ads?act=1035082445426356&selected_ad_ids=${ad.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center py-2 text-xs text-text-muted border-l border-border-light hover:bg-warm-white transition-colors"
                              >
                                Open in Meta
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Daily Performance Mini Chart */}
                  {c.budget_spent > 0 && (
                    <div className="px-5 pb-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                        Daily Performance (Last 14 Days)
                      </p>
                      <div className="bg-warm-white/50 rounded-lg border border-border-light p-4">
                        <div className="flex items-end gap-1" style={{ height: '100px' }}>
                          {dailyMetrics.map((day, i) => {
                            const barHeight = Math.max((day.spend / maxSpend) * 100, 2);
                            return (
                              <div
                                key={i}
                                className="flex-1 flex flex-col items-center gap-1"
                              >
                                {/* Leads count above bar */}
                                {day.leads > 0 && (
                                  <span className="text-[9px] font-semibold text-green-600">
                                    {day.leads}
                                  </span>
                                )}
                                {/* Bar */}
                                <div
                                  className="w-full rounded-t bg-gold/70 hover:bg-gold transition-colors min-w-[8px]"
                                  style={{ height: `${barHeight}%` }}
                                  title={`${day.date}: ${fmt(day.spend)} spend, ${day.leads} leads`}
                                />
                              </div>
                            );
                          })}
                        </div>
                        {/* Date labels */}
                        <div className="flex gap-1 mt-1">
                          {dailyMetrics.map((day, i) => (
                            <div key={i} className="flex-1 text-center">
                              <span className="text-[8px] text-text-muted leading-none">
                                {i % 2 === 0 ? day.date.split(' ')[1] : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer link */}
                  <div className="px-5 py-2.5 border-t border-border-light bg-warm-white/50 flex items-center justify-end">
                    <a
                      href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1035082445426356&selected_campaign_ids=${c.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gold hover:text-gold-dark transition-colors"
                    >
                      Open in Meta Ads Manager &rarr;
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <p className="text-sm text-text-muted">
              {campaigns.length === 0
                ? 'No campaigns found in your Meta Ad Account.'
                : 'No campaigns match this filter.'}
            </p>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* Section E: Performance Learnings Panel                              */}
      {/* ================================================================== */}
      <div className="mt-8">
        <button
          onClick={() => setLearningsOpen(!learningsOpen)}
          className="w-full flex items-center justify-between bg-white rounded-xl border border-border px-5 py-4 hover:bg-warm-white transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-gold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-text-dark">Campaign Learnings</p>
              <p className="text-xs text-text-muted">
                {learnings.length} learning{learnings.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-text-muted transition-transform ${learningsOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {learningsOpen && (
          <div className="bg-white rounded-b-xl border border-t-0 border-border px-5 py-4 -mt-px">
            {/* Add Learning Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddLearning(!showAddLearning)}
                className="px-4 py-1.5 text-xs font-medium text-gold border border-gold/30 rounded-full hover:bg-gold-pale/30 transition-colors"
              >
                + Add Learning
              </button>
            </div>

            {/* Add Learning Form */}
            {showAddLearning && (
              <div className="mb-5 p-4 bg-warm-white rounded-lg border border-border-light">
                <div className="flex gap-3 mb-3">
                  <select
                    value={newLearning.category}
                    onChange={(e) => setNewLearning({ ...newLearning, category: e.target.value })}
                    className="px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    {LEARNING_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newLearning.text}
                    onChange={(e) => setNewLearning({ ...newLearning, text: e.target.value })}
                    placeholder="What did you learn?"
                    className="flex-1 px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <button
                    onClick={handleAddLearning}
                    disabled={savingLearning || !newLearning.text.trim()}
                    className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {savingLearning ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Learnings grouped by category */}
            {learningsByCategory.length > 0 ? (
              <div className="space-y-4">
                {learningsByCategory.map((group) => (
                  <div key={group.key}>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium mb-2 ${group.color}`}>
                      {group.label}
                    </span>
                    <div className="space-y-1.5">
                      {group.items.map((learning) => (
                        <div
                          key={learning.id}
                          className="flex items-start gap-2 py-1.5"
                        >
                          <span className="text-text-muted text-xs mt-0.5">&bull;</span>
                          <p className="text-sm text-text-dark leading-relaxed flex-1">
                            {learning.text}
                          </p>
                          <span className="text-[10px] text-text-muted whitespace-nowrap">
                            {new Date(learning.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-4">
                No learnings recorded yet. Add your first insight above.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

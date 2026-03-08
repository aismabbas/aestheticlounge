'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  stage: string;
  quality: string;
  interest: string;
  source: string;
  campaign_id: string;
  created_at: string;
  notes: string;
  booked_treatment: string;
  actual_revenue: number;
  score: number;
  score_label: 'hot' | 'warm' | 'cold';
  score_factors: Record<string, number>;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  last_activity_at: string;
  conversion_value: number;
  converted_at: string;
}

interface LeadStats {
  total_leads: number;
  hot_count: number;
  warm_count: number;
  cold_count: number;
  conversion_rate: number;
  avg_score: number;
}

const STAGES = ['new', 'contacted', 'qualified', 'booked', 'visited', 'lost'] as const;

const stageColors: Record<string, string> = {
  new: 'bg-blue-50 border-blue-200',
  contacted: 'bg-amber-50 border-amber-200',
  qualified: 'bg-purple-50 border-purple-200',
  booked: 'bg-green-50 border-green-200',
  visited: 'bg-gold-pale border-gold',
  lost: 'bg-red-50 border-red-200',
};

const stageLabelColors: Record<string, string> = {
  new: 'text-blue-700',
  contacted: 'text-amber-700',
  qualified: 'text-purple-700',
  booked: 'text-green-700',
  visited: 'text-gold-dark',
  lost: 'text-red-700',
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const colorMap = {
    hot: 'bg-red-100 text-red-700 border-red-300',
    warm: 'bg-amber-100 text-amber-700 border-amber-300',
    cold: 'bg-blue-100 text-blue-600 border-blue-300',
  };
  const iconMap = { hot: '\u{1F525}', warm: '\u{2600}\u{FE0F}', cold: '\u{2744}\u{FE0F}' };
  const color = colorMap[label as keyof typeof colorMap] || colorMap.cold;
  const icon = iconMap[label as keyof typeof iconMap] || iconMap.cold;

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}>
      <span>{icon}</span>
      <span>{score}</span>
    </span>
  );
}

function UtmTag({ source }: { source: string }) {
  if (!source) return null;
  const displayMap: Record<string, { label: string; color: string }> = {
    facebook: { label: 'Facebook', color: 'bg-blue-50 text-blue-600' },
    instagram: { label: 'Instagram', color: 'bg-pink-50 text-pink-600' },
    google: { label: 'Google', color: 'bg-green-50 text-green-600' },
    whatsapp: { label: 'WhatsApp', color: 'bg-emerald-50 text-emerald-600' },
    referral: { label: 'Referral', color: 'bg-purple-50 text-purple-600' },
    direct: { label: 'Direct', color: 'bg-gray-50 text-gray-600' },
  };
  const match = displayMap[source.toLowerCase()] || { label: source, color: 'bg-gray-50 text-gray-600' };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${match.color}`}>
      {match.label}
    </span>
  );
}

function FunnelBar({ stats }: { stats: LeadStats }) {
  const stages = [
    { label: 'Total', count: stats.total_leads, color: 'bg-gray-200' },
    { label: 'Hot', count: stats.hot_count, color: 'bg-red-400' },
    { label: 'Warm', count: stats.warm_count, color: 'bg-amber-400' },
    { label: 'Cold', count: stats.cold_count, color: 'bg-blue-400' },
  ];

  return (
    <div className="bg-white rounded-xl border border-border p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-dark">Conversion Funnel</h2>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>Avg Score: <strong className="text-text-dark">{stats.avg_score}</strong></span>
          <span>Conversion: <strong className="text-text-dark">{stats.conversion_rate}%</strong></span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {stages.map((s) => {
          const pct = stats.total_leads > 0 ? Math.max((s.count / stats.total_leads) * 100, 4) : 0;
          return (
            <div key={s.label} className="flex flex-col items-center" style={{ flex: pct }}>
              <div className={`w-full h-3 rounded-full ${s.color}`} />
              <span className="text-[10px] text-text-muted mt-1">{s.label}</span>
              <span className="text-xs font-semibold text-text-dark">{s.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Temperature = 'all' | 'hot' | 'warm' | 'cold';
type SortOption = 'created_at' | 'score' | 'last_activity';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({ total_leads: 0, hot_count: 0, warm_count: 0, cold_count: 0, conversion_rate: 0, avg_score: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState('');
  const [search, setSearch] = useState('');
  const [temperature, setTemperature] = useState<Temperature>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [toast, setToast] = useState<{ leadId: string; seconds: number } | null>(null);
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleRespond = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRespondingTo(leadId);
    try {
      const res = await fetch('/api/dashboard/performance/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, channel: 'whatsapp' }),
      });
      const data = await res.json();
      if (res.ok || res.status === 409) {
        setToast({ leadId, seconds: data.response_seconds });
        setRespondedIds((prev) => new Set(prev).add(leadId));
      }
    } catch {
      // silent fail
    }
    setRespondingTo(null);
  };

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (temperature !== 'all') params.set('temperature', temperature);
    if (sortBy !== 'created_at') params.set('sort', sortBy);
    const res = await fetch(`/api/dashboard/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setStats(data.stats || { total_leads: 0, hot_count: 0, warm_count: 0, cold_count: 0, conversion_rate: 0, avg_score: 0 });
    setLoading(false);
  }, [search, temperature, sortBy]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateStage = async (leadId: string, newStage: string) => {
    await fetch(`/api/dashboard/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    fetchLeads();
    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, stage: newStage });
    }
  };

  const addNote = async (leadId: string) => {
    if (!noteText.trim()) return;
    const lead = leads.find((l) => l.id === leadId);
    const existing = lead?.notes || '';
    const updated = existing
      ? `${existing}\n[${new Date().toLocaleDateString()}] ${noteText}`
      : `[${new Date().toLocaleDateString()}] ${noteText}`;

    await fetch(`/api/dashboard/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: updated }),
    });
    setNoteText('');
    fetchLeads();
  };

  const groupedLeads = STAGES.reduce(
    (acc, stage) => {
      acc[stage] = leads.filter((l) => l.stage === stage);
      return acc;
    },
    {} as Record<string, Lead[]>,
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-48" />
          <div className="h-20 bg-border-light rounded-lg" />
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex-1 h-96 bg-border-light rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-2xl font-semibold text-text-dark">Lead Pipeline</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold w-64"
          />
          <span className="text-sm text-text-muted">{leads.length} leads</span>
        </div>
      </div>

      {/* Funnel visualization */}
      <FunnelBar stats={stats} />

      {/* Temperature filters + sort */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {([
            { key: 'all' as Temperature, label: 'All', icon: '', count: stats.total_leads },
            { key: 'hot' as Temperature, label: 'Hot', icon: '\u{1F525}', count: stats.hot_count },
            { key: 'warm' as Temperature, label: 'Warm', icon: '\u{2600}\u{FE0F}', count: stats.warm_count },
            { key: 'cold' as Temperature, label: 'Cold', icon: '\u{2744}\u{FE0F}', count: stats.cold_count },
          ]).map((chip) => (
            <button
              key={chip.key}
              onClick={() => setTemperature(chip.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                temperature === chip.key
                  ? chip.key === 'hot'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : chip.key === 'warm'
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : chip.key === 'cold'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gold-pale text-gold-dark border border-gold'
                  : 'bg-white text-text-muted border border-border hover:border-gold-light'
              }`}
            >
              {chip.icon && <span>{chip.icon}</span>}
              {chip.label}
              <span className="font-semibold">{chip.count}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-gold bg-white"
          >
            <option value="created_at">Newest</option>
            <option value="score">Score (Highest)</option>
            <option value="last_activity">Last Activity</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div key={stage} className="flex-1 min-w-[220px]">
            <div className={`rounded-lg border ${stageColors[stage]} p-3 mb-3`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-semibold uppercase tracking-wider ${stageLabelColors[stage]}`}>
                  {stage}
                </h2>
                <span className={`text-xs font-medium ${stageLabelColors[stage]}`}>
                  {groupedLeads[stage]?.length || 0}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {groupedLeads[stage]?.map((lead) => {
                const isNew = lead.stage === 'new' && !respondedIds.has(lead.id);
                const actualWait = isNew
                  ? Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 1000) + (tick * 0)
                  : 0;

                const fmtWait = (s: number) => {
                  const m = Math.floor(s / 60);
                  const sec = s % 60;
                  if (m === 0) return `${sec}s`;
                  return `${m}m ${sec}s`;
                };

                return (
                  <div key={lead.id} className="relative">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className={`w-full text-left bg-white rounded-lg border border-border p-3 hover:shadow-md transition-shadow cursor-pointer ${
                        selectedLead?.id === lead.id ? 'ring-2 ring-gold' : ''
                      }`}
                    >
                      {/* Name + Score */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-text-dark truncate">{lead.name}</p>
                        <ScoreBadge score={lead.score || 0} label={lead.score_label || 'cold'} />
                      </div>

                      <p className="text-xs text-text-muted mt-0.5">{lead.phone}</p>
                      {lead.interest && (
                        <p className="text-xs text-gold-dark mt-1 truncate">{lead.interest}</p>
                      )}

                      <div className="flex items-center justify-between mt-2 gap-1 flex-wrap">
                        <div className="flex items-center gap-1">
                          <UtmTag source={lead.utm_source || lead.source} />
                        </div>
                        <span className="text-[10px] text-text-muted">
                          {lead.last_activity_at ? timeAgo(lead.last_activity_at) : timeAgo(lead.created_at)}
                        </span>
                      </div>

                      {isNew && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-light">
                          <span className={`text-[11px] font-medium tabular-nums ${
                            actualWait < 300 ? 'text-green-600' : actualWait < 900 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            &#x23F1; {fmtWait(actualWait)} waiting
                          </span>
                        </div>
                      )}
                    </button>

                    {isNew && (
                      <button
                        onClick={(e) => handleRespond(lead.id, e)}
                        disabled={respondingTo === lead.id}
                        className="mt-1 w-full text-center px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 border border-green-200"
                      >
                        {respondingTo === lead.id ? 'Recording...' : 'Mark Responded'}
                      </button>
                    )}

                    {toast?.leadId === lead.id && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-bounce">
                        Responded in {fmtWait(toast.seconds)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-white border-l border-border shadow-xl z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-text-dark">{selectedLead.name}</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-text-muted hover:text-text-dark text-xl"
              >
                &times;
              </button>
            </div>

            {/* Score summary */}
            <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-warm-white">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${
                (selectedLead.score || 0) >= 70
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : (selectedLead.score || 0) >= 40
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-blue-50 text-blue-600 border-blue-300'
              }`}>
                {selectedLead.score || 0}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-dark capitalize">{selectedLead.score_label || 'cold'} Lead</p>
                <p className="text-xs text-text-muted">
                  {(selectedLead.score || 0) >= 70 ? 'High priority - reach out now' : (selectedLead.score || 0) >= 40 ? 'Nurture with follow-ups' : 'Needs engagement'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Contact */}
              <div>
                <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Contact</h3>
                <p className="text-sm text-text-dark">{selectedLead.phone}</p>
                {selectedLead.email && <p className="text-sm text-text-light">{selectedLead.email}</p>}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex-1 text-center px-3 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Call
                </a>
                <a
                  href={`https://wa.me/${selectedLead.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-3 py-2 text-xs font-medium bg-whatsapp/10 text-whatsapp rounded-lg hover:bg-whatsapp/20 transition-colors"
                >
                  WhatsApp
                </a>
                <Link
                  href={`/dashboard/leads/${selectedLead.id}`}
                  className="flex-1 text-center px-3 py-2 text-xs font-medium bg-gold-pale text-gold-dark rounded-lg hover:bg-gold-light/30 transition-colors"
                >
                  Full Profile
                </Link>
              </div>

              {/* Stage */}
              <div>
                <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Stage</h3>
                <select
                  value={selectedLead.stage}
                  onChange={(e) => updateStage(selectedLead.id, e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interest & Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Interest</h3>
                  <p className="text-sm text-text-dark">{selectedLead.interest || '-'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-1">Source</h3>
                  <p className="text-sm text-text-dark">{selectedLead.utm_source || selectedLead.source || '-'}</p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Notes</h3>
                {selectedLead.notes && (
                  <pre className="text-sm text-text-light whitespace-pre-wrap bg-warm-white rounded-lg p-3 mb-2 font-sans">
                    {selectedLead.notes}
                  </pre>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                    onKeyDown={(e) => e.key === 'Enter' && addNote(selectedLead.id)}
                  />
                  <button
                    onClick={() => addNote(selectedLead.id)}
                    className="px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

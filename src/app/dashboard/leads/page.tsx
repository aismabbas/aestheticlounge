'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  assigned_to: string;
  assigned_to_name: string;
  is_uncontacted: boolean;
  treatment: string;
  instagram_handle: string | null;
  facebook_id: string | null;
  whatsapp_number: string | null;
  booking_value: number;
  lifetime_value: number;
  total_booked_value: number;
  appointment_count: number;
  total_paid_value: number;
  payment_count: number;
  client_total_spent: number;
  linked_client_id: string | null;
}

interface StaffOption {
  id: string;
  name: string;
  role: string;
}

interface LeadStats {
  total_leads: number;
  hot_count: number;
  warm_count: number;
  cold_count: number;
  conversion_rate: number;
  avg_score: number;
  total_pipeline_value: number;
  total_revenue: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

function fmtWait(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  return `${m}m ${sec}s`;
}

/** Returns urgency tier based on seconds waiting */
function urgencyTier(seconds: number): 'fresh' | 'stale' | 'urgent' | 'critical' {
  if (seconds < 300) return 'fresh';      // < 5 min
  if (seconds < 900) return 'stale';      // 5-15 min
  if (seconds < 1800) return 'urgent';    // 15-30 min
  return 'critical';                       // > 30 min
}

function urgencyColor(tier: string): string {
  switch (tier) {
    case 'fresh': return 'border-green-400 bg-green-50';
    case 'stale': return 'border-amber-400 bg-amber-50';
    case 'urgent': return 'border-orange-400 bg-orange-50';
    case 'critical': return 'border-red-500 bg-red-50 animate-pulse';
    default: return '';
  }
}

function urgencyTextColor(tier: string): string {
  switch (tier) {
    case 'fresh': return 'text-green-600';
    case 'stale': return 'text-amber-600';
    case 'urgent': return 'text-orange-600';
    case 'critical': return 'text-red-600 font-bold';
    default: return 'text-text-muted';
  }
}

function urgencyDot(tier: string): string {
  switch (tier) {
    case 'fresh': return 'bg-green-500';
    case 'stale': return 'bg-amber-500';
    case 'urgent': return 'bg-orange-500';
    case 'critical': return 'bg-red-500 animate-ping';
    default: return 'bg-gray-400';
  }
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

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
          {stats.total_revenue > 0 && (
            <span>Revenue: <strong className="text-green-700">PKR {stats.total_revenue.toLocaleString()}</strong></span>
          )}
          {stats.total_pipeline_value > 0 && (
            <span>Pipeline: <strong className="text-amber-700">PKR {stats.total_pipeline_value.toLocaleString()}</strong></span>
          )}
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

/* ------------------------------------------------------------------ */
/*  Uncontacted Alert Banner                                           */
/* ------------------------------------------------------------------ */

interface UncontactedLead {
  id: string;
  name: string;
  phone: string;
  seconds_waiting: number;
}

function UncontactedBanner({
  leads,
  tick,
  onMarkContacted,
}: {
  leads: UncontactedLead[];
  tick: number;
  onMarkContacted: (leadId: string) => void;
}) {
  if (leads.length === 0) return null;

  // Sort by oldest first
  const sorted = [...leads].sort((a, b) => b.seconds_waiting - a.seconds_waiting);
  const oldest = sorted[0];
  const oldestWait = oldest.seconds_waiting + tick;

  return (
    <div className="mb-6 rounded-xl border-2 border-red-400 bg-red-50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-red-100 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-sm font-semibold text-red-800">
            You have {leads.length} uncontacted lead{leads.length !== 1 ? 's' : ''}!
          </span>
          <span className="text-sm font-bold text-red-700 tabular-nums">
            Oldest waiting: {fmtWait(oldestWait)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`tel:${oldest.phone}`}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
          >
            Call {oldest.name}
          </a>
          <a
            href={`https://wa.me/${oldest.phone?.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>

      {/* Lead list */}
      <div className="divide-y divide-red-200">
        {sorted.map((lead) => {
          const wait = lead.seconds_waiting + tick;
          const tier = urgencyTier(wait);
          return (
            <div key={lead.id} className="px-5 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${urgencyDot(tier)}`} />
                <span className="text-sm font-medium text-text-dark truncate">{lead.name}</span>
                <span className="text-xs text-text-muted">{lead.phone}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-semibold tabular-nums ${urgencyTextColor(tier)}`}>
                  {fmtWait(wait)}
                </span>
                <button
                  onClick={() => onMarkContacted(lead.id)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white text-green-700 border border-green-300 hover:bg-green-50 transition-colors"
                >
                  Mark Contacted
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Contact Log Modal                                                  */
/* ------------------------------------------------------------------ */

function ContactLogModal({
  lead,
  onClose,
  onSaved,
}: {
  lead: Lead;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [channel, setChannel] = useState<'phone' | 'whatsapp' | 'email'>('phone');
  const [outcome, setOutcome] = useState<string>('connected');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/dashboard/leads/contact-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, channel, outcome, notes: notes || undefined }),
      });
      onSaved();
      onClose();
    } catch {
      // silent
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-[380px] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-dark">Log Contact &mdash; {lead.name}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark text-lg">&times;</button>
        </div>

        {/* Channel */}
        <div className="mb-3">
          <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">Channel</label>
          <div className="flex gap-2">
            {(['phone', 'whatsapp', 'email'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  channel === ch
                    ? 'bg-gold-pale text-gold-dark border-gold'
                    : 'bg-white text-text-muted border-border hover:border-gold-light'
                }`}
              >
                {ch === 'phone' ? 'Phone' : ch === 'whatsapp' ? 'WhatsApp' : 'Email'}
              </button>
            ))}
          </div>
        </div>

        {/* Outcome */}
        <div className="mb-3">
          <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">Outcome</label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
          >
            <option value="connected">Connected</option>
            <option value="no_answer">No Answer</option>
            <option value="busy">Busy</option>
            <option value="voicemail">Voicemail</option>
            <option value="callback_requested">Callback Requested</option>
          </select>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
            placeholder="Any details..."
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-sm text-text-muted hover:text-text-dark transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 px-3 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

type Temperature = 'all' | 'hot' | 'warm' | 'cold';
type SortOption = 'created_at' | 'score' | 'last_activity';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [stats, setStats] = useState<LeadStats>({ total_leads: 0, hot_count: 0, warm_count: 0, cold_count: 0, conversion_rate: 0, avg_score: 0, total_pipeline_value: 0, total_revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState('');
  const [search, setSearch] = useState('');
  const [temperature, setTemperature] = useState<Temperature>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [myLeadsOnly, setMyLeadsOnly] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [toast, setToast] = useState<{ leadId: string; seconds: number } | null>(null);
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  const [contactLogLead, setContactLogLead] = useState<Lead | null>(null);
  const [reassigningLead, setReassigningLead] = useState<string | null>(null);

  // Real-time tick for timers
  const [tick, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    baseTimeRef.current = Date.now();
    tickRef.current = setInterval(() => {
      setTick(Math.floor((Date.now() - baseTimeRef.current) / 1000));
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Check URL params for filter presets
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('filter') === 'my-uncontacted') {
      setMyLeadsOnly(true);
    }
  }, []);

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

  const handleReassign = async (leadId: string, staffId: string) => {
    setReassigningLead(leadId);
    try {
      await fetch('/api/dashboard/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          staffId === 'auto'
            ? { lead_id: leadId, action: 'auto' }
            : { lead_id: leadId, staff_id: staffId },
        ),
      });
      fetchLeads();
    } catch {
      // silent
    }
    setReassigningLead(null);
  };

  const handleMarkContacted = async (leadId: string) => {
    try {
      await fetch('/api/dashboard/leads/contact-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, channel: 'phone', outcome: 'connected' }),
      });
      setRespondedIds((prev) => new Set(prev).add(leadId));
      fetchLeads();
    } catch {
      // silent
    }
  };

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (temperature !== 'all') params.set('temperature', temperature);
      if (sortBy !== 'created_at') params.set('sort', sortBy);
      if (myLeadsOnly) params.set('my_leads', 'true');
      const res = await fetch(`/api/dashboard/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setStats(data.stats || { total_leads: 0, hot_count: 0, warm_count: 0, cold_count: 0, conversion_rate: 0, avg_score: 0, total_pipeline_value: 0, total_revenue: 0 });
      setStaffList(data.staff || []);
      // Reset tick base on each data refresh
      baseTimeRef.current = Date.now();
      setTick(0);
    } catch (err) {
      console.error('[leads] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, temperature, sortBy, myLeadsOnly]);

  useEffect(() => {
    fetchLeads();
    // Auto-refresh every 30s
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const updateStage = async (leadId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/dashboard/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        fetchLeads();
        if (selectedLead?.id === leadId) {
          setSelectedLead({ ...selectedLead, stage: newStage });
        }
      } else {
        console.error('[leads] Stage update failed:', res.status);
      }
    } catch (err) {
      console.error('[leads] Stage update error:', err);
    }
  };

  const addNote = async (leadId: string) => {
    if (!noteText.trim()) return;
    try {
      const lead = leads.find((l) => l.id === leadId);
      const existing = lead?.notes || '';
      const updated = existing
        ? `${existing}\n[${new Date().toLocaleDateString()}] ${noteText}`
        : `[${new Date().toLocaleDateString()}] ${noteText}`;

      const res = await fetch(`/api/dashboard/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updated }),
      });
      if (!res.ok) {
        console.error('[leads] Add note failed:', res.status);
        return;
      }
      setNoteText('');
      fetchLeads();
    } catch (err) {
      console.error('[leads] Add note error:', err);
    }
  };

  const groupedLeads = STAGES.reduce(
    (acc, stage) => {
      acc[stage] = leads.filter((l) => l.stage === stage);
      return acc;
    },
    {} as Record<string, Lead[]>,
  );

  // Uncontacted leads for the banner (leads assigned to me, stage=new, not responded)
  const myUncontactedLeads: UncontactedLead[] = leads
    .filter((l) => l.is_uncontacted && !respondedIds.has(l.id))
    .map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      seconds_waiting: Math.floor((Date.now() - new Date(l.created_at).getTime()) / 1000),
    }));

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
      {/* Uncontacted Alert Banner */}
      <UncontactedBanner
        leads={myUncontactedLeads}
        tick={tick}
        onMarkContacted={handleMarkContacted}
      />

      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-2xl font-semibold text-text-dark">Lead Pipeline</h1>
        <div className="flex items-center gap-3">
          {/* My Leads toggle */}
          <button
            onClick={() => setMyLeadsOnly(!myLeadsOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              myLeadsOnly
                ? 'bg-gold-pale text-gold-dark border-gold'
                : 'bg-white text-text-muted border-border hover:border-gold-light'
            }`}
          >
            My Leads
          </button>
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

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div key={stage} className="flex-1 min-w-[240px]">
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
                const isNew = lead.stage === 'new' && lead.is_uncontacted && !respondedIds.has(lead.id);
                const waitSeconds = isNew
                  ? Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 1000) + tick
                  : 0;
                const tier = isNew ? urgencyTier(waitSeconds) : 'fresh';

                return (
                  <div key={lead.id} className="relative">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className={`w-full text-left bg-white rounded-lg border-2 p-3 hover:shadow-md transition-all cursor-pointer ${
                        selectedLead?.id === lead.id ? 'ring-2 ring-gold' : ''
                      } ${isNew ? urgencyColor(tier) : 'border-border'}`}
                    >
                      {/* Name + Score */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-text-dark truncate">{lead.name}</p>
                        <ScoreBadge score={lead.score || 0} label={lead.score_label || 'cold'} />
                      </div>

                      {/* Value bar - GHL style */}
                      {(() => {
                        const totalValue = Number(lead.total_paid_value || 0) || Number(lead.client_total_spent || 0) || Number(lead.actual_revenue || 0);
                        const bookedValue = Number(lead.total_booked_value || 0) || Number(lead.booking_value || 0);
                        const hasValue = totalValue > 0 || bookedValue > 0;
                        if (!hasValue) return null;
                        return (
                          <div className="flex items-center gap-2 mt-1 px-2 py-1 rounded bg-green-50 border border-green-100">
                            {totalValue > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-green-600 font-medium">Paid</span>
                                <span className="text-xs font-bold text-green-700">PKR {totalValue.toLocaleString()}</span>
                              </div>
                            )}
                            {bookedValue > 0 && totalValue > 0 && <span className="text-green-300">|</span>}
                            {bookedValue > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-amber-600 font-medium">Booked</span>
                                <span className="text-xs font-bold text-amber-700">PKR {bookedValue.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <p className="text-xs text-text-muted mt-0.5">{lead.phone}</p>

                      {/* Social profiles */}
                      {(lead.instagram_handle || lead.facebook_id || lead.whatsapp_number) && (
                        <div className="flex items-center gap-1 mt-1">
                          {lead.instagram_handle && (
                            <a
                              href={`https://instagram.com/${lead.instagram_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E1306C]/10 text-[#E1306C] font-medium hover:bg-[#E1306C]/20"
                            >
                              @{lead.instagram_handle}
                            </a>
                          )}
                          {lead.facebook_id && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1877F2]/10 text-[#1877F2] font-medium">
                              FB
                            </span>
                          )}
                          {lead.whatsapp_number && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366] font-medium">
                              WA
                            </span>
                          )}
                          <Link
                            href={`/dashboard/conversations?search=${encodeURIComponent(lead.name)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-gold/10 text-gold-dark font-medium hover:bg-gold/20"
                          >
                            Messages
                          </Link>
                        </div>
                      )}

                      {lead.interest && (
                        <p className="text-xs text-gold-dark mt-1 truncate">{lead.interest}</p>
                      )}

                      {/* Assigned staff */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {lead.assigned_to_name ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                            <span className="w-3.5 h-3.5 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-[8px] font-bold shrink-0">
                              {lead.assigned_to_name[0]?.toUpperCase()}
                            </span>
                            {lead.assigned_to_name}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                            Unassigned
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 gap-1 flex-wrap">
                        <div className="flex items-center gap-1">
                          <UtmTag source={lead.utm_source || lead.source} />
                        </div>
                        <span className="text-[10px] text-text-muted">
                          {lead.last_activity_at ? timeAgo(lead.last_activity_at) : timeAgo(lead.created_at)}
                        </span>
                      </div>

                      {/* Urgency timer for new uncontacted leads */}
                      {isNew && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-light">
                          <div className="flex items-center gap-1.5">
                            <span className={`relative flex h-2 w-2 ${tier === 'critical' ? '' : ''}`}>
                              {tier === 'critical' && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                              )}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${urgencyDot(tier).replace(' animate-ping', '')}`} />
                            </span>
                            <span className={`text-[11px] font-semibold tabular-nums ${urgencyTextColor(tier)}`}>
                              {fmtWait(waitSeconds)} waiting
                            </span>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Quick actions row */}
                    <div className="flex gap-1 mt-1">
                      {isNew && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setContactLogLead(lead); }}
                          className="flex-1 text-center px-2 py-1.5 text-[11px] font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                        >
                          Log Call
                        </button>
                      )}
                      {isNew && (
                        <button
                          onClick={(e) => handleRespond(lead.id, e)}
                          disabled={respondingTo === lead.id}
                          className="flex-1 text-center px-2 py-1.5 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50"
                        >
                          {respondingTo === lead.id ? '...' : 'Mark Responded'}
                        </button>
                      )}
                      {/* Reassign dropdown */}
                      <select
                        value={lead.assigned_to || ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleReassign(lead.id, e.target.value);
                        }}
                        disabled={reassigningLead === lead.id}
                        className="text-[10px] px-1.5 py-1 border border-border rounded-lg bg-white text-text-muted focus:outline-none focus:border-gold min-w-[80px] disabled:opacity-50"
                      >
                        <option value="">Reassign...</option>
                        <option value="auto">Auto-assign</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>

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

      {/* Contact Log Modal */}
      {contactLogLead && (
        <ContactLogModal
          lead={contactLogLead}
          onClose={() => setContactLogLead(null)}
          onSaved={() => {
            setRespondedIds((prev) => new Set(prev).add(contactLogLead.id));
            fetchLeads();
          }}
        />
      )}

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

            {/* Lead Value — GHL style */}
            {(() => {
              const totalPaid = Number(selectedLead.total_paid_value || 0) || Number(selectedLead.client_total_spent || 0) || Number(selectedLead.actual_revenue || 0);
              const totalBooked = Number(selectedLead.total_booked_value || 0) || Number(selectedLead.booking_value || 0);
              const apptCount = Number(selectedLead.appointment_count || 0);
              const payCount = Number(selectedLead.payment_count || 0);
              return (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <h3 className="text-xs font-semibold uppercase text-green-700 tracking-wider mb-3">Lead Value</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-green-600 font-medium uppercase">Total Paid</p>
                      <p className="text-xl font-bold text-green-800">
                        PKR {totalPaid.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-green-600">{payCount} payment{payCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-amber-600 font-medium uppercase">Booked Value</p>
                      <p className="text-xl font-bold text-amber-700">
                        PKR {totalBooked.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-amber-600">{apptCount} appointment{apptCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {(totalPaid > 0 || totalBooked > 0) && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-700 font-semibold">Lifetime Value</span>
                        <span className="text-lg font-bold text-green-900">
                          PKR {Math.max(totalPaid, totalBooked).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Assigned To */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Assigned To</h3>
              <select
                value={selectedLead.assigned_to || ''}
                onChange={(e) => {
                  handleReassign(selectedLead.id, e.target.value);
                  setSelectedLead({ ...selectedLead, assigned_to: e.target.value });
                }}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              >
                <option value="">Unassigned</option>
                <option value="auto">Auto-assign</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {/* Contact */}
              <div>
                <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Contact</h3>
                <p className="text-sm text-text-dark">{selectedLead.phone}</p>
                {selectedLead.email && <p className="text-sm text-text-light">{selectedLead.email}</p>}
                {/* Social profiles */}
                {(selectedLead.instagram_handle || selectedLead.facebook_id || selectedLead.whatsapp_number) && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {selectedLead.instagram_handle && (
                      <a
                        href={`https://instagram.com/${selectedLead.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#E1306C]/10 text-[#E1306C] font-medium hover:bg-[#E1306C]/20"
                      >
                        @{selectedLead.instagram_handle}
                      </a>
                    )}
                    {selectedLead.facebook_id && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1877F2]/10 text-[#1877F2] font-medium">
                        FB Connected
                      </span>
                    )}
                    {selectedLead.whatsapp_number && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366] font-medium">
                        WA: {selectedLead.whatsapp_number}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 flex-wrap">
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
                <button
                  onClick={() => setContactLogLead(selectedLead)}
                  className="flex-1 text-center px-3 py-2 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  Log Contact
                </button>
                <Link
                  href={`/dashboard/conversations?search=${encodeURIComponent(selectedLead.name)}`}
                  className="flex-1 text-center px-3 py-2 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Messages
                </Link>
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

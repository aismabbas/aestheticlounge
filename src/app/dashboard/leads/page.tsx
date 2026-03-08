'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState('');
  const [search, setSearch] = useState('');

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await fetch(`/api/dashboard/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || data);
    setLoading(false);
  }, [search]);

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
      <div className="flex items-center justify-between mb-6">
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
              {groupedLeads[stage]?.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`w-full text-left bg-white rounded-lg border border-border p-3 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedLead?.id === lead.id ? 'ring-2 ring-gold' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-text-dark truncate">{lead.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{lead.phone}</p>
                  {lead.interest && (
                    <p className="text-xs text-gold-dark mt-1 truncate">{lead.interest}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {lead.source && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-border-light text-text-muted">
                        {lead.source}
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted">{timeAgo(lead.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-white border-l border-border shadow-xl z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-semibold text-text-dark">{selectedLead.name}</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-text-muted hover:text-text-dark text-xl"
              >
                &times;
              </button>
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
                  <p className="text-sm text-text-dark">{selectedLead.source || '-'}</p>
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

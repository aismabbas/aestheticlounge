'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

interface Conversation {
  id: string;
  phone: string;
  direction: string;
  message_type: string;
  content: string;
  status: string;
  agent: string;
  created_at: string;
}

const STAGES = ['new', 'contacted', 'qualified', 'booked', 'visited', 'repeat', 'lost'] as const;

const stageBadgeColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-purple-100 text-purple-700',
  booked: 'bg-green-100 text-green-700',
  visited: 'bg-gold-pale text-gold-dark',
  repeat: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetch(`/api/dashboard/leads/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setLead(data.lead);
        setConversations(data.conversations || []);
        setLoading(false);
      });
  }, [id]);

  const updateStage = async (newStage: string) => {
    await fetch(`/api/dashboard/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    setLead((prev) => (prev ? { ...prev, stage: newStage } : prev));
  };

  const addNote = async () => {
    if (!noteText.trim() || !lead) return;
    const existing = lead.notes || '';
    const updated = existing
      ? `${existing}\n[${new Date().toLocaleDateString()}] ${noteText}`
      : `[${new Date().toLocaleDateString()}] ${noteText}`;

    await fetch(`/api/dashboard/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: updated }),
    });
    setLead((prev) => (prev ? { ...prev, notes: updated } : prev));
    setNoteText('');
  };

  const convertToClient = async () => {
    const res = await fetch(`/api/dashboard/leads/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'convert_to_client' }),
    });
    const data = await res.json();
    if (data.clientId) {
      router.push(`/dashboard/clients/${data.clientId}`);
    }
  };

  if (loading || !lead) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-64" />
          <div className="h-48 bg-border-light rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/dashboard/leads" className="hover:text-gold transition-colors">Leads</Link>
        <span>/</span>
        <span className="text-text-dark">{lead.name}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Lead info */}
        <div className="col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-serif text-2xl font-semibold text-text-dark">{lead.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${stageBadgeColors[lead.stage]}`}>
                    {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
                  </span>
                  {lead.quality && (
                    <span className="text-xs text-text-muted">Quality: {lead.quality}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="px-4 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Call
                </a>
                <a
                  href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium bg-whatsapp/10 text-whatsapp rounded-lg hover:bg-whatsapp/20 transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Phone</p>
                <p className="text-sm text-text-dark mt-1">{lead.phone}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Email</p>
                <p className="text-sm text-text-dark mt-1">{lead.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Interest</p>
                <p className="text-sm text-text-dark mt-1">{lead.interest || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Source</p>
                <p className="text-sm text-text-dark mt-1">{lead.source || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Booked Treatment</p>
                <p className="text-sm text-text-dark mt-1">{lead.booked_treatment || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Created</p>
                <p className="text-sm text-text-dark mt-1">{new Date(lead.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Stage Timeline */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Stage</h2>
            <div className="flex items-center gap-1">
              {STAGES.map((stage, i) => {
                const stageIndex = STAGES.indexOf(lead.stage as typeof STAGES[number]);
                const isActive = i <= stageIndex && lead.stage !== 'lost';
                const isLost = lead.stage === 'lost' && stage === 'lost';
                return (
                  <button
                    key={stage}
                    onClick={() => updateStage(stage)}
                    className={`flex-1 py-2 text-xs font-medium text-center rounded transition-colors ${
                      isLost
                        ? 'bg-red-100 text-red-700'
                        : isActive
                          ? 'bg-gold text-white'
                          : 'bg-border-light text-text-muted hover:bg-gold-pale'
                    }`}
                  >
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation History */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Conversations</h2>
            {conversations.length === 0 ? (
              <p className="text-sm text-text-muted">No conversations yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversations.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                        msg.direction === 'outbound'
                          ? 'bg-gold text-white'
                          : 'bg-warm-white text-text-dark'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.direction === 'outbound' ? 'text-white/70' : 'text-text-muted'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleString()}
                        {msg.agent && ` · ${msg.agent}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-xl border border-border p-6 space-y-3">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-2">Actions</h2>
            <button
              onClick={convertToClient}
              className="w-full px-4 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
            >
              Convert to Client
            </button>
            <Link
              href={`/dashboard/appointments/new?lead_id=${lead.id}&name=${encodeURIComponent(lead.name)}&phone=${encodeURIComponent(lead.phone || '')}`}
              className="block w-full text-center px-4 py-2.5 border border-gold text-gold text-sm font-medium rounded-lg hover:bg-gold-pale transition-colors"
            >
              Book Appointment
            </Link>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-3">Notes</h2>
            {lead.notes && (
              <pre className="text-sm text-text-light whitespace-pre-wrap bg-warm-white rounded-lg p-3 mb-3 font-sans max-h-64 overflow-y-auto">
                {lead.notes}
              </pre>
            )}
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
              />
              <button
                onClick={addNote}
                className="w-full px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
              >
                Add Note
              </button>
            </div>
          </div>

          {/* Revenue */}
          {lead.actual_revenue > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-serif text-lg font-semibold text-text-dark mb-2">Revenue</h2>
              <p className="text-2xl font-semibold text-gold">
                PKR {lead.actual_revenue.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

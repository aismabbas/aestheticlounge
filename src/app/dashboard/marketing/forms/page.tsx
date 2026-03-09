'use client';

import { useState, useEffect } from 'react';

interface MetaForm {
  form_id: string;
  form_name: string;
  ad_id: string;
  lead_count: number;
  last_lead_at: string;
  utm_campaign: string;
}

interface IntakeForm {
  id: string;
  client_id: string | null;
  client_name: string | null;
  token: string;
  status: 'pending' | 'completed' | 'expired';
  sent_via: string;
  submitted_at: string | null;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function LeadFormsPage() {
  const [metaForms, setMetaForms] = useState<MetaForm[]>([]);
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhookOk, setWebhookOk] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'intake' | 'meta'>('intake');

  // Create intake form state
  const [creating, setCreating] = useState(false);
  const [sendMethod, setSendMethod] = useState<'link' | 'whatsapp' | 'ipad'>('link');
  const [createdUrl, setCreatedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchMetaForms(), fetchIntakeForms(), checkWebhook()]);
    setLoading(false);
  }

  async function fetchMetaForms() {
    try {
      const res = await fetch('/api/dashboard/marketing/forms');
      if (res.ok) {
        const data = await res.json();
        setMetaForms(data.forms || []);
      }
    } catch {
      setMetaForms([]);
    }
  }

  async function fetchIntakeForms() {
    try {
      const res = await fetch('/api/dashboard/marketing/forms/intake');
      if (res.ok) {
        const data = await res.json();
        setIntakeForms(data.forms || []);
      }
    } catch {
      setIntakeForms([]);
    }
  }

  async function checkWebhook() {
    try {
      const res = await fetch('/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=__ping__&hub.challenge=pong');
      setWebhookOk(res.status === 403 || res.status === 200);
    } catch {
      setWebhookOk(false);
    }
  }

  async function createIntakeForm() {
    setCreating(true);
    setCreatedUrl('');
    setCopied(false);
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sent_via: sendMethod }),
      });
      const data = await res.json();
      if (data.url) {
        const mode = sendMethod === 'ipad' ? '?mode=ipad' : '';
        setCreatedUrl(`${data.url}${mode}`);
        fetchIntakeForms();
      }
    } catch { /* ignore */ }
    setCreating(false);
  }

  function copyUrl() {
    navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openIpadKiosk() {
    window.open('/intake/new?mode=ipad', '_blank');
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600">Completed</span>;
      case 'expired':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-500">Expired</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600">Pending</span>;
    }
  };

  const sentViaBadge = (via: string) => {
    const styles: Record<string, string> = {
      whatsapp: 'bg-green-50 text-green-700',
      ipad: 'bg-blue-50 text-blue-700',
      email: 'bg-purple-50 text-purple-700',
      link: 'bg-gray-50 text-gray-600',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[via] || styles.link}`}>
        {via === 'whatsapp' ? 'WhatsApp' : via === 'ipad' ? 'iPad' : via.charAt(0).toUpperCase() + via.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Lead Forms</h1>
          <p className="text-sm text-text-muted mt-1">
            Client intake forms & Meta Instant Forms
          </p>
        </div>
        <button
          onClick={openIpadKiosk}
          className="px-4 py-2 bg-[#1A1A1A] text-white text-sm font-medium rounded-lg hover:bg-black/80 transition-colors"
        >
          Open iPad Kiosk
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-warm-white rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('intake')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'intake' ? 'bg-white text-text-dark shadow-sm' : 'text-text-muted hover:text-text-dark'
          }`}
        >
          Intake Forms
          {intakeForms.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-[#B8924A]/10 text-[#B8924A] text-[10px] rounded-full font-semibold">
              {intakeForms.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('meta')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'meta' ? 'bg-white text-text-dark shadow-sm' : 'text-text-muted hover:text-text-dark'
          }`}
        >
          Meta Instant Forms
          {metaForms.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-[#B8924A]/10 text-[#B8924A] text-[10px] rounded-full font-semibold">
              {metaForms.length}
            </span>
          )}
        </button>
      </div>

      {/* ===== INTAKE FORMS TAB ===== */}
      {tab === 'intake' && (
        <>
          {/* Create New Intake Form */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-dark mb-1">Create Intake Form</h2>
            <p className="text-xs text-text-muted mb-4">
              Generate a new intake form link to share with a client. The form collects personal info, medical history, skin concerns, treatment interest, and consent.
            </p>

            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-text-dark mb-1.5">Send Method</label>
                <select
                  value={sendMethod}
                  onChange={(e) => setSendMethod(e.target.value as 'link' | 'whatsapp' | 'ipad')}
                  className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-[#B8924A] bg-white"
                >
                  <option value="link">Copy Link</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="ipad">iPad Kiosk</option>
                </select>
              </div>
              <button
                onClick={createIntakeForm}
                disabled={creating}
                className="px-5 py-2 bg-[#B8924A] text-white text-sm font-medium rounded-lg hover:bg-[#96742F] transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Generate Form'}
              </button>
            </div>

            {createdUrl && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-medium text-green-800 mb-2">Form created successfully!</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdUrl}
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-xs text-text-dark font-mono"
                  />
                  <button
                    onClick={copyUrl}
                    className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <a
                    href={createdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-white border border-green-300 text-green-700 text-xs font-medium rounded hover:bg-green-50 transition-colors"
                  >
                    Preview
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Intake Forms List */}
          <div className="bg-white rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-dark">All Intake Forms</h2>
              <span className="text-xs text-text-muted">
                {intakeForms.filter(f => f.status === 'completed').length} completed / {intakeForms.length} total
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-border-light rounded w-48 mx-auto" />
                  <div className="h-4 bg-border-light rounded w-64 mx-auto" />
                </div>
              </div>
            ) : intakeForms.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-3xl mb-3">📋</p>
                <p className="text-sm text-text-muted mb-1">No intake forms yet</p>
                <p className="text-xs text-text-muted">Create one above or use the iPad Kiosk for walk-in patients.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border-light bg-warm-white">
                      <th className="px-5 py-3 font-medium">Client</th>
                      <th className="px-5 py-3 font-medium">Sent Via</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Created</th>
                      <th className="px-5 py-3 font-medium">Submitted</th>
                      <th className="px-5 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {intakeForms.map((form) => (
                      <tr key={form.id} className="hover:bg-warm-white transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-text-dark">
                            {form.client_name || 'Walk-in / Unlinked'}
                          </p>
                        </td>
                        <td className="px-5 py-3">{sentViaBadge(form.sent_via)}</td>
                        <td className="px-5 py-3">{statusBadge(form.status)}</td>
                        <td className="px-5 py-3 text-text-muted text-xs">
                          {timeAgo(form.created_at)}
                        </td>
                        <td className="px-5 py-3 text-text-muted text-xs">
                          {form.submitted_at ? timeAgo(form.submitted_at) : '-'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {form.status === 'pending' && (
                              <button
                                onClick={() => {
                                  const url = `${window.location.origin}/intake/${form.token}`;
                                  navigator.clipboard.writeText(url);
                                }}
                                className="text-xs text-[#B8924A] hover:text-[#96742F] font-medium transition-colors"
                              >
                                Copy Link
                              </button>
                            )}
                            {form.status === 'completed' && form.client_id && (
                              <a
                                href={`/dashboard/clients/${form.client_id}`}
                                className="text-xs text-[#B8924A] hover:text-[#96742F] font-medium transition-colors"
                              >
                                View Client
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== META FORMS TAB ===== */}
      {tab === 'meta' && (
        <>
          {/* Webhook Status */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-dark">Meta Webhook Status</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Receives lead form submissions from Instagram/Facebook ads
                </p>
              </div>
              <div className="flex items-center gap-2">
                {webhookOk === null ? (
                  <span className="text-xs text-text-muted">Checking...</span>
                ) : webhookOk ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-green-700">Connected</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs font-medium text-red-700">Setup Needed</span>
                  </>
                )}
              </div>
            </div>

            {webhookOk === false && (
              <div className="mt-4 p-4 bg-warm-white rounded-lg border border-border-light">
                <h3 className="text-sm font-semibold text-text-dark mb-3">Setup Instructions</h3>
                <ol className="space-y-2 text-sm text-text-light">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#B8924A]/20 text-[#B8924A] text-xs font-bold flex items-center justify-center">1</span>
                    <span>Set <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">META_WEBHOOK_VERIFY_TOKEN</code> env var</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#B8924A]/20 text-[#B8924A] text-xs font-bold flex items-center justify-center">2</span>
                    <span>Set <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">META_ACCESS_TOKEN</code> with leads_retrieval permission</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#B8924A]/20 text-[#B8924A] text-xs font-bold flex items-center justify-center">3</span>
                    <span>Webhook URL: <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs break-all">https://aestheticloungeofficial.com/api/webhooks/meta</code></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#B8924A]/20 text-[#B8924A] text-xs font-bold flex items-center justify-center">4</span>
                    <span>Subscribe to <strong>leadgen</strong> field on Page subscription</span>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Meta Forms Table */}
          <div className="bg-white rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-dark">Connected Meta Forms</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-border-light rounded w-48 mx-auto" />
                  <div className="h-4 bg-border-light rounded w-64 mx-auto" />
                </div>
              </div>
            ) : metaForms.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-3xl mb-3">📱</p>
                <p className="text-sm text-text-muted">
                  No Meta form submissions yet. Connect the webhook above to start receiving leads from Instagram ads.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border-light bg-warm-white">
                      <th className="px-5 py-3 font-medium">Form</th>
                      <th className="px-5 py-3 font-medium">Campaign</th>
                      <th className="px-5 py-3 font-medium text-center">Leads</th>
                      <th className="px-5 py-3 font-medium">Last Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {metaForms.map((form) => (
                      <tr key={`${form.form_id}-${form.ad_id}`} className="hover:bg-warm-white transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-text-dark">{form.form_name || form.form_id || 'Unknown Form'}</p>
                          {form.ad_id && (
                            <p className="text-xs text-text-muted mt-0.5">Ad: {form.ad_id}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-text-light">
                          {form.utm_campaign || '-'}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-[#F0E6D0] text-[#96742F] text-xs font-semibold">
                            {form.lead_count}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-text-muted text-xs">
                          {timeAgo(form.last_lead_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

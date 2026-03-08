'use client';

import { useState, useEffect } from 'react';

interface FormLead {
  form_id: string;
  form_name: string;
  ad_id: string;
  lead_count: number;
  last_lead_at: string;
  utm_campaign: string;
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
  const [forms, setForms] = useState<FormLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhookOk, setWebhookOk] = useState<boolean | null>(null);

  // Test form state
  const [testName, setTestName] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testTreatment, setTestTreatment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchForms();
    checkWebhook();
  }, []);

  async function fetchForms() {
    try {
      const res = await fetch('/api/dashboard/marketing/forms');
      if (res.ok) {
        const data = await res.json();
        setForms(data.forms || []);
      }
    } catch {
      // Forms endpoint may not exist yet
      setForms([]);
    }
    setLoading(false);
  }

  async function checkWebhook() {
    try {
      const res = await fetch('/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=__ping__&hub.challenge=pong');
      // If we get 403, the endpoint is live but token didn't match — that's expected
      // If we get 500, META_WEBHOOK_VERIFY_TOKEN is not configured
      setWebhookOk(res.status === 403 || res.status === 200);
    } catch {
      setWebhookOk(false);
    }
  }

  async function handleTestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!testName || !testPhone) return;

    setSubmitting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/webhooks/meta/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          phone: testPhone,
          email: testEmail || undefined,
          treatment: testTreatment || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setTestResult({ success: true, message: `Lead created: ${data.leadId}` });
        setTestName('');
        setTestPhone('');
        setTestEmail('');
        setTestTreatment('');
        // Refresh forms list
        fetchForms();
      } else {
        setTestResult({ success: false, message: data.error || 'Submission failed' });
      }
    } catch {
      setTestResult({ success: false, message: 'Network error' });
    }

    setSubmitting(false);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-text-dark">Lead Forms</h1>
        <p className="text-sm text-text-muted mt-1">
          Meta (Facebook/Instagram) Instant Form webhook integration
        </p>
      </div>

      {/* Webhook Status */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-dark">Webhook Status</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Meta sends lead form submissions to this endpoint
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
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">1</span>
                <span>Create a Facebook App at <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">developers.facebook.com</a></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">2</span>
                <span>Add the <strong>Webhooks</strong> product to your app</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">3</span>
                <span>Subscribe to the <strong>leadgen</strong> field on the Page subscription</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">4</span>
                <span>Set <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">META_WEBHOOK_VERIFY_TOKEN</code> env var to your chosen verify token</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">5</span>
                <span>Enter webhook URL: <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs break-all">https://aesthetic-lounge-dev.netlify.app/api/webhooks/meta</code></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">6</span>
                <span>Set <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">META_ACCESS_TOKEN</code> env var with a Page access token (needs <code className="text-xs">leads_retrieval</code> permission)</span>
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Connected Forms Table */}
      <div className="bg-white rounded-xl border border-border">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-dark">Connected Forms</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-border-light rounded w-48 mx-auto" />
              <div className="h-4 bg-border-light rounded w-64 mx-auto" />
            </div>
          </div>
        ) : forms.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-text-muted">
              No form submissions received yet. Set up the webhook above or use the test form below.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border-light">
                  <th className="px-5 py-3 font-medium">Form</th>
                  <th className="px-5 py-3 font-medium">Campaign</th>
                  <th className="px-5 py-3 font-medium text-center">Leads</th>
                  <th className="px-5 py-3 font-medium">Last Lead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {forms.map((form) => (
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
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gold-pale text-gold-dark text-xs font-semibold">
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

      {/* Test Form Submission */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-dark mb-1">Test Form Submission</h2>
        <p className="text-xs text-text-muted mb-4">
          Simulate a Meta Instant Form submission to test the webhook flow
        </p>

        <form onSubmit={handleTestSubmit} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-medium text-text-dark mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Fatima Khan"
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-dark mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+923001234567"
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-dark mb-1">Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="fatima@example.com"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-dark mb-1">Treatment Interest</label>
            <select
              value={testTreatment}
              onChange={(e) => setTestTreatment(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
            >
              <option value="">Select treatment...</option>
              <option value="Hydrafacial">Hydrafacial</option>
              <option value="Laser Hair Removal">Laser Hair Removal</option>
              <option value="PRP Hair Treatment">PRP Hair Treatment</option>
              <option value="Skin Whitening">Skin Whitening</option>
              <option value="Acne Treatment">Acne Treatment</option>
              <option value="Anti-Aging">Anti-Aging</option>
              <option value="Body Contouring">Body Contouring</option>
              <option value="Consultation">General Consultation</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting || !testName || !testPhone}
            className="px-6 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Test Lead'}
          </button>

          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${
              testResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

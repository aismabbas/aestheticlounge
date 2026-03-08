'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  category: string;
  price_display: string;
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    treatment: '',
    budget_daily: 10,
    headline: '',
    caption: '',
    creative_type: 'image',
  });

  useEffect(() => {
    fetch('/api/dashboard/services')
      .then((r) => r.json())
      .then((data) => {
        // Handle grouped or flat format
        if (data.services && typeof data.services === 'object' && !Array.isArray(data.services)) {
          const flat = Object.values(data.services).flat() as Service[];
          setServices(flat);
        } else {
          setServices(Array.isArray(data) ? data : data.services || []);
        }
      });
  }, []);

  const handleTreatmentChange = (treatment: string) => {
    setForm((prev) => ({
      ...prev,
      treatment,
      name: treatment ? `${treatment} - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/dashboard/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      router.push('/dashboard/ads');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/dashboard/ads" className="hover:text-gold transition-colors">Ads</Link>
        <span>/</span>
        <span className="text-text-dark">Create Campaign</span>
      </div>

      <h1 className="font-serif text-2xl font-semibold text-text-dark mb-6">Create Ad Campaign</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-5 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="col-span-3 bg-white rounded-xl border border-border p-6 space-y-5">
          {/* Treatment */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Treatment *
            </label>
            <select
              required
              value={form.treatment}
              onChange={(e) => handleTreatmentChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
            >
              <option value="">Select treatment to promote...</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.name}>
                  {svc.name} {svc.price_display ? `(${svc.price_display})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              placeholder="e.g., HydraFacial - Mar 2026"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Daily Budget (CAD)
            </label>
            <input
              type="number"
              min={1}
              step={0.01}
              value={form.budget_daily}
              onChange={(e) => setForm({ ...form, budget_daily: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
            />
            <p className="text-xs text-text-muted mt-1">
              Monthly cap: CAD ${(form.budget_daily * 30).toFixed(0)} (max $300/month)
            </p>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Headline
            </label>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              placeholder="Claude will generate if left blank"
              maxLength={80}
            />
            <p className="text-xs text-text-muted mt-1">{form.headline.length}/80 characters</p>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Caption
            </label>
            <textarea
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              rows={4}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
              placeholder="Claude will generate if left blank"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/dashboard/ads"
              className="text-sm text-text-muted hover:text-text-dark transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Submit for Approval'}
            </button>
          </div>
        </form>

        {/* Preview Card */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-border p-5 sticky top-8">
            <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-3">Ad Preview</h3>

            {/* Mock ad card */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-gold-pale h-48 flex items-center justify-center">
                <span className="text-gold-dark text-sm">Creative placeholder</span>
              </div>
              <div className="p-3">
                <p className="text-xs text-text-muted">Sponsored</p>
                <p className="text-sm font-semibold text-text-dark mt-1">
                  {form.headline || form.treatment || 'Your headline here'}
                </p>
                <p className="text-xs text-text-light mt-1 line-clamp-3">
                  {form.caption || 'Your ad caption will appear here. The AI will generate compelling copy if left blank.'}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-text-muted">aestheticloungeofficial.com</span>
                  <span className="text-xs font-medium text-gold">Book Now</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-text-muted">
              <div className="flex justify-between">
                <span>Treatment:</span>
                <span className="text-text-dark">{form.treatment || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Daily Budget:</span>
                <span className="text-text-dark">CAD ${form.budget_daily.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">Draft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

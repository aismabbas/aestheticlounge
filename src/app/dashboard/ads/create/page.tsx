'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Service {
  id: string;
  name: string;
  category: string;
  price_display: string;
}

interface PreflightResult {
  ok: boolean;
  current_daily_spend: number;
  headroom: number;
  monthly_projection: number;
  monthly_cap: number;
  message: string;
}

interface CreateResult {
  campaign_id: string;
  meta_campaign_id: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  { num: 1, label: 'Campaign Setup', desc: 'Name, treatment & objective' },
  { num: 2, label: 'Budget & Preflight', desc: 'Daily budget with live checks' },
  { num: 3, label: 'Audience', desc: 'Recommended targeting info' },
  { num: 4, label: 'AI Creative', desc: 'Generate ad copy & images' },
  { num: 5, label: 'Review & Create', desc: 'Confirm and launch' },
];

const MODELS = [
  { name: 'ayesha', label: 'Ayesha', desc: 'Face treatments, Ramadan/Eid campaigns' },
  { name: 'meher', label: 'Meher', desc: 'Body contouring, spa treatments' },
  { name: 'noor', label: 'Noor', desc: 'Laser treatments, summer campaigns' },
  { name: 'usman', label: 'Usman', desc: "Men's grooming, confidence campaigns" },
];

const MONTHLY_CAP = 300;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateCampaignPage() {
  const router = useRouter();

  // Step tracking
  const [step, setStep] = useState(1);

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    name: '',
    treatment: '',
    objective: 'OUTCOME_LEADS',
    budget_daily: 5,
  });

  // Preflight
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);

  // AI Creative
  const [selectedModel, setSelectedModel] = useState('');
  const [freeform, setFreeform] = useState('');
  const [generatingCreative, setGeneratingCreative] = useState(false);
  const [adCreative, setAdCreative] = useState<{
    headline?: string;
    primary_text?: string;
    description?: string;
    cta_type?: string;
    character?: string;
    ad_angle?: string;
    image_prompt?: string;
  } | null>(null);
  const [adImages, setAdImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);

  // ---------------------------------------------------------------------------
  // Load services
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetch('/api/dashboard/services')
      .then((r) => r.json())
      .then((data) => {
        if (data.services && typeof data.services === 'object' && !Array.isArray(data.services)) {
          const flat = Object.values(data.services).flat() as Service[];
          setServices(flat);
        } else {
          setServices(Array.isArray(data) ? data : data.services || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-generate campaign name from treatment
  // ---------------------------------------------------------------------------

  const handleTreatmentChange = (treatment: string) => {
    setForm((prev) => ({
      ...prev,
      treatment,
      name: treatment
        ? `${treatment} - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
        : '',
    }));
  };

  // ---------------------------------------------------------------------------
  // Preflight check (debounced)
  // ---------------------------------------------------------------------------

  const runPreflight = useCallback(async (dailyBudget: number) => {
    setPreflightLoading(true);
    try {
      const res = await fetch('/api/dashboard/ads/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_budget: dailyBudget }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreflight(data);
      } else {
        // Fallback preflight calculation
        const monthlyProjection = dailyBudget * 30;
        setPreflight({
          ok: monthlyProjection <= MONTHLY_CAP,
          current_daily_spend: 0,
          headroom: MONTHLY_CAP - monthlyProjection,
          monthly_projection: monthlyProjection,
          monthly_cap: MONTHLY_CAP,
          message: monthlyProjection <= MONTHLY_CAP
            ? `Budget OK: $${monthlyProjection.toFixed(0)}/month is within $${MONTHLY_CAP} cap`
            : `Over cap: $${monthlyProjection.toFixed(0)}/month exceeds $${MONTHLY_CAP} cap`,
        });
      }
    } catch {
      // Fallback
      const monthlyProjection = dailyBudget * 30;
      setPreflight({
        ok: monthlyProjection <= MONTHLY_CAP,
        current_daily_spend: 0,
        headroom: MONTHLY_CAP - monthlyProjection,
        monthly_projection: monthlyProjection,
        monthly_cap: MONTHLY_CAP,
        message: monthlyProjection <= MONTHLY_CAP
          ? `Budget OK: $${monthlyProjection.toFixed(0)}/month is within $${MONTHLY_CAP} cap`
          : `Over cap: $${monthlyProjection.toFixed(0)}/month exceeds $${MONTHLY_CAP} cap`,
      });
    } finally {
      setPreflightLoading(false);
    }
  }, []);

  // Run preflight when entering step 2 or budget changes
  useEffect(() => {
    if (step !== 2) return;
    const timer = setTimeout(() => runPreflight(form.budget_daily), 500);
    return () => clearTimeout(timer);
  }, [step, form.budget_daily, runPreflight]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleCreate() {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/ads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'campaign',
          name: form.name,
          treatment: form.treatment,
          objective: form.objective,
          daily_budget: form.budget_daily,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create campaign');
      }
      const result = await res.json();
      setCreateResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const canProceed = () => {
    switch (step) {
      case 1: return form.name.trim() !== '' && form.treatment.trim() !== '';
      case 2: return preflight?.ok === true;
      case 3: return true;
      case 4: return true; // Creative is optional
      case 5: return preflight?.ok === true && !submitting;
      default: return false;
    }
  };

  async function generateCreative() {
    setGeneratingCreative(true);
    try {
      const res = await fetch('/api/al/ad-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treatment: form.treatment,
          objective: form.objective,
          model: selectedModel || undefined,
          freeform: freeform || undefined,
          generateImages: true,
          numImages: 2,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdCreative(data.copy);
        setAdImages(data.images || []);
        if (data.images?.length) setSelectedImage(data.images[0]);
      } else {
        setError(data.error || 'Creative generation failed');
      }
    } catch {
      setError('Failed to generate creative');
    } finally {
      setGeneratingCreative(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="max-w-3xl animate-pulse space-y-4">
        <div className="h-8 bg-border-light rounded w-48" />
        <div className="h-64 bg-border-light rounded-xl" />
      </div>
    );
  }

  // Success state
  if (createResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-text-dark mb-2">
            Campaign Created
          </h2>
          <p className="text-sm text-text-muted mb-6">
            Your campaign has been created as <span className="font-medium text-amber-600">PAUSED</span>.
            Review it in Meta Ads Manager before activating.
          </p>

          <div className="bg-warm-white rounded-lg border border-border-light p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Campaign Name</span>
                <span className="text-text-dark font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Meta Campaign ID</span>
                <span className="text-text-dark font-mono text-xs">{createResult.meta_campaign_id || createResult.campaign_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                  {createResult.status || 'PAUSED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Daily Budget</span>
                <span className="text-text-dark font-medium">CAD ${form.budget_daily.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <a
              href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1035082445426356&selected_campaign_ids=${createResult.meta_campaign_id || createResult.campaign_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-warm-white hover:bg-gold-pale text-text-dark text-sm font-medium rounded-lg border border-border-light transition-colors"
            >
              Open in Meta Ads Manager
            </a>
            <Link
              href="/dashboard/ads"
              className="px-5 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Back to Ads
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/dashboard/ads" className="hover:text-gold transition-colors">
          Ads
        </Link>
        <span>/</span>
        <span className="text-text-dark">Create Campaign</span>
      </div>

      <h1 className="font-serif text-2xl font-semibold text-text-dark mb-6">
        Create Ad Campaign
      </h1>

      {/* ================================================================== */}
      {/* Step Indicator                                                      */}
      {/* ================================================================== */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <div className="flex items-start gap-2 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-start">
              <div className="flex flex-col items-center min-w-[120px]">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
                    step === s.num
                      ? 'bg-gold text-white'
                      : step > s.num
                        ? 'bg-green-100 text-green-700'
                        : 'bg-warm-white border border-border-light text-text-muted'
                  }`}
                >
                  {step > s.num ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <p className={`text-xs font-medium mt-2 ${step === s.num ? 'text-text-dark' : 'text-text-muted'}`}>
                  {s.label}
                </p>
                <p className="text-[10px] text-text-muted text-center mt-0.5 max-w-[110px] leading-tight">
                  {s.desc}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex items-center h-10 px-1">
                  <div className={`w-6 h-px ${step > s.num ? 'bg-green-400' : 'bg-border'}`} />
                  <span className={`text-xs ${step > s.num ? 'text-green-400' : 'text-border'}`}>&#9654;</span>
                  <div className={`w-6 h-px ${step > s.num ? 'bg-green-400' : 'bg-border'}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================================================================== */}
      {/* Step 1: Campaign Setup                                              */}
      {/* ================================================================== */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-text-dark mb-1">Campaign Setup</h2>
            <p className="text-xs text-text-muted">Choose a treatment to promote and configure basics.</p>
          </div>

          {/* Treatment */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Treatment *
            </label>
            <select
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
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
              placeholder="e.g., HydraFacial - Mar 2026"
            />
            <p className="text-xs text-text-muted mt-1">
              Auto-generated from treatment + month. Editable.
            </p>
          </div>

          {/* Objective */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Objective
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-border-light hover:border-gold/30 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="objective"
                  value="OUTCOME_LEADS"
                  checked={form.objective === 'OUTCOME_LEADS'}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  className="mt-0.5 accent-[#B8924A]"
                />
                <div>
                  <p className="text-sm font-medium text-text-dark">Lead Generation</p>
                  <p className="text-xs text-text-muted">
                    Recommended for AL. Collect leads via Instant Forms on Instagram.
                  </p>
                </div>
                <span className="ml-auto shrink-0 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                  Recommended
                </span>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-border-light hover:border-gold/30 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="objective"
                  value="OUTCOME_TRAFFIC"
                  checked={form.objective === 'OUTCOME_TRAFFIC'}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  className="mt-0.5 accent-[#B8924A]"
                />
                <div>
                  <p className="text-sm font-medium text-text-dark">Website Traffic</p>
                  <p className="text-xs text-text-muted">
                    Drive visitors to aestheticloungeofficial.com booking page.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-amber-800">
              All campaigns are created as <span className="font-semibold">PAUSED</span>. You must activate them after review in Meta Ads Manager.
            </p>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Step 2: Budget & Preflight                                          */}
      {/* ================================================================== */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-text-dark mb-1">Budget & Preflight</h2>
            <p className="text-xs text-text-muted">Set daily budget and check against spending caps.</p>
          </div>

          {/* Budget Input */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Daily Budget (CAD)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              step={0.5}
              value={form.budget_daily}
              onChange={(e) => setForm({ ...form, budget_daily: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
            />
          </div>

          {/* Budget Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted mb-2">
              <span>$1/day</span>
              <span className="font-medium text-text-dark">
                ${form.budget_daily.toFixed(2)}/day = ${(form.budget_daily * 30).toFixed(0)}/month
              </span>
              <span>$10/day</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={form.budget_daily}
              onChange={(e) => setForm({ ...form, budget_daily: parseFloat(e.target.value) })}
              className="w-full h-2 bg-border-light rounded-full appearance-none cursor-pointer accent-[#B8924A]"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>$30/mo</span>
              <span>$150/mo</span>
              <span>$300/mo</span>
            </div>
          </div>

          {/* Preflight Check Display */}
          <div className={`rounded-lg border p-4 ${
            preflightLoading
              ? 'bg-warm-white border-border-light'
              : preflight?.ok
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
          }`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Preflight Check
              {preflightLoading && (
                <span className="ml-2 inline-block w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              )}
            </p>

            {preflight && !preflightLoading && (
              <div className="space-y-2.5">
                {/* Current daily spend */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Current daily spend (all ad sets)</span>
                  <span className="text-sm font-medium text-text-dark">
                    ${preflight.current_daily_spend.toFixed(2)}
                  </span>
                </div>

                {/* Headroom */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Headroom remaining</span>
                  <span className={`text-sm font-medium ${preflight.headroom > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${preflight.headroom.toFixed(2)}
                  </span>
                </div>

                {/* Monthly projection */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Monthly projection</span>
                  <span className="text-sm font-medium text-text-dark">
                    ${preflight.monthly_projection.toFixed(0)} / ${preflight.monthly_cap}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <div className="w-full h-2 bg-border-light rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        preflight.ok ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((preflight.monthly_projection / preflight.monthly_cap) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 mt-2">
                  {preflight.ok ? (
                    <>
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-700">{preflight.message}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-red-700">{preflight.message}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Step 3: Audience (Informational)                                    */}
      {/* ================================================================== */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-text-dark mb-1">Recommended Audience</h2>
            <p className="text-xs text-text-muted">Targeting configured in Meta Ads Manager after creation.</p>
          </div>

          <div className="space-y-3">
            {/* Demographics */}
            <div className="p-4 bg-warm-white rounded-lg border border-border-light">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Demographics
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-text-dark">Women, 25-50 years old</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-text-dark">DHA Phase 7/8, Lahore (5km radius)</span>
                </div>
              </div>
            </div>

            {/* Interest Targeting */}
            <div className="p-4 bg-warm-white rounded-lg border border-border-light">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                3-Layer Flex Targeting
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold-pale text-gold-dark">
                  Beauty & Skincare
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold-pale text-gold-dark">
                  Luxury Lifestyle
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold-pale text-gold-dark">
                  Premium Travelers
                </span>
              </div>
            </div>

            {/* Placements */}
            <div className="p-4 bg-warm-white rounded-lg border border-border-light">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Placements
              </p>
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-text-dark">Instagram Feed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-text-dark">Instagram Reels</span>
                </div>
              </div>
            </div>

            {/* Estimated Reach */}
            <div className="p-4 bg-warm-white rounded-lg border border-border-light">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Estimated Reach
              </p>
              <p className="text-lg font-semibold text-text-dark">190K - 224K</p>
              <p className="text-xs text-text-muted mt-1">
                Based on similar campaigns in Lahore metro area
              </p>
            </div>
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-blue-800">
              Detailed targeting is configured in Meta Ads Manager after the campaign is created. This screen shows recommended settings.
            </p>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* Step 4: AI Creative                                                 */}
      {/* ================================================================== */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-text-dark mb-1">AI Ad Creative</h2>
            <p className="text-xs text-text-muted">Generate ad copy and images using AI. Optional — you can skip to review.</p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Character / Model
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedModel('')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  !selectedModel ? 'border-gold bg-gold-pale' : 'border-border-light hover:border-gold/30'
                }`}
              >
                <p className="text-xs font-medium text-text-dark">Auto-select</p>
                <p className="text-[10px] text-text-muted">AI picks best fit</p>
              </button>
              {MODELS.map((m) => (
                <button
                  key={m.name}
                  onClick={() => setSelectedModel(m.name)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedModel === m.name ? 'border-gold bg-gold-pale' : 'border-border-light hover:border-gold/30'
                  }`}
                >
                  <p className="text-xs font-medium text-text-dark">{m.label}</p>
                  <p className="text-[10px] text-text-muted">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Freeform Creative Direction */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted tracking-wider mb-1.5">
              Creative Direction (optional)
            </label>
            <textarea
              value={freeform}
              onChange={(e) => setFreeform(e.target.value)}
              rows={3}
              placeholder="e.g. Focus on summer prep angle, show before/after transformation, emphasize painless procedure, luxury clinic vibes..."
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
            />
            <p className="text-[10px] text-text-muted mt-1">
              Freeform instructions are AI-enhanced for optimal image prompts.
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateCreative}
            disabled={generatingCreative}
            className="px-6 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {generatingCreative ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating creative...
              </span>
            ) : (
              'Generate Ad Creative'
            )}
          </button>

          {/* Generated Results */}
          {adCreative && (
            <div className="space-y-4 pt-4 border-t border-border-light">
              <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider">Generated Copy</h3>
              <div className="bg-warm-white rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-[10px] text-text-muted">Headline</p>
                  <p className="text-sm font-medium text-text-dark">{adCreative.headline}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">Primary Text</p>
                  <p className="text-sm text-text-dark">{adCreative.primary_text}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">Description</p>
                  <p className="text-sm text-text-dark">{adCreative.description}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] text-text-muted">CTA</p>
                    <p className="text-xs font-medium text-gold">{adCreative.cta_type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">Angle</p>
                    <p className="text-xs font-medium text-text-dark">{adCreative.ad_angle}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">Character</p>
                    <p className="text-xs font-medium text-text-dark capitalize">{adCreative.character}</p>
                  </div>
                </div>
              </div>

              {/* Generated Images */}
              {adImages.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-text-muted tracking-wider mb-2">Generated Images</h3>
                  <p className="text-[10px] text-text-muted mb-2">Click to select an image for your ad.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {adImages.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(url)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === url ? 'border-gold' : 'border-transparent hover:border-gold/30'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Ad creative ${i + 1}`} className="w-full aspect-square object-cover" />
                        {selectedImage === url && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Regenerate */}
              <button
                onClick={generateCreative}
                disabled={generatingCreative}
                className="px-4 py-2 text-sm text-gold hover:text-gold-dark font-medium transition-colors disabled:opacity-50"
              >
                Regenerate creative
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* Step 5: Review & Create                                             */}
      {/* ================================================================== */}
      {step === 5 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-text-dark mb-1">Review & Create</h2>
            <p className="text-xs text-text-muted">Confirm campaign details before creating.</p>
          </div>

          {/* Summary Card */}
          <div className="bg-warm-white rounded-lg border border-border-light p-5 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Campaign Name</span>
              <span className="text-sm font-medium text-text-dark text-right">{form.name}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Treatment</span>
              <span className="text-sm text-text-dark">{form.treatment}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Objective</span>
              <span className="text-sm text-text-dark">
                {form.objective === 'OUTCOME_LEADS' ? 'Lead Generation' : 'Website Traffic'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Daily Budget</span>
              <span className="text-sm font-medium text-text-dark">CAD ${form.budget_daily.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Monthly Projection</span>
              <span className="text-sm text-text-dark">${(form.budget_daily * 30).toFixed(0)} / $300</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Initial Status</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                PAUSED
              </span>
            </div>
          </div>

          {/* Preflight Status */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${
            preflight?.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            {preflight?.ok ? (
              <>
                <svg className="w-5 h-5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-700">Preflight passed. Budget within cap.</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700">Preflight failed. Reduce budget to proceed.</span>
              </>
            )}
          </div>

          {/* AI Creative Summary */}
          {adCreative && (
            <div className="bg-warm-white rounded-lg border border-border-light p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">AI Creative</p>
              <div className="flex items-start gap-3">
                {selectedImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedImage} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="text-sm space-y-1">
                  <p className="font-medium text-text-dark">{adCreative.headline}</p>
                  <p className="text-xs text-text-muted line-clamp-2">{adCreative.primary_text}</p>
                  <p className="text-[10px] text-text-muted capitalize">
                    {adCreative.character} | {adCreative.ad_angle} | {adCreative.cta_type}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={!preflight?.ok || submitting}
            className="w-full py-3 bg-gold hover:bg-gold/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Campaign...
              </span>
            ) : (
              'Create as PAUSED'
            )}
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* Navigation Buttons                                                  */}
      {/* ================================================================== */}
      {!createResult && (
        <div className="flex items-center justify-between mt-6">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 text-sm text-text-muted hover:text-text-dark transition-colors"
            >
              &larr; Back
            </button>
          ) : (
            <Link
              href="/dashboard/ads"
              className="px-5 py-2.5 text-sm text-text-muted hover:text-text-dark transition-colors"
            >
              Cancel
            </Link>
          )}

          {step < 5 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-6 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

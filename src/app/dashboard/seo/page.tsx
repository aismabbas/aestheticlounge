'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface PageAudit {
  url: string;
  title: string;
  description: string;
  titleLength: number;
  descLength: number;
  status: 'good' | 'warning' | 'missing';
}

interface GSCData {
  configured: boolean;
  error?: string;
  range?: number;
  startDate?: string;
  endDate?: string;
  performance?: { clicks: number; impressions: number; ctr: number; position: number };
  daily?: { date: string; clicks: number; impressions: number; ctr: number; position: number }[];
  queries?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  pages?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  sitemaps?: { path: string; lastSubmitted: string; warnings: number; errors: number; contents: { type: string; submitted: number; indexed: number }[] }[];
}

const TABS = ['Overview', 'Page SEO', 'Structured Data', 'Search Console'] as const;
type Tab = (typeof TABS)[number];

// ─── Static audit data ─────────────────────────────────────────────────────
const PAGES_AUDIT: PageAudit[] = [
  {
    url: '/',
    title: 'Aesthetic Lounge — Premium Medical Aesthetics in Lahore',
    description:
      "Lahore's premier medical aesthetics clinic at Plaza-126, BWB Phase 8, DHA Lahore Cantt. 80+ treatments including HydraFacial, Botox, fillers, laser hair removal & body contouring.",
    titleLength: 55,
    descLength: 157,
    status: 'good',
  },
  {
    url: '/about',
    title: 'About Us | Aesthetic Lounge',
    description: 'Learn about Aesthetic Lounge, our mission, and our expert team of doctors.',
    titleLength: 28,
    descLength: 72,
    status: 'warning',
  },
  {
    url: '/services',
    title: 'Services | Aesthetic Lounge',
    description: 'Explore 80+ aesthetic treatments at Aesthetic Lounge Lahore.',
    titleLength: 28,
    descLength: 60,
    status: 'warning',
  },
  {
    url: '/doctors',
    title: 'Our Doctors | Aesthetic Lounge',
    description: 'Meet the expert doctors at Aesthetic Lounge.',
    titleLength: 31,
    descLength: 44,
    status: 'warning',
  },
  {
    url: '/contact',
    title: 'Contact | Aesthetic Lounge',
    description: 'Get in touch with Aesthetic Lounge at DHA Phase 8, Lahore.',
    titleLength: 27,
    descLength: 58,
    status: 'warning',
  },
  {
    url: '/blog',
    title: 'Blog | Aesthetic Lounge',
    description: 'Expert insights on skincare, treatments, and beauty from Aesthetic Lounge Lahore.',
    titleLength: 24,
    descLength: 81,
    status: 'good',
  },
];

const HEALTH_CHECKS = [
  { label: 'Meta Titles Set', passed: true },
  { label: 'Meta Descriptions Set', passed: true },
  { label: 'OG Images Configured', passed: true },
  { label: 'Sitemap Accessible', passed: true },
  { label: 'robots.txt Correct', passed: true },
  { label: 'Structured Data (JSON-LD)', passed: true },
  { label: 'Canonical URLs', passed: true },
  { label: 'Mobile Responsive', passed: true },
];

const SCHEMA_TYPES = [
  {
    name: 'LocalBusiness',
    enabled: true,
    preview: {
      title: 'Aesthetic Lounge',
      type: 'Medical Aesthetics Clinic',
      rating: '4.8',
      reviews: '1,000+',
      address: 'Plaza-126, BWB Phase 8, DHA Lahore Cantt',
      hours: 'Mon-Sat 10 AM - 9 PM',
    },
    json: `{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Aesthetic Lounge",
  "telephone": "+92-327-6620000",
  "address": { "streetAddress": "Plaza-126, BWB Phase 8", "addressLocality": "DHA Lahore Cantt" },
  "aggregateRating": { "ratingValue": "4.8", "reviewCount": "1000" }
}`,
  },
  {
    name: 'MedicalBusiness',
    enabled: true,
    preview: {
      title: 'Aesthetic Lounge',
      type: 'Medical Spa / Dermatology',
      specialty: 'Dermatology',
      founder: 'Dr. Huma',
    },
    json: `{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "Aesthetic Lounge",
  "medicalSpecialty": "Dermatology",
  "founder": { "name": "Dr. Huma", "jobTitle": "Aesthetic Physician" }
}`,
  },
  {
    name: 'Service (Treatment Pages)',
    enabled: true,
    preview: {
      title: 'MedicalProcedure Schema',
      type: 'Auto-generated per treatment page',
      details: 'Name, description, category, provider info',
    },
    json: `{
  "@context": "https://schema.org",
  "@type": "MedicalProcedure",
  "name": "[Treatment Name]",
  "description": "[Treatment Description]",
  "provider": { "name": "Aesthetic Lounge" }
}`,
  },
  {
    name: 'Article (Blog Posts)',
    enabled: true,
    preview: {
      title: 'Article Schema',
      type: 'Auto-generated per blog post',
      details: 'Headline, author, publisher, datePublished',
    },
    json: `{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Post Title]",
  "author": { "name": "[Author]" },
  "publisher": { "name": "Aesthetic Lounge" }
}`,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function statusColor(status: PageAudit['status']) {
  switch (status) {
    case 'good':
      return 'bg-green-100 text-green-700';
    case 'warning':
      return 'bg-amber-100 text-amber-700';
    case 'missing':
      return 'bg-red-100 text-red-700';
  }
}

function lengthColor(len: number, min: number, max: number) {
  if (len === 0) return 'text-red-600';
  if (len >= min && len <= max) return 'text-green-600';
  return 'text-amber-600';
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function SEODashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [schemas, setSchemas] = useState(SCHEMA_TYPES);
  const [gsc, setGsc] = useState<GSCData | null>(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscRange, setGscRange] = useState(28);

  const healthScore = Math.round(
    (HEALTH_CHECKS.filter((c) => c.passed).length / HEALTH_CHECKS.length) * 100,
  );

  const fetchGSC = useCallback(async (range: number) => {
    setGscLoading(true);
    try {
      const res = await fetch(`/api/dashboard/seo/search-console?range=${range}`);
      const data = await res.json();
      setGsc(data);
    } catch {
      setGsc({ configured: false, error: 'Failed to fetch data' });
    } finally {
      setGscLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Search Console' || activeTab === 'Overview') {
      fetchGSC(gscRange);
    }
  }, [activeTab, gscRange, fetchGSC]);

  function toggleSchema(index: number) {
    setSchemas((prev) =>
      prev.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s)),
    );
  }

  // Calculate max for chart scaling
  const maxImpressions = gsc?.daily ? Math.max(...gsc.daily.map((d) => d.impressions), 1) : 1;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-text-dark">SEO Management</h1>
        <p className="text-sm text-text-muted mt-1">
          Monitor and optimize your site&apos;s search engine performance
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border-light">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-gold text-gold'
                : 'border-transparent text-text-muted hover:text-text-dark'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* Health Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-border p-6 md:col-span-1">
              <h3 className="text-sm font-medium text-text-muted mb-4">Site Health Score</h3>
              <div className="flex items-center gap-4">
                <div
                  className={`text-4xl font-bold ${
                    healthScore >= 80
                      ? 'text-green-600'
                      : healthScore >= 60
                        ? 'text-amber-600'
                        : 'text-red-600'
                  }`}
                >
                  {healthScore}%
                </div>
                <div className="flex-1">
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {HEALTH_CHECKS.filter((c) => c.passed).length}/{HEALTH_CHECKS.length} checks
                    passing
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border p-6 md:col-span-2">
              <h3 className="text-sm font-medium text-text-muted mb-4">SEO Checklist</h3>
              <div className="grid grid-cols-2 gap-3">
                {HEALTH_CHECKS.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-sm">
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                        check.passed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {check.passed ? '\u2713' : '\u2717'}
                    </span>
                    <span className="text-text-dark">{check.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GSC Quick Metrics */}
          {gsc?.configured && gsc.performance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Impressions', value: formatNum(gsc.performance.impressions), icon: '👁' },
                { label: 'Clicks', value: formatNum(gsc.performance.clicks), icon: '👆' },
                { label: 'CTR', value: `${(gsc.performance.ctr * 100).toFixed(1)}%`, icon: '📈' },
                { label: 'Avg Position', value: gsc.performance.position.toFixed(1), icon: '🏆' },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{m.icon}</span>
                    <span className="text-xs text-text-muted">{m.label}</span>
                  </div>
                  <p className="text-2xl font-semibold text-text-dark">{m.value}</p>
                  <p className="text-[10px] text-text-muted mt-1">Last {gscRange} days</p>
                </div>
              ))}
            </div>
          )}

          {/* Page Audit Summary */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4">Page Audit Summary</h3>
            <div className="space-y-3">
              {PAGES_AUDIT.map((page) => (
                <div
                  key={page.url}
                  className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-dark truncate">{page.url}</p>
                    <p className="text-xs text-text-muted truncate">{page.title}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase ${statusColor(
                      page.status,
                    )}`}
                  >
                    {page.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Indexing Status */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="text-sm font-medium text-text-muted mb-2">Indexing Status</h3>
            {gsc?.configured && gsc.sitemaps && gsc.sitemaps.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {gsc.sitemaps[0]?.contents?.map((c, i) => (
                  <div key={i} className="bg-warm-white rounded-lg p-4 text-center">
                    <p className="text-2xl font-semibold text-text-dark">{c.indexed}</p>
                    <p className="text-xs text-text-muted mt-1">{c.type} Indexed</p>
                    <p className="text-[10px] text-text-muted">{c.submitted} submitted</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="text-xs text-text-muted">
                  {gsc?.configured ? 'No sitemaps found. Submit your sitemap in Search Console.' : 'Connect Google Search Console to see which pages are indexed.'}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {['Indexed Pages', 'Crawl Errors', 'Sitemaps'].map((label) => (
                    <div key={label} className="bg-warm-white rounded-lg p-4 text-center">
                      <p className="text-2xl font-semibold text-text-muted">--</p>
                      <p className="text-xs text-text-muted mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Page SEO' && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-warm-white">
                  <th className="text-left px-4 py-3 font-medium text-text-muted">URL</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Description</th>
                  <th className="text-center px-4 py-3 font-medium text-text-muted w-20">Title Len</th>
                  <th className="text-center px-4 py-3 font-medium text-text-muted w-20">Desc Len</th>
                  <th className="text-center px-4 py-3 font-medium text-text-muted w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {PAGES_AUDIT.map((page) => (
                  <tr
                    key={page.url}
                    className="border-b border-border-light hover:bg-warm-white/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gold">{page.url}</td>
                    <td className="px-4 py-3 text-text-dark max-w-[200px] truncate">
                      {page.title || <span className="text-red-400 italic">Missing</span>}
                    </td>
                    <td className="px-4 py-3 text-text-muted max-w-[240px] truncate">
                      {page.description || <span className="text-red-400 italic">Missing</span>}
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-mono ${lengthColor(
                        page.titleLength,
                        50,
                        60,
                      )}`}
                    >
                      {page.titleLength}
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-mono ${lengthColor(
                        page.descLength,
                        150,
                        160,
                      )}`}
                    >
                      {page.descLength}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-medium uppercase ${statusColor(
                          page.status,
                        )}`}
                      >
                        {page.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-warm-white border-t border-border-light">
            <p className="text-xs text-text-muted">
              Ideal: Title 50-60 characters (green), Description 150-160 characters (green).
              Yellow indicates suboptimal length. Red indicates missing.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'Structured Data' && (
        <div className="space-y-5">
          {schemas.map((schema, idx) => (
            <div key={schema.name} className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-dark">{schema.name}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {schema.name === 'LocalBusiness'
                      ? 'General business information for Google Knowledge Panel'
                      : schema.name === 'MedicalBusiness'
                        ? 'Medical specialty information for healthcare search results'
                        : schema.name.includes('Service')
                          ? 'Auto-generated for each treatment/service page'
                          : 'Auto-generated for each blog post'}
                  </p>
                </div>
                <button
                  onClick={() => toggleSchema(idx)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    schema.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      schema.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Google Preview */}
              <div className="bg-warm-white rounded-lg p-4 mb-4">
                <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">
                  Google Search Preview
                </p>
                <div className="border border-border-light rounded-lg bg-white p-4">
                  <p className="text-[#1a0dab] text-base font-medium">
                    {schema.preview.title}
                  </p>
                  <p className="text-[#006621] text-xs mt-0.5">
                    aestheticloungeofficial.com
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    {schema.preview.type}
                    {'rating' in schema.preview &&
                      ` | Rating: ${schema.preview.rating} (${schema.preview.reviews} reviews)`}
                    {'specialty' in schema.preview &&
                      ` | Specialty: ${schema.preview.specialty}`}
                    {'details' in schema.preview && ` — ${schema.preview.details}`}
                  </p>
                </div>
              </div>

              {/* JSON-LD Preview */}
              <details className="group">
                <summary className="text-xs font-medium text-gold cursor-pointer hover:underline">
                  View JSON-LD Code
                </summary>
                <pre className="mt-2 bg-[#1A1A1A] text-green-400 text-xs p-4 rounded-lg overflow-x-auto">
                  {schema.json}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Search Console' && (
        <div className="space-y-6">
          {/* Range selector */}
          <div className="flex items-center gap-2">
            {[7, 14, 28, 90].map((r) => (
              <button
                key={r}
                onClick={() => setGscRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  gscRange === r
                    ? 'bg-gold text-white'
                    : 'bg-warm-white text-text-muted hover:bg-gray-100'
                }`}
              >
                {r}d
              </button>
            ))}
            {gscLoading && (
              <span className="text-xs text-text-muted ml-2">Loading...</span>
            )}
          </div>

          {gsc?.error && !gsc.configured && (
            /* Setup card — not configured */
            <div className="bg-white rounded-xl border border-border p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warm-white mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-dark mb-2">
                Connect Google Search Console
              </h3>
              <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
                Link your Google Search Console account to see real search performance data.
              </p>
              <div className="bg-warm-white rounded-lg p-4 max-w-lg mx-auto text-left text-sm text-text-muted space-y-2">
                <p className="font-medium text-text-dark">Setup Steps:</p>
                <div className="grid grid-cols-1 gap-3 mt-3">
                  {[
                    { step: 1, icon: '🌐', text: 'Add property in Google Search Console' },
                    { step: 2, icon: '✅', text: 'Verify via Cloudflare DNS TXT record' },
                    { step: 3, icon: '📄', text: 'Submit sitemap: /sitemap.xml' },
                    { step: 4, icon: '🔑', text: 'Add service account as user in GSC' },
                    { step: 5, icon: '⚙️', text: 'Enable Search Console API in Google Cloud' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-border-light">
                      <div className="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {s.step}
                      </div>
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-sm text-text-dark">{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {gsc?.error && gsc.configured && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-medium text-red-700">API Error</p>
              <p className="text-xs text-red-600 mt-1">{gsc.error}</p>
            </div>
          )}

          {gsc?.configured && gsc.performance && (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Impressions', value: formatNum(gsc.performance.impressions), icon: '👁', color: 'border-blue-200' },
                  { label: 'Total Clicks', value: formatNum(gsc.performance.clicks), icon: '👆', color: 'border-green-200' },
                  { label: 'Average CTR', value: `${(gsc.performance.ctr * 100).toFixed(1)}%`, icon: '📈', color: 'border-amber-200' },
                  { label: 'Avg Position', value: gsc.performance.position.toFixed(1), icon: '🏆', color: 'border-purple-200' },
                ].map((metric) => (
                  <div key={metric.label} className={`bg-white rounded-xl border ${metric.color} p-5`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{metric.icon}</span>
                      <span className="text-xs text-text-muted">{metric.label}</span>
                    </div>
                    <p className="text-2xl font-semibold text-text-dark">{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Daily Chart (simple bar chart) */}
              {gsc.daily && gsc.daily.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-6">
                  <h3 className="text-sm font-medium text-text-muted mb-4">
                    Search Performance (Last {gscRange} Days)
                  </h3>
                  <div className="flex items-end gap-[2px] h-40">
                    {gsc.daily.map((day, i) => {
                      const h = Math.max((day.impressions / maxImpressions) * 100, 2);
                      return (
                        <div
                          key={i}
                          className="flex-1 group relative"
                          title={`${day.date}: ${day.impressions} imp, ${day.clicks} clicks`}
                        >
                          <div
                            className="w-full bg-blue-400 rounded-t hover:bg-blue-500 transition-colors"
                            style={{ height: `${h}%` }}
                          />
                          {/* Clicks overlay */}
                          {day.clicks > 0 && (
                            <div
                              className="w-full bg-green-400 rounded-t absolute bottom-0 left-0"
                              style={{ height: `${Math.max((day.clicks / maxImpressions) * 100, 1)}%` }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-text-muted">{gsc.daily[0]?.date}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-blue-400" />
                        <span className="text-[10px] text-text-muted">Impressions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-green-400" />
                        <span className="text-[10px] text-text-muted">Clicks</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted">{gsc.daily[gsc.daily.length - 1]?.date}</span>
                  </div>
                </div>
              )}

              {/* Top Queries */}
              {gsc.queries && gsc.queries.length > 0 && (
                <div className="bg-white rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-warm-white">
                    <h3 className="text-sm font-medium text-text-muted">Top Search Queries</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-light">
                          <th className="text-left px-4 py-2 text-xs font-medium text-text-muted">Query</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-text-muted">Clicks</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-text-muted">Impressions</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-text-muted">CTR</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-text-muted">Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gsc.queries.map((q, i) => (
                          <tr key={i} className="border-b border-border-light last:border-0 hover:bg-warm-white/50">
                            <td className="px-4 py-2.5 text-text-dark font-medium">{q.keys[0]}</td>
                            <td className="px-4 py-2.5 text-right text-green-600 font-medium">{q.clicks}</td>
                            <td className="px-4 py-2.5 text-right text-blue-600">{formatNum(q.impressions)}</td>
                            <td className="px-4 py-2.5 text-right text-text-muted">{(q.ctr * 100).toFixed(1)}%</td>
                            <td className="px-4 py-2.5 text-right text-text-muted">{q.position.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Pages */}
              {gsc.pages && gsc.pages.length > 0 && (
                <div className="bg-white rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-warm-white">
                    <h3 className="text-sm font-medium text-text-muted">Top Pages</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-light">
                          <th className="text-left px-4 py-2 text-xs font-medium text-text-muted">Page</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-text-muted">Clicks</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-text-muted">Impressions</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-text-muted">CTR</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-text-muted">Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gsc.pages.map((p, i) => {
                          const path = p.keys[0]?.replace('https://aestheticloungeofficial.com', '') || '/';
                          return (
                            <tr key={i} className="border-b border-border-light last:border-0 hover:bg-warm-white/50">
                              <td className="px-4 py-2.5 text-gold font-mono text-xs">{path || '/'}</td>
                              <td className="px-4 py-2.5 text-right text-green-600 font-medium">{p.clicks}</td>
                              <td className="px-4 py-2.5 text-right text-blue-600">{formatNum(p.impressions)}</td>
                              <td className="px-4 py-2.5 text-right text-text-muted">{(p.ctr * 100).toFixed(1)}%</td>
                              <td className="px-4 py-2.5 text-right text-text-muted">{p.position.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sitemaps */}
              {gsc.sitemaps && gsc.sitemaps.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-6">
                  <h3 className="text-sm font-medium text-text-muted mb-4">Submitted Sitemaps</h3>
                  {gsc.sitemaps.map((sm, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                      <div>
                        <p className="text-sm font-mono text-text-dark">{sm.path}</p>
                        <p className="text-[10px] text-text-muted">Last submitted: {sm.lastSubmitted}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {sm.errors > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">{sm.errors} errors</span>
                        )}
                        {sm.warnings > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">{sm.warnings} warnings</span>
                        )}
                        {sm.errors === 0 && sm.warnings === 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">Healthy</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* No data yet but configured */}
          {gsc?.configured && !gsc.performance && !gsc.error && !gscLoading && (
            <div className="bg-white rounded-xl border border-border p-8 text-center">
              <p className="text-sm text-text-muted">
                Search Console is connected but no data available yet. Data typically takes 2-3 days to appear.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

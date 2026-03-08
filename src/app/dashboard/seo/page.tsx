'use client';

import { useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface PageAudit {
  url: string;
  title: string;
  description: string;
  titleLength: number;
  descLength: number;
  status: 'good' | 'warning' | 'missing';
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

// ─── Component ──────────────────────────────────────────────────────────────
export default function SEODashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [schemas, setSchemas] = useState(SCHEMA_TYPES);

  const healthScore = Math.round(
    (HEALTH_CHECKS.filter((c) => c.passed).length / HEALTH_CHECKS.length) * 100,
  );

  function toggleSchema(index: number) {
    setSchemas((prev) =>
      prev.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s)),
    );
  }

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

          {/* Indexing Placeholder */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="text-sm font-medium text-text-muted mb-2">Indexing Status</h3>
            <p className="text-xs text-text-muted">
              Connect Google Search Console to see which pages are indexed.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {['Indexed Pages', 'Crawl Errors', 'Sitemaps'].map((label) => (
                <div key={label} className="bg-warm-white rounded-lg p-4 text-center">
                  <p className="text-2xl font-semibold text-text-muted">--</p>
                  <p className="text-xs text-text-muted mt-1">{label}</p>
                </div>
              ))}
            </div>
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
          {/* Setup card */}
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warm-white mb-4">
              <span className="text-3xl">&#128270;</span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-dark mb-2">
              Connect Google Search Console
            </h3>
            <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
              Link your Google Search Console account to see real search performance data
              including impressions, clicks, CTR, and keyword rankings.
            </p>
            <div className="bg-warm-white rounded-lg p-4 max-w-lg mx-auto text-left text-sm text-text-muted space-y-2">
              <p className="font-medium text-text-dark">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Go to Google Search Console and add your property</li>
                <li>Verify ownership via DNS TXT record or HTML file upload</li>
                <li>Submit your sitemap: aestheticloungeofficial.com/sitemap.xml</li>
                <li>Enable the Search Console API in Google Cloud Console</li>
                <li>Add your API credentials to the dashboard settings</li>
              </ol>
            </div>
          </div>

          {/* Placeholder metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Impressions', value: '--', icon: '&#128065;' },
              { label: 'Total Clicks', value: '--', icon: '&#128073;' },
              { label: 'Average CTR', value: '--%', icon: '&#128200;' },
              { label: 'Average Position', value: '--', icon: '&#127941;' },
            ].map((metric) => (
              <div key={metric.label} className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-lg"
                    dangerouslySetInnerHTML={{ __html: metric.icon }}
                  />
                  <span className="text-xs text-text-muted">{metric.label}</span>
                </div>
                <p className="text-2xl font-semibold text-text-muted">{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Placeholder chart */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4">
              Search Performance (Last 28 Days)
            </h3>
            <div className="h-48 bg-warm-white rounded-lg flex items-center justify-center">
              <p className="text-sm text-text-muted">
                Connect Search Console to see performance chart
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

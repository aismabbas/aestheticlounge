'use client';

import Link from 'next/link';

const STUDIO_CARDS = [
  {
    icon: '🎬',
    title: 'Reels',
    description: 'AI-generated short videos for Instagram and TikTok',
    href: '/dashboard/marketing/reels',
    status: 'coming_soon' as const,
    count: 0,
  },
  {
    icon: '🖼',
    title: 'Carousels',
    description: 'Multi-slide Instagram posts with branded templates',
    href: '/dashboard/marketing/carousels',
    status: 'coming_soon' as const,
    count: 0,
  },
  {
    icon: '📹',
    title: 'Video Ads',
    description: 'Longer format video content for paid campaigns',
    href: '/dashboard/marketing/videos',
    status: 'coming_soon' as const,
    count: 0,
  },
  {
    icon: '◈',
    title: 'Ad Campaigns',
    description: 'Manage active and scheduled ad campaigns',
    href: '/dashboard/ads',
    status: 'active' as const,
    count: null,
  },
  {
    icon: '📅',
    title: 'Content Calendar',
    description: 'View and manage upcoming scheduled posts',
    href: '/dashboard/marketing/calendar',
    status: 'coming_soon' as const,
    count: 0,
  },
  {
    icon: '&#9998;',
    title: 'Blog',
    description: 'Write and manage blog posts for SEO and engagement',
    href: '/dashboard/marketing/blog',
    status: 'active' as const,
    count: null,
  },
  {
    icon: '✦',
    title: 'Brand Assets',
    description: 'Logos, color palettes, fonts, and templates',
    href: '#',
    status: 'coming_soon' as const,
    count: null,
  },
];

const statusBadge = {
  active: 'bg-green-100 text-green-700',
  coming_soon: 'bg-amber-100 text-amber-700',
};

const statusLabel = {
  active: 'Active',
  coming_soon: 'Coming Soon',
};

export default function MarketingStudioPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Marketing Studio</h1>
          <p className="text-sm text-text-muted mt-1">Create, manage, and schedule marketing content</p>
        </div>
        <button
          disabled
          className="px-5 py-2.5 bg-gold/40 text-white text-sm font-medium rounded-lg cursor-not-allowed"
        >
          Connect Pipeline
        </button>
      </div>

      {/* Pipeline status banner */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6 flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50 text-amber-600 text-xl">
          ⚡
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-dark">Pipeline not connected</p>
          <p className="text-xs text-text-muted mt-0.5">
            Connect your n8n marketing pipeline to enable AI-powered content creation and scheduling.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
          Setup Required
        </span>
      </div>

      {/* Studio cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {STUDIO_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group bg-white rounded-xl border border-border hover:border-gold/30 p-6 transition-all hover:shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warm-white text-2xl group-hover:bg-gold-pale transition-colors">
                {card.icon}
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${statusBadge[card.status]}`}
              >
                {statusLabel[card.status]}
              </span>
            </div>

            <h3 className="text-sm font-semibold text-text-dark mb-1">{card.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{card.description}</p>

            {card.count !== null && (
              <div className="mt-4 pt-3 border-t border-border-light flex items-center justify-between">
                <span className="text-xs text-text-muted">Items</span>
                <span className="text-sm font-medium text-text-dark">{card.count}</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

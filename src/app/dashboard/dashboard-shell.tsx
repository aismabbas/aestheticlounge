'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { StaffSession } from '@/lib/auth';
import { hasAnyPermission, NAV_PERMISSIONS, ROLE_LABELS, type Role } from '@/lib/rbac';

const MARKETING_SUB_ITEMS = [
  { label: 'Studio',     href: '/dashboard/marketing' },
  { label: 'Videos',     href: '/dashboard/marketing/videos' },
  { label: 'Models',     href: '/dashboard/marketing/models' },
  { label: 'Calendar',   href: '/dashboard/marketing/calendar' },
  { label: 'Blog',       href: '/dashboard/marketing/blog' },
  { label: 'Lead Forms', href: '/dashboard/marketing/forms' },
  { label: 'Landing Pages', href: '/dashboard/marketing/landing-pages' },
  { label: 'How It Works', href: '/dashboard/marketing/how-it-works' },
];

const AI_INSIGHTS_SUB_ITEMS = [
  { label: 'Sentiment Analysis', href: '/dashboard/analytics/sentiment' },
  { label: 'Agent Quality',      href: '/dashboard/analytics/agent-quality' },
];

const NAV_ITEMS = [
  { label: 'Overview',       href: '/dashboard',               icon: '▦' },
  { label: 'Leads',          href: '/dashboard/leads',         icon: '◎' },
  { label: 'Clients',        href: '/dashboard/clients',       icon: '♟' },
  { label: 'Appointments',   href: '/dashboard/appointments',  icon: '▷' },
  { label: 'Payments',       href: '/dashboard/payments',      icon: '◉' },
  { label: 'Ads',            href: '/dashboard/ads',           icon: '◈' },
  { label: 'Content',        href: '/dashboard/content',       icon: '▤' },
  { label: 'Marketing',      href: '/dashboard/marketing',     icon: '◆' },
  { label: 'Inbox',           href: '/dashboard/conversations', icon: '◫' },
  { label: 'Services',       href: '/dashboard/services',      icon: '✦' },
  { label: 'Google Business', href: '/dashboard/google',       icon: 'G' },
  { label: 'SEO',            href: '/dashboard/seo',           icon: '◉' },
  { label: 'Analytics',      href: '/dashboard/analytics',     icon: '▥' },
  { label: 'AI Insights',   href: '/dashboard/analytics/sentiment', icon: '✦' },
  { label: 'Event Tracking', href: '/dashboard/events',        icon: '⇄' },
  { label: 'Performance',   href: '/dashboard/performance',   icon: '⏱' },
  { label: 'Feedback',       href: '/dashboard/feedback',      icon: '☆' },
  { label: 'Settings',       href: '/dashboard/settings',      icon: '⚙' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  // AI Insights sub-pages should not activate the Analytics parent
  if (href === '/dashboard/analytics' && (pathname.startsWith('/dashboard/analytics/sentiment') || pathname.startsWith('/dashboard/analytics/agent-quality'))) {
    return false;
  }
  return pathname.startsWith(href);
}

export function DashboardShell({
  session,
  children,
}: {
  session: StaffSession;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(
    pathname.startsWith('/dashboard/marketing')
  );
  const [aiInsightsOpen, setAiInsightsOpen] = useState(
    pathname.startsWith('/dashboard/analytics/sentiment') || pathname.startsWith('/dashboard/analytics/agent-quality')
  );

  async function handleLogout() {
    await signOut({ callbackUrl: '/dashboard/login' });
  }

  const isMarketingActive = pathname.startsWith('/dashboard/marketing');
  const isAiInsightsActive = pathname.startsWith('/dashboard/analytics/sentiment') || pathname.startsWith('/dashboard/analytics/agent-quality');

  // RBAC: filter nav items based on role
  const role = session.role as Role;
  const canSee = (href: string) => {
    const perms = NAV_PERMISSIONS[href];
    if (!perms) return true; // No restriction defined = visible
    return hasAnyPermission(role, perms);
  };
  const visibleNavItems = NAV_ITEMS.filter((item) => canSee(item.href));
  const visibleMarketingSubs = MARKETING_SUB_ITEMS.filter((item) => canSee(item.href));
  const visibleAiInsightsSubs = AI_INSIGHTS_SUB_ITEMS.filter((item) => canSee(item.href));
  const showMarketing = hasAnyPermission(role, ['marketing:view']);
  const showAiInsights = hasAnyPermission(role, ['analytics:sentiment', 'analytics:agent_quality']);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col
          w-64 bg-[#1A1A1A] text-white
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <Image src="/logo-icon.png" alt="AL" width={36} height={36} className="h-9 w-9" />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">Aesthetic Lounge</p>
            <p className="text-[11px] text-white/40">Staff Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const active = isActive(pathname, item.href);

            // AI Insights item with collapsible sub-menu
            if (item.label === 'AI Insights' && showAiInsights) {
              return (
                <div key={`${item.href}-ai`}>
                  <button
                    onClick={() => setAiInsightsOpen(!aiInsightsOpen)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                      ${isAiInsightsActive
                        ? 'bg-gold/15 text-gold font-medium'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <span className="w-5 text-center text-base">{item.icon}</span>
                    <span>{item.label}</span>
                    <span
                      className={`ml-auto text-[10px] transition-transform duration-200 ${
                        aiInsightsOpen ? 'rotate-90' : ''
                      }`}
                    >
                      ▶
                    </span>
                  </button>

                  {/* Sub-menu */}
                  {aiInsightsOpen && (
                    <div className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {visibleAiInsightsSubs.map((sub) => {
                        const subActive = pathname.startsWith(sub.href);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              block px-3 py-2 rounded-md text-xs transition-colors
                              ${subActive
                                ? 'text-gold font-medium'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                              }
                            `}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // AI Insights without permission — skip (already filtered but handle label match)
            if (item.label === 'AI Insights' && !showAiInsights) {
              return null;
            }

            // Marketing item with collapsible sub-menu
            if (item.label === 'Marketing' && showMarketing) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => setMarketingOpen(!marketingOpen)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                      ${isMarketingActive
                        ? 'bg-gold/15 text-gold font-medium'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <span className="w-5 text-center text-base">{item.icon}</span>
                    <span>{item.label}</span>
                    <span
                      className={`ml-auto text-[10px] transition-transform duration-200 ${
                        marketingOpen ? 'rotate-90' : ''
                      }`}
                    >
                      ▶
                    </span>
                  </button>

                  {/* Sub-menu */}
                  {marketingOpen && (
                    <div className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {visibleMarketingSubs.map((sub) => {
                        const subActive =
                          sub.href === '/dashboard/marketing'
                            ? pathname === '/dashboard/marketing'
                            : pathname.startsWith(sub.href);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              block px-3 py-2 rounded-md text-xs transition-colors
                              ${subActive
                                ? 'text-gold font-medium'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                              }
                            `}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${active
                    ? 'bg-gold/15 text-gold font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span className="w-5 text-center text-base">{item.icon}</span>
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* iPad Kiosk */}
        <div className="px-3 pb-2">
          <a
            href="/intake/new?mode=ipad"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="w-5 text-center text-base">&#9783;</span>
            <span>iPad Kiosk</span>
          </a>
        </div>

        {/* User info + logout */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/20 text-gold text-xs font-bold">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{session.name}</p>
              <p className="text-[11px] text-white/40">{ROLE_LABELS[role] || session.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-white/40 hover:text-white transition-colors text-lg"
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border-light bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text-dark p-1"
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Image src="/logo-icon.png" alt="AL" width={32} height={32} className="h-8 w-8" />
          <div className="w-8" /> {/* spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-warm-white p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

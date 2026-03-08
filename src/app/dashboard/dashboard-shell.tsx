'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { StaffSession } from '@/lib/auth';

const MARKETING_SUB_ITEMS = [
  { label: 'Studio',     href: '/dashboard/marketing' },
  { label: 'Reels',      href: '/dashboard/marketing/reels' },
  { label: 'Carousels',  href: '/dashboard/marketing/carousels' },
  { label: 'Videos',     href: '/dashboard/marketing/videos' },
  { label: 'Calendar',   href: '/dashboard/marketing/calendar' },
  { label: 'Blog',       href: '/dashboard/marketing/blog' },
  { label: 'Lead Forms', href: '/dashboard/marketing/forms' },
  { label: 'Landing Pages', href: '/dashboard/marketing/landing-pages' },
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
  { label: 'Conversations',  href: '/dashboard/conversations', icon: '◫' },
  { label: 'Services',       href: '/dashboard/services',      icon: '✦' },
  { label: 'Google Business', href: '/dashboard/google',       icon: 'G' },
  { label: 'SEO',            href: '/dashboard/seo',           icon: '◉' },
  { label: 'Analytics',      href: '/dashboard/analytics',     icon: '▥' },
  { label: 'Performance',   href: '/dashboard/performance',   icon: '⏱' },
  { label: 'Feedback',       href: '/dashboard/feedback',      icon: '☆' },
  { label: 'Settings',       href: '/dashboard/settings',      icon: '⚙' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
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
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(
    pathname.startsWith('/dashboard/marketing')
  );

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/dashboard/login');
  }

  const isMarketingActive = pathname.startsWith('/dashboard/marketing');

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
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gold/20">
            <span className="text-gold font-serif text-lg font-bold">AL</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">Aesthetic Lounge</p>
            <p className="text-[11px] text-white/40">Staff Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);

            // Marketing item with collapsible sub-menu
            if (item.label === 'Marketing') {
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
                      {MARKETING_SUB_ITEMS.map((sub) => {
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
              <p className="text-[11px] text-white/40 capitalize">{session.role}</p>
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
          <span className="text-gold font-serif text-lg font-bold">AL</span>
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

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  status: string;
  treatment: string;
  budget_daily: number;
  budget_spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  booked: number;
  revenue: number;
  cpl: number;
  cpa: number;
  roas: number;
  headline: string;
  caption: string;
  creative_url: string;
  creative_type: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  draft: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-700',
  pending_approval: 'bg-purple-100 text-purple-700',
};

function formatCurrency(val: number, prefix = 'CAD'): string {
  if (!val || val === 0) return '-';
  return `${prefix} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/campaigns')
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data.campaigns || data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-48" />
          <div className="h-96 bg-border-light rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-text-dark">Ad Campaigns</h1>
        <Link
          href="/dashboard/ads/create"
          className="px-5 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
        >
          + Create Campaign
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-warm-white">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Campaign</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Treatment</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Spend</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Leads</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Booked</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">CPL</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">CPA</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border-light hover:bg-warm-white transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-dark">{c.name}</p>
                    {c.headline && <p className="text-xs text-text-muted mt-0.5 truncate max-w-xs">{c.headline}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-light">{c.treatment}</td>
                  <td className="px-4 py-3 text-sm text-text-dark text-right">{formatCurrency(c.budget_spent)}</td>
                  <td className="px-4 py-3 text-sm text-text-dark text-right font-medium">{c.leads || '-'}</td>
                  <td className="px-4 py-3 text-sm text-text-dark text-right font-medium">{c.booked || '-'}</td>
                  <td className="px-4 py-3 text-sm text-text-dark text-right">{formatCurrency(c.cpl)}</td>
                  <td className="px-4 py-3 text-sm text-text-dark text-right">{formatCurrency(c.cpa)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${c.roas >= 3 ? 'text-green-600' : c.roas >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                      {c.roas > 0 ? `${c.roas.toFixed(1)}x` : '-'}
                    </span>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-text-muted">
                    No campaigns yet. Create your first campaign to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

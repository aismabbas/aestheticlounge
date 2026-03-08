'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GBPSummary {
  configured: boolean;
  reviews?: { total: number; average: number };
  insights?: { searchViews: number };
}

interface AnalyticsData {
  revenue: {
    total: number;
    byTreatment: { treatment: string; revenue: number; count: number }[];
  };
  leads: {
    total: number;
    bySource: { source: string; count: number }[];
    byStage: { stage: string; count: number }[];
  };
  appointments: {
    total: number;
    completed: number;
    noShow: number;
    cancelled: number;
  };
  campaigns: {
    totalSpend: number;
    avgCPL: number;
    avgCPA: number;
    roas: number;
    top: { name: string; treatment: string; status: string; budget_spent: number; leads: number; booked: number; cpl: number; cpa: number; roas: number }[];
  };
}

type Period = 'week' | 'month' | 'all';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [gbp, setGbp] = useState<GBPSummary | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/analytics?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [period]);

  useEffect(() => {
    fetch('/api/dashboard/google?type=overview')
      .then((r) => r.json())
      .then((d) => setGbp(d))
      .catch(() => setGbp({ configured: false }));
  }, []);

  if (loading || !data) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-48" />
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-border-light rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-border-light rounded-xl" />
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Revenue', value: `PKR ${data.revenue.total.toLocaleString()}`, sub: 'This month' },
    { label: 'Total Leads', value: data.leads.total.toString(), sub: 'This month' },
    { label: 'Bookings', value: data.appointments.total.toString(), sub: `${data.appointments.completed} completed` },
    { label: 'Avg CPL', value: `CAD $${data.campaigns.avgCPL.toFixed(2)}`, sub: 'Active campaigns' },
    { label: 'ROAS', value: `${data.campaigns.roas.toFixed(1)}x`, sub: 'Active campaigns', highlight: data.campaigns.roas >= 3 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-text-dark">Analytics</h1>
        <div className="flex bg-white rounded-lg border border-border overflow-hidden">
          {(['week', 'month', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm capitalize transition-colors ${
                period === p ? 'bg-gold text-white' : 'text-text-light hover:bg-warm-white'
              }`}
            >
              {p === 'all' ? 'All Time' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">{card.label}</p>
            <p className={`text-2xl font-semibold mt-2 ${card.highlight ? 'text-green-600' : 'text-text-dark'}`}>
              {card.value}
            </p>
            <p className="text-xs text-text-muted mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Google Business Profile card */}
      {gbp?.configured && (
        <div className="mb-8">
          <Link href="/dashboard/google" className="block bg-white rounded-xl border border-border p-5 hover:border-gold transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
                  <span className="text-xl font-bold text-blue-600">G</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-dark">Google Business Profile</p>
                  <p className="text-xs text-text-muted mt-0.5">Manage your listing, reviews, and insights</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {gbp.reviews && (
                  <>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-text-dark">{gbp.reviews.average?.toFixed(1) || '-'}</p>
                      <p className="text-[10px] uppercase text-text-muted font-semibold tracking-wider">Rating</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-text-dark">{gbp.reviews.total}</p>
                      <p className="text-[10px] uppercase text-text-muted font-semibold tracking-wider">Reviews</p>
                    </div>
                  </>
                )}
                {gbp.insights && (
                  <div className="text-right">
                    <p className="text-lg font-semibold text-text-dark">{gbp.insights.searchViews.toLocaleString()}</p>
                    <p className="text-[10px] uppercase text-text-muted font-semibold tracking-wider">Search Views</p>
                  </div>
                )}
                <span className="text-text-muted text-lg">&rarr;</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Revenue by Treatment */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Revenue by Treatment</h2>
          {data.revenue.byTreatment.length === 0 ? (
            <p className="text-sm text-text-muted">No revenue data yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-semibold uppercase text-text-muted">Treatment</th>
                  <th className="text-right py-2 text-xs font-semibold uppercase text-text-muted">Count</th>
                  <th className="text-right py-2 text-xs font-semibold uppercase text-text-muted">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.revenue.byTreatment.map((row) => (
                  <tr key={row.treatment} className="border-b border-border-light">
                    <td className="py-2.5 text-sm text-text-dark">{row.treatment}</td>
                    <td className="py-2.5 text-sm text-text-light text-right">{row.count}</td>
                    <td className="py-2.5 text-sm font-medium text-text-dark text-right">
                      PKR {row.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Lead Source Breakdown */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Lead Sources</h2>
          {data.leads.bySource.length === 0 ? (
            <p className="text-sm text-text-muted">No source data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.leads.bySource.map((row) => {
                const maxCount = Math.max(...data.leads.bySource.map((s) => s.count));
                const pct = maxCount > 0 ? (row.count / maxCount) * 100 : 0;
                return (
                  <div key={row.source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-dark capitalize">{row.source}</span>
                      <span className="text-sm font-medium text-text-dark">{row.count}</span>
                    </div>
                    <div className="w-full bg-border-light rounded-full h-2">
                      <div
                        className="bg-gold rounded-full h-2 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Appointment Stats */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Appointment Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-warm-white rounded-lg p-4 text-center">
              <p className="text-2xl font-semibold text-text-dark">{data.appointments.total}</p>
              <p className="text-xs text-text-muted mt-1">Total</p>
            </div>
            <div className="bg-warm-white rounded-lg p-4 text-center">
              <p className="text-2xl font-semibold text-green-600">{data.appointments.completed}</p>
              <p className="text-xs text-text-muted mt-1">Completed</p>
            </div>
            <div className="bg-warm-white rounded-lg p-4 text-center">
              <p className="text-2xl font-semibold text-red-600">{data.appointments.noShow}</p>
              <p className="text-xs text-text-muted mt-1">No Show</p>
            </div>
            <div className="bg-warm-white rounded-lg p-4 text-center">
              <p className="text-2xl font-semibold text-gray-400">{data.appointments.cancelled}</p>
              <p className="text-xs text-text-muted mt-1">Cancelled</p>
            </div>
          </div>
          {data.appointments.total > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-text-muted">
                Show rate: {((1 - (data.appointments.noShow / data.appointments.total)) * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Campaign Performance</h2>
          {data.campaigns.top.length === 0 ? (
            <p className="text-sm text-text-muted">No campaign data yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-semibold uppercase text-text-muted">Campaign</th>
                  <th className="text-right py-2 text-xs font-semibold uppercase text-text-muted">Spend</th>
                  <th className="text-right py-2 text-xs font-semibold uppercase text-text-muted">Leads</th>
                  <th className="text-right py-2 text-xs font-semibold uppercase text-text-muted">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.top.map((row, i) => (
                  <tr key={i} className="border-b border-border-light">
                    <td className="py-2.5">
                      <p className="text-sm text-text-dark truncate max-w-[150px]">{row.name}</p>
                    </td>
                    <td className="py-2.5 text-sm text-text-light text-right">
                      ${Number(row.budget_spent).toFixed(0)}
                    </td>
                    <td className="py-2.5 text-sm text-text-dark text-right font-medium">{row.leads}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-sm font-medium ${Number(row.roas) >= 3 ? 'text-green-600' : Number(row.roas) >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                        {Number(row.roas) > 0 ? `${Number(row.roas).toFixed(1)}x` : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-4 pt-3 border-t border-border-light text-xs text-text-muted">
            Total ad spend: CAD ${data.campaigns.totalSpend.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

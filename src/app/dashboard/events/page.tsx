'use client';

import { useState, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Integration {
  name: string;
  status: boolean;
  id?: string;
  propertyId?: string;
  events?: string[];
  params?: string[];
  categories?: string[];
  type: string;
  destination: string;
  dedup?: boolean;
  needed?: string;
}

interface InboxChannel {
  name: string;
  status: boolean;
  appReview: boolean;
  needed?: string;
}

interface ClosedLoopStep {
  step: number;
  name: string;
  source: string;
  captures?: string;
  fires?: string[];
  stored?: string;
  result?: string;
}

interface FunnelCounters {
  ad_clicks: { total: number; meta: number; google: number; instant_form: number };
  page_visits: { total: number };
  lead_forms: { total: number; instant_form: number; website: number; meta: number; google: number };
  bookings: { total: number; confirmed: number; completed: number; total_value: number };
  payments: { total: number; completed: number; total_revenue: number };
  capi_events: { leads: number; schedules: number; purchases: number };
  source_breakdown: Array<{ source: string; count: number }>;
  instant_forms: { total: number; contacted: number; booked: number };
}

interface EventsData {
  integrations: Record<string, Integration>;
  inboxChannels: Record<string, InboxChannel>;
  closedLoop: ClosedLoopStep[];
  dbStats: { leads: number; behavior_events: number; inbox_messages: number; payments: number };
  funnelCounters: FunnelCounters;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtNum(n: number): string {
  return n.toLocaleString();
}

function fmtPKR(n: number): string {
  return `PKR ${n.toLocaleString()}`;
}

function convRate(num: number, denom: number): string {
  if (denom === 0) return '0%';
  return `${((num / denom) * 100).toFixed(1)}%`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function EventsDashboard() {
  const [data, setData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/events')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-border-light rounded w-64" />
        <div className="h-96 bg-border-light rounded-xl" />
      </div>
    );
  }

  const integrations = Object.values(data.integrations);
  const activeCount = integrations.filter((i) => i.status).length;
  const fc = data.funnelCounters;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Event Tracking & Data Flow</h1>
          <p className="text-sm text-text-muted mt-1">
            Closed-loop marketing system — {activeCount}/{integrations.length} integrations active
          </p>
        </div>
      </div>

      {/* ── Funnel Counters (Hero) ──────────────────────────────── */}
      <div className="grid grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Ad Clicks', value: fc.ad_clicks.total, sub: `Meta ${fc.ad_clicks.meta} · Google ${fc.ad_clicks.google}`, color: 'border-blue-300 bg-blue-50', icon: '1' },
          { label: 'Page Visits', value: fc.page_visits.total, sub: 'Tracked page_views', color: 'border-purple-300 bg-purple-50', icon: '2' },
          { label: 'Lead Forms', value: fc.lead_forms.total, sub: `Instant ${fc.lead_forms.instant_form} · Web ${fc.lead_forms.website}`, color: 'border-amber-300 bg-amber-50', icon: '3' },
          { label: 'Bookings', value: fc.bookings.total, sub: `${fc.bookings.confirmed} confirmed · ${fmtPKR(fc.bookings.total_value)}`, color: 'border-green-300 bg-green-50', icon: '4' },
          { label: 'Payments', value: fc.payments.completed, sub: fmtPKR(fc.payments.total_revenue), color: 'border-emerald-300 bg-emerald-50', icon: '5' },
          { label: 'CAPI Sent', value: fc.capi_events.leads + fc.capi_events.schedules + fc.capi_events.purchases, sub: `L${fc.capi_events.leads} S${fc.capi_events.schedules} P${fc.capi_events.purchases}`, color: 'border-gold bg-gold-pale', icon: '6' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border-2 ${s.color} p-4 relative`}>
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold text-white text-[10px] font-bold flex items-center justify-center">
              {s.icon}
            </div>
            <p className="text-[10px] font-semibold uppercase text-text-muted tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1 text-text-dark">{fmtNum(s.value)}</p>
            <p className="text-[10px] text-text-muted mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Funnel Conversion Rates ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border p-6 mb-8">
        <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Funnel Conversion Rates</h2>
        <div className="flex items-center gap-0">
          {[
            { from: 'Ad Click', to: 'Page Visit', rate: convRate(fc.page_visits.total, fc.ad_clicks.total || fc.page_visits.total), fromVal: fc.ad_clicks.total, toVal: fc.page_visits.total },
            { from: 'Page Visit', to: 'Lead', rate: convRate(fc.lead_forms.total, fc.page_visits.total), fromVal: fc.page_visits.total, toVal: fc.lead_forms.total },
            { from: 'Lead', to: 'Booking', rate: convRate(fc.bookings.total, fc.lead_forms.total), fromVal: fc.lead_forms.total, toVal: fc.bookings.total },
            { from: 'Booking', to: 'Payment', rate: convRate(fc.payments.completed, fc.bookings.total), fromVal: fc.bookings.total, toVal: fc.payments.completed },
          ].map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-text-dark">{fmtNum(s.fromVal)}</p>
                <p className="text-[10px] text-text-muted">{s.from}</p>
              </div>
              <div className="flex flex-col items-center px-2">
                <span className="text-xs font-bold text-gold">{s.rate}</span>
                <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="text-border">
                  <path d="M0 6H20M20 6L15 1M20 6L15 11" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              {i === 3 && (
                <div className="flex-1 text-center">
                  <p className="text-lg font-bold text-green-700">{fmtNum(s.toVal)}</p>
                  <p className="text-[10px] text-text-muted">{s.to}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Source Breakdown: Meta vs Google vs Instant Forms ──── */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Meta Ads */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-sm font-bold text-[#1877F2]">f</div>
            <h3 className="text-sm font-semibold text-text-dark">Meta Ads</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Ad Clicks</span>
              <span className="text-sm font-bold text-text-dark">{fmtNum(fc.ad_clicks.meta)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Leads (UTM)</span>
              <span className="text-sm font-bold text-text-dark">{fmtNum(fc.lead_forms.meta)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Instant Forms</span>
              <span className="text-sm font-bold text-text-dark">{fmtNum(fc.lead_forms.instant_form)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Click → Lead</span>
              <span className="text-sm font-bold text-gold">{convRate(fc.lead_forms.meta + fc.lead_forms.instant_form, fc.ad_clicks.meta || 1)}</span>
            </div>
            <div className="pt-2 border-t border-border-light">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">CAPI Leads Sent</span>
                <span className="text-sm font-bold text-green-700">{fmtNum(fc.capi_events.leads)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-text-muted">CAPI Schedules</span>
                <span className="text-sm font-bold text-green-700">{fmtNum(fc.capi_events.schedules)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-text-muted">CAPI Purchases</span>
                <span className="text-sm font-bold text-green-700">{fmtNum(fc.capi_events.purchases)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Google Ads */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#4285F4]/10 flex items-center justify-center text-sm font-bold text-[#4285F4]">G</div>
            <h3 className="text-sm font-semibold text-text-dark">Google Ads</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Ad Clicks</span>
              <span className="text-sm font-bold text-text-dark">{fmtNum(fc.ad_clicks.google)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Leads (UTM)</span>
              <span className="text-sm font-bold text-text-dark">{fmtNum(fc.lead_forms.google)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Click → Lead</span>
              <span className="text-sm font-bold text-gold">{convRate(fc.lead_forms.google, fc.ad_clicks.google || 1)}</span>
            </div>
            <div className="pt-2 border-t border-border-light space-y-1">
              <p className="text-[10px] text-text-muted">GA4 Events Sent:</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Page Views</span>
                <span className="text-sm font-bold text-text-dark">{fmtNum(fc.page_visits.total)}</span>
              </div>
            </div>
            {!data.integrations.ga4_server?.status && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-[10px] text-amber-700 font-medium">GA4 Measurement Protocol not configured</p>
                <p className="text-[9px] text-amber-600">Set GA4_API_SECRET to enable server-side events</p>
              </div>
            )}
          </div>
        </div>

        {/* Instant Forms */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#E1306C]/10 flex items-center justify-center text-sm font-bold text-[#E1306C]">IF</div>
            <h3 className="text-sm font-semibold text-text-dark">Facebook Instant Forms</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Total Leads</span>
              <span className="text-sm font-bold text-text-dark">{fmtNum(fc.instant_forms.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Contacted</span>
              <span className="text-sm font-bold text-text-dark">{fmtNum(fc.instant_forms.contacted)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Booked</span>
              <span className="text-sm font-bold text-green-700">{fmtNum(fc.instant_forms.booked)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Lead → Booked</span>
              <span className="text-sm font-bold text-gold">{convRate(fc.instant_forms.booked, fc.instant_forms.total)}</span>
            </div>
            {/* Funnel bar */}
            {fc.instant_forms.total > 0 && (
              <div className="pt-2 border-t border-border-light">
                <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                  <div
                    className="bg-amber-400 transition-all"
                    style={{ width: `${(fc.instant_forms.contacted / fc.instant_forms.total) * 100}%` }}
                    title={`Contacted: ${fc.instant_forms.contacted}`}
                  />
                  <div
                    className="bg-green-500 transition-all"
                    style={{ width: `${(fc.instant_forms.booked / fc.instant_forms.total) * 100}%` }}
                    title={`Booked: ${fc.instant_forms.booked}`}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-text-muted">Contacted</span>
                  <span className="text-[9px] text-text-muted">Booked</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lead Source Breakdown ──────────────────────────────── */}
      {fc.source_breakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 mb-8">
          <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Lead Sources</h2>
          <div className="space-y-2">
            {fc.source_breakdown.map((s) => {
              const maxCount = fc.source_breakdown[0]?.count || 1;
              const pct = (s.count / maxCount) * 100;
              return (
                <div key={s.source} className="flex items-center gap-3">
                  <span className="text-xs text-text-dark w-28 truncate font-medium">{s.source}</span>
                  <div className="flex-1 h-5 bg-warm-white rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold/60 transition-all flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    >
                      <span className="text-[10px] font-bold text-gold-dark">{fmtNum(s.count)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Closed Loop Flow (with counters) ──────────────────── */}
      <div className="bg-white rounded-xl border border-border p-6 mb-8">
        <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Closed-Loop Flow</h2>
        <div className="space-y-0">
          {data.closedLoop.map((step, i) => {
            // Map step to counter
            const stepCounter = [
              fc.ad_clicks.total,
              fc.page_visits.total,
              fc.lead_forms.total,
              fc.bookings.total,
              fc.payments.completed,
              fc.capi_events.leads + fc.capi_events.schedules + fc.capi_events.purchases,
            ][i];

            return (
              <div key={step.step} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold text-white text-sm font-bold shrink-0">
                    {step.step}
                  </div>
                  {i < data.closedLoop.length - 1 && <div className="w-0.5 h-8 bg-border" />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-dark">{step.name}</p>
                      <p className="text-xs text-text-muted">{step.source}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-text-dark">{fmtNum(stepCounter || 0)}</p>
                      {i > 0 && i < 5 && (
                        <p className="text-[10px] text-gold font-medium">
                          {convRate(stepCounter || 0, [fc.ad_clicks.total, fc.page_visits.total, fc.lead_forms.total, fc.bookings.total, fc.payments.completed][i - 1] || 1)} from prev
                        </p>
                      )}
                    </div>
                  </div>
                  {step.captures && <p className="text-xs text-text-light mt-1">Captures: {step.captures}</p>}
                  {step.fires && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {step.fires.map((f) => (
                        <span key={f} className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  {step.stored && (
                    <p className="text-[10px] text-text-muted mt-1 font-mono">&rarr; {step.stored}</p>
                  )}
                  {step.result && (
                    <p className="text-xs text-green-600 font-medium mt-1">{step.result}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DB Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Leads', value: data.dbStats.leads, table: 'al_leads' },
          { label: 'Behavior Events', value: data.dbStats.behavior_events, table: 'al_behavior_events' },
          { label: 'Inbox Messages', value: data.dbStats.inbox_messages, table: 'al_inbox_messages' },
          { label: 'Payments', value: data.dbStats.payments, table: 'al_payments' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">{s.label}</p>
            <p className="text-2xl font-semibold mt-2 text-text-dark">{s.value.toLocaleString()}</p>
            <p className="text-[10px] text-text-muted mt-1 font-mono">{s.table}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Tracking Integrations */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Tracking Integrations</h2>
          <div className="space-y-3">
            {integrations.map((int) => (
              <div key={int.name} className="flex items-start justify-between p-3 rounded-lg bg-warm-white">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${int.status ? 'bg-green-500' : 'bg-red-400'}`} />
                    <p className="text-sm font-semibold text-text-dark">{int.name}</p>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5 ml-4">
                    {int.type} &rarr; {int.destination}
                  </p>
                  {int.id && <p className="text-[10px] font-mono text-text-muted ml-4">ID: {int.id}</p>}
                  {int.propertyId && <p className="text-[10px] font-mono text-text-muted ml-4">Property: {int.propertyId}</p>}
                  {int.events && (
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-4">
                      {int.events.map((e) => (
                        <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-border text-text-light">
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                  {int.params && (
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-4">
                      {int.params.map((p) => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-border text-text-light font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                  {int.dedup && <p className="text-[10px] text-green-600 ml-4 mt-1">Event deduplication enabled</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inbox Channels */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Inbox Channels</h2>
          <div className="space-y-3">
            {Object.entries(data.inboxChannels).map(([key, ch]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-warm-white">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${ch.status ? 'bg-green-500' : 'bg-red-400'}`} />
                  <div>
                    <p className="text-sm font-semibold text-text-dark">{ch.name}</p>
                    {!ch.status && ch.needed && (
                      <p className="text-[10px] text-red-500 mt-0.5">Needs: {ch.needed}</p>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded ${
                  ch.status ? 'bg-green-50 text-green-700' : ch.appReview ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                }`}>
                  {ch.status ? 'Active' : 'Pending'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs font-semibold text-blue-800">Meta App Review Required</p>
            <p className="text-[10px] text-blue-600 mt-1">
              Instagram DMs, Facebook Messenger, and Facebook Comments require Meta App Review approval.
              Submit via Meta Developer Dashboard &rarr; App Review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

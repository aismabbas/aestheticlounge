'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  stage: string;
  quality: string;
  interest: string;
  source: string;
  campaign_id: string;
  created_at: string;
  notes: string;
  booked_treatment: string;
  actual_revenue: number;
  score: number;
  computed_score: number;
  computed_label: 'hot' | 'warm' | 'cold';
  score_breakdown: Record<string, number>;
  score_factors: Record<string, number>;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  landing_page: string;
  pages_viewed: number;
  time_on_site: number;
  treatments_viewed: string[];
  form_submissions: number;
  whatsapp_messages: number;
  last_activity_at: string;
  conversion_value: number;
  converted_at: string;
}

interface Conversation {
  id: string;
  phone: string;
  direction: string;
  message_type: string;
  content: string;
  status: string;
  agent: string;
  created_at: string;
}

const STAGES = ['new', 'contacted', 'qualified', 'booked', 'visited', 'repeat', 'lost'] as const;

const stageBadgeColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-purple-100 text-purple-700',
  booked: 'bg-green-100 text-green-700',
  visited: 'bg-gold-pale text-gold-dark',
  repeat: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
};

const FACTOR_LABELS: Record<string, string> = {
  hasPhone: 'Has phone number',
  hasEmail: 'Has email address',
  respondedWhatsApp: 'Responded on WhatsApp',
  pagesViewed: 'Pages viewed',
  timeOnSiteMinutes: 'Time on site',
  viewedHighValueTreatment: 'Viewed high-value treatment',
  formSubmitted: 'Form submitted',
  responseSpeedUnder5Min: 'Fast response (<5 min)',
  referredByClient: 'Client referral',
  repeatVisitor: 'Repeat visitor',
};

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const percentage = score;
  const colorMap = {
    hot: { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
    warm: { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    cold: { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  };
  const colors = colorMap[label as keyof typeof colorMap] || colorMap.cold;
  const icon = label === 'hot' ? '\u{1F525}' : label === 'warm' ? '\u{2600}\u{FE0F}' : '\u{2744}\u{FE0F}';

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className={`text-lg font-bold ${colors.text}`}>{score}/100</p>
            <p className={`text-xs font-medium uppercase tracking-wider ${colors.text}`}>{label} lead</p>
          </div>
        </div>
        <div className={`w-16 h-16 rounded-full border-4 ${colors.border} flex items-center justify-center`}>
          <span className={`text-xl font-bold ${colors.text}`}>{score}</span>
        </div>
      </div>
      <div className="w-full bg-white rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full ${colors.bar} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-text-muted">
        <span>Cold (0)</span>
        <span>Warm (40)</span>
        <span>Hot (70)</span>
        <span>100</span>
      </div>
    </div>
  );
}

function ScoreBreakdown({ factors }: { factors: Record<string, number> }) {
  const entries = Object.entries(factors).sort(([, a], [, b]) => b - a);

  if (entries.length === 0) {
    return <p className="text-sm text-text-muted">No scoring data yet.</p>;
  }

  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => {
        const pct = total > 0 ? (value / 100) * 100 : 0;
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-text-dark">{FACTOR_LABELS[key] || key}</span>
              <span className="font-semibold text-text-dark">+{value}</span>
            </div>
            <div className="w-full bg-border-light rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConversionPath({ stage }: { stage: string }) {
  const steps = ['new', 'contacted', 'qualified', 'booked', 'visited'];
  const currentIndex = steps.indexOf(stage);
  const isLost = stage === 'lost';

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const isActive = !isLost && i <= currentIndex;
        const isCurrent = !isLost && step === stage;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className={`flex-1 flex flex-col items-center`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                isCurrent
                  ? 'bg-gold text-white ring-2 ring-gold/30'
                  : isActive
                    ? 'bg-gold/80 text-white'
                    : 'bg-border-light text-text-muted'
              }`}>
                {i + 1}
              </div>
              <span className={`text-[10px] mt-1 capitalize ${isCurrent ? 'font-semibold text-gold-dark' : 'text-text-muted'}`}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-full mx-0.5 mt-[-12px] ${isActive && i < currentIndex ? 'bg-gold' : 'bg-border-light'}`} />
            )}
          </div>
        );
      })}
      {isLost && (
        <div className="flex flex-col items-center ml-2">
          <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-bold">
            X
          </div>
          <span className="text-[10px] mt-1 text-red-600 font-semibold">Lost</span>
        </div>
      )}
    </div>
  );
}

function AttributionCard({ lead }: { lead: Lead }) {
  const hasUtm = lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_content;
  if (!hasUtm && !lead.landing_page) return null;

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Attribution</h2>
      <div className="grid grid-cols-2 gap-3">
        {lead.utm_source && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">Source</p>
            <p className="text-sm text-text-dark mt-0.5 font-medium">{lead.utm_source}</p>
          </div>
        )}
        {lead.utm_medium && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">Medium</p>
            <p className="text-sm text-text-dark mt-0.5">{lead.utm_medium}</p>
          </div>
        )}
        {lead.utm_campaign && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">Campaign</p>
            <p className="text-sm text-text-dark mt-0.5">{lead.utm_campaign}</p>
          </div>
        )}
        {lead.utm_content && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">Content</p>
            <p className="text-sm text-text-dark mt-0.5">{lead.utm_content}</p>
          </div>
        )}
        {lead.landing_page && (
          <div className="col-span-2">
            <p className="text-xs text-text-muted uppercase tracking-wider">Landing Page</p>
            <p className="text-sm text-text-dark mt-0.5 truncate">{lead.landing_page}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface BehaviorData {
  has_data: boolean;
  events: { event_type: string; page_url: string; page_title: string; created_at: string }[];
  sessions: {
    session_id: string;
    started_at: string;
    ended_at: string;
    page_count: number;
    pages: string[];
    duration_seconds: number;
    source: string;
  }[];
  top_pages: { url: string; title: string; views: number; is_treatment: boolean }[];
  cta_clicks: { type: string; text: string; page: string; timestamp: string }[];
  time_on_site_total: number;
  treatments_browsed: { url: string; title: string; views: number }[];
  avg_scroll_depth: number;
  section_engagement: { section: string; seconds: number }[];
  journey: {
    landing_page: string | null;
    pages_visited: number;
    cta_clicked: boolean;
    form_started: boolean;
    form_submitted: boolean;
  } | null;
  ga4: {
    sessions: { sessions: number; avgDurationSeconds: number; bounceRate: number } | null;
    traffic_source: { source: string; medium: string; campaign: string } | null;
  } | null;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

const EVENT_ICONS: Record<string, { icon: string; bg: string; text: string }> = {
  page_view: { icon: '\u{1F441}', bg: 'bg-blue-50', text: 'text-blue-600' },
  cta_click: { icon: '\u{1F446}', bg: 'bg-green-50', text: 'text-green-600' },
  scroll: { icon: '\u{2195}\u{FE0F}', bg: 'bg-purple-50', text: 'text-purple-600' },
  time_on_page: { icon: '\u{23F1}', bg: 'bg-amber-50', text: 'text-amber-600' },
  form_start: { icon: '\u{1F4DD}', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  form_submit: { icon: '\u{2705}', bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

function JourneyMap({ journey }: { journey: BehaviorData['journey'] }) {
  if (!journey) return null;

  const steps = [
    { label: 'Landing', done: !!journey.landing_page, detail: journey.landing_page || '' },
    { label: `${journey.pages_visited} Pages`, done: journey.pages_visited > 1, detail: '' },
    { label: 'CTA Click', done: journey.cta_clicked, detail: '' },
    { label: 'Form Start', done: journey.form_started, detail: '' },
    { label: 'Submitted', done: journey.form_submitted, detail: '' },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center min-w-[64px]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step.done ? 'bg-gold text-white' : 'bg-border-light text-text-muted'
            }`}>
              {step.done ? '\u2713' : i + 1}
            </div>
            <span className={`text-[10px] mt-1 text-center leading-tight ${step.done ? 'font-semibold text-gold-dark' : 'text-text-muted'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-6 mt-[-12px] ${step.done ? 'bg-gold' : 'bg-border-light'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function EngagementGauge({ depth, timeSeconds, pages }: { depth: number; timeSeconds: number; pages: number }) {
  // 0-100 engagement score based on scroll depth, time, and page count
  const depthScore = Math.min(depth, 100) * 0.3;
  const timeScore = Math.min(timeSeconds / 300, 1) * 40; // 5 min = max
  const pageScore = Math.min(pages / 5, 1) * 30; // 5 pages = max
  const engagementScore = Math.round(depthScore + timeScore + pageScore);
  const level = engagementScore >= 70 ? 'High' : engagementScore >= 40 ? 'Medium' : 'Low';
  const barColor = engagementScore >= 70 ? 'bg-green-500' : engagementScore >= 40 ? 'bg-amber-500' : 'bg-blue-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-muted">Engagement</span>
        <span className="text-sm font-semibold text-text-dark">{engagementScore}/100 ({level})</span>
      </div>
      <div className="w-full bg-border-light rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${engagementScore}%` }} />
      </div>
    </div>
  );
}

function BehaviorCard({ lead }: { lead: Lead }) {
  const [behaviorData, setBehaviorData] = useState<BehaviorData | null>(null);
  const [behaviorLoading, setBehaviorLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'timeline' | 'pages' | 'sessions'>('timeline');

  useEffect(() => {
    fetch(`/api/dashboard/leads/${lead.id}/behavior`)
      .then((r) => r.json())
      .then((data) => {
        setBehaviorData(data);
        setBehaviorLoading(false);
      })
      .catch(() => setBehaviorLoading(false));
  }, [lead.id]);

  const hasBasicData = lead.pages_viewed || lead.time_on_site || lead.form_submissions || lead.whatsapp_messages || (lead.treatments_viewed && lead.treatments_viewed.length > 0);

  const timeFormatted = lead.time_on_site
    ? formatDuration(lead.time_on_site)
    : '-';

  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-6">
      <h2 className="font-serif text-lg font-semibold text-text-dark">Behavioral Data</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-lg">
            &#x1F4C4;
          </div>
          <div>
            <p className="text-lg font-semibold text-text-dark">{lead.pages_viewed || 0}</p>
            <p className="text-xs text-text-muted">Pages Viewed</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 text-lg">
            &#x23F1;
          </div>
          <div>
            <p className="text-lg font-semibold text-text-dark">{timeFormatted}</p>
            <p className="text-xs text-text-muted">Time on Site</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 text-lg">
            &#x1F4DD;
          </div>
          <div>
            <p className="text-lg font-semibold text-text-dark">{lead.form_submissions || 0}</p>
            <p className="text-xs text-text-muted">Form Submissions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-lg">
            &#x1F4AC;
          </div>
          <div>
            <p className="text-lg font-semibold text-text-dark">{lead.whatsapp_messages || 0}</p>
            <p className="text-xs text-text-muted">WhatsApp Messages</p>
          </div>
        </div>
      </div>

      {/* Treatments viewed */}
      {lead.treatments_viewed && lead.treatments_viewed.length > 0 && (
        <div className="pt-4 border-t border-border-light">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Treatments Viewed</p>
          <div className="flex flex-wrap gap-1.5">
            {lead.treatments_viewed.map((t) => (
              <span key={t} className="px-2 py-0.5 bg-gold-pale text-gold-dark text-xs rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Engagement gauge + Journey map */}
      {behaviorData?.has_data && (
        <>
          <div className="pt-4 border-t border-border-light">
            <EngagementGauge
              depth={behaviorData.avg_scroll_depth}
              timeSeconds={behaviorData.time_on_site_total}
              pages={behaviorData.top_pages.length}
            />
          </div>

          {/* Journey Map */}
          {behaviorData.journey && (
            <div className="pt-4 border-t border-border-light">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Visitor Journey</p>
              <JourneyMap journey={behaviorData.journey} />
            </div>
          )}

          {/* Tab selector for detailed views */}
          <div className="pt-4 border-t border-border-light">
            <div className="flex gap-1 mb-4">
              {([
                { key: 'timeline' as const, label: 'Activity Timeline' },
                { key: 'pages' as const, label: 'Pages Visited' },
                { key: 'sessions' as const, label: 'Sessions' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    activeSection === tab.key
                      ? 'bg-gold text-white'
                      : 'bg-border-light text-text-muted hover:bg-gold-pale'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Activity Timeline */}
            {activeSection === 'timeline' && (
              <div className="max-h-72 overflow-y-auto space-y-1.5">
                {behaviorData.events.length === 0 ? (
                  <p className="text-sm text-text-muted">No activity recorded yet.</p>
                ) : (
                  behaviorData.events.map((event, i) => {
                    const cfg = EVENT_ICONS[event.event_type] || EVENT_ICONS.page_view;
                    return (
                      <div key={i} className="flex items-start gap-3 py-1.5">
                        <div className={`w-7 h-7 rounded-md ${cfg.bg} flex items-center justify-center text-sm shrink-0 mt-0.5`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-dark truncate">
                            {event.page_title || event.page_url}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Pages Visited */}
            {activeSection === 'pages' && (
              <div className="max-h-72 overflow-y-auto space-y-1">
                {behaviorData.top_pages.length === 0 ? (
                  <p className="text-sm text-text-muted">No pages recorded.</p>
                ) : (
                  behaviorData.top_pages.map((page, i) => (
                    <div key={i} className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${
                      page.is_treatment ? 'bg-gold-pale/50' : ''
                    }`}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {page.is_treatment && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gold-pale text-gold-dark rounded-full shrink-0">
                            Treatment
                          </span>
                        )}
                        <span className="text-sm text-text-dark truncate">{page.title || page.url}</span>
                      </div>
                      <span className="text-xs font-semibold text-text-muted ml-2 shrink-0">
                        {page.views}x
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sessions */}
            {activeSection === 'sessions' && (
              <div className="max-h-72 overflow-y-auto space-y-3">
                {behaviorData.sessions.length === 0 ? (
                  <p className="text-sm text-text-muted">No sessions recorded.</p>
                ) : (
                  behaviorData.sessions.map((session) => (
                    <div key={session.session_id} className="bg-warm-white rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-text-dark">
                          {new Date(session.started_at).toLocaleDateString()}{' '}
                          {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatDuration(session.duration_seconds)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span>{session.page_count} pages</span>
                        {session.source && (
                          <>
                            <span className="text-border">|</span>
                            <span className="truncate max-w-[150px]">from: {session.source}</span>
                          </>
                        )}
                      </div>
                      {session.pages.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {session.pages.slice(0, 5).map((p) => (
                            <span key={p} className="text-[10px] px-1.5 py-0.5 bg-white rounded text-text-muted truncate max-w-[120px]">
                              {p}
                            </span>
                          ))}
                          {session.pages.length > 5 && (
                            <span className="text-[10px] text-text-muted">+{session.pages.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* CTA Clicks */}
          {behaviorData.cta_clicks.length > 0 && (
            <div className="pt-4 border-t border-border-light">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">CTA Clicks</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {behaviorData.cta_clicks.map((cta, i) => (
                  <div key={i} className="flex items-center justify-between py-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full capitalize">
                        {cta.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-text-dark truncate max-w-[180px]">{cta.text || cta.page}</span>
                    </div>
                    <span className="text-[10px] text-text-muted">{new Date(cta.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Engagement */}
          {behaviorData.section_engagement.length > 0 && (
            <div className="pt-4 border-t border-border-light">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Time by Section</p>
              <div className="space-y-1.5">
                {behaviorData.section_engagement.slice(0, 6).map((sec) => {
                  const maxSec = behaviorData.section_engagement[0]?.seconds || 1;
                  const pct = Math.round((sec.seconds / maxSec) * 100);
                  return (
                    <div key={sec.section}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-text-dark capitalize">{sec.section === 'home' ? 'Homepage' : sec.section}</span>
                        <span className="text-text-muted">{formatDuration(sec.seconds)}</span>
                      </div>
                      <div className="w-full bg-border-light rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full bg-gold/70 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GA4 Data */}
          {behaviorData.ga4 && (
            <div className="pt-4 border-t border-border-light">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Google Analytics</p>
              <div className="grid grid-cols-2 gap-3">
                {behaviorData.ga4.sessions && (
                  <>
                    <div>
                      <p className="text-lg font-semibold text-text-dark">{behaviorData.ga4.sessions.sessions}</p>
                      <p className="text-xs text-text-muted">GA4 Sessions</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-text-dark">
                        {formatDuration(Math.round(behaviorData.ga4.sessions.avgDurationSeconds))}
                      </p>
                      <p className="text-xs text-text-muted">Avg Duration</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-text-dark">
                        {Math.round(behaviorData.ga4.sessions.bounceRate * 100)}%
                      </p>
                      <p className="text-xs text-text-muted">Bounce Rate</p>
                    </div>
                  </>
                )}
                {behaviorData.ga4.traffic_source && (
                  <div className="col-span-2">
                    <p className="text-xs text-text-muted">Traffic Source</p>
                    <p className="text-sm text-text-dark mt-0.5">
                      {behaviorData.ga4.traffic_source.source} / {behaviorData.ga4.traffic_source.medium}
                      {behaviorData.ga4.traffic_source.campaign !== '(not set)' && (
                        <span className="text-text-muted"> ({behaviorData.ga4.traffic_source.campaign})</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading state */}
      {behaviorLoading && hasBasicData && (
        <div className="pt-4 border-t border-border-light">
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-border-light rounded w-24" />
            <div className="h-20 bg-border-light rounded" />
          </div>
        </div>
      )}

      {/* No data at all */}
      {!hasBasicData && !behaviorLoading && !behaviorData?.has_data && (
        <p className="text-sm text-text-muted">No behavioral data recorded yet.</p>
      )}
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  const fetchLead = () => {
    fetch(`/api/dashboard/leads/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setLead(data.lead);
        setConversations(data.conversations || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[leads/id] Fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStage = async (newStage: string) => {
    await fetch(`/api/dashboard/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    setLead((prev) => (prev ? { ...prev, stage: newStage } : prev));
  };

  const addNote = async () => {
    if (!noteText.trim() || !lead) return;
    const existing = lead.notes || '';
    const updated = existing
      ? `${existing}\n[${new Date().toLocaleDateString()}] ${noteText}`
      : `[${new Date().toLocaleDateString()}] ${noteText}`;

    await fetch(`/api/dashboard/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: updated }),
    });
    setLead((prev) => (prev ? { ...prev, notes: updated } : prev));
    setNoteText('');
  };

  const convertToClient = async () => {
    const res = await fetch(`/api/dashboard/leads/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'convert_to_client' }),
    });
    const data = await res.json();
    if (data.clientId) {
      router.push(`/dashboard/clients/${data.clientId}`);
    }
  };

  const recalculateScore = async () => {
    setRecalculating(true);
    try {
      await fetch('/api/dashboard/leads/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: id }),
      });
      fetchLead();
    } catch {
      // silent
    }
    setRecalculating(false);
  };

  if (loading || !lead) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-light rounded w-64" />
          <div className="h-48 bg-border-light rounded-lg" />
        </div>
      </div>
    );
  }

  const scoreToShow = lead.computed_score ?? lead.score ?? 0;
  const labelToShow = lead.computed_label || (scoreToShow >= 70 ? 'hot' : scoreToShow >= 40 ? 'warm' : 'cold');
  const breakdownToShow = lead.score_breakdown || lead.score_factors || {};

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/dashboard/leads" className="hover:text-gold transition-colors">Leads</Link>
        <span>/</span>
        <span className="text-text-dark">{lead.name}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Lead info */}
        <div className="col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-serif text-2xl font-semibold text-text-dark">{lead.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${stageBadgeColors[lead.stage]}`}>
                    {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
                  </span>
                  {lead.quality && (
                    <span className="text-xs text-text-muted">Quality: {lead.quality}</span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    labelToShow === 'hot'
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : labelToShow === 'warm'
                        ? 'bg-amber-100 text-amber-700 border-amber-300'
                        : 'bg-blue-100 text-blue-600 border-blue-300'
                  }`}>
                    {labelToShow === 'hot' ? '\u{1F525}' : labelToShow === 'warm' ? '\u{2600}\u{FE0F}' : '\u{2744}\u{FE0F}'} Score: {scoreToShow}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="px-4 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Call
                </a>
                <a
                  href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium bg-whatsapp/10 text-whatsapp rounded-lg hover:bg-whatsapp/20 transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Phone</p>
                <p className="text-sm text-text-dark mt-1">{lead.phone}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Email</p>
                <p className="text-sm text-text-dark mt-1">{lead.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Interest</p>
                <p className="text-sm text-text-dark mt-1">{lead.interest || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Source</p>
                <p className="text-sm text-text-dark mt-1">{lead.utm_source || lead.source || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Booked Treatment</p>
                <p className="text-sm text-text-dark mt-1">{lead.booked_treatment || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Created</p>
                <p className="text-sm text-text-dark mt-1">{new Date(lead.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Conversion Path */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Conversion Path</h2>
            <ConversionPath stage={lead.stage} />
          </div>

          {/* Stage Timeline */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Update Stage</h2>
            <div className="flex items-center gap-1">
              {STAGES.map((stage, i) => {
                const stageIndex = STAGES.indexOf(lead.stage as typeof STAGES[number]);
                const isActive = i <= stageIndex && lead.stage !== 'lost';
                const isLost = lead.stage === 'lost' && stage === 'lost';
                return (
                  <button
                    key={stage}
                    onClick={() => updateStage(stage)}
                    className={`flex-1 py-2 text-xs font-medium text-center rounded transition-colors ${
                      isLost
                        ? 'bg-red-100 text-red-700'
                        : isActive
                          ? 'bg-gold text-white'
                          : 'bg-border-light text-text-muted hover:bg-gold-pale'
                    }`}
                  >
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Behavioral Data */}
          <BehaviorCard lead={lead} />

          {/* Attribution */}
          <AttributionCard lead={lead} />

          {/* Conversation History */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-4">Conversations</h2>
            {conversations.length === 0 ? (
              <p className="text-sm text-text-muted">No conversations yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversations.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                        msg.direction === 'outbound'
                          ? 'bg-gold text-white'
                          : 'bg-warm-white text-text-dark'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.direction === 'outbound' ? 'text-white/70' : 'text-text-muted'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleString()}
                        {msg.agent && ` \u00B7 ${msg.agent}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Lead Intelligence / Score */}
          <div className="space-y-4">
            <ScoreGauge score={scoreToShow} label={labelToShow} />

            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg font-semibold text-text-dark">Score Breakdown</h2>
                <button
                  onClick={recalculateScore}
                  disabled={recalculating}
                  className="text-xs px-3 py-1.5 bg-gold-pale text-gold-dark rounded-lg hover:bg-gold-light/30 transition-colors disabled:opacity-50 font-medium"
                >
                  {recalculating ? 'Calculating...' : 'Recalculate'}
                </button>
              </div>
              <ScoreBreakdown factors={breakdownToShow} />
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-border p-6 space-y-3">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-2">Actions</h2>
            <button
              onClick={convertToClient}
              className="w-full px-4 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
            >
              Convert to Client
            </button>
            <Link
              href={`/dashboard/appointments/new?lead_id=${lead.id}&name=${encodeURIComponent(lead.name)}&phone=${encodeURIComponent(lead.phone || '')}`}
              className="block w-full text-center px-4 py-2.5 border border-gold text-gold text-sm font-medium rounded-lg hover:bg-gold-pale transition-colors"
            >
              Book Appointment
            </Link>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-serif text-lg font-semibold text-text-dark mb-3">Notes</h2>
            {lead.notes && (
              <pre className="text-sm text-text-light whitespace-pre-wrap bg-warm-white rounded-lg p-3 mb-3 font-sans max-h-64 overflow-y-auto">
                {lead.notes}
              </pre>
            )}
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
              />
              <button
                onClick={addNote}
                className="w-full px-4 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
              >
                Add Note
              </button>
            </div>
          </div>

          {/* Revenue */}
          {(lead.actual_revenue > 0 || lead.conversion_value > 0) && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-serif text-lg font-semibold text-text-dark mb-2">Revenue</h2>
              {lead.actual_revenue > 0 && (
                <p className="text-2xl font-semibold text-gold">
                  PKR {lead.actual_revenue.toLocaleString()}
                </p>
              )}
              {lead.conversion_value > 0 && (
                <p className="text-sm text-text-muted mt-1">
                  Conversion value: PKR {Number(lead.conversion_value).toLocaleString()}
                </p>
              )}
              {lead.converted_at && (
                <p className="text-xs text-text-muted mt-1">
                  Converted: {new Date(lead.converted_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

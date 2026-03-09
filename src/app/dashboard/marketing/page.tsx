'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PipelineStatus {
  ready: boolean;
  loading: boolean;
  services: { claude: boolean; falAi: boolean; instagram: boolean };
  draftCounts: Record<string, number>;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id?: string;
  agent?: string;
  action?: string;
  decision?: string;
  result?: string;
  created_at?: string;
}

interface Draft {
  id: string;
  stage: string;
  topic: string;
  contentType: string;
  caption?: string;
  headline?: string;
  imageUrl?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

interface StudioCard {
  icon: string;
  title: string;
  description: string;
  href: string;
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

const STUDIO_CARDS: StudioCard[] = [
  { icon: '\uD83C\uDFAC', title: 'Reels', description: 'AI-generated short videos for Instagram', href: '/dashboard/marketing/reels' },
  { icon: '\uD83D\uDDBC', title: 'Carousels', description: 'Multi-slide posts with branded templates', href: '/dashboard/marketing/carousels' },
  { icon: '\uD83D\uDCF9', title: 'Video Ads', description: 'Longer format video for paid campaigns', href: '/dashboard/marketing/videos' },
  { icon: '\u25C8', title: 'Ad Campaigns', description: 'Manage active ad campaigns', href: '/dashboard/ads' },
  { icon: '\uD83D\uDCC5', title: 'Content Calendar', description: 'Upcoming scheduled posts', href: '/dashboard/marketing/calendar' },
  { icon: '\u270E', title: 'Blog', description: 'Blog posts for SEO and engagement', href: '/dashboard/marketing/blog' },
  { icon: '\uD83D\uDC64', title: 'Models', description: 'AI characters, photos, generation', href: '/dashboard/marketing/models' },
  { icon: '\u2726', title: 'Brand Assets', description: 'Logos, palettes, fonts, templates', href: '#' },
];

// ---------------------------------------------------------------------------
// Stage labels & colors
// ---------------------------------------------------------------------------

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending_copy: { label: 'Review Copy', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  pending_design: { label: 'Needs Design', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  pending_publish: { label: 'Ready to Publish', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  published: { label: 'Published', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketingStudioPage() {
  const [status, setStatus] = useState<PipelineStatus>({
    ready: false,
    loading: true,
    services: { claude: false, falAi: false, instagram: false },
    draftCounts: {},
    recentActivity: [],
  });
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftFilter, setDraftFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Pipeline trigger state
  const [showPipeline, setShowPipeline] = useState(false);
  const [pipelineTopic, setPipelineTopic] = useState('');
  const [pipelineContentType, setPipelineContentType] = useState('post');
  const [pipelineAction, setPipelineAction] = useState('orchestrate');
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<Record<string, unknown> | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/al/status');
      const data = await res.json();
      setStatus({
        ready: data.ready ?? false,
        loading: false,
        services: data.services ?? { claude: false, falAi: false, instagram: false },
        draftCounts: data.draftCounts ?? {},
        recentActivity: data.recentActivity ?? [],
      });
    } catch {
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const fetchDrafts = useCallback(async () => {
    try {
      const stage = draftFilter === 'all' ? '' : `?stage=${draftFilter}`;
      const res = await fetch(`/api/al/drafts${stage}`);
      const data = await res.json();
      setDrafts(data.drafts ?? []);
    } catch { /* ignore */ }
  }, [draftFilter]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  // Draft actions
  async function handleDraftAction(draftId: string, action: string, params?: Record<string, unknown>) {
    setActionLoading(`${draftId}:${action}`);
    try {
      const res = await fetch('/api/al/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, draftId, params }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`${action.replace(/_/g, ' ')} completed`, 'success');
        fetchDrafts();
        fetchStatus();
      } else {
        showFeedback(data.error || 'Action failed', 'error');
      }
    } catch {
      showFeedback('Failed to perform action', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  // Pipeline trigger
  async function runPipeline() {
    setPipelineRunning(true);
    setPipelineResult(null);
    try {
      const body: Record<string, unknown> = { action: pipelineAction };
      if (pipelineTopic) body.topic = pipelineTopic;
      if (pipelineContentType) body.contentType = pipelineContentType;

      const res = await fetch('/api/al/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setPipelineResult(data);
        showFeedback(`Pipeline ${pipelineAction} completed`, 'success');
        fetchDrafts();
        fetchStatus();
      } else {
        showFeedback(data.error || 'Pipeline failed', 'error');
      }
    } catch {
      showFeedback('Pipeline request failed', 'error');
    } finally {
      setPipelineRunning(false);
    }
  }

  const totalDrafts = Object.values(status.draftCounts).reduce((a, b) => a + b, 0);
  const pendingDrafts = (status.draftCounts.pending_copy || 0) +
    (status.draftCounts.pending_design || 0) +
    (status.draftCounts.pending_publish || 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Marketing Studio</h1>
          <p className="text-sm text-text-muted mt-1">AI-powered content pipeline — create, review, and publish</p>
        </div>
        {pendingDrafts > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
            {pendingDrafts} draft{pendingDrafts !== 1 ? 's' : ''} pending review
          </span>
        )}
      </div>

      {/* Pipeline status banner */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg text-xl ${
            status.loading ? 'bg-gray-50 text-gray-400' : status.ready ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {status.loading ? '\u23F3' : '\u26A1'}
          </div>
          <div className="flex-1">
            {status.loading ? (
              <>
                <p className="text-sm font-medium text-text-dark">Checking pipeline...</p>
                <p className="text-xs text-text-muted mt-0.5">Verifying API connections</p>
              </>
            ) : status.ready ? (
              <>
                <p className="text-sm font-medium text-text-dark">Pipeline Ready</p>
                <p className="text-xs text-text-muted mt-0.5">
                  AI Engine + Image Engine connected. {status.services.instagram ? 'Instagram publishing enabled.' : 'Instagram not configured.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-text-dark">Pipeline Setup Needed</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {!status.services.claude && <span className="mr-2">Missing: ANTHROPIC_API_KEY</span>}
                  {!status.services.falAi && <span>Missing: FAL_KEY</span>}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {['claude', 'falAi', 'instagram'].map((svc) => (
              <span
                key={svc}
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  status.services[svc as keyof typeof status.services]
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {svc === 'claude' ? 'AI Engine' : svc === 'falAi' ? 'Image Engine' : 'Instagram'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedbackMsg && (
        <div className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium border ${
          feedbackMsg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Quick Actions + Pipeline Trigger */}
      {status.ready && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-dark">Quick Actions</h2>
            <button
              onClick={() => setShowPipeline(!showPipeline)}
              className="text-xs text-gold hover:text-gold-dark font-medium"
            >
              {showPipeline ? 'Hide Pipeline' : 'Advanced Pipeline'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Auto-Create Content', action: 'orchestrate', icon: '\u2728' },
              { label: 'Research Topic', action: 'research', icon: '\uD83D\uDD0D' },
              { label: 'Write Copy', action: 'write_content', icon: '\uD83D\uDCDD' },
              { label: 'Analyze Performance', action: 'analyze', icon: '\uD83D\uDCC8' },
            ].map((qa) => (
              <button
                key={qa.action}
                onClick={() => {
                  if (qa.action === 'orchestrate' || qa.action === 'analyze') {
                    setPipelineAction(qa.action);
                    runPipeline();
                  } else {
                    setPipelineAction(qa.action);
                    setShowPipeline(true);
                  }
                }}
                disabled={pipelineRunning}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-warm-white hover:bg-gold-pale text-text-dark hover:text-gold border border-border-light disabled:opacity-50"
              >
                <span className="mr-1.5">{qa.icon}</span>
                {qa.label}
              </button>
            ))}
          </div>

          {/* Advanced pipeline panel */}
          {showPipeline && (
            <div className="mt-4 pt-4 border-t border-border-light">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Action</label>
                  <select
                    value={pipelineAction}
                    onChange={(e) => setPipelineAction(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white"
                  >
                    <option value="orchestrate">Orchestrate (auto-pick topic)</option>
                    <option value="research">Research topic</option>
                    <option value="write_content">Write copy</option>
                    <option value="design">Design visuals</option>
                    <option value="analyze">Analyze performance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Topic</label>
                  <input
                    type="text"
                    value={pipelineTopic}
                    onChange={(e) => setPipelineTopic(e.target.value)}
                    placeholder="e.g. Hydrafacial summer campaign"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Content Type</label>
                  <select
                    value={pipelineContentType}
                    onChange={(e) => setPipelineContentType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white"
                  >
                    <option value="post">Post</option>
                    <option value="carousel">Carousel</option>
                    <option value="reel">Reel</option>
                  </select>
                </div>
              </div>
              <button
                onClick={runPipeline}
                disabled={pipelineRunning || (['research', 'write_content', 'design'].includes(pipelineAction) && !pipelineTopic)}
                className="px-5 py-2 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
              >
                {pipelineRunning ? 'Running...' : 'Run Pipeline'}
              </button>

              {/* Pipeline result */}
              {pipelineResult && (
                <div className="mt-3 bg-warm-white rounded-lg p-4 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-dark">Result</span>
                    {pipelineResult.tokens != null && (
                      <span className="text-text-muted">
                        {String((pipelineResult.tokens as Record<string, number>).input)} in / {String((pipelineResult.tokens as Record<string, number>).output)} out tokens
                      </span>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap text-text-muted overflow-auto max-h-60">
                    {JSON.stringify(pipelineResult.result, null, 2)}
                  </pre>
                  {pipelineResult.draftId != null && (
                    <p className="mt-2 text-sm font-medium text-green-700">
                      Draft created: {String(pipelineResult.draftId)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Draft Queue */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-dark">
            Draft Queue
            {totalDrafts > 0 && <span className="ml-2 text-text-muted font-normal">({totalDrafts})</span>}
          </h2>
          <div className="flex gap-1">
            {['all', 'pending_copy', 'pending_design', 'pending_publish', 'published', 'rejected'].map((stage) => {
              const config = STAGE_CONFIG[stage];
              const count = stage === 'all' ? totalDrafts : (status.draftCounts[stage] || 0);
              return (
                <button
                  key={stage}
                  onClick={() => setDraftFilter(stage)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    draftFilter === stage
                      ? 'bg-gold text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {stage === 'all' ? 'All' : config?.label || stage} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {drafts.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <p className="text-sm">No drafts {draftFilter !== 'all' ? `in "${STAGE_CONFIG[draftFilter]?.label || draftFilter}"` : 'yet'}</p>
            <p className="text-xs mt-1">Use Quick Actions above to generate content</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => {
              const stageConf = STAGE_CONFIG[draft.stage] || { label: draft.stage, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
              const isLoading = (id: string) => actionLoading?.startsWith(`${draft.id}:${id}`);

              return (
                <div key={draft.id} className={`rounded-lg border p-4 ${stageConf.bg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${stageConf.color} bg-white/60`}>
                          {stageConf.label}
                        </span>
                        <span className="text-[10px] text-text-muted uppercase">{draft.contentType}</span>
                        {draft.model && <span className="text-[10px] text-text-muted">by {draft.model}</span>}
                      </div>
                      <h3 className="text-sm font-medium text-text-dark truncate">{draft.topic}</h3>
                      {draft.headline && <p className="text-xs text-text-muted mt-0.5 truncate">{draft.headline}</p>}
                      {draft.caption && (
                        <p className="text-xs text-text-muted mt-1 line-clamp-2">{draft.caption.slice(0, 200)}</p>
                      )}
                      {draft.imageUrl && (
                        <div className="mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={draft.imageUrl} alt="" className="h-20 rounded-md object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {draft.stage === 'pending_copy' && (
                        <>
                          <button
                            onClick={() => handleDraftAction(draft.id, 'approve_copy')}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                          >
                            {isLoading('approve_copy') ? '...' : 'Approve Copy'}
                          </button>
                          <button
                            onClick={() => handleDraftAction(draft.id, 'reject', { reason: 'Not suitable' })}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-md border border-red-200 hover:bg-red-50 disabled:opacity-50"
                          >
                            {isLoading('reject') ? '...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {draft.stage === 'pending_design' && (
                        <>
                          <button
                            onClick={() => handleDraftAction(draft.id, 'generate_image')}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isLoading('generate_image') ? '...' : 'Generate Image'}
                          </button>
                          <button
                            onClick={() => handleDraftAction(draft.id, 'approve_design')}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                          >
                            {isLoading('approve_design') ? '...' : 'Approve Design'}
                          </button>
                        </>
                      )}
                      {draft.stage === 'pending_publish' && (
                        <>
                          <button
                            onClick={() => handleDraftAction(draft.id, 'publish')}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-gold text-white text-xs font-medium rounded-md hover:bg-gold-dark disabled:opacity-50"
                          >
                            {isLoading('publish') ? '...' : 'Publish to IG'}
                          </button>
                          <button
                            onClick={() => handleDraftAction(draft.id, 'reject', { reason: 'Not ready' })}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-md border border-red-200 hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-black/5">
                    <span className="text-[10px] text-text-muted">ID: {draft.id.slice(0, 16)}</span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(draft.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Studio cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STUDIO_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group bg-white rounded-xl border border-border hover:border-gold/30 p-5 transition-all hover:shadow-sm"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warm-white text-xl group-hover:bg-gold-pale transition-colors mb-3">
              {card.icon}
            </div>
            <h3 className="text-sm font-semibold text-text-dark mb-1">{card.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{card.description}</p>
          </Link>
        ))}
      </div>

      {/* Recent pipeline activity */}
      {status.recentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-dark mb-4">Recent Pipeline Activity</h2>
          <div className="space-y-2">
            {status.recentActivity.map((item, i) => (
              <div key={item.id ?? i} className="flex items-start gap-3 py-2 border-b border-border-light last:border-0">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-warm-white text-[10px] font-medium text-text-muted uppercase">
                  {(item.agent ?? '??').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-dark truncate">
                    <span className="font-medium capitalize">{item.agent}</span>
                    {' \u2014 '}
                    <span className="text-text-muted">{item.action}</span>
                  </p>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">{item.decision || 'No details'}</p>
                </div>
                <span className="text-[10px] text-text-muted whitespace-nowrap">
                  {item.created_at ? new Date(item.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup guide when not ready */}
      {!status.loading && !status.ready && status.recentActivity.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-lg font-medium text-text-dark mb-2">Set up the AI Pipeline</p>
            <p className="text-sm text-text-muted mb-6">
              The Marketing Studio uses AI for content creation and image generation.
              Add your API keys to get started.
            </p>
            <div className="text-left bg-warm-white rounded-lg p-4 text-xs font-mono text-text-muted space-y-1">
              <p className="text-text-dark font-sans text-sm font-medium mb-2">Environment variables needed:</p>
              <p>ANTHROPIC_API_KEY=sk-ant-...</p>
              <p>FAL_KEY=your_fal_key</p>
              <p className="text-text-muted/60 mt-2"># Optional for publishing:</p>
              <p>INSTAGRAM_ACCOUNT_ID=...</p>
              <p>INSTAGRAM_ACCESS_TOKEN=...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

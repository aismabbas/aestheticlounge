'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import PipelineWizard from './pipeline-wizard';

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
  imageUrls?: string[];
  videoUrl?: string;
  voiceoverText?: string;
  reelScenes?: { scene_number?: number; image_prompt?: string; motion_prompt?: string; duration_seconds?: number; image_url?: string; video_url?: string }[];
  designApproach?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

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

// Utility links (non-content-creation pages that are still useful)
const UTILITY_LINKS = [
  { icon: '\u25C8', title: 'Ad Campaigns', description: 'Manage active ad campaigns', href: '/dashboard/ads' },
  { icon: '\uD83D\uDCC5', title: 'Content Calendar', description: 'Upcoming scheduled posts', href: '/dashboard/marketing/calendar' },
  { icon: '\uD83D\uDC64', title: 'Models', description: 'AI characters & photos', href: '/dashboard/marketing/models' },
  { icon: '\u2726', title: 'Brand Assets', description: 'Logos, palettes, templates', href: '/dashboard/marketing/brand-assets' },
];

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
  const [generatedImages, setGeneratedImages] = useState<Record<string, string[]>>({});

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardEntry, setWizardEntry] = useState<'auto' | 'research'>('auto');

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

  // Draft actions (for the queue below)
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
        if (action === 'generate_image' && data.images?.length) {
          setGeneratedImages((prev) => ({ ...prev, [draftId]: data.images }));
          showFeedback(`${data.images.length} image(s) generated — pick one to approve`, 'success');
        } else {
          showFeedback(`${action.replace(/_/g, ' ')} completed`, 'success');
          if (action === 'approve_design') {
            setGeneratedImages((prev) => {
              const next = { ...prev };
              delete next[draftId];
              return next;
            });
          }
          fetchDrafts();
          fetchStatus();
        }
      } else {
        showFeedback(data.error || 'Action failed', 'error');
      }
    } catch {
      showFeedback('Failed to perform action', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  const openWizard = (entry: 'auto' | 'research') => {
    setWizardEntry(entry);
    setWizardOpen(true);
  };

  const totalDrafts = Object.values(status.draftCounts).reduce((a, b) => a + b, 0);
  const pendingDrafts = (status.draftCounts.pending_copy || 0) +
    (status.draftCounts.pending_design || 0) +
    (status.draftCounts.pending_publish || 0);

  return (
    <div>
      {/* Wizard overlay */}
      <PipelineWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        entryPoint={wizardEntry}
        onComplete={() => {
          fetchDrafts();
          fetchStatus();
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Marketing Studio</h1>
          <p className="text-sm text-text-muted mt-1">Create posts, carousels, and reels — all in one place</p>
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

      {/* Create Content — two big entry-point buttons */}
      {status.ready && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => openWizard('auto')}
            className="group text-left bg-white rounded-xl border-2 border-border hover:border-gold p-6 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gold/10 text-2xl group-hover:bg-gold/20 transition-colors mb-4">
              <span className="gold-shimmer-text">{'\u2728'}</span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-dark mb-1">Auto-Create Content</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              AI researches trending topics, writes copy, generates images, and prepares a publish-ready post. Pick a topic and watch it happen.
            </p>
            <div className="flex gap-2 mt-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gold/10 text-gold">Posts</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gold/10 text-gold">Carousels</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gold/10 text-gold">Reels</span>
            </div>
          </button>

          <button
            onClick={() => openWizard('research')}
            className="group text-left bg-white rounded-xl border-2 border-border hover:border-gold p-6 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-2xl group-hover:bg-blue-100 transition-colors mb-4">
              {'\uD83D\uDD0D'}
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-dark mb-1">Research & Create</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Chat with AI to explore ideas. Describe what you want, get research-backed suggestions, then run the full pipeline on your chosen topic.
            </p>
            <div className="flex gap-2 mt-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">Chat with AI</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">Custom topics</span>
            </div>
          </button>
        </div>
      )}

      {/* Manual Upload — Posts, Reels, Carousels */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-text-dark mb-3">Manual Upload</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/dashboard/marketing/posts"
            className="group bg-white rounded-xl border border-border hover:border-gold p-5 transition-all hover:shadow-sm"
          >
            <div className="text-2xl mb-2">{'\uD83D\uDCF7'}</div>
            <h3 className="text-sm font-semibold text-text-dark group-hover:text-gold transition-colors">Post</h3>
            <p className="text-xs text-text-muted mt-1">Upload your image, AI writes the caption</p>
          </Link>
          <Link
            href="/dashboard/marketing/reels"
            className="group bg-white rounded-xl border border-border hover:border-gold p-5 transition-all hover:shadow-sm"
          >
            <div className="text-2xl mb-2">{'\uD83C\uDFAC'}</div>
            <h3 className="text-sm font-semibold text-text-dark group-hover:text-gold transition-colors">Reel</h3>
            <p className="text-xs text-text-muted mt-1">Upload your video, AI writes the script & captions</p>
          </Link>
          <Link
            href="/dashboard/marketing/carousels"
            className="group bg-white rounded-xl border border-border hover:border-gold p-5 transition-all hover:shadow-sm"
          >
            <div className="text-2xl mb-2">{'\uD83D\uDCDA'}</div>
            <h3 className="text-sm font-semibold text-text-dark group-hover:text-gold transition-colors">Carousel</h3>
            <p className="text-xs text-text-muted mt-1">Upload slides, AI writes the copy for each</p>
          </Link>
        </div>
      </div>

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
            <p className="text-xs mt-1">Use the buttons above to create content</p>
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
                      <h3 className="text-sm font-medium text-text-dark">{draft.topic}</h3>
                      {draft.headline && (
                        <p className="text-xs font-medium text-gold mt-1">{draft.headline}</p>
                      )}
                      {draft.caption && (
                        <div className="mt-2 bg-white/80 rounded-lg p-3 border border-black/5">
                          <p className="text-xs text-text-dark whitespace-pre-line leading-relaxed">{draft.caption.slice(0, 500)}{draft.caption.length > 500 ? '...' : ''}</p>
                        </div>
                      )}
                      {/* Media preview */}
                      {draft.imageUrl && (
                        <div className="mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={draft.imageUrl} alt={draft.topic} className="max-h-48 rounded-lg object-cover border border-border shadow-sm" />
                        </div>
                      )}
                      {!draft.imageUrl && draft.imageUrls && draft.imageUrls.length > 0 && (
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                          {draft.imageUrls.map((url, idx) => (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img key={idx} src={url} alt={`Slide ${idx + 1}`} className="h-32 rounded-lg object-cover border border-border shadow-sm shrink-0" />
                          ))}
                        </div>
                      )}
                      {draft.videoUrl && (
                        <div className="mt-2">
                          <video src={draft.videoUrl} controls className="max-h-64 rounded-lg border border-border shadow-sm w-full" preload="metadata" />
                        </div>
                      )}
                      {draft.reelScenes && draft.reelScenes.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Reel Scenes ({draft.reelScenes.length})</p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {draft.reelScenes.map((scene, idx) => (
                              <div key={idx} className="shrink-0 w-32 rounded-lg border border-border bg-white/60 overflow-hidden">
                                {scene.image_url ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={scene.image_url} alt={`Scene ${idx + 1}`} className="h-24 w-full object-cover" />
                                ) : scene.video_url ? (
                                  <video src={scene.video_url} controls className="h-24 w-full object-cover" preload="metadata" />
                                ) : (
                                  <div className="h-24 flex items-center justify-center bg-gray-100 text-xs text-text-muted">
                                    Scene {scene.scene_number || idx + 1}
                                  </div>
                                )}
                                <div className="px-2 py-1.5">
                                  <p className="text-[10px] text-text-dark font-medium">Scene {scene.scene_number || idx + 1}</p>
                                  {scene.duration_seconds && (
                                    <p className="text-[9px] text-text-muted">{scene.duration_seconds}s</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Generated image previews */}
                      {generatedImages[draft.id]?.length > 0 && draft.stage === 'pending_design' && (
                        <div className="mt-3 bg-blue-50/50 rounded-lg p-3 border border-blue-200">
                          <p className="text-[10px] font-medium text-blue-700 mb-2 uppercase tracking-wide">
                            Select an image to approve
                          </p>
                          <div className="flex gap-3 overflow-x-auto pb-1">
                            {generatedImages[draft.id].map((url, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleDraftAction(draft.id, 'approve_design', { imageUrl: url })}
                                disabled={!!actionLoading}
                                className="group shrink-0 rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500 transition-all disabled:opacity-50 relative"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Option ${idx + 1}`} className="h-48 w-auto rounded-lg object-cover" />
                                <div className="absolute inset-0 bg-green-600/0 group-hover:bg-green-600/20 transition-colors flex items-center justify-center">
                                  <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-green-600 px-3 py-1.5 rounded-full shadow transition-opacity">
                                    Use This
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {draft.voiceoverText && (
                        <div className="mt-2 bg-blue-50/50 rounded-lg p-2 border border-blue-100">
                          <p className="text-[10px] font-medium text-blue-700 mb-1">Voiceover Script</p>
                          <p className="text-xs text-text-dark leading-relaxed">{draft.voiceoverText}</p>
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
                            {isLoading('generate_image') ? '...' : generatedImages[draft.id]?.length ? 'Regenerate' : 'Generate Image'}
                          </button>
                          {!generatedImages[draft.id]?.length && (
                            <button
                              onClick={() => handleDraftAction(draft.id, 'approve_design')}
                              disabled={!!actionLoading}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                              {isLoading('approve_design') ? '...' : 'Approve Design'}
                            </button>
                          )}
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

      {/* Utility links (compact row) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {UTILITY_LINKS.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="group bg-white rounded-xl border border-border hover:border-gold/30 p-4 transition-all hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-warm-white text-lg group-hover:bg-gold-pale transition-colors shrink-0">
                {link.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-text-dark">{link.title}</h3>
                <p className="text-[10px] text-text-muted truncate">{link.description}</p>
              </div>
            </div>
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

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Draft {
  id: string;
  stage: string;
  topic: string;
  contentType: string;
  caption?: string;
  headline?: string;
  imageUrl?: string;
  imageUrls?: string[];
  model?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CarouselsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, draftsRes] = await Promise.all([
        fetch('/api/al/status').then((r) => r.json()).catch(() => ({})),
        fetch('/api/al/drafts').then((r) => r.json()).catch(() => ({ drafts: [] })),
      ]);
      setReady(statusRes?.ready === true);
      const allDrafts: Draft[] = draftsRes?.drafts ?? [];
      setDrafts(allDrafts.filter((d) => d.contentType === 'carousel'));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function createCarousel(auto: boolean) {
    setCreating(true);
    try {
      const body: Record<string, unknown> = auto
        ? { action: 'orchestrate' }
        : { action: 'write_content', topic, contentType: 'carousel' };

      const res = await fetch('/api/al/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.draftId ? `Carousel draft created` : 'Pipeline completed', 'success');
        fetchData();
      } else {
        showFeedback(data.error || 'Failed', 'error');
      }
    } catch {
      showFeedback('Request failed', 'error');
    } finally {
      setCreating(false);
    }
  }

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
        showFeedback(`${action.replace(/_/g, ' ')} done`, 'success');
        fetchData();
      } else {
        showFeedback(data.error || 'Failed', 'error');
      }
    } catch {
      showFeedback('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  const STAGE_LABELS: Record<string, { label: string; color: string }> = {
    pending_copy: { label: 'Review Copy', color: 'bg-amber-100 text-amber-700' },
    pending_design: { label: 'Needs Design', color: 'bg-blue-100 text-blue-700' },
    pending_publish: { label: 'Ready to Publish', color: 'bg-green-100 text-green-700' },
    published: { label: 'Published', color: 'bg-gray-100 text-gray-600' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600' },
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/marketing" className="text-text-muted hover:text-text-dark transition-colors text-sm">
            Marketing Studio
          </Link>
          <span className="text-text-muted">/</span>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Carousel Studio</h1>
        </div>
        <div className="flex gap-2">
          {ready && (
            <>
              <button onClick={() => createCarousel(true)} disabled={creating}
                className="px-4 py-2.5 bg-warm-white hover:bg-gold-pale text-text-dark text-sm font-medium rounded-lg border border-border-light transition-colors disabled:opacity-50">
                {creating ? 'Working...' : 'Auto-Create'}
              </button>
              <button onClick={() => setShowCreate(!showCreate)}
                className="px-5 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors">
                + New Carousel
              </button>
            </>
          )}
          {!ready && !loading && (
            <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Pipeline not configured</span>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium border ${
          feedback.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>{feedback.text}</div>
      )}

      {/* Pipeline steps */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-dark mb-4">Carousel Pipeline</h2>
        <div className="flex items-start gap-2 overflow-x-auto pb-2">
          {[
            { label: 'Topic', icon: '\uD83D\uDCA1', desc: 'Treatment or campaign topic' },
            { label: 'Copy', icon: '\u270D\uFE0F', desc: 'AI writes slide copy' },
            { label: 'Slides', icon: '\uD83C\uDFA8', desc: 'Generate images per slide' },
            { label: 'Review', icon: '\uD83D\uDC41', desc: 'Approve all slides' },
            { label: 'Publish', icon: '\uD83D\uDE80', desc: 'Post carousel to Instagram' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-start">
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warm-white border border-border-light text-xl">{step.icon}</div>
                <p className="text-xs font-medium text-text-dark mt-2">{step.label}</p>
                <p className="text-[10px] text-text-muted text-center mt-0.5 max-w-[90px] leading-tight">{step.desc}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="flex items-center h-12 px-1">
                  <div className="w-4 h-px bg-border" />
                  <span className="text-border text-xs">&#9654;</span>
                  <div className="w-4 h-px bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <h2 className="text-sm font-semibold text-text-dark mb-4">Create Carousel</h2>
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-muted mb-1.5">Topic</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 5 benefits of Hydrafacial, Laser hair removal myths"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            <p className="text-[10px] text-text-muted mt-1">The copywriter will create multi-slide copy with hooks, educational content, and CTA.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createCarousel(false)} disabled={creating || !topic}
              className="px-5 py-2 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg disabled:opacity-50">
              {creating ? 'Writing...' : 'Generate Carousel'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-text-muted hover:text-text-dark text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Draft list */}
      {drafts.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="text-sm font-semibold text-text-dark mb-4">Carousel Drafts ({drafts.length})</h2>
          <div className="space-y-3">
            {drafts.map((draft) => {
              const stage = STAGE_LABELS[draft.stage] || { label: draft.stage, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={draft.id} className="border border-border-light rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${stage.color}`}>{stage.label}</span>
                        {draft.model && <span className="text-[10px] text-text-muted">by {draft.model}</span>}
                      </div>
                      <h3 className="text-sm font-medium text-text-dark">{draft.topic}</h3>
                      {draft.headline && <p className="text-xs text-text-muted mt-0.5">{draft.headline}</p>}
                      {draft.caption && <p className="text-xs text-text-muted mt-1 line-clamp-3">{draft.caption.slice(0, 300)}</p>}
                      {draft.imageUrls && draft.imageUrls.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1">{draft.imageUrls.length} Slides</p>
                          <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {draft.imageUrls.map((url, i) => (
                              <div key={i} className="shrink-0 relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Slide ${i + 1}`} className="h-24 w-24 rounded-md object-cover border border-border" />
                                <span className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[9px] font-medium px-1 py-0.5 rounded">{i + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {draft.stage === 'pending_copy' && (
                        <>
                          <button onClick={() => handleDraftAction(draft.id, 'approve_copy')} disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                            Approve Copy
                          </button>
                          <button onClick={() => handleDraftAction(draft.id, 'reject')} disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-md border border-red-200 hover:bg-red-50 disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}
                      {draft.stage === 'pending_design' && (
                        <>
                          {(!draft.imageUrls || draft.imageUrls.length === 0) ? (
                            <button onClick={() => handleDraftAction(draft.id, 'generate_image')} disabled={!!actionLoading}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
                              {actionLoading === `${draft.id}:generate_image` ? 'Generating...' : 'Generate Slides'}
                            </button>
                          ) : (
                            <button onClick={() => handleDraftAction(draft.id, 'approve_design', { imageUrls: draft.imageUrls, imageUrl: draft.imageUrls?.[0] })} disabled={!!actionLoading}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                              Approve {draft.imageUrls.length} Slides
                            </button>
                          )}
                          <button onClick={() => handleDraftAction(draft.id, 'reject')} disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-md border border-red-200 hover:bg-red-50 disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}
                      {draft.stage === 'pending_publish' && (
                        <button onClick={() => handleDraftAction(draft.id, 'publish')} disabled={!!actionLoading}
                          className="px-3 py-1.5 bg-gold text-white text-xs font-medium rounded-md hover:bg-gold-dark disabled:opacity-50">
                          {actionLoading === `${draft.id}:publish` ? 'Publishing...' : `Publish ${draft.imageUrls?.length || 1} Slides to IG`}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted mt-2 pt-2 border-t border-border-light">
                    {new Date(draft.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && drafts.length === 0 && !showCreate && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-pale mx-auto mb-4">
            <span className="text-3xl">{'\uD83D\uDCF8'}</span>
          </div>
          <p className="text-lg font-medium text-text-dark">No carousel drafts yet</p>
          <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
            {ready ? 'Create a carousel with AI-generated slides for Instagram.' : 'Set ANTHROPIC_API_KEY and FAL_KEY to enable the pipeline.'}
          </p>
        </div>
      )}
    </div>
  );
}

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
  voiceoverText?: string;
  model?: string;
  reelScenes?: { scene_number: number; image_prompt: string; motion_prompt?: string; duration_seconds?: number }[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReelsPage() {
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
      setDrafts(allDrafts.filter((d) => d.contentType === 'reel'));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function createReel(auto: boolean) {
    setCreating(true);
    try {
      const body: Record<string, unknown> = auto
        ? { action: 'orchestrate' }
        : { action: 'write_content', topic, contentType: 'reel' };

      const res = await fetch('/api/al/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.draftId ? `Reel draft created` : 'Pipeline completed', 'success');
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
    pending_copy: { label: 'Review Script', color: 'bg-amber-100 text-amber-700' },
    pending_design: { label: 'Generate Scenes', color: 'bg-blue-100 text-blue-700' },
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
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Reel Studio</h1>
        </div>
        <div className="flex gap-2">
          {ready && (
            <>
              <button onClick={() => createReel(true)} disabled={creating}
                className="px-4 py-2.5 bg-warm-white hover:bg-gold-pale text-text-dark text-sm font-medium rounded-lg border border-border-light transition-colors disabled:opacity-50">
                {creating ? 'Working...' : 'Auto-Create Reel'}
              </button>
              <button onClick={() => setShowCreate(!showCreate)}
                className="px-5 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors">
                + New Reel
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
        <h2 className="text-sm font-semibold text-text-dark mb-4">Reel Pipeline</h2>
        <div className="flex items-start gap-2 overflow-x-auto pb-2">
          {[
            { label: 'Script', icon: '\uD83D\uDCDD', desc: 'AI writes script + voiceover' },
            { label: 'Scenes', icon: '\uD83C\uDFAD', desc: 'Scene breakdown with models' },
            { label: 'Frames', icon: '\uD83D\uDDBC', desc: 'Key frame generation', approval: true },
            { label: 'Video', icon: '\uD83C\uDFAC', desc: 'Image-to-video via Kling/Veo', approval: true },
            { label: 'Overlay', icon: '\u270F\uFE0F', desc: 'Text + branding compositing' },
            { label: 'Music', icon: '\uD83C\uDFB5', desc: 'AI background score at 15%' },
            { label: 'Publish', icon: '\uD83D\uDCE4', desc: 'Post to Instagram Reels' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-start">
              <div className="flex flex-col items-center min-w-[90px]">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warm-white border border-border-light text-xl">{step.icon}</div>
                <p className="text-xs font-medium text-text-dark mt-2">{step.label}</p>
                <p className="text-[10px] text-text-muted text-center mt-0.5 max-w-[80px] leading-tight">{step.desc}</p>
                {step.approval && (
                  <span className="mt-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-50 text-amber-600 font-medium">Approval</span>
                )}
              </div>
              {i < arr.length - 1 && (
                <div className="flex items-center h-12 px-1">
                  <div className="w-3 h-px bg-border" />
                  <span className="text-border text-[10px]">&#9654;</span>
                  <div className="w-3 h-px bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <h2 className="text-sm font-semibold text-text-dark mb-4">Create New Reel</h2>
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-muted mb-1.5">Topic</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Hydrafacial treatment walkthrough, Before/after laser results"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            <p className="text-[10px] text-text-muted mt-1">The copywriter will create a reel script with scene descriptions, voiceover text, and caption.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createReel(false)} disabled={creating || !topic}
              className="px-5 py-2 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg disabled:opacity-50">
              {creating ? 'Writing...' : 'Generate Reel Script'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-text-muted hover:text-text-dark text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Draft list */}
      {drafts.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="text-sm font-semibold text-text-dark mb-4">Reel Drafts ({drafts.length})</h2>
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
                      {draft.voiceoverText && (
                        <div className="mt-2 bg-warm-white rounded p-2">
                          <p className="text-[10px] font-medium text-text-muted mb-0.5">Voiceover</p>
                          <p className="text-xs text-text-dark">{draft.voiceoverText.slice(0, 200)}</p>
                        </div>
                      )}
                      {draft.reelScenes && draft.reelScenes.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[10px] font-medium text-text-muted mb-1">Scenes ({draft.reelScenes.length})</p>
                          <div className="flex gap-1.5 overflow-x-auto">
                            {draft.reelScenes.map((scene, i) => (
                              <div key={i} className="bg-warm-white rounded p-2 min-w-[120px] shrink-0">
                                <p className="text-[10px] font-medium text-text-dark">Scene {scene.scene_number}</p>
                                <p className="text-[10px] text-text-muted truncate">{scene.image_prompt?.slice(0, 60)}</p>
                                {scene.duration_seconds && <p className="text-[9px] text-text-muted">{scene.duration_seconds}s</p>}
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
                            Approve Script
                          </button>
                          <button onClick={() => handleDraftAction(draft.id, 'reject')} disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-md border border-red-200 hover:bg-red-50 disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}
                      {draft.stage === 'pending_design' && (
                        <button onClick={() => handleDraftAction(draft.id, 'generate_image')} disabled={!!actionLoading}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
                          Generate Frames
                        </button>
                      )}
                      {draft.stage === 'pending_publish' && (
                        <button onClick={() => handleDraftAction(draft.id, 'publish')} disabled={!!actionLoading}
                          className="px-3 py-1.5 bg-gold text-white text-xs font-medium rounded-md hover:bg-gold-dark disabled:opacity-50">
                          Publish Reel
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
            <span className="text-3xl">{'\uD83C\uDFAC'}</span>
          </div>
          <p className="text-lg font-medium text-text-dark">No reel drafts yet</p>
          <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
            {ready ? 'Create AI-powered reels with script, scenes, frames, and automated publishing.' : 'Set ANTHROPIC_API_KEY and FAL_KEY to enable the pipeline.'}
          </p>
        </div>
      )}
    </div>
  );
}

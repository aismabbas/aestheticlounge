'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  model?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PostsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{ draftId?: string; result?: Record<string, unknown> } | null>(null);

  // Image upload
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, draftsRes] = await Promise.all([
        fetch('/api/al/status').then((r) => r.json()).catch(() => ({})),
        fetch('/api/al/drafts?stage=').then((r) => r.json()).catch(() => ({ drafts: [] })),
      ]);
      setReady(statusRes?.ready === true);
      const allDrafts: Draft[] = draftsRes?.drafts ?? [];
      setDrafts(allDrafts.filter((d) => d.contentType === 'post' || !d.contentType));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showFeedback('Please select an image file', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showFeedback('Image must be under 10MB', 'error');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadImageToDrive(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
    );

    const res = await fetch('/api/dashboard/drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload',
        fileName: `post-${Date.now()}-${file.name}`,
        fileData: base64,
        mimeType: file.type,
        folder: 'brand_assets',
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');

    // Use direct Google Drive image URL for Instagram publishing
    return `https://lh3.googleusercontent.com/d/${data.file.fileId}=w1080`;
  }

  async function createPost() {
    if (!topic) return;
    setCreating(true);
    setCreateResult(null);

    try {
      let imageUrl: string | undefined;

      // Upload image first if provided
      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImageToDrive(imageFile);
        } catch (err) {
          showFeedback(`Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
          return;
        } finally {
          setUploading(false);
        }
      }

      // Call pipeline to generate copy
      const body: Record<string, unknown> = {
        action: 'write_content',
        topic,
        contentType: 'post',
        ...(imageUrl && { params: { imageUrl } }),
      };

      const res = await fetch('/api/al/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setCreateResult(data);
        const msg = imageUrl
          ? `Post draft ready to publish (image attached)`
          : `Draft created — add an image next`;
        showFeedback(data.draftId ? msg : 'Pipeline completed', 'success');
        clearImage();
        setTopic('');
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
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Posts</h1>
        </div>
        <div className="flex gap-2">
          {ready && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-5 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + New Post
            </button>
          )}
          {!ready && !loading && (
            <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              Pipeline not configured
            </span>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium border ${
          feedback.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Pipeline steps */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-dark mb-4">How It Works</h2>
        <div className="flex items-start gap-2 overflow-x-auto pb-2">
          {[
            { label: 'Upload', icon: '\uD83D\uDCF7', desc: 'Upload your image' },
            { label: 'Describe', icon: '\u270D\uFE0F', desc: 'Tell AI what to write' },
            { label: 'Review', icon: '\uD83D\uDC41', desc: 'Approve the caption' },
            { label: 'Publish', icon: '\uD83D\uDE80', desc: 'Post to Instagram' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-start">
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warm-white border border-border-light text-xl">
                  {step.icon}
                </div>
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

      {/* Create post form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <h2 className="text-sm font-semibold text-text-dark mb-4">Create New Post</h2>

          {/* Image upload */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-muted mb-1.5">Image</label>
            {imagePreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="h-48 rounded-lg object-cover border border-border" />
                <button
                  onClick={clearImage}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
                >
                  X
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-gold hover:bg-gold-pale/30 transition-colors"
              >
                <span className="text-3xl block mb-2">{'\uD83D\uDCF7'}</span>
                <span className="text-sm text-text-muted">Click to upload image</span>
                <span className="text-[10px] text-text-muted block mt-1">JPG, PNG, WebP up to 10MB</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Topic/prompt */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-muted mb-1.5">What should AI write about?</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Hydrafacial glow results, laser hair removal summer prep, Botox for a youthful look..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
            />
            <p className="text-[10px] text-text-muted mt-1">
              AI will write an Instagram caption in Aesthetic Lounge&apos;s brand voice with proper disclaimers, hashtags, and CTA.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={createPost}
              disabled={creating || !topic}
              className="px-5 py-2 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading image...' : creating ? 'Writing caption...' : imageFile ? 'Upload & Generate Caption' : 'Generate Caption'}
            </button>
            <button onClick={() => { setShowCreate(false); clearImage(); }} className="px-4 py-2 text-text-muted hover:text-text-dark text-sm">
              Cancel
            </button>
          </div>

          {createResult && (
            <div className="mt-4 bg-warm-white rounded-lg p-4 text-xs">
              <p className="font-medium text-text-dark mb-2">Result</p>
              <pre className="whitespace-pre-wrap text-text-muted overflow-auto max-h-48">
                {JSON.stringify(createResult.result, null, 2)}
              </pre>
              {createResult.draftId && (
                <p className="mt-2 text-sm font-medium text-green-700">Draft: {createResult.draftId}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Draft list */}
      {drafts.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="text-sm font-semibold text-text-dark mb-4">Post Drafts ({drafts.length})</h2>
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
                      {draft.imageUrl && (
                        <div className="mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={draft.imageUrl} alt="" className="h-24 rounded-md object-cover" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {draft.stage === 'pending_copy' && (
                        <>
                          <button onClick={() => handleDraftAction(draft.id, 'approve_copy')} disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                            {actionLoading === `${draft.id}:approve_copy` ? '...' : 'Approve Copy'}
                          </button>
                          <button onClick={() => handleDraftAction(draft.id, 'reject')} disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-md border border-red-200 hover:bg-red-50 disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}
                      {draft.stage === 'pending_design' && (
                        <>
                          <button onClick={() => handleDraftAction(draft.id, 'generate_image')} disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
                            {actionLoading === `${draft.id}:generate_image` ? '...' : 'Generate Image'}
                          </button>
                          <button onClick={() => handleDraftAction(draft.id, 'approve_design')} disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                            Approve Design
                          </button>
                        </>
                      )}
                      {draft.stage === 'pending_publish' && (
                        <>
                          <button onClick={() => handleDraftAction(draft.id, 'publish')} disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-gold text-white text-xs font-medium rounded-md hover:bg-gold-dark disabled:opacity-50">
                            Publish to IG
                          </button>
                          <button onClick={() => handleDraftAction(draft.id, 'reject')} disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-md border border-red-200 hover:bg-red-50 disabled:opacity-50">
                            Reject
                          </button>
                        </>
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
            <span className="text-3xl">{'\uD83D\uDCDD'}</span>
          </div>
          <p className="text-lg font-medium text-text-dark">No post drafts yet</p>
          <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
            {ready
              ? 'Upload an image and describe what you want — AI writes the caption in Aesthetic Lounge\'s brand voice.'
              : 'Set ANTHROPIC_API_KEY and FAL_KEY to enable the AI pipeline.'}
          </p>
        </div>
      )}
    </div>
  );
}

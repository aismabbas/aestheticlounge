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

  // Multi-image upload
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleImagesSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) continue;
      if (imageFiles.length + validFiles.length >= 10) break; // Instagram max 10 slides
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      showFeedback('No valid images selected (JPG/PNG/WebP, max 10MB each)', 'error');
      return;
    }

    // Read previews
    for (const file of validFiles) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        previews.push(ev.target?.result as string);
        if (previews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    }
    setImageFiles((prev) => [...prev, ...validFiles]);
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function clearImages() {
    setImageFiles([]);
    setImagePreviews([]);
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
        fileName: `carousel-${Date.now()}-${file.name}`,
        fileData: base64,
        mimeType: file.type,
        folder: 'brand_assets',
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return `https://lh3.googleusercontent.com/d/${data.file.fileId}=w1080`;
  }

  async function createCarousel() {
    if (!topic) return;
    setCreating(true);

    try {
      let imageUrls: string[] | undefined;

      // Upload images first if provided
      if (imageFiles.length > 0) {
        setUploading(true);
        const urls: string[] = [];
        try {
          for (let i = 0; i < imageFiles.length; i++) {
            setUploadProgress(`Uploading slide ${i + 1}/${imageFiles.length}...`);
            urls.push(await uploadImageToDrive(imageFiles[i]));
          }
          imageUrls = urls;
        } catch (err) {
          showFeedback(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
          return;
        } finally {
          setUploading(false);
          setUploadProgress('');
        }
      }

      const body: Record<string, unknown> = {
        action: 'write_content',
        topic,
        contentType: 'carousel',
        ...(imageUrls && { params: { imageUrls } }),
      };

      const res = await fetch('/api/al/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        showFeedback(errData.error || 'Pipeline error', 'error');
        return;
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) { showFeedback('No response stream', 'error'); return; }

      const decoder = new TextDecoder();
      let sseBuffer = '';
      let result: Record<string, unknown> | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let data;
          try { data = JSON.parse(line.slice(6)); } catch { continue; }
          if (data.type === 'ping') continue;
          if (data.type === 'step') setFeedback({ text: data.step, type: 'success' });
          if (data.type === 'result') result = data;
        }
      }

      if (sseBuffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(sseBuffer.slice(6));
          if (data.type === 'result') result = data;
        } catch { /* incomplete */ }
      }

      if (result && (result as Record<string, unknown>).success) {
        const msg = imageUrls
          ? `Carousel ready to publish (${imageUrls.length} slides attached)`
          : 'Carousel draft created';
        showFeedback((result as Record<string, unknown>).draftId ? msg : 'Pipeline completed', 'success');
        clearImages();
        setTopic('');
        fetchData();
      } else {
        showFeedback((result as Record<string, unknown>)?.error as string || 'Pipeline failed', 'error');
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
            <button onClick={() => setShowCreate(!showCreate)}
              className="px-5 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors">
              + New Carousel
            </button>
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
        <h2 className="text-sm font-semibold text-text-dark mb-4">How It Works</h2>
        <div className="flex items-start gap-2 overflow-x-auto pb-2">
          {[
            { label: 'Upload', icon: '\uD83D\uDCDA', desc: 'Upload 2-10 slide images' },
            { label: 'Describe', icon: '\u270D\uFE0F', desc: 'Tell AI about the carousel' },
            { label: 'Review', icon: '\uD83D\uDC41', desc: 'Approve the caption' },
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

          {/* Multi-image upload */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Slides ({imageFiles.length}/10)
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={`Slide ${i + 1}`} className="h-24 w-24 rounded-lg object-cover border border-border" />
                  <span className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[9px] font-medium px-1 py-0.5 rounded">{i + 1}</span>
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center hover:bg-black/80"
                  >
                    X
                  </button>
                </div>
              ))}
              {imageFiles.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-24 w-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-gold hover:bg-gold-pale/30 transition-colors shrink-0"
                >
                  <span className="text-xl mb-0.5">+</span>
                  <span className="text-[10px] text-text-muted">Add slide</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesSelect}
              className="hidden"
            />
            <p className="text-[10px] text-text-muted">Instagram requires 2-10 slides. Upload in order.</p>
          </div>

          {/* Topic */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-muted mb-1.5">What is this carousel about?</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 5 benefits of Hydrafacial, Laser hair removal myths debunked, Before &amp; after results..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
            />
            <p className="text-[10px] text-text-muted mt-1">AI will write a swipe-worthy caption with hook, educational content, and CTA.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={createCarousel} disabled={creating || !topic}
              className="px-5 py-2 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg disabled:opacity-50">
              {uploading ? uploadProgress : creating ? 'Writing copy...' : imageFiles.length > 0 ? `Upload ${imageFiles.length} Slides & Generate Caption` : 'Generate Carousel'}
            </button>
            <button onClick={() => { setShowCreate(false); clearImages(); }} className="px-4 py-2 text-text-muted hover:text-text-dark text-sm">Cancel</button>
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
                        <>
                          <button onClick={() => handleDraftAction(draft.id, 'publish')} disabled={!!actionLoading}
                            className="px-3 py-1.5 bg-gold text-white text-xs font-medium rounded-md hover:bg-gold-dark disabled:opacity-50">
                            {actionLoading === `${draft.id}:publish` ? 'Publishing...' : `Publish ${draft.imageUrls?.length || 1} Slides to IG`}
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
            <span className="text-3xl">{'\uD83D\uDCF8'}</span>
          </div>
          <p className="text-lg font-medium text-text-dark">No carousel drafts yet</p>
          <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
            {ready ? 'Upload your slides and describe the carousel — AI writes the caption.' : 'Set ANTHROPIC_API_KEY and FAL_KEY to enable the pipeline.'}
          </p>
        </div>
      )}
    </div>
  );
}

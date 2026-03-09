'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
}

interface ModelData {
  name: string;
  fullName: string;
  age: number;
  desc: string;
  ethnicity: string;
  look: string;
  use: string;
  portraits: string[];
  driveFolderId?: string;
  driveImages: DriveFile[];
  heroImage?: string;
}

interface GenerateForm {
  model: string;
  sceneType: string;
  treatment: string;
  pose: string;
  customInstructions: string;
}

interface UploadForm {
  model: string;
  newModelName: string;
  url: string;
  fileName: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCENE_TYPES = [
  { value: 'hero', label: 'Hero / Brand' },
  { value: 'treatment', label: 'Treatment Context' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'closeup', label: 'Close-up Detail' },
  { value: 'before-after', label: 'Before / After' },
];

const POSES = [
  { value: '3-quarter', label: '3/4 Angle' },
  { value: 'profile', label: 'Profile' },
  { value: 'front-facing', label: 'Front-Facing' },
  { value: 'wide-shot', label: 'Wide Shot' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ModelsPage() {
  const [models, setModels] = useState<ModelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail view
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateForm, setGenerateForm] = useState<GenerateForm>({
    model: '',
    sceneType: 'hero',
    treatment: '',
    pose: '3-quarter',
    customInstructions: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<{
    images?: string[];
    enhancedPrompt?: string;
    error?: string;
  } | null>(null);

  // Create new model modal
  const [showCreate, setShowCreate] = useState(false);
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{
    success?: boolean;
    profile?: { name: string; fullName: string; age: number; ethnicity: string; look: string; use: string };
    photosGenerated?: number;
    error?: string;
  } | null>(null);

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    model: '',
    newModelName: '',
    url: '',
    fileName: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success?: boolean; error?: string } | null>(null);

  // Content creation stepper
  const [creatorMode, setCreatorMode] = useState(false);
  const [creatorStep, setCreatorStep] = useState(1); // 1=model, 2=type, 3=configure, 4=generate, 5=result
  const [creatorModel, setCreatorModel] = useState<string | null>(null);
  const [creatorType, setCreatorType] = useState<'post' | 'carousel' | 'reel' | 'ad'>('post');
  const [creatorTopic, setCreatorTopic] = useState('');
  const [creatorFreeform, setCreatorFreeform] = useState('');
  const [creatorRunning, setCreatorRunning] = useState(false);
  const [creatorResult, setCreatorResult] = useState<Record<string, unknown> | null>(null);
  const [creatorImages, setCreatorImages] = useState<string[]>([]);

  // Feedback
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/marketing/models?detail=true');
      if (!res.ok) throw new Error('Failed to load models');
      const data = await res.json();
      setModels(data.models || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Auto-clear feedback
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 8000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const activeModel = models.find((m) => m.name === selectedModel);

  // Handle generate with AI-enhanced prompts
  async function handleGenerate() {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const res = await fetch('/api/dashboard/marketing/models/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generateForm,
          enhanceWithAI: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateResult({ error: data.error || 'Generation failed' });
      } else {
        setGenerateResult({
          images: data.images,
          enhancedPrompt: data.enhancedPrompt,
        });
        setFeedback(`Generated ${data.images?.length || 0} images for ${generateForm.model}`);
      }
    } catch {
      setGenerateResult({ error: 'Network error' });
    } finally {
      setGenerating(false);
    }
  }

  // Handle create new model
  async function handleCreate() {
    setCreating(true);
    setCreateResult(null);
    try {
      const res = await fetch('/api/dashboard/marketing/models/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: createDescription }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateResult({ error: data.error || 'Creation failed' });
      } else {
        setCreateResult({
          success: true,
          profile: data.profile,
          photosGenerated: data.photosGenerated,
        });
        setFeedback(
          `Created ${data.profile?.fullName} with ${data.photosUploaded} reference photos. Designer memory updated.`,
        );
        setShowCreate(false);
        setCreateDescription('');
        setLoading(true);
        fetchModels();
      }
    } catch {
      setCreateResult({ error: 'Network error' });
    } finally {
      setCreating(false);
    }
  }

  // Handle upload from URL
  async function handleUpload() {
    const targetModel = uploadForm.model === '__new__' ? uploadForm.newModelName : uploadForm.model;
    if (!targetModel) return;

    setUploading(true);
    setUploadResult(null);
    try {
      const res = await fetch('/api/dashboard/marketing/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_url',
          model: targetModel,
          createIfMissing: uploadForm.model === '__new__',
          url: uploadForm.url,
          fileName: uploadForm.fileName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadResult({ error: data.error || 'Upload failed' });
      } else {
        setUploadResult({ success: true });
        setFeedback(`Uploaded image to ${targetModel}'s folder`);
        setShowUpload(false);
        setUploadForm({ model: '', newModelName: '', url: '', fileName: '' });
        fetchModels();
      }
    } catch {
      setUploadResult({ error: 'Network error' });
    } finally {
      setUploading(false);
    }
  }

  // Upload a generated image to Drive
  async function uploadGeneratedImage(imageUrl: string, modelName: string) {
    const ts = Date.now();
    const fileName = `${generateForm.sceneType}-${generateForm.pose}-${ts}.png`;
    try {
      const res = await fetch('/api/dashboard/marketing/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_url',
          model: modelName,
          url: imageUrl,
          fileName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(`Saved to ${modelName}'s Drive folder as ${fileName}`);
        fetchModels();
      } else {
        setFeedback(`Upload error: ${data.error}`);
      }
    } catch {
      setFeedback('Network error uploading image');
    }
  }

  // -------------------------------------------------------------------------
  // Render — Loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard/marketing"
            className="text-text-muted hover:text-text-dark transition-colors text-sm"
          >
            Marketing Studio
          </Link>
          <span className="text-text-muted">/</span>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Models</h1>
        </div>
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-warm-white" />
            <div className="h-4 w-48 bg-warm-white rounded" />
            <div className="h-3 w-64 bg-warm-white rounded" />
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render — Error
  // -------------------------------------------------------------------------

  if (error) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard/marketing"
            className="text-text-muted hover:text-text-dark transition-colors text-sm"
          >
            Marketing Studio
          </Link>
          <span className="text-text-muted">/</span>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Models</h1>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <p className="text-xs text-text-muted mt-2">
            Make sure Google service account and{' '}
            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">FAL_KEY</code> are configured.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render — Model Detail View
  // -------------------------------------------------------------------------

  if (selectedModel && activeModel) {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/marketing"
              className="text-text-muted hover:text-text-dark transition-colors text-sm"
            >
              Marketing Studio
            </Link>
            <span className="text-text-muted">/</span>
            <button
              onClick={() => setSelectedModel(null)}
              className="text-text-muted hover:text-text-dark transition-colors text-sm"
            >
              Models
            </button>
            <span className="text-text-muted">/</span>
            <h1 className="font-serif text-2xl font-semibold text-text-dark">{activeModel.fullName}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setGenerateForm((f) => ({ ...f, model: activeModel.name }));
                setShowGenerate(true);
                setGenerateResult(null);
              }}
              className="px-4 py-2.5 bg-warm-white hover:bg-gold-pale text-text-dark text-sm font-medium rounded-lg border border-border-light transition-colors"
            >
              Generate Photo
            </button>
            <button
              onClick={() => {
                setUploadForm((f) => ({ ...f, model: activeModel.name }));
                setShowUpload(true);
                setUploadResult(null);
              }}
              className="px-4 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Upload from URL
            </button>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="rounded-lg px-4 py-3 mb-4 text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            {feedback}
          </div>
        )}

        {/* Generate panel (inline when in detail view) */}
        {showGenerate && renderGeneratePanel()}

        {/* Model info card */}
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex items-start gap-5">
            {activeModel.heroImage && (
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-warm-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeModel.heroImage}
                  alt={activeModel.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-serif font-semibold text-text-dark">{activeModel.fullName}</h2>
              <p className="text-sm text-text-muted mt-1">{activeModel.desc}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-text-muted">
                <span>Age: {activeModel.age}</span>
                <span>Ethnicity: {activeModel.ethnicity}</span>
                <span>Look: {activeModel.look}</span>
              </div>
              <p className="text-xs text-text-muted mt-2">
                <span className="font-medium text-text-dark">Best for:</span> {activeModel.use}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-serif font-semibold text-gold">{activeModel.driveImages.length}</span>
              <p className="text-xs text-text-muted">photos</p>
            </div>
          </div>
        </div>

        {/* Photo grid */}
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="text-sm font-semibold text-text-dark mb-4">
            Photos ({activeModel.driveImages.length})
          </h2>
          {activeModel.driveImages.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">
              No photos found in Drive. Generate or upload images to get started.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {activeModel.driveImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative border border-border-light rounded-lg overflow-hidden hover:border-gold/30 transition-colors"
                >
                  <div className="aspect-[3/4] bg-warm-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://drive.google.com/thumbnail?id=${img.id}&sz=w400`}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2 p-3 w-full">
                      <a
                        href={img.webViewLink || `https://drive.google.com/file/d/${img.id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-2 py-1.5 bg-white/90 text-text-dark text-[10px] font-medium rounded text-center hover:bg-white transition-colors"
                      >
                        View
                      </a>
                      <a
                        href={`https://drive.google.com/uc?export=download&id=${img.id}`}
                        className="flex-1 px-2 py-1.5 bg-gold/90 text-white text-[10px] font-medium rounded text-center hover:bg-gold transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-text-muted truncate">{img.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medical disclaimer */}
        <div className="bg-warm-white rounded-xl border border-border-light p-4 text-center">
          <p className="text-[10px] text-text-muted leading-relaxed">
            Individual results may vary. Consult with our medical professionals. Dr. Huma Abbas, Medical Director.
            All model images are AI-generated for marketing purposes.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Shared — Generate Panel
  // -------------------------------------------------------------------------

  function renderGeneratePanel() {
    return (
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-dark">Generate New Photo</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Prompts are AI-enhanced for best results
            </p>
          </div>
          <button
            onClick={() => { setShowGenerate(false); setGenerateResult(null); }}
            className="text-text-muted hover:text-text-dark text-sm transition-colors"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Model selector */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Model</label>
            <select
              value={generateForm.model}
              onChange={(e) => setGenerateForm((f) => ({ ...f, model: e.target.value }))}
              className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark bg-white focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="">Select a model...</option>
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.fullName} -- {m.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Scene type */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Scene Type</label>
            <select
              value={generateForm.sceneType}
              onChange={(e) => setGenerateForm((f) => ({ ...f, sceneType: e.target.value }))}
              className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark bg-white focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {SCENE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Treatment context */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Treatment Context <span className="font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={generateForm.treatment}
              onChange={(e) => setGenerateForm((f) => ({ ...f, treatment: e.target.value }))}
              placeholder="e.g., HydraFacial, Laser Hair Removal, Botox"
              className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          {/* Pose/angle */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Pose / Angle</label>
            <select
              value={generateForm.pose}
              onChange={(e) => setGenerateForm((f) => ({ ...f, pose: e.target.value }))}
              className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark bg-white focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {POSES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom instructions — freeform text enhanced by AI */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Custom Instructions <span className="font-normal">(AI will enhance this into an optimal prompt)</span>
          </label>
          <textarea
            value={generateForm.customInstructions}
            onChange={(e) => setGenerateForm((f) => ({ ...f, customInstructions: e.target.value }))}
            placeholder="e.g., Make her look like she just finished a HydraFacial treatment, glowing skin, relaxed expression, sitting in the treatment chair with gold-accented clinic interior behind her..."
            rows={3}
            className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-gold resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating || !generateForm.model}
            className="px-5 py-2 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? 'Enhancing & Generating...' : 'Generate (2 images)'}
          </button>
          <button
            onClick={() => { setShowGenerate(false); setGenerateResult(null); }}
            className="px-4 py-2 text-text-muted hover:text-text-dark text-sm transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Enhanced prompt preview */}
        {generateResult?.enhancedPrompt && (
          <div className="mt-4 rounded-lg px-4 py-3 bg-blue-50 border border-blue-200">
            <p className="text-[10px] font-medium text-blue-700 mb-1">AI-enhanced prompt:</p>
            <p className="text-[11px] text-blue-900 leading-relaxed">{generateResult.enhancedPrompt}</p>
          </div>
        )}

        {/* Generation results */}
        {generateResult?.error && (
          <div className="mt-4 rounded-lg px-4 py-3 bg-red-50 text-red-700 text-sm border border-red-200">
            {generateResult.error}
          </div>
        )}
        {generateResult?.images && generateResult.images.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-text-muted mb-2">Generated Images (click Save to upload to Drive)</p>
            <div className="grid grid-cols-2 gap-3">
              {generateResult.images.map((url, i) => (
                <div key={i} className="relative border border-border-light rounded-lg overflow-hidden">
                  <div className="aspect-[3/4] bg-warm-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Generated ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-2 py-1.5 bg-white/90 text-text-dark text-[10px] font-medium rounded text-center"
                      >
                        View Full
                      </a>
                      <button
                        onClick={() => uploadGeneratedImage(url, generateForm.model)}
                        className="flex-1 px-2 py-1.5 bg-gold text-white text-[10px] font-medium rounded text-center hover:bg-gold/90 transition-colors"
                      >
                        Save to Drive
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Content Creator — stepper functions
  // -------------------------------------------------------------------------

  function resetCreator() {
    setCreatorMode(false);
    setCreatorStep(1);
    setCreatorModel(null);
    setCreatorType('post');
    setCreatorTopic('');
    setCreatorFreeform('');
    setCreatorRunning(false);
    setCreatorResult(null);
    setCreatorImages([]);
  }

  async function runCreator() {
    setCreatorRunning(true);
    setCreatorResult(null);
    setCreatorImages([]);
    try {
      if (creatorType === 'ad') {
        // Use ad-creative endpoint
        const res = await fetch('/api/al/ad-creative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            treatment: creatorTopic,
            objective: 'OUTCOME_LEADS',
            model: creatorModel || undefined,
            freeform: creatorFreeform || undefined,
            generateImages: true,
            numImages: 2,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setCreatorResult(data.copy || {});
          setCreatorImages(data.images || []);
          setCreatorStep(5);
        } else {
          setFeedback(`Error: ${data.error || 'Failed'}`);
        }
      } else {
        // Use pipeline for post/carousel/reel
        const res = await fetch('/api/al/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'write_content',
            topic: creatorTopic,
            contentType: creatorType,
            params: {
              model: creatorModel,
              freeform: creatorFreeform || undefined,
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          setCreatorResult(data.result || {});
          setCreatorStep(5);
          setFeedback(data.draftId ? `Draft created: ${data.draftId}` : 'Content generated');
        } else {
          setFeedback(`Error: ${data.error || 'Failed'}`);
        }
      }
    } catch {
      setFeedback('Request failed');
    } finally {
      setCreatorRunning(false);
    }
  }

  const creatorModelData = models.find((m) => m.name === creatorModel);
  const CREATOR_STEPS = [
    { num: 1, label: 'Select Model', icon: '\uD83D\uDC64' },
    { num: 2, label: 'Content Type', icon: '\uD83D\uDCCB' },
    { num: 3, label: 'Configure', icon: '\u270D\uFE0F' },
    { num: 4, label: 'Generate', icon: '\u2728' },
    { num: 5, label: 'Result', icon: '\u2705' },
  ];

  // -------------------------------------------------------------------------
  // Render — Content Creator Mode
  // -------------------------------------------------------------------------

  if (creatorMode) {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/marketing" className="text-text-muted hover:text-text-dark transition-colors text-sm">Marketing Studio</Link>
            <span className="text-text-muted">/</span>
            <button onClick={resetCreator} className="text-text-muted hover:text-text-dark transition-colors text-sm">Models</button>
            <span className="text-text-muted">/</span>
            <h1 className="font-serif text-2xl font-semibold text-text-dark">Create Content</h1>
          </div>
          <button onClick={resetCreator} className="px-4 py-2 text-text-muted hover:text-text-dark text-sm font-medium transition-colors">
            Back to Gallery
          </button>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex items-start gap-1 overflow-x-auto pb-1">
            {CREATOR_STEPS.map((s, i) => (
              <div key={s.num} className="flex items-start">
                <div className="flex flex-col items-center min-w-[90px]">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full text-lg transition-colors ${
                    creatorStep === s.num ? 'bg-gold text-white' :
                    creatorStep > s.num ? 'bg-green-100 text-green-700' :
                    'bg-warm-white border border-border-light text-text-muted'
                  }`}>
                    {creatorStep > s.num ? '\u2713' : s.icon}
                  </div>
                  <p className={`text-[10px] font-medium mt-1.5 ${creatorStep === s.num ? 'text-text-dark' : 'text-text-muted'}`}>
                    {s.label}
                  </p>
                </div>
                {i < CREATOR_STEPS.length - 1 && (
                  <div className="flex items-center h-10 px-1">
                    <div className={`w-6 h-px ${creatorStep > s.num ? 'bg-green-400' : 'bg-border'}`} />
                    <span className={`text-[10px] ${creatorStep > s.num ? 'text-green-400' : 'text-border'}`}>&#9654;</span>
                    <div className={`w-6 h-px ${creatorStep > s.num ? 'bg-green-400' : 'bg-border'}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium ${
            feedback.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
          }`}>{feedback}</div>
        )}

        {/* Step 1: Select Model */}
        {creatorStep === 1 && (
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-sm font-semibold text-text-dark mb-1">Choose Your Model</h2>
            <p className="text-xs text-text-muted mb-4">Select the AI character that will appear in your content.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {models.map((m) => (
                <button
                  key={m.name}
                  onClick={() => { setCreatorModel(m.name); setCreatorStep(2); }}
                  className={`group text-left rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${
                    creatorModel === m.name ? 'border-gold shadow-md' : 'border-border hover:border-gold/40'
                  }`}
                >
                  <div className="aspect-[3/4] bg-warm-white relative overflow-hidden">
                    {m.heroImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.heroImage} alt={m.fullName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl text-text-muted/20 font-serif">{m.name[0].toUpperCase()}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white text-sm font-semibold">{m.fullName}</p>
                      <p className="text-white/70 text-[10px]">{m.use}</p>
                    </div>
                  </div>
                </button>
              ))}
              {/* Auto-select option */}
              <button
                onClick={() => { setCreatorModel(null); setCreatorStep(2); }}
                className={`text-left rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${
                  creatorModel === null ? 'border-gold shadow-md' : 'border-border-light border-dashed hover:border-gold/40'
                }`}
              >
                <div className="aspect-[3/4] bg-warm-white flex flex-col items-center justify-center p-4">
                  <span className="text-3xl mb-2">{'\u2728'}</span>
                  <p className="text-sm font-semibold text-text-dark">Auto-Select</p>
                  <p className="text-[10px] text-text-muted text-center mt-1">Let AI pick the best model for your topic</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Content Type */}
        {creatorStep === 2 && (
          <div className="bg-white rounded-xl border border-border p-6">
            {/* Selected model preview */}
            {creatorModelData && (
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border-light">
                {creatorModelData.heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creatorModelData.heroImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div>
                  <p className="text-sm font-medium text-text-dark">{creatorModelData.fullName}</p>
                  <p className="text-[10px] text-text-muted">{creatorModelData.use}</p>
                </div>
                <button onClick={() => setCreatorStep(1)} className="ml-auto text-xs text-gold hover:text-gold-dark font-medium">Change</button>
              </div>
            )}

            <h2 className="text-sm font-semibold text-text-dark mb-1">What do you want to create?</h2>
            <p className="text-xs text-text-muted mb-4">Choose the content format for Instagram.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([
                { type: 'post' as const, icon: '\uD83D\uDDBC', label: 'Post', desc: 'Single image with caption', size: '1080x1350' },
                { type: 'carousel' as const, icon: '\uD83D\uDCF8', label: 'Carousel', desc: 'Multi-slide swipeable post', size: '1080x1350' },
                { type: 'reel' as const, icon: '\uD83C\uDFAC', label: 'Reel', desc: 'Short video with script', size: '1080x1920' },
                { type: 'ad' as const, icon: '\u25C8', label: 'Ad Creative', desc: 'Headline, copy, and ad image', size: '1080x1080' },
              ]).map((ct) => (
                <button
                  key={ct.type}
                  onClick={() => { setCreatorType(ct.type); setCreatorStep(3); }}
                  className={`p-5 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                    creatorType === ct.type ? 'border-gold shadow-md bg-gold-pale' : 'border-border hover:border-gold/40'
                  }`}
                >
                  <span className="text-3xl block mb-3">{ct.icon}</span>
                  <p className="text-sm font-semibold text-text-dark">{ct.label}</p>
                  <p className="text-[10px] text-text-muted mt-1">{ct.desc}</p>
                  <p className="text-[9px] text-text-muted mt-0.5 font-mono">{ct.size}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Configure */}
        {creatorStep === 3 && (
          <div className="bg-white rounded-xl border border-border p-6">
            {/* Preview bar */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border-light">
              {creatorModelData?.heroImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creatorModelData.heroImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-text-dark">
                  {creatorModelData?.fullName || 'Auto-select model'}
                  <span className="text-text-muted font-normal"> / </span>
                  <span className="capitalize">{creatorType}</span>
                </p>
              </div>
              <button onClick={() => setCreatorStep(2)} className="text-xs text-gold hover:text-gold-dark font-medium">Change type</button>
            </div>

            <h2 className="text-sm font-semibold text-text-dark mb-1">Configure Your Content</h2>
            <p className="text-xs text-text-muted mb-4">Tell the AI what to create. Be specific or keep it brief — the agents will fill in the rest.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  {creatorType === 'ad' ? 'Treatment / Product' : 'Topic'} *
                </label>
                <input
                  type="text"
                  value={creatorTopic}
                  onChange={(e) => setCreatorTopic(e.target.value)}
                  placeholder={
                    creatorType === 'ad'
                      ? 'e.g. HydraFacial, Laser Hair Removal, Botox'
                      : 'e.g. Summer skincare routine, Ramadan glow package'
                  }
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Creative Direction <span className="font-normal">(optional — AI enhances this)</span>
                </label>
                <textarea
                  value={creatorFreeform}
                  onChange={(e) => setCreatorFreeform(e.target.value)}
                  rows={3}
                  placeholder="e.g. Focus on painless procedure, show luxury clinic interior, before/after transformation, summer vibes..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-gold resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setCreatorStep(4); runCreator(); }}
                disabled={!creatorTopic.trim()}
                className="px-6 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Generate Content
              </button>
              <button onClick={() => setCreatorStep(2)} className="px-4 py-2.5 text-text-muted hover:text-text-dark text-sm">
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Generating */}
        {creatorStep === 4 && creatorRunning && (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <div className="animate-spin w-10 h-10 border-3 border-gold border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm font-medium text-text-dark mb-1">Generating your {creatorType}...</p>
            <p className="text-xs text-text-muted">
              {creatorType === 'ad'
                ? 'Copywriter is writing ad copy, Designer is creating images...'
                : 'Copywriter is drafting caption and content...'}
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              {creatorModelData?.heroImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creatorModelData.heroImage} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-gold" />
              )}
              <span className="text-xs text-text-muted">
                {creatorModelData?.fullName || 'Auto-selected'} / <span className="capitalize">{creatorType}</span> / {creatorTopic}
              </span>
            </div>
          </div>
        )}

        {/* Step 5: Result */}
        {creatorStep === 5 && creatorResult && (
          <div className="bg-white rounded-xl border border-border p-6">
            {/* Summary bar */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border-light">
              {creatorModelData?.heroImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creatorModelData.heroImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-text-dark">
                  {creatorModelData?.fullName || 'Auto-selected'} / <span className="capitalize">{creatorType}</span>
                </p>
                <p className="text-[10px] text-text-muted">{creatorTopic}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">Complete</span>
            </div>

            <h2 className="text-sm font-semibold text-text-dark mb-4">Generated Content</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Copy */}
              <div className="bg-warm-white rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Copy</h3>
                {creatorType === 'ad' ? (
                  <>
                    {creatorResult.headline && (
                      <div>
                        <p className="text-[10px] text-text-muted">Headline</p>
                        <p className="text-sm font-medium text-text-dark">{String(creatorResult.headline)}</p>
                      </div>
                    )}
                    {creatorResult.primary_text && (
                      <div>
                        <p className="text-[10px] text-text-muted">Primary Text</p>
                        <p className="text-xs text-text-dark">{String(creatorResult.primary_text)}</p>
                      </div>
                    )}
                    {creatorResult.description && (
                      <div>
                        <p className="text-[10px] text-text-muted">Description</p>
                        <p className="text-xs text-text-dark">{String(creatorResult.description)}</p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      {creatorResult.cta_type != null && (
                        <div>
                          <p className="text-[10px] text-text-muted">CTA</p>
                          <p className="text-xs font-medium text-gold">{String(creatorResult.cta_type)}</p>
                        </div>
                      )}
                      {creatorResult.ad_angle != null && (
                        <div>
                          <p className="text-[10px] text-text-muted">Angle</p>
                          <p className="text-xs text-text-dark capitalize">{String(creatorResult.ad_angle)}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {creatorResult.headline && (
                      <div>
                        <p className="text-[10px] text-text-muted">Headline</p>
                        <p className="text-sm font-medium text-text-dark">{String(creatorResult.headline)}</p>
                      </div>
                    )}
                    {creatorResult.instagram_caption && (
                      <div>
                        <p className="text-[10px] text-text-muted">Caption</p>
                        <p className="text-xs text-text-dark whitespace-pre-wrap">{String(creatorResult.instagram_caption).slice(0, 500)}</p>
                      </div>
                    )}
                    {creatorResult.voiceover_text && (
                      <div>
                        <p className="text-[10px] text-text-muted">Voiceover</p>
                        <p className="text-xs text-text-dark">{String(creatorResult.voiceover_text)}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Images (ad creative only) */}
              {creatorImages.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Generated Images</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {creatorImages.map((url, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden border border-border-light">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Generated ${i + 1}`} className="w-full aspect-square object-cover" />
                        <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="block text-center px-2 py-1 bg-white/90 text-text-dark text-[10px] font-medium rounded">
                            View Full
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Full JSON result */}
            <details className="mt-4">
              <summary className="text-xs text-text-muted cursor-pointer hover:text-text-dark">View raw output</summary>
              <pre className="mt-2 bg-warm-white rounded-lg p-3 text-[10px] text-text-muted overflow-auto max-h-48 whitespace-pre-wrap">
                {JSON.stringify(creatorResult, null, 2)}
              </pre>
            </details>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-border-light">
              <Link
                href={creatorType === 'ad' ? '/dashboard/ads/create' : `/dashboard/marketing/${creatorType === 'post' ? 'posts' : creatorType + 's'}`}
                className="px-4 py-2 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Go to {creatorType === 'ad' ? 'Ads' : creatorType === 'post' ? 'Posts' : creatorType === 'reel' ? 'Reels' : 'Carousels'}
              </Link>
              <button
                onClick={() => { setCreatorStep(3); setCreatorResult(null); setCreatorImages([]); }}
                className="px-4 py-2 bg-warm-white hover:bg-gold-pale text-text-dark text-sm font-medium rounded-lg border border-border-light transition-colors"
              >
                Try Again
              </button>
              <button onClick={resetCreator} className="px-4 py-2 text-text-muted hover:text-text-dark text-sm font-medium">
                Back to Gallery
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render — Gallery View
  // -------------------------------------------------------------------------

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/marketing"
            className="text-text-muted hover:text-text-dark transition-colors text-sm"
          >
            Marketing Studio
          </Link>
          <span className="text-text-muted">/</span>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Model Gallery</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setCreatorMode(true); setCreatorStep(1); }}
            className="px-4 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Content
          </button>
          <button
            onClick={() => {
              setShowCreate(true);
              setCreateResult(null);
            }}
            className="px-4 py-2.5 bg-warm-white hover:bg-gold-pale text-text-dark text-sm font-medium rounded-lg border border-border-light transition-colors"
          >
            + New Model
          </button>
          <button
            onClick={() => {
              setShowGenerate(true);
              setGenerateResult(null);
            }}
            className="px-4 py-2.5 bg-warm-white hover:bg-gold-pale text-text-dark text-sm font-medium rounded-lg border border-border-light transition-colors"
          >
            Generate Photo
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium ${
          feedback.startsWith('Error')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {feedback}
        </div>
      )}

      {/* Create New Model Panel */}
      {showCreate && (
        <div className="bg-white rounded-xl border-2 border-gold/30 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-dark">Create New AI Model</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Describe the character in freeform text. AI will create a full character profile,
                generate 4 hero reference photos, upload to Drive, and update the designer agent memory.
              </p>
            </div>
            <button
              onClick={() => { setShowCreate(false); setCreateResult(null); }}
              className="text-text-muted hover:text-text-dark text-sm transition-colors"
            >
              Close
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Character Description
            </label>
            <textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder={`Describe the model character you want to create. Be as specific or vague as you like — AI will fill in the details.\n\nExamples:\n- "A young Balochi woman, early 20s, dark skin, striking green eyes, for summer skincare campaigns"\n- "Male model, 40s, silver-streaked hair, distinguished, for anti-aging treatments"\n- "Create a model like Ayesha but younger and more modern, for Gen Z content"`}
              rows={6}
              className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !createDescription.trim()}
              className="px-5 py-2 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
                  Creating character...
                </span>
              ) : (
                'Create Model (AI + Image Engine)'
              )}
            </button>
            <button
              onClick={() => { setShowCreate(false); setCreateResult(null); }}
              className="px-4 py-2 text-text-muted hover:text-text-dark text-sm transition-colors"
            >
              Cancel
            </button>
          </div>

          {creating && (
            <div className="mt-4 rounded-lg px-4 py-3 bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-700">
                Step 1: AI is creating the character profile...
                Then generating 4 hero photos...
                Then uploading to Google Drive and updating designer memory.
                This may take 30-60 seconds.
              </p>
            </div>
          )}

          {createResult?.error && (
            <div className="mt-4 rounded-lg px-4 py-3 bg-red-50 text-red-700 text-sm border border-red-200">
              {createResult.error}
            </div>
          )}

          {createResult?.success && createResult.profile && (
            <div className="mt-4 rounded-lg px-4 py-3 bg-green-50 border border-green-200">
              <p className="text-sm font-medium text-green-800 mb-2">
                {createResult.profile.fullName} created successfully
              </p>
              <div className="text-xs text-green-700 space-y-1">
                <p>Age: {createResult.profile.age} | Ethnicity: {createResult.profile.ethnicity}</p>
                <p>Look: {createResult.profile.look}</p>
                <p>Best for: {createResult.profile.use}</p>
                <p>{createResult.photosGenerated} reference photos generated and uploaded to Drive</p>
                <p>Designer agent memory updated</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Panel */}
      {showGenerate && renderGeneratePanel()}

      {/* Upload Modal */}
      {showUpload && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-dark">Upload Image from URL</h2>
            <button
              onClick={() => { setShowUpload(false); setUploadResult(null); }}
              className="text-text-muted hover:text-text-dark text-sm transition-colors"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Model</label>
              <select
                value={uploadForm.model}
                onChange={(e) => setUploadForm((f) => ({ ...f, model: e.target.value, newModelName: '' }))}
                className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark bg-white focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="">Select a model...</option>
                {models.map((m) => (
                  <option key={m.name} value={m.name}>{m.fullName}</option>
                ))}
                <option value="__new__">+ Create new model folder...</option>
              </select>
            </div>

            {uploadForm.model === '__new__' && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  New Model Name <span className="font-normal">(real name or character name)</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.newModelName}
                  onChange={(e) => setUploadForm((f) => ({ ...f, newModelName: e.target.value }))}
                  placeholder="e.g., Sarah, Fatima, Zainab"
                  className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Image URL</label>
              <input
                type="url"
                value={uploadForm.url}
                onChange={(e) => setUploadForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">File Name</label>
              <input
                type="text"
                value={uploadForm.fileName}
                onChange={(e) => setUploadForm((f) => ({ ...f, fileName: e.target.value }))}
                placeholder="e.g., hero-portrait.png, treatment-botox.png"
                className="w-full px-3 py-2 border border-border-light rounded-lg text-sm text-text-dark focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>

          {uploadForm.model === '__new__' && (
            <p className="text-xs text-text-muted mb-3">
              A new folder will be created in Google Drive under Models. You can use this for real-world hired models or new AI characters.
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading || (!uploadForm.model || (uploadForm.model === '__new__' && !uploadForm.newModelName.trim())) || !uploadForm.url || !uploadForm.fileName}
              className="px-5 py-2 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload to Drive'}
            </button>
            <button
              onClick={() => { setShowUpload(false); setUploadResult(null); }}
              className="px-4 py-2 text-text-muted hover:text-text-dark text-sm transition-colors"
            >
              Cancel
            </button>
          </div>

          {uploadResult?.error && (
            <div className="mt-3 rounded-lg px-4 py-3 bg-red-50 text-red-700 text-sm border border-red-200">
              {uploadResult.error}
            </div>
          )}
        </div>
      )}

      {/* Model cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {models.map((model) => (
          <button
            key={model.name}
            onClick={() => setSelectedModel(model.name)}
            className="group text-left bg-white rounded-xl border border-border hover:border-gold/30 overflow-hidden transition-all hover:shadow-sm"
          >
            {/* Hero image */}
            <div className="aspect-[4/3] bg-warm-white relative overflow-hidden">
              {model.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={model.heroImage}
                  alt={model.fullName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl text-text-muted/30 font-serif">{model.name[0]}</span>
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-medium text-text-dark">
                  {model.driveImages.length} photos
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-text-dark">{model.fullName}</h3>
                  <p className="text-xs text-text-muted mt-0.5">Age {model.age}</p>
                </div>
              </div>
              <p className="text-xs text-text-muted leading-relaxed mb-3">{model.desc}</p>
              <div className="pt-3 border-t border-border-light">
                <p className="text-[10px] text-text-muted">
                  <span className="font-medium text-text-dark">Best for:</span> {model.use}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Visual Workflow */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-dark mb-4">Content Creation Workflow</h2>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {[
            { icon: '\uD83D\uDC64', label: 'Pick Model', desc: 'Select character', color: 'bg-purple-100 text-purple-700 border-purple-200' },
            { icon: '\uD83D\uDCCB', label: 'Content Type', desc: 'Post / Reel / Carousel / Ad', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { icon: '\u270D\uFE0F', label: 'Topic + Direction', desc: 'What to create', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            { icon: '\uD83E\uDDE0', label: 'AI Agents', desc: 'Copywriter + Designer', color: 'bg-green-100 text-green-700 border-green-200' },
            { icon: '\uD83D\uDDBC', label: 'Generate Images', desc: 'AI Image Engine', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { icon: '\uD83D\uDC41', label: 'Review', desc: 'Approve or revise', color: 'bg-pink-100 text-pink-700 border-pink-200' },
            { icon: '\uD83D\uDE80', label: 'Publish', desc: 'Instagram / Meta Ads', color: 'bg-gold-pale text-gold border-gold/30' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-start">
              <div className="flex flex-col items-center min-w-[100px]">
                <div className={`flex items-center justify-center w-14 h-14 rounded-2xl border text-2xl ${step.color}`}>
                  {step.icon}
                </div>
                <p className="text-[11px] font-medium text-text-dark mt-2 text-center">{step.label}</p>
                <p className="text-[9px] text-text-muted text-center mt-0.5 max-w-[90px] leading-tight">{step.desc}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="flex items-center h-14 px-0.5">
                  <div className="w-3 h-px bg-border" />
                  <span className="text-border text-[8px]">&#9654;</span>
                  <div className="w-3 h-px bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border-light text-center">
          <button
            onClick={() => { setCreatorMode(true); setCreatorStep(1); }}
            className="px-6 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Start Creating Content
          </button>
        </div>
      </div>

      {/* Model best-use — dynamic from loaded models */}
      {models.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="text-sm font-semibold text-text-dark mb-3">Who to use when</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {models.map((m) => (
              <div key={m.name} className="flex items-center gap-3 p-3 rounded-lg border border-border-light hover:border-gold/30 transition-colors">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-warm-white shrink-0">
                  {m.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.heroImage} alt={m.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted/30 font-serif text-lg">
                      {m.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-dark">{m.fullName}</p>
                  <p className="text-[10px] text-text-muted truncate">{m.use}</p>
                </div>
                <span className="text-[10px] text-text-muted shrink-0">{m.driveImages.length} photos</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical disclaimer */}
      <div className="bg-warm-white rounded-xl border border-border-light p-4 text-center">
        <p className="text-[10px] text-text-muted leading-relaxed">
          Individual results may vary. Consult with our medical professionals. Dr. Huma Abbas, Medical Director.
          All model images are AI-generated for marketing purposes.
        </p>
      </div>
    </div>
  );
}

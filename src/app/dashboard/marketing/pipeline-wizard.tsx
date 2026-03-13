'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  WizardStepIndicator,
  TopicPromptView,
  TopicLoadingView,
  TopicOptionsView,
  ChatResearchView,
  CopyReviewView,
  DesignReviewView,
  QAResultsView,
  FinalPreviewView,
  RevisePanel,
  PublishedView,
} from './wizard-steps';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WizardState =
  | 'IDLE'
  | 'TOPIC_PROMPT'
  | 'TOPIC_LOADING'
  | 'TOPIC_OPTIONS'
  | 'CHAT_OPEN'
  | 'CHAT_RESEARCHING'
  | 'COPY_LOADING'
  | 'COPY_REVIEW'
  | 'REVISE_COPY'
  | 'DESIGN_LOADING'
  | 'DESIGN_REVIEW'
  | 'REVISE_DESIGN'
  | 'QA_LOADING'
  | 'QA_RESULTS'
  | 'FINAL_PREVIEW'
  | 'PUBLISHING'
  | 'PUBLISHED';

export interface TopicOption {
  title: string;
  reasoning: string;
  content_type: string;
  treatment_category: string;
  engagement_estimate: string;
  character: string;
  research_note?: string;
}

export interface CopyData {
  headline?: string;
  caption?: string;
  character?: string;
  voiceover?: string;
}

export interface BrandAsset {
  id: string;
  name: string;
  thumbnailUrl: string;
}

export interface QACheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface QAResult {
  passed: boolean;
  checks: QACheck[];
}

export interface ReviseQuestion {
  id: string;
  label: string;
  question: string;
  type: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  topics?: TopicOption[];
}

// ---------------------------------------------------------------------------
// SSE helper
// ---------------------------------------------------------------------------

const STREAM_TIMEOUT_MS = 300_000; // 5 min client-side timeout

// Cache the pipeline token (valid 10 min, refresh at 8 min)
let cachedToken: { token: string; workerUrl: string; expires: number } | null = null;

async function getPipelineToken(): Promise<{ token: string; workerUrl: string }> {
  if (cachedToken && cachedToken.expires > Math.floor(Date.now() / 1000) + 120) {
    return cachedToken;
  }
  const res = await fetch('/api/al/pipeline-token');
  if (!res.ok) throw new Error('Failed to get pipeline token — are you logged in?');
  cachedToken = await res.json();
  return cachedToken!;
}

async function streamPipeline(
  body: Record<string, unknown>,
  onStep: (step: string) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onResult: (result: any) => void,
  onError: (error: string) => void,
  signal?: AbortSignal,
) {
  try {
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), STREAM_TIMEOUT_MS);

    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutController.signal])
      : timeoutController.signal;

    // Get auth token and call Railway directly (bypasses Netlify proxy timeout)
    const { token, workerUrl } = await getPipelineToken();

    const res = await fetch(`${workerUrl}/pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: combinedSignal,
    });

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      clearTimeout(timeout);
      const data = await res.json();
      if (!data.success) {
        onError(data.error || 'Request failed');
        return;
      }
    }

    const reader = res.body?.getReader();
    if (!reader) { clearTimeout(timeout); onError('No response stream'); return; }

    const decoder = new TextDecoder();
    let buffer = '';
    let gotResult = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'ping') continue;
            if (event.type === 'step') onStep(event.step);
            if (event.type === 'result') {
              gotResult = true;
              if (event.success) onResult(event);
              else onError(event.error || 'Pipeline failed');
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } finally {
      clearTimeout(timeout);
      reader.releaseLock();
    }

    // Stream ended without a result event — server timed out or crashed
    if (!gotResult) {
      onError('Connection lost — the server may have timed out. Please try again.');
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // Distinguish user cancel vs timeout
      if (signal?.aborted) {
        onError('Cancelled');
      } else {
        onError('Request timed out — the pipeline took too long. Please try again.');
      }
      return;
    }
    onError(err instanceof Error ? err.message : 'Request failed');
  }
}

// ---------------------------------------------------------------------------
// Wizard Component
// ---------------------------------------------------------------------------

interface PipelineWizardProps {
  open: boolean;
  onClose: () => void;
  entryPoint: 'auto' | 'research';
  onComplete?: () => void;
}

export default function PipelineWizard({ open, onClose, entryPoint, onComplete }: PipelineWizardProps) {
  const [state, setState] = useState<WizardState>('IDLE');
  const [loadingStep, setLoadingStep] = useState('');
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicOption | null>(null);
  const [copy, setCopy] = useState<CopyData>({});
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [aiImages, setAiImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qaResults, setQaResults] = useState<QAResult | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reviseQuestions, setReviseQuestions] = useState<ReviseQuestion[]>([]);
  const [reviseContext, setReviseContext] = useState<'copy' | 'design'>('copy');
  const [publishFacebook, setPublishFacebook] = useState(false);
  const [publishResult, setPublishResult] = useState<Record<string, unknown> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancelPipeline = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  // Create a fresh AbortController and return its signal
  const newAbortSignal = useCallback(() => {
    abortRef.current?.abort(); // cancel any previous request
    abortRef.current = new AbortController();
    return abortRef.current.signal;
  }, []);

  // Track which wizard step we're on (for the indicator)
  const currentStep = (() => {
    if (['IDLE', 'TOPIC_PROMPT', 'TOPIC_LOADING', 'TOPIC_OPTIONS', 'CHAT_OPEN', 'CHAT_RESEARCHING'].includes(state)) return 0;
    if (['COPY_LOADING', 'COPY_REVIEW', 'REVISE_COPY'].includes(state)) return 1;
    if (['DESIGN_LOADING', 'DESIGN_REVIEW', 'REVISE_DESIGN'].includes(state)) return 2;
    if (['QA_LOADING', 'QA_RESULTS'].includes(state)) return 3;
    if (['FINAL_PREVIEW', 'PUBLISHING', 'PUBLISHED'].includes(state)) return 4;
    return 0;
  })();

  const reset = useCallback(() => {
    setState('IDLE');
    setLoadingStep('');
    setTopics([]);
    setSelectedTopic(null);
    setCopy({});
    setBrandAssets([]);
    setAiImages([]);
    setSelectedImage(null);
    setQaResults(null);
    setDraftId(null);
    setError(null);
    setChatMessages([]);
    setReviseQuestions([]);
    setPublishFacebook(false);
    setPublishResult(null);
  }, []);

  // ---- Entry Points ----

  const startAutoCreate = useCallback(async (treatmentHint?: string) => {
    setState('TOPIC_LOADING');
    setError(null);

    const body: Record<string, unknown> = { action: 'research_topics' };
    if (treatmentHint) body.params = { treatment: treatmentHint };

    await streamPipeline(
      body,
      (step) => setLoadingStep(step),
      (result) => {
        setTopics(result.topics || []);
        setState('TOPIC_OPTIONS');
      },
      (err) => { setError(err); setState('TOPIC_PROMPT'); },
      newAbortSignal(),
    );
  }, [newAbortSignal]);

  const startChatResearch = useCallback(() => {
    setState('CHAT_OPEN');
    setChatMessages([{
      role: 'assistant',
      content: 'What would you like to create today? I can research any topic for you — just describe what you have in mind.',
    }]);
  }, []);

  const sendChatMessage = useCallback(async (message: string) => {
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: message }];
    setChatMessages(updatedMessages);
    setState('CHAT_RESEARCHING');

    // Send full conversation history so worker has context across turns
    const history = updatedMessages
      .filter(m => !m.topics) // exclude topic metadata, just conversational text
      .map(m => ({ role: m.role, content: m.content }));

    await streamPipeline(
      { action: 'chat_research', params: { message, history } },
      (step) => setLoadingStep(step),
      (result) => {
        setChatMessages((prev) => [...prev, {
          role: 'assistant',
          content: result.chatResponse || 'Here are some content ideas:',
          topics: result.topics,
        }]);
        if (result.topics?.length) setTopics(result.topics);
        setState('CHAT_OPEN');
      },
      (err) => {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err}` }]);
        setState('CHAT_OPEN');
      },
      newAbortSignal(),
    );
  }, [newAbortSignal]);

  // ---- Pipeline Runner ----

  // Generate carousel images in a separate call (avoids 60s timeout)
  const generateCarouselImages = useCallback(async (draftIdForImages: string) => {
    setState('DESIGN_LOADING');
    setLoadingStep('Generating carousel slides...');

    await streamPipeline(
      { action: 'generate_carousel_images', params: { draftId: draftIdForImages } },
      (step) => setLoadingStep(step),
      (result) => {
        setAiImages(result.aiImages || []);
        setQaResults(result.qaResults || null);
        setState('COPY_REVIEW');
      },
      (err) => { setError(err); setState('COPY_REVIEW'); },
      newAbortSignal(),
    );
  }, [newAbortSignal]);

  const selectTopic = useCallback(async (topic: TopicOption) => {
    setSelectedTopic(topic);
    setState('COPY_LOADING');
    setError(null);

    await streamPipeline(
      { action: 'run_pipeline', topic: topic.title, contentType: topic.content_type, params: { character: topic.character } },
      (step) => setLoadingStep(step),
      (result) => {
        setDraftId(result.draftId);
        setCopy(result.copy || {});
        setBrandAssets(result.brandAssets || []);

        // Carousel: images come from a second call
        if (topic.content_type === 'carousel' && (!result.aiImages || result.aiImages.length === 0)) {
          setAiImages([]);
          setQaResults(null);
          generateCarouselImages(result.draftId);
        } else {
          setAiImages(result.aiImages || []);
          setQaResults(result.qaResults || null);
          setState('COPY_REVIEW');
        }
      },
      (err) => { setError(err); setState('TOPIC_OPTIONS'); },
      newAbortSignal(),
    );
  }, [newAbortSignal, generateCarouselImages]);

  // ---- Approve / Navigate ----

  const approveCopy = useCallback(() => {
    setState('DESIGN_REVIEW');
  }, []);

  const approveDesign = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    // Save selected image to draft
    if (draftId) {
      fetch('/api/al/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_design', draftId, params: { imageUrl } }),
      }).catch(() => {});
    }

    if (qaResults && !qaResults.passed) {
      setState('QA_RESULTS');
    } else {
      setState('FINAL_PREVIEW');
    }
  }, [draftId, qaResults]);

  const regenerateImages = useCallback(async () => {
    setState('DESIGN_LOADING');
    setError(null);

    // Use revise_apply with empty answers to regenerate
    await streamPipeline(
      { action: 'revise_apply', params: { draftId, context: 'design', answers: { request: 'Generate new variations' } } },
      (step) => setLoadingStep(step),
      (result) => {
        if (result.aiImages) setAiImages(result.aiImages);
        setState('DESIGN_REVIEW');
      },
      (err) => { setError(err); setState('DESIGN_REVIEW'); },
      newAbortSignal(),
    );
  }, [draftId, newAbortSignal]);

  // ---- Revise Flow ----

  const startRevise = useCallback(async (context: 'copy' | 'design') => {
    setReviseContext(context);
    setReviseQuestions([]);

    await streamPipeline(
      { action: 'revise_ask', params: { draftId, context } },
      () => {},
      (result) => {
        setReviseQuestions(result.questions || []);
        setState(context === 'copy' ? 'REVISE_COPY' : 'REVISE_DESIGN');
      },
      (err) => { setError(err); },
      newAbortSignal(),
    );
  }, [draftId, newAbortSignal]);

  const submitRevision = useCallback(async (answers: Record<string, string>) => {
    const context = reviseContext;
    setState(context === 'copy' ? 'COPY_LOADING' : 'DESIGN_LOADING');

    await streamPipeline(
      { action: 'revise_apply', params: { draftId, context, answers } },
      (step) => setLoadingStep(step),
      (result) => {
        if (context === 'copy' && result.copy) {
          setCopy(result.copy);
          setState('COPY_REVIEW');
        } else if (context === 'design' && result.aiImages) {
          setAiImages(result.aiImages);
          setState('DESIGN_REVIEW');
        } else {
          setState(context === 'copy' ? 'COPY_REVIEW' : 'DESIGN_REVIEW');
        }
      },
      (err) => {
        setError(err);
        setState(context === 'copy' ? 'COPY_REVIEW' : 'DESIGN_REVIEW');
      },
      newAbortSignal(),
    );
  }, [draftId, reviseContext, newAbortSignal]);

  // ---- Publish ----

  const publish = useCallback(async () => {
    setState('PUBLISHING');
    try {
      const res = await fetch('/api/al/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish_all',
          draftId,
          params: { facebook: publishFacebook },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishResult(data.published);
        setState('PUBLISHED');
      } else {
        setError(data.error || 'Publish failed');
        setState('FINAL_PREVIEW');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
      setState('FINAL_PREVIEW');
    }
  }, [draftId, publishFacebook]);

  // ---- Start on open ----

  const handleOpen = useCallback(() => {
    reset();
    if (entryPoint === 'auto') setState('TOPIC_PROMPT');
    else startChatResearch();
  }, [entryPoint, reset, startChatResearch]);

  // Auto-start when opened (useEffect to avoid state update during render)
  useEffect(() => {
    if (open && state === 'IDLE') handleOpen();
  }, [open, state, handleOpen]);

  if (!open) return null;

  const handleClose = () => {
    cancelPipeline();
    reset();
    onClose();
  };

  const showStepIndicator = currentStep >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Wizard container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[slideUp_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-warm-white">
          <div>
            <h2 className="font-serif text-lg font-semibold text-text-dark">
              {state === 'PUBLISHED' ? 'Published!' : 'Create Content'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {entryPoint === 'auto' ? 'AI-powered content creation' : 'Research & create'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        {showStepIndicator && (
          <div className="px-6 py-3 border-b border-border-light">
            <WizardStepIndicator currentStep={currentStep} />
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="px-6 py-2 bg-red-50 border-b border-red-200">
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* TOPIC_PROMPT */}
          {state === 'TOPIC_PROMPT' && (
            <TopicPromptView
              onSubmit={(hint) => startAutoCreate(hint || undefined)}
              onSkip={() => startAutoCreate()}
            />
          )}

          {/* TOPIC_LOADING */}
          {state === 'TOPIC_LOADING' && (
            <TopicLoadingView step={loadingStep} onCancel={handleClose} />
          )}

          {/* TOPIC_OPTIONS */}
          {state === 'TOPIC_OPTIONS' && (
            <TopicOptionsView topics={topics} onSelect={selectTopic} />
          )}

          {/* CHAT */}
          {(state === 'CHAT_OPEN' || state === 'CHAT_RESEARCHING') && (
            <ChatResearchView
              messages={chatMessages}
              isLoading={state === 'CHAT_RESEARCHING'}
              onSend={sendChatMessage}
              onSelectTopic={selectTopic}
            />
          )}

          {/* COPY_LOADING */}
          {(state === 'COPY_LOADING' || state === 'DESIGN_LOADING' || state === 'QA_LOADING') && (
            <TopicLoadingView step={loadingStep} onCancel={handleClose} />
          )}

          {/* COPY_REVIEW */}
          {state === 'COPY_REVIEW' && (
            <CopyReviewView
              copy={copy}
              contentType={selectedTopic?.content_type || 'post'}
              onApprove={approveCopy}
              onRevise={() => startRevise('copy')}
              onBack={() => setState('TOPIC_OPTIONS')}
            />
          )}

          {/* REVISE_COPY / REVISE_DESIGN */}
          {(state === 'REVISE_COPY' || state === 'REVISE_DESIGN') && (
            <RevisePanel
              context={reviseContext}
              questions={reviseQuestions}
              onSubmit={submitRevision}
              onCancel={() => setState(reviseContext === 'copy' ? 'COPY_REVIEW' : 'DESIGN_REVIEW')}
            />
          )}

          {/* DESIGN_REVIEW */}
          {state === 'DESIGN_REVIEW' && (
            <DesignReviewView
              brandAssets={brandAssets}
              aiImages={aiImages}
              onSelect={approveDesign}
              onRegenerate={regenerateImages}
              onRevise={() => startRevise('design')}
              onBack={() => setState('COPY_REVIEW')}
            />
          )}

          {/* QA_RESULTS */}
          {state === 'QA_RESULTS' && qaResults && (
            <QAResultsView
              results={qaResults}
              onFixCopy={() => setState('COPY_REVIEW')}
              onFixDesign={() => setState('DESIGN_REVIEW')}
              onContinue={() => setState('FINAL_PREVIEW')}
            />
          )}

          {/* FINAL_PREVIEW */}
          {state === 'FINAL_PREVIEW' && (
            <FinalPreviewView
              copy={copy}
              imageUrl={selectedImage || aiImages[0]}
              contentType={selectedTopic?.content_type || 'post'}
              publishFacebook={publishFacebook}
              onToggleFacebook={() => setPublishFacebook(!publishFacebook)}
              onPublish={publish}
              onReviseCopy={() => startRevise('copy')}
              onReviseDesign={() => startRevise('design')}
              onReject={handleClose}
            />
          )}

          {/* PUBLISHING */}
          {state === 'PUBLISHING' && (
            <TopicLoadingView step="Publishing to Instagram..." onCancel={handleClose} />
          )}

          {/* PUBLISHED */}
          {state === 'PUBLISHED' && (
            <PublishedView
              result={publishResult}
              onCreateAnother={() => {
                reset();
                if (entryPoint === 'auto') setState('TOPIC_PROMPT');
                else startChatResearch();
              }}
              onDone={() => {
                handleClose();
                onComplete?.();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

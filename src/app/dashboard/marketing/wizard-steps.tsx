'use client';

import { useState, useRef, useEffect } from 'react';
import type {
  TopicOption,
  CopyData,
  BrandAsset,
  QAResult,
  ReviseQuestion,
  ChatMessage,
} from './pipeline-wizard';

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

const STEPS = ['Topic', 'Copy', 'Design', 'QA', 'Publish'];

export function WizardStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={label} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              done ? 'bg-green-100 text-green-700' :
              active ? 'bg-gold/15 text-gold' :
              'bg-gray-100 text-text-muted'
            }`}>
              {done ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : active ? (
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              )}
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px ${done ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Topic Loading
// ---------------------------------------------------------------------------

export function TopicLoadingView({ step, onCancel }: { step: string; onCancel?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-gold/20 border-t-gold animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-text-dark">{step || 'Processing...'}</p>
        <p className="text-xs text-text-muted mt-1">This may take a moment</p>
      </div>
      {/* Animated gold progress bar */}
      <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light rounded-full animate-[shimmer_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-2 px-4 py-1.5 text-xs font-medium text-text-muted hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Topic Options (cards grid)
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  face: 'bg-pink-100 text-pink-700',
  body: 'bg-purple-100 text-purple-700',
  hair: 'bg-amber-100 text-amber-700',
  skin: 'bg-blue-100 text-blue-700',
  general: 'bg-gray-100 text-gray-600',
};

const CHARACTER_AVATARS: Record<string, string> = {
  ayesha: 'A',
  meher: 'M',
  noor: 'N',
  usman: 'U',
};

export function TopicOptionsView({
  topics,
  onSelect,
}: {
  topics: TopicOption[];
  onSelect: (topic: TopicOption) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-dark mb-1">Choose a Topic</h3>
      <p className="text-xs text-text-muted mb-5">Select a topic to start the content pipeline</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic, i) => (
          <button
            key={i}
            onClick={() => {
              setSelected(i);
              setTimeout(() => onSelect(topic), 300);
            }}
            className={`text-left rounded-xl border-2 p-5 transition-all hover:shadow-md ${
              selected === i
                ? 'border-gold bg-gold/5 shadow-md'
                : 'border-border hover:border-gold/30 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h4 className="font-serif text-base font-semibold text-text-dark leading-snug">
                {topic.title}
              </h4>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gold/15 text-gold shrink-0`}>
                {CHARACTER_AVATARS[topic.character] || '?'}
              </div>
            </div>

            <p className="text-xs text-text-muted leading-relaxed mb-3">{topic.reasoning}</p>

            {topic.research_note && (
              <p className="text-[11px] text-blue-600 bg-blue-50 rounded-lg px-2.5 py-1.5 mb-3 leading-relaxed">
                {topic.research_note}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold/10 text-gold">
                {topic.content_type}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORY_COLORS[topic.treatment_category] || CATEGORY_COLORS.general}`}>
                {topic.treatment_category}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                topic.engagement_estimate === 'high' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {topic.engagement_estimate} engagement
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Research
// ---------------------------------------------------------------------------

export function ChatResearchView({
  messages,
  isLoading,
  onSend,
  onSelectTopic,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onSelectTopic: (topic: TopicOption) => void;
}) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gold text-white rounded-br-sm'
                  : 'bg-warm-white text-text-dark rounded-bl-sm border border-border-light'
              }`}>
                {msg.content}
              </div>
            </div>

            {/* Topic cards within assistant messages */}
            {msg.topics && msg.topics.length > 0 && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                {msg.topics.map((topic, j) => (
                  <button
                    key={j}
                    onClick={() => onSelectTopic(topic)}
                    className="text-left rounded-lg border border-border hover:border-gold/30 p-3 transition-all hover:shadow-sm bg-white"
                  >
                    <h5 className="text-sm font-medium text-text-dark mb-1">{topic.title}</h5>
                    <p className="text-[11px] text-text-muted leading-relaxed">{topic.reasoning}</p>
                    <div className="flex gap-1 mt-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gold/10 text-gold">{topic.content_type}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${CATEGORY_COLORS[topic.treatment_category] || CATEGORY_COLORS.general}`}>
                        {topic.treatment_category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-warm-white rounded-xl px-4 py-3 border border-border-light">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gold/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gold/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-border-light pt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe what you want to create..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-gold disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="px-5 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy Review (Step 1 pause)
// ---------------------------------------------------------------------------

export function CopyReviewView({
  copy,
  contentType,
  onApprove,
  onRevise,
  onBack,
}: {
  copy: CopyData;
  contentType: string;
  onApprove: () => void;
  onRevise: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-dark mb-4">Review Copy</h3>

      {/* Headline */}
      {copy.headline && (
        <div className="mb-4">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-1">Headline</p>
          <h4 className="font-serif text-xl font-semibold text-text-dark">{copy.headline}</h4>
        </div>
      )}

      {/* Character badge */}
      {copy.character && (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center text-xs font-bold text-gold">
            {CHARACTER_AVATARS[copy.character] || '?'}
          </div>
          <span className="text-xs text-text-muted capitalize">{copy.character}</span>
          <span className="text-[10px] text-text-muted uppercase">{contentType}</span>
        </div>
      )}

      {/* Caption */}
      {copy.caption && (
        <div className="bg-warm-white rounded-xl p-5 border border-border-light mb-4">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-2">Instagram Caption</p>
          <p className="text-sm text-text-dark whitespace-pre-line leading-relaxed">{copy.caption}</p>
        </div>
      )}

      {/* Voiceover (reels) */}
      {copy.voiceover && (
        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mb-4">
          <p className="text-[10px] font-medium text-blue-700 uppercase tracking-wide mb-2">Voiceover Script</p>
          <p className="text-sm text-text-dark leading-relaxed">{copy.voiceover}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onApprove}
          className="px-6 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
        >
          Approve & Continue
        </button>
        <button
          onClick={onRevise}
          className="px-5 py-2.5 text-sm font-medium text-gold border border-gold/30 rounded-lg hover:bg-gold/5 transition-colors"
        >
          Revise
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-sm text-text-muted hover:text-text-dark transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Design Review (Step 2 pause)
// ---------------------------------------------------------------------------

export function DesignReviewView({
  brandAssets,
  aiImages,
  onSelect,
  onRegenerate,
  onRevise,
  onBack,
}: {
  brandAssets: BrandAsset[];
  aiImages: string[];
  onSelect: (imageUrl: string) => void;
  onRegenerate: () => void;
  onRevise: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-dark mb-4">Choose an Image</h3>
      <p className="text-xs text-text-muted mb-5">Click an image to use it as the final design</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Brand Library column */}
        {brandAssets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-text-dark">From Your Brand Library</h4>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-100 text-green-700">FREE</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {brandAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => onSelect(asset.thumbnailUrl)}
                  className="group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-gold transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gold/0 group-hover:bg-gold/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-gold px-3 py-1.5 rounded-full shadow transition-opacity">
                      Use This
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted truncate p-1.5">{asset.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Generated column */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-text-dark">AI Generated</h4>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-100 text-blue-700">AI</span>
            </div>
            <button
              onClick={onRegenerate}
              className="text-[11px] text-gold hover:text-gold-dark font-medium"
            >
              Regenerate
            </button>
          </div>
          {aiImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {aiImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(url)}
                  className="group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-gold transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`AI Option ${i + 1}`} className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-gold/0 group-hover:bg-gold/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-gold px-3 py-1.5 rounded-full shadow transition-opacity">
                      Use This
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-200">
              <p className="text-xs text-text-muted">No AI images generated</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-5">
        <button
          onClick={onRevise}
          className="px-5 py-2.5 text-sm font-medium text-gold border border-gold/30 rounded-lg hover:bg-gold/5 transition-colors"
        >
          Revise Design
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-sm text-text-muted hover:text-text-dark transition-colors"
        >
          Back to Copy
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QA Results (Step 3)
// ---------------------------------------------------------------------------

export function QAResultsView({
  results,
  onFixCopy,
  onFixDesign,
  onContinue,
}: {
  results: QAResult;
  onFixCopy: () => void;
  onFixDesign: () => void;
  onContinue: () => void;
}) {
  const failedChecks = results.checks.filter((c) => !c.passed);
  const hasCopyIssues = failedChecks.some((c) =>
    ['Caption length', 'Hook first line', 'CTA present', 'Medical disclaimer', 'No prices', 'Headline length'].includes(c.name)
  );
  const hasDesignIssues = failedChecks.some((c) =>
    ['Images available', 'Carousel slides', 'Image dimensions'].includes(c.name)
  );

  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-dark mb-4">Quality Check</h3>

      <div className="space-y-2 mb-5">
        {results.checks.map((check, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
            check.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <span className={`text-base ${check.passed ? 'text-green-600' : 'text-red-500'}`}>
              {check.passed ? '\u2713' : '\u2717'}
            </span>
            <div className="flex-1">
              <span className="text-sm font-medium text-text-dark">{check.name}</span>
              <span className="text-xs text-text-muted ml-2">{check.detail}</span>
            </div>
          </div>
        ))}
      </div>

      {results.passed ? (
        <div className="flex items-center gap-3">
          <button
            onClick={onContinue}
            className="px-6 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
          >
            Continue to Preview
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {hasCopyIssues && (
            <button
              onClick={onFixCopy}
              className="px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Fix Copy
            </button>
          )}
          {hasDesignIssues && (
            <button
              onClick={onFixDesign}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fix Design
            </button>
          )}
          <button
            onClick={onContinue}
            className="px-4 py-2.5 text-sm text-text-muted hover:text-text-dark transition-colors"
          >
            Continue Anyway
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Final Preview (Step 4 pause)
// ---------------------------------------------------------------------------

export function FinalPreviewView({
  copy,
  imageUrl,
  contentType,
  publishFacebook,
  onToggleFacebook,
  onPublish,
  onReviseCopy,
  onReviseDesign,
  onReject,
}: {
  copy: CopyData;
  imageUrl?: string;
  contentType: string;
  publishFacebook: boolean;
  onToggleFacebook: () => void;
  onPublish: () => void;
  onReviseCopy: () => void;
  onReviseDesign: () => void;
  onReject: () => void;
}) {
  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-dark mb-4">Final Preview</h3>

      {/* Instagram-style mockup */}
      <div className="max-w-sm mx-auto bg-white rounded-xl border border-border overflow-hidden shadow-sm mb-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-white text-xs font-bold">AL</div>
          <div>
            <p className="text-xs font-semibold text-text-dark">Aesthetic Lounge</p>
            <p className="text-[10px] text-text-muted">DHA Phase 7, Lahore</p>
          </div>
        </div>

        {/* Image */}
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={imageUrl} alt="Post preview" className="w-full aspect-[4/5] object-cover" />
        ) : (
          <div className="w-full aspect-[4/5] bg-gray-100 flex items-center justify-center">
            <p className="text-sm text-text-muted">No image selected</p>
          </div>
        )}

        {/* Caption */}
        <div className="px-4 py-3">
          {copy.headline && (
            <p className="text-xs font-bold text-text-dark mb-1">{copy.headline}</p>
          )}
          {copy.caption && (
            <p className="text-xs text-text-dark leading-relaxed whitespace-pre-line">
              {copy.caption.slice(0, 300)}{copy.caption.length > 300 ? '...' : ''}
            </p>
          )}
          {copy.character && (
            <p className="text-[10px] text-text-muted mt-2 capitalize">Model: {copy.character}</p>
          )}
        </div>
      </div>

      {/* Platform toggles */}
      <div className="mb-5 space-y-3">
        <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-warm-white">
          <div className="flex items-center gap-2">
            <span className="text-base">Instagram</span>
            <span className="text-xs text-text-muted capitalize">{contentType}</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">ON</span>
        </div>

        <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-warm-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">Facebook</span>
              <button
                onClick={onToggleFacebook}
                className={`w-9 h-5 rounded-full transition-colors relative ${publishFacebook ? 'bg-gold' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${publishFacebook ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
            <p className="text-[10px] text-amber-600 mt-0.5">Not recommended — Pakistan FB audience quality is poor</p>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${publishFacebook ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {publishFacebook ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onPublish}
          className="px-6 py-2.5 bg-gold text-white text-sm font-semibold rounded-lg hover:bg-gold-dark transition-colors shadow-sm"
        >
          Publish
        </button>
        <button
          onClick={onReviseCopy}
          className="px-4 py-2.5 text-sm font-medium text-gold border border-gold/30 rounded-lg hover:bg-gold/5 transition-colors"
        >
          Revise Copy
        </button>
        <button
          onClick={onReviseDesign}
          className="px-4 py-2.5 text-sm font-medium text-gold border border-gold/30 rounded-lg hover:bg-gold/5 transition-colors"
        >
          Revise Design
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2.5 text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revise Panel
// ---------------------------------------------------------------------------

export function RevisePanel({
  context,
  questions,
  onSubmit,
  onCancel,
}: {
  context: 'copy' | 'design';
  questions: ReviseQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-gold/20 border-t-gold animate-spin" />
        <p className="text-sm text-text-muted">Preparing revision questions...</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-dark mb-1">
        Revise {context === 'copy' ? 'Copy' : 'Design'}
      </h3>
      <p className="text-xs text-text-muted mb-5">
        Answer these questions so we can improve the {context}
      </p>

      <div className="space-y-4 mb-5">
        {questions.map((q) => (
          <div key={q.id}>
            <label className="block text-sm font-medium text-text-dark mb-1.5">{q.label}</label>
            <p className="text-xs text-text-muted mb-2">{q.question}</p>
            <input
              type="text"
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-gold"
              placeholder="Your answer..."
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onSubmit(answers)}
          disabled={Object.values(answers).every((v) => !v.trim())}
          className="px-6 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
        >
          Regenerate
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm text-text-muted hover:text-text-dark transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Published
// ---------------------------------------------------------------------------

export function PublishedView({
  result,
  onCreateAnother,
  onDone,
}: {
  result: Record<string, unknown> | null;
  onCreateAnother: () => void;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      {/* Success icon with decorative border */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M8 16L14 22L24 10" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute -inset-3 rounded-full border-2 border-dashed border-gold/30 animate-spin" style={{ animationDuration: '8s' }} />
      </div>

      <div className="text-center">
        <h3 className="font-serif text-xl font-semibold text-text-dark mb-1">Content Published!</h3>
        <p className="text-sm text-text-muted">Your post is now live on Instagram</p>
      </div>

      {result && (
        <div className="bg-green-50 rounded-lg px-4 py-3 text-xs text-green-700 border border-green-200 max-w-sm">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(result as any).instagram?.id && (
            <p>Instagram Post ID: {String((result as Record<string, { id: string }>).instagram?.id)}</p>
          )}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(result as any).facebook?.id && (
            <p className="mt-1">Facebook Post ID: {String((result as Record<string, { id: string }>).facebook?.id)}</p>
          )}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(result as any).facebookError && (
            <p className="mt-1 text-amber-600">Facebook: {String((result as Record<string, string>).facebookError)}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onCreateAnother}
          className="px-6 py-2.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold-dark transition-colors"
        >
          Create Another
        </button>
        <button
          onClick={onDone}
          className="px-5 py-2.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

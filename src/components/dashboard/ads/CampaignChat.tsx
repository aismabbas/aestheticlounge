'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignState {
  stage: 'researching' | 'planning' | 'creating' | 'reviewing' | 'ready';
  treatment?: string;
  angle?: string;
  hookType?: string;
  model?: string;
  headline?: string;
  primaryText?: string;
  audience?: Record<string, unknown>;
  leadCapture?: 'instant_form' | 'landing_page';
  leadFormId?: string;
  landingPageSlug?: string;
  draftId?: string;
  imageUrls?: string[];
  budget?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  creative?: {
    headline?: string;
    primaryText?: string;
    description?: string;
    caption?: string;
    imageUrls?: string[];
    draftId?: string;
    qaResults?: { passed: boolean; checks: { name: string; passed: boolean; detail: string }[] };
  };
}

interface CampaignChatProps {
  open: boolean;
  onClose: () => void;
  onCampaignCreated?: () => void;
}

// ---------------------------------------------------------------------------
// Stage Labels
// ---------------------------------------------------------------------------

const stageLabels: Record<string, string> = {
  researching: 'Researching',
  planning: 'Planning',
  creating: 'Creating',
  reviewing: 'Reviewing',
  ready: 'Ready to Create',
};

const stageColors: Record<string, string> = {
  researching: 'bg-blue-100 text-blue-700',
  planning: 'bg-amber-100 text-amber-700',
  creating: 'bg-purple-100 text-purple-700',
  reviewing: 'bg-green-100 text-green-700',
  ready: 'bg-gold/20 text-gold',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CampaignChat({ open, onClose, onCampaignCreated }: CampaignChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [campaignState, setCampaignState] = useState<CampaignState>({ stage: 'researching' });
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      if (messages.length === 0) {
        setMessages([{
          role: 'assistant',
          content: "What would you like to promote? I can research what's trending in DHA Lahore, or you can tell me your idea and I'll help shape it into a campaign.",
        }]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ---------------------------------------------------------------------------
  // Send Message
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    setStep('Thinking...');

    try {
      const res = await fetch('/api/al/ads/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, campaignState }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let data;
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            continue; // skip malformed SSE chunks
          }

          if (data.type === 'ping') continue;

          if (data.type === 'step') {
            setStep(data.step);
          }

          if (data.type === 'result') {
            setStep('');
            if (data.success) {
              const newState = data.campaignState || campaignState;
              setCampaignState(newState);

              setMessages((prev) => [...prev, {
                role: 'assistant',
                content: data.chatResponse || 'Done.',
                creative: data.creative,
              }]);
            } else {
              setMessages((prev) => [...prev, {
                role: 'assistant',
                content: `Error: ${data.error}`,
              }]);
            }
          }
        }
      }

      // Process any remaining buffer after stream ends
      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (data.type === 'result') {
            setStep('');
            if (data.success) {
              const newState = data.campaignState || campaignState;
              setCampaignState(newState);
              setMessages((prev) => [...prev, {
                role: 'assistant',
                content: data.chatResponse || 'Done.',
                creative: data.creative,
              }]);
            } else {
              setMessages((prev) => [...prev, {
                role: 'assistant',
                content: `Error: ${data.error}`,
              }]);
            }
          }
        } catch { /* incomplete chunk at end — ignore */ }
      }
    } catch (err) {
      console.error('[CampaignChat] Error:', err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
      setStep('');
    }
  }, [input, loading, campaignState]);

  // ---------------------------------------------------------------------------
  // Create Campaign on Meta
  // ---------------------------------------------------------------------------

  const handleCreateCampaign = async () => {
    if (!campaignState.treatment || !campaignState.headline) return;
    if (!campaignState.imageUrls || campaignState.imageUrls.length === 0) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'No ad images available. Please generate creative first before creating the campaign.',
      }]);
      return;
    }
    setCreating(true);

    try {
      // Step 1: Create campaign
      const campRes = await fetch('/api/dashboard/ads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'campaign',
          name: `${campaignState.treatment} — ${new Date().toLocaleDateString('en-CA')}`,
          dailyBudget: campaignState.budget || 3,
        }),
      });
      const campData = await campRes.json();
      if (!campData.success) throw new Error(campData.error || 'Campaign creation failed');
      if (!campData.metaId) throw new Error('Campaign created but no Meta ID returned');

      // Step 2: Create ad set with audience
      const targeting = campaignState.audience || {
        geo_locations: { cities: [{ key: '2211096', radius: 5, distance_unit: 'kilometer' }] },
        age_min: 25,
        age_max: 50,
        genders: [2],
        flexible_spec: [{ interests: [{ id: '6003139266461', name: 'Beauty' }] }],
      };

      const adsetRes = await fetch('/api/dashboard/ads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'adset',
          campaignId: campData.metaId,
          name: `${campaignState.treatment} — ${campaignState.angle || 'default'}`,
          dailyBudget: campaignState.budget || 3,
          targeting,
        }),
      });
      const adsetData = await adsetRes.json();
      if (!adsetData.success) throw new Error(adsetData.error || 'Ad set creation failed');
      if (!adsetData.metaId) throw new Error('Ad set created but no Meta ID returned');

      // Step 3: Create ad
      const adRes = await fetch('/api/dashboard/ads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ad',
          adSetId: adsetData.metaId,
          name: campaignState.headline,
          headline: campaignState.headline,
          body: campaignState.primaryText || '',
          imageUrl: campaignState.imageUrls?.[0],
          ctaType: campaignState.leadCapture === 'landing_page' ? 'LEARN_MORE' : 'BOOK_TRAVEL',
          leadFormId: campaignState.leadFormId || undefined,
          leadCaptureType: campaignState.leadCapture || 'instant_form',
          landingPageSlug: campaignState.landingPageSlug,
        }),
      });
      const adData = await adRes.json();
      if (!adData.success) throw new Error(adData.error || 'Ad creation failed');
      if (!adData.metaId) throw new Error('Ad created but no Meta ID returned');

      setCampaignState((prev) => ({ ...prev, stage: 'ready' }));
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Campaign created on Meta as PAUSED. Go to Ads Manager to review and activate.\n\nCampaign: ${campData.metaId}\nAd Set: ${adsetData.metaId}\nAd: ${adData.metaId}`,
      }]);

      onCampaignCreated?.();
    } catch (err) {
      console.error('[CampaignChat] Create error:', err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Failed to create campaign: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }]);
    } finally {
      setCreating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Chat Panel */}
      <div className="relative ml-auto flex h-full w-full max-w-[700px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-text-dark">Campaign Planner</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColors[campaignState.stage] || 'bg-gray-100 text-gray-600'}`}>
                {stageLabels[campaignState.stage] || campaignState.stage}
              </span>
              {campaignState.treatment && (
                <span className="text-xs text-text-muted">{campaignState.treatment}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-warm-white transition-colors">
            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Campaign State Sidebar (compact) */}
        {(campaignState.treatment || campaignState.angle || campaignState.model) && (
          <div className="border-b border-border-light bg-warm-white/50 px-6 py-3">
            <div className="flex flex-wrap gap-3 text-xs">
              {campaignState.treatment && (
                <span className="rounded bg-white px-2 py-1 border border-border-light">
                  <strong>Treatment:</strong> {campaignState.treatment}
                </span>
              )}
              {campaignState.angle && (
                <span className="rounded bg-white px-2 py-1 border border-border-light">
                  <strong>Angle:</strong> {campaignState.angle}
                </span>
              )}
              {campaignState.model && (
                <span className="rounded bg-white px-2 py-1 border border-border-light">
                  <strong>Model:</strong> {campaignState.model}
                </span>
              )}
              {campaignState.budget && (
                <span className="rounded bg-white px-2 py-1 border border-border-light">
                  <strong>Budget:</strong> ${campaignState.budget}/day
                </span>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gold text-white rounded-br-md'
                  : 'bg-warm-white text-text-dark rounded-bl-md border border-border-light'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Creative Preview */}
                {msg.creative && (
                  <div className="mt-3 space-y-3 border-t border-border-light pt-3">
                    {msg.creative.imageUrls && msg.creative.imageUrls.length > 0 && (
                      <div className="flex gap-2">
                        {msg.creative.imageUrls.map((url, j) => (
                          <img
                            key={j}
                            src={url}
                            alt={`Ad creative ${j + 1}`}
                            className="w-32 h-32 object-cover rounded-lg border border-border"
                          />
                        ))}
                      </div>
                    )}
                    {msg.creative.headline && (
                      <div>
                        <p className="text-xs font-semibold text-text-muted">Headline</p>
                        <p className="font-medium">{msg.creative.headline}</p>
                      </div>
                    )}
                    {msg.creative.primaryText && (
                      <div>
                        <p className="text-xs font-semibold text-text-muted">Primary Text</p>
                        <p>{msg.creative.primaryText}</p>
                      </div>
                    )}
                    {msg.creative.qaResults && (
                      <div className="text-xs">
                        <p className={`font-semibold ${msg.creative.qaResults.passed ? 'text-green-600' : 'text-amber-600'}`}>
                          QA: {msg.creative.qaResults.passed ? 'All checks passed' : 'Some checks need attention'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && step && (
            <div className="flex justify-start">
              <div className="bg-warm-white rounded-2xl rounded-bl-md px-4 py-3 border border-border-light">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {step}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Create Campaign Button */}
        {(campaignState.stage === 'reviewing' || campaignState.stage === 'ready') && campaignState.imageUrls && campaignState.imageUrls.length > 0 && (
          <div className="border-t border-border-light bg-green-50 px-6 py-3">
            <button
              onClick={handleCreateCampaign}
              disabled={creating}
              className="w-full rounded-lg bg-green-600 hover:bg-green-700 text-white py-3 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating on Meta...' : 'Create Campaign (PAUSED)'}
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Tell me what you want to promote..."
              disabled={loading}
              className="flex-1 rounded-lg border border-border-light bg-warm-white px-4 py-3 text-sm text-text-dark placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded-lg bg-gold px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gold/90 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

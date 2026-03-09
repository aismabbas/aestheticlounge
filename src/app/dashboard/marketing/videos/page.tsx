'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LogEntry {
  id: string;
  agent?: string;
  action?: string;
  decision?: string;
  result?: string;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Pipeline steps
// ---------------------------------------------------------------------------

const PIPELINE_STEPS = [
  { id: 'brief', label: 'Brief', icon: '\uD83D\uDCCB', description: 'Define campaign objectives and audience' },
  { id: 'script', label: 'Script', icon: '\uD83D\uDCDD', description: 'AI-written script with dialogue', needsApproval: true },
  { id: 'storyboard', label: 'Storyboard', icon: '\uD83C\uDFA8', description: 'Scene-by-scene visual plan', needsApproval: true },
  { id: 'generate', label: 'Generate', icon: '\u26A1', description: 'Video generation via AI models' },
  { id: 'review', label: 'Review', icon: '\uD83D\uDC41', description: 'Preview and request revisions', needsApproval: true },
  { id: 'publish', label: 'Publish', icon: '\uD83D\uDCE4', description: 'Export and deploy to ad platform' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VideosPage() {
  const [videoLog, setVideoLog] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, logRes] = await Promise.all([
        fetch('/api/dashboard/marketing/executions').then((r) => r.json()).catch(() => null),
        fetch('/api/dashboard/marketing/log?limit=20').then((r) => r.json()).catch(() => null),
      ]);
      setConnected(statusRes?.connected === true);

      const allLog: LogEntry[] = logRes?.log ?? [];
      setVideoLog(
        allLog.filter((e) => {
          const a = (e.action ?? '').toLowerCase();
          return a.includes('video') || a.includes('ad_creative');
        }),
      );
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function createVideoAd() {
    setTriggering(true);
    try {
      await fetch('/api/dashboard/marketing/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'al:new_reel', params: { content_type: 'video_ad' } }),
      });
      setTimeout(fetchData, 3000);
    } catch {
      // silent
    } finally {
      setTriggering(false);
    }
  }

  async function handleApproval(callbackId: string, action: 'approve' | 'reject') {
    try {
      await fetch('/api/dashboard/marketing/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callbackId: `al:${action}_${callbackId}`, title: action === 'approve' ? 'Approve' : 'Reject' }),
      });
      setTimeout(fetchData, 2000);
    } catch {
      // silent
    }
  }

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
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Video Studio</h1>
        </div>
        {connected ? (
          <button
            onClick={createVideoAd}
            disabled={triggering}
            className="px-5 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {triggering ? 'Starting...' : 'Create Video Ad'}
          </button>
        ) : (
          !loading && (
            <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              Pipeline not connected
            </span>
          )
        )}
      </div>

      {/* Pipeline visualization */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-dark mb-4">Video Ad Creation Pipeline</h2>
        <div className="flex items-start gap-2 overflow-x-auto pb-2">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warm-white border border-border-light text-xl">
                  {step.icon}
                </div>
                <p className="text-xs font-medium text-text-dark mt-2">{step.label}</p>
                <p className="text-[10px] text-text-muted text-center mt-0.5 max-w-[90px] leading-tight">
                  {step.description}
                </p>
                {step.needsApproval && (
                  <span className="mt-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-50 text-amber-600 font-medium">
                    Approval
                  </span>
                )}
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
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

      {/* Video activity log */}
      {videoLog.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="text-sm font-semibold text-text-dark mb-4">Video Activity</h2>
          <div className="space-y-2">
            {videoLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded bg-warm-white flex items-center justify-center text-[10px] font-medium text-text-muted uppercase">
                    {(entry.agent ?? '??').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-dark truncate">
                      <span className="font-medium capitalize">{entry.agent}</span>
                      {' -- '}
                      {entry.action}
                    </p>
                    <p className="text-[10px] text-text-muted truncate">{entry.decision || entry.result}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {connected && (entry.action?.includes('review') || entry.action?.includes('pending')) && (
                    <>
                      <button
                        onClick={() => handleApproval(entry.id, 'approve')}
                        className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-medium rounded transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(entry.id, 'reject')}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-medium rounded transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <span className="text-[10px] text-text-muted whitespace-nowrap">
                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && videoLog.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-pale mx-auto mb-4">
            <span className="text-3xl">{'\uD83D\uDCF9'}</span>
          </div>
          <p className="text-lg font-medium text-text-dark">No video ads yet</p>
          <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
            {connected
              ? 'Create your first AI-powered video ad. From brief to publish, the entire process is automated with approval gates.'
              : 'Connect your n8n pipeline to start creating AI-powered video ads. Set N8N_API_KEY in your environment variables.'}
          </p>
          {connected && (
            <button
              onClick={createVideoAd}
              disabled={triggering}
              className="mt-6 px-6 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {triggering ? 'Starting...' : 'Create First Video Ad'}
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-text-muted">Loading video data...</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface AgentData {
  agent: string;
  instructions: string;
  memory: Record<string, unknown>;
}

const AGENT_META: Record<string, { icon: string; role: string }> = {
  orchestrator: { icon: '\uD83C\uDFAF', role: 'Routes tasks to the right agent' },
  researcher: { icon: '\uD83D\uDD0D', role: 'Researches trends, competitors, and topics' },
  copywriter: { icon: '\u270D\uFE0F', role: 'Writes captions, headlines, and ad copy' },
  designer: { icon: '\uD83C\uDFA8', role: 'Creates image prompts and visual direction' },
  publisher: { icon: '\uD83D\uDE80', role: 'Manages drafts, approval, and publishing' },
  analyst: { icon: '\uD83D\uDCCA', role: 'Analyzes performance and recommends actions' },
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<'instructions' | 'memory'>('instructions');
  const [editInstructions, setEditInstructions] = useState('');
  const [editMemory, setEditMemory] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/marketing/agents');
      const data = await res.json();
      setAgents(data.agents ?? []);
    } catch {
      showFeedback('Failed to load agents', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  function startEditing(agent: AgentData) {
    setEditing(agent.agent);
    setEditTab('instructions');
    setEditInstructions(agent.instructions);
    setEditMemory(JSON.stringify(agent.memory, null, 2));
  }

  function cancelEditing() {
    setEditing(null);
    setEditInstructions('');
    setEditMemory('');
  }

  async function saveAgent() {
    if (!editing) return;
    setSaving(true);

    try {
      // Validate memory JSON
      let parsedMemory: Record<string, unknown>;
      try {
        parsedMemory = JSON.parse(editMemory);
      } catch {
        showFeedback('Invalid JSON in memory field', 'error');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/dashboard/marketing/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: editing,
          instructions: editInstructions,
          memory: parsedMemory,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showFeedback(`${editing} agent updated`, 'success');
        setEditing(null);
        fetchAgents();
      } else {
        showFeedback(data.error || 'Save failed', 'error');
      }
    } catch {
      showFeedback('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/marketing" className="text-text-muted hover:text-text-dark transition-colors text-sm">
            Marketing Studio
          </Link>
          <span className="text-text-muted">/</span>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">AI Agents</h1>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-gold-pale text-gold text-xs font-medium">
          {agents.length} agents
        </span>
      </div>

      <p className="text-sm text-text-muted mb-6">
        View and edit the instructions and learned memory for each AI agent in the content pipeline.
      </p>

      {feedback && (
        <div className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium border ${
          feedback.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>{feedback.text}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-text-muted text-sm">Loading agents...</div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => {
            const meta = AGENT_META[agent.agent] || { icon: '\uD83E\uDD16', role: 'AI Agent' };
            const isEditing = editing === agent.agent;
            const memoryKeys = Object.keys(agent.memory);

            return (
              <div key={agent.agent} className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Agent header */}
                <div className="flex items-center justify-between p-5 border-b border-border-light">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warm-white text-xl">
                      {meta.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-dark capitalize">{agent.agent}</h3>
                      <p className="text-xs text-text-muted">{meta.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">
                      {agent.instructions.length.toLocaleString()} chars instructions
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {memoryKeys.length} memory keys
                    </span>
                    {!isEditing ? (
                      <button
                        onClick={() => startEditing(agent)}
                        className="px-3 py-1.5 bg-gold hover:bg-gold/90 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={saveAgent}
                          disabled={saving}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1.5 bg-white text-text-muted text-xs font-medium rounded-lg border border-border hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                {isEditing ? (
                  <div className="p-5">
                    {/* Tabs */}
                    <div className="flex gap-1 mb-4">
                      <button
                        onClick={() => setEditTab('instructions')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          editTab === 'instructions' ? 'bg-gold text-white' : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                        }`}
                      >
                        Instructions
                      </button>
                      <button
                        onClick={() => setEditTab('memory')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          editTab === 'memory' ? 'bg-gold text-white' : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                        }`}
                      >
                        Memory (JSON)
                      </button>
                    </div>

                    {editTab === 'instructions' ? (
                      <textarea
                        value={editInstructions}
                        onChange={(e) => setEditInstructions(e.target.value)}
                        rows={16}
                        className="w-full px-4 py-3 border border-border rounded-lg text-xs font-mono resize-y leading-relaxed focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                        placeholder="Agent instructions..."
                      />
                    ) : (
                      <textarea
                        value={editMemory}
                        onChange={(e) => setEditMemory(e.target.value)}
                        rows={16}
                        className="w-full px-4 py-3 border border-border rounded-lg text-xs font-mono resize-y leading-relaxed focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                        placeholder='{"key": "value"}'
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-5">
                    {/* Instructions preview */}
                    <div className="mb-4">
                      <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-2">Instructions</p>
                      <div className="bg-warm-white rounded-lg p-3 border border-border-light max-h-40 overflow-y-auto">
                        <pre className="text-xs text-text-dark whitespace-pre-wrap font-mono leading-relaxed">
                          {agent.instructions.slice(0, 800)}{agent.instructions.length > 800 ? '\n...' : ''}
                        </pre>
                      </div>
                    </div>

                    {/* Memory preview */}
                    <div>
                      <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-2">
                        Learned Memory ({memoryKeys.length} keys)
                      </p>
                      {memoryKeys.length === 0 ? (
                        <p className="text-xs text-text-muted italic">No learned memory yet</p>
                      ) : (
                        <div className="bg-warm-white rounded-lg p-3 border border-border-light max-h-40 overflow-y-auto">
                          <pre className="text-xs text-text-dark whitespace-pre-wrap font-mono leading-relaxed">
                            {JSON.stringify(agent.memory, null, 2).slice(0, 800)}
                            {JSON.stringify(agent.memory, null, 2).length > 800 ? '\n...' : ''}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OptimizerAction {
  id: string;
  tier: number;
  actionType: string;
  entityName: string;
  reason: string;
  executed: boolean;
  runAt: string;
  oldValue?: string;
  newValue?: string;
}

interface OptimizerRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  triggerSource: string;
  adsEvaluated: number;
  actionsExecuted: number;
  actionsFlagged: number;
  monthlySpent: number;
}

interface Flag {
  id: string;
  entityName: string;
  reason: string;
  actionType: string;
  runAt: string;
}

interface BudgetInfo {
  spent: number;
  cap: number;
  dailySpendCents: number;
  dailyCap: number;
  daysRemaining: number;
}

// ---------------------------------------------------------------------------
// Action type labels & colors
// ---------------------------------------------------------------------------

const actionIcons: Record<string, { icon: string; color: string }> = {
  pause: { icon: '||', color: 'text-red-600 bg-red-50' },
  budget_increase: { icon: '+', color: 'text-green-600 bg-green-50' },
  budget_decrease: { icon: '-', color: 'text-amber-600 bg-amber-50' },
  flag_creative_refresh: { icon: '!', color: 'text-purple-600 bg-purple-50' },
  flag_learning_stuck: { icon: '?', color: 'text-blue-600 bg-blue-50' },
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OptimizerPanel() {
  const [lastRun, setLastRun] = useState<OptimizerRun | null>(null);
  const [actions, setActions] = useState<OptimizerAction[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [budget, setBudget] = useState<BudgetInfo | null>(null);
  const [running, setRunning] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [showSettings, setShowSettings] = useState(false);

  // ---------------------------------------------------------------------------
  // Data Loading
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    // Use allSettled so one failing endpoint doesn't block the others
    const [historyResult, flagsResult, configResult, budgetResult] = await Promise.allSettled([
      fetch('/api/ads/optimizer/history').then((r) => r.ok ? r.json() : null),
      fetch('/api/ads/optimizer/flags').then((r) => r.ok ? r.json() : null),
      fetch('/api/ads/optimizer/config').then((r) => r.ok ? r.json() : null),
      fetch('/api/dashboard/ads/metrics').then((r) => r.ok ? r.json() : null),
    ]);

    if (historyResult.status === 'fulfilled' && historyResult.value) {
      if (historyResult.value.runs?.length > 0) setLastRun(historyResult.value.runs[0]);
      setActions(historyResult.value.actions || []);
    }
    if (flagsResult.status === 'fulfilled' && flagsResult.value) {
      setFlags(flagsResult.value.flags || []);
    }
    if (configResult.status === 'fulfilled' && configResult.value) {
      setConfig(configResult.value.config || {});
    }
    if (budgetResult.status === 'fulfilled' && budgetResult.value?.budget) {
      setBudget(budgetResult.value.budget);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/ads/optimizer/run?source=dashboard', { method: 'POST' });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('[OptimizerPanel] Run error:', err);
    } finally {
      setRunning(false);
    }
  };

  const handleDismissFlag = async (flagId: string) => {
    try {
      await fetch('/api/ads/optimizer/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: flagId }),
      });
      setFlags((prev) => prev.filter((f) => f.id !== flagId));
    } catch (err) {
      console.error('[OptimizerPanel] Dismiss error:', err);
    }
  };

  const handleToggleOptimizer = async () => {
    const newValue = config.optimizer_enabled === 'true' ? 'false' : 'true';
    try {
      await fetch('/api/ads/optimizer/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizer_enabled: newValue }),
      });
      setConfig((prev) => ({ ...prev, optimizer_enabled: newValue }));
    } catch (err) {
      console.error('[OptimizerPanel] Toggle error:', err);
    }
  };

  const isEnabled = config.optimizer_enabled !== 'false';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Optimizer Status Bar */}
      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${isEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <div>
              <span className="text-sm font-semibold text-text-dark">
                Optimizer {isEnabled ? 'Active' : 'Disabled'}
              </span>
              {lastRun && (
                <span className="text-xs text-text-muted ml-2">
                  Last run {timeAgo(lastRun.startedAt)}
                </span>
              )}
            </div>
            {lastRun && (
              <div className="hidden sm:flex items-center gap-4 ml-4 text-xs text-text-muted">
                <span>{lastRun.actionsExecuted} actions taken</span>
                <span>{lastRun.actionsFlagged} flags</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunNow}
              disabled={running || !isEnabled}
              className="px-3 py-1.5 bg-gold hover:bg-gold/90 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {running ? 'Running...' : 'Run Now'}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-warm-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-text-dark uppercase tracking-wider">Settings</span>
              <button
                onClick={handleToggleOptimizer}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-text-muted">Target CPL</span>
                <p className="font-medium text-text-dark">${config.target_cpl || '6'}</p>
              </div>
              <div>
                <span className="text-text-muted">Daily Cap</span>
                <p className="font-medium text-text-dark">${parseInt(config.daily_cap_cents || '1000') / 100}</p>
              </div>
              <div>
                <span className="text-text-muted">Monthly Cap</span>
                <p className="font-medium text-text-dark">${config.monthly_cap_cad || '300'}</p>
              </div>
              <div>
                <span className="text-text-muted">Auto Tier 1</span>
                <p className="font-medium text-text-dark">{config.auto_execute_tier1 !== 'false' ? 'On' : 'Off'}</p>
              </div>
              <div>
                <span className="text-text-muted">Auto Tier 2</span>
                <p className="font-medium text-text-dark">{config.auto_execute_tier2 !== 'false' ? 'On' : 'Off'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Flags */}
      {flags.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">
            Active Flags ({flags.length})
          </h3>
          <div className="space-y-2">
            {flags.map((flag) => (
              <div key={flag.id} className="flex items-start justify-between gap-3 rounded-lg bg-white p-3 border border-amber-100">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-dark truncate">{flag.entityName}</p>
                  <p className="text-xs text-text-muted mt-0.5">{flag.reason}</p>
                </div>
                <button
                  onClick={() => handleDismissFlag(flag.id)}
                  className="shrink-0 px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-100 rounded transition-colors"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Actions */}
      {actions.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-4">
          <h3 className="text-xs font-semibold text-text-dark uppercase tracking-wider mb-3">
            Recent Actions
          </h3>
          <div className="space-y-2">
            {actions.slice(0, 6).map((action) => {
              const style = actionIcons[action.actionType] || { icon: '*', color: 'text-gray-600 bg-gray-50' };
              return (
                <div key={action.id} className="flex items-start gap-3 text-sm">
                  <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${style.color}`}>
                    {style.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-text-dark truncate">
                      <span className="font-medium">{action.entityName}</span>
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{action.reason}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{timeAgo(action.runAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Budget Tracker */}
      {budget && (
        <div className="rounded-xl border border-border bg-white p-4">
          <h3 className="text-xs font-semibold text-text-dark uppercase tracking-wider mb-3">
            Budget Tracker
          </h3>
          <div className="space-y-3">
            {/* Daily */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-muted">Daily</span>
                <span className="text-text-dark font-medium">
                  ${(budget.dailySpendCents / 100).toFixed(2)} / ${(budget.dailyCap / 100).toFixed(2)}
                </span>
              </div>
              <div className="h-2 bg-border-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budget.dailyCap > 0 && budget.dailySpendCents / budget.dailyCap > 0.9
                      ? 'bg-red-400'
                      : budget.dailyCap > 0 && budget.dailySpendCents / budget.dailyCap > 0.7
                        ? 'bg-amber-400'
                        : 'bg-gold'
                  }`}
                  style={{ width: `${budget.dailyCap > 0 ? Math.min((budget.dailySpendCents / budget.dailyCap) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
            {/* Monthly */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-muted">Monthly</span>
                <span className="text-text-dark font-medium">
                  ${budget.spent.toFixed(2)} / ${budget.cap}
                </span>
              </div>
              <div className="h-2 bg-border-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budget.cap > 0 && budget.spent / budget.cap > 0.9
                      ? 'bg-red-400'
                      : budget.cap > 0 && budget.spent / budget.cap > 0.7
                        ? 'bg-amber-400'
                        : 'bg-gold'
                  }`}
                  style={{ width: `${budget.cap > 0 ? Math.min((budget.spent / budget.cap) * 100, 100) : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-1">{budget.daysRemaining} days remaining this month</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

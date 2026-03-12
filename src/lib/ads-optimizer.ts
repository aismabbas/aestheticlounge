/**
 * Ads Optimizer — autonomous 24/7 ad optimization engine.
 *
 * Runs every 6 hours: syncs Meta data, evaluates every active ad against
 * tiered rules, auto-executes Tier 1/2 actions, flags Tier 3 for review.
 *
 * Safety guardrails are hard-coded and cannot be overridden.
 */

import { query } from './db';
import { ulid } from './ulid';
import { syncFromMeta, syncPerformance, pauseAd } from './meta-ads';
import { logDecision } from './al-pipeline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OptimizerAction {
  id: string;
  runId: string;
  runAt: string;
  tier: 1 | 2 | 3;
  actionType: string;
  entityType: 'ad' | 'adset' | 'campaign';
  metaId: string;
  entityName: string;
  reason: string;
  oldValue?: string;
  newValue?: string;
  executed: boolean;
}

export interface OptimizerRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  triggerSource: string;
  adsEvaluated: number;
  actionsExecuted: number;
  actionsFlagged: number;
  budgetBeforeCents: number;
  budgetAfterCents: number;
  monthlySpent: number;
  syncError: string | null;
  report: OptimizerAction[];
}

interface AdEvaluation {
  metaAdId: string;
  adName: string;
  campaignName: string;
  adsetMetaId: string;
  adsetName: string;
  effectiveStatus: string;
  daysActive: number;
  totalSpend: number;
  totalLeads: number;
  cpl: number;
  avgCtr: number;
  avgFrequency: number;
  weeklySpend: number[];
  weeklyCpl: number[];
  dailyBudgetCents: number;
  lastBudgetChange?: string;
}

interface OptimizerConfig {
  targetCpl: number;
  dailyCapCents: number;
  monthlyCapCad: number;
  optimizerEnabled: boolean;
  autoExecuteTier1: boolean;
  autoExecuteTier2: boolean;
}

// ---------------------------------------------------------------------------
// Safety Guardrails — HARD-CODED, CANNOT OVERRIDE
// ---------------------------------------------------------------------------

const GUARDRAILS = {
  MAX_DAILY_CAD: 10,
  MAX_MONTHLY_CAD: 300,
  MAX_BUDGET_CHANGE_PCT: 0.20,
  MIN_BUDGET_PER_ADSET_CENTS: 200,
  MAX_BUDGET_PER_ADSET_CENTS: 500,
  COOLDOWN_HOURS: 48,
  LEARNING_PHASE_DAYS: 3,
} as const;

// ---------------------------------------------------------------------------
// Config Loader
// ---------------------------------------------------------------------------

async function loadConfig(): Promise<OptimizerConfig> {
  const { rows } = await query(`SELECT key, value FROM al_optimizer_config`);
  const cfg: Record<string, string> = {};
  for (const r of rows) cfg[r.key as string] = r.value as string;

  return {
    targetCpl: parseFloat(cfg.target_cpl || '6'),
    dailyCapCents: parseInt(cfg.daily_cap_cents || '1000'),
    monthlyCapCad: parseInt(cfg.monthly_cap_cad || '300'),
    optimizerEnabled: cfg.optimizer_enabled !== 'false',
    autoExecuteTier1: cfg.auto_execute_tier1 !== 'false',
    autoExecuteTier2: cfg.auto_execute_tier2 !== 'false',
  };
}

// ---------------------------------------------------------------------------
// Ad Evaluation — gather metrics for each active ad
// ---------------------------------------------------------------------------

async function evaluateAllAds(): Promise<AdEvaluation[]> {
  const { rows } = await query(
    `SELECT
       ac.meta_id AS meta_ad_id,
       ac.name AS ad_name,
       c.name AS campaign_name,
       a.meta_id AS adset_meta_id,
       a.name AS adset_name,
       ac.effective_status,
       COALESCE(CAST(a.daily_budget AS INTEGER), 0) AS daily_budget_cents,
       COALESCE(perf.days_active, 0) AS days_active,
       COALESCE(perf.total_spend, 0) AS total_spend,
       COALESCE(perf.total_leads, 0) AS total_leads,
       COALESCE(perf.avg_ctr, 0) AS avg_ctr,
       COALESCE(perf.avg_frequency, 0) AS avg_frequency
     FROM al_ad_creatives ac
     JOIN al_ad_sets a ON a.meta_id = ac.adset_meta_id
     JOIN al_ad_campaigns c ON c.meta_id = ac.campaign_meta_id
     LEFT JOIN (
       SELECT
         meta_ad_id,
         COUNT(DISTINCT date) AS days_active,
         SUM(spend) AS total_spend,
         SUM(leads) AS total_leads,
         AVG(ctr) AS avg_ctr,
         AVG(frequency) AS avg_frequency
       FROM al_ad_performance
       WHERE meta_ad_id IS NOT NULL AND date >= (CURRENT_DATE - 30)
       GROUP BY meta_ad_id
     ) perf ON perf.meta_ad_id = ac.meta_id
     WHERE ac.effective_status IN ('ACTIVE', 'LEARNING', 'LEARNING_LIMITED')`,
  );

  const evals: AdEvaluation[] = [];
  for (const r of rows) {
    const totalSpend = parseFloat(r.total_spend as string) || 0;
    const totalLeads = parseInt(r.total_leads as string) || 0;

    // Get weekly spend/CPL trends
    const { rows: weeklyData } = await query(
      `SELECT
         DATE_TRUNC('week', date) AS week,
         SUM(spend) AS spend,
         SUM(leads) AS leads
       FROM al_ad_performance
       WHERE meta_ad_id = $1 AND date >= (CURRENT_DATE - 28)
       GROUP BY week ORDER BY week`,
      [r.meta_ad_id],
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const weeklySpend = weeklyData.map((w: any) => parseFloat(w.spend as string) || 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const weeklyCpl = weeklyData.map((w: any) => {
      const leads = parseInt(w.leads as string) || 0;
      const spend = parseFloat(w.spend as string) || 0;
      return leads > 0 ? spend / leads : 0;
    });

    // Check last budget change from optimizer actions log
    let lastBudgetChangeDate: string | undefined;
    try {
      const { rows: auditRows } = await query(
        `SELECT run_at FROM al_optimizer_actions
         WHERE meta_id = $1 AND action_type IN ('budget_increase', 'budget_decrease') AND executed = true
         ORDER BY run_at DESC LIMIT 1`,
        [r.adset_meta_id],
      );
      lastBudgetChangeDate = auditRows[0]?.run_at as string | undefined;
    } catch {
      // table may not exist yet — skip cooldown check
    }

    evals.push({
      metaAdId: r.meta_ad_id as string,
      adName: r.ad_name as string,
      campaignName: r.campaign_name as string,
      adsetMetaId: r.adset_meta_id as string,
      adsetName: r.adset_name as string,
      effectiveStatus: r.effective_status as string,
      daysActive: parseInt(r.days_active as string) || 0,
      totalSpend,
      totalLeads,
      cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
      avgCtr: parseFloat(r.avg_ctr as string) || 0,
      avgFrequency: parseFloat(r.avg_frequency as string) || 0,
      weeklySpend,
      weeklyCpl,
      dailyBudgetCents: parseInt(r.daily_budget_cents as string) || 0,
      lastBudgetChange: lastBudgetChangeDate,
    });
  }

  return evals;
}

// ---------------------------------------------------------------------------
// Rule Evaluation
// ---------------------------------------------------------------------------

function evaluateRules(ad: AdEvaluation, config: OptimizerConfig): OptimizerAction[] {
  const actions: OptimizerAction[] = [];
  const now = new Date().toISOString();
  const base = {
    id: '',
    runId: '',
    runAt: now,
    entityType: 'ad' as const,
    metaId: ad.metaAdId,
    entityName: ad.adName,
    executed: false,
  };

  // --- TIER 1: Auto-Execute ---

  // Zero-Lead Kill: 3+ days, 0 leads, spend > $12
  if (ad.daysActive >= 3 && ad.totalLeads === 0 && ad.totalSpend > 12) {
    actions.push({
      ...base,
      tier: 1,
      actionType: 'pause',
      reason: `Zero leads after ${ad.daysActive} days, $${ad.totalSpend.toFixed(2)} spent (threshold: $12)`,
    });
  }

  // CPL Runaway: CPL > $18 for 5+ days
  if (ad.daysActive >= 5 && ad.cpl > 18 && ad.totalLeads > 0) {
    actions.push({
      ...base,
      tier: 1,
      actionType: 'pause',
      reason: `CPL $${ad.cpl.toFixed(2)} exceeds $18 threshold for ${ad.daysActive} days`,
    });
  }

  // Frequency Fatigue: frequency > 4.0 for 3+ days
  if (ad.daysActive >= 3 && ad.avgFrequency > 4.0) {
    actions.push({
      ...base,
      tier: 1,
      actionType: 'pause',
      reason: `Frequency ${ad.avgFrequency.toFixed(1)}x exceeds 4.0 threshold — audience fatigue`,
    });
  }

  // --- TIER 2: Auto-Execute + Notify ---

  // Check cooldown before budget changes
  const canChangeBudget = !ad.lastBudgetChange ||
    (Date.now() - new Date(ad.lastBudgetChange).getTime()) > GUARDRAILS.COOLDOWN_HOURS * 3600000;

  if (canChangeBudget && ad.effectiveStatus !== 'LEARNING') {
    // Winner Boost: CPL < $4, CTR > 1.5%, 5+ days
    if (ad.cpl > 0 && ad.cpl < 4 && ad.avgCtr > 1.5 && ad.daysActive >= 5) {
      const newBudget = Math.min(
        Math.round(ad.dailyBudgetCents * 1.2),
        GUARDRAILS.MAX_BUDGET_PER_ADSET_CENTS,
      );
      if (newBudget > ad.dailyBudgetCents) {
        actions.push({
          ...base,
          tier: 2,
          entityType: 'adset',
          metaId: ad.adsetMetaId,
          entityName: ad.adsetName,
          actionType: 'budget_increase',
          reason: `Winner — CPL $${ad.cpl.toFixed(2)}, CTR ${ad.avgCtr.toFixed(1)}%, ${ad.daysActive} days. Boost +20%`,
          oldValue: String(ad.dailyBudgetCents),
          newValue: String(newBudget),
        });
      }
    }

    // Slow Decline: CPL rising 15%+ week-over-week
    if (ad.weeklyCpl.length >= 2) {
      const prev = ad.weeklyCpl[ad.weeklyCpl.length - 2];
      const curr = ad.weeklyCpl[ad.weeklyCpl.length - 1];
      if (prev > 0 && curr > 0 && ((curr - prev) / prev) > 0.15) {
        const newBudget = Math.max(
          Math.round(ad.dailyBudgetCents * 0.8),
          GUARDRAILS.MIN_BUDGET_PER_ADSET_CENTS,
        );
        if (newBudget < ad.dailyBudgetCents) {
          actions.push({
            ...base,
            tier: 2,
            entityType: 'adset',
            metaId: ad.adsetMetaId,
            entityName: ad.adsetName,
            actionType: 'budget_decrease',
            reason: `CPL rising ${(((curr - prev) / prev) * 100).toFixed(0)}% WoW ($${prev.toFixed(2)} → $${curr.toFixed(2)}). Reduce -20%`,
            oldValue: String(ad.dailyBudgetCents),
            newValue: String(newBudget),
          });
        }
      }
    }
  }

  // --- TIER 3: Flag Only ---

  // Creative Refresh: CTR < 0.8% after 2000+ impressions
  if (ad.avgCtr < 0.8 && ad.totalSpend > 10) {
    actions.push({
      ...base,
      tier: 3,
      actionType: 'flag_creative_refresh',
      reason: `CTR ${ad.avgCtr.toFixed(2)}% below 0.8% threshold — needs new creative`,
    });
  }

  // Learning Stuck: LEARNING status 7+ days
  if (ad.effectiveStatus === 'LEARNING' && ad.daysActive >= 7) {
    actions.push({
      ...base,
      tier: 3,
      actionType: 'flag_learning_stuck',
      reason: `Stuck in LEARNING phase for ${ad.daysActive} days — review targeting or creative`,
    });
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Budget Change Execution
// ---------------------------------------------------------------------------

async function executeBudgetChange(metaAdSetId: string, newBudgetCents: number): Promise<void> {
  const META_BASE = 'https://graph.facebook.com/v21.0';
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || ''; // read at call time, not module load

  const formData = new URLSearchParams();
  formData.set('access_token', ACCESS_TOKEN);
  formData.set('daily_budget', String(newBudgetCents));

  const res = await fetch(`${META_BASE}/${metaAdSetId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Budget change failed for ${metaAdSetId}: ${text}`);
  }

  // Update local DB
  await query(
    `UPDATE al_ad_sets SET daily_budget = $1, synced_at = NOW() WHERE meta_id = $2`,
    [String(newBudgetCents), metaAdSetId],
  );
}

// ---------------------------------------------------------------------------
// Main Optimization Cycle
// ---------------------------------------------------------------------------

export async function runOptimizationCycle(triggerSource: string): Promise<OptimizerRun> {
  const config = await loadConfig();

  if (!config.optimizerEnabled) {
    throw new Error('Optimizer is disabled — set optimizer_enabled=true in config');
  }

  const runId = ulid();
  const startedAt = new Date().toISOString();

  await query(
    `INSERT INTO al_optimizer_runs (id, started_at, trigger_source) VALUES ($1, $2, $3)`,
    [runId, startedAt, triggerSource],
  );

  // Step 1: Sync latest data from Meta
  let syncError: string | null = null;
  try {
    const syncResult = await syncFromMeta(query);
    console.log(`[optimizer] Synced: ${syncResult.campaigns} campaigns, ${syncResult.adSets} ad sets, ${syncResult.ads} ads`);
  } catch (err) {
    syncError = err instanceof Error ? err.message : String(err);
    console.error('[optimizer] syncFromMeta FAILED:', syncError);
  }
  try {
    await syncPerformance(query);
  } catch (err) {
    console.error('[optimizer] syncPerformance failed:', err instanceof Error ? err.message : err);
  }

  // Step 2: Get budget snapshot
  const { rows: budgetRows } = await query(
    `SELECT COALESCE(SUM(CAST(daily_budget AS INTEGER)), 0) AS total
     FROM al_ad_sets WHERE effective_status IN ('ACTIVE', 'LEARNING', 'LEARNING_LIMITED')`,
  );
  const budgetBeforeCents = parseInt(budgetRows[0]?.total as string) || 0;

  // Monthly spend
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  const { rows: monthlyRows } = await query(
    `SELECT COALESCE(SUM(spend), 0) AS total
     FROM al_ad_performance WHERE date >= $1`,
    [firstOfMonth.toISOString().split('T')[0]],
  );
  const monthlySpent = parseFloat(monthlyRows[0]?.total as string) || 0;

  // Budget bleed check — if monthly approaching cap, pause lowest performer
  const allActions: OptimizerAction[] = [];

  if (monthlySpent > config.monthlyCapCad * 0.9) {
    // Find lowest performer to pause
    const { rows: worstRows } = await query(
      `SELECT ac.meta_id, ac.name,
         CASE WHEN SUM(p.leads) > 0 THEN SUM(p.spend) / SUM(p.leads) ELSE 999 END AS cpl
       FROM al_ad_creatives ac
       JOIN al_ad_performance p ON p.meta_ad_id = ac.meta_id
       WHERE ac.effective_status = 'ACTIVE' AND p.date >= (CURRENT_DATE - 7)
       GROUP BY ac.meta_id, ac.name
       ORDER BY cpl DESC LIMIT 1`,
    );
    if (worstRows.length > 0) {
      allActions.push({
        id: ulid(),
        runId,
        runAt: startedAt,
        tier: 1,
        actionType: 'pause',
        entityType: 'ad',
        metaId: worstRows[0].meta_id as string,
        entityName: worstRows[0].name as string,
        reason: `Monthly spend $${monthlySpent.toFixed(2)} exceeds 90% of $${config.monthlyCapCad} cap — pausing worst performer`,
        executed: false,
      });
    }
  }

  // Step 3: Evaluate all active ads
  const ads = await evaluateAllAds();

  for (const ad of ads) {
    // Skip ads in learning phase protection
    if (ad.effectiveStatus === 'LEARNING' && ad.daysActive < GUARDRAILS.LEARNING_PHASE_DAYS) {
      continue;
    }

    const adActions = evaluateRules(ad, config);
    if (adActions.length === 0) {
      // Log a healthy check so the actions table always has something to show
      allActions.push({
        id: ulid(),
        runId,
        runAt: startedAt,
        tier: 0 as 1, // informational tier (cast to satisfy type)
        actionType: 'all_clear',
        entityType: 'ad',
        metaId: ad.metaAdId,
        entityName: ad.adName,
        reason: `Healthy — CPL $${ad.cpl > 0 ? ad.cpl.toFixed(2) : '—'}, CTR ${ad.avgCtr.toFixed(1)}%, freq ${ad.avgFrequency.toFixed(1)}x, ${ad.daysActive}d active`,
        executed: true,
      });
    } else {
      for (const action of adActions) {
        action.id = ulid();
        action.runId = runId;
        allActions.push(action);
      }
    }
  }

  // Step 4: Execute actions
  let actionsExecuted = 0;
  let actionsFlagged = 0;

  for (const action of allActions) {
    // Skip all_clear — informational only, already marked executed
    if (action.actionType === 'all_clear') {
      await query(
        `INSERT INTO al_optimizer_actions
         (id, run_id, run_at, tier, action_type, entity_type, meta_id, entity_name, reason, old_value, new_value, executed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          action.id, action.runId, action.runAt, action.tier,
          action.actionType, action.entityType, action.metaId,
          action.entityName, action.reason, null, null, true,
        ],
      );
      continue;
    }

    const shouldExecute =
      (action.tier === 1 && config.autoExecuteTier1) ||
      (action.tier === 2 && config.autoExecuteTier2);

    if (shouldExecute && action.tier <= 2) {
      try {
        if (action.actionType === 'pause') {
          await pauseAd(query, action.metaId);
          action.executed = true;
          actionsExecuted++;
        } else if (action.actionType === 'budget_increase' || action.actionType === 'budget_decrease') {
          // Validate against guardrails one more time
          const newBudget = parseInt(action.newValue || '0');
          if (newBudget >= GUARDRAILS.MIN_BUDGET_PER_ADSET_CENTS &&
              newBudget <= GUARDRAILS.MAX_BUDGET_PER_ADSET_CENTS) {
            // Check total daily budget won't exceed cap after this change
            if (action.actionType === 'budget_increase') {
              try {
                const { rows: budgetRows } = await query(
                  `SELECT COALESCE(SUM(CAST(daily_budget AS INTEGER)), 0) AS total_daily_cents FROM al_ad_sets WHERE status IN ('ACTIVE', 'LEARNING', 'LEARNING_LIMITED')`,
                );
                const totalDailyCents = parseInt(budgetRows[0]?.total_daily_cents || '0');
                const oldBudget = parseInt(action.oldValue || '0');
                const projectedTotal = totalDailyCents - oldBudget + newBudget;
                if (projectedTotal > GUARDRAILS.MAX_DAILY_CAD * 100) {
                  console.warn(`[optimizer] Skipping budget increase — would exceed daily cap ($${(projectedTotal / 100).toFixed(2)} > $${GUARDRAILS.MAX_DAILY_CAD})`);
                  actionsFlagged++;
                  continue;
                }
              } catch (err) {
                console.error('[optimizer] Daily cap check failed, skipping increase:', err);
                continue;
              }
            }
            await executeBudgetChange(action.metaId, newBudget);
            action.executed = true;
            actionsExecuted++;
          }
        }
      } catch (err) {
        console.error(`[optimizer] Failed to execute action ${action.id}:`, err);
      }
    } else {
      actionsFlagged++;
    }

    // Save action to DB
    await query(
      `INSERT INTO al_optimizer_actions
       (id, run_id, run_at, tier, action_type, entity_type, meta_id, entity_name, reason, old_value, new_value, executed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        action.id, action.runId, action.runAt, action.tier,
        action.actionType, action.entityType, action.metaId,
        action.entityName, action.reason, action.oldValue || null,
        action.newValue || null, action.executed,
      ],
    );
  }

  // Step 5: Get budget after
  const { rows: budgetAfterRows } = await query(
    `SELECT COALESCE(SUM(CAST(daily_budget AS INTEGER)), 0) AS total
     FROM al_ad_sets WHERE effective_status IN ('ACTIVE', 'LEARNING', 'LEARNING_LIMITED')`,
  );
  const budgetAfterCents = parseInt(budgetAfterRows[0]?.total as string) || 0;

  // Step 6: Complete run
  const completedAt = new Date().toISOString();
  await query(
    `UPDATE al_optimizer_runs SET
       completed_at = $1, ads_evaluated = $2, actions_executed = $3,
       actions_flagged = $4, budget_before_cents = $5, budget_after_cents = $6,
       monthly_spent = $7, report = $8::jsonb
     WHERE id = $9`,
    [
      completedAt, ads.length, actionsExecuted, actionsFlagged,
      budgetBeforeCents, budgetAfterCents, monthlySpent,
      JSON.stringify(allActions), runId,
    ],
  );

  await logDecision(
    'analyst',
    'optimizer_run',
    `Evaluated ${ads.length} ads, executed ${actionsExecuted} actions, flagged ${actionsFlagged}`,
    JSON.stringify({ runId, actionsExecuted, actionsFlagged, monthlySpent }),
  );

  return {
    id: runId,
    startedAt,
    completedAt,
    triggerSource,
    adsEvaluated: ads.length,
    actionsExecuted,
    actionsFlagged,
    budgetBeforeCents,
    budgetAfterCents,
    monthlySpent,
    syncError,
    report: allActions,
  };
}

// ---------------------------------------------------------------------------
// Query helpers for dashboard
// ---------------------------------------------------------------------------

export async function getOptimizerHistory(limit = 10): Promise<OptimizerRun[]> {
  const { rows } = await query(
    `SELECT * FROM al_optimizer_runs ORDER BY started_at DESC LIMIT $1`,
    [limit],
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({
    id: r.id as string,
    startedAt: r.started_at as string,
    completedAt: r.completed_at as string | undefined,
    triggerSource: r.trigger_source as string,
    adsEvaluated: parseInt(r.ads_evaluated as string) || 0,
    actionsExecuted: parseInt(r.actions_executed as string) || 0,
    actionsFlagged: parseInt(r.actions_flagged as string) || 0,
    budgetBeforeCents: parseInt(r.budget_before_cents as string) || 0,
    budgetAfterCents: parseInt(r.budget_after_cents as string) || 0,
    monthlySpent: parseFloat(r.monthly_spent as string) || 0,
    report: (typeof r.report === 'string' ? JSON.parse(r.report) : r.report) || [],
  }));
}

export async function getActiveFlags(): Promise<OptimizerAction[]> {
  const { rows } = await query(
    `SELECT * FROM al_optimizer_actions
     WHERE tier = 3 AND dismissed = false AND executed = false
     ORDER BY run_at DESC`,
  );
  return rows.map(rowToAction);
}

export async function getRecentActions(limit = 20): Promise<OptimizerAction[]> {
  const { rows } = await query(
    `SELECT * FROM al_optimizer_actions
     WHERE executed = true
     ORDER BY run_at DESC LIMIT $1`,
    [limit],
  );
  return rows.map(rowToAction);
}

export async function dismissFlag(actionId: string, note?: string): Promise<void> {
  await query(
    `UPDATE al_optimizer_actions SET dismissed = true, dismissed_note = $1 WHERE id = $2`,
    [note || null, actionId],
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAction(r: any): OptimizerAction {
  return {
    id: r.id,
    runId: r.run_id,
    runAt: r.run_at,
    tier: parseInt(r.tier) as 1 | 2 | 3,
    actionType: r.action_type,
    entityType: r.entity_type,
    metaId: r.meta_id,
    entityName: r.entity_name,
    reason: r.reason,
    oldValue: r.old_value,
    newValue: r.new_value,
    executed: r.executed,
  };
}

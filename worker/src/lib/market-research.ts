/**
 * Market Research Helpers — verbatim from src/lib/market-research.ts
 */

import { query } from './db.js';

export interface PerformanceSnapshot {
  totalSpend: number;
  totalLeads: number;
  avgCpl: number;
  avgCtr: number;
  avgFrequency: number;
  topAds: Array<{ name: string; metaId: string; cpl: number; ctr: number; leads: number }>;
  worstAds: Array<{ name: string; metaId: string; cpl: number; spend: number; leads: number }>;
}

export async function getPerformanceHistory(days = 30): Promise<PerformanceSnapshot> {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const { rows: summary } = await query(
    `SELECT
       COALESCE(SUM(spend), 0) AS total_spend,
       COALESCE(SUM(leads), 0) AS total_leads,
       CASE WHEN SUM(leads) > 0 THEN SUM(spend) / SUM(leads) ELSE 0 END AS avg_cpl,
       COALESCE(AVG(ctr), 0) AS avg_ctr,
       COALESCE(AVG(frequency), 0) AS avg_frequency
     FROM al_ad_performance
     WHERE date >= $1 AND meta_ad_id IS NULL`,
    [cutoff],
  );

  const { rows: topAds } = await query(
    `SELECT ac.name, p.meta_ad_id AS meta_id,
       SUM(p.spend) / NULLIF(SUM(p.leads), 0) AS cpl,
       AVG(p.ctr) AS ctr,
       SUM(p.leads) AS leads
     FROM al_ad_performance p
     JOIN al_ad_creatives ac ON ac.meta_id = p.meta_ad_id
     WHERE p.date >= $1 AND p.meta_ad_id IS NOT NULL
     GROUP BY ac.name, p.meta_ad_id
     HAVING SUM(p.leads) > 0
     ORDER BY cpl ASC
     LIMIT 5`,
    [cutoff],
  );

  const { rows: worstAds } = await query(
    `SELECT ac.name, p.meta_ad_id AS meta_id,
       CASE WHEN SUM(p.leads) > 0 THEN SUM(p.spend) / SUM(p.leads) ELSE 999 END AS cpl,
       SUM(p.spend) AS spend,
       SUM(p.leads) AS leads
     FROM al_ad_performance p
     JOIN al_ad_creatives ac ON ac.meta_id = p.meta_ad_id
     WHERE p.date >= $1 AND p.meta_ad_id IS NOT NULL
     GROUP BY ac.name, p.meta_ad_id
     HAVING SUM(p.spend) > 5
     ORDER BY cpl DESC
     LIMIT 5`,
    [cutoff],
  );

  const row = summary[0] || {};
  return {
    totalSpend: parseFloat(row.total_spend as string) || 0,
    totalLeads: parseInt(row.total_leads as string) || 0,
    avgCpl: parseFloat(row.avg_cpl as string) || 0,
    avgCtr: parseFloat(row.avg_ctr as string) || 0,
    avgFrequency: parseFloat(row.avg_frequency as string) || 0,
    topAds: topAds.map((r: any) => ({
      name: r.name as string, metaId: r.meta_id as string, cpl: parseFloat(r.cpl as string) || 0, ctr: parseFloat(r.ctr as string) || 0, leads: parseInt(r.leads as string) || 0,
    })),
    worstAds: worstAds.map((r: any) => ({
      name: r.name as string, metaId: r.meta_id as string, cpl: parseFloat(r.cpl as string) || 999, spend: parseFloat(r.spend as string) || 0, leads: parseInt(r.leads as string) || 0,
    })),
  };
}

export async function getLearnings(limit = 10): Promise<string[]> {
  try {
    const { rows } = await query(
      `SELECT reasoning FROM al_decision_log WHERE agent = 'analyst' AND action = 'analyze' ORDER BY timestamp DESC LIMIT $1`,
      [limit],
    );
    return rows.map((r: any) => r.reasoning as string);
  } catch { return []; }
}

export function getSeasonalContext(): { season: string; events: string[]; recommended_treatments: string[] } {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 3) return { season: 'Ramadan/Spring', events: ['Ramadan', 'Eid ul-Fitr prep', 'Wedding season start'], recommended_treatments: ['HydraFacial', 'Skin glow packages', 'Botox', 'Lip fillers'] };
  if (month >= 4 && month <= 5) return { season: 'Eid/Summer Start', events: ['Eid ul-Fitr', 'Summer prep', 'Wedding season'], recommended_treatments: ['Laser hair removal', 'Body contouring', 'Chemical peels'] };
  if (month >= 6 && month <= 8) return { season: 'Summer/Monsoon', events: ['Eid ul-Adha', 'Independence Day', 'Back-to-school'], recommended_treatments: ['Acne treatment', 'HydraFacial', 'Skin hydration', 'Hair PRP'] };
  if (month >= 9 && month <= 10) return { season: 'Fall/Wedding Peak', events: ['Walima season', 'Mehndi prep', 'Cool weather start'], recommended_treatments: ['Botox', 'Fillers', 'Laser skin rejuvenation', 'Full body laser'] };
  return { season: 'Winter', events: month === 11 ? ['New Year prep', 'Winter skin care'] : ["Valentine's prep", 'Winter treatments'], recommended_treatments: ['Chemical peels', 'Micro-needling', 'Laser treatments', 'Skin tightening'] };
}

export interface RunningCampaign { metaId: string; name: string; status: string; dailyBudget: number; spend30d: number; leads30d: number; cpl30d: number; }

export async function getRunningCampaigns(): Promise<RunningCampaign[]> {
  const { rows } = await query(
    `SELECT c.meta_id, c.name, c.effective_status AS status, COALESCE(CAST(c.daily_budget AS NUMERIC) / 100, 0) AS daily_budget, COALESCE(p.spend, 0) AS spend_30d, COALESCE(p.leads, 0) AS leads_30d, CASE WHEN COALESCE(p.leads, 0) > 0 THEN p.spend / p.leads ELSE 0 END AS cpl_30d FROM al_ad_campaigns c LEFT JOIN (SELECT meta_campaign_id, SUM(spend) AS spend, SUM(leads) AS leads FROM al_ad_performance WHERE meta_ad_id IS NULL AND date >= (CURRENT_DATE - 30) GROUP BY meta_campaign_id) p ON p.meta_campaign_id = c.meta_id WHERE c.effective_status IN ('ACTIVE', 'LEARNING', 'LEARNING_LIMITED', 'PAUSED') ORDER BY c.effective_status ASC, p.spend DESC NULLS LAST`,
  );
  return rows.map((r: any) => ({ metaId: r.meta_id as string, name: r.name as string, status: r.status as string, dailyBudget: parseFloat(r.daily_budget as string) || 0, spend30d: parseFloat(r.spend_30d as string) || 0, leads30d: parseInt(r.leads_30d as string) || 0, cpl30d: parseFloat(r.cpl_30d as string) || 0 }));
}

export async function getBestAudienceTargeting(): Promise<Record<string, unknown>[]> {
  const { rows } = await query(
    `SELECT a.targeting, a.name, SUM(p.leads) AS leads, CASE WHEN SUM(p.leads) > 0 THEN SUM(p.spend) / SUM(p.leads) ELSE 999 END AS cpl FROM al_ad_sets a JOIN al_ad_performance p ON p.meta_campaign_id = a.campaign_meta_id WHERE a.targeting IS NOT NULL AND p.meta_ad_id IS NULL GROUP BY a.targeting, a.name HAVING SUM(p.leads) > 0 ORDER BY cpl ASC LIMIT 5`,
  );
  return rows.map((r: any) => ({ name: r.name, targeting: typeof r.targeting === 'string' ? JSON.parse(r.targeting) : r.targeting, leads: parseInt(r.leads as string) || 0, cpl: parseFloat(r.cpl as string) || 0 }));
}

export async function getMonthlyBudgetUsage(): Promise<{ spent: number; cap: number; dailySpendCents: number; dailyCap: number; daysRemaining: number }> {
  const firstOfMonth = new Date(); firstOfMonth.setDate(1);
  const monthStart = firstOfMonth.toISOString().split('T')[0];
  const { rows } = await query(`SELECT COALESCE(SUM(spend), 0) AS monthly_spent FROM al_ad_performance WHERE meta_ad_id IS NULL AND date >= $1`, [monthStart]);
  const { rows: dailyRows } = await query(`SELECT COALESCE(SUM(CAST(daily_budget AS INTEGER)), 0) AS total FROM al_ad_sets WHERE effective_status IN ('ACTIVE', 'LEARNING', 'LEARNING_LIMITED')`);
  const { rows: configRows } = await query(`SELECT key, value FROM al_optimizer_config WHERE key IN ('monthly_cap_cad', 'daily_cap_cents')`);
  const config: Record<string, string> = {};
  for (const r of configRows) config[r.key as string] = r.value as string;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  return { spent: parseFloat(rows[0]?.monthly_spent as string) || 0, cap: parseInt(config.monthly_cap_cad || '300'), dailySpendCents: parseInt(dailyRows[0]?.total as string) || 0, dailyCap: parseInt(config.daily_cap_cents || '1000'), daysRemaining: daysInMonth - new Date().getDate() };
}

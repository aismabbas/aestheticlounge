/**
 * Meta Ads API helper — syncs campaigns/ad sets/ads from Meta to Neon,
 * runs preflight checks, and manages ad operations.
 *
 * Ports: ads-tracker.py (sync + performance) and meta_preflight.py (budget checks)
 */

import { ulid } from './ulid';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const META_BASE = 'https://graph.facebook.com/v21.0';
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID || 'act_1035082445426356';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const PAGE_ID = process.env.META_PAGE_ID || '470913939437743';
const IG_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID || '17841469764033544';

/** $10 CAD/day max (Meta API uses cents) */
const AL_DAILY_CAP_CENTS = 1000;
/** $300 CAD/month hard cap */
const AL_MONTHLY_CAP = 300;
/** Target CPL in CAD */
const TARGET_CPL = 6;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QueryFn = (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

export interface SyncResult {
  campaigns: number;
  adSets: number;
  ads: number;
  changes: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  metaId: string;
  entityType: 'campaign' | 'adset' | 'ad';
  field: string;
  oldValue: string | null;
  newValue: string | null;
  source: string;
  createdAt: string;
}

export interface PreflightResult {
  ok: boolean;
  currentDailySpendCents: number;
  headroomCents: number;
  monthlyProjection: number;
  warnings: string[];
  errors: string[];
}

export interface AutoStopCandidate {
  metaAdId: string;
  adName: string;
  campaignName: string;
  spend: number;
  leads: number;
  cpl: number;
  daysActive: number;
  reason: string;
}

export interface CampaignInsights {
  campaignId: string;
  totalSpend: number;
  totalLeads: number;
  avgCpl: number;
  cplTrend: 'improving' | 'stable' | 'declining';
  bestAd: { metaAdId: string; name: string; cpl: number } | null;
  worstAd: { metaAdId: string; name: string; cpl: number } | null;
  frequencyWarning: boolean;
  avgFrequency: number;
  avgCtr: number;
  ctrVerdict: string;
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function metaGet(path: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(`${META_BASE}/${path}`);
  url.searchParams.set('access_token', ACCESS_TOKEN);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta API ${res.status}: ${body}`);
  }
  return res.json();
}

async function metaPost(path: string, body: Record<string, unknown>): Promise<unknown> {
  const url = `${META_BASE}/${path}`;
  const formData = new URLSearchParams();
  formData.set('access_token', ACCESS_TOKEN);
  for (const [k, v] of Object.entries(body)) {
    formData.set(k, typeof v === 'string' ? v : JSON.stringify(v));
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta API POST ${res.status}: ${text}`);
  }
  return res.json();
}

/** Fetch all pages of a Meta API list endpoint */
async function metaGetAll(path: string, params: Record<string, string> = {}): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let url: string | null = null;

  // First request
  const firstPage = (await metaGet(path, { ...params, limit: '100' })) as {
    data: Record<string, unknown>[];
    paging?: { next?: string };
  };
  all.push(...(firstPage.data || []));

  url = firstPage.paging?.next || null;
  while (url) {
    const res = await fetch(url);
    if (!res.ok) break;
    const page = (await res.json()) as {
      data: Record<string, unknown>[];
      paging?: { next?: string };
    };
    all.push(...(page.data || []));
    url = page.paging?.next || null;
  }

  return all;
}

function now(): string {
  return new Date().toISOString();
}

async function logAudit(
  db: QueryFn,
  metaId: string,
  entityType: 'campaign' | 'adset' | 'ad',
  field: string,
  oldValue: string | null,
  newValue: string | null,
  source: string,
): Promise<AuditEntry> {
  const entry: AuditEntry = {
    id: ulid(),
    metaId,
    entityType,
    field,
    oldValue,
    newValue,
    source,
    createdAt: now(),
  };
  await db(
    `INSERT INTO al_ad_audit_log (id, meta_id, entity_type, field, old_value, new_value, source, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [entry.id, entry.metaId, entry.entityType, entry.field, entry.oldValue, entry.newValue, entry.source, entry.createdAt],
  );
  return entry;
}

// ---------------------------------------------------------------------------
// syncFromMeta — pull campaigns/ad sets/ads from Meta and upsert to Neon
// ---------------------------------------------------------------------------

export async function syncFromMeta(db: QueryFn): Promise<SyncResult> {
  const changes: AuditEntry[] = [];
  let campaignCount = 0;
  let adSetCount = 0;
  let adCount = 0;

  // 1. Fetch all campaigns
  const campaigns = await metaGetAll(`${AD_ACCOUNT}/campaigns`, {
    fields: 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,buying_type,created_time',
  });

  for (const c of campaigns) {
    // Check for changes against existing row
    const existing = await db(
      `SELECT meta_id, name, status, effective_status, objective, daily_budget, lifetime_budget, buying_type
       FROM al_ad_campaigns WHERE meta_id = $1`,
      [c.id],
    );
    const old = existing.rows[0] || null;

    await db(
      `INSERT INTO al_ad_campaigns (id, meta_id, name, status, effective_status, objective, daily_budget, lifetime_budget, buying_type, created_time, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (meta_id) DO UPDATE SET
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         effective_status = EXCLUDED.effective_status,
         objective = EXCLUDED.objective,
         daily_budget = EXCLUDED.daily_budget,
         lifetime_budget = EXCLUDED.lifetime_budget,
         buying_type = EXCLUDED.buying_type,
         synced_at = EXCLUDED.synced_at`,
      [
        ulid(), c.id, c.name, c.status, c.effective_status, c.objective,
        c.daily_budget ?? null, c.lifetime_budget ?? null, c.buying_type ?? null,
        c.created_time ?? null, now(),
      ],
    );
    campaignCount++;

    // Log field-level changes
    if (old) {
      for (const field of ['name', 'status', 'effective_status', 'daily_budget', 'lifetime_budget'] as const) {
        const metaKey = field;
        const oldVal = String(old[metaKey] ?? '');
        const newVal = String(c[metaKey] ?? '');
        if (oldVal !== newVal) {
          changes.push(await logAudit(db, c.id as string, 'campaign', field, oldVal, newVal, 'sync'));
        }
      }
    } else {
      changes.push(await logAudit(db, c.id as string, 'campaign', 'created', null, c.name as string, 'sync'));
    }

    // 2. Fetch ad sets for this campaign
    const adSets = await metaGetAll(`${c.id}/adsets`, {
      fields: 'id,name,status,effective_status,daily_budget,optimization_goal,destination_type,targeting',
    });

    for (const as_ of adSets) {
      const existingAs = await db(
        `SELECT meta_id, name, status, effective_status, daily_budget, optimization_goal
         FROM al_ad_sets WHERE meta_id = $1`,
        [as_.id],
      );
      const oldAs = existingAs.rows[0] || null;

      await db(
        `INSERT INTO al_ad_sets (id, meta_id, campaign_meta_id, name, status, effective_status, daily_budget, optimization_goal, destination_type, targeting, synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (meta_id) DO UPDATE SET
           name = EXCLUDED.name,
           status = EXCLUDED.status,
           effective_status = EXCLUDED.effective_status,
           daily_budget = EXCLUDED.daily_budget,
           optimization_goal = EXCLUDED.optimization_goal,
           destination_type = EXCLUDED.destination_type,
           targeting = EXCLUDED.targeting,
           synced_at = EXCLUDED.synced_at`,
        [
          ulid(), as_.id, c.id, as_.name, as_.status, as_.effective_status,
          as_.daily_budget ?? null, as_.optimization_goal ?? null,
          as_.destination_type ?? null,
          as_.targeting ? JSON.stringify(as_.targeting) : null,
          now(),
        ],
      );
      adSetCount++;

      if (oldAs) {
        for (const field of ['name', 'status', 'effective_status', 'daily_budget'] as const) {
          const oldVal = String(oldAs[field] ?? '');
          const newVal = String(as_[field] ?? '');
          if (oldVal !== newVal) {
            changes.push(await logAudit(db, as_.id as string, 'adset', field, oldVal, newVal, 'sync'));
          }
        }
      }

      // 3. Fetch ads for this ad set
      const ads = await metaGetAll(`${as_.id}/ads`, {
        fields: 'id,name,status,effective_status,creative{id,title,body,call_to_action_type,image_url,thumbnail_url}',
      });

      for (const ad of ads) {
        const creative = (ad.creative || {}) as Record<string, unknown>;
        const existingAd = await db(
          `SELECT meta_id, name, status, effective_status FROM al_ad_creatives WHERE meta_id = $1`,
          [ad.id],
        );
        const oldAd = existingAd.rows[0] || null;

        await db(
          `INSERT INTO al_ad_creatives (id, meta_id, adset_meta_id, campaign_meta_id, name, status, effective_status, creative_id, headline, body, cta_type, image_url, thumbnail_url, synced_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (meta_id) DO UPDATE SET
             name = EXCLUDED.name,
             status = EXCLUDED.status,
             effective_status = EXCLUDED.effective_status,
             creative_id = EXCLUDED.creative_id,
             headline = EXCLUDED.headline,
             body = EXCLUDED.body,
             cta_type = EXCLUDED.cta_type,
             image_url = EXCLUDED.image_url,
             thumbnail_url = EXCLUDED.thumbnail_url,
             synced_at = EXCLUDED.synced_at`,
          [
            ulid(), ad.id, as_.id, c.id,
            ad.name, ad.status, ad.effective_status,
            creative.id ?? null, creative.title ?? null, creative.body ?? null,
            creative.call_to_action_type ?? null,
            creative.image_url ?? null, creative.thumbnail_url ?? null,
            now(),
          ],
        );
        adCount++;

        if (oldAd) {
          for (const field of ['name', 'status', 'effective_status'] as const) {
            const oldVal = String(oldAd[field] ?? '');
            const newVal = String(ad[field] ?? '');
            if (oldVal !== newVal) {
              changes.push(await logAudit(db, ad.id as string, 'ad', field, oldVal, newVal, 'sync'));
            }
          }
        }
      }
    }
  }

  return { campaigns: campaignCount, adSets: adSetCount, ads: adCount, changes };
}

// ---------------------------------------------------------------------------
// syncPerformance — pull daily insights from Meta
// ---------------------------------------------------------------------------

export async function syncPerformance(db: QueryFn): Promise<number> {
  let rowCount = 0;

  // Get all campaigns we track
  const { rows: campaigns } = await db(`SELECT meta_id, name FROM al_ad_campaigns`);

  for (const campaign of campaigns) {
    const metaCampaignId = campaign.meta_id as string;

    // Campaign-level daily insights
    try {
      const insightsData = (await metaGet(`${metaCampaignId}/insights`, {
        fields: 'impressions,reach,clicks,spend,actions,cost_per_action_type,cpc,cpm,ctr,frequency',
        date_preset: 'last_30d',
        time_increment: '1',
      })) as { data?: Record<string, unknown>[] };

      for (const day of insightsData.data || []) {
        const leads = ((day.actions as Array<{ action_type: string; value: string }>) || [])
          .find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
        const cplAction = ((day.cost_per_action_type as Array<{ action_type: string; value: string }>) || [])
          .find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');

        await db(
          `INSERT INTO al_ad_performance (id, meta_campaign_id, meta_ad_id, date, impressions, reach, clicks, spend, leads, cpl, cpc, cpm, ctr, frequency, synced_at)
           VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (meta_campaign_id, meta_ad_id, date)
           WHERE meta_ad_id IS NULL
           DO UPDATE SET
             impressions = EXCLUDED.impressions,
             reach = EXCLUDED.reach,
             clicks = EXCLUDED.clicks,
             spend = EXCLUDED.spend,
             leads = EXCLUDED.leads,
             cpl = EXCLUDED.cpl,
             cpc = EXCLUDED.cpc,
             cpm = EXCLUDED.cpm,
             ctr = EXCLUDED.ctr,
             frequency = EXCLUDED.frequency,
             synced_at = EXCLUDED.synced_at`,
          [
            ulid(), metaCampaignId, (day.date_start as string) || null,
            parseInt(day.impressions as string) || 0,
            parseInt(day.reach as string) || 0,
            parseInt(day.clicks as string) || 0,
            parseFloat(day.spend as string) || 0,
            leads ? parseInt(leads.value) : 0,
            cplAction ? parseFloat(cplAction.value) : 0,
            parseFloat(day.cpc as string) || 0,
            parseFloat(day.cpm as string) || 0,
            parseFloat(day.ctr as string) || 0,
            parseFloat(day.frequency as string) || 0,
            now(),
          ],
        );
        rowCount++;
      }
    } catch (err) {
      console.error(`[meta-ads] Failed to sync campaign insights for ${metaCampaignId}:`, err);
    }

    // Ad-level daily insights
    const { rows: ads } = await db(
      `SELECT meta_id FROM al_ad_creatives WHERE campaign_meta_id = $1`,
      [metaCampaignId],
    );

    for (const ad of ads) {
      const metaAdId = ad.meta_id as string;
      try {
        const adInsights = (await metaGet(`${metaAdId}/insights`, {
          fields: 'impressions,reach,clicks,spend,actions,cost_per_action_type,cpc,cpm,ctr,frequency',
          date_preset: 'last_30d',
          time_increment: '1',
        })) as { data?: Record<string, unknown>[] };

        for (const day of adInsights.data || []) {
          const leads = ((day.actions as Array<{ action_type: string; value: string }>) || [])
            .find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
          const cplAction = ((day.cost_per_action_type as Array<{ action_type: string; value: string }>) || [])
            .find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');

          await db(
            `INSERT INTO al_ad_performance (id, meta_campaign_id, meta_ad_id, date, impressions, reach, clicks, spend, leads, cpl, cpc, cpm, ctr, frequency, synced_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (meta_campaign_id, meta_ad_id, date) DO UPDATE SET
               impressions = EXCLUDED.impressions,
               reach = EXCLUDED.reach,
               clicks = EXCLUDED.clicks,
               spend = EXCLUDED.spend,
               leads = EXCLUDED.leads,
               cpl = EXCLUDED.cpl,
               cpc = EXCLUDED.cpc,
               cpm = EXCLUDED.cpm,
               ctr = EXCLUDED.ctr,
               frequency = EXCLUDED.frequency,
               synced_at = EXCLUDED.synced_at`,
            [
              ulid(), metaCampaignId, metaAdId,
              (day.date_start as string) || null,
              parseInt(day.impressions as string) || 0,
              parseInt(day.reach as string) || 0,
              parseInt(day.clicks as string) || 0,
              parseFloat(day.spend as string) || 0,
              leads ? parseInt(leads.value) : 0,
              cplAction ? parseFloat(cplAction.value) : 0,
              parseFloat(day.cpc as string) || 0,
              parseFloat(day.cpm as string) || 0,
              parseFloat(day.ctr as string) || 0,
              parseFloat(day.frequency as string) || 0,
              now(),
            ],
          );
          rowCount++;
        }
      } catch (err) {
        console.error(`[meta-ads] Failed to sync ad insights for ${metaAdId}:`, err);
      }
    }
  }

  return rowCount;
}

// ---------------------------------------------------------------------------
// preflight — budget guard before creating campaigns/ad sets
// ---------------------------------------------------------------------------

export async function preflight(db: QueryFn, proposedBudgetCents: number): Promise<PreflightResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Sum daily budgets of all active ad sets
  const { rows } = await db(
    `SELECT COALESCE(SUM(CAST(daily_budget AS INTEGER)), 0) AS total
     FROM al_ad_sets
     WHERE effective_status IN ('ACTIVE', 'LEARNING', 'LEARNING_LIMITED')`,
  );
  const currentDailySpendCents = parseInt(rows[0]?.total as string) || 0;

  const headroomCents = AL_DAILY_CAP_CENTS - currentDailySpendCents;
  const afterProposed = currentDailySpendCents + proposedBudgetCents;

  // Monthly projection: daily * 30
  const monthlyProjection = (afterProposed / 100) * 30;

  // Check daily cap
  if (afterProposed > AL_DAILY_CAP_CENTS) {
    errors.push(
      `Daily budget would be $${(afterProposed / 100).toFixed(2)}/day, exceeding $${(AL_DAILY_CAP_CENTS / 100).toFixed(2)}/day cap. Headroom: $${(headroomCents / 100).toFixed(2)}.`,
    );
  }

  // Check monthly cap
  if (monthlyProjection > AL_MONTHLY_CAP) {
    errors.push(
      `Monthly projection $${monthlyProjection.toFixed(2)} exceeds $${AL_MONTHLY_CAP}/month cap.`,
    );
  }

  // Warnings
  if (afterProposed > AL_DAILY_CAP_CENTS * 0.8 && afterProposed <= AL_DAILY_CAP_CENTS) {
    warnings.push(`Budget utilization over 80% — only $${(headroomCents / 100).toFixed(2)}/day remaining.`);
  }

  if (proposedBudgetCents < 200) {
    warnings.push('Budget under $2/day may limit delivery and increase CPL due to insufficient learning data.');
  }

  return {
    ok: errors.length === 0,
    currentDailySpendCents,
    headroomCents: Math.max(0, headroomCents),
    monthlyProjection,
    warnings,
    errors,
  };
}

// ---------------------------------------------------------------------------
// createCampaign
// ---------------------------------------------------------------------------

export async function createCampaign(
  db: QueryFn,
  data: { name: string; objective?: string; dailyBudget: number },
): Promise<{ id: string; metaId: string }> {
  const dailyBudgetCents = Math.round(data.dailyBudget * 100);

  // Preflight check
  const check = await preflight(db, dailyBudgetCents);
  if (!check.ok) {
    throw new Error(`Preflight failed: ${check.errors.join('; ')}`);
  }

  const result = (await metaPost(`${AD_ACCOUNT}/campaigns`, {
    name: data.name,
    objective: data.objective || 'OUTCOME_LEADS',
    status: 'PAUSED',
    special_ad_categories: '[]',
    daily_budget: String(dailyBudgetCents),
    buying_type: 'AUCTION',
  })) as { id: string };

  const id = ulid();
  await db(
    `INSERT INTO al_ad_campaigns (id, meta_id, name, status, effective_status, objective, daily_budget, buying_type, synced_at)
     VALUES ($1, $2, $3, 'PAUSED', 'PAUSED', $4, $5, 'AUCTION', $6)`,
    [id, result.id, data.name, data.objective || 'OUTCOME_LEADS', String(dailyBudgetCents), now()],
  );

  await logAudit(db, result.id, 'campaign', 'created', null, data.name, 'dashboard');

  return { id, metaId: result.id };
}

// ---------------------------------------------------------------------------
// createAdSet
// ---------------------------------------------------------------------------

export async function createAdSet(
  db: QueryFn,
  data: {
    campaignId: string;
    name: string;
    dailyBudget: number;
    targeting: Record<string, unknown>;
    optimizationGoal?: string;
  },
): Promise<{ id: string; metaId: string }> {
  const dailyBudgetCents = Math.round(data.dailyBudget * 100);

  const check = await preflight(db, dailyBudgetCents);
  if (!check.ok) {
    throw new Error(`Preflight failed: ${check.errors.join('; ')}`);
  }

  const result = (await metaPost(`${AD_ACCOUNT}/adsets`, {
    campaign_id: data.campaignId,
    name: data.name,
    status: 'PAUSED',
    daily_budget: String(dailyBudgetCents),
    optimization_goal: data.optimizationGoal || 'LEAD_GENERATION',
    billing_event: 'IMPRESSIONS',
    destination_type: 'ON_AD',
    promoted_object: JSON.stringify({ page_id: PAGE_ID }),
    targeting: JSON.stringify(data.targeting),
  })) as { id: string };

  const id = ulid();
  await db(
    `INSERT INTO al_ad_sets (id, meta_id, campaign_meta_id, name, status, effective_status, daily_budget, optimization_goal, destination_type, targeting, synced_at)
     VALUES ($1, $2, $3, $4, 'PAUSED', 'PAUSED', $5, $6, 'ON_AD', $7, $8)`,
    [
      id, result.id, data.campaignId, data.name,
      String(dailyBudgetCents), data.optimizationGoal || 'LEAD_GENERATION',
      JSON.stringify(data.targeting), now(),
    ],
  );

  await logAudit(db, result.id, 'adset', 'created', null, data.name, 'dashboard');

  return { id, metaId: result.id };
}

// ---------------------------------------------------------------------------
// createAd
// ---------------------------------------------------------------------------

export async function createAd(
  db: QueryFn,
  data: {
    adSetId: string;
    name: string;
    headline: string;
    body: string;
    imageUrl: string;
    ctaType?: string;
    leadFormId?: string;
  },
): Promise<{ id: string; metaId: string }> {
  // Upload image first to get hash
  const imageHash = await uploadImage(data.imageUrl);

  // Build creative spec — MUST include instagram_user_id
  const callToAction: Record<string, unknown> = {
    type: data.ctaType || 'LEARN_MORE',
  };
  if (data.leadFormId) {
    callToAction.value = { lead_gen_form_id: data.leadFormId };
  }

  const creative = {
    object_story_spec: {
      page_id: PAGE_ID,
      instagram_user_id: IG_ACCOUNT_ID,
      link_data: {
        image_hash: imageHash,
        message: data.body,
        name: data.headline,
        call_to_action: callToAction,
      },
    },
  };

  // Look up campaign_meta_id from the ad set
  const { rows: adSetRows } = await db(
    `SELECT campaign_meta_id FROM al_ad_sets WHERE meta_id = $1`,
    [data.adSetId],
  );
  const campaignMetaId = (adSetRows[0]?.campaign_meta_id as string) || null;

  const result = (await metaPost(`${AD_ACCOUNT}/ads`, {
    adset_id: data.adSetId,
    name: data.name,
    status: 'PAUSED',
    creative: JSON.stringify(creative),
  })) as { id: string };

  const id = ulid();
  await db(
    `INSERT INTO al_ad_creatives (id, meta_id, adset_meta_id, campaign_meta_id, name, status, effective_status, headline, body, cta_type, image_url, synced_at)
     VALUES ($1, $2, $3, $4, $5, 'PAUSED', 'PAUSED', $6, $7, $8, $9, $10)`,
    [
      id, result.id, data.adSetId, campaignMetaId,
      data.name, data.headline, data.body,
      data.ctaType || 'LEARN_MORE', data.imageUrl, now(),
    ],
  );

  await logAudit(db, result.id, 'ad', 'created', null, data.name, 'dashboard');

  return { id, metaId: result.id };
}

// ---------------------------------------------------------------------------
// uploadImage — download image then POST to Meta as adimage
// ---------------------------------------------------------------------------

export async function uploadImage(imageUrl: string): Promise<string> {
  // Download the image
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to download image from ${imageUrl}`);
  const buffer = await imgRes.arrayBuffer();

  // Upload to Meta as multipart
  const formData = new FormData();
  formData.append('access_token', ACCESS_TOKEN);
  formData.append('filename', new Blob([buffer]), 'image.jpg');

  const res = await fetch(`${META_BASE}/${AD_ACCOUNT}/adimages`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta image upload failed ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { images: Record<string, { hash: string }> };
  // Response has images: { "filename": { hash: "...", ... } }
  const firstKey = Object.keys(json.images || {})[0];
  if (!firstKey) throw new Error('No image hash returned from Meta');
  return json.images[firstKey].hash;
}

// ---------------------------------------------------------------------------
// pauseAd / activateAd
// ---------------------------------------------------------------------------

export async function pauseAd(db: QueryFn, metaAdId: string): Promise<void> {
  await metaPost(metaAdId, { status: 'PAUSED' });
  await db(
    `UPDATE al_ad_creatives SET status = 'PAUSED', effective_status = 'PAUSED', synced_at = $1 WHERE meta_id = $2`,
    [now(), metaAdId],
  );
  await logAudit(db, metaAdId, 'ad', 'status', 'ACTIVE', 'PAUSED', 'dashboard');
}

export async function activateAd(db: QueryFn, metaAdId: string): Promise<void> {
  await metaPost(metaAdId, { status: 'ACTIVE' });
  await db(
    `UPDATE al_ad_creatives SET status = 'ACTIVE', effective_status = 'ACTIVE', synced_at = $1 WHERE meta_id = $2`,
    [now(), metaAdId],
  );
  await logAudit(db, metaAdId, 'ad', 'status', 'PAUSED', 'ACTIVE', 'dashboard');
}

// ---------------------------------------------------------------------------
// getAutoStopCandidates — find underperforming ads
// ---------------------------------------------------------------------------

export async function getAutoStopCandidates(db: QueryFn): Promise<AutoStopCandidate[]> {
  const candidates: AutoStopCandidate[] = [];

  // Ads with 3+ days data, zero leads and spend > 2x target CPL
  const { rows: zeroLeadAds } = await db(
    `SELECT
       p.meta_ad_id,
       ac.name AS ad_name,
       c.name AS campaign_name,
       SUM(p.spend) AS total_spend,
       SUM(p.leads) AS total_leads,
       COUNT(DISTINCT p.date) AS days_active
     FROM al_ad_performance p
     JOIN al_ad_creatives ac ON ac.meta_id = p.meta_ad_id
     JOIN al_ad_campaigns c ON c.meta_id = p.meta_campaign_id
     WHERE p.meta_ad_id IS NOT NULL
       AND ac.effective_status IN ('ACTIVE', 'LEARNING', 'LEARNING_LIMITED')
     GROUP BY p.meta_ad_id, ac.name, c.name
     HAVING COUNT(DISTINCT p.date) >= 3
       AND SUM(p.leads) = 0
       AND SUM(p.spend) > $1`,
    [TARGET_CPL * 2],
  );

  for (const row of zeroLeadAds) {
    candidates.push({
      metaAdId: row.meta_ad_id as string,
      adName: row.ad_name as string,
      campaignName: row.campaign_name as string,
      spend: parseFloat(row.total_spend as string),
      leads: 0,
      cpl: 0,
      daysActive: parseInt(row.days_active as string),
      reason: `Zero leads after ${row.days_active} days and $${parseFloat(row.total_spend as string).toFixed(2)} spend (>${TARGET_CPL * 2} threshold).`,
    });
  }

  // Ads with CPL > 3x target for 5+ consecutive days
  const { rows: highCplAds } = await db(
    `WITH daily_cpl AS (
       SELECT
         p.meta_ad_id,
         p.date,
         CASE WHEN p.leads > 0 THEN p.spend / p.leads ELSE NULL END AS daily_cpl
       FROM al_ad_performance p
       JOIN al_ad_creatives ac ON ac.meta_id = p.meta_ad_id
       WHERE p.meta_ad_id IS NOT NULL
         AND ac.effective_status IN ('ACTIVE', 'LEARNING', 'LEARNING_LIMITED')
     ),
     streaks AS (
       SELECT
         meta_ad_id,
         date,
         daily_cpl,
         date - ROW_NUMBER() OVER (PARTITION BY meta_ad_id ORDER BY date)::int * INTERVAL '1 day' AS grp
       FROM daily_cpl
       WHERE daily_cpl > $1
     ),
     streak_lengths AS (
       SELECT meta_ad_id, COUNT(*) AS streak_len, MAX(daily_cpl) AS max_cpl
       FROM streaks
       GROUP BY meta_ad_id, grp
       HAVING COUNT(*) >= 5
     )
     SELECT DISTINCT ON (sl.meta_ad_id)
       sl.meta_ad_id,
       ac.name AS ad_name,
       c.name AS campaign_name,
       sl.streak_len,
       sl.max_cpl
     FROM streak_lengths sl
     JOIN al_ad_creatives ac ON ac.meta_id = sl.meta_ad_id
     JOIN al_ad_campaigns c ON c.meta_id = ac.campaign_meta_id`,
    [TARGET_CPL * 3],
  );

  for (const row of highCplAds) {
    candidates.push({
      metaAdId: row.meta_ad_id as string,
      adName: row.ad_name as string,
      campaignName: row.campaign_name as string,
      spend: 0,
      leads: 0,
      cpl: parseFloat(row.max_cpl as string),
      daysActive: parseInt(row.streak_len as string),
      reason: `CPL exceeded $${(TARGET_CPL * 3).toFixed(2)} for ${row.streak_len} consecutive days (peak $${parseFloat(row.max_cpl as string).toFixed(2)}).`,
    });
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// generateInsights — analyze campaign performance trends
// ---------------------------------------------------------------------------

export async function generateInsights(db: QueryFn, campaignId: string): Promise<CampaignInsights> {
  // Daily performance for the campaign
  const { rows: daily } = await db(
    `SELECT date, spend, leads, cpl, ctr, frequency
     FROM al_ad_performance
     WHERE meta_campaign_id = $1 AND meta_ad_id IS NULL
     ORDER BY date ASC`,
    [campaignId],
  );

  const totalSpend = daily.reduce((s, r) => s + (parseFloat(r.spend as string) || 0), 0);
  const totalLeads = daily.reduce((s, r) => s + (parseInt(r.leads as string) || 0), 0);
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

  // CPL trend: compare first half to second half
  let cplTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (daily.length >= 6) {
    const mid = Math.floor(daily.length / 2);
    const firstHalf = daily.slice(0, mid).filter(r => parseFloat(r.cpl as string) > 0);
    const secondHalf = daily.slice(mid).filter(r => parseFloat(r.cpl as string) > 0);

    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const avgFirst = firstHalf.reduce((s, r) => s + parseFloat(r.cpl as string), 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, r) => s + parseFloat(r.cpl as string), 0) / secondHalf.length;
      const pctChange = ((avgSecond - avgFirst) / avgFirst) * 100;
      if (pctChange < -10) cplTrend = 'improving';
      else if (pctChange > 10) cplTrend = 'declining';
    }
  }

  // Best and worst ad by CPL
  const { rows: adPerf } = await db(
    `SELECT
       p.meta_ad_id,
       ac.name,
       SUM(p.spend) AS total_spend,
       SUM(p.leads) AS total_leads,
       CASE WHEN SUM(p.leads) > 0 THEN SUM(p.spend) / SUM(p.leads) ELSE NULL END AS cpl
     FROM al_ad_performance p
     JOIN al_ad_creatives ac ON ac.meta_id = p.meta_ad_id
     WHERE p.meta_campaign_id = $1 AND p.meta_ad_id IS NOT NULL
     GROUP BY p.meta_ad_id, ac.name
     HAVING SUM(p.leads) > 0
     ORDER BY cpl ASC`,
    [campaignId],
  );

  const bestAd = adPerf.length > 0
    ? { metaAdId: adPerf[0].meta_ad_id as string, name: adPerf[0].name as string, cpl: parseFloat(adPerf[0].cpl as string) }
    : null;
  const worstAd = adPerf.length > 1
    ? { metaAdId: adPerf[adPerf.length - 1].meta_ad_id as string, name: adPerf[adPerf.length - 1].name as string, cpl: parseFloat(adPerf[adPerf.length - 1].cpl as string) }
    : null;

  // Frequency and CTR averages
  const avgFrequency = daily.length > 0
    ? daily.reduce((s, r) => s + (parseFloat(r.frequency as string) || 0), 0) / daily.length
    : 0;
  const frequencyWarning = avgFrequency > 3;

  const avgCtr = daily.length > 0
    ? daily.reduce((s, r) => s + (parseFloat(r.ctr as string) || 0), 0) / daily.length
    : 0;

  let ctrVerdict = 'No data';
  if (avgCtr > 2) ctrVerdict = 'Excellent — creative is resonating';
  else if (avgCtr > 1) ctrVerdict = 'Average — test new creative variants';
  else if (avgCtr > 0) ctrVerdict = 'Below average — refresh creative urgently';

  // Recommendations
  const recommendations: string[] = [];
  if (cplTrend === 'declining') {
    recommendations.push('CPL is rising — consider refreshing ad creative or narrowing audience targeting.');
  }
  if (frequencyWarning) {
    recommendations.push(`Frequency at ${avgFrequency.toFixed(1)}x — expand audience or rotate creatives to avoid fatigue.`);
  }
  if (avgCtr < 1 && totalSpend > 20) {
    recommendations.push('Low CTR with meaningful spend — test doctor-featuring content or stronger hooks.');
  }
  if (totalLeads === 0 && totalSpend > TARGET_CPL * 3) {
    recommendations.push('No leads despite spend — verify lead form is connected and working.');
  }
  if (bestAd && worstAd && worstAd.cpl > bestAd.cpl * 3) {
    recommendations.push(`Worst ad CPL ($${worstAd.cpl.toFixed(2)}) is 3x+ best ($${bestAd.cpl.toFixed(2)}) — consider pausing underperformers.`);
  }

  return {
    campaignId,
    totalSpend,
    totalLeads,
    avgCpl,
    cplTrend,
    bestAd,
    worstAd,
    frequencyWarning,
    avgFrequency,
    avgCtr,
    ctrVerdict,
    recommendations,
  };
}

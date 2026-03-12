/**
 * Draft queue management + decision logging — extracted from al-pipeline.ts
 */

import { query } from './db.js';
import type { AgentName } from './claude.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineDraft {
  id: string;
  stage: 'pending_copy' | 'pending_design' | 'pending_publish' | 'published' | 'rejected';
  topic: string;
  contentType: string;
  caption?: string;
  headline?: string;
  designApproach?: string;
  imageUrl?: string;
  imageUrls?: string[];
  templateParams?: Record<string, unknown>;
  reelScenes?: Record<string, unknown>[];
  voiceoverText?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
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

// ---------------------------------------------------------------------------
// Decision Log
// ---------------------------------------------------------------------------

export async function logDecision(
  agent: AgentName,
  action: string,
  decision: string,
  result?: string,
): Promise<void> {
  let jsonData: string | null = null;
  if (result) {
    try {
      JSON.parse(result);
      jsonData = result;
    } catch {
      jsonData = JSON.stringify({ value: result });
    }
  }
  await query(
    `INSERT INTO al_decision_log (agent, action, reasoning, data, timestamp)
     VALUES ($1, $2, $3, $4::jsonb, NOW())`,
    [agent, action, decision, jsonData],
  );
}

// ---------------------------------------------------------------------------
// Draft Queue
// ---------------------------------------------------------------------------

export async function generateDraftId(): Promise<string> {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveDraft(draft: PipelineDraft): Promise<string> {
  const result = await query(
    `INSERT INTO al_pipeline_drafts
     (id, stage, topic, content_type, caption, headline, design_approach,
      image_url, image_urls, template_params, reel_scenes, voiceover_text, model, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14, $15)
     ON CONFLICT (id) DO UPDATE SET
       stage = EXCLUDED.stage,
       caption = COALESCE(EXCLUDED.caption, al_pipeline_drafts.caption),
       headline = COALESCE(EXCLUDED.headline, al_pipeline_drafts.headline),
       design_approach = COALESCE(EXCLUDED.design_approach, al_pipeline_drafts.design_approach),
       image_url = COALESCE(EXCLUDED.image_url, al_pipeline_drafts.image_url),
       image_urls = COALESCE(EXCLUDED.image_urls, al_pipeline_drafts.image_urls),
       template_params = COALESCE(EXCLUDED.template_params, al_pipeline_drafts.template_params),
       reel_scenes = COALESCE(EXCLUDED.reel_scenes, al_pipeline_drafts.reel_scenes),
       voiceover_text = COALESCE(EXCLUDED.voiceover_text, al_pipeline_drafts.voiceover_text),
       model = COALESCE(EXCLUDED.model, al_pipeline_drafts.model),
       updated_at = EXCLUDED.updated_at
     RETURNING id`,
    [
      draft.id,
      draft.stage,
      draft.topic,
      draft.contentType,
      draft.caption || null,
      draft.headline || null,
      draft.designApproach || null,
      draft.imageUrl || null,
      draft.imageUrls ? JSON.stringify(draft.imageUrls) : null,
      draft.templateParams ? JSON.stringify(draft.templateParams) : null,
      draft.reelScenes ? JSON.stringify(draft.reelScenes) : null,
      draft.voiceoverText || null,
      draft.model || null,
      draft.createdAt,
      draft.updatedAt,
    ],
  );
  return result.rows[0].id;
}

export async function getDrafts(
  stage?: string,
  limit = 20,
): Promise<PipelineDraft[]> {
  const sql = stage
    ? 'SELECT * FROM al_pipeline_drafts WHERE stage = $1 ORDER BY updated_at DESC LIMIT $2'
    : 'SELECT * FROM al_pipeline_drafts ORDER BY updated_at DESC LIMIT $1';
  const params = stage ? [stage, limit] : [limit];
  const result = await query(sql, params);
  return result.rows.map(rowToDraft);
}

export async function getDraft(id: string): Promise<PipelineDraft | null> {
  const result = await query('SELECT * FROM al_pipeline_drafts WHERE id = $1', [id]);
  return result.rows.length > 0 ? rowToDraft(result.rows[0]) : null;
}

export async function updateDraftStage(id: string, stage: string): Promise<void> {
  await query(
    'UPDATE al_pipeline_drafts SET stage = $1, updated_at = NOW() WHERE id = $2',
    [stage, id],
  );
}

export async function deleteDrafts(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query(
    `DELETE FROM al_pipeline_drafts WHERE id IN (${placeholders})`,
    ids,
  );
  return result.rowCount ?? 0;
}

export async function deleteAllDrafts(stage?: string): Promise<number> {
  const result = stage
    ? await query('DELETE FROM al_pipeline_drafts WHERE stage = $1', [stage])
    : await query('DELETE FROM al_pipeline_drafts');
  return result.rowCount ?? 0;
}

function rowToDraft(row: any): PipelineDraft {
  return {
    id: row.id,
    stage: row.stage,
    topic: row.topic,
    contentType: row.content_type,
    caption: row.caption,
    headline: row.headline,
    designApproach: row.design_approach,
    imageUrl: row.image_url,
    imageUrls: row.image_urls ? (typeof row.image_urls === 'string' ? JSON.parse(row.image_urls) : row.image_urls) : undefined,
    templateParams: row.template_params ? (typeof row.template_params === 'string' ? JSON.parse(row.template_params) : row.template_params) : undefined,
    reelScenes: row.reel_scenes ? (typeof row.reel_scenes === 'string' ? JSON.parse(row.reel_scenes) : row.reel_scenes) : undefined,
    voiceoverText: row.voiceover_text,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// QA Validation
// ---------------------------------------------------------------------------

export function qaValidate(draft: PipelineDraft, imageUrls?: string[]): QAResult {
  const checks: QACheck[] = [];
  const caption = draft.caption || '';
  const headline = draft.headline || '';

  const wordCount = caption.split(/\s+/).filter(Boolean).length;
  checks.push({
    name: 'Caption length',
    passed: wordCount >= 100 && wordCount <= 400,
    detail: `${wordCount} words (target: 150-300)`,
  });

  const firstLine = caption.split('\n')[0] || '';
  checks.push({
    name: 'Hook first line',
    passed: firstLine.length >= 10 && firstLine.length <= 150,
    detail: firstLine.length >= 10 ? 'Hook present' : 'First line too short — needs a hook',
  });

  const ctaPatterns = /book|consult|dm|message|call|visit|click|link|schedule|appointment/i;
  checks.push({
    name: 'CTA present',
    passed: ctaPatterns.test(caption),
    detail: ctaPatterns.test(caption) ? 'CTA found' : 'No call-to-action detected',
  });

  const disclaimerPattern = /individual results may vary|results vary|consult.*medical|consult.*professional/i;
  checks.push({
    name: 'Medical disclaimer',
    passed: disclaimerPattern.test(caption),
    detail: disclaimerPattern.test(caption) ? 'Disclaimer present' : 'Missing: "Individual results may vary..."',
  });

  const pricePattern = /\$\d|PKR\s*\d|Rs\.?\s*\d|\d+\s*PKR/i;
  checks.push({
    name: 'No prices',
    passed: !pricePattern.test(caption),
    detail: pricePattern.test(caption) ? 'Price found — remove from caption' : 'No prices mentioned',
  });

  const competitorPattern = /cosmo|derma\s*life|skin\s*logics|glow\s*up\s*clinic/i;
  checks.push({
    name: 'No competitors',
    passed: !competitorPattern.test(caption),
    detail: !competitorPattern.test(caption) ? 'No competitor names' : 'Competitor name detected',
  });

  checks.push({
    name: 'Headline length',
    passed: headline.length > 0 && headline.length <= 60,
    detail: headline.length === 0 ? 'No headline' : `${headline.length} chars (max 60)`,
  });

  if (draft.contentType === 'carousel') {
    const slideCount = draft.imageUrls?.length || 0;
    checks.push({
      name: 'Carousel slides',
      passed: slideCount >= 4,
      detail: `${slideCount} slides (min 4)`,
    });
  }

  if (draft.contentType === 'reel') {
    const sceneCount = draft.reelScenes?.length || 0;
    checks.push({
      name: 'Reel scenes',
      passed: sceneCount >= 3,
      detail: `${sceneCount} scenes (min 3)`,
    });
    checks.push({
      name: 'Voiceover present',
      passed: !!draft.voiceoverText,
      detail: draft.voiceoverText ? 'Voiceover script present' : 'Missing voiceover text',
    });
  }

  if (imageUrls && imageUrls.length > 0) {
    checks.push({
      name: 'Images available',
      passed: true,
      detail: `${imageUrls.length} image(s) ready`,
    });
  }

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}

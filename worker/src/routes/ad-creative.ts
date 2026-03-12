/**
 * Ad Creative route — migrated from src/app/api/al/ad-creative/route.ts
 * Generates ad copy + images using the AI pipeline.
 */

import { Hono } from 'hono';
import {
  loadAgentMemory,
  buildSystemPrompt,
  callClaude,
  parseJSON,
} from '../lib/claude.js';
import { generateImage } from '../lib/image-gen.js';
import { logDecision } from '../lib/drafts.js';

export const adCreativeRoute = new Hono();

/**
 * POST /ad-creative
 * Body: { treatment, objective, model?, freeform?, generateImages?, numImages? }
 */
adCreativeRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { treatment, objective, model, freeform, generateImages, numImages = 2 } = body;

    if (!treatment) {
      return c.json({ error: 'treatment is required' }, 400);
    }

    // Step 1: Generate ad copy using copywriter agent
    const copywriterMem = await loadAgentMemory('copywriter');
    const copyResponse = await callClaude({
      agent: 'copywriter',
      userMessage: `Write Instagram ad creative for: ${treatment}

Objective: ${objective === 'OUTCOME_LEADS' ? 'Lead generation (Instant Form)' : 'Website traffic'}
${model ? `Featured model/character: ${model}` : 'Choose the best character for this treatment.'}
${freeform ? `\nCreative direction: ${freeform}` : ''}

Output JSON:
{
  "headline": "...(max 40 chars, punchy)...",
  "primary_text": "...(ad body text, 125 chars for feed, includes CTA)...",
  "description": "...(link description, 30 chars max)...",
  "cta_type": "BOOK_TRAVEL|LEARN_MORE|SIGN_UP",
  "hashtags": ["...", "..."],
  "character": "ayesha|meher|noor|usman",
  "image_prompt": "detailed prompt for ad image...",
  "ad_angle": "authority|scarcity|social_proof|transformation|pain_point"
}`,
      systemPrompt: buildSystemPrompt(copywriterMem),
      temperature: 0.4,
      maxTokens: 1500,
    });

    const adCopy = parseJSON<{
      headline?: string;
      primary_text?: string;
      description?: string;
      cta_type?: string;
      hashtags?: string[];
      character?: string;
      image_prompt?: string;
      ad_angle?: string;
    }>(copyResponse.text);

    let images: string[] = [];

    // Step 2: Generate ad images if requested
    if (generateImages && adCopy?.image_prompt) {
      const designerMem = await loadAgentMemory('designer');
      const enhancedResponse = await callClaude({
        agent: 'designer',
        userMessage: `Enhance this into a Nano Banana Pro prompt for an Instagram ad image:

Treatment: ${treatment}
Character: ${adCopy.character || model || 'ayesha'}
Ad angle: ${adCopy.ad_angle || 'transformation'}
Base prompt: ${adCopy.image_prompt}
${freeform ? `Creative direction: ${freeform}` : ''}

Output ONLY the enhanced prompt string. Include character appearance details from memory, brand aesthetics (cream/gold luxury clinic), camera specs, and "No text overlay" directive.`,
        systemPrompt: buildSystemPrompt(designerMem),
        temperature: 0.3,
        maxTokens: 500,
      });

      const finalPrompt = enhancedResponse.text.replace(/^["']|["']$/g, '').trim();

      images = await generateImage({
        prompt: finalPrompt,
        width: 1080,
        height: 1080,
        numImages: Math.min(numImages, 4),
      });
    }

    await logDecision(
      'copywriter',
      'ad_creative',
      `Ad creative for: ${treatment}`,
      JSON.stringify({ headline: adCopy?.headline, angle: adCopy?.ad_angle, imageCount: images.length }),
    );

    return c.json({
      success: true,
      copy: adCopy || { raw: copyResponse.text },
      images,
      tokens: {
        input: copyResponse.inputTokens,
        output: copyResponse.outputTokens,
      },
    });
  } catch (err) {
    console.error('[ad-creative] error:', err);
    return c.json(
      { error: err instanceof Error ? err.message : 'Ad creative generation failed' },
      500,
    );
  }
});

/**
 * Ads Chat route — migrated from src/app/api/al/ads/chat/route.ts
 * Conversational campaign planner with SSE streaming.
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import {
  loadAgentMemory,
  buildSystemPrompt,
  callClaude,
  parseJSON,
} from '../lib/claude.js';
import { generateImage } from '../lib/image-gen.js';
import { logDecision, generateDraftId, saveDraft } from '../lib/drafts.js';
import { qaValidate } from '../lib/drafts.js';
import {
  getPerformanceHistory,
  getLearnings,
  getSeasonalContext,
  getRunningCampaigns,
  getBestAudienceTargeting,
  getMonthlyBudgetUsage,
} from '../lib/market-research.js';

// ---------------------------------------------------------------------------
// Inline data — avoids pulling in the 1200-line services.ts and marketing-config.ts
// ---------------------------------------------------------------------------

const MODELS = [
  { name: 'Ayesha', desc: 'Fair, conservative — face treatments, Ramadan/Eid' },
  { name: 'Meher', desc: 'Curvy, sultry — body contouring, spa, before/after' },
  { name: 'Noor', desc: 'Athletic, toned — laser legs/arms' },
  { name: 'Usman', desc: 'Professional male — Hair PRP' },
];

// Minimal treatment list for strategy context (category: treatment pairs)
const TREATMENT_LIST = `Medicated Facials: HydraFacial, Carbon Peel Facial, Vampire Facial (PRP), Chemical Peel, Acne Treatment Facial, Gold Facial, Whitening Facial, Anti-Aging Facial
Laser Treatments: Laser Hair Removal (Full Body), Laser Hair Removal (Face), Laser Skin Rejuvenation, Laser Pigmentation Removal, Laser Tattoo Removal, Laser Acne Scar Treatment
Injectables: Botox, Dermal Fillers, Lip Fillers, Under-Eye Fillers, Jaw Contouring, Non-Surgical Nose Job
Body Contouring: CoolSculpting, HIFU Body, Lipo Cavitation, RF Skin Tightening
Skin Rejuvenation: Microneedling, Derma Roller, PRP Therapy, Exosome Therapy, Chemical Peels (Advanced)
Hair Restoration: Hair PRP, GFC Hair Treatment, Mesotherapy for Hair, Scalp Micropigmentation
IV Therapy: Skin Glow Drip, Energy Boost, Immune Support, Hangover Recovery, Weight Management
Dental: Teeth Whitening, Dental Veneers, Smile Design`;

// ---------------------------------------------------------------------------
// Campaign State
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

// ---------------------------------------------------------------------------
// Build rich context for the AI strategist
// ---------------------------------------------------------------------------

async function buildStrategyContext(): Promise<string> {
  const [perf, learnings, seasonal, campaigns, audiences, budget] = await Promise.all([
    getPerformanceHistory(30).catch(() => null),
    getLearnings(5).catch(() => []),
    getSeasonalContext(),
    getRunningCampaigns().catch(() => []),
    getBestAudienceTargeting().catch(() => []),
    getMonthlyBudgetUsage().catch(() => ({ spent: 0, cap: 300, dailySpendCents: 0, dailyCap: 1000, daysRemaining: 20 })),
  ]);

  const modelList = MODELS.map((m) => `${m.name}: ${m.desc}`).join('\n');

  return `## PERFORMANCE (Last 30 Days)
${perf ? `Spend: $${perf.totalSpend.toFixed(2)} | Leads: ${perf.totalLeads} | Avg CPL: $${perf.avgCpl.toFixed(2)} | CTR: ${perf.avgCtr.toFixed(2)}%
Top ads: ${perf.topAds.map((a) => `${a.name} (CPL $${a.cpl.toFixed(2)})`).join(', ') || 'None yet'}
Worst ads: ${perf.worstAds.map((a) => `${a.name} (CPL $${a.cpl.toFixed(2)})`).join(', ') || 'None'}` : 'No performance data yet.'}

## BUDGET
Monthly: $${budget.spent.toFixed(2)}/$${budget.cap} | Daily active: $${(budget.dailySpendCents / 100).toFixed(2)}/$${(budget.dailyCap / 100).toFixed(2)} | ${budget.daysRemaining} days left in month

## SEASONAL CONTEXT
Season: ${seasonal.season} | Events: ${seasonal.events.join(', ')}
Recommended treatments: ${seasonal.recommended_treatments.join(', ')}

## RUNNING CAMPAIGNS
${campaigns.length > 0 ? campaigns.map((c) => `${c.name} (${c.status}) — $${c.spend30d.toFixed(2)} spent, ${c.leads30d} leads, CPL $${c.cpl30d.toFixed(2)}`).join('\n') : 'No active campaigns'}

## BEST AUDIENCES
${audiences.length > 0 ? audiences.map((a) => `${(a as { name: string }).name}: ${(a as { leads: number }).leads} leads, CPL $${(a as { cpl: number }).cpl.toFixed(2)}`).join('\n') : 'No audience data yet — recommend DHA targeting (Women 25-50, 5km radius)'}

## LEARNINGS
${learnings.length > 0 ? learnings.slice(0, 3).join('\n') : 'No learnings yet.'}

## AVAILABLE TREATMENTS
${TREATMENT_LIST}

## AVAILABLE MODELS (for ad creative)
${modelList}

## BRAND RULES
- Platform: Instagram ONLY
- Budget: ABO only, $300 CAD/month cap, max $10/day
- CTA: BOOK_TRAVEL (or LEARN_MORE for brand)
- No prices in ad copy
- Medical disclaimer required: "Individual results may vary"
- All campaigns created as PAUSED — staff activates manually`;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export const adsChatRoute = new Hono();

adsChatRoute.post('/', (c) => {
  return streamSSE(c, async (stream) => {
    const keepalive = setInterval(async () => {
      try {
        await stream.writeSSE({ data: JSON.stringify({ type: 'ping' }) });
      } catch { /* stream closed */ }
    }, 5000);

    const send = async (data: Record<string, unknown>) => {
      try {
        await stream.writeSSE({ data: JSON.stringify(data) });
      } catch { /* stream closed */ }
    };

    try {
      const body = await c.req.json();
      const { message, campaignState: inputState } = body as {
        message: string;
        campaignState?: CampaignState;
      };

      if (!message) {
        await send({ type: 'result', success: false, error: 'message is required' });
        return;
      }

      const state: CampaignState = inputState || { stage: 'researching' };

      await send({ type: 'step', step: 'Loading campaign intelligence...' });

      const strategyContext = await buildStrategyContext();

      const resMem = await loadAgentMemory('researcher');
      const basePrompt = buildSystemPrompt(resMem);

      const systemPrompt = `${basePrompt}

## YOUR ROLE: AD CAMPAIGN STRATEGIST
You are an expert Meta Ads campaign strategist for Aesthetic Lounge, a medical aesthetics clinic in DHA Phase 8, Lahore.

Your job: guide the user through planning a new ad campaign via conversation. Be opinionated — push back on weak ideas, suggest better angles, explain trade-offs.

## CURRENT DATA
${strategyContext}

## CAMPAIGN STATE
${JSON.stringify(state, null, 2)}

## CONVERSATION RULES
1. Ask one question at a time — don't overwhelm
2. When you have enough info to finalize, set the stage to 'reviewing' and include ALL fields
3. When user approves, set stage to 'creating' to trigger creative generation
4. After creative is generated, set stage to 'ready'
5. Be specific with audience recommendations — cite past data
6. Recommend a model (Ayesha/Meher/Noor/Usman) based on treatment type
7. Always suggest a hook type: authority, scarcity, transformation, pain_point, social_proof

## OUTPUT FORMAT
Always respond with JSON:
{
  "response": "Your conversational message to the user",
  "campaignState": { ...updated campaign state... },
  "action": null | "generate_creative" | "generate_landing_page"
}

If stage is 'creating', set action to 'generate_creative'.
IMPORTANT: The "response" field should be friendly, conversational text — NOT JSON.`;

      await send({ type: 'step', step: 'Thinking...' });

      const response = await callClaude({
        agent: 'researcher',
        userMessage: message,
        systemPrompt,
        model: 'claude-haiku-4-5-20251001',
        maxTokens: 2048,
        temperature: 0.4,
      });

      const parsed = parseJSON<{
        response: string;
        campaignState: CampaignState;
        action?: string | null;
      }>(response.text);

      if (!parsed) {
        await send({
          type: 'result',
          success: true,
          chatResponse: response.text,
          campaignState: state,
        });
      } else {
        const newState = parsed.campaignState || state;

        // If action is generate_creative, run the creative pipeline
        if (parsed.action === 'generate_creative' && newState.treatment) {
          await send({ type: 'step', step: 'Generating ad creative...' });

          // Write ad copy
          const copyMem = await loadAgentMemory('copywriter');
          const copyResponse = await callClaude({
            agent: 'copywriter',
            userMessage: `Write a Meta ad for: ${newState.treatment}
Angle: ${newState.angle || 'transformation'}
Hook type: ${newState.hookType || 'pain_point'}
Character/model: ${newState.model || 'ayesha'}

Output JSON:
{
  "headline": "max 40 chars, punchy",
  "primary_text": "125 chars max for feed, hook + benefit + CTA",
  "description": "30 chars",
  "instagram_caption": "150-300 words for organic reach"
}`,
            systemPrompt: buildSystemPrompt(copyMem),
            temperature: 0.5,
          });

          const adCopy = parseJSON<{
            headline?: string;
            primary_text?: string;
            description?: string;
            instagram_caption?: string;
          }>(copyResponse.text);

          if (adCopy?.headline) {
            newState.headline = adCopy.headline;
            newState.primaryText = adCopy.primary_text;
          }

          // Generate image
          await send({ type: 'step', step: 'Generating ad image...' });

          const designerMem = await loadAgentMemory('designer');
          const designResponse = await callClaude({
            agent: 'designer',
            userMessage: `Create a 1080x1080 ad image prompt for: ${newState.treatment}
Angle: ${newState.angle || 'transformation'}
Model: ${newState.model || 'ayesha'}

Output ONLY the enhanced prompt string. Luxury medical spa aesthetic, gold/cream palette, No text overlay.`,
            systemPrompt: buildSystemPrompt(designerMem),
            temperature: 0.3,
            maxTokens: 500,
          });

          const imagePrompt = designResponse.text.replace(/^["']|["']$/g, '').trim();

          let imageUrls: string[] = [];
          try {
            imageUrls = await generateImage({
              prompt: imagePrompt,
              width: 1080,
              height: 1080,
              numImages: 2,
            });
            newState.imageUrls = imageUrls;
          } catch (imgErr) {
            console.error('[ads/chat] Image generation error:', imgErr);
          }

          // Save as draft
          const draftId = await generateDraftId();
          await saveDraft({
            id: draftId,
            stage: 'pending_publish',
            topic: newState.treatment,
            contentType: 'ad',
            caption: adCopy?.instagram_caption || newState.primaryText,
            headline: newState.headline,
            model: newState.model,
            imageUrl: imageUrls[0],
            imageUrls,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          newState.draftId = draftId;
          newState.stage = 'reviewing';

          // QA check
          const draft = {
            id: draftId,
            stage: 'pending_publish' as const,
            topic: newState.treatment,
            contentType: 'ad',
            caption: adCopy?.instagram_caption,
            headline: newState.headline,
            model: newState.model,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const qa = qaValidate(draft, imageUrls);

          await logDecision('researcher', 'ads_chat_creative', `Generated creative for ${newState.treatment}`, draftId);

          await send({
            type: 'result',
            success: true,
            chatResponse: parsed.response,
            campaignState: newState,
            creative: {
              headline: adCopy?.headline,
              primaryText: adCopy?.primary_text,
              description: adCopy?.description,
              caption: adCopy?.instagram_caption,
              imageUrls,
              draftId,
              qaResults: qa,
            },
          });
        } else {
          await send({
            type: 'result',
            success: true,
            chatResponse: parsed.response,
            campaignState: newState,
          });
        }
      }
    } catch (err) {
      console.error('[ads/chat] Error:', err);
      const message = err instanceof Error ? err.message : 'Chat error';
      await send({ type: 'result', success: false, error: message });
    } finally {
      clearInterval(keepalive);
    }
  });
});

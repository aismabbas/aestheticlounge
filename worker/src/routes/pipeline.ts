/**
 * Pipeline route — All 13 SSE-streamed actions.
 * Migrated from src/app/api/al/pipeline/route.ts
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import {
  loadAgentMemory,
  buildSystemPrompt,
  callClaude,
  loadChatHistory,
  parseJSON,
} from '../lib/claude.js';
import {
  logDecision,
  generateDraftId,
  saveDraft,
  getDraft,
  getDrafts,
  updateDraftStage,
  qaValidate,
} from '../lib/drafts.js';
import { generateImage } from '../lib/image-gen.js';
import { getModelImages, searchFiles, DRIVE_FOLDERS, getThumbnailUrl } from '../lib/google-drive.js';
import {
  characterDescription,
  storyDirectorSystemPrompt,
} from '../lib/brand-context.js';
import { renderOverlayAndUpload, type OverlayTemplate } from '../lib/render-overlay.js';
import { gatherResearch, formatResearchForPrompt } from '../lib/web-search.js';

const OPUS_MODEL = 'claude-opus-4-6';

// ---------------------------------------------------------------------------
// Helpers — dynamic per-request context only (rules come from DB via buildSystemPrompt)
// ---------------------------------------------------------------------------

function copywriterCharacterBlock(characterName: string): string {
  const desc = characterDescription(characterName);
  if (!desc) return '';
  return `\n== SELECTED CHARACTER ==\n${desc}\n`;
}

/** Content-type-specific structural requirements for copywriter output. */
function copywriterTypeInstructions(ct: string): string {
  if (ct === 'carousel') return `
Include "scene_descriptions" array with visual description for EACH slide.
Structure: Hook slide → 3-5 educational slides → CTA slide (5-7 total).`;
  if (ct === 'reel') return `
Include "scene_descriptions" array — one per scene with visual + action description.
Include "voiceover_text" — 30-60 words per scene, educational, conversational.
4-6 scenes, 25-45 seconds total. Story arc: HOOK → DEEPEN → PIVOT → PAYOFF → CLOSE.`;
  return `Single post: 150-300 words, hook first line, end with CTA, include medical disclaimer.`;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const pipelineRoute = new Hono();

pipelineRoute.post('/', async (c) => {
  const body = await c.req.json();
  const { action, topic, contentType, params } = body;

  if (!action) {
    return c.json({ error: 'action is required' }, 400);
  }

  return streamSSE(c, async (stream) => {
    const keepalive = setInterval(() => {
      stream.writeSSE({ data: JSON.stringify({ type: 'ping' }) }).catch(() => {});
    }, 5000);

    const send = async (data: Record<string, unknown>) => {
      try {
        await stream.writeSSE({ data: JSON.stringify(data) });
      } catch { /* stream closed by client */ }
    };

    try {
      await send({ type: 'step', step: 'Loading agent memory' });

      switch (action) {
        case 'orchestrate': {
          const orchMem = await loadAgentMemory('orchestrator');
          const orchHistory = await loadChatHistory('orchestrator', 2);

          await send({ type: 'step', step: 'Picking best topic' });

          const userMsg = topic
            ? `Create a new ${contentType || 'post'} about: ${topic}`
            : `Pick the best topic for today's Instagram content. Consider seasonal relevance, treatment rotation, and recent performance. Output JSON with: { "next_action": "research"|"write_content", "topic": "...", "content_type": "post"|"carousel"|"reel", "reasoning": "..." }`;

          const orchResponse = await callClaude({
            agent: 'orchestrator',
            userMessage: userMsg,
            systemPrompt: buildSystemPrompt(orchMem),
            chatHistory: orchHistory,
            temperature: 0.2,
          });

          const orchParsed = parseJSON<{
            next_action: string;
            topic: string;
            content_type: string;
            reasoning: string;
          }>(orchResponse.text);

          await logDecision('orchestrator', 'orchestrate', orchParsed?.reasoning || orchResponse.text.slice(0, 200), JSON.stringify(orchParsed));

          const chosenTopic = orchParsed?.topic || topic || 'Instagram content';
          const chosenType = orchParsed?.content_type || contentType || 'post';

          await send({ type: 'step', step: `Researching: ${chosenTopic.slice(0, 60)}` });

          const resMem = await loadAgentMemory('researcher');
          const resResponse = await callClaude({
            agent: 'researcher',
            userMessage: `Research this topic for an Instagram campaign: ${chosenTopic}

Gather: treatment facts, competitor positioning, trending hooks, target audience insights, seasonal relevance.
Consider which content category fits best and which character matches the treatment.
Today's date: ${new Date().toISOString().split('T')[0]}

Output JSON: { "summary": "...", "key_facts": [...], "hooks": [...], "competitor_angle": "...", "audience_insight": "...", "recommended_character": "ayesha|meher|noor|usman", "content_type_suggestion": "post|carousel|reel", "content_category": "..." }`,
            systemPrompt: buildSystemPrompt(resMem),
            maxTokens: 4096,
          });

          const resParsed = parseJSON(resResponse.text);
          await logDecision('researcher', 'research', `Researched: ${chosenTopic}`, JSON.stringify(resParsed));

          await send({ type: 'step', step: 'Writing copy' });

          const orchCharacter = (resParsed as Record<string, unknown>)?.recommended_character as string || '';
          const copyMem = await loadAgentMemory('copywriter');
          const copyResponse = await callClaude({
            agent: 'copywriter',
            userMessage: `Write Instagram ${chosenType} copy for: ${chosenTopic}

RESEARCH CONTEXT:
${JSON.stringify(resParsed)}
${copywriterCharacterBlock(orchCharacter)}
${copywriterTypeInstructions(chosenType)}

Output JSON:
{
  "headline": "short punchy headline (max 60 chars)",
  "instagram_caption": "150-300 words, hook first line, end with CTA, include medical disclaimer",
  "content_type": "${chosenType}",
  "suggested_character": "ayesha|meher|noor|usman",
  "scene_descriptions": [...] (if reel/carousel — visual description for EACH slide/scene),
  "voiceover_text": "..." (if reel — 30-60 words per scene)
}`,
            systemPrompt: buildSystemPrompt(copyMem),
            temperature: 0.5,
          });

          await send({ type: 'step', step: 'Creating draft' });

          const copyParsed = parseJSON<{
            headline?: string;
            instagram_caption?: string;
            content_type?: string;
            suggested_character?: string;
            voiceover_text?: string;
          }>(copyResponse.text);

          const draftId = await generateDraftId();
          await saveDraft({
            id: draftId,
            stage: 'pending_copy',
            topic: chosenTopic,
            contentType: copyParsed?.content_type || chosenType,
            caption: copyParsed?.instagram_caption,
            headline: copyParsed?.headline,
            model: copyParsed?.suggested_character,
            voiceoverText: copyParsed?.voiceover_text,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          await logDecision('copywriter', 'write_content', `Draft created: ${chosenTopic}`, draftId);

          await send({
            type: 'result',
            success: true,
            action: 'orchestrate',
            draftId,
            result: {
              topic: chosenTopic,
              content_type: chosenType,
              headline: copyParsed?.headline,
              caption_preview: copyParsed?.instagram_caption?.slice(0, 200),
              model: copyParsed?.suggested_character,
              research: resParsed,
            },
            tokens: {
              input: orchResponse.inputTokens + resResponse.inputTokens + copyResponse.inputTokens,
              output: orchResponse.outputTokens + resResponse.outputTokens + copyResponse.outputTokens,
            },
          });
          break;
        }

        case 'research': {
          if (!topic) {
            await send({ type: 'result', success: false, error: 'topic required for research' });
            break;
          }

          const mem = await loadAgentMemory('researcher');
          const history = await loadChatHistory('researcher', 2);

          // --- STEP 1: Gather real-world data from web + Meta Ad Library ---
          await send({ type: 'step', step: 'Searching web for trends & competitor data...' });
          const researchData = await gatherResearch(topic);
          const externalResearch = formatResearchForPrompt(researchData);

          const adCount = researchData.competitorAds.length;
          const webCount = researchData.webResults.length;
          await send({ type: 'step', step: `Found ${webCount} web results, ${adCount} competitor ads — analyzing with Opus...` });

          // --- STEP 2: Deep analysis with Opus ---
          const response = await callClaude({
            agent: 'researcher',
            model: OPUS_MODEL,
            userMessage: `Conduct deep research on this topic for an Instagram campaign: "${topic}"
Today's date: ${new Date().toISOString().split('T')[0]}

== LIVE RESEARCH DATA (gathered just now) ==
${externalResearch}

Synthesize the live research data above with your knowledge. You have REAL competitor ad data and current web trends — use them.

Analyze:
1. Market landscape — what competitors are doing, messaging gaps
2. Trending hooks — angles that are hot based on research data
3. Audience psychology — pain points, desires, triggers for Pakistani women
4. Content opportunity — whitespace no one is talking about
5. Seasonal relevance — what's timely in Pakistan right now
6. Competitor weakness — where they're falling short

Output JSON:
{
  "summary": "2-3 sentence executive summary",
  "key_facts": ["5-8 data-backed facts — cite sources from web results"],
  "hooks": ["5 proven hook formats from competitor analysis"],
  "competitor_analysis": {
    "active_advertisers": ${adCount},
    "common_messaging": "what competitors are saying",
    "gaps": "what nobody is talking about",
    "our_advantage": "how to differentiate"
  },
  "audience_insight": "deep psychographic insight",
  "trending_angles": ["3 current trends to ride"],
  "recommended_character": "ayesha|meher|noor|usman — with reasoning",
  "content_type_suggestion": "post|carousel|reel — with reasoning",
  "content_category": "which content diversity category fits best",
  "suggested_headline": "one killer headline based on all research"
}`,
            systemPrompt: buildSystemPrompt(mem),
            chatHistory: history,
            maxTokens: 4096,
            temperature: 0.4,
          });

          await send({ type: 'step', step: 'Saving research' });

          const parsed = parseJSON(response.text);
          await logDecision('researcher', 'research', `Researched: ${topic}`, JSON.stringify(parsed));

          await send({
            type: 'result',
            success: true,
            action: 'research',
            topic,
            result: parsed || { raw: response.text },
            sources: { webResults: webCount, competitorAds: adCount },
            tokens: { input: response.inputTokens, output: response.outputTokens },
          });
          break;
        }

        case 'write_content': {
          if (!topic) {
            await send({ type: 'result', success: false, error: 'topic required' });
            break;
          }

          const mem = await loadAgentMemory('copywriter');
          const history = await loadChatHistory('copywriter', 2);
          const ct = contentType || 'post';

          await send({ type: 'step', step: 'Writing copy' });

          const researchContext = params?.research ? `\n\nRESEARCH CONTEXT:\n${JSON.stringify(params.research)}` : '';
          const wcCharacter = (params?.character as string) || '';

          const response = await callClaude({
            agent: 'copywriter',
            userMessage: `Write Instagram ${ct} copy for: ${topic}${researchContext}
${copywriterCharacterBlock(wcCharacter)}
${copywriterTypeInstructions(ct)}

Output JSON:
{
  "headline": "short punchy headline (max 60 chars)",
  "instagram_caption": "150-300 words, hook first line, end with CTA, include medical disclaimer",
  "content_type": "${ct}",
  "suggested_character": "ayesha|meher|noor|usman",
  "scene_descriptions": [...] (if reel/carousel — visual description for EACH slide/scene),
  "voiceover_text": "..." (if reel — 30-60 words per scene)
}`,
            systemPrompt: buildSystemPrompt(mem),
            chatHistory: history,
            temperature: 0.5,
          });

          await send({ type: 'step', step: 'Creating draft' });

          const parsed = parseJSON<{
            headline?: string;
            instagram_caption?: string;
            content_type?: string;
            suggested_character?: string;
            scene_descriptions?: string[];
            voiceover_text?: string;
          }>(response.text);

          const userImageUrl = params?.imageUrl as string | undefined;
          const userImageUrls = params?.imageUrls as string[] | undefined;
          const hasUserImages = !!(userImageUrl || (userImageUrls && userImageUrls.length > 0));

          const draftId = await generateDraftId();
          await saveDraft({
            id: draftId,
            stage: hasUserImages ? 'pending_publish' : 'pending_copy',
            topic,
            contentType: ct,
            caption: parsed?.instagram_caption,
            headline: parsed?.headline,
            model: parsed?.suggested_character,
            voiceoverText: parsed?.voiceover_text,
            ...(userImageUrl && { imageUrl: userImageUrl }),
            ...(userImageUrls && { imageUrls: userImageUrls, imageUrl: userImageUrls[0] }),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          await logDecision('copywriter', 'write_content', `Draft created: ${topic}`, draftId);

          await send({
            type: 'result',
            success: true,
            action: 'write_content',
            draftId,
            result: parsed || { raw: response.text },
            tokens: { input: response.inputTokens, output: response.outputTokens },
          });
          break;
        }

        case 'design': {
          const draftId = params?.draftId;
          if (!draftId && !topic) {
            await send({ type: 'result', success: false, error: 'draftId or topic required' });
            break;
          }

          const mem = await loadAgentMemory('designer');
          const history = await loadChatHistory('designer', 2);

          await send({ type: 'step', step: 'Preparing design brief' });

          let designBrief = '';
          if (draftId) {
            const draft = await getDraft(draftId);
            if (!draft) {
              await send({ type: 'result', success: false, error: 'Draft not found' });
              break;
            }
            designBrief = `DRAFT DETAILS:\n- Topic: ${draft.topic}\n- Content Type: ${draft.contentType}\n- Headline: ${draft.headline}\n- Caption: ${draft.caption?.slice(0, 300)}\n- Suggested Model: ${draft.model}\n- Voiceover: ${draft.voiceoverText || 'N/A'}`;
          } else {
            designBrief = `Create design for: ${topic}\nContent type: ${contentType || 'post'}`;
          }

          await send({ type: 'step', step: 'Generating design' });

          const response = await callClaude({
            agent: 'designer',
            userMessage: `${designBrief}

Design this content. Choose approach and generate image prompts.
Use full character descriptions in every prompt. Rotate backgrounds — never repeat the same setting consecutively.

Output JSON:
{
  "approach": "ai_image"|"carousel"|"reel",
  "template": "lifestyle|treatment|carousel_hook|reel|...",
  "character": "ayesha|meher|noor|usman",
  "image_prompt": "detailed fal.ai prompt with full character description, setting, technical specs...",
  "image_prompts": ["..."] (for carousel slides — each with full character description),
  "reel_scenes": [{"scene_number": 1, "image_prompt": "...", "motion_prompt": "...", "duration_seconds": 7}],
  "dimensions": "1080x1350|1080x1080|1080x1920",
  "headline": "...",
  "body": "..."
}`,
            systemPrompt: buildSystemPrompt(mem),
            chatHistory: history,
            temperature: 0.3,
            maxTokens: 2048,
          });

          const parsed = parseJSON(response.text);

          if (draftId && parsed) {
            await updateDraftStage(draftId, 'pending_design');
          }

          await logDecision('designer', 'design', `Designed: ${topic || draftId}`, JSON.stringify(parsed));

          await send({
            type: 'result',
            success: true,
            action: 'design',
            draftId,
            result: parsed || { raw: response.text },
            tokens: { input: response.inputTokens, output: response.outputTokens },
          });
          break;
        }

        case 'analyze': {
          const mem = await loadAgentMemory('analyst');
          const history = await loadChatHistory('analyst', 2);

          await send({ type: 'step', step: 'Analyzing performance' });

          const response = await callClaude({
            agent: 'analyst',
            userMessage: `Analyze recent AL Instagram ad performance.

Provide:
1. Overall performance summary
2. Top performing creatives and why
3. Underperformers to pause
4. Budget recommendations (scale winners, pause losers)
5. Next content suggestions based on data

Output JSON: { "summary": "...", "top_performers": [...], "pause_candidates": [...], "budget_recommendations": [...], "next_content": [...] }`,
            systemPrompt: buildSystemPrompt(mem),
            chatHistory: history,
            temperature: 0.2,
          });

          await send({ type: 'step', step: 'Saving analysis' });

          const parsed = parseJSON(response.text);
          await logDecision('analyst', 'analyze', 'Performance analysis', JSON.stringify(parsed));

          await send({
            type: 'result',
            success: true,
            action: 'analyze',
            result: parsed || { raw: response.text },
            tokens: { input: response.inputTokens, output: response.outputTokens },
          });
          break;
        }

        case 'research_topics': {
          await send({ type: 'step', step: 'Scanning web trends & competitor ads...' });

          const orchMem = await loadAgentMemory('orchestrator');
          const resMem = await loadAgentMemory('researcher');

          const recentDrafts = await getDrafts(undefined, 20);
          const pastTopics = recentDrafts.map(d => d.topic).filter(Boolean);
          const pastTopicsBlock = pastTopics.length > 0
            ? `\n== DO NOT REPEAT THESE RECENT TOPICS ==\n${pastTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}\nSuggest FRESH topics that are different from all of the above.\n`
            : '';

          // Gather real-world data for topic discovery
          const [trendData, competitorData, seasonalData] = await Promise.all([
            gatherResearch('medical aesthetics trending Pakistan'),
            gatherResearch('beauty clinic Lahore skincare treatment'),
            gatherResearch('aesthetic treatment seasonal trends summer Pakistan'),
          ]);
          const trendResearch = formatResearchForPrompt(trendData);
          const competitorResearch = formatResearchForPrompt(competitorData);

          await send({ type: 'step', step: `Found ${trendData.webResults.length + competitorData.webResults.length} web results, ${trendData.competitorAds.length + competitorData.competitorAds.length} competitor ads — Opus analyzing...` });

          const orchResponse = await callClaude({
            agent: 'orchestrator',
            model: OPUS_MODEL,
            userMessage: `Today is ${new Date().toISOString().split('T')[0]}. Using REAL market data gathered moments ago, identify the most high-impact content topics.
${pastTopicsBlock}
== LIVE MARKET INTELLIGENCE ==
${trendResearch}

== COMPETITOR LANDSCAPE ==
${competitorResearch}

Use the LIVE data above — don't guess what's trending, you have REAL search results and active competitor ads.
Find gaps in competitor messaging. Identify treatments gaining search momentum. Match seasonal timing.
Include a MIX: at least 1 "post", at least 1 "carousel", optionally a "reel". Single posts are our bread and butter.

Output JSON with 4-5 topic suggestions:
{
  "topics": [
    {
      "title": "Short topic title",
      "reasoning": "2-line explanation citing SPECIFIC data from the research above",
      "content_type": "post|carousel|reel",
      "treatment_category": "face|body|hair|skin|general",
      "engagement_estimate": "high|medium",
      "character": "ayesha|meher|noor|usman",
      "content_category": "which of the 10 diversity categories",
      "data_source": "what research finding inspired this topic"
    }
  ]
}`,
            systemPrompt: buildSystemPrompt(orchMem),
            temperature: 0.4,
            maxTokens: 3000,
          });

          await send({ type: 'step', step: 'Picking best topics...' });

          const orchParsed = parseJSON<{
            topics: Array<{
              title: string;
              reasoning: string;
              content_type: string;
              treatment_category: string;
              engagement_estimate: string;
              character: string;
            }>;
          }>(orchResponse.text);

          const topics = orchParsed?.topics || [];
          if (topics.length > 0) {
            const resResponse = await callClaude({
              agent: 'researcher',
              userMessage: `Validate and enrich these topic suggestions with quick research insights:\n${JSON.stringify(topics)}\n\nFor each topic, add a "research_note" with 1 key fact or data point. Return the same array with added research_note field.`,
              systemPrompt: buildSystemPrompt(resMem),
              temperature: 0.2,
              maxTokens: 2048,
            });
            const enriched = parseJSON<{ topics: typeof topics }>(resResponse.text);
            if (enriched?.topics) {
              await send({
                type: 'result',
                success: true,
                action: 'research_topics',
                topics: enriched.topics,
                tokens: {
                  input: orchResponse.inputTokens + resResponse.inputTokens,
                  output: orchResponse.outputTokens + resResponse.outputTokens,
                },
              });
              break;
            }
          }

          await send({
            type: 'result',
            success: true,
            action: 'research_topics',
            topics,
            tokens: { input: orchResponse.inputTokens, output: orchResponse.outputTokens },
          });
          break;
        }

        case 'chat_research': {
          const message = params?.message || topic;
          if (!message) {
            await send({ type: 'result', success: false, error: 'message required for chat research' });
            break;
          }

          await send({ type: 'step', step: 'Searching web & competitor ads...' });

          const resMem = await loadAgentMemory('researcher');
          const chatHistory = await loadChatHistory('researcher', 4);

          const chatResearch = await gatherResearch(String(message));
          const chatResearchBlock = formatResearchForPrompt(chatResearch);

          await send({ type: 'step', step: `Analyzing with Opus (${chatResearch.webResults.length} web results, ${chatResearch.competitorAds.length} ads)...` });

          const response = await callClaude({
            agent: 'researcher',
            model: OPUS_MODEL,
            userMessage: `The user wants to create content about: "${message}"
Today's date: ${new Date().toISOString().split('T')[0]}

== LIVE RESEARCH DATA ==
${chatResearchBlock}

Using the real research data above, suggest 3-5 specific content ideas backed by actual market intelligence.
Cross-reference with treatment performance data, seasonal calendar, and content categories.

Keep your response concise. Each topic reasoning should cite specific findings from the research.
Include a MIX of content types — at least 1 "post" and at least 1 "carousel". Single posts are our bread and butter.

Output JSON (no markdown wrapping):
{
  "response": "2-3 sentence conversational reply referencing what you found in the research",
  "topics": [
    {
      "title": "Short specific title",
      "reasoning": "1-2 sentence why this works — cite research data",
      "content_type": "post|carousel|reel",
      "treatment_category": "face|body|hair|skin|general",
      "engagement_estimate": "high|medium",
      "character": "ayesha|meher|noor|usman"
    }
  ]
}`,
            systemPrompt: buildSystemPrompt(resMem),
            chatHistory,
            temperature: 0.4,
            maxTokens: 4096,
          });

          const parsed = parseJSON<{
            response: string;
            topics: Array<{
              title: string;
              reasoning: string;
              content_type: string;
              treatment_category: string;
              engagement_estimate: string;
              character: string;
            }>;
          }>(response.text);

          let chatResponse = parsed?.response || response.text;
          if (chatResponse.startsWith('```')) {
            chatResponse = chatResponse.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim();
            try {
              const inner = JSON.parse(chatResponse);
              if (inner.response) chatResponse = inner.response;
            } catch { /* use as-is */ }
          }

          await send({
            type: 'result',
            success: true,
            action: 'chat_research',
            chatResponse,
            topics: parsed?.topics || [],
            tokens: { input: response.inputTokens, output: response.outputTokens },
          });
          break;
        }

        case 'run_pipeline': {
          if (!topic) {
            await send({ type: 'result', success: false, error: 'topic required' });
            break;
          }

          const ct = contentType || 'post';
          let totalInput = 0;
          let totalOutput = 0;

          // --- STEP 1: Write Copy ---
          await send({ type: 'step', step: 'Writing copy...' });

          const copyMem = await loadAgentMemory('copywriter');
          const resMem = await loadAgentMemory('researcher');

          // Gather real research data in parallel with agent memory
          await send({ type: 'step', step: 'Gathering market intelligence...' });
          const pipeResearch = await gatherResearch(topic);
          const pipeResearchBlock = formatResearchForPrompt(pipeResearch);

          const resResponse = await callClaude({
            agent: 'researcher',
            model: OPUS_MODEL,
            userMessage: `Deep research for Instagram ${ct} about: ${topic}
Today's date: ${new Date().toISOString().split('T')[0]}

== LIVE MARKET DATA ==
${pipeResearchBlock}

Synthesize the live data with your knowledge. Provide actionable research for the copywriter and designer.
Output JSON: { "key_facts": ["5+ data-backed facts"], "hooks": ["5 proven hook formats from competitor analysis"], "recommended_character": "ayesha|meher|noor|usman", "audience_insight": "deep psychographic insight", "content_category": "...", "competitor_gap": "what competitors are missing" }`,
            systemPrompt: buildSystemPrompt(resMem),
            temperature: 0.3,
            maxTokens: 2048,
          });
          totalInput += resResponse.inputTokens;
          totalOutput += resResponse.outputTokens;
          const research = parseJSON(resResponse.text);

          const rpCharacter = (research as Record<string, unknown>)?.recommended_character as string || (params?.character as string) || '';
          const copyResponse = await callClaude({
            agent: 'copywriter',
            userMessage: `Write Instagram ${ct} copy for: ${topic}

RESEARCH:
${JSON.stringify(research)}
${copywriterCharacterBlock(rpCharacter)}
${copywriterTypeInstructions(ct)}

Output JSON:
{
  "headline": "short punchy headline (max 60 chars)",
  "instagram_caption": "150-300 words, hook first line, CTA last line, include medical disclaimer",
  "content_type": "${ct}",
  "suggested_character": "ayesha|meher|noor|usman",
  "scene_descriptions": [...] (if carousel/reel — visual description for EACH slide/scene),
  "voiceover_text": "..." (if reel — 30-60 words per scene)
}`,
            systemPrompt: buildSystemPrompt(copyMem),
            temperature: 0.5,
          });
          totalInput += copyResponse.inputTokens;
          totalOutput += copyResponse.outputTokens;

          const copy = parseJSON<{
            headline?: string;
            instagram_caption?: string;
            content_type?: string;
            suggested_character?: string;
            scene_descriptions?: string[];
            voiceover_text?: string;
          }>(copyResponse.text);

          let headline = copy?.headline || topic;
          if (headline.length > 60) {
            headline = headline.slice(0, 57) + '...';
          }

          const draftId = await generateDraftId();
          await saveDraft({
            id: draftId,
            stage: 'pending_design',
            topic,
            contentType: ct,
            caption: copy?.instagram_caption,
            headline,
            model: copy?.suggested_character || (params?.character as string),
            voiceoverText: copy?.voiceover_text,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          // --- STEP 2: Search Brand Assets ---
          await send({ type: 'step', step: 'Searching brand assets...' });

          const characterName = copy?.suggested_character || 'ayesha';
          let brandAssets: Array<{ id: string; name: string; thumbnailUrl: string }> = [];
          try {
            const modelImages = await getModelImages(characterName);
            const adCreatives = await searchFiles(topic.split(' ')[0], DRIVE_FOLDERS.ad_creatives);
            brandAssets = [...modelImages, ...adCreatives]
              .filter((f) => f.id)
              .slice(0, 6)
              .map((f) => ({
                id: f.id!,
                name: f.name || 'Unnamed',
                thumbnailUrl: getThumbnailUrl(f.id!, 400),
              }));
          } catch {
            // Google Drive not configured — continue without brand assets
          }

          // --- STEP 2.5: StoryDirector (reels only) ---
          let storyDirectorResult: Record<string, unknown> | null = null;
          if (ct === 'reel' && copy?.scene_descriptions && copy.scene_descriptions.length >= 2) {
            await send({ type: 'step', step: 'Story directing reel scenes...' });

            const sdResponse = await callClaude({
              agent: 'designer',
              userMessage: `Transform these copywriter scene descriptions into production-ready cinematic prompts.

CHARACTER: ${characterName}
${characterDescription(characterName)}

SCENE DESCRIPTIONS FROM COPYWRITER:
${copy.scene_descriptions.map((s, i) => `Scene ${i + 1}: ${s}`).join('\n')}

VOICEOVER:
${copy.voiceover_text || 'N/A'}

Apply the story arc (HOOK → DEEPEN → PIVOT → PAYOFF → CLOSE).
Generate full fal.ai image prompts with complete character description in EVERY scene.
Generate Kling v3 Pro motion prompts for each scene.
Pick a music style that matches the mood.`,
              systemPrompt: storyDirectorSystemPrompt(),
              model: 'claude-sonnet-4-6',
              temperature: 0.7,
              maxTokens: 4096,
            });
            totalInput += sdResponse.inputTokens;
            totalOutput += sdResponse.outputTokens;

            storyDirectorResult = parseJSON(sdResponse.text);
            await logDecision('designer', 'story_direct', `StoryDirector: ${topic}`, JSON.stringify(storyDirectorResult));
          }

          // --- STEP 3: Generate AI Images ---
          const dims = ct === 'reel' ? { w: 1080, h: 1920 } : ct === 'carousel' ? { w: 1080, h: 1080 } : { w: 1080, h: 1350 };
          let aiImages: string[] = [];

          if (ct === 'carousel' && copy?.scene_descriptions && copy.scene_descriptions.length >= 2) {
            await send({ type: 'step', step: 'Copy ready — images will generate next...' });
          } else {
            await send({ type: 'step', step: 'Generating design...' });

            const designerMem = await loadAgentMemory('designer');
            const sdScenes = storyDirectorResult?.scenes as Array<{ image_prompt: string; motion_prompt: string; duration_seconds: number }> | undefined;

            if (ct === 'reel' && sdScenes && sdScenes.length >= 2) {
              await send({ type: 'step', step: `Generating ${sdScenes.length} reel scenes...` });
              for (const [idx, scene] of sdScenes.entries()) {
                try {
                  const sceneImages = await generateImage({
                    prompt: scene.image_prompt,
                    width: dims.w,
                    height: dims.h,
                    numImages: 1,
                  });
                  aiImages.push(...sceneImages);
                  await send({ type: 'step', step: `Scene ${idx + 1}/${sdScenes.length} done` });
                } catch (imgErr) {
                  console.error(`[run_pipeline] Reel scene ${idx + 1} error:`, imgErr);
                }
              }
            } else if (ct === 'post') {
              const designResponse = await callClaude({
                agent: 'designer',
                userMessage: `Design a branded social media post for:\nTopic: ${topic}\nHeadline: ${copy?.headline || topic}\nCharacter: ${characterName}\n\nYou must output JSON with:\n1. "image_prompt" — detailed fal.ai prompt for the BACKGROUND photo (full character description, Pakistani/DHA Lahore setting, technical specs, NO text in the image)\n2. "template" — one of: "treatment", "tips", "stats", "overlay", "lifestyle"\n3. "template_params" — text overlay params matching the template:\n   - treatment: { category, headline, headline-highlight, body, stat1, stat1-label, stat2, stat2-label, stat3, stat3-label, cta }\n   - tips: { category, headline, headline-highlight, tip1, tip2, tip3, tip4, tip5, cta }\n   - stats: { category, headline, headline-highlight, big-number, big-label, body, cta }\n   - overlay: { category, headline, headline-highlight, subtitle, hook }\n   - lifestyle: { category, headline, headline-highlight, body, stat1, stat1-label, stat2, stat2-label, stat3, stat3-label, cities, model-name, model-title }\n\nUse the copy headline/caption for inspiration. Always include CTA "Book a Consultation" for treatment/tips/stats templates.\n\nOutput ONLY valid JSON: { "image_prompt": "...", "template": "...", "template_params": { ... } }`,
                systemPrompt: buildSystemPrompt(designerMem),
                temperature: 0.3,
                maxTokens: 1500,
              });
              totalInput += designResponse.inputTokens;
              totalOutput += designResponse.outputTokens;

              const designParsed = parseJSON<{ image_prompt?: string; template?: string; template_params?: Record<string, string> }>(designResponse.text);
              const imagePrompt = (designParsed?.image_prompt || designResponse.text).replace(/^["']|["']$/g, '').trim();

              try {
                aiImages = await generateImage({
                  prompt: imagePrompt,
                  width: dims.w,
                  height: dims.h,
                  numImages: 1,
                });
              } catch (imgErr) {
                console.error('[run_pipeline] Image generation error:', imgErr);
              }

              if (aiImages.length > 0 && designParsed?.template && designParsed?.template_params) {
                await send({ type: 'step', step: 'Applying text overlay...' });
                console.log(`[run_pipeline] Overlay: template=${designParsed.template}, bg=${aiImages[0]?.substring(0, 60)}...`);
                try {
                  const overlayedUrl = await renderOverlayAndUpload({
                    template: designParsed.template as OverlayTemplate,
                    backgroundUrl: aiImages[0],
                    params: designParsed.template_params,
                    width: dims.w,
                    height: dims.h,
                  });
                  console.log(`[run_pipeline] Overlay success: ${overlayedUrl?.substring(0, 80)}...`);
                  aiImages = [overlayedUrl, ...aiImages];
                } catch (overlayErr) {
                  console.error('[run_pipeline] Overlay rendering error:', overlayErr);
                }
              }
            } else {
              const designResponse = await callClaude({
                agent: 'designer',
                userMessage: `Create an image generation prompt for:\nTopic: ${topic}\nContent type: reel\nHeadline: ${copy?.headline || topic}\nCharacter: ${characterName}\n\nUse the full character description from your character bible.\n\nOutput ONLY the enhanced prompt string. Include full character description, Pakistani/DHA Lahore setting, and technical specs. No text overlay.`,
                systemPrompt: buildSystemPrompt(designerMem),
                temperature: 0.3,
                maxTokens: 500,
              });
              totalInput += designResponse.inputTokens;
              totalOutput += designResponse.outputTokens;

              const imagePrompt = designResponse.text.replace(/^["']|["']$/g, '').trim();

              try {
                aiImages = await generateImage({
                  prompt: imagePrompt,
                  width: dims.w,
                  height: dims.h,
                  numImages: 2,
                });
              } catch (imgErr) {
                console.error('[run_pipeline] Image generation error:', imgErr);
              }
            }
          }

          // --- STEP 4: QA Check ---
          await send({ type: 'step', step: 'Running quality check...' });

          const draft = await getDraft(draftId);
          if (!draft) {
            await send({ type: 'error', error: 'Draft not found after save' });
            break;
          }
          const qaResults = qaValidate(draft, aiImages);

          await send({
            type: 'result',
            success: true,
            action: 'run_pipeline',
            draftId,
            copy: {
              headline,
              caption: copy?.instagram_caption,
              character: copy?.suggested_character || characterName,
              voiceover: copy?.voiceover_text,
            },
            brandAssets,
            aiImages,
            storyDirector: storyDirectorResult || undefined,
            qaResults,
            tokens: { input: totalInput, output: totalOutput },
          });
          break;
        }

        case 'revise_ask': {
          const draftId2 = params?.draftId;
          const context = params?.context || 'copy';

          if (!draftId2) {
            await send({ type: 'result', success: false, error: 'draftId required' });
            break;
          }

          const draft = await getDraft(draftId2);
          if (!draft) {
            await send({ type: 'result', success: false, error: 'Draft not found' });
            break;
          }

          await send({ type: 'step', step: 'Analyzing draft for revision...' });

          const agentName = context === 'design' ? 'designer' : 'copywriter';
          const mem = await loadAgentMemory(agentName);

          const response = await callClaude({
            agent: agentName,
            userMessage: `A user wants to revise the ${context} for this draft:
Topic: ${draft.topic}
Headline: ${draft.headline || 'N/A'}
Caption: ${draft.caption?.slice(0, 300) || 'N/A'}
Character: ${draft.model || 'N/A'}

Generate 2-4 clarifying questions to understand what they want changed. Questions should be specific and actionable.

Output JSON:
{
  "questions": [
    { "id": "q1", "label": "Question label", "question": "Full question text", "type": "text" }
  ]
}`,
            systemPrompt: buildSystemPrompt(mem),
            temperature: 0.3,
            maxTokens: 1024,
          });

          const rawText = response.text;
          let parsed = parseJSON<{
            questions: Array<{ id: string; label: string; question: string; type: string }>;
          }>(rawText);

          if (parsed && !parsed.questions && Array.isArray(parsed)) {
            parsed = { questions: parsed as unknown as typeof parsed.questions };
          }

          await send({
            type: 'result',
            success: true,
            action: 'revise_ask',
            questions: parsed?.questions || [],
            tokens: { input: response.inputTokens, output: response.outputTokens },
          });
          break;
        }

        case 'revise_apply': {
          const draftId3 = params?.draftId;
          const answers = params?.answers;
          const context2 = params?.context || 'copy';

          if (!draftId3 || !answers) {
            await send({ type: 'result', success: false, error: 'draftId and answers required' });
            break;
          }

          const draft = await getDraft(draftId3);
          if (!draft) {
            await send({ type: 'result', success: false, error: 'Draft not found' });
            break;
          }

          if (context2 === 'copy') {
            await send({ type: 'step', step: 'Revising copy...' });

            const mem = await loadAgentMemory('copywriter');
            const response = await callClaude({
              agent: 'copywriter',
              userMessage: `Revise the copy for this draft based on user feedback:

ORIGINAL:
- Topic: ${draft.topic}
- Headline: ${draft.headline}
- Caption: ${draft.caption}
- Character: ${draft.model}

USER FEEDBACK:
${JSON.stringify(answers)}

Write revised copy. Keep the same format. Output JSON:
{
  "headline": "...",
  "instagram_caption": "...",
  "suggested_character": "...",
  "voiceover_text": "..."
}`,
              systemPrompt: buildSystemPrompt(mem),
              temperature: 0.5,
            });

            const revised = parseJSON<{
              headline?: string;
              instagram_caption?: string;
              suggested_character?: string;
              voiceover_text?: string;
            }>(response.text);

            let revisedHeadline = revised?.headline || draft.headline;
            if (revisedHeadline && revisedHeadline.length > 60) {
              revisedHeadline = revisedHeadline.slice(0, 57) + '...';
            }

            if (revised) {
              await saveDraft({
                ...draft,
                headline: revisedHeadline,
                caption: revised.instagram_caption || draft.caption,
                model: revised.suggested_character || draft.model,
                voiceoverText: revised.voiceover_text || draft.voiceoverText,
                updatedAt: new Date().toISOString(),
              });
            }

            await send({
              type: 'result',
              success: true,
              action: 'revise_apply',
              context: 'copy',
              draftId: draftId3,
              copy: {
                headline: revisedHeadline,
                caption: revised?.instagram_caption || draft.caption,
                character: revised?.suggested_character || draft.model,
                voiceover: revised?.voiceover_text || draft.voiceoverText,
              },
              tokens: { input: response.inputTokens, output: response.outputTokens },
            });
          } else {
            await send({ type: 'step', step: 'Regenerating design...' });

            const mem = await loadAgentMemory('designer');
            const response = await callClaude({
              agent: 'designer',
              userMessage: `Revise the image prompt for this draft based on user feedback:

ORIGINAL:
- Topic: ${draft.topic}
- Character: ${draft.model}

USER FEEDBACK:
${JSON.stringify(answers)}

Output ONLY the enhanced image generation prompt string.`,
              systemPrompt: buildSystemPrompt(mem),
              temperature: 0.3,
              maxTokens: 500,
            });

            const imagePrompt2 = response.text.replace(/^["']|["']$/g, '').trim();
            const dims2 = draft.contentType === 'reel' ? { w: 1080, h: 1920 } : draft.contentType === 'carousel' ? { w: 1080, h: 1080 } : { w: 1080, h: 1350 };

            let aiImages2: string[] = [];
            try {
              aiImages2 = await generateImage({
                prompt: imagePrompt2,
                width: dims2.w,
                height: dims2.h,
                numImages: 2,
              });
            } catch (imgErr) {
              console.error('[revise_apply] Image gen error:', imgErr);
            }

            await send({
              type: 'result',
              success: true,
              action: 'revise_apply',
              context: 'design',
              draftId: draftId3,
              aiImages: aiImages2,
              tokens: { input: response.inputTokens, output: response.outputTokens },
            });
          }
          break;
        }

        case 'story_direct': {
          const sdDraftId = params?.draftId;
          if (!sdDraftId) {
            await send({ type: 'result', success: false, error: 'draftId required for story_direct' });
            break;
          }

          const sdDraft = await getDraft(sdDraftId);
          if (!sdDraft) {
            await send({ type: 'result', success: false, error: 'Draft not found' });
            break;
          }

          await send({ type: 'step', step: 'Story directing reel scenes...' });

          const sdCharName = sdDraft.model || 'ayesha';
          const sdResponse = await callClaude({
            agent: 'designer',
            userMessage: `Transform these scene descriptions into production-ready cinematic prompts for a reel.

TOPIC: ${sdDraft.topic}
CHARACTER: ${sdCharName}
${characterDescription(sdCharName)}

SCENE DESCRIPTIONS:
${(sdDraft.reelScenes || []).map((s, i) => `Scene ${i + 1}: ${JSON.stringify(s)}`).join('\n') || sdDraft.voiceoverText || 'No scene descriptions available — create 4-5 scenes based on the topic.'}

VOICEOVER:
${sdDraft.voiceoverText || 'N/A'}

Apply the story arc (HOOK → DEEPEN → PIVOT → PAYOFF → CLOSE).
Generate full fal.ai image prompts with complete character description in EVERY scene.
Generate Kling v3 Pro motion prompts for each scene.
Pick a music style that matches the mood.`,
            systemPrompt: storyDirectorSystemPrompt(),
            model: 'claude-sonnet-4-6',
            temperature: 0.7,
            maxTokens: 4096,
          });

          const sdParsed = parseJSON(sdResponse.text);
          await logDecision('designer', 'story_direct', `StoryDirector: ${sdDraft.topic}`, JSON.stringify(sdParsed));

          await send({
            type: 'result',
            success: true,
            action: 'story_direct',
            draftId: sdDraftId,
            result: sdParsed || { raw: sdResponse.text },
            tokens: { input: sdResponse.inputTokens, output: sdResponse.outputTokens },
          });
          break;
        }

        case 'generate_carousel_images': {
          const ciDraftId = params?.draftId;
          if (!ciDraftId) {
            await send({ type: 'result', success: false, error: 'draftId required' });
            break;
          }

          const ciDraft = await getDraft(ciDraftId);
          if (!ciDraft) {
            await send({ type: 'result', success: false, error: 'Draft not found' });
            break;
          }

          const ciCharName = ciDraft.model || 'ayesha';
          const ciDesignerMem = await loadAgentMemory('designer');

          await send({ type: 'step', step: 'Crafting per-slide design...' });
          const ciPromptResponse = await callClaude({
            agent: 'designer',
            userMessage: `Design a branded carousel for:\nTopic: ${ciDraft.topic}\nHeadline: ${ciDraft.headline || 'N/A'}\nCharacter: ${ciCharName}\nCaption: ${ciDraft.caption?.slice(0, 500) || 'N/A'}\n\nGenerate a JSON object with "slides" array (5 slides). Each slide needs:\n- "image_prompt": Nano Banana Pro prompt for BACKGROUND photo (full character description, unique setting, no text)\n- "template": "carousel_hook" for slide 1, "carousel_info" for middle slides, "carousel_cta" for last slide\n- "template_params": text overlay params:\n  - carousel_hook: { category, headline, headline-highlight }\n  - carousel_info: { headline, body, big-number, big-label, slide-number, slide-total }\n  - carousel_cta: { headline, cta, subtitle }\n\nSlide 1 = Hook (bold question/fact). Slides 2-4 = Educational info with stats. Slide 5 = CTA "Book a Consultation".\n\nOutput ONLY valid JSON: { "slides": [ { "image_prompt": "...", "template": "...", "template_params": { ... } }, ... ] }`,
            systemPrompt: buildSystemPrompt(ciDesignerMem),
            temperature: 0.4,
            maxTokens: 3000,
          });

          const ciDesign = parseJSON<{ slides: Array<{ image_prompt: string; template: string; template_params: Record<string, string> }> }>(ciPromptResponse.text);
          const ciSlides = ciDesign?.slides || [];

          const ciPrompts = ciSlides.length > 0
            ? ciSlides.map(s => s.image_prompt)
            : Array(5).fill(`${ciDraft.topic}, ${ciCharName}, luxury clinic, gold and cream, 8K, no text overlay`);

          await send({ type: 'step', step: `Generating ${ciPrompts.length} carousel backgrounds...` });
          const ciResults = await Promise.allSettled(
            ciPrompts.map((prompt: string) =>
              generateImage({
                prompt: prompt.replace(/^["']|["']$/g, '').trim(),
                width: 1080,
                height: 1080,
                numImages: 1,
              })
            )
          );

          const ciRawImages: string[] = [];
          for (const [idx, result] of ciResults.entries()) {
            if (result.status === 'fulfilled') {
              ciRawImages.push(result.value[0] || '');
            } else {
              console.error(`[generate_carousel_images] Slide ${idx + 1} error:`, result.reason);
              ciRawImages.push('');
            }
          }

          await send({ type: 'step', step: `${ciRawImages.filter(Boolean).length}/${ciPrompts.length} backgrounds ready` });

          const ciImages: string[] = [];
          if (ciSlides.length > 0) {
            await send({ type: 'step', step: 'Applying text overlays...' });
            const overlayResults = await Promise.allSettled(
              ciSlides.map(async (slide, idx) => {
                const bgUrl = ciRawImages[idx];
                if (!bgUrl || !slide.template_params) return bgUrl;
                if (slide.template === 'carousel_info') {
                  slide.template_params['slide-number'] = String(idx + 1);
                  slide.template_params['slide-total'] = String(ciSlides.length);
                }
                return renderOverlayAndUpload({
                  template: slide.template as OverlayTemplate,
                  backgroundUrl: bgUrl,
                  params: slide.template_params,
                  width: 1080,
                  height: 1080,
                });
              })
            );

            for (const [idx, result] of overlayResults.entries()) {
              if (result.status === 'fulfilled' && result.value) {
                ciImages.push(result.value);
              } else {
                ciImages.push(ciRawImages[idx] || '');
                if (result.status === 'rejected') {
                  console.error(`[generate_carousel_images] Overlay ${idx + 1} error:`, result.reason);
                }
              }
            }
          } else {
            ciImages.push(...ciRawImages.filter(Boolean));
          }

          await send({ type: 'step', step: `${ciImages.length} slides with overlays ready` });

          const ciQaResults = qaValidate(ciDraft, ciImages);

          await send({
            type: 'result',
            success: true,
            action: 'generate_carousel_images',
            draftId: ciDraftId,
            aiImages: ciImages,
            qaResults: ciQaResults,
            tokens: { input: ciPromptResponse.inputTokens, output: ciPromptResponse.outputTokens },
          });
          break;
        }

        default:
          await send({ type: 'result', success: false, error: `Unknown action: ${action}` });
      }
    } catch (err) {
      console.error(`[pipeline] ${action} error:`, err);
      const message = err instanceof Error ? err.message : 'Pipeline error';
      await logDecision('orchestrator', action, `ERROR: ${message}`).catch(() => {});
      await send({ type: 'result', success: false, error: message });
    } finally {
      clearInterval(keepalive);
    }
  });
});

import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  loadAgentMemory,
  buildSystemPrompt,
  callClaude,
  loadChatHistory,
  logDecision,
  parseJSON,
  generateDraftId,
  saveDraft,
  getDraft,
  updateDraftStage,
  generateImage,
  qaValidate,
} from '@/lib/al-pipeline';
import { getModelImages, searchFiles, DRIVE_FOLDERS, getThumbnailUrl } from '@/lib/google-drive';
import {
  brandContextBlock,
  characterBibleBlock,
  characterDescription,
  CHARACTER_MATCHING,
  CONTENT_CATEGORIES,
  SEASONAL_CALENDAR,
  TOP_TREATMENTS,
  treatmentBaselinesBlock,
  imagePromptCraftBlock,
  storyDirectorSystemPrompt,
} from '@/lib/brand-context';

// ---------------------------------------------------------------------------
// Rich prompt blocks — injected into agent user messages
// ---------------------------------------------------------------------------

const RESEARCHER_CONTEXT = `
${brandContextBlock()}

== CONTENT DIVERSITY (rotate across these 10 categories) ==
${CONTENT_CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join('\n')}

== TOP TREATMENTS BY PERFORMANCE ==
${TOP_TREATMENTS.map((t) => `- ${t.name}: CPL PKR ${t.cpl} (${t.note})`).join('\n')}
- Avoid standalone: Hair PRP (high CPL), Facial (saturated market)

== SEASONAL CALENDAR (Pakistan) ==
${Object.entries(SEASONAL_CALENDAR).map(([k, v]) => `- ${k}: months ${v.months.join(',')}, themes: ${v.themes.join(', ')}`).join('\n')}
`;

const COPYWRITER_POST_RULES = `
== COPY RULES (SINGLE POST) ==
- Hook first line: question, stat, or bold claim
- 150-300 words, educational + aspirational tone
- Mention "Aesthetic Lounge" and "Dr. Huma Abbas" naturally
- End with CTA: "Book your free consultation — DM us or visit aestheticloungeofficial.com"
- WhatsApp: +92 327 6620000
- Include medical disclaimer: "Individual results may vary. Consult with our medical professionals."
- NEVER mention prices
`;

const COPYWRITER_CAROUSEL_RULES = `
== CAROUSEL RULES ==
- Structure: Hook slide → 3-5 educational slides → CTA slide (5-7 total)
- Include "scene_descriptions" array with visual description for EACH slide
- Slide 1: Hook — bold question or surprising fact
- Slides 2-5: Educational content — myths, steps, comparisons, facts
- Last slide: CTA — "Book your free consultation" + mention Dr. Huma Abbas
- Mention "Aesthetic Lounge" on first and last slides
- CTA in CAPTION ONLY — WhatsApp +92 327 6620000 — NEVER "Link in bio"
- NEVER put CTA text ON images — images are visual only, no text overlay
- Caption ends with: "Book now — DM us or visit aestheticloungeofficial.com"
`;

const COPYWRITER_REEL_RULES = `
== REEL RULES ==
- 4-6 scenes, 25-45 seconds total
- Include "scene_descriptions" array — one per scene with visual + action description
- Include "voiceover_text" — 30-60 words per scene, educational, conversational
- Story arc: HOOK (tension) → DEEPEN (pain) → PIVOT (solution) → PAYOFF (result) → CLOSE (brand CTA)
- End voiceover: "Book your free consultation at Aesthetic Lounge"
- Character must wear the SAME outfit in every scene
`;

function copywriterCharacterBlock(characterName: string): string {
  const desc = characterDescription(characterName);
  if (!desc) return '';
  return `\n== SELECTED CHARACTER ==\n${desc}\n`;
}

const DESIGNER_CONTEXT = `
${brandContextBlock()}

== CHARACTER BIBLE ==
${characterBibleBlock()}

== CHARACTER-TREATMENT MATCHING ==
${Object.entries(CHARACTER_MATCHING).map(([cat, char]) => `- ${cat}: ${char}`).join('\n')}

${imagePromptCraftBlock()}

== BACKGROUND DIVERSITY (rotate across scenes/posts) ==
- Luxury clinic interior (cream walls, gold-framed mirrors, soft diffused lighting)
- Treatment room (clean, professional, medical equipment subtle)
- DHA Phase 7 street / boulevard (modern, upscale Pakistani neighborhood)
- Luxury home vanity / bathroom (marble, warm lighting)
- Garden terrace with fairy lights (evening, warm glow)
- Modern upscale cafe (natural light, contemporary Pakistani interior)
- ALWAYS: Pakistani/Lahore context — NEVER Western settings

== REEL MODEL AESTHETIC ==
- Confident, poised, natural expression (never over-posed)
- Fitted but modest clothing matching character bible
- Flawless skin texture — the "after treatment" glow
- Same outfit every scene for character consistency

== CAROUSEL CTA RULE ==
- NEVER put CTA buttons or "Book Now" text on carousel images
- Images are visual/educational only — the platform handles CTA buttons
- Last slide can show brand logo + clinic name, but NO clickable CTA text

== MUSIC STYLE GUIDE (for reels) ==
- Piano: emotional, personal stories, before/after reveals
- Acoustic guitar: warm, educational, approachable content
- Lo-fi beats: modern, young audience, trendy hooks
- Orchestral: dramatic reveals, premium positioning
- Ambient: calm, spa treatments, relaxation content
- Jazz: sophisticated, evening events, luxury positioning
`;

const ANALYST_CONTEXT = `
${treatmentBaselinesBlock()}

== PERFORMANCE THRESHOLDS ==
- CPL > PKR 2.50 = underperformer → pause or refresh creative
- CPL < PKR 1.50 = top performer → increase budget
- CTR < 0.80% = weak creative → needs new hook/visual
- CTR > 2.00% = strong creative → scale
- Frequency > 3.0 = audience fatigue → refresh creative
- Target CPL: < PKR 2.00 (best achieved: PKR 1.23)
`;

/**
 * POST /api/al/pipeline
 * SSE streaming pipeline — sends keepalive pings to prevent Netlify timeout.
 * Body: { action, topic?, contentType?, params? }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json();
  const { action, topic, contentType, params } = body;

  if (!action) {
    return new Response(JSON.stringify({ error: 'action is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send keepalive pings every 5s to prevent Netlify inactivity timeout
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: {"type":"ping"}\n\n`));
        } catch { /* stream may be closed */ }
      }, 5000);

      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* stream closed by client */ }
      };

      try {
        send({ type: 'step', step: 'Loading agent memory' });

        switch (action) {
          case 'orchestrate': {
            // Step 1: Orchestrator picks topic
            const orchMem = await loadAgentMemory('orchestrator');
            const orchHistory = await loadChatHistory('orchestrator', 2);

            send({ type: 'step', step: 'Picking best topic' });

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

            await logDecision(
              'orchestrator',
              'orchestrate',
              orchParsed?.reasoning || orchResponse.text.slice(0, 200),
              JSON.stringify(orchParsed),
            );

            const chosenTopic = orchParsed?.topic || topic || 'Instagram content';
            const chosenType = orchParsed?.content_type || contentType || 'post';

            // Step 2: Researcher gathers insights
            send({ type: 'step', step: `Researching: ${chosenTopic.slice(0, 60)}` });

            const resMem = await loadAgentMemory('researcher');
            const resResponse = await callClaude({
              agent: 'researcher',
              userMessage: `Research this topic for an Instagram campaign: ${chosenTopic}
${RESEARCHER_CONTEXT}
Gather: treatment facts, competitor positioning, trending hooks, target audience insights, seasonal relevance.
Consider which content category fits best and which character matches the treatment.

Output JSON: { "summary": "...", "key_facts": [...], "hooks": [...], "competitor_angle": "...", "audience_insight": "...", "recommended_character": "ayesha|meher|noor|usman", "content_type_suggestion": "post|carousel|reel", "content_category": "..." }`,
              systemPrompt: buildSystemPrompt(resMem),
              maxTokens: 4096,
            });

            const resParsed = parseJSON(resResponse.text);
            await logDecision('researcher', 'research', `Researched: ${chosenTopic}`, JSON.stringify(resParsed));

            // Step 3: Copywriter creates draft
            send({ type: 'step', step: 'Writing copy' });

            const orchCharacter = (resParsed as Record<string, unknown>)?.recommended_character as string || '';
            const copyMem = await loadAgentMemory('copywriter');
            const typeRules = chosenType === 'carousel' ? COPYWRITER_CAROUSEL_RULES : chosenType === 'reel' ? COPYWRITER_REEL_RULES : COPYWRITER_POST_RULES;
            const copyResponse = await callClaude({
              agent: 'copywriter',
              userMessage: `Write Instagram ${chosenType} copy for: ${chosenTopic}

RESEARCH CONTEXT:
${JSON.stringify(resParsed)}
${copywriterCharacterBlock(orchCharacter)}
${typeRules}

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

            send({ type: 'step', step: 'Creating draft' });

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

            send({
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
              send({ type: 'result', success: false, error: 'topic required for research' });
              break;
            }

            const mem = await loadAgentMemory('researcher');
            const history = await loadChatHistory('researcher', 2);

            send({ type: 'step', step: 'Researching topic' });

            const response = await callClaude({
              agent: 'researcher',
              userMessage: `Research this topic for an Instagram campaign: ${topic}
${RESEARCHER_CONTEXT}
Gather: treatment facts, competitor positioning, trending hooks, target audience insights, seasonal relevance.
Consider which content category (from the 10 above) fits best and which character matches the treatment.

Output JSON: { "summary": "...", "key_facts": [...], "hooks": [...], "competitor_angle": "...", "audience_insight": "...", "recommended_character": "ayesha|meher|noor|usman", "content_type_suggestion": "post|carousel|reel", "content_category": "..." }`,
              systemPrompt: buildSystemPrompt(mem),
              chatHistory: history,
              maxTokens: 4096,
            });

            send({ type: 'step', step: 'Saving research' });

            const parsed = parseJSON(response.text);
            await logDecision('researcher', 'research', `Researched: ${topic}`, JSON.stringify(parsed));

            send({
              type: 'result',
              success: true,
              action: 'research',
              topic,
              result: parsed || { raw: response.text },
              tokens: { input: response.inputTokens, output: response.outputTokens },
            });
            break;
          }

          case 'write_content': {
            if (!topic) {
              send({ type: 'result', success: false, error: 'topic required' });
              break;
            }

            const mem = await loadAgentMemory('copywriter');
            const history = await loadChatHistory('copywriter', 2);
            const ct = contentType || 'post';

            send({ type: 'step', step: 'Writing copy' });

            const researchContext = params?.research ? `\n\nRESEARCH CONTEXT:\n${JSON.stringify(params.research)}` : '';
            const wcCharacter = (params?.character as string) || '';
            const wcTypeRules = ct === 'carousel' ? COPYWRITER_CAROUSEL_RULES : ct === 'reel' ? COPYWRITER_REEL_RULES : COPYWRITER_POST_RULES;

            const response = await callClaude({
              agent: 'copywriter',
              userMessage: `Write Instagram ${ct} copy for: ${topic}${researchContext}
${copywriterCharacterBlock(wcCharacter)}
${wcTypeRules}

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

            send({ type: 'step', step: 'Creating draft' });

            const parsed = parseJSON<{
              headline?: string;
              instagram_caption?: string;
              content_type?: string;
              suggested_character?: string;
              scene_descriptions?: string[];
              voiceover_text?: string;
            }>(response.text);

            // If user provided image(s), skip design stage → go straight to pending_publish
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

            send({
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
              send({ type: 'result', success: false, error: 'draftId or topic required' });
              break;
            }

            const mem = await loadAgentMemory('designer');
            const history = await loadChatHistory('designer', 2);

            send({ type: 'step', step: 'Preparing design brief' });

            let designBrief = '';
            if (draftId) {
              const draft = await getDraft(draftId);
              if (!draft) {
                send({ type: 'result', success: false, error: 'Draft not found' });
                break;
              }
              designBrief = `DRAFT DETAILS:\n- Topic: ${draft.topic}\n- Content Type: ${draft.contentType}\n- Headline: ${draft.headline}\n- Caption: ${draft.caption?.slice(0, 300)}\n- Suggested Model: ${draft.model}\n- Voiceover: ${draft.voiceoverText || 'N/A'}`;
            } else {
              designBrief = `Create design for: ${topic}\nContent type: ${contentType || 'post'}`;
            }

            send({ type: 'step', step: 'Generating design' });

            const response = await callClaude({
              agent: 'designer',
              userMessage: `${designBrief}

${DESIGNER_CONTEXT}

Design this content. Choose approach and generate image prompts.
Use the CHARACTER BIBLE above for full character descriptions in every prompt.
Rotate backgrounds across scenes — never repeat the same setting consecutively.

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

            send({
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

            send({ type: 'step', step: 'Analyzing performance' });

            const response = await callClaude({
              agent: 'analyst',
              userMessage: `Analyze recent AL Instagram ad performance.
${ANALYST_CONTEXT}

Based on the thresholds above, provide:
1. Overall performance summary
2. Top performing creatives and why
3. Underperformers to pause (CPL > 2.50 or CTR < 0.80%)
4. Budget recommendations (scale winners, pause losers)
5. Next content suggestions based on data

Output JSON: { "summary": "...", "top_performers": [...], "pause_candidates": [...], "budget_recommendations": [...], "next_content": [...] }`,
              systemPrompt: buildSystemPrompt(mem),
              chatHistory: history,
              temperature: 0.2,
            });

            send({ type: 'step', step: 'Saving analysis' });

            const parsed = parseJSON(response.text);
            await logDecision('analyst', 'analyze', 'Performance analysis', JSON.stringify(parsed));

            send({
              type: 'result',
              success: true,
              action: 'analyze',
              result: parsed || { raw: response.text },
              tokens: { input: response.inputTokens, output: response.outputTokens },
            });
            break;
          }

          // ---------------------------------------------------------------
          // Wizard actions — research_topics, chat_research, run_pipeline,
          // revise_ask, revise_apply
          // ---------------------------------------------------------------

          case 'research_topics': {
            send({ type: 'step', step: 'Researching trending topics...' });

            const orchMem = await loadAgentMemory('orchestrator');
            const resMem = await loadAgentMemory('researcher');

            send({ type: 'step', step: 'Analyzing seasonal data...' });

            const orchResponse = await callClaude({
              agent: 'orchestrator',
              userMessage: `Today is ${new Date().toISOString().split('T')[0]}. Research the most trending and seasonally relevant topics for Aesthetic Lounge Instagram content RIGHT NOW.
${RESEARCHER_CONTEXT}
Consider:
- Current season/holidays in Pakistan (use SEASONAL CALENDAR above)
- Instagram engagement trends for medical aesthetics
- Treatment seasonality and CPL data (use TOP TREATMENTS above)
- What competitors are posting
- Recent best-performing content types
- Rotate across the 10 CONTENT DIVERSITY categories

IMPORTANT: Include a MIX of content types — at least 1 "post", at least 1 "carousel", and optionally a "reel". Do NOT only suggest carousels or only reels. Single posts are our bread and butter.

Output JSON with 4-5 topic suggestions:
{
  "topics": [
    {
      "title": "Short topic title",
      "reasoning": "2-line explanation of why this topic is hot right now",
      "content_type": "post|carousel|reel",
      "treatment_category": "face|body|hair|skin|general",
      "engagement_estimate": "high|medium",
      "character": "ayesha|meher|noor|usman",
      "content_category": "which of the 10 diversity categories"
    }
  ]
}`,
              systemPrompt: buildSystemPrompt(orchMem),
              temperature: 0.4,
              maxTokens: 2048,
            });

            send({ type: 'step', step: 'Picking best topics...' });

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

            // Enrich with research for top topics
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
                send({
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

            send({
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
              send({ type: 'result', success: false, error: 'message required for chat research' });
              break;
            }

            send({ type: 'step', step: 'Researching your topic...' });

            const resMem = await loadAgentMemory('researcher');
            const chatHistory = await loadChatHistory('researcher', 4);

            const response = await callClaude({
              agent: 'researcher',
              userMessage: `The user wants to create content about: "${message}"
${RESEARCHER_CONTEXT}
Research this topic and suggest 3-5 specific content ideas.
Use the treatment performance data, seasonal calendar, and content categories above to inform your suggestions.

IMPORTANT: Keep your response concise. Each topic reasoning should be 1-2 sentences max.
IMPORTANT: Include a MIX of content types — at least 1 "post" and at least 1 "carousel". Single posts are our bread and butter — don't only suggest carousels or reels.

Output JSON (no markdown wrapping):
{
  "response": "2-3 sentence conversational reply to the user",
  "topics": [
    {
      "title": "Short specific title",
      "reasoning": "1-2 sentence why this works now",
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

            // Clean chatResponse — strip markdown wrapping if parseJSON failed
            let chatResponse = parsed?.response || response.text;
            if (chatResponse.startsWith('```')) {
              chatResponse = chatResponse.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim();
              // If still JSON-like, try to extract "response" field
              try {
                const inner = JSON.parse(chatResponse);
                if (inner.response) chatResponse = inner.response;
              } catch { /* use as-is */ }
            }

            send({
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
              send({ type: 'result', success: false, error: 'topic required' });
              break;
            }

            const ct = contentType || 'post';
            let totalInput = 0;
            let totalOutput = 0;

            // --- STEP 1: Write Copy ---
            send({ type: 'step', step: 'Writing copy...' });

            const copyMem = await loadAgentMemory('copywriter');
            const resMem = await loadAgentMemory('researcher');

            // Quick research first
            const resResponse = await callClaude({
              agent: 'researcher',
              userMessage: `Quick research for Instagram ${ct} about: ${topic}
${RESEARCHER_CONTEXT}
Output JSON: { "key_facts": [...], "hooks": [...], "recommended_character": "ayesha|meher|noor|usman", "audience_insight": "...", "content_category": "..." }`,
              systemPrompt: buildSystemPrompt(resMem),
              temperature: 0.2,
              maxTokens: 1024,
            });
            totalInput += resResponse.inputTokens;
            totalOutput += resResponse.outputTokens;
            const research = parseJSON(resResponse.text);

            const rpCharacter = (research as Record<string, unknown>)?.recommended_character as string || (params?.character as string) || '';
            const rpTypeRules = ct === 'carousel' ? COPYWRITER_CAROUSEL_RULES : ct === 'reel' ? COPYWRITER_REEL_RULES : COPYWRITER_POST_RULES;
            const copyResponse = await callClaude({
              agent: 'copywriter',
              userMessage: `Write Instagram ${ct} copy for: ${topic}

RESEARCH:
${JSON.stringify(research)}
${copywriterCharacterBlock(rpCharacter)}
${rpTypeRules}

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

            // Enforce headline max 60 chars — Claude sometimes exceeds
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
            send({ type: 'step', step: 'Searching brand assets...' });

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
              send({ type: 'step', step: 'Story directing reel scenes...' });

              const sdResponse = await callClaude({
                agent: 'designer', // shares designer chat history
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
                model: 'claude-sonnet-4-6', // Premium model for creative direction
                temperature: 0.7,
                maxTokens: 4096,
              });
              totalInput += sdResponse.inputTokens;
              totalOutput += sdResponse.outputTokens;

              storyDirectorResult = parseJSON(sdResponse.text);
              await logDecision('designer', 'story_direct', `StoryDirector: ${topic}`, JSON.stringify(storyDirectorResult));
            }

            // --- STEP 3: Generate AI Images ---
            send({ type: 'step', step: 'Generating design...' });

            const designerMem = await loadAgentMemory('designer');

            // For reels with StoryDirector output, use those prompts directly
            const sdScenes = storyDirectorResult?.scenes as Array<{ image_prompt: string; motion_prompt: string; duration_seconds: number }> | undefined;

            const designResponse = await callClaude({
              agent: 'designer',
              userMessage: `Create an image generation prompt for:
Topic: ${topic}
Content type: ${ct}
Headline: ${copy?.headline || topic}
Character: ${characterName}

${DESIGNER_CONTEXT}

Use the full character description from the CHARACTER BIBLE above.
${ct === 'carousel' ? 'Rotate backgrounds across slides — each slide should have a different setting.' : ''}

Output ONLY the enhanced prompt string. Include full character description, Pakistani/DHA Lahore setting, and technical specs (sharp focus, 8K, f/2.8, deep depth of field). No text overlay.`,
              systemPrompt: buildSystemPrompt(designerMem),
              temperature: 0.3,
              maxTokens: 500,
            });
            totalInput += designResponse.inputTokens;
            totalOutput += designResponse.outputTokens;

            const imagePrompt = designResponse.text.replace(/^["']|["']$/g, '').trim();

            const dims = ct === 'reel' ? { w: 1080, h: 1920 } : ct === 'carousel' ? { w: 1080, h: 1080 } : { w: 1080, h: 1350 };
            let aiImages: string[] = [];

            if (ct === 'reel' && sdScenes && sdScenes.length >= 2) {
              // Reel with StoryDirector — generate one image per scene using SD prompts
              send({ type: 'step', step: `Generating ${sdScenes.length} reel scenes...` });
              for (const [idx, scene] of sdScenes.entries()) {
                try {
                  const sceneImages = await generateImage({
                    prompt: scene.image_prompt,
                    width: dims.w,
                    height: dims.h,
                    numImages: 1,
                  });
                  aiImages.push(...sceneImages);
                  send({ type: 'step', step: `Scene ${idx + 1}/${sdScenes.length} done` });
                } catch (imgErr) {
                  console.error(`[run_pipeline] Reel scene ${idx + 1} error:`, imgErr);
                }
              }
            } else if (ct === 'carousel' && copy?.scene_descriptions && copy.scene_descriptions.length >= 2) {
              // Generate one image per carousel slide
              send({ type: 'step', step: `Generating ${copy.scene_descriptions.length} carousel slides...` });
              for (const [idx, sceneDesc] of copy.scene_descriptions.entries()) {
                try {
                  const slidePrompt = `${imagePrompt}\n\nThis is slide ${idx + 1} of ${copy.scene_descriptions.length}: ${sceneDesc}`;
                  const slideImages = await generateImage({
                    prompt: slidePrompt,
                    width: dims.w,
                    height: dims.h,
                    numImages: 1,
                  });
                  aiImages.push(...slideImages);
                  send({ type: 'step', step: `Slide ${idx + 1}/${copy.scene_descriptions.length} done` });
                } catch (imgErr) {
                  console.error(`[run_pipeline] Carousel slide ${idx + 1} error:`, imgErr);
                }
              }
            } else {
              // Single post or reel without StoryDirector — generate 2 options
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

            // --- STEP 4: QA Check ---
            send({ type: 'step', step: 'Running quality check...' });

            const draft = await getDraft(draftId);
            if (!draft) {
              send({ type: 'error', error: 'Draft not found after save' });
              return;
            }
            const qaResults = qaValidate(draft, aiImages);

            // Send complete result
            send({
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
            const context = params?.context || 'copy'; // 'copy' or 'design'

            if (!draftId2) {
              send({ type: 'result', success: false, error: 'draftId required' });
              break;
            }

            const draft = await getDraft(draftId2);
            if (!draft) {
              send({ type: 'result', success: false, error: 'Draft not found' });
              break;
            }

            send({ type: 'step', step: 'Analyzing draft for revision...' });

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

            // Fallback: if parseJSON returned an object without questions array,
            // check if the response itself is an array of questions
            if (parsed && !parsed.questions && Array.isArray(parsed)) {
              parsed = { questions: parsed as unknown as typeof parsed.questions };
            }

            send({
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
              send({ type: 'result', success: false, error: 'draftId and answers required' });
              break;
            }

            const draft = await getDraft(draftId3);
            if (!draft) {
              send({ type: 'result', success: false, error: 'Draft not found' });
              break;
            }

            if (context2 === 'copy') {
              send({ type: 'step', step: 'Revising copy...' });

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

              // Enforce headline max 60 chars
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

              send({
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
              // Design revision — regenerate images
              send({ type: 'step', step: 'Regenerating design...' });

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

              send({
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
              send({ type: 'result', success: false, error: 'draftId required for story_direct' });
              break;
            }

            const sdDraft = await getDraft(sdDraftId);
            if (!sdDraft) {
              send({ type: 'result', success: false, error: 'Draft not found' });
              break;
            }

            send({ type: 'step', step: 'Story directing reel scenes...' });

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

            send({
              type: 'result',
              success: true,
              action: 'story_direct',
              draftId: sdDraftId,
              result: sdParsed || { raw: sdResponse.text },
              tokens: { input: sdResponse.inputTokens, output: sdResponse.outputTokens },
            });
            break;
          }

          default:
            send({ type: 'result', success: false, error: `Unknown action: ${action}` });
        }
      } catch (err) {
        console.error(`[al/pipeline] ${action} error:`, err);
        const message = err instanceof Error ? err.message : 'Pipeline error';
        await logDecision('orchestrator', action, `ERROR: ${message}`).catch(() => {});
        send({ type: 'result', success: false, error: message });
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

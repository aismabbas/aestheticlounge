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
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
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
              userMessage: `Research this topic for an Instagram campaign: ${chosenTopic}\n\nGather: treatment facts, competitor positioning, trending hooks, target audience insights, seasonal relevance.\n\nOutput JSON: { "summary": "...", "key_facts": [...], "hooks": [...], "competitor_angle": "...", "audience_insight": "...", "recommended_character": "ayesha|meher|noor|usman", "content_type_suggestion": "post|carousel|reel" }`,
              systemPrompt: buildSystemPrompt(resMem),
              maxTokens: 4096,
            });

            const resParsed = parseJSON(resResponse.text);
            await logDecision('researcher', 'research', `Researched: ${chosenTopic}`, JSON.stringify(resParsed));

            // Step 3: Copywriter creates draft
            send({ type: 'step', step: 'Writing copy' });

            const copyMem = await loadAgentMemory('copywriter');
            const copyResponse = await callClaude({
              agent: 'copywriter',
              userMessage: `Write Instagram ${chosenType} copy for: ${chosenTopic}\n\nRESEARCH CONTEXT:\n${JSON.stringify(resParsed)}\n\nOutput JSON:\n{\n  "headline": "...",\n  "instagram_caption": "...(150-300 words, hook first line, end with CTA, include medical disclaimer)...",\n  "content_type": "${chosenType}",\n  "suggested_character": "ayesha|meher|noor|usman",\n  "scene_descriptions": [...] (if reel/carousel),\n  "voiceover_text": "..." (if reel)\n}`,
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
              userMessage: `Research this topic for an Instagram campaign: ${topic}\n\nGather: treatment facts, competitor positioning, trending hooks, target audience insights, seasonal relevance.\n\nOutput JSON: { "summary": "...", "key_facts": [...], "hooks": [...], "competitor_angle": "...", "audience_insight": "...", "recommended_character": "ayesha|meher|noor|usman", "content_type_suggestion": "post|carousel|reel" }`,
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

            const response = await callClaude({
              agent: 'copywriter',
              userMessage: `Write Instagram ${ct} copy for: ${topic}${researchContext}\n\nOutput JSON:\n{\n  "headline": "...",\n  "instagram_caption": "...(150-300 words, hook first line, end with CTA, include medical disclaimer)...",\n  "content_type": "${ct}",\n  "suggested_character": "ayesha|meher|noor|usman",\n  "scene_descriptions": [...] (if reel/carousel),\n  "voiceover_text": "..." (if reel)\n}`,
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

            const draftId = await generateDraftId();
            await saveDraft({
              id: draftId,
              stage: 'pending_copy',
              topic,
              contentType: parsed?.content_type || ct,
              caption: parsed?.instagram_caption,
              headline: parsed?.headline,
              model: parsed?.suggested_character,
              voiceoverText: parsed?.voiceover_text,
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
              userMessage: `${designBrief}\n\nDesign this content. Choose approach and generate image prompts.\n\nOutput JSON:\n{\n  "approach": "ai_image"|"carousel"|"reel",\n  "template": "lifestyle|treatment|carousel_hook|reel|...",\n  "character": "ayesha|meher|noor|usman",\n  "image_prompt": "detailed fal.ai prompt...",\n  "image_prompts": ["..."] (for carousel slides),\n  "reel_scenes": [{"scene_number": 1, "image_prompt": "...", "motion_prompt": "...", "duration_seconds": 7}],\n  "dimensions": "1080x1350|1080x1080|1080x1920",\n  "headline": "...",\n  "body": "..."\n}`,
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
              userMessage: `Analyze recent AL Instagram ad performance. Based on your knowledge of our benchmarks (target CPL < 2.00 PKR, best 1.23 PKR), provide:\n\n1. Overall performance summary\n2. Top performing creatives and why\n3. Underperformers to pause\n4. Budget recommendations\n5. Next content suggestions based on data\n\nOutput JSON: { "summary": "...", "top_performers": [...], "pause_candidates": [...], "budget_recommendations": [...], "next_content": [...] }`,
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

Consider:
- Current season/holidays in Pakistan (Ramadan, Eid, summer, winter, wedding season, etc.)
- Instagram engagement trends for medical aesthetics
- Treatment seasonality (e.g., laser in winter, hydration in summer)
- What competitors are posting
- Recent best-performing content types

Output JSON with 3-5 topic suggestions:
{
  "topics": [
    {
      "title": "Short topic title",
      "reasoning": "2-line explanation of why this topic is hot right now",
      "content_type": "post|carousel|reel",
      "treatment_category": "face|body|hair|skin|general",
      "engagement_estimate": "high|medium",
      "character": "ayesha|meher|noor|usman"
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

Research this topic and suggest 3-5 specific content ideas.

IMPORTANT: Keep your response concise. Each topic reasoning should be 1-2 sentences max.

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
              userMessage: `Quick research for Instagram ${ct} about: ${topic}\n\nOutput JSON: { "key_facts": [...], "hooks": [...], "recommended_character": "ayesha|meher|noor|usman", "audience_insight": "..." }`,
              systemPrompt: buildSystemPrompt(resMem),
              temperature: 0.2,
              maxTokens: 1024,
            });
            totalInput += resResponse.inputTokens;
            totalOutput += resResponse.outputTokens;
            const research = parseJSON(resResponse.text);

            const copyResponse = await callClaude({
              agent: 'copywriter',
              userMessage: `Write Instagram ${ct} copy for: ${topic}\n\nRESEARCH:\n${JSON.stringify(research)}\n\nOutput JSON:\n{\n  "headline": "short punchy headline (max 60 chars)",\n  "instagram_caption": "150-300 words, hook first line, CTA last line, include medical disclaimer: Individual results may vary...",\n  "content_type": "${ct}",\n  "suggested_character": "ayesha|meher|noor|usman",\n  "voiceover_text": "..." \n}`,
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
              contentType: copy?.content_type || ct,
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

            // --- STEP 3: Generate AI Images ---
            send({ type: 'step', step: 'Generating design...' });

            const designerMem = await loadAgentMemory('designer');
            const designResponse = await callClaude({
              agent: 'designer',
              userMessage: `Create an image generation prompt for:\nTopic: ${topic}\nContent type: ${ct}\nHeadline: ${copy?.headline || topic}\nCharacter: ${characterName}\n\nOutput ONLY the enhanced prompt string. Include character description, brand aesthetics (luxury medical spa, gold/cream palette), camera/lighting specs, and "No text overlay" directive.`,
              systemPrompt: buildSystemPrompt(designerMem),
              temperature: 0.3,
              maxTokens: 500,
            });
            totalInput += designResponse.inputTokens;
            totalOutput += designResponse.outputTokens;

            const imagePrompt = designResponse.text.replace(/^["']|["']$/g, '').trim();

            const dims = ct === 'reel' ? { w: 1080, h: 1920 } : ct === 'carousel' ? { w: 1080, h: 1080 } : { w: 1080, h: 1350 };
            let aiImages: string[] = [];
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

            // --- STEP 4: QA Check ---
            send({ type: 'step', step: 'Running quality check...' });

            const draft = await getDraft(draftId);
            const qaResults = qaValidate(draft!, aiImages);

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

              if (revised) {
                await saveDraft({
                  ...draft,
                  headline: revised.headline || draft.headline,
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
                  headline: revised?.headline || draft.headline,
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

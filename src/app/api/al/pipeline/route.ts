import { NextRequest, NextResponse } from 'next/server';
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
} from '@/lib/al-pipeline';

/**
 * POST /api/al/pipeline
 * Main pipeline entry point — replaces n8n webhook.
 * Body: { action, topic?, contentType?, params? }
 *
 * Actions:
 *   orchestrate — auto-pick topic and content type, run full pipeline
 *   research    — research a topic
 *   write_content — write copy for a topic (optionally from research)
 *   design      — generate visuals for approved copy
 *   analyze     — analyze ad performance
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, topic, contentType, params } = body;

  if (!action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 });
  }

  try {
    switch (action) {
      // -----------------------------------------------------------------
      // ORCHESTRATE — auto-pick topic, route to research → copy → design
      // -----------------------------------------------------------------
      case 'orchestrate': {
        const mem = await loadAgentMemory('orchestrator');
        const history = await loadChatHistory('orchestrator', 3);

        const userMsg = topic
          ? `Create a new ${contentType || 'post'} about: ${topic}`
          : `Pick the best topic for today's Instagram content. Consider seasonal relevance, treatment rotation, and recent performance. Output JSON with: { "next_action": "research"|"write_content", "topic": "...", "content_type": "post"|"carousel"|"reel", "reasoning": "..." }`;

        const response = await callClaude({
          agent: 'orchestrator',
          userMessage: userMsg,
          systemPrompt: buildSystemPrompt(mem),
          chatHistory: history,
          temperature: 0.2,
        });

        const parsed = parseJSON<{
          next_action: string;
          topic: string;
          content_type: string;
          reasoning: string;
        }>(response.text);

        await logDecision(
          'orchestrator',
          'orchestrate',
          parsed?.reasoning || response.text.slice(0, 200),
          JSON.stringify(parsed),
        );

        return NextResponse.json({
          success: true,
          action: 'orchestrate',
          result: parsed || { raw: response.text },
          tokens: { input: response.inputTokens, output: response.outputTokens },
        });
      }

      // -----------------------------------------------------------------
      // RESEARCH — gather intel on a topic
      // -----------------------------------------------------------------
      case 'research': {
        if (!topic) return NextResponse.json({ error: 'topic required for research' }, { status: 400 });

        const mem = await loadAgentMemory('researcher');
        const history = await loadChatHistory('researcher', 3);

        const response = await callClaude({
          agent: 'researcher',
          userMessage: `Research this topic for an Instagram campaign: ${topic}\n\nGather: treatment facts, competitor positioning, trending hooks, target audience insights, seasonal relevance.\n\nOutput JSON: { "summary": "...", "key_facts": [...], "hooks": [...], "competitor_angle": "...", "audience_insight": "...", "recommended_character": "ayesha|meher|noor|usman", "content_type_suggestion": "post|carousel|reel" }`,
          systemPrompt: buildSystemPrompt(mem),
          chatHistory: history,
          maxTokens: 4096,
        });

        const parsed = parseJSON(response.text);

        await logDecision(
          'researcher',
          'research',
          `Researched: ${topic}`,
          JSON.stringify(parsed),
        );

        return NextResponse.json({
          success: true,
          action: 'research',
          topic,
          result: parsed || { raw: response.text },
          tokens: { input: response.inputTokens, output: response.outputTokens },
        });
      }

      // -----------------------------------------------------------------
      // WRITE CONTENT — generate copy (caption, headline, voiceover)
      // -----------------------------------------------------------------
      case 'write_content': {
        if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 });

        const mem = await loadAgentMemory('copywriter');
        const history = await loadChatHistory('copywriter', 3);
        const ct = contentType || 'post';

        const researchContext = params?.research ? `\n\nRESEARCH CONTEXT:\n${JSON.stringify(params.research)}` : '';

        const response = await callClaude({
          agent: 'copywriter',
          userMessage: `Write Instagram ${ct} copy for: ${topic}${researchContext}\n\nOutput JSON:\n{\n  "headline": "...",\n  "instagram_caption": "...(150-300 words, hook first line, end with CTA, include medical disclaimer)...",\n  "content_type": "${ct}",\n  "suggested_character": "ayesha|meher|noor|usman",\n  "scene_descriptions": [...] (if reel/carousel),\n  "voiceover_text": "..." (if reel)\n}`,
          systemPrompt: buildSystemPrompt(mem),
          chatHistory: history,
          temperature: 0.5,
        });

        const parsed = parseJSON<{
          headline?: string;
          instagram_caption?: string;
          content_type?: string;
          suggested_character?: string;
          scene_descriptions?: string[];
          voiceover_text?: string;
        }>(response.text);

        // Save as draft
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

        await logDecision(
          'copywriter',
          'write_content',
          `Draft created: ${topic}`,
          draftId,
        );

        return NextResponse.json({
          success: true,
          action: 'write_content',
          draftId,
          result: parsed || { raw: response.text },
          tokens: { input: response.inputTokens, output: response.outputTokens },
        });
      }

      // -----------------------------------------------------------------
      // DESIGN — generate visuals for an approved draft
      // -----------------------------------------------------------------
      case 'design': {
        const draftId = params?.draftId;
        if (!draftId && !topic) {
          return NextResponse.json({ error: 'draftId or topic required' }, { status: 400 });
        }

        const mem = await loadAgentMemory('designer');
        const history = await loadChatHistory('designer', 3);

        let designBrief = '';
        if (draftId) {
          const { getDraft } = await import('@/lib/al-pipeline');
          const draft = await getDraft(draftId);
          if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
          designBrief = `DRAFT DETAILS:\n- Topic: ${draft.topic}\n- Content Type: ${draft.contentType}\n- Headline: ${draft.headline}\n- Caption: ${draft.caption?.slice(0, 300)}\n- Suggested Model: ${draft.model}\n- Voiceover: ${draft.voiceoverText || 'N/A'}`;
        } else {
          designBrief = `Create design for: ${topic}\nContent type: ${contentType || 'post'}`;
        }

        const response = await callClaude({
          agent: 'designer',
          userMessage: `${designBrief}\n\nDesign this content. Choose approach and generate image prompts.\n\nOutput JSON:\n{\n  "approach": "ai_image"|"carousel"|"reel",\n  "template": "lifestyle|treatment|carousel_hook|reel|...",\n  "character": "ayesha|meher|noor|usman",\n  "image_prompt": "detailed fal.ai prompt...",\n  "image_prompts": ["..."] (for carousel slides),\n  "reel_scenes": [{"scene_number": 1, "image_prompt": "...", "motion_prompt": "...", "duration_seconds": 7}],\n  "dimensions": "1080x1350|1080x1080|1080x1920",\n  "headline": "...",\n  "body": "..."\n}`,
          systemPrompt: buildSystemPrompt(mem),
          chatHistory: history,
          temperature: 0.3,
          maxTokens: 2048,
        });

        const parsed = parseJSON(response.text);

        // Update draft if we have one
        if (draftId && parsed) {
          const { updateDraftStage } = await import('@/lib/al-pipeline');
          await updateDraftStage(draftId, 'pending_design');
        }

        await logDecision(
          'designer',
          'design',
          `Designed: ${topic || draftId}`,
          JSON.stringify(parsed),
        );

        return NextResponse.json({
          success: true,
          action: 'design',
          draftId,
          result: parsed || { raw: response.text },
          tokens: { input: response.inputTokens, output: response.outputTokens },
        });
      }

      // -----------------------------------------------------------------
      // ANALYZE — ad performance analysis
      // -----------------------------------------------------------------
      case 'analyze': {
        const mem = await loadAgentMemory('analyst');
        const history = await loadChatHistory('analyst', 3);

        const response = await callClaude({
          agent: 'analyst',
          userMessage: `Analyze recent AL Instagram ad performance. Based on your knowledge of our benchmarks (target CPL < 2.00 PKR, best 1.23 PKR), provide:\n\n1. Overall performance summary\n2. Top performing creatives and why\n3. Underperformers to pause\n4. Budget recommendations\n5. Next content suggestions based on data\n\nOutput JSON: { "summary": "...", "top_performers": [...], "pause_candidates": [...], "budget_recommendations": [...], "next_content": [...] }`,
          systemPrompt: buildSystemPrompt(mem),
          chatHistory: history,
          temperature: 0.2,
        });

        const parsed = parseJSON(response.text);

        await logDecision('analyst', 'analyze', 'Performance analysis', JSON.stringify(parsed));

        return NextResponse.json({
          success: true,
          action: 'analyze',
          result: parsed || { raw: response.text },
          tokens: { input: response.inputTokens, output: response.outputTokens },
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error(`[al/pipeline] ${action} error:`, err);
    const message = err instanceof Error ? err.message : 'Pipeline error';

    await logDecision('orchestrator', action, `ERROR: ${message}`).catch(() => {});

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

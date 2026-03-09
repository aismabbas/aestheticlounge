import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getDrafts,
  getDraft,
  updateDraftStage,
  logDecision,
  publishToInstagram,
  generateImage,
  loadAgentMemory,
  buildSystemPrompt,
  callClaude,
  parseJSON,
} from '@/lib/al-pipeline';

/**
 * GET /api/al/drafts?stage=pending_copy&limit=20
 * List pipeline drafts for dashboard review.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stage = req.nextUrl.searchParams.get('stage') || undefined;
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);

  try {
    const drafts = await getDrafts(stage, limit);
    return NextResponse.json({ drafts });
  } catch (err) {
    console.error('[al/drafts] GET error:', err);
    return NextResponse.json({ error: 'Failed to load drafts' }, { status: 500 });
  }
}

/**
 * POST /api/al/drafts
 * Actions on drafts: approve_copy, approve_design, approve_publish, reject, generate_image
 * Body: { action, draftId, params? }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, draftId } = body;

  if (!action || !draftId) {
    return NextResponse.json({ error: 'action and draftId required' }, { status: 400 });
  }

  try {
    const draft = await getDraft(draftId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    switch (action) {
      // Approve copy → move to design stage
      case 'approve_copy': {
        await updateDraftStage(draftId, 'pending_design');
        await logDecision('publisher', 'approve_copy', `Approved copy: ${draft.topic}`, draftId);
        return NextResponse.json({ success: true, stage: 'pending_design' });
      }

      // Generate preview image for a draft — uses designer agent memory for prompt enhancement
      case 'generate_image': {
        const basePrompt = body.params?.imagePrompt || draft.headline || draft.topic;

        // Use Claude + designer memory to enhance the prompt
        const designerMem = await loadAgentMemory('designer');
        const enhanced = await callClaude({
          agent: 'designer',
          userMessage: `Enhance this into a Nano Banana Pro image generation prompt for Aesthetic Lounge Instagram:\n\nTopic: ${draft.topic}\nContent type: ${draft.contentType}\nHeadline: ${draft.headline || 'N/A'}\nUser prompt: ${basePrompt}\nSuggested model: ${draft.model || 'ayesha'}\n\nOutput ONLY the enhanced prompt string, nothing else. Include character description from your memory, brand aesthetics, camera/lighting specs, and "No text overlay" directive.`,
          systemPrompt: buildSystemPrompt(designerMem),
          temperature: 0.3,
          maxTokens: 500,
        });

        const finalPrompt = enhanced.text.replace(/^["']|["']$/g, '').trim();

        const images = await generateImage({
          prompt: finalPrompt,
          width: 1080,
          height: 1350,
          numImages: 2,
        });

        return NextResponse.json({ success: true, images, enhancedPrompt: finalPrompt });
      }

      // Approve design → move to publish stage
      case 'approve_design': {
        const imageUrl = body.params?.imageUrl;
        if (imageUrl) {
          const { saveDraft } = await import('@/lib/al-pipeline');
          await saveDraft({
            ...draft,
            imageUrl,
            stage: 'pending_publish',
            updatedAt: new Date().toISOString(),
          });
        } else {
          await updateDraftStage(draftId, 'pending_publish');
        }
        await logDecision('publisher', 'approve_design', `Design approved: ${draft.topic}`, draftId);
        return NextResponse.json({ success: true, stage: 'pending_publish' });
      }

      // Publish to Instagram
      case 'publish': {
        if (!draft.imageUrl && !draft.imageUrls?.length) {
          return NextResponse.json({ error: 'No image to publish' }, { status: 400 });
        }

        const caption = draft.caption || draft.headline || draft.topic;
        let publishType: 'photo' | 'carousel' | 'reel' = 'photo';
        if (draft.contentType === 'carousel' && draft.imageUrls?.length) {
          publishType = 'carousel';
        } else if (draft.contentType === 'reel') {
          publishType = 'reel';
        }

        const result = await publishToInstagram({
          type: publishType,
          imageUrl: draft.imageUrl,
          imageUrls: draft.imageUrls,
          caption,
        });

        await updateDraftStage(draftId, 'published');
        await logDecision(
          'publisher',
          'publish',
          `Published ${publishType}: ${draft.topic}`,
          JSON.stringify(result),
        );

        return NextResponse.json({ success: true, published: result });
      }

      // Reject draft
      case 'reject': {
        await updateDraftStage(draftId, 'rejected');
        await logDecision('publisher', 'reject', `Rejected: ${draft.topic}`, body.params?.reason || '');
        return NextResponse.json({ success: true, stage: 'rejected' });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('[al/drafts] POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Draft action failed' },
      { status: 500 },
    );
  }
}

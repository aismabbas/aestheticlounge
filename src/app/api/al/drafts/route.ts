import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getDrafts,
  getDraft,
  updateDraftStage,
  logDecision,
  publishToInstagram,
  publishToFacebook,
  generateImage,
  loadAgentMemory,
  buildSystemPrompt,
  callClaude,
  parseJSON,
  saveDraft as saveDraftFn,
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
        const isCarousel = draft.contentType === 'carousel';

        // Use Claude + designer memory to enhance the prompt
        const designerMem = await loadAgentMemory('designer');

        if (isCarousel) {
          // For carousels: ask Claude to generate per-slide prompts
          const slidePromptResponse = await callClaude({
            agent: 'designer',
            userMessage: `Generate image prompts for a ${draft.contentType} about: ${draft.topic}\nHeadline: ${draft.headline || 'N/A'}\nCaption: ${draft.caption?.slice(0, 500) || 'N/A'}\nSuggested model: ${draft.model || 'ayesha'}\n\nThis is a carousel post with multiple slides. Generate 5 unique image prompts, one per slide. Each should be a Nano Banana Pro prompt with character description, brand aesthetics (gold/cream luxury medical spa), camera/lighting, and "No text overlay".\n\nOutput JSON array of strings: ["prompt1", "prompt2", ...]`,
            systemPrompt: buildSystemPrompt(designerMem),
            temperature: 0.4,
            maxTokens: 2048,
          });

          const slidePrompts = parseJSON<string[]>(slidePromptResponse.text);
          const prompts = Array.isArray(slidePrompts) && slidePrompts.length > 0
            ? slidePrompts
            : [basePrompt]; // fallback to single prompt

          // Generate one image per slide (1080x1080 for carousel)
          const allImages: string[] = [];
          for (const prompt of prompts.slice(0, 6)) { // max 6 slides
            try {
              const imgs = await generateImage({
                prompt: prompt.replace(/^["']|["']$/g, '').trim(),
                width: 1080,
                height: 1080,
                numImages: 1,
              });
              allImages.push(...imgs);
            } catch (imgErr) {
              console.error('[generate_image] Slide generation error:', imgErr);
            }
          }

          // Save images to draft
          if (allImages.length > 0) {
            await saveDraftFn({
              ...draft,
              imageUrl: allImages[0],
              imageUrls: allImages,
              updatedAt: new Date().toISOString(),
            });
          }

          return NextResponse.json({ success: true, images: allImages, slideCount: allImages.length });
        }

        // Single post / reel: generate 2 preview images
        const enhanced = await callClaude({
          agent: 'designer',
          userMessage: `Enhance this into a Nano Banana Pro image generation prompt for Aesthetic Lounge Instagram:\n\nTopic: ${draft.topic}\nContent type: ${draft.contentType}\nHeadline: ${draft.headline || 'N/A'}\nUser prompt: ${basePrompt}\nSuggested model: ${draft.model || 'ayesha'}\n\nOutput ONLY the enhanced prompt string, nothing else. Include character description from your memory, brand aesthetics, camera/lighting specs, and "No text overlay" directive.`,
          systemPrompt: buildSystemPrompt(designerMem),
          temperature: 0.3,
          maxTokens: 500,
        });

        const finalPrompt = enhanced.text.replace(/^["']|["']$/g, '').trim();
        const dims = draft.contentType === 'reel' ? { w: 1080, h: 1920 } : { w: 1080, h: 1350 };

        const images = await generateImage({
          prompt: finalPrompt,
          width: dims.w,
          height: dims.h,
          numImages: 2,
        });

        return NextResponse.json({ success: true, images, enhancedPrompt: finalPrompt });
      }

      // Approve design → move to publish stage
      case 'approve_design': {
        const imageUrl = body.params?.imageUrl;
        const imageUrls = body.params?.imageUrls;
        if (imageUrl || imageUrls) {
          await saveDraftFn({
            ...draft,
            imageUrl: imageUrl || (Array.isArray(imageUrls) ? imageUrls[0] : draft.imageUrl),
            imageUrls: Array.isArray(imageUrls) ? imageUrls : draft.imageUrls,
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
        // Carousel requires 2+ images; if only 1, fall back to photo
        if (draft.contentType === 'carousel' && draft.imageUrls && draft.imageUrls.length >= 2) {
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
          `Published ${publishType} (${draft.imageUrls?.length || 1} images): ${draft.topic}`,
          JSON.stringify(result),
        );

        return NextResponse.json({ success: true, published: result, type: publishType });
      }

      // Publish to Instagram + optionally Facebook
      case 'publish_all': {
        if (!draft.imageUrl && !draft.imageUrls?.length) {
          return NextResponse.json({ error: 'No image to publish' }, { status: 400 });
        }

        const caption = draft.caption || draft.headline || draft.topic;
        const results: Record<string, unknown> = {};

        // Always publish to Instagram
        let publishType: 'photo' | 'carousel' | 'reel' = 'photo';
        if (draft.contentType === 'carousel' && draft.imageUrls && draft.imageUrls.length >= 2) {
          publishType = 'carousel';
        } else if (draft.contentType === 'reel') {
          publishType = 'reel';
        }

        const igResult = await publishToInstagram({
          type: publishType,
          imageUrl: draft.imageUrl,
          imageUrls: draft.imageUrls,
          caption,
        });
        results.instagram = igResult;

        // Optionally publish to Facebook
        if (body.params?.facebook && draft.imageUrl) {
          try {
            const fbResult = await publishToFacebook({
              imageUrl: draft.imageUrl,
              caption,
            });
            results.facebook = fbResult;
          } catch (fbErr) {
            results.facebookError = fbErr instanceof Error ? fbErr.message : 'Facebook publish failed';
          }
        }

        await updateDraftStage(draftId, 'published');
        await logDecision(
          'publisher',
          'publish_all',
          `Published ${publishType}: ${draft.topic}`,
          JSON.stringify(results),
        );

        return NextResponse.json({ success: true, published: results });
      }

      // Reject draft
      case 'reject': {
        await updateDraftStage(draftId, 'rejected');
        await logDecision('publisher', 'reject', `Rejected: ${draft.topic}`, body.params?.reason || '');
        return NextResponse.json({ success: true, stage: 'rejected' });
      }

      // Revise — update draft fields directly
      case 'revise': {
        const updates = body.params || {};
        await saveDraftFn({
          ...draft,
          headline: updates.headline || draft.headline,
          caption: updates.caption || draft.caption,
          imageUrl: updates.imageUrl || draft.imageUrl,
          model: updates.character || draft.model,
          voiceoverText: updates.voiceover || draft.voiceoverText,
          updatedAt: new Date().toISOString(),
        });
        return NextResponse.json({ success: true });
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

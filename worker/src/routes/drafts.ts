/**
 * Drafts route — migrated from src/app/api/al/drafts/route.ts
 * Handles draft CRUD and actions: approve_copy, generate_image, approve_design,
 * publish, publish_all, reject, revise.
 */

import { Hono } from 'hono';
import {
  getDrafts,
  getDraft,
  updateDraftStage,
  logDecision,
  saveDraft,
  deleteDrafts,
  deleteAllDrafts,
} from '../lib/drafts.js';
import {
  loadAgentMemory,
  buildSystemPrompt,
  callClaude,
  parseJSON,
} from '../lib/claude.js';
import { generateImage } from '../lib/image-gen.js';
import { publishToInstagram, publishToFacebook } from '../lib/publish.js';

export const draftsRoute = new Hono();

/**
 * GET /drafts?stage=pending_copy&limit=20
 */
draftsRoute.get('/', async (c) => {
  const stage = c.req.query('stage') || undefined;
  const limit = parseInt(c.req.query('limit') || '20', 10);

  try {
    const drafts = await getDrafts(stage, limit);
    return c.json({ drafts });
  } catch (err) {
    console.error('[drafts] GET error:', err);
    return c.json({ error: 'Failed to load drafts' }, 500);
  }
});

/**
 * POST /drafts
 * Body: { action, draftId, params? }
 */
draftsRoute.post('/', async (c) => {
  const body = await c.req.json();
  const { action, draftId } = body;

  // Delete actions don't need a single draftId
  if (action === 'delete_selected') {
    const ids: string[] = body.draftIds || [];
    if (ids.length === 0) return c.json({ error: 'No draft IDs provided' }, 400);
    try {
      const count = await deleteDrafts(ids);
      return c.json({ success: true, deleted: count });
    } catch (err) {
      console.error('[drafts] delete_selected error:', err);
      return c.json({ error: 'Failed to delete drafts' }, 500);
    }
  }

  if (action === 'delete_all') {
    const stage: string | undefined = body.stage || undefined;
    try {
      const count = await deleteAllDrafts(stage);
      return c.json({ success: true, deleted: count });
    } catch (err) {
      console.error('[drafts] delete_all error:', err);
      return c.json({ error: 'Failed to delete drafts' }, 500);
    }
  }

  if (!action || !draftId) {
    return c.json({ error: 'action and draftId required' }, 400);
  }

  try {
    const draft = await getDraft(draftId);
    if (!draft) return c.json({ error: 'Draft not found' }, 404);

    switch (action) {
      // Approve copy → move to design stage
      case 'approve_copy': {
        await updateDraftStage(draftId, 'pending_design');
        await logDecision('publisher', 'approve_copy', `Approved copy: ${draft.topic}`, draftId);
        return c.json({ success: true, stage: 'pending_design' });
      }

      // Generate preview image for a draft
      case 'generate_image': {
        const basePrompt = body.params?.imagePrompt || draft.headline || draft.topic;
        const isCarousel = draft.contentType === 'carousel';

        const designerMem = await loadAgentMemory('designer');

        if (isCarousel) {
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
            : [basePrompt];

          const allImages: string[] = [];
          for (const prompt of prompts.slice(0, 6)) {
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

          if (allImages.length > 0) {
            await saveDraft({
              ...draft,
              imageUrl: allImages[0],
              imageUrls: allImages,
              updatedAt: new Date().toISOString(),
            });
          }

          return c.json({ success: true, images: allImages, slideCount: allImages.length });
        }

        // Single post / reel
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

        return c.json({ success: true, images, enhancedPrompt: finalPrompt });
      }

      // Approve design → move to publish stage
      case 'approve_design': {
        const imageUrl = body.params?.imageUrl;
        const imageUrls = body.params?.imageUrls;
        if (imageUrl || imageUrls) {
          await saveDraft({
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
        return c.json({ success: true, stage: 'pending_publish' });
      }

      // Publish to Instagram
      case 'publish': {
        if (!draft.imageUrl && !draft.imageUrls?.length) {
          return c.json({ error: 'No image to publish' }, 400);
        }

        const caption = draft.caption || draft.headline || draft.topic;
        let publishType: 'photo' | 'carousel' | 'reel' = 'photo';
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

        return c.json({ success: true, published: result, type: publishType });
      }

      // Publish to Instagram + optionally Facebook
      case 'publish_all': {
        if (!draft.imageUrl && !draft.imageUrls?.length) {
          return c.json({ error: 'No image to publish' }, 400);
        }

        const caption = draft.caption || draft.headline || draft.topic;
        const results: Record<string, unknown> = {};

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

        return c.json({ success: true, published: results });
      }

      // Reject draft
      case 'reject': {
        await updateDraftStage(draftId, 'rejected');
        await logDecision('publisher', 'reject', `Rejected: ${draft.topic}`, body.params?.reason || '');
        return c.json({ success: true, stage: 'rejected' });
      }

      // Revise — update draft fields directly
      case 'revise': {
        const updates = body.params || {};
        await saveDraft({
          ...draft,
          headline: updates.headline || draft.headline,
          caption: updates.caption || draft.caption,
          imageUrl: updates.imageUrl || draft.imageUrl,
          model: updates.character || draft.model,
          voiceoverText: updates.voiceover || draft.voiceoverText,
          updatedAt: new Date().toISOString(),
        });
        return c.json({ success: true });
      }

      default:
        return c.json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error('[drafts] POST error:', err);
    return c.json(
      { error: err instanceof Error ? err.message : 'Draft action failed' },
      500,
    );
  }
});

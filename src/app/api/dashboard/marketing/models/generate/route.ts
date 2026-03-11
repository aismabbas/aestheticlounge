import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { MODELS } from '@/lib/marketing-config';
import { MODEL_PROMPTS } from '@/lib/brand-context';
import {
  DRIVE_FOLDERS,
  listFiles,
  isGoogleDriveConfigured,
} from '@/lib/google-drive';

// ---------------------------------------------------------------------------
// Prompt builder (base)
// ---------------------------------------------------------------------------

function buildBasePrompt(
  modelName: string,
  sceneType: string,
  treatment: string,
  pose: string,
): string {
  const profile = MODEL_PROMPTS[modelName];
  if (!profile) {
    return `Professional portrait photography of a person in a luxury medical aesthetics clinic. ${pose} angle. Clinical-luxury setting with cream and gold decor.`;
  }

  const poseDesc: Record<string, string> = {
    '3-quarter': '3/4 angle portrait',
    profile: 'side profile portrait emphasizing jawline',
    'front-facing': 'direct front-facing portrait with eye contact',
    'wide-shot': 'wide shot showing full setting and environment',
  };

  const sceneDesc: Record<string, string> = {
    hero: `Hero brand portrait. ${profile.appearance}, ${profile.wardrobe}. ${poseDesc[pose] || '3/4 angle'}. Luxury medical aesthetics clinic setting with cream walls, gold-framed mirrors, soft diffused lighting. Confident elegant expression.`,
    treatment: `Treatment scene. ${profile.appearance}, ${profile.wardrobe}. ${treatment ? `Receiving ${treatment} treatment.` : 'In treatment room with medical equipment visible.'} ${poseDesc[pose] || '3/4 angle'}. Clean clinical luxury setting, professional medical staff nearby. Relaxed calm expression.`,
    lifestyle: `Lifestyle portrait. ${profile.appearance}, ${profile.wardrobe}. ${poseDesc[pose] || '3/4 angle'}. Natural light, elegant environment, confident relaxed pose. Post-treatment glow, healthy radiant skin.`,
    closeup: `Extreme close-up beauty shot. ${profile.appearance}. ${treatment ? `Showing results of ${treatment}.` : 'Showing flawless glowing skin texture.'} Macro detail of luminous skin, studio lighting, shallow depth of field.`,
    'before-after': `Clinical before/after context. ${profile.appearance}. ${treatment ? `Before/after ${treatment} treatment.` : 'Comparison lighting setup.'} ${poseDesc[pose] || 'Front-facing'}. Clean clinical backdrop, neutral expression, consistent lighting for comparison.`,
  };

  let prompt = sceneDesc[sceneType] || sceneDesc.hero;
  prompt += ' Keep the facial features, skin tone, hair style, and body type exactly consistent with the reference image. Professional beauty photography, 8K quality, magazine editorial.';
  if (profile.modesty) prompt += ` ${profile.modesty}`;
  return prompt;
}

// ---------------------------------------------------------------------------
// Anthropic prompt enhancement
// ---------------------------------------------------------------------------

async function enhancePromptWithClaude(
  basePrompt: string,
  modelName: string,
  customInstructions: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return basePrompt;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `You are a professional photography director specializing in medical aesthetics marketing imagery. Your job is to enhance image generation prompts to produce the highest quality, most brand-consistent results.

BRAND: Aesthetic Lounge — premium medical aesthetics clinic in DHA Lahore, Pakistan.
COLORS: #B8924A gold, #FAF9F6 cream, white clinic interiors
STYLE: Clinical luxury, cinematic lighting, Canon 5D 85mm f/1.4 aesthetic
RULES:
- Never include text or branding in prompts
- Maintain exact character consistency
- Add cinematic lighting details (golden hour, softbox, rim light)
- Include camera/lens specifications
- Add texture details (skin, fabric, environment)
- Keep the core character description intact
- Add "NOT glossy, NOT airbrushed, realistic skin texture, matte natural finish" to avoid AI over-smoothing

Return ONLY the enhanced prompt text, no explanations.`,
        messages: [{
          role: 'user',
          content: `Enhance this image generation prompt for ${modelName}:\n\nBASE PROMPT: ${basePrompt}\n\n${customInstructions ? `USER INSTRUCTIONS: ${customInstructions}\n\n` : ''}Make it more specific, cinematic, and brand-consistent. Return only the enhanced prompt.`,
        }],
      }),
    });

    if (!res.ok) return basePrompt;
    const data = await res.json();
    return data.content?.[0]?.text || basePrompt;
  } catch {
    return basePrompt;
  }
}

// ---------------------------------------------------------------------------
// POST /api/dashboard/marketing/models/generate
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    return NextResponse.json(
      { error: 'FAL_KEY environment variable is not set' },
      { status: 500 },
    );
  }

  const body = await req.json();
  const { model, sceneType, treatment, pose, customInstructions, enhanceWithAI } = body;

  if (!model) {
    return NextResponse.json(
      { error: 'model is required' },
      { status: 400 },
    );
  }

  // Allow both known models from MODELS array and dynamic models (from Drive folders)
  const modelInfo = MODELS.find(
    (m) => m.name.toLowerCase() === model.toLowerCase(),
  );

  try {
    // Get reference images from Drive
    let referenceImageUrls: string[] = [];
    if (isGoogleDriveConfigured()) {
      const files = await listFiles(DRIVE_FOLDERS.models);
      const folder = files.find(
        (f) =>
          f.mimeType === 'application/vnd.google-apps.folder' &&
          f.name?.toLowerCase() === model.toLowerCase(),
      );

      if (folder?.id) {
        const images = await listFiles(folder.id, 10);
        const imageFiles = images.filter((f) =>
          f.mimeType?.startsWith('image/'),
        );

        // Prefer hero images as reference, take up to 3
        const heroImages = imageFiles.filter((f) =>
          f.name?.toLowerCase().includes('hero'),
        );
        const selected = heroImages.length > 0 ? heroImages : imageFiles;
        referenceImageUrls = selected.slice(0, 3).map((f) =>
          `https://drive.google.com/uc?id=${f.id}&export=view`,
        );
      }
    }

    // Build the base prompt
    let prompt: string;
    if (modelInfo) {
      prompt = buildBasePrompt(
        modelInfo.name,
        sceneType || 'hero',
        treatment || '',
        pose || '3-quarter',
      );
    } else {
      // Dynamic model — use custom instructions as the main prompt
      prompt = customInstructions
        ? `${customInstructions}. Professional beauty photography, 8K quality, luxury medical aesthetics clinic with cream and gold decor. Shot on Canon 5D 85mm f/1.4.`
        : `Professional portrait photography in a luxury medical aesthetics clinic. ${pose || '3/4 angle'} angle. Clinical-luxury setting with cream and gold decor. 8K quality.`;
    }

    // Enhance with Claude if requested
    let enhancedPrompt: string | undefined;
    if (enhanceWithAI || customInstructions) {
      const enhanced = await enhancePromptWithClaude(
        prompt,
        model,
        customInstructions || '',
      );
      if (enhanced !== prompt) {
        enhancedPrompt = enhanced;
        prompt = enhanced;
      }
    }

    // Decide whether to use /edit (with reference) or base generation
    let falData;
    if (referenceImageUrls.length > 0) {
      // Use Nano Banana Pro /edit with reference images
      const falResponse = await fetch(
        'https://fal.run/fal-ai/nano-banana/edit',
        {
          method: 'POST',
          headers: {
            Authorization: `Key ${falKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            image_urls: referenceImageUrls,
            image_size: { width: 1080, height: 1350 },
            num_images: 2,
            num_inference_steps: 8,
            guidance_scale: 4.0,
          }),
        },
      );

      if (!falResponse.ok) {
        const errText = await falResponse.text();
        console.error('[models/generate] fal.ai /edit error:', falResponse.status, errText);
        return NextResponse.json(
          { error: `fal.ai error: ${falResponse.status}` },
          { status: 502 },
        );
      }

      falData = await falResponse.json();
    } else {
      // No reference — use base generation
      const falResponse = await fetch(
        'https://fal.run/fal-ai/nano-banana-pro',
        {
          method: 'POST',
          headers: {
            Authorization: `Key ${falKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            image_size: { width: 1080, height: 1350 },
            num_images: 2,
            num_inference_steps: 8,
            guidance_scale: 4.0,
          }),
        },
      );

      if (!falResponse.ok) {
        const errText = await falResponse.text();
        console.error('[models/generate] fal.ai error:', falResponse.status, errText);
        return NextResponse.json(
          { error: `fal.ai error: ${falResponse.status}` },
          { status: 502 },
        );
      }

      falData = await falResponse.json();
    }

    // Extract image URLs from fal response
    const images: string[] = (falData.images || []).map(
      (img: { url: string }) => img.url,
    );

    return NextResponse.json({
      success: true,
      images,
      prompt,
      enhancedPrompt,
      model,
      sceneType,
      referenceCount: referenceImageUrls.length,
    });
  } catch (err) {
    console.error('[models/generate] error:', err);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  DRIVE_FOLDERS,
  listFiles,
  uploadFromUrl,
  isGoogleDriveConfigured,
  createDriveFolder,
} from '@/lib/google-drive';
import { triggerPipeline } from '@/lib/n8n';

// ---------------------------------------------------------------------------
// Anthropic API — processes freeform text into a character profile
// ---------------------------------------------------------------------------

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

interface CharacterProfile {
  name: string;
  fullName: string;
  age: number;
  ethnicity: string;
  appearance: string;
  wardrobe: string;
  look: string;
  use: string;
  modesty?: string;
  heroPrompts: string[];
}

async function generateCharacterProfile(
  freeformText: string,
): Promise<CharacterProfile> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You are the character design director for Aesthetic Lounge, a premium medical aesthetics clinic in DHA Lahore, Pakistan. Your job is to create detailed AI model character profiles for marketing campaigns.

BRAND CONTEXT:
- Colors: #B8924A gold, #FAF9F6 cream, #1A1A1A text
- Aesthetic: Premium medical luxury, clinical elegance
- Platform: Instagram only
- Target: DHA Lahore affluent women 25-54 (and men for men's treatments)

EXISTING MODELS (for reference — new model must be DISTINCT):
- Ayesha Khalid (30, Lahori, fair, conservative, face treatments)
- Meher Fatima (28, Kashmiri, curvy, body contouring/spa)
- Noor Ahmed (25, Punjabi, athletic, laser/body)
- Usman Malik (35, male, Hair PRP)

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown:
{
  "name": "FirstName",
  "fullName": "FirstName LastName",
  "age": number,
  "ethnicity": "e.g. Pakistani Sindhi (warm olive complexion)",
  "appearance": "Detailed physical description for image generation — face shape, skin tone, eye color, hair, body type, distinguishing features. Be specific enough for AI consistency.",
  "wardrobe": "Default wardrobe description matching brand aesthetic",
  "look": "2-3 word aesthetic summary (e.g. 'Sultry, voluptuous')",
  "use": "What campaigns/ad types this model is best for",
  "modesty": "Optional modesty guidelines if applicable, or null",
  "heroPrompts": [
    "Full fal.ai prompt for hero portrait 1 — 3/4 angle, luxury clinic setting...",
    "Full fal.ai prompt for hero portrait 2 — front-facing, treatment context...",
    "Full fal.ai prompt for hero portrait 3 — lifestyle, post-treatment glow...",
    "Full fal.ai prompt for hero portrait 4 — close-up beauty shot..."
  ]
}

PROMPT RULES for heroPrompts:
- Each prompt must be self-contained with full appearance description
- Include: "Ultra high quality, photorealistic, 4K, cinematic lighting. No text. White and gold luxury medical aesthetics clinic."
- Never include text/branding in image prompts
- Describe the exact same person in each prompt (consistency)
- 4 hero prompts minimum: 3/4 angle, front-facing, lifestyle, close-up
- Image style: "Professional beauty photography, shot on Canon 5D 85mm f/1.4"`,
      messages: [
        {
          role: 'user',
          content: `Create a new AI model character based on this description:\n\n${freeformText}\n\nRespond with ONLY the JSON object.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse character profile from AI response');
  }

  return JSON.parse(jsonMatch[0]) as CharacterProfile;
}

// ---------------------------------------------------------------------------
// Generate reference photos via fal.ai
// ---------------------------------------------------------------------------

async function generatePhotos(
  prompts: string[],
  falKey: string,
): Promise<string[]> {
  const imageUrls: string[] = [];

  for (const prompt of prompts) {
    try {
      const res = await fetch('https://fal.run/fal-ai/nano-banana-pro', {
        method: 'POST',
        headers: {
          Authorization: `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image_size: { width: 1080, height: 1350 },
          num_images: 1,
          num_inference_steps: 8,
          guidance_scale: 4.0,
        }),
      });

      if (!res.ok) {
        console.error(`[create-model] fal.ai error for prompt: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const url = data.images?.[0]?.url;
      if (url) imageUrls.push(url);
    } catch (err) {
      console.error('[create-model] fal.ai generation error:', err);
    }
  }

  return imageUrls;
}

// ---------------------------------------------------------------------------
// POST /api/dashboard/marketing/models/create
// ---------------------------------------------------------------------------
// Body: { description: "freeform text describing the model" }
// OR:   { action: "generate_photos", model: "Name", prompts: [...] }

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  // -----------------------------------------------------------------------
  // Action: Generate new photos for existing model via n8n pipeline
  // -----------------------------------------------------------------------
  if (action === 'generate_photos_n8n') {
    const { model, sceneType, treatment, count } = body;
    if (!model) {
      return NextResponse.json({ error: 'model required' }, { status: 400 });
    }

    try {
      const result = await triggerPipeline({
        action: 'generate_model_photos',
        model,
        sceneType: sceneType || 'hero',
        treatment: treatment || '',
        count: count || 4,
      });
      return NextResponse.json({
        success: true,
        message: `Triggered n8n to generate ${count || 4} photos for ${model}`,
        pipeline: result,
      });
    } catch (err) {
      console.error('[create-model] n8n trigger error:', err);
      return NextResponse.json(
        { error: 'Failed to trigger pipeline' },
        { status: 502 },
      );
    }
  }

  // -----------------------------------------------------------------------
  // Action: Create brand new model from freeform text
  // -----------------------------------------------------------------------
  const { description } = body;
  if (!description) {
    return NextResponse.json(
      { error: 'description is required' },
      { status: 400 },
    );
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured' },
      { status: 500 },
    );
  }

  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    return NextResponse.json(
      { error: 'FAL_KEY is not configured' },
      { status: 500 },
    );
  }

  if (!isGoogleDriveConfigured()) {
    return NextResponse.json(
      { error: 'Google Drive is not configured' },
      { status: 500 },
    );
  }

  try {
    // Step 1: Use Anthropic to create character profile from freeform text
    const profile = await generateCharacterProfile(description);

    // Step 2: Create Drive folder for new model
    const modelFolderName = profile.name.toLowerCase();
    const existingFolders = await listFiles(DRIVE_FOLDERS.models);
    let folderId: string | undefined;

    const existing = existingFolders.find(
      (f) =>
        f.mimeType === 'application/vnd.google-apps.folder' &&
        f.name?.toLowerCase() === modelFolderName,
    );

    if (existing?.id) {
      folderId = existing.id;
    } else {
      const newFolder = await createDriveFolder(
        modelFolderName,
        DRIVE_FOLDERS.models,
      );
      folderId = newFolder.id!;
    }

    // Step 3: Generate hero reference photos via fal.ai
    const imageUrls = await generatePhotos(profile.heroPrompts, falKey);

    // Step 4: Upload generated photos to Drive
    const uploaded: Array<{ name: string; id: string }> = [];
    const photoTypes = ['hero-3quarter', 'hero-front', 'hero-lifestyle', 'hero-closeup'];
    for (let i = 0; i < imageUrls.length; i++) {
      const fileName = `${photoTypes[i] || `hero-${i + 1}`}.png`;
      try {
        const result = await uploadFromUrl(imageUrls[i], fileName, folderId!);
        uploaded.push({ name: fileName, id: result.id });
      } catch (err) {
        console.error(`[create-model] Drive upload error for ${fileName}:`, err);
      }
    }

    // Step 5: Update designer agent memory in Neon with new character
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        // Build character bible entry
        const characterEntry = {
          name: profile.name,
          fullName: profile.fullName,
          age: profile.age,
          ethnicity: profile.ethnicity,
          appearance: profile.appearance,
          wardrobe: profile.wardrobe,
          look: profile.look,
          use: profile.use,
          modesty: profile.modesty || null,
          portraits: uploaded.map((u) => u.name),
          driveFolderId: folderId,
          createdAt: new Date().toISOString(),
        };

        // Append to designer's instructions with new character section
        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

        // Read current instructions
        const current = await pool.query(
          "SELECT instructions FROM al_agent_memory WHERE agent = 'designer'",
        );
        const currentInstructions = current.rows[0]?.instructions || '';

        // Build new character section
        const charSection = `\n\n### ${profile.fullName} (${profile.age}, ${profile.ethnicity.split('(')[0].trim()})
- ${uploaded.length} portraits: ${uploaded.map((u) => u.name.replace('.png', '')).join(', ')}
- Wardrobe: ${profile.wardrobe}
- Use for: ${profile.use}${profile.modesty ? `\n- Modesty: ${profile.modesty}` : ''}`;

        // Insert after the last character section (before MODEL SELECTION RULES)
        const updatedInstructions = currentInstructions.includes('## MODEL SELECTION RULES')
          ? currentInstructions.replace(
              '## MODEL SELECTION RULES',
              `${charSection}\n\n## MODEL SELECTION RULES`,
            )
          : currentInstructions + charSection;

        await pool.query(
          "UPDATE al_agent_memory SET instructions = $1 WHERE agent = 'designer'",
          [updatedInstructions],
        );

        // Also log to al_decision_log
        await pool.query(
          `INSERT INTO al_decision_log (agent, action, decision, result, created_at)
           VALUES ('designer', 'create_model', $1, $2, NOW())`,
          [
            `Created new model: ${profile.fullName}`,
            JSON.stringify(characterEntry),
          ],
        );

        await pool.end();
      } catch (dbErr) {
        console.error('[create-model] DB update error:', dbErr);
        // Non-fatal — model photos are already in Drive
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      driveFolder: folderId,
      photosGenerated: imageUrls.length,
      photosUploaded: uploaded.length,
      uploaded,
    });
  } catch (err) {
    console.error('[create-model] error:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to create model',
      },
      { status: 500 },
    );
  }
}

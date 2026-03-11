/**
 * Brand Context — Single source of truth for AL character bible, brand data,
 * treatment matching, and prompt-building helpers.
 *
 * Consolidates: CHARACTER-BIBLE.md, brand-context.md, MODEL_PROMPTS from
 * models/generate/route.ts, and n8n ChatAgent/Designer rules.
 */

// ---------------------------------------------------------------------------
// Character Bible
// ---------------------------------------------------------------------------

export interface CharacterProfile {
  fullName: string;
  age: number;
  ethnicity: string;
  appearance: string;
  wardrobe: string;
  modesty?: string;
  use: string;
  portraits: string[];
}

export const CHARACTER_BIBLE: Record<string, CharacterProfile> = {
  ayesha: {
    fullName: 'Ayesha Khalid',
    age: 30,
    ethnicity: 'Pakistani (Lahori, fair wheat-to-light complexion)',
    appearance:
      'Pakistani woman, 30 years old, fair wheat-to-light complexion, oval face, high cheekbones, warm brown eyes, full lips, long dark brown hair, slim graceful build with defined collarbones, luminous dewy skin',
    wardrobe: 'wearing elegant white/cream/gold tones matching luxury clinic brand',
    modesty: 'Face, neck, hands, and collarbones visible. No exposed legs or cleavage.',
    use: 'Ramadan/Eid campaigns, treatment face ads, conservative audience',
    portraits: [
      'hero-3quarter', 'hero-profile-jawline', 'hero-warm-smile',
      'treatment-laser', 'treatment-hydrafacial', 'treatment-consultation',
      'treatment-laser-closeup', 'treatment-laser-wide',
      'lifestyle-mirror-glow', 'lifestyle-eid-ready', 'lifestyle-outdoor-confidence',
      'closeup-skin-macro', 'closeup-before-pose', 'closeup-eye-detail',
    ],
  },
  meher: {
    fullName: 'Meher Awan',
    age: 28,
    ethnicity: 'Pakistani Kashmiri (fair porcelain skin)',
    appearance:
      'Pakistani Kashmiri woman, 28 years old, fair porcelain skin, captivating hazel-green eyes, full pouty lips with berry lip tint, long wavy dark brown hair with golden highlights, curvy hourglass build with full bust and cinched waist, dewy glowing skin',
    wardrobe: 'wearing burgundy/cream/gold luxury fabrics, wrap dress or satin',
    use: 'Body contouring ads, curves-focused hooks, spa treatment ads',
    portraits: [
      'hero', 'body-standing', 'body-spa-reclining', 'body-side-profile',
      'treatment-body-contouring', 'treatment-hydrafacial',
      'treatment-exosome-before', 'treatment-exosome-after',
    ],
  },
  noor: {
    fullName: 'Noor Malik',
    age: 25,
    ethnicity: 'Pakistani Punjabi (warm caramel brown skin)',
    appearance:
      'Pakistani Punjabi woman, 25 years old, warm caramel brown skin, almond-shaped dark brown eyes with winged eyeliner, defined cheekbones, strong jawline, jet-black hair in sleek high ponytail, tall 5\'10" athletic toned build with long legs and defined arms, smooth glowing skin',
    wardrobe: 'wearing white/cream fitted athletic-luxe pieces',
    use: 'Athletic body hooks, laser legs ads, arms/underarm laser, high-fashion body ads',
    portraits: [
      'hero', 'body-standing', 'body-arms-shoulders', 'body-back-walking',
      'treatment-body-laser', 'treatment-hair-prp',
    ],
  },
  usman: {
    fullName: 'Usman',
    age: 35,
    ethnicity: 'Pakistani (warm medium-brown skin)',
    appearance:
      'Pakistani man, 32-38 years old, warm medium-brown skin, short neat dark hair with mild thinning at crown, well-groomed beard, sharp defined features, calm confident expression',
    wardrobe: 'wearing crisp collared shirt, professional groomed look',
    use: "Men's Hair PRP ads, men's scalp treatment ads",
    portraits: ['treatment-hair-prp'],
  },
};

// ---------------------------------------------------------------------------
// MODEL_PROMPTS — used by models/generate route (extracted for sharing)
// ---------------------------------------------------------------------------

export const MODEL_PROMPTS: Record<
  string,
  { appearance: string; wardrobe: string; modesty?: string }
> = Object.fromEntries(
  Object.entries(CHARACTER_BIBLE).map(([key, c]) => [
    key.charAt(0).toUpperCase() + key.slice(1), // 'Ayesha', 'Meher', etc.
    { appearance: c.appearance, wardrobe: c.wardrobe, modesty: c.modesty },
  ]),
);

// ---------------------------------------------------------------------------
// Brand Context
// ---------------------------------------------------------------------------

export const BRAND_CONTEXT = {
  clinic: 'Aesthetic Lounge, DHA Phase 7, Lahore',
  director: 'Dr. Huma Abbas',
  colors: { gold: '#B8924A', cream: '#FAF9F6', dark: '#1A1A1A' },
  fonts: { heading: 'Playfair Display', accent: 'Cormorant Garamond', body: 'Inter' },
  style: 'Clinical-luxury, white & gold, aspirational',
  whatsapp: '+92 327 6620000',
  instagram: '@aestheticloungeofficial',
  website: 'aestheticloungeofficial.com',
  disclaimer: 'Individual results may vary. Consult with our medical professionals. Dr. Huma Abbas, Medical Director.',
  targetMarket: 'DHA Lahore (Phases 4-8 + Askari X), Women 22-50, affluent, luxury brand affinity',
};

// ---------------------------------------------------------------------------
// Character-to-Treatment Matching (from n8n ChatAgent rules)
// ---------------------------------------------------------------------------

export const CHARACTER_MATCHING: Record<string, string> = {
  face: 'ayesha',       // Botox, HIFU, RF Microneedling, Chemical Peel
  body: 'meher',        // Body contouring, Lipo Lab, spa treatments
  laser: 'noor',        // Laser hair removal, legs, arms, underarm
  hair: 'usman',        // Men's PRP, scalp treatments
  eid_ramadan: 'ayesha', // Conservative seasonal campaigns
  athletic: 'noor',     // Athletic/fitness hooks
  spa: 'meher',         // Spa/wellness campaigns
};

// ---------------------------------------------------------------------------
// Top-Performing Treatments (from brand-context.md ad data)
// ---------------------------------------------------------------------------

export const TOP_TREATMENTS = [
  { name: 'Botox', cpl: 1.54, note: 'strongest demand, known treatment' },
  { name: 'HIFU', cpl: 1.70, note: 'best CTR 2.15%, strong anti-aging' },
  { name: 'Exosome/PRP', cpl: 1.80, note: 'highest volume 37 leads, curiosity-driven' },
  { name: 'RF Microneedling', cpl: 1.97, note: 'solid performer' },
];

// ---------------------------------------------------------------------------
// Pakistan Seasonal Calendar
// ---------------------------------------------------------------------------

export const SEASONAL_CALENDAR: Record<string, { months: number[]; themes: string[] }> = {
  ramadan: { months: [2, 3], themes: ['pre-Ramadan glow prep', 'Eid glow packages', 'conservative imagery'] },
  eid_ul_fitr: { months: [3, 4], themes: ['Eid glow', 'celebration skin', 'gold/white elegance'] },
  wedding_season: { months: [11, 12, 1, 2], themes: ['bridal skin prep', 'dulhan glow', 'baraat ready'] },
  summer: { months: [5, 6, 7, 8], themes: ['laser hair removal', 'body contouring', 'sun damage repair'] },
  winter: { months: [11, 12, 1], themes: ['deep peels', 'RF microneedling', 'hydration treatments'] },
  independence_day: { months: [8], themes: ['green & white campaign', 'national pride + beauty'] },
  back_to_school: { months: [8, 9], themes: ['teen skincare', 'student packages'] },
};

// ---------------------------------------------------------------------------
// Content Diversity Categories (from n8n Researcher/Orchestrator)
// ---------------------------------------------------------------------------

export const CONTENT_CATEGORIES = [
  'Treatment spotlight (single treatment deep-dive)',
  'Before/after transformation story',
  'Myth-busting (common misconceptions)',
  'Doctor/expert insight (Dr. Huma Abbas)',
  'Patient journey / testimonial style',
  'Seasonal/event tie-in (Eid, wedding, summer)',
  'Educational carousel (how it works)',
  'Quick tips / skincare routine',
  'Behind-the-scenes / clinic tour',
  'Trending hook / viral format adaptation',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a rich character description string for injection into prompts. */
export function characterDescription(name: string): string {
  const c = CHARACTER_BIBLE[name.toLowerCase()];
  if (!c) return '';
  return [
    `${c.fullName}: ${c.ethnicity}, ${c.age} years old.`,
    `Appearance: ${c.appearance}.`,
    `Wardrobe: ${c.wardrobe}.`,
    c.modesty ? `Modesty rules: ${c.modesty}` : '',
    `Best for: ${c.use}.`,
  ].filter(Boolean).join('\n');
}

/** Build a full character bible block for system prompts. */
export function characterBibleBlock(): string {
  return Object.keys(CHARACTER_BIBLE)
    .map((name) => characterDescription(name))
    .join('\n\n');
}

/** Build a full brand context block for system prompts. */
export function brandContextBlock(): string {
  return `== BRAND CONTEXT ==
Clinic: ${BRAND_CONTEXT.clinic}
Medical Director: ${BRAND_CONTEXT.director}
Style: ${BRAND_CONTEXT.style}
Colors: Gold ${BRAND_CONTEXT.colors.gold}, Cream ${BRAND_CONTEXT.colors.cream}, Dark ${BRAND_CONTEXT.colors.dark}
Fonts: ${BRAND_CONTEXT.fonts.heading} (headings), ${BRAND_CONTEXT.fonts.accent} (accent), ${BRAND_CONTEXT.fonts.body} (body)
Instagram: ${BRAND_CONTEXT.instagram}
Website: ${BRAND_CONTEXT.website}
WhatsApp: ${BRAND_CONTEXT.whatsapp}
Target: ${BRAND_CONTEXT.targetMarket}
Disclaimer: ${BRAND_CONTEXT.disclaimer}`;
}

/** Build top-treatment baselines for analyst prompts. */
export function treatmentBaselinesBlock(): string {
  const lines = TOP_TREATMENTS.map(
    (t) => `- ${t.name}: CPL PKR ${t.cpl} (${t.note})`,
  );
  return `== TOP TREATMENT BASELINES (PKR) ==\n${lines.join('\n')}\nAvoid standalone: Hair PRP (high CPL), Facial (saturated market)`;
}

/** Build the image prompt craft rules block for designer/StoryDirector. */
export function imagePromptCraftBlock(): string {
  return `== IMAGE PROMPT CRAFT (fal.ai Nano Banana Pro) ==
- ALWAYS: sharp focus, 8K, photorealistic, f/2.8, deep depth of field
- NEVER: shallow depth of field, bokeh, soft focus, dreamy, blurry background
- Full prompt structure: [Character full description] [Outfit] [Action/pose] [Setting with Pakistani/Lahore context] [Technical: sharp focus, 8K, f/2.8, deep depth of field, photorealistic]
- No text, logos, or watermarks in images
- "NOT glossy, NOT airbrushed, realistic skin texture, matte natural finish"`;
}

/** Build the motion prompt craft rules for StoryDirector reel scenes. */
export function motionPromptCraftBlock(): string {
  return `== MOTION PROMPT CRAFT (Kling v3 Pro, 5-7s clips) ==
- One camera move + one micro-motion + one atmospheric detail per scene
- Subtle movements only — big movements cause artifacts
- Camera moves: slow push-in, gentle pan, dolly left/right, static with subject motion
- Micro-motions: hair sway, fabric flutter, hand gesture, head turn
- Atmosphere: light shifts, steam/mist, bokeh drift, shadow play
- NEVER: fast zooms, whip pans, full body turns, walking toward/away camera`;
}

/** Build the StoryDirector system prompt for reel creative direction. */
export function storyDirectorSystemPrompt(): string {
  return `You are the StoryDirector — a cinematic creative director for Aesthetic Lounge Instagram reels.
You transform copywriter scene descriptions into production-ready cinematic prompts.

${brandContextBlock()}

== CHARACTER BIBLE ==
${characterBibleBlock()}

${imagePromptCraftBlock()}

${motionPromptCraftBlock()}

== STORY ARC ==
HOOK (tension/question) → DEEPEN (pain point) → PIVOT (treatment solution) → PAYOFF (result/transformation) → CLOSE (brand + CTA)

== VISUAL VARIETY ==
- Each scene: different setting, different framing, different lighting
- Pakistani/Lahore settings ONLY — DHA Phase 7 streets, modern clinic interior, luxury homes, garden terraces, upscale cafes
- Rotate backgrounds: clinic treatment room, DHA boulevard, luxury home vanity, garden with fairy lights, modern cafe
- Never repeat the same setting in consecutive scenes

== MUSIC STYLE ==
Match mood: piano (emotional), acoustic guitar (warm), lo-fi beats (modern/young), orchestral (dramatic reveal), ambient (calm/spa), jazz (sophisticated/evening)

== OUTPUT FORMAT ==
For each scene, output:
{
  "scenes": [
    {
      "scene_number": 1,
      "arc_beat": "hook|deepen|pivot|payoff|close",
      "image_prompt": "Full fal.ai prompt with character, outfit, setting, action, technical specs",
      "motion_prompt": "Kling v3 Pro motion description — one camera move + one micro-motion + one atmosphere detail",
      "voiceover": "30-60 words, educational, conversational tone",
      "duration_seconds": 7,
      "setting": "description of location",
      "framing": "close-up|medium|wide|3-quarter"
    }
  ],
  "music_style": "piano|acoustic|lo-fi|orchestral|ambient|jazz",
  "music_mood": "description of overall mood",
  "total_duration_seconds": 30
}

RULES:
- 4-6 scenes per reel, 25-45 seconds total
- 7s MINIMUM for dialogue scenes (never 5s)
- Same character, same outfit across ALL scenes (consistency)
- Full character description in EVERY image_prompt (AI has no memory between scenes)
- End with brand close: logo shot or character with confident expression
- Voiceover: educational, end last scene with CTA "Book your free consultation at Aesthetic Lounge"`;
}

export interface Treatment {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  shortDesc: string;
  description: string;
  duration: string;
  priceDisplay: string;
  bestFor: string;
  tags: string[];
  doctor?: string;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  icon: string;
  treatments: Treatment[];
}

export const categories: Category[] = [
  // ─── 1. Dermal Fillers ───────────────────────────────────────────────
  {
    slug: "dermal-fillers",
    name: "Dermal Fillers",
    description:
      "Restore volume, sculpt contours, and enhance your natural features with premium hyaluronic acid fillers administered by experienced physicians.",
    icon: "💉",
    treatments: [
      {
        slug: "lip-fillers",
        name: "Lip Fillers",
        category: "Dermal Fillers",
        categorySlug: "dermal-fillers",
        shortDesc:
          "Enhance lip volume and shape with natural-looking hyaluronic acid fillers.",
        description:
          "Our lip filler treatment uses premium hyaluronic acid to add volume, define the cupid's bow, and correct asymmetry for a naturally fuller pout. Results are immediate with minimal downtime, lasting 6–12 months depending on your metabolism and the product used.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 25,000",
        bestFor:
          "Thin or asymmetric lips, lost volume due to aging, desire for a defined lip border.",
        tags: ["lips", "volume", "HA filler"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "cheek-fillers",
        name: "Cheek Fillers",
        category: "Dermal Fillers",
        categorySlug: "dermal-fillers",
        shortDesc:
          "Lift and define cheekbones for a youthful, sculpted facial profile.",
        description:
          "Cheek fillers restore midface volume that naturally depletes with age, creating lifted contours and a more youthful appearance. Using cannula techniques for safety, this treatment provides an instant non-surgical facelift effect that lasts 12–18 months.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 30,000",
        bestFor:
          "Flat or sunken cheeks, midface volume loss, desire for a contoured facial structure.",
        tags: ["cheeks", "contour", "volume"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "jawline-contouring",
        name: "Jawline Contouring",
        category: "Dermal Fillers",
        categorySlug: "dermal-fillers",
        shortDesc:
          "Define and sharpen the jawline with strategically placed dermal fillers.",
        description:
          "Jawline contouring with fillers creates a sharper, more defined jaw angle without surgery. Ideal for both men and women seeking a sculpted lower face, this treatment uses firm-consistency HA fillers placed along the mandible for structural support. Results last up to 18 months.",
        duration: "45–60 min",
        priceDisplay: "Starting from Rs 35,000",
        bestFor:
          "Weak or undefined jawline, jowling, desire for a sharper lower-face profile.",
        tags: ["jawline", "contour", "sculpt"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "under-eye-fillers",
        name: "Under Eye Fillers",
        category: "Dermal Fillers",
        categorySlug: "dermal-fillers",
        shortDesc:
          "Reduce dark circles and hollows beneath the eyes for a refreshed look.",
        description:
          "Tear trough filler treatment addresses under-eye hollowness, dark circles, and tired-looking eyes. Using a soft, hydrophilic filler placed with a cannula for precision, this delicate procedure requires an experienced hand. Results are subtle yet transformative, lasting 9–12 months.",
        duration: "30 min",
        priceDisplay: "Starting from Rs 28,000",
        bestFor:
          "Under-eye hollows, dark circles from volume loss, tired-looking eyes.",
        tags: ["under eye", "tear trough", "dark circles"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "nasolabial-folds",
        name: "Nasolabial Folds",
        category: "Dermal Fillers",
        categorySlug: "dermal-fillers",
        shortDesc:
          "Soften deep smile lines running from nose to mouth with filler injections.",
        description:
          "Nasolabial fold treatment smooths the deep lines that run from the sides of the nose to the corners of the mouth. Using medium-viscosity HA fillers, we soften these creases while maintaining natural facial movement. The treatment is quick with results lasting 9–12 months.",
        duration: "20–30 min",
        priceDisplay: "Starting from Rs 22,000",
        bestFor:
          "Deep smile lines, marionette lines, aging around the mouth area.",
        tags: ["smile lines", "nasolabial", "anti-aging"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "chin-augmentation",
        name: "Chin Augmentation",
        category: "Dermal Fillers",
        categorySlug: "dermal-fillers",
        shortDesc:
          "Project and reshape the chin for a balanced facial profile without surgery.",
        description:
          "Non-surgical chin augmentation with fillers adds projection and definition to a recessed or weak chin, improving facial balance and profile harmony. This treatment is particularly effective when combined with jawline contouring for comprehensive lower-face sculpting. Results last 12–18 months.",
        duration: "30 min",
        priceDisplay: "Starting from Rs 28,000",
        bestFor:
          "Receding chin, facial imbalance, desire for improved side profile.",
        tags: ["chin", "profile", "augmentation"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "temple-fillers",
        name: "Temple Fillers",
        category: "Dermal Fillers",
        categorySlug: "dermal-fillers",
        shortDesc:
          "Restore volume to hollow temples for a fuller, more youthful facial frame.",
        description:
          "Temple hollowing is one of the earliest signs of facial aging, creating a gaunt appearance. Temple filler treatment restores this lost volume, lifting the brow area and creating a smoother transition from forehead to cheekbone. Results are subtle but significantly rejuvenating, lasting 12–18 months.",
        duration: "20–30 min",
        priceDisplay: "Starting from Rs 25,000",
        bestFor:
          "Hollow temples, gaunt appearance, overall facial rejuvenation.",
        tags: ["temples", "volume", "rejuvenation"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "hand-rejuvenation",
        name: "Hand Rejuvenation",
        category: "Dermal Fillers",
        categorySlug: "dermal-fillers",
        shortDesc:
          "Restore youthful fullness to aging hands with volume-replacing fillers.",
        description:
          "Hands often reveal age before the face does. Hand rejuvenation with fillers restores lost volume, reducing the visibility of veins and tendons for smoother, younger-looking hands. The treatment uses a specialized HA filler designed for this delicate area, with results lasting 9–12 months.",
        duration: "30 min",
        priceDisplay: "Starting from Rs 20,000",
        bestFor:
          "Bony or veiny hands, visible tendons, overall hand aging.",
        tags: ["hands", "rejuvenation", "volume"],
        doctor: "dr-huma-abbas",
      },
    ],
  },

  // ─── 2. Botox & Anti-Wrinkle ─────────────────────────────────────────
  {
    slug: "botox-anti-wrinkle",
    name: "Botox & Anti-Wrinkle",
    description:
      "Smooth away fine lines and wrinkles with precision-targeted botulinum toxin injections for a refreshed, natural-looking result.",
    icon: "✨",
    treatments: [
      {
        slug: "forehead-lines",
        name: "Forehead Lines",
        category: "Botox & Anti-Wrinkle",
        categorySlug: "botox-anti-wrinkle",
        shortDesc:
          "Smooth horizontal forehead lines with precisely dosed Botox injections.",
        description:
          "Forehead Botox targets the frontalis muscle to soften horizontal lines while preserving natural brow movement. Our micro-dosing technique ensures you can still express emotions without the etched-in lines. Results appear within 3–5 days and last 3–4 months.",
        duration: "15–20 min",
        priceDisplay: "Starting from Rs 15,000",
        bestFor:
          "Horizontal forehead creases, expressive lines, preventative anti-aging.",
        tags: ["forehead", "botox", "wrinkles"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "crows-feet",
        name: "Crow's Feet",
        category: "Botox & Anti-Wrinkle",
        categorySlug: "botox-anti-wrinkle",
        shortDesc:
          "Reduce smile lines around the eyes for a smoother, more youthful eye area.",
        description:
          "Crow's feet—the fine lines radiating from the outer corners of the eyes—are among the first signs of aging. Targeted Botox injections relax the orbicularis oculi muscle, smoothing these lines while allowing natural smiling. The treatment is quick, virtually painless, and results last 3–4 months.",
        duration: "10–15 min",
        priceDisplay: "Starting from Rs 12,000",
        bestFor:
          "Lines around the eyes when smiling, early signs of aging, eye area rejuvenation.",
        tags: ["eyes", "crows feet", "botox"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "frown-lines",
        name: "Frown Lines",
        category: "Botox & Anti-Wrinkle",
        categorySlug: "botox-anti-wrinkle",
        shortDesc:
          "Soften the vertical '11 lines' between the eyebrows with Botox.",
        description:
          "Glabellar lines, commonly called '11 lines' or frown lines, make you look stressed or angry even at rest. Botox injections into the procerus and corrugator muscles smooth these deep vertical creases. This is the most popular Botox treatment area, with results visible in 3–7 days lasting 3–4 months.",
        duration: "10–15 min",
        priceDisplay: "Starting from Rs 12,000",
        bestFor:
          "Deep vertical lines between brows, angry resting expression, glabellar creases.",
        tags: ["frown", "glabella", "11 lines", "botox"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "bunny-lines",
        name: "Bunny Lines",
        category: "Botox & Anti-Wrinkle",
        categorySlug: "botox-anti-wrinkle",
        shortDesc:
          "Smooth the fine lines that appear on the nose bridge when scrunching.",
        description:
          "Bunny lines are the diagonal wrinkles that form on the sides of the nose when you scrunch or laugh. A few precise units of Botox into the nasalis muscle smooth these lines without affecting your smile. This quick treatment is often combined with frown line and forehead Botox for a comprehensive upper-face refresh.",
        duration: "5–10 min",
        priceDisplay: "Starting from Rs 8,000",
        bestFor:
          "Nose wrinkles when smiling, complement to other facial Botox areas.",
        tags: ["nose", "bunny lines", "botox"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "lip-flip",
        name: "Lip Flip",
        category: "Botox & Anti-Wrinkle",
        categorySlug: "botox-anti-wrinkle",
        shortDesc:
          "Subtly enhance the upper lip by relaxing the muscle above the lip line.",
        description:
          "A Botox lip flip is a subtle alternative to lip fillers that relaxes the orbicularis oris muscle, allowing the upper lip to gently roll outward for a fuller appearance. Ideal for patients who want a slight enhancement without adding volume. Results take 5–7 days to appear and last 2–3 months.",
        duration: "5–10 min",
        priceDisplay: "Starting from Rs 8,000",
        bestFor:
          "Thin upper lip, gummy smile, subtle lip enhancement without filler.",
        tags: ["lip flip", "botox", "lips"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "neck-bands",
        name: "Neck Bands",
        category: "Botox & Anti-Wrinkle",
        categorySlug: "botox-anti-wrinkle",
        shortDesc:
          "Soften prominent platysma bands in the neck for a smoother neckline.",
        description:
          "The Nefertiti Neck Lift uses Botox to relax the platysmal bands—the vertical cords that become more visible with age. By treating these bands, the jawline appears sharper and the neck smoother. This non-surgical approach to neck rejuvenation requires 20–40 units and results last 3–4 months.",
        duration: "15–20 min",
        priceDisplay: "Starting from Rs 18,000",
        bestFor:
          "Visible neck bands, turkey neck, jawline definition improvement.",
        tags: ["neck", "platysma", "nefertiti lift", "botox"],
        doctor: "dr-huma-abbas",
      },
    ],
  },

  // ─── 3. Laser Treatments ─────────────────────────────────────────────
  {
    slug: "laser-treatments",
    name: "Laser Treatments",
    description:
      "Advanced diode and Nd:YAG laser technology for safe, effective, and long-lasting hair removal across all skin types, including South Asian skin tones.",
    icon: "🔬",
    treatments: [
      {
        slug: "full-body-laser",
        name: "Full Body Laser",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Complete head-to-toe laser hair removal in a single comprehensive session.",
        description:
          "Our full body laser package covers all major areas including arms, legs, underarms, bikini, stomach, back, and face. Using dual-wavelength diode technology safe for all South Asian skin tones, each session progressively reduces hair growth. A course of 6–8 sessions is recommended for optimal, long-lasting results.",
        duration: "2–3 hours",
        priceDisplay: "Starting from Rs 25,000",
        bestFor:
          "Complete hair removal, multiple area treatment, long-term hair reduction.",
        tags: ["full body", "laser hair removal", "all areas"],
      },
      {
        slug: "bikini-laser",
        name: "Bikini Laser",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Precise laser hair removal for the bikini line and surrounding area.",
        description:
          "Bikini laser hair removal targets unwanted hair along the bikini line and inner thighs for a clean, smooth finish. Our advanced cooling system ensures comfort throughout the treatment. Best results are seen after 6–8 sessions spaced 4–6 weeks apart.",
        duration: "20–30 min",
        priceDisplay: "Starting from Rs 8,000",
        bestFor:
          "Bikini line hair, ingrown hairs, razor bump prevention.",
        tags: ["bikini", "laser", "hair removal"],
      },
      {
        slug: "underarm-laser",
        name: "Underarm Laser",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Quick and effective laser hair removal for silky-smooth underarms.",
        description:
          "Underarm laser is one of our most popular treatments, offering a permanent solution to shaving and waxing. The compact treatment area means sessions are quick, and most clients see significant reduction after just 4–6 sessions. Our laser technology also helps reduce underarm darkening over time.",
        duration: "10–15 min",
        priceDisplay: "Starting from Rs 5,000",
        bestFor:
          "Underarm hair, dark underarms, freedom from daily shaving.",
        tags: ["underarm", "laser", "hair removal"],
      },
      {
        slug: "legs-laser",
        name: "Legs Laser",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Full or half-leg laser hair removal for permanently smooth legs.",
        description:
          "Leg laser hair removal provides a long-term solution to constant shaving and painful waxing. Available as full leg or half leg options, the treatment uses rapid-pulse technology for speed and comfort. Most clients achieve 80–90% permanent reduction after completing a full course of 6–8 sessions.",
        duration: "45–60 min",
        priceDisplay: "Starting from Rs 12,000",
        bestFor:
          "Leg hair removal, ingrown hairs, smooth legs without waxing.",
        tags: ["legs", "laser", "hair removal"],
      },
      {
        slug: "face-laser",
        name: "Face Laser",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Gentle facial laser hair removal for upper lip, chin, and sideburns.",
        description:
          "Facial laser hair removal targets fine and coarse hair on the upper lip, chin, jawline, and sideburns. Using settings calibrated for the delicate facial skin, this treatment eliminates the need for threading or waxing. Results are cumulative across 6–8 sessions with minimal redness post-treatment.",
        duration: "15–20 min",
        priceDisplay: "Starting from Rs 5,000",
        bestFor:
          "Facial hair, upper lip hair, chin hair, PCOS-related facial hair.",
        tags: ["face", "laser", "hair removal", "PCOS"],
      },
      {
        slug: "arms-laser",
        name: "Arms Laser",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Full or half-arm laser hair removal for smooth, hair-free arms.",
        description:
          "Arm laser hair removal covers the full arm from shoulder to wrist, or can be split into upper and lower arm sessions. The treatment is particularly effective on the thicker, darker hair common in South Asian skin types. A course of 6–8 sessions delivers long-lasting, smooth results.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 8,000",
        bestFor:
          "Arm hair removal, dark arm hair, alternative to bleaching.",
        tags: ["arms", "laser", "hair removal"],
      },
      {
        slug: "back-laser",
        name: "Back Laser",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Comprehensive laser hair removal covering the upper and lower back.",
        description:
          "Back laser hair removal addresses unwanted hair across the entire back and shoulder area. Using wide-coverage handpieces for efficiency, the treatment is popular among men and women alike. The back responds well to laser treatment, with most clients seeing excellent results after 6–8 sessions.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 10,000",
        bestFor:
          "Back hair removal, shoulder hair, comprehensive body grooming.",
        tags: ["back", "laser", "hair removal"],
      },
      {
        slug: "brazilian-laser",
        name: "Brazilian Laser",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Complete Brazilian laser hair removal for total smoothness and confidence.",
        description:
          "Brazilian laser provides complete hair removal for the entire bikini area, front to back. Performed in a private, comfortable setting by experienced female technicians, this treatment is one of our most requested services. Advanced cooling technology minimizes discomfort, and 6–8 sessions deliver long-lasting results.",
        duration: "30–40 min",
        priceDisplay: "Starting from Rs 12,000",
        bestFor:
          "Complete bikini area hair removal, ingrown hair prevention, hygiene.",
        tags: ["brazilian", "laser", "bikini", "hair removal"],
      },
      {
        slug: "upper-lip-laser",
        name: "Upper Lip Laser",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Quick, precise laser treatment for upper lip hair removal.",
        description:
          "Upper lip laser is a fast, targeted treatment that eliminates the need for frequent threading or waxing. The small treatment area means sessions are completed in minutes with minimal discomfort. Ideal as a standalone treatment or combined with full face laser for comprehensive results.",
        duration: "5–10 min",
        priceDisplay: "Starting from Rs 3,000",
        bestFor:
          "Upper lip hair, alternative to threading, quick lunchtime treatment.",
        tags: ["upper lip", "laser", "hair removal"],
      },
      {
        slug: "beard-shaping",
        name: "Beard Shaping",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Laser-defined beard lines and neck cleanup for a permanently groomed look.",
        description:
          "Beard shaping with laser creates precise, permanent beard lines along the cheeks, neck, and jawline. This eliminates daily razor maintenance of your beard outline and prevents neck irritation from shaving. The treatment preserves desired facial hair while permanently removing hair outside your ideal beard shape.",
        duration: "20–30 min",
        priceDisplay: "Starting from Rs 6,000",
        bestFor:
          "Beard outline definition, neck hair cleanup, men's grooming.",
        tags: ["beard", "shaping", "laser", "men"],
      },
      {
        slug: "chest-laser",
        name: "Chest Laser",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Smooth, hair-free chest with targeted laser hair removal treatment.",
        description:
          "Chest laser hair removal provides a groomed, smooth chest without the hassle of shaving or waxing. The treatment covers the entire chest and can extend to the abdomen area. Multiple sessions progressively thin and eliminate chest hair, with most clients achieving their desired result in 6–8 sessions.",
        duration: "20–30 min",
        priceDisplay: "Starting from Rs 8,000",
        bestFor:
          "Chest hair removal, grooming, smooth chest appearance.",
        tags: ["chest", "laser", "hair removal"],
      },
      {
        slug: "stomach-laser",
        name: "Stomach Laser",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Laser hair removal for the stomach and abdominal area.",
        description:
          "Stomach laser hair removal targets the hair on the abdomen, including the happy trail and surrounding areas. The treatment is quick and effective, with our advanced laser technology handling both fine and coarse hair types. A full course of 6–8 sessions delivers smooth, long-lasting results.",
        duration: "15–20 min",
        priceDisplay: "Starting from Rs 6,000",
        bestFor:
          "Stomach hair, happy trail, abdominal hair removal.",
        tags: ["stomach", "abdomen", "laser", "hair removal"],
      },
    ],
  },

  // ─── 4. Skin Rejuvenation ────────────────────────────────────────────
  {
    slug: "skin-rejuvenation",
    name: "Skin Rejuvenation",
    description:
      "Advanced facial treatments combining cutting-edge technology with proven techniques to restore your skin's natural radiance, firmness, and youthful glow.",
    icon: "🌟",
    treatments: [
      {
        slug: "hifu-face-lift",
        name: "HIFU Face Lift",
        category: "Skin Rejuvenation",
        categorySlug: "skin-rejuvenation",
        shortDesc:
          "Non-surgical face lift using high-intensity focused ultrasound for deep skin tightening.",
        description:
          "HIFU (High-Intensity Focused Ultrasound) delivers focused ultrasound energy to the SMAS layer—the same layer targeted in surgical facelifts. This stimulates collagen production and tightens skin from within, lifting sagging cheeks, jowls, and neck. Results develop over 2–3 months as new collagen forms, lasting up to 12 months.",
        duration: "60–90 min",
        priceDisplay: "Starting from Rs 35,000",
        bestFor:
          "Sagging skin, jowls, non-surgical lifting, collagen stimulation.",
        tags: ["HIFU", "facelift", "skin tightening", "collagen"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "carbon-laser-facial",
        name: "Carbon Laser Facial",
        category: "Skin Rejuvenation",
        categorySlug: "skin-rejuvenation",
        shortDesc:
          "The 'Hollywood Peel'—a carbon-infused laser treatment for instantly glowing skin.",
        description:
          "Also known as the Hollywood Peel or China Doll Facial, this treatment applies a layer of liquid carbon to the skin, then uses an Nd:YAG laser to vaporize it. The process deeply cleanses pores, removes dead skin cells, and stimulates collagen production. Your skin glows immediately after treatment with zero downtime.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 12,000",
        bestFor:
          "Dull skin, enlarged pores, oily skin, pre-event glow.",
        tags: ["carbon", "hollywood peel", "laser facial", "glow"],
      },
      {
        slug: "aqua-gold",
        name: "Aqua Gold",
        category: "Skin Rejuvenation",
        categorySlug: "skin-rejuvenation",
        shortDesc:
          "Microchanneling treatment delivering a customized serum cocktail into the skin.",
        description:
          "AquaGold uses 24-karat gold-plated microneedles finer than a hair to deliver a custom blend of hyaluronic acid, vitamins, and growth factors directly into the skin. This luxurious treatment provides instant hydration, pore refinement, and a natural glass-skin effect. Results are immediate and improve over the following weeks.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 20,000",
        bestFor:
          "Dehydrated skin, enlarged pores, glass-skin effect, luxury facial.",
        tags: ["aqua gold", "microneedling", "gold", "hydration"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "microneedling",
        name: "Microneedling",
        category: "Skin Rejuvenation",
        categorySlug: "skin-rejuvenation",
        shortDesc:
          "Controlled micro-injuries stimulate natural collagen for smoother, firmer skin.",
        description:
          "Microneedling creates thousands of controlled micro-channels in the skin, triggering the body's wound-healing response and boosting collagen and elastin production. Effective for acne scars, fine lines, large pores, and overall skin texture improvement. A series of 3–6 treatments spaced 4 weeks apart delivers best results.",
        duration: "45–60 min",
        priceDisplay: "Starting from Rs 10,000",
        bestFor:
          "Acne scars, fine lines, large pores, uneven skin texture.",
        tags: ["microneedling", "collagen", "acne scars", "texture"],
      },
      {
        slug: "prp-facial",
        name: "PRP Facial",
        category: "Skin Rejuvenation",
        categorySlug: "skin-rejuvenation",
        shortDesc:
          "Harness your blood's growth factors for natural skin regeneration and glow.",
        description:
          "The PRP (Platelet-Rich Plasma) facial draws a small amount of your blood, concentrates the growth-factor-rich platelets, and applies them to the skin via microneedling. This 100% natural treatment accelerates cell turnover, boosts collagen, and delivers a deep, lasting glow. Ideal as part of a monthly skin health regimen.",
        duration: "60 min",
        priceDisplay: "Starting from Rs 15,000",
        bestFor:
          "Dull complexion, aging skin, natural rejuvenation without synthetics.",
        tags: ["PRP", "platelet", "natural", "regeneration"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "dermapen",
        name: "Dermapen",
        category: "Skin Rejuvenation",
        categorySlug: "skin-rejuvenation",
        shortDesc:
          "Medical-grade automated microneedling for precise, consistent skin renewal.",
        description:
          "Dermapen is a medical-grade automated microneedling device offering adjustable needle depth for customized treatment of different skin concerns. More precise than manual dermarollers, it effectively treats acne scars, hyperpigmentation, stretch marks, and fine lines. Combined with serums for enhanced penetration and results.",
        duration: "45–60 min",
        priceDisplay: "Starting from Rs 12,000",
        bestFor:
          "Acne scars, hyperpigmentation, stretch marks, skin renewal.",
        tags: ["dermapen", "microneedling", "scars", "pigmentation"],
      },
      {
        slug: "led-light-therapy",
        name: "LED Light Therapy",
        category: "Skin Rejuvenation",
        categorySlug: "skin-rejuvenation",
        shortDesc:
          "Therapeutic light wavelengths that heal, calm, and rejuvenate the skin.",
        description:
          "LED light therapy uses specific wavelengths—red for anti-aging and collagen stimulation, blue for acne-causing bacteria elimination, and near-infrared for deep healing. This painless, non-invasive treatment is perfect as a standalone session or add-on to other facial treatments. No downtime and suitable for all skin types.",
        duration: "20–30 min",
        priceDisplay: "Starting from Rs 5,000",
        bestFor:
          "Acne, inflammation, redness, post-treatment healing, collagen boost.",
        tags: ["LED", "light therapy", "acne", "healing"],
      },
      {
        slug: "oxygen-facial",
        name: "Oxygen Facial",
        category: "Skin Rejuvenation",
        categorySlug: "skin-rejuvenation",
        shortDesc:
          "Pressurized oxygen infusion delivering vitamins and hydration for instant radiance.",
        description:
          "The oxygen facial uses a pressurized stream to infuse oxygen, hyaluronic acid, and vitamins directly into the skin's epidermis. This celebrity-favorite treatment instantly plumps, hydrates, and adds a visible glow without any downtime. Perfect before weddings, events, or whenever your skin needs an instant pick-me-up.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 8,000",
        bestFor:
          "Pre-event glow, dehydrated skin, jet-lagged or tired skin.",
        tags: ["oxygen", "hydration", "glow", "event prep"],
      },
      {
        slug: "rf-skin-tightening",
        name: "RF Skin Tightening",
        category: "Skin Rejuvenation",
        categorySlug: "skin-rejuvenation",
        shortDesc:
          "Radiofrequency energy heats deep skin layers to tighten and firm loose skin.",
        description:
          "Radiofrequency skin tightening uses controlled heat energy to stimulate collagen remodeling in the deeper layers of the skin. The treatment progressively tightens loose skin on the face, neck, and jawline over a series of sessions. Results are cumulative—most clients see visible firming after 4–6 sessions spaced 1–2 weeks apart.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 10,000",
        bestFor:
          "Loose skin, early jowling, skin laxity, non-invasive tightening.",
        tags: ["RF", "radiofrequency", "tightening", "firming"],
      },
      {
        slug: "mesotherapy-face",
        name: "Mesotherapy Face",
        category: "Skin Rejuvenation",
        categorySlug: "skin-rejuvenation",
        shortDesc:
          "Microinjections of vitamins and hyaluronic acid for deep skin nourishment.",
        description:
          "Facial mesotherapy delivers a tailored cocktail of vitamins, minerals, amino acids, and hyaluronic acid directly into the mesoderm (middle layer of skin) via superficial microinjections. This 'vitamin injection' approach provides intense nourishment that topical products cannot match. A course of 4–6 sessions delivers a dewy, healthy complexion.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 12,000",
        bestFor:
          "Dull skin, dehydration, fine lines, overall skin health.",
        tags: ["mesotherapy", "vitamins", "hydration", "nourishment"],
        doctor: "dr-huma-abbas",
      },
    ],
  },

  // ─── 5. Chemical Peels ───────────────────────────────────────────────
  {
    slug: "chemical-peels",
    name: "Chemical Peels",
    description:
      "Medical-grade exfoliation treatments that resurface the skin, targeting pigmentation, acne, texture irregularities, and signs of aging.",
    icon: "🧪",
    treatments: [
      {
        slug: "glycolic-peel",
        name: "Glycolic Peel",
        category: "Chemical Peels",
        categorySlug: "chemical-peels",
        shortDesc:
          "Alpha hydroxy acid peel for brightening, smoothing, and evening skin tone.",
        description:
          "The glycolic peel uses glycolic acid (an AHA derived from sugarcane) to dissolve the bonds between dead skin cells, revealing fresh, bright skin beneath. Available in concentrations from 20% to 70%, the strength is customized to your skin's tolerance and concerns. Excellent for hyperpigmentation, dullness, and early signs of aging.",
        duration: "30 min",
        priceDisplay: "Starting from Rs 6,000",
        bestFor:
          "Hyperpigmentation, dull skin, fine lines, uneven tone.",
        tags: ["glycolic", "AHA", "peel", "brightening"],
      },
      {
        slug: "salicylic-peel",
        name: "Salicylic Peel",
        category: "Chemical Peels",
        categorySlug: "chemical-peels",
        shortDesc:
          "Oil-soluble BHA peel that penetrates pores to clear acne and congestion.",
        description:
          "The salicylic peel uses beta hydroxy acid, which is oil-soluble and can penetrate into clogged pores to dissolve sebum and debris. This makes it the gold standard for acne-prone and oily skin types. The peel reduces active breakouts, prevents future acne, and refines pore size. Mild peeling occurs over 3–5 days post-treatment.",
        duration: "30 min",
        priceDisplay: "Starting from Rs 6,000",
        bestFor:
          "Acne, oily skin, clogged pores, blackheads and whiteheads.",
        tags: ["salicylic", "BHA", "peel", "acne"],
      },
      {
        slug: "tca-peel",
        name: "TCA Peel",
        category: "Chemical Peels",
        categorySlug: "chemical-peels",
        shortDesc:
          "Medium-depth peel for significant improvement in scars, wrinkles, and pigmentation.",
        description:
          "Trichloroacetic acid (TCA) peels provide medium-depth exfoliation, reaching the papillary dermis for more dramatic results than superficial peels. Effective for moderate acne scars, deeper pigmentation, and sun damage. Requires 5–7 days of downtime with visible peeling, followed by significantly improved skin texture and tone.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 10,000",
        bestFor:
          "Acne scars, deep pigmentation, sun damage, moderate wrinkles.",
        tags: ["TCA", "medium peel", "scars", "pigmentation"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "lactic-acid-peel",
        name: "Lactic Acid Peel",
        category: "Chemical Peels",
        categorySlug: "chemical-peels",
        shortDesc:
          "Gentle AHA peel ideal for sensitive skin, providing hydration alongside exfoliation.",
        description:
          "The lactic acid peel is the gentlest of the AHA peels, making it ideal for sensitive or dry skin types. Derived from milk, lactic acid exfoliates while simultaneously hydrating the skin. It brightens dull complexions, improves mild pigmentation, and enhances overall skin radiance with virtually no downtime.",
        duration: "20–30 min",
        priceDisplay: "Starting from Rs 5,000",
        bestFor:
          "Sensitive skin, dry skin, mild pigmentation, first-time peel patients.",
        tags: ["lactic acid", "gentle peel", "sensitive skin", "hydrating"],
      },
      {
        slug: "jessner-peel",
        name: "Jessner Peel",
        category: "Chemical Peels",
        categorySlug: "chemical-peels",
        shortDesc:
          "Multi-acid combination peel for enhanced exfoliation and skin clarity.",
        description:
          "The Jessner peel combines salicylic acid, lactic acid, and resorcinol for a synergistic exfoliation that addresses multiple concerns simultaneously. The layered application allows the practitioner to control depth and intensity. Particularly effective for stubborn pigmentation, melasma, and acne-prone skin with 3–5 days of peeling post-treatment.",
        duration: "30 min",
        priceDisplay: "Starting from Rs 8,000",
        bestFor:
          "Melasma, stubborn pigmentation, combination skin concerns.",
        tags: ["jessner", "multi-acid", "melasma", "exfoliation"],
        doctor: "dr-huma-abbas",
      },
    ],
  },

  // ─── 6. Thread Lifts ─────────────────────────────────────────────────
  {
    slug: "thread-lifts",
    name: "Thread Lifts",
    description:
      "Minimally invasive lifting procedures using absorbable threads to reposition sagging tissue and stimulate long-term collagen production.",
    icon: "🪡",
    treatments: [
      {
        slug: "pdo-thread-lift",
        name: "PDO Thread Lift",
        category: "Thread Lifts",
        categorySlug: "thread-lifts",
        shortDesc:
          "Absorbable PDO threads placed beneath the skin to lift and tighten sagging areas.",
        description:
          "PDO (Polydioxanone) thread lift involves inserting fine, absorbable threads beneath the skin to create an immediate lifting effect. As the threads dissolve over 6 months, they stimulate collagen production along their path, providing continued tightening. Ideal for midface, jawline, and neck lifting with minimal downtime compared to surgery.",
        duration: "60–90 min",
        priceDisplay: "Starting from Rs 40,000",
        bestFor:
          "Midface sagging, jowls, neck laxity, non-surgical facelift.",
        tags: ["PDO", "thread lift", "lifting", "collagen"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "barbed-thread-lift",
        name: "Barbed Thread Lift",
        category: "Thread Lifts",
        categorySlug: "thread-lifts",
        shortDesc:
          "Cog or barbed threads providing stronger mechanical lift for moderate sagging.",
        description:
          "Barbed (cog) threads feature tiny barbs along their length that grip the tissue for a stronger mechanical lift than smooth PDO threads. These are used for more significant sagging of the midface, cheeks, and jawline. The barbed design provides an immediate visible lift, with collagen stimulation continuing for months after placement.",
        duration: "60–90 min",
        priceDisplay: "Starting from Rs 50,000",
        bestFor:
          "Moderate sagging, stronger lift needed, cheek and jawline repositioning.",
        tags: ["barbed", "cog thread", "lifting", "sagging"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "nose-thread-lift",
        name: "Nose Thread Lift",
        category: "Thread Lifts",
        categorySlug: "thread-lifts",
        shortDesc:
          "Non-surgical nose reshaping using threads to define the bridge and tip.",
        description:
          "The nose thread lift is a non-surgical rhinoplasty alternative that uses PDO threads to elevate the nasal bridge and refine the tip. Threads are inserted along the nasal dorsum to create a sharper, more defined profile. The procedure takes under 30 minutes with minimal downtime, and results last 12–18 months as the threads stimulate collagen.",
        duration: "30 min",
        priceDisplay: "Starting from Rs 30,000",
        bestFor:
          "Flat nasal bridge, droopy tip, non-surgical nose job.",
        tags: ["nose", "thread lift", "non-surgical rhinoplasty"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "eyebrow-thread-lift",
        name: "Eyebrow Thread Lift",
        category: "Thread Lifts",
        categorySlug: "thread-lifts",
        shortDesc:
          "Lift drooping brows for a more open, youthful eye area with PDO threads.",
        description:
          "An eyebrow thread lift subtly repositions sagging brows to create a more lifted, alert appearance. Fine PDO threads are inserted above the brow to counteract the gravitational descent that narrows the eye area with age. This quick procedure opens up the eye area and can reduce hooding of the upper eyelid, with results lasting 12–18 months.",
        duration: "20–30 min",
        priceDisplay: "Starting from Rs 20,000",
        bestFor:
          "Drooping brows, hooded eyes, tired eye appearance.",
        tags: ["eyebrow", "brow lift", "thread", "eye area"],
        doctor: "dr-huma-abbas",
      },
    ],
  },

  // ─── 7. HydraFacial ──────────────────────────────────────────────────
  {
    slug: "hydrafacial",
    name: "HydraFacial",
    description:
      "The patented multi-step facial treatment that cleanses, exfoliates, extracts, and hydrates in one luxurious session with zero downtime.",
    icon: "💧",
    treatments: [
      {
        slug: "classic-hydrafacial",
        name: "Classic HydraFacial",
        category: "HydraFacial",
        categorySlug: "hydrafacial",
        shortDesc:
          "The signature 4-step HydraFacial: cleanse, exfoliate, extract, and hydrate.",
        description:
          "The Classic HydraFacial uses patented vortex-fusion technology to deeply cleanse, gently exfoliate, painlessly extract blackheads, and saturate the skin with intensive serums. Unlike traditional facials, every step is comfortable and results are instant—you leave with visibly clearer, more radiant skin. Perfect for all skin types with absolutely no downtime.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 10,000",
        bestFor:
          "General skin maintenance, instant glow, lunchtime facial.",
        tags: ["hydrafacial", "classic", "cleanse", "hydrate"],
      },
      {
        slug: "deluxe-hydrafacial",
        name: "Deluxe HydraFacial",
        category: "HydraFacial",
        categorySlug: "hydrafacial",
        shortDesc:
          "Enhanced HydraFacial with LED therapy, lymphatic drainage, and premium serums.",
        description:
          "The Deluxe HydraFacial elevates the classic treatment with added lymphatic drainage, customized booster serums, and LED light therapy. This comprehensive session targets specific concerns like pigmentation, fine lines, or congestion with targeted actives. The result is deeply nourished, visibly transformed skin that glows for days.",
        duration: "60 min",
        priceDisplay: "Starting from Rs 15,000",
        bestFor:
          "Deep skin concerns, anti-aging, pigmentation, comprehensive facial.",
        tags: ["hydrafacial", "deluxe", "LED", "premium"],
      },
      {
        slug: "hydrafacial-with-boosters",
        name: "HydraFacial with Boosters",
        category: "HydraFacial",
        categorySlug: "hydrafacial",
        shortDesc:
          "Targeted HydraFacial with add-on boosters for specific skin concerns.",
        description:
          "This HydraFacial variation incorporates specialized booster serums—such as Britenol for dark spots, DermaBuilder for fine lines, or Growth Factor for skin renewal—infused during the treatment for enhanced, targeted results. Choose your booster based on your primary concern for a truly personalized facial experience.",
        duration: "45–60 min",
        priceDisplay: "Starting from Rs 18,000",
        bestFor:
          "Targeted concerns, personalized treatment, enhanced results.",
        tags: ["hydrafacial", "boosters", "personalized", "targeted"],
      },
    ],
  },

  // ─── 8. Dental Aesthetics ────────────────────────────────────────────
  {
    slug: "dental-aesthetics",
    name: "Dental Aesthetics",
    description:
      "Cosmetic dental treatments to perfect your smile—from professional whitening to complete smile makeovers with veneers and bonding.",
    icon: "😁",
    treatments: [
      {
        slug: "teeth-whitening",
        name: "Teeth Whitening",
        category: "Dental Aesthetics",
        categorySlug: "dental-aesthetics",
        shortDesc:
          "Professional in-office teeth whitening for a brighter, whiter smile in one session.",
        description:
          "Our professional teeth whitening uses a high-concentration hydrogen peroxide gel activated by LED light to remove years of staining from tea, coffee, and everyday wear. The in-office treatment achieves 4–8 shades of whitening in a single session, with results far superior to over-the-counter products. Touch-up kits are provided for maintenance.",
        duration: "60 min",
        priceDisplay: "Starting from Rs 15,000",
        bestFor:
          "Stained teeth, yellowing, pre-wedding whitening, confidence boost.",
        tags: ["whitening", "teeth", "bright smile"],
        doctor: "dr-ahmed-raza",
      },
      {
        slug: "dental-veneers",
        name: "Dental Veneers",
        category: "Dental Aesthetics",
        categorySlug: "dental-aesthetics",
        shortDesc:
          "Custom porcelain veneers to transform the shape, size, and color of your teeth.",
        description:
          "Dental veneers are ultra-thin porcelain shells custom-crafted to cover the front surface of teeth, instantly correcting chips, gaps, discoloration, and misalignment. Each veneer is designed to match your desired shade and shape for a natural, flawless result. The process requires 2–3 visits and results last 10–15 years with proper care.",
        duration: "2–3 visits",
        priceDisplay: "Starting from Rs 25,000 per tooth",
        bestFor:
          "Chipped teeth, gaps, discoloration, uneven teeth, smile transformation.",
        tags: ["veneers", "porcelain", "smile", "cosmetic dentistry"],
        doctor: "dr-ahmed-raza",
      },
      {
        slug: "smile-makeover",
        name: "Smile Makeover",
        category: "Dental Aesthetics",
        categorySlug: "dental-aesthetics",
        shortDesc:
          "Comprehensive smile design combining multiple dental treatments for a perfect smile.",
        description:
          "A smile makeover is a customized combination of cosmetic dental procedures—veneers, whitening, bonding, and gum contouring—designed to create your ideal smile. We use digital smile design technology to preview your results before treatment begins. Every smile makeover starts with a detailed consultation to understand your goals and facial aesthetics.",
        duration: "Multiple visits",
        priceDisplay: "Starting from Rs 80,000",
        bestFor:
          "Complete smile transformation, multiple dental concerns, bridal prep.",
        tags: ["smile makeover", "cosmetic", "complete transformation"],
        doctor: "dr-ahmed-raza",
      },
      {
        slug: "dental-bonding",
        name: "Dental Bonding",
        category: "Dental Aesthetics",
        categorySlug: "dental-aesthetics",
        shortDesc:
          "Tooth-colored composite resin to repair chips, gaps, and imperfections.",
        description:
          "Dental bonding applies tooth-colored composite resin to repair minor chips, close small gaps, reshape teeth, and cover stains. It is a quick, affordable alternative to veneers for minor cosmetic corrections. The procedure is completed in a single visit, requires no anesthesia for most cases, and the results blend seamlessly with natural teeth.",
        duration: "30–60 min per tooth",
        priceDisplay: "Starting from Rs 8,000 per tooth",
        bestFor:
          "Minor chips, small gaps, tooth reshaping, affordable cosmetic fix.",
        tags: ["bonding", "composite", "repair", "cosmetic"],
        doctor: "dr-ahmed-raza",
      },
      {
        slug: "gum-contouring",
        name: "Gum Contouring",
        category: "Dental Aesthetics",
        categorySlug: "dental-aesthetics",
        shortDesc:
          "Reshape the gum line to reveal more tooth and create a balanced smile.",
        description:
          "Gum contouring (gingivectomy) uses laser technology to precisely reshape an uneven or excessive gum line, correcting a 'gummy smile.' The laser cauterizes as it works, minimizing bleeding and speeding recovery. The result is a more proportional tooth-to-gum ratio for a balanced, confident smile. Healing takes 1–2 weeks.",
        duration: "30–60 min",
        priceDisplay: "Starting from Rs 15,000",
        bestFor:
          "Gummy smile, uneven gum line, short-looking teeth.",
        tags: ["gum", "contouring", "gummy smile", "laser"],
        doctor: "dr-ahmed-raza",
      },
      {
        slug: "dental-crown",
        name: "Dental Crown",
        category: "Dental Aesthetics",
        categorySlug: "dental-aesthetics",
        shortDesc:
          "Custom-fitted tooth cap restoring shape, strength, and natural appearance.",
        description:
          "A dental crown is a custom-made cap that covers the entire visible portion of a damaged or aesthetically compromised tooth. Our crowns are made from high-quality porcelain or zirconia, matched precisely to your natural tooth shade. The process involves tooth preparation, impression-taking, and fitting over two visits for a durable, beautiful result lasting 15+ years.",
        duration: "2 visits",
        priceDisplay: "Starting from Rs 18,000",
        bestFor:
          "Damaged teeth, root canal coverage, tooth restoration, aesthetic improvement.",
        tags: ["crown", "cap", "restoration", "porcelain"],
        doctor: "dr-ahmed-raza",
      },
    ],
  },

  // ─── 9. Hair Restoration ─────────────────────────────────────────────
  {
    slug: "hair-restoration",
    name: "Hair Restoration",
    description:
      "Science-backed treatments to combat hair loss, stimulate regrowth, and restore hair density using PRP, mesotherapy, and advanced growth factors.",
    icon: "💇",
    treatments: [
      {
        slug: "prp-hair-treatment",
        name: "PRP Hair Treatment",
        category: "Hair Restoration",
        categorySlug: "hair-restoration",
        shortDesc:
          "Platelet-rich plasma injections to stimulate dormant hair follicles and promote regrowth.",
        description:
          "PRP hair treatment extracts and concentrates growth factors from your own blood, then injects them into the scalp at areas of thinning. These growth factors stimulate dormant follicles, strengthen existing hair, and promote new growth. A course of 4–6 sessions spaced monthly is recommended, with maintenance sessions every 3–4 months.",
        duration: "45–60 min",
        priceDisplay: "Starting from Rs 15,000",
        bestFor:
          "Thinning hair, early-stage hair loss, male and female pattern baldness.",
        tags: ["PRP", "hair loss", "regrowth", "scalp"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "hair-mesotherapy",
        name: "Hair Mesotherapy",
        category: "Hair Restoration",
        categorySlug: "hair-restoration",
        shortDesc:
          "Vitamin and mineral microinjections into the scalp for healthier, stronger hair.",
        description:
          "Hair mesotherapy delivers a cocktail of vitamins, minerals, amino acids, and vasodilators directly into the scalp via microinjections. This nourishes hair follicles, improves blood circulation to the scalp, and strengthens hair from the root. Particularly effective for diffuse thinning and can be combined with PRP for enhanced results.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 10,000",
        bestFor:
          "Diffuse thinning, weak hair, scalp nourishment, hair strengthening.",
        tags: ["mesotherapy", "hair", "vitamins", "scalp"],
      },
      {
        slug: "gfc-hair-treatment",
        name: "GFC Hair Treatment",
        category: "Hair Restoration",
        categorySlug: "hair-restoration",
        shortDesc:
          "Growth Factor Concentrate therapy delivering high-potency growth factors to the scalp.",
        description:
          "GFC (Growth Factor Concentrate) is a next-generation hair restoration treatment that yields a higher concentration of growth factors than traditional PRP. The technology isolates and activates platelets more effectively, resulting in a more potent growth factor solution. Clinical studies show superior hair density improvement compared to standard PRP protocols.",
        duration: "45–60 min",
        priceDisplay: "Starting from Rs 18,000",
        bestFor:
          "Moderate hair loss, superior alternative to PRP, advanced thinning.",
        tags: ["GFC", "growth factors", "hair loss", "advanced"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "biotin-infusion",
        name: "Biotin Infusion",
        category: "Hair Restoration",
        categorySlug: "hair-restoration",
        shortDesc:
          "IV or scalp-injected biotin therapy for strengthening hair from within.",
        description:
          "Biotin infusion therapy delivers high-dose vitamin B7 (biotin) either intravenously or via direct scalp injection to combat biotin deficiency—a common contributor to hair thinning and brittleness. This treatment strengthens the hair shaft, reduces breakage, and supports the keratin infrastructure. Best results when combined with a hair restoration protocol.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 8,000",
        bestFor:
          "Brittle hair, hair breakage, biotin deficiency, supportive treatment.",
        tags: ["biotin", "vitamins", "hair strength", "infusion"],
      },
      {
        slug: "scalp-micropigmentation",
        name: "Scalp Micropigmentation",
        category: "Hair Restoration",
        categorySlug: "hair-restoration",
        shortDesc:
          "Cosmetic scalp tattooing creating the appearance of fuller, denser hair.",
        description:
          "Scalp micropigmentation (SMP) uses specialized micro-needles to deposit pigment into the scalp, replicating the appearance of hair follicles. This creates the illusion of a fuller head of hair, a defined hairline, or camouflaged scarring. The semi-permanent treatment typically requires 2–3 sessions and lasts 3–5 years before a touch-up is needed.",
        duration: "2–4 hours",
        priceDisplay: "Starting from Rs 30,000",
        bestFor:
          "Advanced hair loss, receding hairline, scar camouflage, buzz-cut look.",
        tags: ["SMP", "micropigmentation", "hairline", "camouflage"],
      },
    ],
  },

  // ─── 10. Body Contouring ─────────────────────────────────────────────
  {
    slug: "body-contouring",
    name: "Body Contouring",
    description:
      "Non-invasive fat reduction and body sculpting treatments that reshape your silhouette without surgery, downtime, or discomfort.",
    icon: "🏋️",
    treatments: [
      {
        slug: "coolsculpting",
        name: "CoolSculpting",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "FDA-cleared fat freezing that permanently eliminates stubborn fat cells.",
        description:
          "CoolSculpting uses cryolipolysis technology to freeze and destroy fat cells in targeted areas without surgery or downtime. The body naturally eliminates the dead fat cells over 2–3 months, resulting in a 20–25% reduction in treated fat layers. Common treatment areas include the abdomen, love handles, thighs, double chin, and upper arms.",
        duration: "35–60 min per area",
        priceDisplay: "Starting from Rs 25,000 per area",
        bestFor:
          "Stubborn fat pockets, love handles, double chin, post-diet plateau.",
        tags: ["coolsculpting", "fat freezing", "cryolipolysis", "body"],
      },
      {
        slug: "cavitation",
        name: "Cavitation",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "Ultrasonic waves break down fat cells for non-surgical body slimming.",
        description:
          "Ultrasonic cavitation uses low-frequency sound waves to create micro-bubbles within fat tissue, causing fat cells to rupture and release their contents. The body then metabolizes and eliminates the fat naturally through the lymphatic system. This painless treatment is effective for reducing localized fat deposits and can be combined with RF tightening for enhanced results.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 8,000",
        bestFor:
          "Localized fat reduction, cellulite, body slimming without surgery.",
        tags: ["cavitation", "ultrasound", "fat reduction", "slimming"],
      },
      {
        slug: "rf-body-tightening",
        name: "RF Body Tightening",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "Radiofrequency energy tightens loose body skin and reduces cellulite.",
        description:
          "Body RF tightening uses radiofrequency energy to heat the deep layers of skin, stimulating collagen production and tightening loose tissue. Particularly effective for post-weight-loss skin laxity, post-pregnancy tummy, and cellulite reduction. A course of 6–10 sessions delivers progressive firming and smoothing of treated areas.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 8,000",
        bestFor:
          "Loose body skin, cellulite, post-pregnancy tummy, skin laxity.",
        tags: ["RF", "body tightening", "cellulite", "skin laxity"],
      },
      {
        slug: "laser-lipolysis",
        name: "Laser Lipolysis",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "Laser energy liquefies fat cells while simultaneously tightening overlying skin.",
        description:
          "Laser lipolysis uses controlled laser energy to heat and liquefy fat cells, which are then naturally eliminated by the body. Unlike some other treatments, laser lipolysis also tightens the skin over the treated area through collagen stimulation. The dual action of fat reduction plus skin tightening makes it especially effective for smaller, stubborn areas.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 15,000",
        bestFor:
          "Stubborn fat, simultaneous skin tightening, smaller treatment areas.",
        tags: ["laser lipo", "fat reduction", "tightening", "contouring"],
      },
      {
        slug: "body-wraps",
        name: "Body Wraps",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "Detoxifying mineral wraps that slim, tone, and nourish the body.",
        description:
          "Our body wraps use a combination of mineral-rich clays, botanical extracts, and thermal blankets to draw out toxins, reduce water retention, and temporarily slim the body. The treatment deeply nourishes the skin while providing relaxation. While results are temporary, regular sessions combined with a healthy lifestyle support long-term body goals.",
        duration: "60–90 min",
        priceDisplay: "Starting from Rs 6,000",
        bestFor:
          "Pre-event slimming, detoxification, skin nourishment, relaxation.",
        tags: ["body wrap", "detox", "slimming", "relaxation"],
      },
      {
        slug: "ems-body-sculpting",
        name: "EMS Body Sculpting",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "Electromagnetic muscle stimulation equivalent to thousands of exercises in 30 minutes.",
        description:
          "EMS (Electromagnetic Muscle Stimulation) body sculpting induces supramaximal muscle contractions—the equivalent of 20,000 crunches or squats in a single session. This simultaneously builds muscle and burns fat in the treated area. The treatment is popular for abdominal definition, buttock lifting, and arm toning. A course of 4–6 sessions is recommended.",
        duration: "30 min",
        priceDisplay: "Starting from Rs 12,000",
        bestFor:
          "Muscle building, ab definition, butt lift, toning.",
        tags: ["EMS", "muscle sculpting", "toning", "body sculpt"],
      },
      {
        slug: "lymphatic-drainage",
        name: "Lymphatic Drainage",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "Pressotherapy massage to boost lymph flow, reduce bloating, and detoxify.",
        description:
          "Machine-assisted lymphatic drainage uses sequential compression to stimulate the lymphatic system, reducing fluid retention, bloating, and puffiness. The treatment accelerates toxin removal, boosts immunity, and complements other body contouring treatments by helping the body eliminate destroyed fat cells. Also excellent for post-surgical swelling reduction.",
        duration: "45–60 min",
        priceDisplay: "Starting from Rs 5,000",
        bestFor:
          "Water retention, bloating, post-surgical recovery, detoxification.",
        tags: ["lymphatic", "drainage", "detox", "bloating"],
      },
    ],
  },

  // ─── 11. PRP Therapy ─────────────────────────────────────────────────
  {
    slug: "prp-therapy",
    name: "PRP Therapy",
    description:
      "Platelet-Rich Plasma therapy harnesses your body's own healing mechanisms for skin rejuvenation, hair restoration, and joint therapy.",
    icon: "🩸",
    treatments: [
      {
        slug: "prp-facial-therapy",
        name: "PRP Facial",
        category: "PRP Therapy",
        categorySlug: "prp-therapy",
        shortDesc:
          "Your blood's concentrated growth factors applied to the face for natural rejuvenation.",
        description:
          "PRP facial therapy draws a small sample of your blood, processes it to concentrate the platelet-rich plasma, and applies it to the face via microneedling or injection. The growth factors stimulate collagen production, accelerate healing, and provide a natural glow. This treatment is ideal for those seeking rejuvenation without synthetic products.",
        duration: "60 min",
        priceDisplay: "Starting from Rs 15,000",
        bestFor:
          "Natural rejuvenation, collagen stimulation, anti-aging without synthetics.",
        tags: ["PRP", "facial", "natural", "growth factors"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "prp-hair",
        name: "PRP Hair",
        category: "PRP Therapy",
        categorySlug: "prp-therapy",
        shortDesc:
          "Scalp PRP injections to stimulate hair follicles and combat thinning.",
        description:
          "PRP for hair loss involves injecting platelet-rich plasma directly into the scalp at areas of thinning. The concentrated growth factors wake up dormant follicles, extend the growth phase of hair, and increase hair shaft thickness. This evidence-based treatment is effective for both men and women experiencing androgenetic alopecia or diffuse thinning.",
        duration: "45–60 min",
        priceDisplay: "Starting from Rs 15,000",
        bestFor:
          "Hair thinning, androgenetic alopecia, hair density improvement.",
        tags: ["PRP", "hair", "scalp", "alopecia"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "prp-joint-therapy",
        name: "PRP Joint Therapy",
        category: "PRP Therapy",
        categorySlug: "prp-therapy",
        shortDesc:
          "PRP injections into joints to reduce inflammation and promote tissue healing.",
        description:
          "PRP joint therapy delivers concentrated growth factors directly into damaged or inflamed joints, promoting natural tissue repair and reducing inflammation. Effective for knee, shoulder, hip, and elbow joints affected by osteoarthritis, tendinitis, or sports injuries. This regenerative approach can delay or eliminate the need for surgical intervention.",
        duration: "30–45 min",
        priceDisplay: "Starting from Rs 20,000",
        bestFor:
          "Joint pain, osteoarthritis, sports injuries, tendon inflammation.",
        tags: ["PRP", "joint", "arthritis", "regenerative"],
        doctor: "dr-huma-abbas",
      },
      {
        slug: "vampire-facial",
        name: "Vampire Facial",
        category: "PRP Therapy",
        categorySlug: "prp-therapy",
        shortDesc:
          "The iconic PRP + microneedling combination for dramatic skin transformation.",
        description:
          "The Vampire Facial combines PRP with medical-grade microneedling for maximum skin transformation. After microneedling creates thousands of micro-channels, PRP is applied topically and massaged into the skin, delivering growth factors deep into the dermis. The result is dramatically improved texture, tone, and firmness over the following weeks. A series of 3 treatments delivers best results.",
        duration: "60–75 min",
        priceDisplay: "Starting from Rs 18,000",
        bestFor:
          "Dramatic skin improvement, deep scars, advanced aging, skin transformation.",
        tags: ["vampire facial", "PRP", "microneedling", "dramatic"],
        doctor: "dr-huma-abbas",
      },
    ],
  },
];

// ─── Flat helpers ──────────────────────────────────────────────────────

/** All treatments as a flat array */
export const allTreatments: Treatment[] = categories.flatMap(
  (c) => c.treatments,
);

/** Look up a single treatment by slug */
export function getTreatmentBySlug(slug: string): Treatment | undefined {
  return allTreatments.find((t) => t.slug === slug);
}

/** Look up a category by slug */
export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

/** Get all treatments in a category */
export function getTreatmentsByCategory(categorySlug: string): Treatment[] {
  return allTreatments.filter((t) => t.categorySlug === categorySlug);
}

/** Total treatment count */
export const treatmentCount = allTreatments.length;

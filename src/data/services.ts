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
  // ─── 1. Medicated Facials ────────────────────────────────────────────
  {
    slug: "medicated-facials",
    name: "Medicated Facials",
    description:
      "Advanced facial treatments combining clinical-grade ingredients with expert technique to address specific skin concerns — from acne and pigmentation to deep hydration and radiance.",
    icon: "✨",
    treatments: [
      {
        slug: "classical-facial",
        name: "Classical Facial",
        category: "Medicated Facials",
        categorySlug: "medicated-facials",
        shortDesc:
          "A timeless deep-cleansing facial that purifies, exfoliates, and revitalizes the skin.",
        description:
          "The Classical Facial is our foundational skin treatment, combining thorough cleansing, gentle exfoliation, steam extraction, and a nourishing mask tailored to your skin type. This treatment restores your skin's natural balance and radiance, making it an excellent choice for regular maintenance or as an introduction to professional skincare. Suitable for all skin types with zero downtime.",
        duration: "45–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "General skin maintenance, first-time facial clients, skin refreshment.",
        tags: ["facial", "cleansing", "classic", "maintenance"],
        doctor: "dr-huma",
      },
      {
        slug: "glow-and-go-facial",
        name: "Glow and Go Facial",
        category: "Medicated Facials",
        categorySlug: "medicated-facials",
        shortDesc:
          "A quick-result facial designed to deliver instant luminosity for busy schedules.",
        description:
          "The Glow and Go Facial is our express radiance treatment, perfect for those who want visible results in minimal time. Using targeted brightening serums, gentle enzymatic exfoliation, and a hydrating finish, this facial delivers an instant lit-from-within glow. Ideal before events, weddings, or whenever your skin needs a quick pick-me-up without any downtime.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Pre-event prep, instant radiance, busy professionals, lunchtime glow-up.",
        tags: ["glow", "express", "radiance", "brightening"],
        doctor: "dr-huma",
      },
      {
        slug: "oxygen-facial",
        name: "Oxygen Facial",
        category: "Medicated Facials",
        categorySlug: "medicated-facials",
        shortDesc:
          "Pressurized oxygen infuses vitamins and antioxidants deep into the skin for a plump, dewy finish.",
        description:
          "The Oxygen Facial uses a specialized device to deliver a stream of pressurized oxygen infused with vitamins, minerals, and antioxidants directly into the epidermis. This boosts cellular metabolism, promotes collagen production, and leaves the skin visibly plumped and hydrated. The treatment is gentle, soothing, and delivers an immediate dewy glow with no redness or downtime.",
        duration: "45–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Dull skin, dehydration, fine lines, pre-event radiance.",
        tags: ["oxygen", "hydration", "plumping", "antioxidants"],
        doctor: "dr-huma",
      },
      {
        slug: "acne-facial",
        name: "Acne Facial",
        category: "Medicated Facials",
        categorySlug: "medicated-facials",
        shortDesc:
          "A targeted medicated facial that deep-cleanses pores, reduces inflammation, and controls breakouts.",
        description:
          "Our Acne Facial is specifically designed for breakout-prone and oily skin, using clinical-grade antibacterial and anti-inflammatory ingredients to deep-cleanse clogged pores and calm active inflammation. The treatment includes thorough extraction, a medicated mask, and blue LED therapy to kill acne-causing bacteria. Regular sessions help prevent future breakouts and reduce post-acne marks.",
        duration: "45–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Active acne, oily skin, clogged pores, recurring breakouts.",
        tags: ["acne", "medicated", "extraction", "antibacterial"],
        doctor: "dr-huma",
      },
      {
        slug: "microdermabrasion-facial",
        name: "Microdermabrasion Facial",
        category: "Medicated Facials",
        categorySlug: "medicated-facials",
        shortDesc:
          "Crystal or diamond-tip exfoliation that buffs away dead skin cells for a smoother, brighter complexion.",
        description:
          "Microdermabrasion uses a diamond-tip handpiece to mechanically exfoliate the outermost layer of dead skin cells, revealing fresher, smoother skin beneath. This treatment improves skin texture, minimizes the appearance of fine lines and shallow scars, and enhances the absorption of skincare products. A course of treatments delivers cumulative improvements in tone and clarity.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Dull complexion, uneven texture, fine lines, shallow acne scars.",
        tags: ["microdermabrasion", "exfoliation", "resurfacing", "texture"],
        doctor: "dr-huma",
      },
      {
        slug: "microneedling-facial",
        name: "Microneedling Facial",
        category: "Medicated Facials",
        categorySlug: "medicated-facials",
        shortDesc:
          "Controlled micro-injuries stimulate collagen production for firmer, smoother, and more even-toned skin.",
        description:
          "The Microneedling Facial uses a medical-grade device with fine needles to create thousands of controlled micro-channels in the skin, triggering the body's natural wound-healing response and stimulating new collagen and elastin production. This treatment effectively addresses acne scars, enlarged pores, fine lines, and uneven texture. Topical serums are applied during the procedure for enhanced penetration and results.",
        duration: "45–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Acne scars, enlarged pores, fine lines, skin rejuvenation.",
        tags: ["microneedling", "collagen", "scars", "rejuvenation"],
        doctor: "dr-huma",
      },
      {
        slug: "chemical-peel-facial",
        name: "Chemical Peel Facial",
        category: "Medicated Facials",
        categorySlug: "medicated-facials",
        shortDesc:
          "Medical-grade acids exfoliate damaged surface layers to reveal brighter, more even skin underneath.",
        description:
          "Our Chemical Peel Facial applies carefully selected acids — glycolic, salicylic, lactic, or TCA — to exfoliate damaged outer skin layers and stimulate cell turnover. The depth and type of peel is customized to your skin concerns, whether that is pigmentation, acne, fine lines, or overall dullness. Peeling occurs over 3–7 days post-treatment, revealing noticeably smoother, brighter, and more even-toned skin.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Pigmentation, melasma, fine lines, acne marks, dull skin.",
        tags: ["chemical peel", "exfoliation", "pigmentation", "resurfacing"],
        doctor: "dr-huma",
      },
      {
        slug: "back-facial",
        name: "Back Facial",
        category: "Medicated Facials",
        categorySlug: "medicated-facials",
        shortDesc:
          "A deep-cleansing treatment for the back that targets acne, congestion, and rough texture.",
        description:
          "The Back Facial brings the same level of care we give your face to the often-neglected skin on your back. This treatment includes deep cleansing, exfoliation, extractions for back acne and congestion, a purifying mask, and hydration. It is especially popular before weddings and events where backless outfits are planned, leaving the skin smooth, clear, and even-toned.",
        duration: "45–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Back acne, rough back skin, pre-wedding prep, congestion.",
        tags: ["back", "body facial", "acne", "cleansing"],
        doctor: "dr-huma",
      },
      {
        slug: "signature-facial",
        name: "Signature Facial",
        category: "Medicated Facials",
        categorySlug: "medicated-facials",
        shortDesc:
          "Our most comprehensive facial combining multiple modalities for a complete skin transformation.",
        description:
          "The Aesthetic Lounge Signature Facial is our most luxurious and results-driven treatment, combining the best elements of our facial menu into one transformative session. It includes deep cleansing, enzyme exfoliation, targeted extractions, a customized serum infusion, LED therapy, and a nourishing mask — all tailored to your unique skin profile. This is our flagship treatment for clients who want the ultimate in skincare.",
        duration: "75–90 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Complete skin overhaul, special occasions, premium skincare experience.",
        tags: ["signature", "premium", "comprehensive", "luxury"],
        doctor: "dr-huma",
      },
      {
        slug: "keravive-hydrafacial",
        name: "Keravive HydraFacial",
        category: "Medicated Facials",
        categorySlug: "medicated-facials",
        shortDesc:
          "A specialized HydraFacial for the scalp that cleanses, stimulates, and nourishes hair follicles.",
        description:
          "The Keravive HydraFacial is a unique scalp treatment using HydraFacial's patented vortex technology to cleanse, exfoliate, and hydrate the scalp while delivering proprietary growth factor and skin protein solutions directly to hair follicles. This three-step in-office treatment with a take-home spray promotes healthier, fuller-looking hair by creating the optimal scalp environment for hair growth.",
        duration: "45–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Scalp health, thinning hair, dry scalp, hair follicle nourishment.",
        tags: ["keravive", "hydrafacial", "scalp", "hair health"],
        doctor: "dr-huma",
      },
    ],
  },

  // ─── 2. Face Lift & Rejuvenation ─────────────────────────────────────
  {
    slug: "face-lift-rejuvenation",
    name: "Face Lift & Rejuvenation",
    description:
      "Advanced anti-aging and facial rejuvenation treatments that restore volume, smooth wrinkles, and lift sagging skin — from injectables to energy-based devices.",
    icon: "💉",
    treatments: [
      {
        slug: "skin-booster",
        name: "Skin Booster",
        category: "Face Lift & Rejuvenation",
        categorySlug: "face-lift-rejuvenation",
        shortDesc:
          "Micro-injections of hyaluronic acid that deeply hydrate and improve skin quality from within.",
        description:
          "Skin Boosters deliver micro-doses of stabilized hyaluronic acid just beneath the skin's surface through a series of tiny injections, providing deep hydration that topical products cannot achieve. Unlike traditional fillers that add volume, skin boosters improve overall skin quality — enhancing elasticity, smoothness, and luminosity. A course of 2–3 sessions spaced 4 weeks apart delivers the best results, with maintenance every 6 months.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Dehydrated skin, crepey texture, dull complexion, overall skin quality improvement.",
        tags: ["skin booster", "hyaluronic acid", "hydration", "quality"],
        doctor: "dr-huma",
      },
      {
        slug: "polynucleotide",
        name: "Polynucleotide",
        category: "Face Lift & Rejuvenation",
        categorySlug: "face-lift-rejuvenation",
        shortDesc:
          "Bio-regenerative injections using DNA-derived polynucleotides to repair and rejuvenate aging skin.",
        description:
          "Polynucleotide therapy is a cutting-edge bio-regenerative treatment that uses purified DNA fragments derived from salmon to stimulate fibroblast activity, promote collagen synthesis, and repair damaged skin at a cellular level. This treatment is particularly effective for the delicate under-eye area, neck, and decolletage where skin is thin and prone to aging. Results improve progressively over 2–3 sessions.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Under-eye hollows, neck aging, skin repair, bio-regeneration.",
        tags: ["polynucleotide", "bio-regenerative", "DNA", "repair"],
        doctor: "dr-huma",
      },
      {
        slug: "botox",
        name: "Botox",
        category: "Face Lift & Rejuvenation",
        categorySlug: "face-lift-rejuvenation",
        shortDesc:
          "Precision botulinum toxin injections that relax dynamic wrinkles for a smoother, refreshed appearance.",
        description:
          "Botox (botulinum toxin) is the gold standard for treating dynamic wrinkles — the lines that form from repeated facial expressions like frowning, squinting, and raising the eyebrows. Our physicians use precise micro-dosing techniques to relax targeted muscles while preserving natural expression, avoiding the frozen look. Results appear within 3–7 days and last 3–4 months, with regular treatments training muscles to create fewer lines over time.",
        duration: "15–30 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Forehead lines, crow's feet, frown lines (11s), bunny lines, gummy smile.",
        tags: ["botox", "wrinkles", "anti-aging", "injectables"],
        doctor: "dr-huma",
      },
      {
        slug: "dermal-fillers",
        name: "Dermal Fillers",
        category: "Face Lift & Rejuvenation",
        categorySlug: "face-lift-rejuvenation",
        shortDesc:
          "Hyaluronic acid fillers that restore lost volume, sculpt contours, and enhance facial features.",
        description:
          "Dermal fillers use premium hyaluronic acid gel to restore volume lost through aging, sculpt and define facial contours, and enhance features like lips, cheeks, and jawline. Our physicians take a whole-face approach, assessing facial proportions and balance before creating a customized treatment plan. Results are immediate and natural-looking, lasting 6–18 months depending on the area treated and the product used.",
        duration: "30–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Volume loss, lip enhancement, cheek definition, jawline sculpting, nasolabial folds.",
        tags: ["fillers", "hyaluronic acid", "volume", "contouring"],
        doctor: "dr-huma",
      },
      {
        slug: "hifu",
        name: "HIFU",
        category: "Face Lift & Rejuvenation",
        categorySlug: "face-lift-rejuvenation",
        shortDesc:
          "High-Intensity Focused Ultrasound that lifts and tightens skin by targeting deep tissue layers.",
        description:
          "HIFU (High-Intensity Focused Ultrasound) delivers focused ultrasound energy to the deep structural layers of the skin — the same layers addressed in a surgical facelift — without cutting the surface. This stimulates a natural regenerative response, producing new collagen and elastin that gradually lifts and tightens the treated area. Results develop over 2–3 months and can last up to a year, making HIFU an excellent non-surgical alternative to a facelift.",
        duration: "60–90 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Sagging skin, jowls, loose neck, non-surgical facelift alternative.",
        tags: ["HIFU", "ultrasound", "lifting", "tightening"],
        doctor: "dr-huma",
      },
      {
        slug: "hifu-mpt",
        name: "HIFU MPT",
        category: "Face Lift & Rejuvenation",
        categorySlug: "face-lift-rejuvenation",
        shortDesc:
          "Next-generation HIFU with Micro-Pulsed Technology for enhanced comfort and precision lifting.",
        description:
          "HIFU MPT (Micro-Pulsed Technology) is an advanced evolution of traditional HIFU that delivers ultrasound energy in rapid micro-pulses rather than continuous bursts. This results in more comfortable treatment with less downtime while maintaining the same powerful lifting and tightening effects. The micro-pulsed delivery also allows for more precise targeting of treatment depths, making it suitable for delicate areas like the periorbital region and forehead.",
        duration: "60–90 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Sensitive skin, periorbital tightening, comfortable lifting treatment.",
        tags: ["HIFU", "MPT", "micro-pulse", "comfortable lifting"],
        doctor: "dr-huma",
      },
      {
        slug: "radio-frequency",
        name: "Radio Frequency",
        category: "Face Lift & Rejuvenation",
        categorySlug: "face-lift-rejuvenation",
        shortDesc:
          "Radiofrequency energy heats deep skin layers to stimulate collagen and tighten lax facial skin.",
        description:
          "Radiofrequency (RF) facial treatment delivers controlled thermal energy into the deeper layers of the skin, heating collagen fibers to cause immediate contraction and tightening while stimulating long-term new collagen production. The treatment is comfortable, requires no downtime, and delivers progressive improvement in skin firmness, fine lines, and overall facial contour over a series of sessions.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Mild skin laxity, fine lines, facial contouring, collagen stimulation.",
        tags: ["radio frequency", "RF", "tightening", "collagen"],
        doctor: "dr-huma",
      },
    ],
  },

  // ─── 3. Laser Treatments ─────────────────────────────────────────────
  {
    slug: "laser-treatments",
    name: "Laser Treatments",
    description:
      "Medical-grade laser and light-based technologies for permanent hair reduction, skin resurfacing, tattoo removal, and targeted correction of skin concerns.",
    icon: "⚡",
    treatments: [
      {
        slug: "laser-hair-removal",
        name: "Laser Hair Removal",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Permanent hair reduction using advanced laser technology safe for all skin tones.",
        description:
          "Our laser hair removal uses advanced diode and Nd:YAG technology calibrated specifically for South Asian skin tones, delivering permanent hair reduction safely and effectively. The laser targets melanin in the hair follicle, destroying its ability to regrow while leaving the surrounding skin unharmed. We offer packages for individual areas as well as full body treatments, with most clients achieving 80–90% permanent reduction over a course of 6–12 sessions.",
        duration: "15–120 min (area dependent)",
        priceDisplay: "Starting from Rs 1,500 (Upper Lip)",
        bestFor:
          "Unwanted body/facial hair, ingrown hairs, razor bumps, long-term hair freedom.",
        tags: ["laser", "hair removal", "permanent", "diode"],
        doctor: "dr-zonera",
      },
      {
        slug: "electrolysis",
        name: "Electrolysis",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "The only FDA-approved method for permanent hair removal, treating one follicle at a time.",
        description:
          "Electrolysis is the only method recognized by the FDA as truly permanent hair removal. A fine probe is inserted into each hair follicle, delivering a precise electrical current that destroys the follicle's ability to produce hair. While more time-intensive than laser, electrolysis works on all hair colors and skin types, including fine, light, and grey hairs that laser cannot target. Ideal for small areas or resistant hairs.",
        duration: "15–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Light or grey hairs, small areas, laser-resistant hair, permanent removal.",
        tags: ["electrolysis", "permanent", "hair removal", "FDA"],
        doctor: "dr-zonera",
      },
      {
        slug: "led-light-therapy",
        name: "LED Light Therapy",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Therapeutic light wavelengths that heal, calm, and rejuvenate the skin without downtime.",
        description:
          "LED Light Therapy uses specific wavelengths of light — red for collagen stimulation and anti-aging, blue for acne-causing bacteria elimination, and near-infrared for deep tissue healing — to treat various skin concerns non-invasively. The treatment is painless, requires no downtime, and can be used as a standalone session or combined with other treatments for enhanced results. Regular sessions deliver cumulative improvements in skin health.",
        duration: "20–30 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Acne, inflammation, anti-aging, wound healing, post-treatment recovery.",
        tags: ["LED", "light therapy", "phototherapy", "healing"],
        doctor: "dr-zonera",
      },
      {
        slug: "laser-tattoo-removal",
        name: "Laser Tattoo Removal",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Q-switched laser technology that safely breaks down tattoo ink for gradual removal.",
        description:
          "Our laser tattoo removal uses Q-switched Nd:YAG laser technology to shatter tattoo ink particles into fragments small enough for the body's immune system to clear naturally. Multiple sessions are required, spaced 6–8 weeks apart, with the number depending on the tattoo's size, color, ink depth, and age. Black and dark blue inks respond best, while lighter colors may require additional sessions.",
        duration: "15–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Unwanted tattoos, faded tattoos for cover-up prep, partial removal.",
        tags: ["tattoo removal", "Q-switch", "laser", "ink"],
        doctor: "dr-zonera",
      },
      {
        slug: "photo-rejuvenation",
        name: "Photo Rejuvenation",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Intense Pulsed Light (IPL) therapy that targets sun damage, redness, and pigmentation for an even complexion.",
        description:
          "Photo Rejuvenation uses Intense Pulsed Light (IPL) to target and break down pigmented lesions, sun spots, broken capillaries, and diffuse redness. The broad-spectrum light is absorbed by the targeted chromophores in the skin, leaving surrounding tissue unharmed. This treatment evens out skin tone, reduces visible sun damage, and stimulates collagen for an overall refreshed appearance over a series of sessions.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Sun damage, age spots, rosacea, broken capillaries, uneven tone.",
        tags: ["IPL", "photo rejuvenation", "pigmentation", "sun damage"],
        doctor: "dr-zonera",
      },
      {
        slug: "acne-scar-treatment-laser",
        name: "Acne Scar Treatment (Laser)",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Fractional laser resurfacing that remodels scar tissue for smoother, more even skin.",
        description:
          "Our laser-based acne scar treatment uses fractional CO2 or erbium laser technology to create microscopic columns of thermal damage in scarred skin, triggering the body's wound-healing cascade to produce new collagen and remodel scar tissue. This treatment is highly effective for ice-pick, boxcar, and rolling acne scars. A series of 3–5 sessions spaced 4–6 weeks apart delivers significant improvement in scar depth and skin texture.",
        duration: "30–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Ice-pick scars, boxcar scars, rolling scars, pitted acne scarring.",
        tags: ["acne scars", "fractional laser", "resurfacing", "collagen"],
        doctor: "dr-zonera",
      },
      {
        slug: "stretch-marks-treatment",
        name: "Stretch Marks Treatment",
        category: "Laser Treatments",
        categorySlug: "laser-treatments",
        shortDesc:
          "Laser and microneedling therapies that reduce the appearance of stretch marks by stimulating skin repair.",
        description:
          "Our stretch marks treatment combines fractional laser technology with RF microneedling to stimulate collagen remodeling in the dermis where stretch marks form. The treatment targets both red/purple (new) and white/silver (mature) stretch marks, gradually blending them with the surrounding skin. Common treatment areas include the abdomen, thighs, hips, and upper arms. A course of 4–6 sessions delivers the most visible improvement.",
        duration: "30–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Post-pregnancy stretch marks, growth-related marks, weight fluctuation marks.",
        tags: ["stretch marks", "laser", "striae", "skin repair"],
        doctor: "dr-zonera",
      },
    ],
  },

  // ─── 4. IV Drips ─────────────────────────────────────────────────────
  {
    slug: "iv-drips",
    name: "IV Drips",
    description:
      "Medical-grade intravenous vitamin and nutrient infusions that deliver hydration, energy, and wellness support directly into the bloodstream for maximum absorption.",
    icon: "💧",
    treatments: [
      {
        slug: "hydration-drip",
        name: "Hydration Drip",
        category: "IV Drips",
        categorySlug: "iv-drips",
        shortDesc:
          "Rapid rehydration with electrolyte-balanced saline and essential vitamins.",
        description:
          "The Hydration Drip delivers a balanced electrolyte solution directly into your bloodstream, providing immediate and complete rehydration that drinking water alone cannot achieve. Enhanced with B-vitamins and vitamin C, this drip replenishes fluid levels, restores mineral balance, and leaves you feeling refreshed and energized. Ideal after travel, illness, exercise, or in the Lahore heat.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Dehydration, post-travel fatigue, hangover recovery, general wellness.",
        tags: ["IV", "hydration", "electrolytes", "wellness"],
        doctor: "dr-huma",
      },
      {
        slug: "nutrient-replenish-iv-drip",
        name: "Nutrient Replenish IV Drip",
        category: "IV Drips",
        categorySlug: "iv-drips",
        shortDesc:
          "A comprehensive vitamin and mineral infusion that replenishes nutritional deficiencies.",
        description:
          "The Nutrient Replenish IV Drip is a comprehensive blend of essential vitamins, minerals, and amino acids designed to correct nutritional deficiencies and optimize cellular function. This Myers' Cocktail-style infusion includes high-dose vitamin C, B-complex vitamins, magnesium, zinc, and glutathione. By bypassing the digestive system, IV delivery achieves 100% bioavailability for maximum therapeutic benefit.",
        duration: "45–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Nutritional deficiency, chronic fatigue, skin health, overall optimization.",
        tags: ["IV", "vitamins", "minerals", "replenish"],
        doctor: "dr-huma",
      },
      {
        slug: "energy-boost-iv-formula",
        name: "Energy Boost IV Formula",
        category: "IV Drips",
        categorySlug: "iv-drips",
        shortDesc:
          "A high-potency B-vitamin and amino acid infusion for sustained energy and mental clarity.",
        description:
          "The Energy Boost IV Formula combines high-dose B-complex vitamins (B1, B5, B6, B12), amino acids like taurine and L-carnitine, and co-factors that support mitochondrial energy production. This drip is designed for professionals, athletes, and anyone experiencing persistent fatigue or brain fog. The energy boost is noticeable within hours and sustains over several days, without the crash associated with caffeine or sugar.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Chronic fatigue, brain fog, athletic performance, demanding work schedules.",
        tags: ["IV", "energy", "B-vitamins", "performance"],
        doctor: "dr-huma",
      },
      {
        slug: "immune-support-iv-drip",
        name: "Immune Support IV Drip",
        category: "IV Drips",
        categorySlug: "iv-drips",
        shortDesc:
          "A high-dose vitamin C and zinc infusion that fortifies the immune system.",
        description:
          "The Immune Support IV Drip delivers therapeutic doses of vitamin C, zinc, selenium, and glutathione directly into the bloodstream to strengthen immune function and support the body's natural defense mechanisms. This drip is particularly valuable during seasonal changes, before travel, after exposure to illness, or for anyone with a weakened immune system seeking proactive protection.",
        duration: "45–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Immune boosting, seasonal illness prevention, post-illness recovery, travel prep.",
        tags: ["IV", "immune", "vitamin C", "zinc"],
        doctor: "dr-huma",
      },
      {
        slug: "detoxification-drip",
        name: "Detoxification Drip",
        category: "IV Drips",
        categorySlug: "iv-drips",
        shortDesc:
          "A glutathione-rich infusion that supports liver detoxification and antioxidant defense.",
        description:
          "The Detoxification Drip centers around high-dose glutathione — the body's master antioxidant — combined with alpha-lipoic acid, N-acetyl cysteine, and B-vitamins to support liver detoxification pathways and neutralize free radicals. This drip helps the body clear accumulated toxins, supports liver health, and as a side benefit, glutathione is known for its skin-brightening properties, leaving the complexion more luminous.",
        duration: "45–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Detoxification, liver support, skin brightening, antioxidant defense.",
        tags: ["IV", "detox", "glutathione", "antioxidant"],
        doctor: "dr-huma",
      },
    ],
  },

  // ─── 5. Body Contouring ──────────────────────────────────────────────
  {
    slug: "body-contouring",
    name: "Body Contouring",
    description:
      "Non-invasive and minimally invasive body sculpting treatments that eliminate stubborn fat, tighten skin, and reshape your silhouette without surgery.",
    icon: "🏋️",
    treatments: [
      {
        slug: "double-chin-treatment",
        name: "Double Chin Treatment",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "Targeted fat reduction and skin tightening to eliminate submental fullness and define the jawline.",
        description:
          "Our Double Chin Treatment uses injectable fat dissolvers (deoxycholic acid) or cryolipolysis to permanently destroy fat cells beneath the chin, combined with RF tightening to firm the overlying skin. The result is a visibly slimmer, more defined jawline and profile. Most clients require 2–4 sessions spaced 4–6 weeks apart to achieve their desired contour, with results that are permanent once the fat cells are eliminated.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Double chin, submental fat, jawline definition, profile improvement.",
        tags: ["double chin", "fat dissolving", "jawline", "contouring"],
        doctor: "dr-huma",
      },
      {
        slug: "fat-freeze-coolsculpting",
        name: "Fat Freeze (CoolSculpting)",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "FDA-cleared cryolipolysis technology that permanently freezes and eliminates stubborn fat cells.",
        description:
          "Fat Freeze (CoolSculpting) uses controlled cooling to target and crystallize fat cells beneath the skin, triggering a natural cell death process called apoptosis. The body then naturally eliminates these dead fat cells over 2–3 months, resulting in a 20–25% reduction in fat in the treated area. Common treatment areas include the abdomen, love handles, thighs, upper arms, and bra fat. Results are permanent as treated fat cells do not regenerate.",
        duration: "35–60 min per area",
        priceDisplay: "Consultation Required",
        bestFor:
          "Stubborn fat pockets, love handles, belly fat, post-diet plateau.",
        tags: ["coolsculpting", "fat freeze", "cryolipolysis", "body"],
      },
      {
        slug: "cavitation",
        name: "Cavitation",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "Ultrasonic waves that disrupt and break down localized fat deposits without surgery.",
        description:
          "Ultrasonic Cavitation uses low-frequency sound waves to create micro-bubbles within fat tissue, causing fat cell membranes to rupture and release their contents. The released triglycerides are then processed by the liver and eliminated naturally through the lymphatic system. This painless, non-invasive treatment is effective for reducing localized fat deposits and can be combined with RF body tightening for enhanced slimming and skin firming results.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Localized fat deposits, cellulite, non-surgical body slimming.",
        tags: ["cavitation", "ultrasound", "fat reduction", "slimming"],
      },
      {
        slug: "radio-frequency-body",
        name: "Radio Frequency Body",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "Radiofrequency energy tightens and firms loose body skin while reducing cellulite.",
        description:
          "Body RF Tightening uses radiofrequency energy to deliver controlled heat deep into the skin's dermal layers, stimulating collagen contraction and new collagen production for progressive firming and tightening. This treatment is particularly effective for post-weight-loss skin laxity, post-pregnancy tummy, and cellulite reduction. A course of 6–10 sessions delivers cumulative improvement in skin firmness and smoothness.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Loose body skin, cellulite, post-pregnancy tummy, skin laxity.",
        tags: ["RF", "body tightening", "cellulite", "skin firming"],
      },
      {
        slug: "liposuction-injections",
        name: "Liposuction Injections",
        category: "Body Contouring",
        categorySlug: "body-contouring",
        shortDesc:
          "Injectable fat dissolvers that break down localized fat deposits without surgery.",
        description:
          "Liposuction Injections use synthetic deoxycholic acid — a molecule that naturally occurs in the body to break down dietary fat — injected directly into targeted fat deposits to permanently destroy fat cells. The treatment is ideal for small to moderate fat pockets that resist diet and exercise, such as the double chin, jowls, bra fat, and knee fat. Multiple sessions spaced 4–6 weeks apart are typically needed for optimal results.",
        duration: "15–30 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Small fat deposits, non-surgical fat reduction, spot treatment.",
        tags: ["fat dissolving", "injections", "deoxycholic acid", "spot reduction"],
        doctor: "dr-huma",
      },
    ],
  },

  // ─── 6. Skin Treatments ──────────────────────────────────────────────
  {
    slug: "skin-treatments",
    name: "Skin Treatments",
    description:
      "Targeted clinical treatments that address specific skin concerns including dark circles, pigmentation, acne, and scarring using advanced dermatological protocols.",
    icon: "🧴",
    treatments: [
      {
        slug: "dark-circle-treatment",
        name: "Dark Circle Treatment",
        category: "Skin Treatments",
        categorySlug: "skin-treatments",
        shortDesc:
          "Multi-modal treatment targeting the underlying causes of under-eye darkness and hollowing.",
        description:
          "Our Dark Circle Treatment addresses the multiple factors that contribute to under-eye darkness — thinning skin, volume loss, pigmentation, and visible vasculature — using a combination of topical lightening agents, PRP, polynucleotides, and hyaluronic acid fillers as needed. The treatment plan is customized after a thorough assessment of the cause of your dark circles, ensuring targeted and effective results rather than a one-size-fits-all approach.",
        duration: "30–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Under-eye darkness, hollows, tired appearance, periorbital pigmentation.",
        tags: ["dark circles", "under-eye", "pigmentation", "rejuvenation"],
        doctor: "dr-huma",
      },
      {
        slug: "hyperpigmentation-treatment",
        name: "Hyperpigmentation Treatment",
        category: "Skin Treatments",
        categorySlug: "skin-treatments",
        shortDesc:
          "Clinical protocols targeting melasma, sun spots, and post-inflammatory hyperpigmentation.",
        description:
          "Our Hyperpigmentation Treatment uses a multi-layered approach combining chemical peels, targeted laser or IPL therapy, topical depigmenting agents, and strict sun protection to fade stubborn pigmentation. Whether your concern is melasma, sun damage, or post-inflammatory hyperpigmentation from acne, our dermatologist creates a phased treatment protocol tailored to your pigmentation type, skin tone, and lifestyle factors.",
        duration: "30–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Melasma, sun spots, post-acne marks, uneven skin tone.",
        tags: ["hyperpigmentation", "melasma", "dark spots", "brightening"],
        doctor: "dr-zonera",
      },
      {
        slug: "acne-scar-treatment",
        name: "Acne Scar Treatment",
        category: "Skin Treatments",
        categorySlug: "skin-treatments",
        shortDesc:
          "Comprehensive scar revision combining microneedling, peels, and subcision for smoother skin.",
        description:
          "Our Acne Scar Treatment combines multiple modalities — RF microneedling, TCA Cross for ice-pick scars, subcision for tethered scars, and chemical peels for textural improvement — into a comprehensive scar revision protocol. Each treatment session is customized based on your scar type, depth, and distribution. A series of 4–6 sessions delivers significant improvement in scar depth, skin texture, and overall complexion evenness.",
        duration: "45–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Ice-pick scars, boxcar scars, rolling scars, post-acne texture.",
        tags: ["acne scars", "microneedling", "subcision", "scar revision"],
        doctor: "dr-zonera",
      },
      {
        slug: "acne-treatment",
        name: "Acne Treatment",
        category: "Skin Treatments",
        categorySlug: "skin-treatments",
        shortDesc:
          "A structured clinical program to clear active acne and prevent future breakouts.",
        description:
          "Our Acne Treatment is a structured clinical program that combines in-clinic procedures — medical-grade facials, chemical peels, LED therapy, and comedone extraction — with a personalized at-home skincare regimen to clear active acne and prevent recurrence. Our dermatologist assesses your acne type, severity, and contributing factors to create a phased treatment plan that targets the root causes, not just the symptoms.",
        duration: "30–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Persistent acne, hormonal breakouts, comedonal acne, cystic acne.",
        tags: ["acne", "breakouts", "clinical", "treatment program"],
        doctor: "dr-zonera",
      },
      {
        slug: "chemical-peels",
        name: "Chemical Peels",
        category: "Skin Treatments",
        categorySlug: "skin-treatments",
        shortDesc:
          "Controlled acid exfoliation that resurfaces the skin for improved tone, texture, and clarity.",
        description:
          "Our Chemical Peels range from superficial to medium-depth, using medical-grade glycolic, salicylic, lactic, TCA, or Jessner's solution to exfoliate damaged surface layers and accelerate cell turnover. The type and concentration of acid is selected by our dermatologist based on your specific skin concern, skin type, and tolerance. Superficial peels have minimal downtime, while deeper peels produce more dramatic results with 5–7 days of controlled peeling.",
        duration: "20–30 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Dull skin, pigmentation, fine lines, acne marks, rough texture.",
        tags: ["chemical peel", "exfoliation", "resurfacing", "acids"],
        doctor: "dr-zonera",
      },
      {
        slug: "prp-facial",
        name: "PRP Facial",
        category: "Skin Treatments",
        categorySlug: "skin-treatments",
        shortDesc:
          "Your blood's concentrated growth factors applied to the face for natural rejuvenation and collagen stimulation.",
        description:
          "The PRP Facial draws a small sample of your blood, processes it in a centrifuge to concentrate the platelet-rich plasma containing growth factors, and applies it to the face via microneedling or injection. These natural growth factors stimulate fibroblasts to produce new collagen, accelerate healing, and provide a natural radiance. This treatment is ideal for those seeking rejuvenation without synthetic products, with results improving over 4–6 weeks.",
        duration: "60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Natural rejuvenation, collagen stimulation, anti-aging without synthetics.",
        tags: ["PRP", "facial", "growth factors", "natural"],
        doctor: "dr-huma",
      },
      {
        slug: "mesotherapy",
        name: "Mesotherapy",
        category: "Skin Treatments",
        categorySlug: "skin-treatments",
        shortDesc:
          "Microinjections of vitamins, minerals, and hyaluronic acid for targeted skin nourishment and rejuvenation.",
        description:
          "Mesotherapy delivers a customized cocktail of vitamins, minerals, amino acids, and hyaluronic acid directly into the mesoderm (middle layer of skin) through a series of superficial microinjections. This targeted delivery nourishes the skin from within, improving hydration, elasticity, and luminosity. Mesotherapy is versatile — it can address facial aging, dull skin, hair loss, and even localized fat deposits depending on the active ingredients selected.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Dull skin, dehydration, fine lines, overall skin revitalization.",
        tags: ["mesotherapy", "vitamins", "microinjections", "rejuvenation"],
        doctor: "dr-huma",
      },
    ],
  },

  // ─── 7. Skin Lesions ─────────────────────────────────────────────────
  {
    slug: "skin-lesions",
    name: "Skin Lesions",
    description:
      "Safe and precise removal of benign skin growths, marks, and lesions using advanced laser, cautery, and cryotherapy techniques.",
    icon: "🔬",
    treatments: [
      {
        slug: "wart-removal",
        name: "Wart Removal",
        category: "Skin Lesions",
        categorySlug: "skin-lesions",
        shortDesc:
          "Professional removal of common, plantar, and flat warts using cautery or cryotherapy.",
        description:
          "Our Wart Removal service uses electrocautery, cryotherapy (liquid nitrogen), or laser ablation to safely and effectively remove warts caused by the human papillomavirus (HPV). The method chosen depends on the wart's type, size, location, and your skin type. Treatment is quick with minimal discomfort, and healing typically occurs within 1–2 weeks. Stubborn or recurrent warts may require multiple sessions.",
        duration: "15–30 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Common warts, plantar warts, flat warts, filiform warts.",
        tags: ["wart", "removal", "cautery", "cryotherapy"],
        doctor: "dr-zonera",
      },
      {
        slug: "mole-removal",
        name: "Mole Removal",
        category: "Skin Lesions",
        categorySlug: "skin-lesions",
        shortDesc:
          "Safe excision or ablation of unwanted moles with minimal scarring.",
        description:
          "Our Mole Removal service safely eliminates unwanted moles using surgical excision, shave excision, or laser ablation depending on the mole's depth, size, and location. Every mole is assessed by our dermatologist prior to removal, and suspicious moles are sent for histopathological examination. The procedure is performed under local anesthesia with meticulous technique to minimize scarring and ensure complete removal.",
        duration: "15–30 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Cosmetically bothersome moles, raised moles, moles in friction areas.",
        tags: ["mole", "removal", "excision", "skin lesion"],
        doctor: "dr-zonera",
      },
      {
        slug: "freckle-removal",
        name: "Freckle Removal",
        category: "Skin Lesions",
        categorySlug: "skin-lesions",
        shortDesc:
          "Laser or IPL treatment to fade or eliminate unwanted freckles and sun spots.",
        description:
          "Our Freckle Removal treatment uses targeted laser or IPL (Intense Pulsed Light) technology to break down the excess melanin in freckles and sun spots, allowing the body to naturally clear the pigment over the following days. The treated freckles darken and crust before flaking off, revealing clearer skin beneath. Most clients see significant clearance in 1–3 sessions, with strict sun protection required to prevent recurrence.",
        duration: "15–30 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Freckles, sun spots, lentigines, patchy pigmentation.",
        tags: ["freckle", "removal", "IPL", "pigmentation"],
        doctor: "dr-zonera",
      },
      {
        slug: "birth-mark-treatment",
        name: "Birth Mark Treatment",
        category: "Skin Lesions",
        categorySlug: "skin-lesions",
        shortDesc:
          "Laser treatment to lighten or remove congenital birthmarks safely and effectively.",
        description:
          "Our Birth Mark Treatment uses specialized laser technology — Q-switched or pulsed dye lasers depending on the birthmark type — to safely lighten or remove congenital pigmented or vascular birthmarks. The laser selectively targets the pigment or blood vessels within the birthmark without damaging surrounding skin. Multiple sessions are typically required, spaced 6–8 weeks apart, with gradual lightening visible after each treatment.",
        duration: "15–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Cafe-au-lait spots, port-wine stains, congenital melanocytic nevi.",
        tags: ["birthmark", "laser", "congenital", "pigmentation"],
        doctor: "dr-zonera",
      },
    ],
  },

  // ─── 8. Hair Treatments ──────────────────────────────────────────────
  {
    slug: "hair-treatments",
    name: "Hair Treatments",
    description:
      "Comprehensive hair restoration and scalp health treatments using PRP, stem cells, mesotherapy, and transplant surgery to combat hair loss and promote regrowth.",
    icon: "💇",
    treatments: [
      {
        slug: "hair-prp",
        name: "Hair PRP",
        category: "Hair Treatments",
        categorySlug: "hair-treatments",
        shortDesc:
          "Platelet-rich plasma scalp injections that stimulate dormant follicles and promote thicker hair growth.",
        description:
          "Hair PRP therapy extracts and concentrates growth factors from your own blood, then injects them into the scalp at areas of thinning. These concentrated growth factors stimulate dormant follicles, extend the active growth phase of hair, and increase hair shaft thickness. A course of 4–6 sessions spaced monthly is recommended for optimal results, with maintenance sessions every 3–4 months to sustain hair density improvements.",
        duration: "45–60 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Thinning hair, early-stage hair loss, male and female pattern baldness.",
        tags: ["PRP", "hair loss", "regrowth", "scalp"],
        doctor: "dr-huma",
      },
      {
        slug: "stem-cell-therapy",
        name: "Stem Cell Therapy",
        category: "Hair Treatments",
        categorySlug: "hair-treatments",
        shortDesc:
          "Advanced regenerative treatment using stem cell-derived growth factors to revive hair follicles.",
        description:
          "Stem Cell Therapy for hair loss uses concentrated stem cell-derived growth factors to regenerate weakened or miniaturized hair follicles. The treatment can utilize either autologous stem cells (derived from your own adipose tissue or blood) or plant-based stem cell extracts, depending on the protocol. This cutting-edge approach stimulates follicular stem cells to re-enter the active growth phase, potentially restoring hair in areas where other treatments have plateaued.",
        duration: "60–90 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Advanced thinning, treatment-resistant hair loss, follicle regeneration.",
        tags: ["stem cell", "regenerative", "hair loss", "advanced"],
        doctor: "dr-huma",
      },
      {
        slug: "hair-transplant",
        name: "Hair Transplant",
        category: "Hair Treatments",
        categorySlug: "hair-treatments",
        shortDesc:
          "Permanent surgical hair restoration using FUE technique for natural, undetectable results.",
        description:
          "Our Hair Transplant service uses the FUE (Follicular Unit Extraction) technique, where individual hair follicles are harvested from the donor area (typically the back of the head) and implanted into areas of baldness or thinning. Each follicle is placed at the correct angle and density to mimic natural hair growth patterns for undetectable results. The transplanted hair is permanent, growing naturally for life. Results become fully visible at 9–12 months post-procedure.",
        duration: "4–8 hours",
        priceDisplay: "Consultation Required",
        bestFor:
          "Male pattern baldness, receding hairline, crown thinning, permanent restoration.",
        tags: ["hair transplant", "FUE", "permanent", "surgical"],
        doctor: "dr-zulfiqar",
      },
      {
        slug: "hair-mesotherapy",
        name: "Hair Mesotherapy",
        category: "Hair Treatments",
        categorySlug: "hair-treatments",
        shortDesc:
          "Vitamin and mineral microinjections into the scalp for healthier, stronger hair.",
        description:
          "Hair Mesotherapy delivers a customized cocktail of vitamins, minerals, amino acids, and vasodilators directly into the scalp via microinjections. This nourishes hair follicles at the root level, improves blood circulation to the scalp, and strengthens hair from within. The treatment is particularly effective for diffuse thinning, brittle hair, and can be combined with PRP for enhanced results. A course of 8–10 sessions spaced weekly or biweekly is recommended.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Diffuse thinning, weak hair, scalp nourishment, hair strengthening.",
        tags: ["mesotherapy", "hair", "vitamins", "scalp"],
        doctor: "dr-huma",
      },
      {
        slug: "led-light-therapy-hair",
        name: "LED Light Therapy (Hair)",
        category: "Hair Treatments",
        categorySlug: "hair-treatments",
        shortDesc:
          "Low-level laser/LED therapy that stimulates hair follicles and promotes regrowth without injections.",
        description:
          "LED Light Therapy for hair uses specific wavelengths of red and near-infrared light to stimulate cellular metabolism in hair follicles, increase blood flow to the scalp, and extend the anagen (growth) phase of the hair cycle. This non-invasive, painless treatment is suitable for those who prefer a needle-free approach to hair restoration. It can be used as a standalone treatment or to enhance results from PRP and mesotherapy protocols.",
        duration: "20–30 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Early hair thinning, needle-phobic clients, adjunct to PRP/mesotherapy.",
        tags: ["LED", "light therapy", "hair growth", "non-invasive"],
        doctor: "dr-huma",
      },
    ],
  },

  // ─── 9. Non-Surgical Treatments ──────────────────────────────────────
  {
    slug: "non-surgical-treatments",
    name: "Non-Surgical Treatments",
    description:
      "Minimally invasive alternatives to surgery that reshape, enhance, and rejuvenate using threads, fillers, and advanced injectables — with minimal downtime.",
    icon: "🪡",
    treatments: [
      {
        slug: "thread-lift",
        name: "Thread Lift",
        category: "Non-Surgical Treatments",
        categorySlug: "non-surgical-treatments",
        shortDesc:
          "Absorbable threads placed beneath the skin to lift sagging tissue and stimulate long-term collagen production.",
        description:
          "The Thread Lift involves inserting fine, absorbable PDO or PLLA threads beneath the skin to create an immediate mechanical lift of sagging tissue. As the threads dissolve over 6–12 months, they stimulate collagen production along their path, providing continued tightening and rejuvenation. This treatment is ideal for midface lifting, jawline definition, and neck tightening, offering a non-surgical alternative to a facelift with minimal downtime.",
        duration: "60–90 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Midface sagging, jowls, neck laxity, non-surgical facelift.",
        tags: ["thread lift", "PDO", "lifting", "collagen"],
        doctor: "dr-huma",
      },
      {
        slug: "nose-reshaping-non-surgical",
        name: "Nose Reshaping (Non-Surgical)",
        category: "Non-Surgical Treatments",
        categorySlug: "non-surgical-treatments",
        shortDesc:
          "Dermal filler and thread-based nose reshaping for a refined profile without surgery.",
        description:
          "Non-Surgical Nose Reshaping uses hyaluronic acid fillers and/or PDO threads to straighten the nasal bridge, lift a drooping tip, smooth bumps, and improve overall nasal symmetry — all without a single incision. The procedure takes under 30 minutes, results are immediate, and there is minimal to no downtime. While the results are temporary (lasting 12–18 months), this treatment is an excellent option for those seeking refinement without committing to rhinoplasty surgery.",
        duration: "15–30 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Nasal bump, droopy tip, flat bridge, non-surgical rhinoplasty.",
        tags: ["nose reshaping", "non-surgical", "fillers", "threads"],
        doctor: "dr-huma",
      },
      {
        slug: "lip-rejuvenation",
        name: "Lip Rejuvenation",
        category: "Non-Surgical Treatments",
        categorySlug: "non-surgical-treatments",
        shortDesc:
          "Injectable treatments that restore lip volume, define borders, and smooth fine lines around the mouth.",
        description:
          "Lip Rejuvenation uses premium hyaluronic acid fillers to add volume, define the cupid's bow, correct asymmetry, and smooth perioral lines (smoker's lines) around the mouth. Our physician uses precise micro-dosing techniques and a layered approach to ensure natural-looking results that complement your facial proportions. Results are immediate with minimal swelling, lasting 6–12 months depending on the product used and your metabolism.",
        duration: "20–30 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Thin lips, volume loss, asymmetry, lip border definition, perioral lines.",
        tags: ["lips", "fillers", "volume", "rejuvenation"],
        doctor: "dr-huma",
      },
      {
        slug: "hyperhidrosis-treatment",
        name: "Hyperhidrosis Treatment",
        category: "Non-Surgical Treatments",
        categorySlug: "non-surgical-treatments",
        shortDesc:
          "Botulinum toxin injections that effectively control excessive sweating in targeted areas.",
        description:
          "Our Hyperhidrosis Treatment uses botulinum toxin (Botox) injections to block the nerve signals that trigger excessive sweating. The treatment is highly effective for the underarms, palms, and soles of the feet, providing 6–12 months of significant sweat reduction. For many patients, this treatment is life-changing — eliminating the social embarrassment and practical inconvenience of hyperhidrosis without surgery.",
        duration: "20–30 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Excessive underarm sweating, sweaty palms, social confidence.",
        tags: ["hyperhidrosis", "sweating", "botox", "sweat control"],
        doctor: "dr-huma",
      },
      {
        slug: "breast-enhancement-non-surgical",
        name: "Breast Enhancement (Non-Surgical)",
        category: "Non-Surgical Treatments",
        categorySlug: "non-surgical-treatments",
        shortDesc:
          "Non-invasive breast lifting and volume enhancement using fillers or fat transfer techniques.",
        description:
          "Non-Surgical Breast Enhancement offers subtle volume increase and improved breast contour using dermal fillers (hyaluronic acid-based macrolane) or autologous fat transfer. These minimally invasive techniques provide a modest, natural-looking enhancement without implants, general anesthesia, or significant downtime. Ideal for patients seeking a subtle improvement of one-half to one cup size, or those who wish to restore volume lost after breastfeeding or weight loss.",
        duration: "60–90 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Subtle breast enhancement, volume restoration, implant-free approach.",
        tags: ["breast enhancement", "non-surgical", "fillers", "volume"],
        doctor: "dr-huma",
      },
      {
        slug: "body-enhancement",
        name: "Body Enhancement",
        category: "Non-Surgical Treatments",
        categorySlug: "non-surgical-treatments",
        shortDesc:
          "Non-surgical body sculpting and enhancement using fillers, threads, and energy-based devices.",
        description:
          "Our Non-Surgical Body Enhancement services use a combination of dermal fillers, PDO threads, and energy-based devices to contour and enhance various body areas without surgery. Treatments can address hip dips, buttock contouring, hand rejuvenation, and décolletage smoothing. Each treatment plan is customized to your body goals, providing subtle, natural-looking improvements with minimal recovery time compared to surgical alternatives.",
        duration: "45–90 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Hip dips, buttock shaping, hand rejuvenation, body contouring.",
        tags: ["body enhancement", "non-surgical", "contouring", "fillers"],
        doctor: "dr-huma",
      },
      {
        slug: "neck-lines-treatment",
        name: "Neck Lines Treatment",
        category: "Non-Surgical Treatments",
        categorySlug: "non-surgical-treatments",
        shortDesc:
          "Targeted treatment for horizontal neck lines and vertical platysmal bands using Botox and fillers.",
        description:
          "Our Neck Lines Treatment addresses both horizontal necklace lines and vertical platysmal bands using a combination of micro-Botox to relax the platysma muscle, hyaluronic acid fillers to smooth deep creases, and skin booster injections to improve overall neck skin quality. The neck is one of the first areas to show aging, and this treatment restores a smoother, more youthful neck contour without surgery.",
        duration: "30–45 min",
        priceDisplay: "Consultation Required",
        bestFor:
          "Horizontal neck lines, platysmal bands, tech neck, neck aging.",
        tags: ["neck lines", "platysma", "anti-aging", "rejuvenation"],
        doctor: "dr-huma",
      },
    ],
  },

  // ─── 10. Surgical Treatments ─────────────────────────────────────────
  {
    slug: "surgical-treatments",
    name: "Surgical Treatments",
    description:
      "Board-certified plastic surgery procedures performed to the highest safety standards for transformative, lasting results under the care of Dr. Zulfiqar.",
    icon: "🏥",
    treatments: [
      {
        slug: "liposuction",
        name: "Liposuction",
        category: "Surgical Treatments",
        categorySlug: "surgical-treatments",
        shortDesc:
          "Surgical fat removal that permanently reshapes the body contour for a slimmer silhouette.",
        description:
          "Liposuction is a surgical body contouring procedure that permanently removes excess fat deposits from targeted areas including the abdomen, flanks, thighs, arms, and chin. Using advanced tumescent and power-assisted techniques, our plastic surgeon sculpts precise body contours with minimal bruising and faster recovery. The procedure is performed under local or general anesthesia depending on the extent of treatment, with results fully visible at 3–6 months.",
        duration: "1–3 hours",
        priceDisplay: "Consultation Required",
        bestFor:
          "Stubborn fat deposits, body sculpting, permanent fat removal.",
        tags: ["liposuction", "fat removal", "body contouring", "surgical"],
        doctor: "dr-zulfiqar",
      },
      {
        slug: "nose-reshaping-rhinoplasty",
        name: "Nose Reshaping (Rhinoplasty)",
        category: "Surgical Treatments",
        categorySlug: "surgical-treatments",
        shortDesc:
          "Surgical nose reshaping to refine nasal structure, improve symmetry, and enhance facial harmony.",
        description:
          "Rhinoplasty is a surgical procedure that reshapes the nose to improve its appearance, proportion, and facial harmony. Our plastic surgeon can reduce or augment the nasal bridge, refine the tip, narrow wide nostrils, correct asymmetry, and address breathing difficulties. The procedure is performed using either open or closed technique depending on the complexity, with results settling over 6–12 months as swelling gradually resolves.",
        duration: "2–3 hours",
        priceDisplay: "Consultation Required",
        bestFor:
          "Nasal hump, bulbous tip, wide nostrils, deviated septum, facial harmony.",
        tags: ["rhinoplasty", "nose job", "reshaping", "surgical"],
        doctor: "dr-zulfiqar",
      },
      {
        slug: "breast-augmentation",
        name: "Breast Augmentation",
        category: "Surgical Treatments",
        categorySlug: "surgical-treatments",
        shortDesc:
          "Surgical breast enlargement using implants or fat transfer for enhanced size and shape.",
        description:
          "Breast Augmentation enhances breast size, shape, and symmetry using silicone or saline implants, or autologous fat transfer. Our plastic surgeon works closely with each patient to select the optimal implant type, size, profile, and placement (above or below the muscle) to achieve natural-looking results that complement their body frame. The procedure is performed under general anesthesia with a recovery period of 4–6 weeks.",
        duration: "1.5–2.5 hours",
        priceDisplay: "Consultation Required",
        bestFor:
          "Small breast size, asymmetry, post-breastfeeding volume loss.",
        tags: ["breast augmentation", "implants", "enlargement", "surgical"],
        doctor: "dr-zulfiqar",
      },
      {
        slug: "breast-reduction",
        name: "Breast Reduction",
        category: "Surgical Treatments",
        categorySlug: "surgical-treatments",
        shortDesc:
          "Surgical reduction of breast size to alleviate discomfort and achieve a proportionate figure.",
        description:
          "Breast Reduction surgery removes excess breast tissue, fat, and skin to achieve a breast size proportionate to the patient's body frame. Beyond cosmetic improvement, this procedure often provides significant relief from chronic back, neck, and shoulder pain, skin irritation, and the physical limitations caused by overly large breasts. Our plastic surgeon uses techniques that minimize scarring while achieving a lifted, natural breast shape.",
        duration: "2–3 hours",
        priceDisplay: "Consultation Required",
        bestFor:
          "Overly large breasts, chronic pain, skin irritation, physical limitation.",
        tags: ["breast reduction", "reduction", "relief", "surgical"],
        doctor: "dr-zulfiqar",
      },
      {
        slug: "eyelid-surgery-blepharoplasty",
        name: "Eyelid Surgery (Blepharoplasty)",
        category: "Surgical Treatments",
        categorySlug: "surgical-treatments",
        shortDesc:
          "Surgical removal of excess eyelid skin and fat to restore a youthful, alert eye appearance.",
        description:
          "Blepharoplasty (eyelid surgery) removes excess skin, muscle, and fat from the upper and/or lower eyelids to rejuvenate the eye area. Upper blepharoplasty corrects hooding that can impair vision and make the eyes look tired, while lower blepharoplasty addresses under-eye bags and puffiness. The procedure is performed under local anesthesia with sedation, and incisions are hidden within the natural eyelid crease for virtually invisible scarring.",
        duration: "1–2 hours",
        priceDisplay: "Consultation Required",
        bestFor:
          "Droopy eyelids, under-eye bags, hooded eyes, tired appearance.",
        tags: ["blepharoplasty", "eyelid surgery", "eye rejuvenation", "surgical"],
        doctor: "dr-zulfiqar",
      },
      {
        slug: "face-lift-surgery",
        name: "Face Lift Surgery",
        category: "Surgical Treatments",
        categorySlug: "surgical-treatments",
        shortDesc:
          "Comprehensive surgical lifting and tightening of the face and neck for dramatic rejuvenation.",
        description:
          "A surgical facelift (rhytidectomy) addresses significant sagging of the midface, jowls, and neck by repositioning deeper facial tissues, removing excess skin, and tightening the underlying muscular layer (SMAS). Our plastic surgeon uses advanced techniques that produce natural, wind-swept-free results with long-lasting rejuvenation of 8–10 years. The procedure is performed under general anesthesia with a recovery period of 2–3 weeks.",
        duration: "3–5 hours",
        priceDisplay: "Consultation Required",
        bestFor:
          "Significant sagging, deep jowls, loose neck, comprehensive rejuvenation.",
        tags: ["facelift", "rhytidectomy", "lifting", "surgical"],
        doctor: "dr-zulfiqar",
      },
      {
        slug: "buttock-lift-bbl",
        name: "Buttock Lift (BBL)",
        category: "Surgical Treatments",
        categorySlug: "surgical-treatments",
        shortDesc:
          "Brazilian Butt Lift using autologous fat transfer to enhance buttock shape and projection.",
        description:
          "The Brazilian Butt Lift (BBL) is a two-in-one procedure that combines liposuction of donor areas (abdomen, flanks, thighs) with strategic fat transfer to the buttocks. The harvested fat is purified and injected in multiple layers to enhance buttock volume, shape, and projection while simultaneously slimming the areas where fat was removed. This procedure uses your own tissue for natural-looking, natural-feeling results with dual benefit body contouring.",
        duration: "3–4 hours",
        priceDisplay: "Consultation Required",
        bestFor:
          "Flat buttocks, buttock asymmetry, body contouring, volume enhancement.",
        tags: ["BBL", "buttock lift", "fat transfer", "contouring"],
        doctor: "dr-zulfiqar",
      },
      {
        slug: "brow-lift",
        name: "Brow Lift",
        category: "Surgical Treatments",
        categorySlug: "surgical-treatments",
        shortDesc:
          "Surgical elevation of drooping brows to restore a youthful, alert, and refreshed appearance.",
        description:
          "A Brow Lift (forehead lift) surgically elevates drooping brows, smooths forehead wrinkles, and reduces frown lines between the eyebrows. Our plastic surgeon uses endoscopic techniques through small, hidden incisions to reposition the brow to a more youthful height while maintaining natural expression. The procedure opens up the eye area, reduces hooding of the upper eyelids, and restores a refreshed, alert appearance that lasts 5–10 years.",
        duration: "1–2 hours",
        priceDisplay: "Consultation Required",
        bestFor:
          "Drooping brows, forehead lines, frown lines, tired or angry appearance.",
        tags: ["brow lift", "forehead lift", "endoscopic", "surgical"],
        doctor: "dr-zulfiqar",
      },
    ],
  },

  // ─── 11. Skin Health ─────────────────────────────────────────────────
  {
    slug: "skin-health",
    name: "Skin Health",
    description:
      "Science-backed nutritional and supplement protocols that support skin health from the inside out, building the foundation for lasting results from aesthetic treatments.",
    icon: "🌿",
    treatments: [
      {
        slug: "antioxidants-collagen-building-nutrients",
        name: "Antioxidants + Collagen-Building Nutrients",
        category: "Skin Health",
        categorySlug: "skin-health",
        shortDesc:
          "A physician-guided nutritional protocol of antioxidants and collagen-building supplements for healthier skin from within.",
        description:
          "Our Antioxidants + Collagen-Building Nutrients program is a physician-curated supplement and nutritional protocol designed to support your skin from the inside out. The program includes high-grade antioxidants (vitamins C, E, astaxanthin), collagen peptides, hyaluronic acid, zinc, and omega-3 fatty acids in therapeutic doses. This evidence-based approach complements your in-clinic treatments by providing the raw materials your body needs to produce healthy collagen, fight oxidative stress, and maintain skin elasticity.",
        duration: "Ongoing program",
        priceDisplay: "Consultation Required",
        bestFor:
          "Overall skin health, collagen support, anti-aging from within, treatment enhancement.",
        tags: ["antioxidants", "collagen", "supplements", "skin health"],
        doctor: "dr-huma",
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

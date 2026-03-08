export interface LandingPage {
  slug: string;
  treatment: string;
  headline: string;
  subheadline: string;
  problem_points: string[];
  solution_points: string[];
  steps: { title: string; description: string }[];
  faqs: { q: string; a: string }[];
  price_display: string;
  cta_text: string;
  whatsapp_message: string;
  meta_title: string;
  meta_description: string;
}

export const landingPages: LandingPage[] = [
  // ─── Laser Hair Removal ──────────────────────────────────────────
  {
    slug: 'laser-hair-removal',
    treatment: 'Full Body Laser Hair Removal',
    headline: 'Silky Smooth Skin — Permanently',
    subheadline:
      'Say goodbye to razors, waxing pain, and ingrown hairs. Our FDA-approved laser technology delivers permanent hair reduction in just 6-8 sessions.',
    problem_points: [
      'Tired of painful waxing appointments every few weeks?',
      'Dealing with razor burns, ingrown hairs, and dark spots?',
      'Spending thousands on temporary hair removal that never lasts?',
    ],
    solution_points: [
      'Medical-grade diode laser targets hair follicles at the root — permanently.',
      'Cool-tip technology means virtually painless sessions, even on sensitive areas.',
      'Full body coverage in under 90 minutes — face, underarms, arms, legs, bikini, and more.',
    ],
    steps: [
      {
        title: 'Free Consultation',
        description:
          'Our doctor assesses your skin type, hair texture, and creates a personalized treatment plan. No obligation.',
      },
      {
        title: 'Treatment Session',
        description:
          'Relax in our private treatment room. Each session takes 60-90 minutes for full body. Most clients describe it as a warm tingling sensation.',
      },
      {
        title: 'Visible Results',
        description:
          'See 20-30% hair reduction after your very first session. By session 3, you will notice dramatically smoother skin.',
      },
      {
        title: 'Maintenance',
        description:
          'After 6-8 sessions, enjoy permanently smooth skin. Optional annual touch-up sessions keep results flawless.',
      },
    ],
    faqs: [
      {
        q: 'How many sessions do I need?',
        a: 'Most clients need 6-8 sessions spaced 4-6 weeks apart for optimal permanent results. Your doctor will create a personalized plan during your free consultation.',
      },
      {
        q: 'Is it painful?',
        a: 'Our advanced diode laser has integrated cooling technology that makes treatments virtually painless. Most clients compare it to a light rubber band snap — far less painful than waxing.',
      },
      {
        q: 'Is it safe for all skin tones?',
        a: 'Yes. Our medical-grade laser is safe and effective for all skin tones, from fair to dark. Our doctors adjust settings specifically for your skin type.',
      },
      {
        q: 'What areas can be treated?',
        a: 'We treat all body areas: face, upper lip, chin, underarms, full arms, chest, back, stomach, bikini/Brazilian, full legs, and more.',
      },
      {
        q: 'How long do results last?',
        a: 'Results are permanent. After completing your sessions, 90%+ of hair is gone forever. Some clients do an annual touch-up session for any hormonal regrowth.',
      },
    ],
    price_display: 'Starting from PKR 15,000/session',
    cta_text: 'Book Free Consultation',
    whatsapp_message:
      "Hi, I'm interested in Full Body Laser Hair Removal at Aesthetic Lounge. I'd like to book a free consultation.",
    meta_title: 'Full Body Laser Hair Removal in Lahore — Aesthetic Lounge',
    meta_description:
      'Permanent hair removal with FDA-approved laser technology. Pain-free, all skin tones. Free consultation at DHA Phase 8, Lahore. Book now.',
  },

  // ─── HydraFacial ─────────────────────────────────────────────────
  {
    slug: 'hydrafacial',
    treatment: 'HydraFacial',
    headline: 'The Best Skin of Your Life — In 45 Minutes',
    subheadline:
      'The celebrity-favourite facial that cleanses, extracts, and hydrates in one session. Walk in tired, walk out glowing. Zero downtime.',
    problem_points: [
      'Dull, tired-looking skin that no amount of home skincare can fix?',
      'Enlarged pores, blackheads, and uneven skin texture ruining your confidence?',
      'Tried expensive serums and creams with zero visible results?',
    ],
    solution_points: [
      'Patented Vortex-Fusion technology deep-cleanses and extracts without irritation.',
      'Infuses skin with antioxidants, peptides, and hyaluronic acid for instant hydration.',
      'Visible results from the very first session — your skin will literally glow when you leave.',
    ],
    steps: [
      {
        title: 'Skin Analysis',
        description:
          'Our aesthetician analyzes your skin under professional lighting and selects the perfect serum cocktail for your concerns.',
      },
      {
        title: 'Deep Cleanse & Peel',
        description:
          'Gentle resurfacing removes dead skin cells. Painless acid peel uncovers fresh, healthy skin underneath.',
      },
      {
        title: 'Extract & Hydrate',
        description:
          'Vortex suction painlessly removes blackheads and impurities. Skin is immediately flooded with nourishing serums.',
      },
      {
        title: 'Protect & Glow',
        description:
          'Antioxidant protection and LED therapy lock in results. Leave with visibly brighter, plumper, younger-looking skin.',
      },
    ],
    faqs: [
      {
        q: 'How often should I get a HydraFacial?',
        a: 'For best results, we recommend monthly sessions. Many clients come in before special events for an instant glow boost. Your skin improves with each session.',
      },
      {
        q: 'Is there any downtime?',
        a: 'Zero downtime. You can apply makeup and return to your day immediately. Most clients come during lunch breaks and go straight back to work — looking noticeably better.',
      },
      {
        q: 'Is it suitable for sensitive skin?',
        a: 'Absolutely. HydraFacial is one of the gentlest professional treatments available. Our doctors customize the serum selection for sensitive, acne-prone, and even rosacea-affected skin.',
      },
      {
        q: 'What results can I expect?',
        a: 'Immediately after: brighter, more hydrated skin with visibly smaller pores. Over time: reduced fine lines, more even tone, and clearer complexion. Results improve with regular sessions.',
      },
      {
        q: 'Can I combine it with other treatments?',
        a: 'Yes! HydraFacial pairs beautifully with LED therapy, micro-needling, and chemical peels. Our doctors can create a comprehensive skin rejuvenation plan during your consultation.',
      },
    ],
    price_display: 'Starting from PKR 12,000/session',
    cta_text: 'Book Your HydraFacial',
    whatsapp_message:
      "Hi, I'm interested in a HydraFacial treatment at Aesthetic Lounge. I'd like to book a session.",
    meta_title: 'HydraFacial Treatment in Lahore — Aesthetic Lounge',
    meta_description:
      'Celebrity-favourite HydraFacial at DHA Phase 8. Deep cleanse, extract, hydrate in 45 min. Zero downtime, instant glow. Book now.',
  },

  // ─── Botox ────────────────────────────────────────────────────────
  {
    slug: 'botox',
    treatment: 'Botox Anti-Aging',
    headline: 'Turn Back Time — Without Surgery',
    subheadline:
      'Smooth away wrinkles and fine lines with precision Botox injections by board-certified doctors. Natural results. 15-minute treatment. Zero downtime.',
    problem_points: [
      'Forehead lines, crow\'s feet, or frown lines making you look older than you feel?',
      'Worried about looking "frozen" or unnatural with anti-aging treatments?',
      'Considering surgery but want something safer, faster, and more affordable first?',
    ],
    solution_points: [
      'FDA-approved Botox by Allergan — the gold standard in wrinkle treatment worldwide.',
      'Our doctors use micro-dosing technique for natural movement while eliminating wrinkles.',
      'Results visible in 3-5 days. Full effect in 2 weeks. Lasts 4-6 months.',
    ],
    steps: [
      {
        title: 'Expert Consultation',
        description:
          'Board-certified doctor maps your facial muscles, discusses your goals, and designs a treatment plan that preserves your natural expressions.',
      },
      {
        title: 'Precision Treatment',
        description:
          'Using ultra-fine needles, targeted micro-doses of Botox are placed precisely where needed. The entire treatment takes just 10-15 minutes.',
      },
      {
        title: 'Immediate Recovery',
        description:
          'Return to your normal routine instantly. Minor redness fades within hours. No bandages, no downtime, no one needs to know.',
      },
      {
        title: 'Enjoy Results',
        description:
          'Watch your wrinkles smooth away over 3-7 days. Full results at 2 weeks. Enjoy a refreshed, youthful appearance for 4-6 months.',
      },
    ],
    faqs: [
      {
        q: 'Will I look frozen or unnatural?',
        a: 'Absolutely not. Our doctors specialize in the "natural Botox" technique — micro-dosing that relaxes wrinkles while preserving your natural facial expressions. You will look refreshed, not frozen.',
      },
      {
        q: 'How long does Botox last?',
        a: 'Results typically last 4-6 months. With regular treatments, many clients find their results last even longer as the muscles gradually relax over time.',
      },
      {
        q: 'Does it hurt?',
        a: 'Most clients describe it as a tiny pinch that lasts a fraction of a second. We use ultra-fine needles and can apply numbing cream for sensitive areas. It is far less uncomfortable than a dental cleaning.',
      },
      {
        q: 'What areas can be treated?',
        a: 'Common areas: forehead lines, frown lines (11s between brows), crow\'s feet. We also treat bunny lines, lip flip, jawline slimming, neck bands, and excessive sweating.',
      },
      {
        q: 'Is Botox safe?',
        a: 'Botox has been FDA-approved since 2002 with an outstanding safety record. Over 100 million treatments have been performed worldwide. When administered by qualified doctors like ours, it is extremely safe.',
      },
    ],
    price_display: 'Starting from PKR 25,000',
    cta_text: 'Book Free Botox Consultation',
    whatsapp_message:
      "Hi, I'm interested in Botox treatment at Aesthetic Lounge. I'd like to book a free consultation.",
    meta_title: 'Botox Treatment in Lahore — Board-Certified Doctors | Aesthetic Lounge',
    meta_description:
      'Natural-looking Botox by board-certified doctors at DHA Phase 8, Lahore. FDA-approved. 15-min treatment, zero downtime. Free consultation.',
  },
];

export function getLandingPage(slug: string): LandingPage | undefined {
  return landingPages.find((lp) => lp.slug === slug);
}

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { landingPages, getLandingPage } from '@/data/landing-pages';
import LeadForm from './lead-form';
import FAQAccordion from './faq-accordion';
import StickyCTA from './sticky-cta';
import LPTracking from './lp-tracking';

const lpBeforeAfter: Record<string, { slug: string; folder: string; label: string }[]> = {
  'laser-hair-removal': [
    { slug: 'carbon-laser', folder: 'gallery', label: 'Carbon Laser' },
    { slug: 'pigmentation', folder: 'before-after', label: 'Pigmentation' },
    { slug: 'hydrafacial', folder: 'before-after', label: 'Skin Glow' },
  ],
  'hydrafacial': [
    { slug: 'hydrafacial', folder: 'before-after', label: 'HydraFacial' },
    { slug: 'acne-scarring', folder: 'before-after', label: 'Acne Scarring' },
    { slug: 'exosomes', folder: 'before-after', label: 'Exosome Therapy' },
  ],
  'botox': [
    { slug: 'botox-forehead', folder: 'before-after', label: 'Forehead Lines' },
    { slug: 'crows-feet', folder: 'gallery', label: "Crow's Feet" },
    { slug: 'lip-fillers', folder: 'before-after', label: 'Lip Fillers' },
  ],
  'default': [
    { slug: 'hydrafacial', folder: 'before-after', label: 'HydraFacial' },
    { slug: 'lip-fillers', folder: 'before-after', label: 'Lip Fillers' },
    { slug: 'botox-forehead', folder: 'before-after', label: 'Botox' },
  ],
};

// ── Static generation ─────────────────────────────────────────────

export function generateStaticParams() {
  return landingPages.map((lp) => ({ slug: lp.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lp = getLandingPage(slug);
  if (!lp) return {};

  return {
    title: lp.meta_title,
    description: lp.meta_description,
    openGraph: {
      title: lp.meta_title,
      description: lp.meta_description,
      type: 'website',
    },
    robots: { index: false, follow: false }, // Ad landing pages — no SEO index
  };
}

// ── Page ──────────────────────────────────────────────────────────

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lp = getLandingPage(slug);
  if (!lp) notFound();

  const waLink = `https://wa.me/923276620000?text=${encodeURIComponent(lp.whatsapp_message)}`;

  return (
    <>
      <LPTracking treatment={lp.treatment} />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-text-dark">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(184,146,74,0.15)_0%,transparent_60%),radial-gradient(ellipse_at_80%_80%,rgba(184,146,74,0.08)_0%,transparent_50%)]" />
        {/* Dot pattern */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(184,146,74,0.06)_1px,transparent_0)] bg-[length:32px_32px]" />

        <div className="relative z-[1] mx-auto max-w-[1100px] px-5 pt-16 pb-20 text-center md:px-8 md:pt-24 md:pb-28">
          {/* Trust badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
            <span className="text-star">&#9733;</span>
            DHA Lahore&apos;s Premier Clinic
          </div>

          <h1 className="mx-auto mb-5 max-w-[700px] font-serif text-[clamp(36px,6vw,64px)] leading-[1.08] font-bold tracking-tight text-white">
            {lp.headline.split(' — ').length > 1 ? (
              <>
                {lp.headline.split(' — ')[0]} —{' '}
                <em className="gold-shimmer-text italic">{lp.headline.split(' — ')[1]}</em>
              </>
            ) : (
              <span className="gold-shimmer-text">{lp.headline}</span>
            )}
          </h1>

          <p className="mx-auto mb-10 max-w-[560px] text-[17px] leading-[1.7] text-white/70">
            {lp.subheadline}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#lead-form"
              className="gold-shimmer-bg inline-flex items-center gap-2.5 rounded-lg px-10 py-4.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_8px_30px_rgba(184,146,74,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(184,146,74,0.4)]"
            >
              {lp.cta_text}
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-lg border border-white/20 px-8 py-4.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/5"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-whatsapp">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Us
            </a>
          </div>

          {/* Trust stats */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 border-t border-white/10 pt-8">
            {[
              { value: '1,000+', label: 'Happy Clients' },
              { value: '8+ Years', label: 'Experience' },
              { value: '4.8', label: 'Google Rating' },
              { value: 'Board Certified', label: 'Doctors' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold text-gold">{stat.value}</div>
                <div className="text-xs text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM / SOLUTION ───────────────────────────────── */}
      <section className="bg-cream py-20 lg:py-24">
        <div className="mx-auto max-w-[1100px] px-5 md:px-8">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-serif text-[clamp(28px,4vw,44px)] font-bold text-text-dark">
              Does This Sound <em className="gold-shimmer-text italic">Familiar?</em>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Problems */}
            <div className="space-y-4">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-red-400">
                The Problem
              </h3>
              {lp.problem_points.map((point, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-xl border border-red-100 bg-red-50/50 p-5"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs text-red-400">
                    &#10005;
                  </span>
                  <p className="text-[15px] leading-relaxed text-text-dark">{point}</p>
                </div>
              ))}
            </div>

            {/* Solutions */}
            <div className="space-y-4">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-green-600">
                Our Solution
              </h3>
              {lp.solution_points.map((point, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-xl border border-green-100 bg-green-50/50 p-5"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">
                    &#10003;
                  </span>
                  <p className="text-[15px] leading-relaxed text-text-dark">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── BEFORE / AFTER ───────────────────────────────────── */}
      <section className="bg-warm-white py-20 lg:py-24">
        <div className="mx-auto max-w-[1100px] px-5 md:px-8">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-serif text-[clamp(28px,4vw,44px)] font-bold text-text-dark">
              Real <em className="gold-shimmer-text italic">Results</em>
            </h2>
            <p className="text-text-light">See the transformation our clients experience.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(lpBeforeAfter[slug] || lpBeforeAfter['default']).map((ba) => (
              <div key={ba.slug} className="overflow-hidden rounded-2xl border border-border bg-white">
                <div className="grid grid-cols-2">
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img src={`/images/${ba.folder}/${ba.slug}-before.png`} alt={`${ba.label} — Before`} className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 left-2 rounded bg-text-dark/70 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Before</span>
                  </div>
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img src={`/images/${ba.folder}/${ba.slug}-after.png`} alt={`${ba.label} — After`} className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 right-2 rounded bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-white">After</span>
                  </div>
                </div>
                <div className="border-t border-border px-4 py-3">
                  <p className="text-center text-[11px] text-text-muted">
                    *Results may vary. Individual results depend on skin type, condition, and treatment plan.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="bg-cream py-20 lg:py-24">
        <div className="mx-auto max-w-[1100px] px-5 md:px-8">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-serif text-[clamp(28px,4vw,44px)] font-bold text-text-dark">
              How It <em className="gold-shimmer-text italic">Works</em>
            </h2>
            <p className="text-text-light">Your journey to beautiful results in {lp.steps.length} simple steps.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {lp.steps.map((step, i) => (
              <div
                key={i}
                className="relative rounded-2xl border border-border bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 font-serif text-xl font-bold text-gold">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="mb-2 text-base font-bold text-text-dark">{step.title}</h3>
                <p className="text-sm leading-relaxed text-text-light">{step.description}</p>
                {i < lp.steps.length - 1 && (
                  <div className="pointer-events-none absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center text-gold/40 lg:flex">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 4l6 6-6 6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ────────────────────────────────────── */}
      <section className="bg-warm-white py-20 lg:py-24">
        <div className="mx-auto max-w-[1100px] px-5 md:px-8">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-serif text-[clamp(28px,4vw,44px)] font-bold text-text-dark">
              Why <em className="gold-shimmer-text italic">Aesthetic Lounge?</em>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: '&#9733;',
                title: 'Expert Doctors',
                desc: 'Board-certified doctors with 8+ years of experience in medical aesthetics. Your safety and results are in the most qualified hands.',
              },
              {
                icon: '&#9883;',
                title: 'Advanced Technology',
                desc: 'We invest in FDA-approved, state-of-the-art equipment. The same technology used by leading clinics worldwide, right here in Lahore.',
              },
              {
                icon: '&#10022;',
                title: 'Personalized Care',
                desc: 'No cookie-cutter treatments. Every plan is customized to your unique skin type, concerns, and goals. Because you deserve bespoke care.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-3xl text-gold"
                  dangerouslySetInnerHTML={{ __html: card.icon }}
                />
                <h3 className="mb-3 text-lg font-bold text-text-dark">{card.title}</h3>
                <p className="text-sm leading-relaxed text-text-light">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────── */}
      <section className="bg-text-dark py-20 lg:py-24">
        <div className="relative mx-auto max-w-[1100px] px-5 md:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(184,146,74,0.08)_0%,transparent_60%)]" />
          <div className="relative z-[1] text-center">
            <h2 className="mb-3 font-serif text-[clamp(28px,4vw,44px)] font-bold text-white">
              Invest in <em className="gold-shimmer-text italic">Yourself</em>
            </h2>
            <p className="mx-auto mb-10 max-w-[500px] text-white/60">
              Premium treatments at accessible prices. Because everyone deserves to feel confident.
            </p>

            <div className="mx-auto max-w-[480px] overflow-hidden rounded-2xl border border-gold/20 bg-white/5 backdrop-blur-sm">
              <div className="border-b border-gold/20 bg-gold/10 px-8 py-5">
                <h3 className="font-serif text-xl font-bold text-white">{lp.treatment}</h3>
              </div>
              <div className="px-8 py-8">
                <div className="mb-2 text-4xl font-bold text-gold">{lp.price_display}</div>
                <p className="mb-6 text-sm text-white/50">Consultation is always free. No hidden charges.</p>
                <ul className="mb-8 space-y-3 text-left text-sm text-white/70">
                  {[
                    'Free initial consultation & skin assessment',
                    'Personalized treatment plan',
                    'FDA-approved equipment & products',
                    'Post-treatment care guidance',
                    'Follow-up included',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 text-gold">&#10003;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#lead-form"
                  className="gold-shimmer-bg block w-full rounded-lg py-4 text-center text-sm font-bold uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(184,146,74,0.3)] transition-all hover:-translate-y-0.5"
                >
                  {lp.cta_text}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="bg-cream py-20 lg:py-24">
        <div className="mx-auto max-w-[1100px] px-5 md:px-8">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-serif text-[clamp(28px,4vw,44px)] font-bold text-text-dark">
              What Our Clients <em className="gold-shimmer-text italic">Say</em>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                name: 'Ayesha K.',
                text: `I was so nervous before my first session, but the doctor made me feel completely at ease. The results have been beyond my expectations. I wish I had done this sooner!`,
                rating: 5,
              },
              {
                name: 'Sana M.',
                text: `The clinic is immaculate, the staff is professional, and the results speak for themselves. I have recommended Aesthetic Lounge to all my friends. Worth every rupee.`,
                rating: 5,
              },
              {
                name: 'Fatima R.',
                text: `After trying multiple clinics in Lahore, Aesthetic Lounge is the only one where I felt truly cared for. The doctor took time to explain everything and the treatment was painless.`,
                rating: 5,
              },
            ].map((review) => (
              <div
                key={review.name}
                className="rounded-2xl border border-border bg-white p-7 shadow-sm"
              >
                <div className="mb-3 text-sm tracking-[3px] text-star">
                  {'★'.repeat(review.rating)}
                </div>
                <p className="mb-5 text-[15px] leading-relaxed text-text-light">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 font-semibold text-gold">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-dark">{review.name}</p>
                    <p className="text-xs text-text-muted">Verified Client</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="bg-warm-white py-20 lg:py-24">
        <div className="mx-auto max-w-[700px] px-5 md:px-8">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-serif text-[clamp(28px,4vw,44px)] font-bold text-text-dark">
              Frequently Asked <em className="gold-shimmer-text italic">Questions</em>
            </h2>
          </div>

          <FAQAccordion faqs={lp.faqs} />
        </div>
      </section>

      {/* ─── FINAL CTA + LEAD FORM ────────────────────────────── */}
      <section id="lead-form" className="bg-cream py-20 lg:py-24">
        <div className="mx-auto max-w-[1100px] px-5 md:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            {/* Left: CTA copy */}
            <div>
              <h2 className="mb-5 font-serif text-[clamp(28px,4vw,44px)] font-bold text-text-dark">
                Ready to Start Your <em className="gold-shimmer-text italic">Transformation?</em>
              </h2>
              <p className="mb-8 max-w-[440px] text-[17px] leading-[1.7] text-text-light">
                Book a free, no-obligation consultation. Our doctor will assess your needs and create a
                personalized plan — no pressure, just honest advice.
              </p>

              {/* Contact options */}
              <div className="space-y-4">
                <a
                  href="tel:+923276620000"
                  className="flex items-center gap-4 rounded-xl border border-border bg-white p-4 transition-colors hover:border-gold/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gold"
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-dark">Call Us</p>
                    <p className="text-sm text-text-light">+92 327 662 0000</p>
                  </div>
                </a>

                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-border bg-white p-4 transition-colors hover:border-whatsapp/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-whatsapp/10">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-whatsapp">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-dark">WhatsApp</p>
                    <p className="text-sm text-text-light">Instant reply during business hours</p>
                  </div>
                </a>

                <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gold"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-dark">Visit Us</p>
                    <p className="text-sm text-text-light">Plaza-126, BWB Phase 8, DHA Lahore</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Lead form */}
            <LeadForm treatment={lp.treatment} whatsappMessage={lp.whatsapp_message} />
          </div>
        </div>
      </section>

      {/* ─── FOOTER MINI ──────────────────────────────────────── */}
      <footer className="border-t border-border bg-text-dark py-6">
        <div className="mx-auto max-w-[1100px] px-5 text-center md:px-8">
          <p className="mb-1 font-serif text-sm font-semibold text-gold">Aesthetic Lounge</p>
          <p className="text-xs text-white/40">
            Plaza-126, BWB Phase 8, DHA Lahore Cantt &middot; +92 327 662 0000
          </p>
          <p className="mt-2 text-[11px] text-white/25">
            &copy; {new Date().getFullYear()} Aesthetic Lounge. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ─── STICKY CTA (mobile) ──────────────────────────────── */}
      <StickyCTA ctaText={lp.cta_text} whatsappMessage={lp.whatsapp_message} />

      {/* ─── WHATSAPP FLOATING BUTTON ─────────────────────────── */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed right-7 bottom-20 z-[900] hidden h-[56px] w-[56px] items-center justify-center rounded-full bg-whatsapp shadow-[0_4px_20px_rgba(37,211,102,0.35)] transition-all hover:scale-[1.08] lg:flex"
      >
        <span className="pointer-events-none absolute inset-[-4px] animate-[wa-pulse_2s_ease-in-out_infinite] rounded-full border-2 border-whatsapp/30" />
        <svg viewBox="0 0 24 24" className="h-[28px] w-[28px] fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </>
  );
}

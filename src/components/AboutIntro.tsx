const features = [
  { icon: "\uD83D\uDC68\u200D\u2695\uFE0F", title: "Board-Certified Doctors", desc: "FCPS-qualified with international training" },
  { icon: "\uD83D\uDD2C", title: "FDA-Approved Products", desc: "Only the safest, proven treatments" },
  { icon: "\uD83C\uDFAF", title: "Personalized Plans", desc: "Tailored to your skin and goals" },
  { icon: "\uD83D\uDC8E", title: "Premium Experience", desc: "Luxury clinic, world-class results" },
];

export default function AboutIntro() {
  return (
    <section id="about" className="bg-white py-20 lg:py-36">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-16 px-5 md:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
        {/* Images */}
        <div className="relative">
          {/* Primary image */}
          <div className="flex aspect-[3/4] w-[85%] items-center justify-center rounded-2xl bg-gradient-to-br from-warm-white to-gold-pale text-6xl text-gold-light shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            &#10022;
          </div>
          {/* Secondary image (overlapping) */}
          <div className="absolute -bottom-8 right-0 flex aspect-square w-[55%] items-center justify-center rounded-2xl border-[5px] border-white bg-gradient-to-br from-gold-pale to-warm-white text-4xl text-gold-light shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            &#10022;
          </div>
          {/* Experience badge */}
          <div className="absolute -top-4 right-[20%] rounded-[14px] bg-text-dark px-6 py-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <div className="font-serif text-4xl font-bold leading-none text-gold-light">8+</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
              Years
            </div>
          </div>
        </div>

        {/* Text */}
        <div>
          <div className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
            About The Clinic
          </div>
          <h2 className="mb-6 font-serif text-[clamp(32px,4vw,48px)] leading-[1.15] font-semibold tracking-tight">
            A Sanctuary for <em className="italic text-gold">Transformation</em>
          </h2>
          <p className="mb-9 text-base leading-[1.8] text-text-light">
            Aesthetic Lounge Official is DHA Lahore&apos;s leading medical aesthetics clinic.
            Founded on the belief that everyone deserves to feel confident, we bring together
            board-certified dermatologists, the latest technology, and a warm, welcoming environment.
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3.5 rounded-xl p-4 transition-colors hover:bg-cream"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-gold/10 text-lg">
                  {f.icon}
                </div>
                <div>
                  <h4 className="mb-0.5 text-[15px] font-semibold">{f.title}</h4>
                  <p className="text-[13px] leading-snug text-text-light">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

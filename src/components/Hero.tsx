export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-cream">
      {/* Radial glow */}
      <div className="pointer-events-none absolute -top-[30%] -right-[10%] h-[130%] w-[70%] bg-[radial-gradient(ellipse,rgba(212,184,118,0.12)_0%,transparent_70%)]" />
      {/* Dot pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(184,146,74,0.04)_1px,transparent_0)] bg-[length:40px_40px]" />

      <div className="relative z-[2] mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-12 px-5 pt-30 pb-20 md:px-8 lg:grid-cols-2 lg:gap-20">
        {/* Content */}
        <div className="max-w-[580px]">
          <div className="mb-7 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
            DHA Lahore&apos;s Premier Clinic
          </div>

          <h1 className="mb-7 font-serif text-[clamp(44px,5.5vw,68px)] leading-[1.08] font-bold tracking-tight text-text-dark">
            Where Science Meets <em className="italic text-gold">Beauty</em>
          </h1>

          <p className="mb-11 max-w-[460px] text-[17px] leading-[1.8] text-text-light">
            Expert doctors delivering personalized care with advanced solutions.
            Experience safe, tailored treatments from Lahore&apos;s most trusted
            aesthetic professionals.
          </p>

          <div className="mb-14 flex flex-wrap items-center gap-6">
            <a
              href="#book"
              className="rounded-md bg-text-dark px-10 py-4 text-sm font-semibold tracking-[0.03em] text-white transition-all duration-400 hover:-translate-y-0.5 hover:bg-gold-dark hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            >
              Book Free Consultation
            </a>
            <a
              href="#results"
              className="inline-flex items-center gap-2.5 text-sm font-medium text-text-light transition-colors hover:text-gold"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border transition-all hover:border-gold hover:bg-gold/5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </span>
              See Results
            </a>
          </div>

          {/* Social proof */}
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex">
              {["A", "S", "F", "K"].map((letter, i) => {
                const bgs = [
                  "bg-gradient-to-br from-gold-pale to-gold-light text-gold-dark",
                  "bg-gradient-to-br from-[#E8DDD0] to-[#C9B090] text-[#8B7355]",
                  "bg-gradient-to-br from-gold-light to-gold text-white",
                  "bg-gradient-to-br from-[#F5E6D0] to-[#E0C89C] text-gold-dark",
                ];
                return (
                  <span
                    key={letter}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-[2.5px] border-cream text-sm font-semibold ${
                      i > 0 ? "-ml-2.5" : ""
                    } ${bgs[i]}`}
                  >
                    {letter}
                  </span>
                );
              })}
            </div>
            <div className="text-sm text-text-light leading-snug">
              <div className="tracking-[2px] text-star">★★★★★</div>
              <span className="font-bold text-text-dark">4.8 Rating</span> from{" "}
              <span className="font-bold text-text-dark">1,000+</span> reviews &middot; 25+ on Google
            </div>
          </div>
        </div>

        {/* Visual */}
        <div className="relative mx-auto max-w-[420px] lg:mx-0 lg:max-w-none">
          {/* Gold ring */}
          <div className="absolute -top-5 -left-5 h-[120px] w-[120px] rounded-full border-[1.5px] border-gold-light opacity-30 animate-[spin-slow_20s_linear_infinite]" />

          {/* Main image placeholder */}
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[200px_200px_24px_24px] bg-gradient-to-br from-warm-white to-gold-pale shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gold">
              <span className="text-7xl">&#10022;</span>
              <span className="text-sm font-medium text-text-muted">Clinic photo</span>
            </div>
          </div>

          {/* Floating badge top */}
          <div className="absolute top-[8%] -right-8 z-[3] hidden animate-[gentle-float_4s_ease-in-out_infinite] items-center gap-3 rounded-[14px] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:flex">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-gold/10 text-xl">
              &#9889;
            </div>
            <div className="text-[13px] text-text-light">
              <strong className="block text-base font-bold text-text-dark">80+</strong>
              Treatments
            </div>
          </div>

          {/* Floating badge bottom */}
          <div className="absolute bottom-[12%] -left-8 z-[3] hidden animate-[gentle-float_4s_ease-in-out_infinite_2s] items-center gap-3 rounded-[14px] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:flex">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-gold/10 text-xl">
              &#127942;
            </div>
            <div className="text-[13px] text-text-light">
              <strong className="block text-base font-bold text-text-dark">8+ Years</strong>
              of Excellence
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

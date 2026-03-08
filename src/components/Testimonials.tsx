const testimonials = [
  {
    initials: "AK",
    name: "Ayesha K.",
    treatment: "Chemical Peel + PRP",
    quote:
      "The team at Aesthetic Lounge completely transformed my skin. After years of dealing with acne scars, I finally feel confident going out without makeup. The results exceeded every expectation I had.",
  },
  {
    initials: "SM",
    name: "Sana M.",
    treatment: "Dermal Fillers",
    quote:
      "Dr. Ali is an absolute artist with fillers. The results look incredibly natural \u2014 nobody can tell I had anything done, but everyone says I look refreshed and younger. That\u2019s exactly what I wanted.",
  },
  {
    initials: "FR",
    name: "Farah R.",
    treatment: "HydraFacial",
    quote:
      "Best HydraFacial experience in Lahore. The clinic is immaculate, staff is warm and professional, and my skin has never glowed like this. I come back every month \u2014 it\u2019s become my self-care ritual.",
  },
  {
    initials: "NZ",
    name: "Nadia Z.",
    treatment: "Botox",
    quote:
      "I was nervous about Botox but Dr. Sarah made me feel completely at ease. She explained everything, the procedure was painless, and the results are so subtle and beautiful. Highly recommend.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-white py-20 lg:py-36">
      <div className="mx-auto max-w-[1320px] px-5 md:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          {/* Sticky heading */}
          <div className="lg:sticky lg:top-30">
            <div className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
              Testimonials
            </div>
            <h2 className="mb-4 font-serif text-[clamp(32px,4vw,48px)] leading-[1.15] font-semibold tracking-tight">
              Words from Our <em className="italic text-gold">Clients</em>
            </h2>
            <p className="max-w-[520px] text-base leading-[1.7] text-text-light">
              Over 1,000 clients trust us with their beauty. Here&apos;s what they have to say.
            </p>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-6">
            {testimonials.map((t) => (
              <div
                key={t.initials}
                className="rounded-[20px] border border-border-light bg-cream p-9 transition-all duration-400 hover:border-gold-light hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
              >
                <div className="mb-4 text-[15px] tracking-[3px] text-star">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p className="mb-6 font-elegant text-[19px] leading-[1.8] font-normal text-text-dark">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3.5">
                  <div className="gold-shimmer-bg flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold text-white">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold">{t.name}</div>
                    <div className="text-[13px] font-medium text-gold">{t.treatment}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

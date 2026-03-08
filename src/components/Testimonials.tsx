import { testimonials } from "@/data/testimonials";

export default function Testimonials() {
  if (testimonials.length === 0) return null;

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
            {testimonials.map((t) => {
              const initials = t.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const stars = "★".repeat(t.rating) + "☆".repeat(5 - t.rating);
              return (
                <div
                  key={t.id}
                  className="rounded-[20px] border border-border-light bg-cream p-9 transition-all duration-400 hover:border-gold-light hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                >
                  <div className="mb-4 text-[15px] tracking-[3px] text-star">
                    {stars}
                  </div>
                  <p className="mb-6 font-elegant text-[19px] leading-[1.8] font-normal text-text-dark">
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-3.5">
                    <div className="gold-shimmer-bg flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold text-white">
                      {initials}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold">{t.name}</div>
                      <div className="text-[13px] font-medium text-gold">
                        {t.treatment}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

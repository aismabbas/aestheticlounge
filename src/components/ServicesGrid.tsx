import Link from "next/link";

interface Service {
  icon: string;
  name: string;
  count: string;
  slug: string;
  featured?: boolean;
  tall?: boolean;
  wide?: boolean;
}

const defaultServices: Service[] = [
  { icon: "\uD83D\uDC89", name: "Dermal Fillers", count: "8 treatments", slug: "dermal-fillers", featured: true, tall: true },
  { icon: "\u2728", name: "Botox & Anti-Wrinkle", count: "6 treatments", slug: "botox", wide: true },
  { icon: "\uD83D\uDD2C", name: "Laser Hair Removal", count: "12 treatments", slug: "laser-hair-removal" },
  { icon: "\uD83D\uDC8E", name: "Skin Booster", count: "10 treatments", slug: "skin-booster" },
  { icon: "\uD83E\uDDF4", name: "Chemical Peels", count: "5 treatments", slug: "chemical-peels" },
  { icon: "\uD83D\uDC86", name: "HydraFacial", count: "3 treatments", slug: "keravive-hydrafacial", featured: true, wide: true },
  { icon: "\uD83E\uDEA1", name: "Thread Lift", count: "4 treatments", slug: "thread-lift" },
  { icon: "\uD83E\uDDB0", name: "Hair PRP", count: "5 treatments", slug: "hair-prp" },
  { icon: "\uD83D\uDC87", name: "Hair Transplant", count: "3 treatments", slug: "hair-transplant" },
  { icon: "\uD83C\uDFCB\uFE0F", name: "Body Contouring", count: "7 treatments", slug: "double-chin-treatment" },
  { icon: "\uD83C\uDF1F", name: "PRP Facial", count: "4 treatments", slug: "prp-facial" },
];

interface ServicesGridProps {
  services?: Service[];
}

export default function ServicesGrid({ services = defaultServices }: ServicesGridProps) {
  return (
    <section id="services" className="relative bg-cream py-20 lg:py-36">
      <div className="mx-auto max-w-[1320px] px-5 md:px-8">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
            What We Offer
          </div>
          <h2 className="mb-4 font-serif text-[clamp(32px,4vw,48px)] leading-[1.15] font-semibold tracking-tight">
            Our <em className="italic text-gold">Services</em>
          </h2>
          <p className="mx-auto max-w-[520px] text-base leading-[1.7] text-text-light">
            Comprehensive aesthetic solutions — from subtle enhancements to full transformations.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[200px]">
          {services.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-border-light bg-white p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-light hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] ${
                s.tall ? "lg:row-span-2" : ""
              } ${s.wide ? "sm:col-span-2 lg:col-span-2" : ""} ${
                s.featured
                  ? "border-transparent bg-gradient-to-br from-gold-pale via-warm-white to-white"
                  : ""
              } min-h-[160px]`}
            >
              {/* Arrow */}
              <div className="absolute top-5 right-5 flex h-9 w-9 translate-x-2 translate-y-2 items-center justify-center rounded-full border border-border text-sm text-gold opacity-0 transition-all duration-400 group-hover:translate-0 group-hover:border-gold-light group-hover:bg-gold/5 group-hover:opacity-100">
                &rarr;
              </div>

              <div className="mb-3.5 text-[28px] transition-transform duration-400 group-hover:scale-[1.15]">
                {s.icon}
              </div>
              <h3
                className={`font-serif font-semibold transition-colors duration-300 group-hover:text-gold-dark ${
                  s.featured ? "text-2xl" : "text-xl"
                }`}
              >
                {s.name}
              </h3>
              <span className="mt-1 text-[13px] font-medium text-text-muted">{s.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

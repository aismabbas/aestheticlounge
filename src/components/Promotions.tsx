import Link from "next/link";
import { promotions, type Promotion } from "@/data/promotions";

function formatPrice(price: number): string {
  return `PKR ${price.toLocaleString("en-PK")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function badgeColor(badge: string): string {
  switch (badge) {
    case "Popular":
      return "bg-gold text-white";
    case "Limited Time":
      return "bg-red-600 text-white";
    case "New":
      return "bg-emerald-600 text-white";
    default:
      return "bg-gold-pale text-gold-dark";
  }
}

function PromoCard({ promo }: { promo: Promotion }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gold-light bg-white shadow-[0_2px_20px_rgba(184,146,74,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(184,146,74,0.18)]">
      {/* Gold shimmer top accent */}
      <div className="gold-shimmer-bg h-1" />

      {/* Badge */}
      {promo.badge && (
        <span
          className={`absolute top-5 right-5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeColor(promo.badge)}`}
        >
          {promo.badge}
        </span>
      )}

      <div className="flex flex-1 flex-col p-7 pt-6">
        {/* Treatment tag */}
        <span className="mb-3 inline-block w-fit rounded-full border border-gold-pale bg-warm-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-dark">
          {promo.treatment}
        </span>

        <h3 className="mb-2 font-serif text-xl font-semibold tracking-tight text-text-dark transition-colors duration-300 group-hover:text-gold-dark">
          {promo.title}
        </h3>

        <p className="mb-5 flex-1 text-sm leading-relaxed text-text-light">
          {promo.description}
        </p>

        {/* Pricing */}
        <div className="mb-5">
          {promo.originalPrice && promo.promoPrice ? (
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-bold text-gold">
                {formatPrice(promo.promoPrice)}
              </span>
              <span className="text-sm text-text-muted line-through">
                {formatPrice(promo.originalPrice)}
              </span>
              {promo.discount && (
                <span className="rounded bg-gold-pale px-2 py-0.5 text-xs font-semibold text-gold-dark">
                  {promo.discount}
                </span>
              )}
            </div>
          ) : promo.discount ? (
            <span className="inline-block rounded bg-gold-pale px-3 py-1.5 text-sm font-semibold text-gold-dark">
              {promo.discount}
            </span>
          ) : null}
        </div>

        {/* Valid until */}
        <p className="mb-5 text-xs text-text-muted">
          Valid until {formatDate(promo.validUntil)}
        </p>

        {/* CTA */}
        <Link
          href="/book"
          className="gold-shimmer-bg inline-flex items-center justify-center rounded-md px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(184,146,74,0.25)]"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}

export default function Promotions() {
  const activePromos = promotions.filter((p) => p.active);

  if (activePromos.length === 0) return null;

  return (
    <section id="promotions" className="relative bg-warm-white py-20 lg:py-36">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(184,146,74,0.06)_0%,transparent_60%)]" />

      <div className="relative mx-auto max-w-[1320px] px-5 md:px-8">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
            Current Promotions
          </div>
          <h2 className="mb-4 font-serif text-[clamp(32px,4vw,48px)] leading-[1.15] font-semibold tracking-tight">
            Special Offers <em className="italic text-gold">for You</em>
          </h2>
          <p className="mx-auto max-w-[520px] text-base leading-[1.7] text-text-light">
            Take advantage of our limited-time packages and save on the treatments
            you love.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activePromos.map((promo) => (
            <PromoCard key={promo.id} promo={promo} />
          ))}
        </div>

        {/* View all link */}
        <div className="mt-12 text-center">
          <Link
            href="/promotions"
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.06em] text-gold transition-colors hover:text-gold-dark"
          >
            View All Promotions
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

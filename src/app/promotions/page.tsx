import { Metadata } from "next";
import Link from "next/link";
import { promotions } from "@/data/promotions";

export const metadata: Metadata = {
  title: "Promotions & Special Offers | Aesthetic Lounge — DHA Phase 7, Lahore",
  description:
    "Exclusive deals on HydraFacial, laser hair removal, Botox, PRP, and more at Aesthetic Lounge, Lahore. Limited-time packages at unbeatable prices.",
};

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

export default function PromotionsPage() {
  const now = new Date().toISOString().slice(0, 10);
  const activePromos = promotions.filter(
    (p) => p.active && p.validUntil >= now
  );
  const expiredPromos = promotions.filter(
    (p) => !p.active || p.validUntil < now
  );

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark py-20 text-center text-white">
        <h1 className="font-serif text-4xl tracking-tight md:text-5xl lg:text-6xl">
          Promotions &{" "}
          <em className="gold-shimmer-text italic">Special Offers</em>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
          Exclusive packages and limited-time deals on our most popular
          treatments. Book now before they expire.
        </p>
      </section>

      {/* Active Promotions */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {activePromos.length > 0 ? (
          <>
            <div className="mb-10 text-center">
              <div className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
                Active Now
              </div>
              <h2 className="font-serif text-3xl font-semibold tracking-tight">
                Current Offers
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {activePromos.map((promo) => (
                <div
                  key={promo.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-gold-light bg-white shadow-[0_2px_20px_rgba(184,146,74,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(184,146,74,0.18)]"
                >
                  {/* Gold shimmer top accent */}
                  <div className="gold-shimmer-bg h-1.5" />

                  {/* Badge */}
                  {promo.badge && (
                    <span
                      className={`absolute top-6 right-5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeColor(promo.badge)}`}
                    >
                      {promo.badge}
                    </span>
                  )}

                  <div className="flex flex-1 flex-col p-8 pt-7">
                    {/* Treatment tag */}
                    <span className="mb-3 inline-block w-fit rounded-full border border-gold-pale bg-warm-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-dark">
                      {promo.treatment}
                    </span>

                    <h3 className="mb-3 font-serif text-2xl font-semibold tracking-tight text-text-dark">
                      {promo.title}
                    </h3>

                    <p className="mb-6 flex-1 text-sm leading-relaxed text-text-light">
                      {promo.description}
                    </p>

                    {/* Pricing */}
                    <div className="mb-4">
                      {promo.originalPrice && promo.promoPrice ? (
                        <div className="flex flex-wrap items-baseline gap-3">
                          <span className="text-2xl font-bold text-gold">
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
                    <p className="mb-6 text-xs text-text-muted">
                      Valid until {formatDate(promo.validUntil)}
                    </p>

                    {/* CTA */}
                    <Link
                      href="/book"
                      className="gold-shimmer-bg inline-flex items-center justify-center rounded-md px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(184,146,74,0.25)]"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-gold-pale bg-white p-12 text-center">
            <p className="font-serif text-xl text-text-light">
              No active promotions right now. Check back soon!
            </p>
          </div>
        )}

        {/* Expired Promotions */}
        {expiredPromos.length > 0 && (
          <div className="mt-20">
            <div className="mb-10 text-center">
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-text-muted">
                Past Offers
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {expiredPromos.map((promo) => (
                <div
                  key={promo.id}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-border-light bg-white opacity-60"
                >
                  {/* Gray top accent */}
                  <div className="h-1 bg-border" />

                  <div className="flex flex-1 flex-col p-7 pt-6">
                    <span className="mb-3 inline-block w-fit rounded-full border border-border-light bg-warm-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      {promo.treatment}
                    </span>

                    <h3 className="mb-2 font-serif text-xl font-semibold tracking-tight text-text-muted">
                      {promo.title}
                    </h3>

                    <p className="mb-4 flex-1 text-sm leading-relaxed text-text-muted">
                      {promo.description}
                    </p>

                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-400">
                      This offer has ended
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-gold-pale bg-white p-8 text-center">
          <p className="mb-2 font-serif text-xl text-text-dark">
            Don&apos;t see what you&apos;re looking for?
          </p>
          <p className="mb-5 text-sm text-text-light">
            Contact us for custom packages tailored to your goals.
          </p>
          <Link
            href="/book"
            className="gold-shimmer-bg inline-block rounded-md px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(184,146,74,0.25)]"
          >
            Book Free Consultation
          </Link>
        </div>
      </section>
    </main>
  );
}

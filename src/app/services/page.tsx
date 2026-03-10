import { Metadata } from "next";
import Link from "next/link";
import { categories, treatmentCount } from "@/data/services";

export const metadata: Metadata = {
  title: "Our Services | Aesthetic Lounge — DHA Phase 8, Lahore",
  description: `Explore ${treatmentCount}+ medical aesthetics treatments across ${categories.length} categories — from dermal fillers and Botox to laser treatments and body contouring. Aesthetic Lounge, DHA Phase 8, Lahore.`,
};

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark pt-32 pb-20 text-center text-white">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight">
          Our Services
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
          {treatmentCount}+ treatments across {categories.length} specialties — where
          science meets beauty.
        </p>
      </section>

      {/* Bento Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => {
            // Make the first two cards span wider for bento effect
            const isLarge = i < 2;
            return (
              <Link
                key={cat.slug}
                href={`/services/${cat.treatments[0].slug}`}
                className={`group relative overflow-hidden rounded-2xl border border-gold-pale bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gold ${
                  isLarge ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                {/* Icon */}
                <span className="text-4xl">{cat.icon}</span>

                {/* Content */}
                <h2 className="mt-4 font-serif text-2xl text-text-dark group-hover:text-gold transition-colors">
                  {cat.name}
                </h2>
                <p className="mt-2 text-sm text-text-light leading-relaxed">
                  {cat.description}
                </p>

                {/* Treatment count */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    {cat.treatments.length} treatments
                  </span>
                  <span className="text-gold group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </div>

                {/* Treatment list preview */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {cat.treatments.slice(0, 4).map((t) => (
                    <span
                      key={t.slug}
                      className="rounded-full bg-gold-pale px-3 py-1 text-xs text-text-dark"
                    >
                      {t.name}
                    </span>
                  ))}
                  {cat.treatments.length > 4 && (
                    <span className="rounded-full bg-warm-white px-3 py-1 text-xs text-text-muted">
                      +{cat.treatments.length - 4} more
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-text-dark py-16 text-center">
        <h2 className="font-serif text-3xl text-white">
          Not sure which treatment is right for you?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          Book a free consultation with our doctors and we will create a
          personalised treatment plan.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/book"
            className="rounded-full bg-gold px-8 py-3 font-medium text-white transition-colors hover:bg-gold-dark"
          >
            Book Consultation
          </Link>
          <a
            href="https://wa.me/923276620000?text=Hi%2C%20I%20would%20like%20to%20book%20a%20consultation."
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-gold px-8 py-3 font-medium text-gold transition-colors hover:bg-gold hover:text-white"
          >
            WhatsApp Us
          </a>
        </div>
      </section>
    </main>
  );
}

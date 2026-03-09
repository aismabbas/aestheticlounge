import { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/data/services";

export const metadata: Metadata = {
  title: "Price Guide | Aesthetic Lounge — DHA Phase 7, Lahore",
  description:
    "Transparent pricing for all 80+ treatments at Aesthetic Lounge. View our complete price guide grouped by category — dermal fillers, Botox, laser, HydraFacial, and more.",
};

export default function PriceGuidePage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark pt-32 pb-20 text-center text-white">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight">
          Price Guide
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
          Transparent pricing for every treatment. All prices are starting
          rates — final cost depends on individual assessment.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {categories.map((cat) => (
            <div key={cat.slug}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{cat.icon}</span>
                <h2 className="font-serif text-2xl text-text-dark">
                  {cat.name}
                </h2>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-gold-pale bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gold-pale bg-warm-white">
                      <th className="px-6 py-3 text-left font-medium text-text-muted">
                        Treatment
                      </th>
                      <th className="hidden px-6 py-3 text-left font-medium text-text-muted sm:table-cell">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-text-muted">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-pale">
                    {cat.treatments.map((t) => (
                      <tr
                        key={t.slug}
                        className="transition-colors hover:bg-warm-white"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/services/${t.slug}`}
                            className="font-medium text-text-dark hover:text-gold transition-colors"
                          >
                            {t.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-text-muted line-clamp-1 sm:hidden">
                            {t.duration}
                          </p>
                        </td>
                        <td className="hidden px-6 py-4 text-text-light sm:table-cell">
                          {t.duration}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gold whitespace-nowrap">
                          {t.priceDisplay}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 rounded-2xl border border-gold-pale bg-white p-6 text-center">
          <p className="text-sm text-text-light">
            All prices listed are starting rates in Pakistani Rupees (PKR). Final
            treatment cost is determined after an in-person consultation and may
            vary based on individual requirements, areas treated, and product
            quantity used. We offer complimentary consultations for all
            treatments.
          </p>
          <Link
            href="/book"
            className="mt-4 inline-block rounded-full bg-gold px-8 py-3 font-medium text-white transition-colors hover:bg-gold-dark"
          >
            Book Free Consultation
          </Link>
        </div>
      </section>
    </main>
  );
}

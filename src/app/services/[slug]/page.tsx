import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allTreatments,
  getTreatmentBySlug,
  getTreatmentsByCategory,
} from "@/data/services";
import { getDoctorBySlug } from "@/data/doctors";
import {
  generateServiceSchema,
  generateBreadcrumbSchema,
} from "@/lib/structured-data";

// ─── Static params ─────────────────────────────────────────────────────
export function generateStaticParams() {
  return allTreatments.map((t) => ({ slug: t.slug }));
}

// ─── Metadata ──────────────────────────────────────────────────────────
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const treatment = getTreatmentBySlug(slug);
  if (!treatment) return { title: "Treatment Not Found" };

  const doctor = treatment.doctor ? getDoctorBySlug(treatment.doctor) : undefined;
  const metaDescription = `${treatment.shortDesc} ${treatment.priceDisplay !== 'Consultation Required' ? `Starting from ${treatment.priceDisplay}.` : ''} ${treatment.duration} session${doctor ? ` with ${doctor.name}` : ''} at Aesthetic Lounge, DHA Lahore.`;

  return {
    title: `${treatment.name} — ${treatment.category} | Aesthetic Lounge Lahore`,
    description: metaDescription.trim(),
    openGraph: {
      title: `${treatment.name} | Aesthetic Lounge`,
      description: metaDescription.trim(),
      type: "website",
    },
    alternates: {
      canonical: `https://aestheticloungeofficial.com/services/${slug}`,
    },
  };
}

// ─── Page ──────────────────────────────────────────────────────────────
export default async function TreatmentPage({ params }: PageProps) {
  const { slug } = await params;
  const treatment = getTreatmentBySlug(slug);
  if (!treatment) notFound();

  const doctor = treatment.doctor
    ? getDoctorBySlug(treatment.doctor)
    : undefined;

  const relatedTreatments = getTreatmentsByCategory(
    treatment.categorySlug,
  ).filter((t) => t.slug !== treatment.slug);

  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in ${treatment.name} at Aesthetic Lounge.`,
  );

  const serviceSchema = generateServiceSchema(treatment);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://aestheticloungeofficial.com' },
    { name: 'Services', url: 'https://aestheticloungeofficial.com/services' },
    { name: treatment.category, url: `https://aestheticloungeofficial.com/services#${treatment.categorySlug}` },
    { name: treatment.name, url: `https://aestheticloungeofficial.com/services/${treatment.slug}` },
  ]);

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Hero Banner */}
      <section className="bg-text-dark py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Link
            href="/services"
            className="inline-block text-sm text-text-muted hover:text-gold transition-colors"
          >
            &larr; All Services
          </Link>
          <p className="mt-4 text-sm font-medium uppercase tracking-widest text-gold">
            {treatment.category}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl lg:text-6xl">
            {treatment.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            {treatment.shortDesc}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <div>
              <h2 className="font-serif text-2xl text-text-dark">
                About This Treatment
              </h2>
              <p className="mt-4 leading-relaxed text-text-light">
                {treatment.description}
              </p>
            </div>

            {/* Best For */}
            <div className="rounded-2xl border border-gold-pale bg-white p-6">
              <h3 className="font-serif text-xl text-text-dark">Best For</h3>
              <p className="mt-2 text-text-light">{treatment.bestFor}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {treatment.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gold-pale px-4 py-1.5 text-xs font-medium text-text-dark"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details card */}
            <div className="rounded-2xl border border-gold-pale bg-white p-6 shadow-sm">
              <h3 className="font-serif text-lg text-text-dark">
                Treatment Details
              </h3>

              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex justify-between border-b border-gold-pale pb-3">
                  <dt className="font-medium text-text-muted">Duration</dt>
                  <dd className="text-text-dark">{treatment.duration}</dd>
                </div>
                <div className="flex justify-between border-b border-gold-pale pb-3">
                  <dt className="font-medium text-text-muted">Price</dt>
                  <dd className="font-medium text-gold">
                    {treatment.priceDisplay}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-gold-pale pb-3">
                  <dt className="font-medium text-text-muted">Category</dt>
                  <dd className="text-text-dark">{treatment.category}</dd>
                </div>
                {doctor && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-text-muted">Doctor</dt>
                    <dd className="text-text-dark">{doctor.name}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* CTAs */}
            <Link
              href={`/book?treatment=${treatment.slug}`}
              className="block w-full rounded-full bg-gold py-3 text-center font-medium text-white transition-colors hover:bg-gold-dark"
            >
              Book This Treatment
            </Link>

            <a
              href={`https://wa.me/923001234567?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-full border border-gold py-3 text-center font-medium text-gold transition-colors hover:bg-gold hover:text-white"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Related Treatments */}
      {relatedTreatments.length > 0 && (
        <section className="border-t border-gold-pale bg-warm-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-2xl text-text-dark">
              More in {treatment.category}
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTreatments.slice(0, 6).map((t) => (
                <Link
                  key={t.slug}
                  href={`/services/${t.slug}`}
                  className="group rounded-2xl border border-gold-pale bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gold"
                >
                  <h3 className="font-serif text-lg text-text-dark group-hover:text-gold transition-colors">
                    {t.name}
                  </h3>
                  <p className="mt-2 text-sm text-text-light line-clamp-2">
                    {t.shortDesc}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-text-muted">{t.duration}</span>
                    <span className="font-medium text-gold">
                      {t.priceDisplay}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

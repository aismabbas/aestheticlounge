import { Metadata } from "next";
import { doctors } from "@/data/doctors";

export const metadata: Metadata = {
  title: "Our Doctors | Aesthetic Lounge — DHA Phase 8, Lahore",
  description:
    "Meet the experienced medical professionals behind Aesthetic Lounge. Our team of dermatologists, aesthetic surgeons, and cosmetic dentists are committed to delivering safe, beautiful results.",
};

export default function DoctorsPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark pt-32 pb-20 text-center text-white">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight">
          Our Doctors
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
          Board-certified physicians with international training and thousands
          of successful treatments.
        </p>
      </section>

      {/* Doctor Cards */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {doctors.map((doc, i) => (
            <article
              key={doc.slug}
              className="grid gap-8 lg:grid-cols-3 items-start"
            >
              {/* Photo placeholder */}
              <div className={`aspect-[3/4] overflow-hidden rounded-2xl bg-warm-white border border-gold-pale flex items-center justify-center ${i % 2 === 1 ? "lg:order-last" : ""}`}>
                <div className="text-center text-text-muted">
                  <div className="text-6xl mb-3">
                    {doc.slug === "dr-zulfiqar" ? "👨‍⚕️" : "👩‍⚕️"}
                  </div>
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="text-xs mt-1">Photo coming soon</p>
                </div>
              </div>

              {/* Info */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="font-serif text-3xl text-text-dark">
                    {doc.name}
                  </h2>
                  <p className="mt-1 text-sm font-medium uppercase tracking-widest text-gold">
                    {doc.title}
                  </p>
                </div>

                <p className="text-text-light leading-relaxed">{doc.bio}</p>

                {/* Specialization */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                    Specializations
                  </h3>
                  <p className="mt-1 text-text-dark">{doc.specialization}</p>
                </div>

                {/* Education */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                    Education & Training
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {doc.education.map((edu) => (
                      <li
                        key={edu}
                        className="flex items-start gap-2 text-sm text-text-light"
                      >
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold" />
                        {edu}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Social */}
                <div className="flex gap-4">
                  {doc.social.instagram && (
                    <a
                      href={doc.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gold hover:text-gold-dark transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                  {doc.social.linkedin && (
                    <a
                      href={doc.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gold hover:text-gold-dark transition-colors"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

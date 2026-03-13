import { Metadata } from "next";
import Image from "next/image";
import { doctors, staff } from "@/data/doctors";

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
              {/* Photo */}
              <div className={`aspect-[3/4] overflow-hidden rounded-2xl bg-warm-white border border-gold-pale ${i % 2 === 1 ? "lg:order-last" : ""}`}>
                <Image
                  src={doc.image}
                  alt={doc.name}
                  width={400}
                  height={533}
                  className="h-full w-full object-cover"
                />
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

      {/* Staff Section */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center font-serif text-3xl text-text-dark">
          Our Team
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 max-w-3xl mx-auto">
          {staff.map((member) => (
            <div
              key={member.slug}
              className="overflow-hidden rounded-2xl border border-gold-pale bg-white"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={400}
                  height={533}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-serif text-xl text-text-dark">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium uppercase tracking-widest text-gold">
                  {member.title}
                </p>
                <p className="mt-3 text-sm text-text-light leading-relaxed">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

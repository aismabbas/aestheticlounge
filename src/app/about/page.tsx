import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Aesthetic Lounge — DHA Phase 7, Lahore",
  description:
    "Learn about Aesthetic Lounge — Lahore's premier medical aesthetics clinic in DHA Phase 7. Founded by Dr. Huma Abbas, we combine science, artistry, and luxury for transformative results.",
};

const values = [
  {
    title: "Excellence",
    description:
      "Every treatment we perform meets the highest medical standards. We use only premium, internationally sourced products and continuously invest in the latest technology.",
    icon: "⭐",
  },
  {
    title: "Innovation",
    description:
      "We stay at the forefront of aesthetic medicine, bringing the latest evidence-based treatments from around the world to Lahore before anyone else.",
    icon: "🔬",
  },
  {
    title: "Care",
    description:
      "Your comfort, safety, and satisfaction are our priority. From your first consultation to your follow-up, we treat every patient like family.",
    icon: "💛",
  },
  {
    title: "Trust",
    description:
      "Transparency in pricing, honest consultations, and realistic expectations — we build lasting relationships based on trust and integrity.",
    icon: "🤝",
  },
];

const timeline = [
  {
    year: "2018",
    title: "The Beginning",
    description:
      "Dr. Huma Abbas opens Aesthetic Lounge in DHA Phase 7, Lahore with a vision to bring world-class aesthetic medicine to Pakistan.",
  },
  {
    year: "2019",
    title: "Expanding Services",
    description:
      "Added advanced laser treatments and became one of the first clinics in Lahore to offer HIFU face lifting and CoolSculpting body contouring.",
  },
  {
    year: "2020",
    title: "Growing the Team",
    description:
      "Dr. Sarah Khan and Dr. Ahmed Raza joined the team, expanding our capabilities into body contouring and dental aesthetics.",
  },
  {
    year: "2022",
    title: "80+ Treatments",
    description:
      "Reached the milestone of offering over 80 treatments across 11 categories, making Aesthetic Lounge DHA's most comprehensive aesthetics clinic.",
  },
  {
    year: "2024",
    title: "Renovation & Upgrade",
    description:
      "Complete clinic renovation with state-of-the-art treatment rooms, a luxury lounge area, and the latest generation of medical devices.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark pt-32 pb-20 text-center text-white">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight">
          Where Science Meets Beauty
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
          Aesthetic Lounge is Lahore&apos;s premier medical aesthetics clinic,
          founded on the belief that everyone deserves to look and feel their
          best.
        </p>
      </section>

      {/* Our Story */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl text-text-dark">Our Story</h2>
        <div className="mt-6 space-y-4 text-text-light leading-relaxed">
          <p>
            Aesthetic Lounge was born from Dr. Huma Abbas&apos;s vision to create a
            medical aesthetics clinic in Lahore that matches the standards of the
            world&apos;s best. After training in London and Seoul, she returned home
            determined to offer her community the same calibre of treatments
            available in international capitals.
          </p>
          <p>
            Nestled in the heart of DHA Phase 7, our clinic combines clinical
            precision with a warm, luxurious environment where patients feel
            comfortable and cared for. Every treatment room is equipped with the
            latest medical technology, and every member of our team is trained to
            the highest professional standards.
          </p>
          <p>
            Today, Aesthetic Lounge offers over 80 treatments across 11
            specialties — from subtle enhancements like lip fillers and Botox to
            transformative procedures like thread lifts and body contouring. Our
            growing team of board-certified physicians serves hundreds of
            patients each month, united by a shared commitment to safe,
            beautiful, natural-looking results.
          </p>
        </div>
      </section>

      {/* Clinic Photos */}
      <section className="bg-warm-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Reception & Lounge", file: "reception" },
              { label: "Treatment Room", file: "treatment-room" },
              { label: "Consultation Suite", file: "consultation-suite" },
            ].map((item) => (
                <div
                  key={item.label}
                  className="aspect-[4/3] overflow-hidden rounded-2xl"
                >
                  <img src={`/images/clinic/${item.file}.png`} alt={item.label} className="h-full w-full object-cover" />
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center font-serif text-3xl text-text-dark">
          Our Values
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-gold-pale bg-white p-6 text-center shadow-sm"
            >
              <span className="text-3xl">{v.icon}</span>
              <h3 className="mt-4 font-serif text-xl text-text-dark">
                {v.title}
              </h3>
              <p className="mt-2 text-sm text-text-light leading-relaxed">
                {v.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-text-dark py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-serif text-3xl">Our Journey</h2>
          <div className="mt-12 space-y-10">
            {timeline.map((item, i) => (
              <div key={item.year} className="flex gap-6">
                {/* Year marker */}
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-sm font-bold text-white">
                    {item.year.slice(2)}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="mt-2 h-full w-px bg-gold/30" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-2">
                  <p className="text-xs font-medium uppercase tracking-widest text-gold">
                    {item.year}
                  </p>
                  <h3 className="mt-1 font-serif text-xl">{item.title}</h3>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <h2 className="font-serif text-3xl text-text-dark">
          Ready to Begin?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-text-light">
          Book a free consultation and let our doctors create a personalised
          treatment plan for you.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/book"
            className="rounded-full bg-gold px-8 py-3 font-medium text-white transition-colors hover:bg-gold-dark"
          >
            Book Consultation
          </Link>
          <Link
            href="/services"
            className="rounded-full border border-gold px-8 py-3 font-medium text-gold transition-colors hover:bg-gold hover:text-white"
          >
            View Services
          </Link>
        </div>
      </section>
    </main>
  );
}

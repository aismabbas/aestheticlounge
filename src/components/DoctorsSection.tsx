const doctors = [
  {
    name: "Dr. Huma",
    title: "Aesthetic Physician",
    bio: "Expert aesthetic physician specializing in advanced non-surgical treatments, facial rejuvenation, and personalized skincare solutions.",
    placeholder: "\uD83D\uDC69\u200D\u2695\uFE0F",
    socials: ["in", "ig"],
  },
  {
    name: "Dr. Zulfiqar",
    title: "Plastic Surgeon",
    bio: "Skilled plastic surgeon with expertise in facial contouring, body sculpting, and reconstructive aesthetic procedures.",
    placeholder: "\uD83D\uDC68\u200D\u2695\uFE0F",
    socials: ["in", "ig"],
  },
  {
    name: "Dr. Zonera",
    title: "Dermatologist",
    bio: "Experienced dermatologist specializing in advanced skin treatments, laser therapies, and clinical skincare for all skin types.",
    placeholder: "\uD83D\uDC69\u200D\u2695\uFE0F",
    socials: ["in", "ig"],
  },
];

export default function DoctorsSection() {
  return (
    <section id="doctors" className="bg-white py-20 lg:py-36">
      <div className="mx-auto max-w-[1320px] px-5 md:px-8">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
            Expert Team
          </div>
          <h2 className="mb-4 font-serif text-[clamp(32px,4vw,48px)] leading-[1.15] font-semibold tracking-tight">
            Meet Our <em className="italic text-gold">Doctors</em>
          </h2>
          <p className="mx-auto max-w-[520px] text-base leading-[1.7] text-text-light">
            Expert doctors delivering personalized care with advanced solutions.
          </p>
        </div>

        {/* Doctors grid */}
        <div className="mx-auto grid max-w-[400px] grid-cols-1 gap-8 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => (
            <div
              key={doc.name}
              className="overflow-hidden rounded-[20px] border border-transparent bg-cream transition-all duration-500 hover:-translate-y-2 hover:border-gold-light hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            >
              {/* Photo placeholder */}
              <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-warm-white to-gold-pale">
                <div className="absolute inset-0 flex items-center justify-center text-7xl text-gold-light opacity-50">
                  {doc.placeholder}
                </div>
                <div className="absolute right-0 bottom-0 left-0 h-[40%] bg-gradient-to-t from-cream/50 to-transparent" />
              </div>

              {/* Info */}
              <div className="px-7 pt-7 pb-8">
                <h3 className="mb-1.5 font-serif text-2xl font-semibold">{doc.name}</h3>
                <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-gold">
                  {doc.title}
                </div>
                <p className="text-sm leading-[1.7] text-text-light">{doc.bio}</p>
                <div className="mt-4 flex gap-2">
                  {doc.socials.map((s) => (
                    <a
                      key={s}
                      href="#"
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-border text-sm transition-all hover:border-gold hover:bg-gold/5"
                    >
                      {s}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

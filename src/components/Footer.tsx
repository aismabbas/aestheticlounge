const quickLinks = [
  { href: "/", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#doctors", label: "Our Doctors" },
  { href: "#about", label: "About Us" },
  { href: "#book", label: "Book Appointment" },
  { href: "/feedback", label: "Feedback" },
  { href: "/feedback/complaint", label: "Complaint Box" },
  { href: "#", label: "Price Guide" },
  { href: "/social", label: "Social Gallery" },
];

const topServices = [
  "Dermal Fillers",
  "Botox & Anti-Wrinkle",
  "Laser Treatments",
  "HydraFacial",
  "Chemical Peels",
  "Hair Restoration",
];

const contactInfo = [
  { icon: "\uD83D\uDCCD", label: "Address", value: "Plaza-126, BWB Phase 8, DHA Lahore Cantt" },
  { icon: "\uD83D\uDCDE", label: "Phone", value: "+92 327 6620000 | +92 42 35740271" },
  { icon: "\u2709\uFE0F", label: "Email", value: "info@aestheticloungeofficial.com" },
  { icon: "\uD83D\uDD50", label: "Hours", value: "Mon \u2013 Sat: 10 AM \u2013 9 PM (By Appointment)" },
];

const socials = [
  { label: "Instagram", text: "ig", href: "https://instagram.com/aestheticloungeofficial/" },
  { label: "Facebook", text: "fb", href: "https://facebook.com/people/Aestheticloungeofficial/61567387603705/" },
  { label: "YouTube", text: "yt", href: "https://youtube.com/@aestheticloungeofficial" },
];

export default function Footer() {
  return (
    <footer id="contact" className="bg-dark-bg pt-20 text-white/60">
      <div className="mx-auto max-w-[1320px] px-5 md:px-8">
        <div className="grid grid-cols-1 gap-8 pb-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:gap-12">
          {/* Brand */}
          <div>
            <div className="font-serif text-[22px] font-semibold text-white">
              Aesthetic <span className="text-gold-light">Lounge</span>
            </div>
            <p className="mt-5 mb-7 max-w-[280px] text-sm leading-[1.8]">
              Lahore&apos;s premier destination for advanced aesthetic treatments. Where science
              meets beauty, and every visit is an experience.
            </p>
            <div className="flex gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-white/10 text-[15px] transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-white"
                >
                  {s.text}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-6 font-serif text-[17px] font-semibold text-white">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm transition-colors hover:text-gold-light">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Services */}
          <div>
            <h4 className="mb-6 font-serif text-[17px] font-semibold text-white">Top Services</h4>
            <ul className="space-y-3">
              {topServices.map((svc) => (
                <li key={svc}>
                  <a href="#" className="text-sm transition-colors hover:text-gold-light">
                    {svc}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-6 font-serif text-[17px] font-semibold text-white">Get in Touch</h4>
            <div className="space-y-4.5">
              {contactInfo.map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-sm">
                    {c.icon}
                  </div>
                  <div className="text-sm leading-[1.6]">
                    <strong className="mb-0.5 block text-xs font-semibold uppercase tracking-[0.06em] text-white">
                      {c.label}
                    </strong>
                    {c.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] py-6 text-[13px] sm:flex-row">
          <p>&copy; 2026 Aesthetic Lounge Official. All rights reserved.</p>
          <p>Crafted with care in Lahore</p>
        </div>
      </div>
    </footer>
  );
}

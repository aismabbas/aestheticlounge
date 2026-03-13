export default function CTABanner() {
  return (
    <section id="book" className="relative overflow-hidden bg-text-dark py-24 lg:py-30">
      {/* Subtle glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(184,146,74,0.1)_0%,transparent_50%),radial-gradient(ellipse_at_70%_60%,rgba(184,146,74,0.06)_0%,transparent_50%)]" />

      <div className="relative z-[1] mx-auto max-w-[1320px] px-5 text-center md:px-8">
        <h2 className="mb-5 font-serif text-[clamp(36px,5vw,56px)] leading-[1.15] font-bold tracking-tight text-white">
          Ready to Begin Your{" "}
          <em className="gold-shimmer-text italic">Transformation?</em>
        </h2>
        <p className="mx-auto mb-11 max-w-[480px] text-[17px] leading-[1.7] text-white/60">
          Book a free consultation with our experts. No pressure, just honest advice tailored to
          you.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/book"
            className="gold-shimmer-bg inline-flex items-center gap-2.5 rounded-md px-11 py-4.5 text-sm font-semibold uppercase tracking-[0.04em] text-white transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(184,146,74,0.3)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Book Online
          </a>
          <a
            href="https://wa.me/923276660004?text=Hi%2C%20I'd%20like%20to%20book%20a%20consultation"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-md border-[1.5px] border-white/25 bg-transparent px-11 py-4.5 text-sm font-semibold uppercase tracking-[0.04em] text-white transition-all duration-400 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/8"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp Us
          </a>
          <a
            href="tel:+923276660004"
            className="inline-flex items-center gap-2.5 rounded-md border-[1.5px] border-white/25 bg-transparent px-11 py-4.5 text-sm font-semibold uppercase tracking-[0.04em] text-white transition-all duration-400 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/8"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            Call Us
          </a>
        </div>
      </div>
    </section>
  );
}

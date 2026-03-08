import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Aesthetic Lounge — DHA Phase 8, Lahore",
  description:
    "Get in touch with Aesthetic Lounge. Visit us at Plaza-126, BWB Phase 8, DHA Lahore Cantt. Call +92 327 6620000 or WhatsApp us. By appointment only.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark py-20 text-center text-white">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight">
          Contact Us
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
          We would love to hear from you. Reach out to book an appointment or
          ask any questions.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="rounded-2xl border border-gold-pale bg-white p-8 shadow-sm">
            <h2 className="font-serif text-2xl text-text-dark">
              Send Us a Message
            </h2>
            <form className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-sm font-medium text-text-dark"
                >
                  Full Name <span className="text-gold">*</span>
                </label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  required
                  placeholder="Your full name"
                  className="mt-1 w-full rounded-lg border border-gold-pale px-4 py-3 text-sm text-text-dark placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-sm font-medium text-text-dark"
                >
                  Phone Number <span className="text-gold">*</span>
                </label>
                <input
                  type="tel"
                  id="contact-phone"
                  name="phone"
                  required
                  placeholder="+92 300 1234567"
                  className="mt-1 w-full rounded-lg border border-gold-pale px-4 py-3 text-sm text-text-dark placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-sm font-medium text-text-dark"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  placeholder="your@email.com"
                  className="mt-1 w-full rounded-lg border border-gold-pale px-4 py-3 text-sm text-text-dark placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-text-dark"
                >
                  Message <span className="text-gold">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  placeholder="How can we help you?"
                  className="mt-1 w-full rounded-lg border border-gold-pale px-4 py-3 text-sm text-text-dark placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-gold py-3 font-medium text-white transition-colors hover:bg-gold-dark"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                Visit Us
              </h3>
              <p className="mt-2 text-text-dark leading-relaxed">
                Aesthetic Lounge
                <br />
                Plaza-126, BWB Phase 8
                <br />
                DHA Lahore Cantt, Pakistan
              </p>
            </div>

            {/* Phone */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                Call Us
              </h3>
              <a
                href="tel:+923276620000"
                className="mt-2 block text-text-dark hover:text-gold transition-colors"
              >
                +92 327 6620000
              </a>
              <a
                href="tel:+924235740271"
                className="mt-1 block text-text-dark hover:text-gold transition-colors"
              >
                +92 42 35740271
              </a>
            </div>

            {/* WhatsApp */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                WhatsApp
              </h3>
              <a
                href="https://wa.me/923276620000?text=Hi%2C%20I%20would%20like%20to%20get%20in%20touch%20with%20Aesthetic%20Lounge."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-full border border-gold px-6 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-white"
              >
                Chat on WhatsApp
              </a>
            </div>

            {/* Email */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                Email
              </h3>
              <a
                href="mailto:info@aestheticloungeofficial.com"
                className="mt-2 block text-text-dark hover:text-gold transition-colors"
              >
                info@aestheticloungeofficial.com
              </a>
            </div>

            {/* Hours */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                Working Hours
              </h3>
              <div className="mt-2 space-y-1 text-sm text-text-light">
                <p>Monday &ndash; Saturday: 10:00 AM &ndash; 9:00 PM</p>
                <p>By Appointment Only</p>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="aspect-[4/3] rounded-2xl bg-warm-white border border-gold-pale flex items-center justify-center">
              <div className="text-center text-text-muted">
                <p className="text-2xl mb-2">📍</p>
                <p className="text-sm font-medium">
                  Plaza-126, BWB Phase 8, DHA Lahore Cantt
                </p>
                <p className="text-xs mt-1">
                  Interactive map coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

'use client';

import { useState, FormEvent } from 'react';
import { getUTMParams } from '@/lib/utm';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const form = e.currentTarget;
    const fd = new FormData(form);
    const utm = getUTMParams();

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          phone: fd.get('phone'),
          email: fd.get('email') || undefined,
          message: fd.get('message'),
          treatment: undefined,
          landing_page: window.location.pathname,
          ...utm,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark pt-32 pb-20 text-center text-white">
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

            {status === 'success' ? (
              <div className="mt-6 rounded-lg bg-green-50 border border-green-200 p-6 text-center">
                <p className="text-green-800 font-medium">Thank you! We received your message.</p>
                <p className="text-green-600 text-sm mt-1">We will get back to you within 2 hours via WhatsApp or phone.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-4 text-sm text-gold hover:text-gold-dark font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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

                {status === 'error' && (
                  <p className="text-sm text-red-600">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full rounded-full bg-gold py-3 font-medium text-white transition-colors hover:bg-gold-dark disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
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

            {/* Social Profiles */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                Follow Us
              </h3>
              <div className="mt-3 flex gap-3">
                <a
                  href="https://instagram.com/aestheticloungeofficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-pale bg-warm-white text-text-light transition-all hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
                <a
                  href="https://facebook.com/people/Aestheticloungeofficial/61567387603705/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-pale bg-warm-white text-text-light transition-all hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                  aria-label="Facebook"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
                <a
                  href="https://youtube.com/@aestheticloungeofficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-pale bg-warm-white text-text-light transition-all hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                  aria-label="YouTube"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 9.71a8.5 8.5 0 00-.91-4.13 2.92 2.92 0 00-1.72-1A78.4 78.4 0 0012 4.27a78.5 78.5 0 00-8.34.3 2.87 2.87 0 00-1.46.74c-.9.83-1 2.25-1.1 3.45a48.3 48.3 0 000 6.48 9.2 9.2 0 00.3 2 3.35 3.35 0 00.76 1.6A3.09 3.09 0 004 19.74a78.2 78.2 0 008.12.36 78.2 78.2 0 008.12-.36 3.09 3.09 0 001.84-.79 3.35 3.35 0 00.76-1.6 9.2 9.2 0 00.3-2 48.3 48.3 0 00-.14-6.64zM9.74 14.85V8.66l5.92 3.11z" />
                  </svg>
                </a>
                <a
                  href="https://wa.me/923276620000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-pale bg-warm-white text-text-light transition-all hover:-translate-y-0.5 hover:border-[#25D366] hover:text-[#25D366]"
                  aria-label="WhatsApp"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="aspect-[4/3] rounded-2xl bg-warm-white border border-gold-pale flex items-center justify-center">
              <div className="text-center text-text-muted">
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

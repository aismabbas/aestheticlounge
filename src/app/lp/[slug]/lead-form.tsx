'use client';

import { useState } from 'react';
import { getUTMParams } from '@/lib/utm';
import { trackLead } from '@/lib/tracking';

interface LeadFormProps {
  treatment: string;
  whatsappMessage: string;
}

export default function LeadForm({ treatment, whatsappMessage }: LeadFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    best_time: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setStatus('submitting');

    try {
      const utm = getUTMParams();
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          treatment,
          message: formData.best_time
            ? `Best time to call: ${formData.best_time}`
            : undefined,
          ...utm,
        }),
      });

      if (!res.ok) throw new Error('Submit failed');

      trackLead(treatment);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    const waLink = `https://wa.me/923276620000?text=${encodeURIComponent(whatsappMessage)}`;
    return (
      <div className="rounded-2xl border border-gold/20 bg-white p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="mb-2 font-serif text-2xl font-bold text-text-dark">
          Thank You!
        </h3>
        <p className="mb-6 text-text-light">
          We&apos;ll call you within <strong className="text-text-dark">15 minutes</strong> during
          business hours. For instant response:
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-lg bg-whatsapp px-8 py-3.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(37,211,102,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,211,102,0.35)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Chat on WhatsApp Instead
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gold/20 bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)]"
    >
      <h3 className="mb-1 font-serif text-xl font-bold text-text-dark">
        Book Your Free Consultation
      </h3>
      <p className="mb-6 text-sm text-text-light">
        Fill in your details and we&apos;ll call you within 15 minutes.
      </p>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="lf-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            id="lf-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your full name"
            className="w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-sm text-text-dark outline-none transition-colors placeholder:text-text-muted focus:border-gold focus:ring-1 focus:ring-gold/30"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="lf-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
            Phone Number <span className="text-red-400">*</span>
          </label>
          <input
            id="lf-phone"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="03XX-XXXXXXX"
            className="w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-sm text-text-dark outline-none transition-colors placeholder:text-text-muted focus:border-gold focus:ring-1 focus:ring-gold/30"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="lf-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
            Email <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <input
            id="lf-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-sm text-text-dark outline-none transition-colors placeholder:text-text-muted focus:border-gold focus:ring-1 focus:ring-gold/30"
          />
        </div>

        {/* Treatment (pre-filled, read-only) */}
        <div>
          <label htmlFor="lf-treatment" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
            Treatment Interest
          </label>
          <input
            id="lf-treatment"
            type="text"
            readOnly
            value={treatment}
            className="w-full rounded-lg border border-border bg-gold-pale/40 px-4 py-3 text-sm font-medium text-text-dark outline-none"
          />
        </div>

        {/* Best time to call */}
        <div>
          <label htmlFor="lf-time" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
            Best Time to Call
          </label>
          <select
            id="lf-time"
            value={formData.best_time}
            onChange={(e) => setFormData({ ...formData, best_time: e.target.value })}
            className="w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-sm text-text-dark outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/30"
          >
            <option value="">Any time</option>
            <option value="Morning (10am-12pm)">Morning (10am-12pm)</option>
            <option value="Afternoon (12pm-4pm)">Afternoon (12pm-4pm)</option>
            <option value="Evening (4pm-8pm)">Evening (4pm-8pm)</option>
          </select>
        </div>
      </div>

      {status === 'error' && (
        <p className="mt-4 text-sm text-red-500">
          Something went wrong. Please try again or call us directly.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="gold-shimmer-bg mt-6 w-full rounded-lg px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(184,146,74,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(184,146,74,0.4)] disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {status === 'submitting' ? 'Submitting...' : 'Book Free Consultation'}
      </button>

      <p className="mt-3 text-center text-xs text-text-muted">
        No spam. No obligation. 100% confidential.
      </p>
    </form>
  );
}

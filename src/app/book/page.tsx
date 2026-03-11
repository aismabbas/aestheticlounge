"use client";

import { useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { categories, allTreatments } from "@/data/services";
import { getUTMParams } from "@/lib/utm";

function BookingForm() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("treatment") ?? "";
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const form = e.currentTarget;
    const fd = new FormData(form);
    const utm = getUTMParams();

    // Resolve treatment slug to display name
    const treatmentSlug = fd.get('treatment') as string;
    const treatment = allTreatments.find(t => t.slug === treatmentSlug);
    const treatmentName = treatment?.name || treatmentSlug;

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          phone: fd.get('phone'),
          email: fd.get('email') || undefined,
          treatment: treatmentName,
          date: fd.get('date'),
          time: fd.get('time'),
          notes: fd.get('notes') || undefined,
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

  if (status === 'success') {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-8 text-center">
        <p className="text-green-800 font-medium text-lg">Appointment Requested!</p>
        <p className="text-green-600 text-sm mt-2">We will confirm your appointment via WhatsApp or phone within 2 hours.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-gold hover:text-gold-dark font-medium"
        >
          Book another appointment
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Treatment selector */}
      <div>
        <label
          htmlFor="book-treatment"
          className="block text-sm font-medium text-text-dark"
        >
          Treatment <span className="text-gold">*</span>
        </label>
        <select
          id="book-treatment"
          name="treatment"
          required
          defaultValue={preselected}
          className="mt-1 w-full rounded-lg border border-gold-pale bg-white px-4 py-3 text-sm text-text-dark focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        >
          <option value="">Select a treatment</option>
          {categories.map((cat) => (
            <optgroup key={cat.slug} label={cat.name}>
              {cat.treatments.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name} — {t.priceDisplay}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Preferred Date */}
      <div>
        <label
          htmlFor="book-date"
          className="block text-sm font-medium text-text-dark"
        >
          Preferred Date <span className="text-gold">*</span>
        </label>
        <input
          type="date"
          id="book-date"
          name="date"
          required
          min={new Date().toISOString().split('T')[0]}
          className="mt-1 w-full rounded-lg border border-gold-pale px-4 py-3 text-sm text-text-dark focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      {/* Preferred Time */}
      <div>
        <label
          htmlFor="book-time"
          className="block text-sm font-medium text-text-dark"
        >
          Preferred Time <span className="text-gold">*</span>
        </label>
        <select
          id="book-time"
          name="time"
          required
          className="mt-1 w-full rounded-lg border border-gold-pale bg-white px-4 py-3 text-sm text-text-dark focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        >
          <option value="">Select a time</option>
          <option value="10:00">10:00 AM</option>
          <option value="11:00">11:00 AM</option>
          <option value="12:00">12:00 PM</option>
          <option value="13:00">1:00 PM</option>
          <option value="14:00">2:00 PM</option>
          <option value="15:00">3:00 PM</option>
          <option value="16:00">4:00 PM</option>
          <option value="17:00">5:00 PM</option>
          <option value="18:00">6:00 PM</option>
          <option value="19:00">7:00 PM</option>
          <option value="20:00">8:00 PM</option>
        </select>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="book-name"
          className="block text-sm font-medium text-text-dark"
        >
          Full Name <span className="text-gold">*</span>
        </label>
        <input
          type="text"
          id="book-name"
          name="name"
          required
          placeholder="Your full name"
          className="mt-1 w-full rounded-lg border border-gold-pale px-4 py-3 text-sm text-text-dark placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="book-phone"
          className="block text-sm font-medium text-text-dark"
        >
          Phone Number <span className="text-gold">*</span>
        </label>
        <input
          type="tel"
          id="book-phone"
          name="phone"
          required
          placeholder="+92 300 1234567"
          className="mt-1 w-full rounded-lg border border-gold-pale px-4 py-3 text-sm text-text-dark placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="book-email"
          className="block text-sm font-medium text-text-dark"
        >
          Email Address
        </label>
        <input
          type="email"
          id="book-email"
          name="email"
          placeholder="your@email.com"
          className="mt-1 w-full rounded-lg border border-gold-pale px-4 py-3 text-sm text-text-dark placeholder:text-text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="book-notes"
          className="block text-sm font-medium text-text-dark"
        >
          Additional Notes
        </label>
        <textarea
          id="book-notes"
          name="notes"
          rows={3}
          placeholder="Any specific concerns or questions?"
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
        {status === 'submitting' ? 'Submitting...' : 'Request Appointment'}
      </button>

      <p className="text-center text-xs text-text-muted">
        We will confirm your appointment via WhatsApp or phone within 2 hours.
      </p>
    </form>
  );
}

export default function BookPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark pt-32 pb-20 text-center text-white">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight">
          Book an Appointment
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
          Choose your treatment, pick a time, and we will take care of the rest.
        </p>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gold-pale bg-white p-8 shadow-sm">
          <Suspense
            fallback={
              <div className="py-12 text-center text-text-muted">
                Loading booking form...
              </div>
            }
          >
            <BookingForm />
          </Suspense>
        </div>

        {/* Alternative */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-muted">
            Prefer to book directly?
          </p>
          <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://wa.me/923276620000?text=Hi%2C%20I%20would%20like%20to%20book%20an%20appointment%20at%20Aesthetic%20Lounge."
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-gold px-6 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-white"
            >
              WhatsApp Us
            </a>
            <a
              href="tel:+923276620000"
              className="rounded-full border border-gold px-6 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-white"
            >
              Call +92 327 6620000
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

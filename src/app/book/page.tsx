"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { categories, allTreatments } from "@/data/services";

function BookingForm() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("treatment") ?? "";

  return (
    <form className="space-y-6">
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

      <button
        type="submit"
        className="w-full rounded-full bg-gold py-3 font-medium text-white transition-colors hover:bg-gold-dark"
      >
        Request Appointment
      </button>

      <p className="text-center text-xs text-text-muted">
        We will confirm your appointment via WhatsApp or phone within 2 hours.
      </p>
    </form>
  );
}

export default function BookPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark py-20 text-center text-white">
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
    </main>
  );
}

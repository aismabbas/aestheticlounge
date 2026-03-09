'use client';

import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  'Service Quality',
  'Wait Times',
  'Staff Behavior',
  'Cleanliness',
  'Billing',
  'Other',
];

export default function ComplaintPage() {
  const [category, setCategory] = useState('');
  const [complaint, setComplaint] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!category) {
      setError('Please select a category.');
      return;
    }
    if (complaint.trim().length < 20) {
      setError('Please provide at least 20 characters describing your concern.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint: complaint.trim(),
          category,
          client_name: clientName.trim() || null,
          client_phone: clientPhone.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
            <span className="text-3xl">&#128172;</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-text-dark mb-4">
            Received
          </h1>
          <p className="text-text-light leading-relaxed mb-8">
            Your complaint has been received. We take all feedback seriously and
            will review this promptly. If you provided contact details, we may
            reach out to follow up.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/feedback"
              className="inline-block rounded-md border border-border bg-white px-6 py-3 text-sm font-medium text-text-dark transition-all hover:-translate-y-0.5"
            >
              Leave Feedback
            </Link>
            <Link
              href="/"
              className="inline-block rounded-md bg-[#4A4A4A] px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="mx-auto max-w-2xl px-5 pt-32 pb-12 md:pb-20">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-text-dark mb-3">
            We Want to Hear From You
          </h1>
          <p className="text-text-light max-w-lg mx-auto">
            Your feedback helps us improve. All complaints are reviewed by
            management and taken seriously.
          </p>
        </div>

        {/* Privacy notice */}
        <div className="bg-blue-50/80 border border-blue-100 rounded-xl px-6 py-4 mb-8 flex items-start gap-3">
          <span className="text-blue-500 text-lg mt-0.5">&#128274;</span>
          <p className="text-sm text-blue-900/80 leading-relaxed">
            Your identity is completely anonymous unless you choose to share it.
            We do not track IPs or any identifying information.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-border p-8 md:p-10 space-y-8"
        >
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#F8F7F4] px-4 py-3 text-sm text-text-dark focus:border-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#4A4A4A]/20 transition-colors appearance-none"
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Complaint */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              Describe your concern <span className="text-red-500">*</span>
            </label>
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={5}
              placeholder="Please describe what happened in detail..."
              className="w-full rounded-lg border border-border bg-[#F8F7F4] px-4 py-3 text-sm text-text-dark placeholder:text-text-muted/50 focus:border-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#4A4A4A]/20 transition-colors resize-none"
            />
            <p className="text-xs text-text-muted mt-1.5">
              Minimum 20 characters.{' '}
              {complaint.length > 0 && (
                <span
                  className={
                    complaint.trim().length >= 20
                      ? 'text-green-600'
                      : 'text-amber-600'
                  }
                >
                  ({complaint.trim().length}/20)
                </span>
              )}
            </p>
          </div>

          {/* Optional contact */}
          <div className="border-t border-border pt-8">
            <p className="text-sm font-medium text-text-dark mb-1">
              Contact Information{' '}
              <span className="text-text-muted font-normal">(optional)</span>
            </p>
            <p className="text-xs text-text-muted mb-5">
              Only provide if you would like us to follow up with you.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-border bg-[#F8F7F4] px-4 py-3 text-sm text-text-dark placeholder:text-text-muted/50 focus:border-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#4A4A4A]/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                  Phone
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+92 3XX XXXXXXX"
                  className="w-full rounded-lg border border-border bg-[#F8F7F4] px-4 py-3 text-sm text-text-dark placeholder:text-text-muted/50 focus:border-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#4A4A4A]/20 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#4A4A4A] py-4 text-sm font-semibold text-white transition-all hover:bg-[#3A3A3A] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>

          <p className="text-center text-xs text-text-muted">
            Want to leave a positive review instead?{' '}
            <Link href="/feedback" className="text-gold hover:underline">
              Share feedback
            </Link>
          </p>

          {/* Privacy notice */}
          <p className="text-center text-xs text-text-muted/70 mt-3">
            All complaints are handled in accordance with our{' '}
            <Link href="/privacy" className="text-[#4A4A4A]/60 hover:text-[#4A4A4A] hover:underline">
              Privacy Policy
            </Link>
            . Your identity remains anonymous unless you choose to share it.
          </p>
        </form>
      </div>
    </div>
  );
}

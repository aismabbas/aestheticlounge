'use client';

import { useState } from 'react';
import Link from 'next/link';

const TREATMENTS = [
  'Classical Facial',
  'Gold Facial',
  'Whitening Facial',
  'HydraFacial',
  'Vampire Facial (PRP)',
  'Carbon Peel Laser',
  'Chemical Peel',
  'Microneedling',
  'Dermal Fillers',
  'Botox & Anti-Wrinkle',
  'Lip Augmentation',
  'Thread Lift',
  'Laser Hair Removal',
  'IPL Photofacial',
  'Tattoo Removal',
  'Hair PRP',
  'Hair Mesotherapy',
  'Hair Transplant',
  'Body Contouring',
  'Fat Dissolving Injections',
  'Skin Tag Removal',
  'Mole Removal',
  'Acne Treatment',
  'Pigmentation Treatment',
  'IV Drip Therapy',
  'Other',
];

export default function FeedbackPage() {
  const [name, setName] = useState('');
  const [treatment, setTreatment] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [improvements, setImprovements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!feedback.trim()) {
      setError('Please share your experience.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: name.trim() || null,
          treatment: treatment || null,
          rating,
          feedback: feedback.trim(),
          would_recommend: wouldRecommend,
          improvements: improvements.trim() || null,
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
      <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
            <span className="text-4xl text-gold">&#10003;</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-text-dark mb-4">
            Thank You!
          </h1>
          <p className="text-text-light leading-relaxed mb-8">
            Thank you for your feedback! We appreciate your time and value your
            opinion. It helps us continue to deliver the best care possible.
          </p>
          <Link
            href="/"
            className="inline-block rounded-md bg-gold px-8 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="gold-shimmer-bg flex h-10 w-10 items-center justify-center rounded-full font-serif text-lg font-bold text-white">
              A
            </div>
            <div className="font-serif text-xl font-semibold tracking-tight">
              Aesthetic <span className="text-gold">Lounge</span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm text-text-light hover:text-gold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-12 md:py-20">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-text-dark mb-3">
            Share Your Experience
          </h1>
          <p className="text-text-light max-w-md mx-auto">
            Your feedback helps us maintain the highest standards of care.
            We read every response.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-border p-8 md:p-10 space-y-8"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leave blank for anonymous"
              className="w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-sm text-text-dark placeholder:text-text-muted/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors"
            />
          </div>

          {/* Treatment */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              Treatment Received
            </label>
            <select
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              className="w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-sm text-text-dark focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors appearance-none"
            >
              <option value="">Select a treatment...</option>
              {TREATMENTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-3">
              How would you rate your experience? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill={star <= (hoverRating || rating) ? '#B8924A' : 'none'}
                    stroke={star <= (hoverRating || rating) ? '#B8924A' : '#D1D5DB'}
                    strokeWidth="1.5"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-text-muted mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Below Average'}
                {rating === 3 && 'Average'}
                {rating === 4 && 'Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              How was your experience? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Tell us about your visit..."
              className="w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-sm text-text-dark placeholder:text-text-muted/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors resize-none"
            />
          </div>

          {/* Would Recommend */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-3">
              Would you recommend us to friends & family?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-all ${
                  wouldRecommend === true
                    ? 'border-gold bg-gold/5 text-gold'
                    : 'border-border text-text-light hover:border-gold/40'
                }`}
              >
                Yes, definitely!
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-all ${
                  wouldRecommend === false
                    ? 'border-gold bg-gold/5 text-gold'
                    : 'border-border text-text-light hover:border-gold/40'
                }`}
              >
                Not right now
              </button>
            </div>
          </div>

          {/* Improvements */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              What could we improve?{' '}
              <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={3}
              placeholder="Any suggestions for how we can do better..."
              className="w-full rounded-lg border border-border bg-warm-white px-4 py-3 text-sm text-text-dark placeholder:text-text-muted/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors resize-none"
            />
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
            className="w-full rounded-lg bg-gold py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>

          {/* Complaint link */}
          <p className="text-center text-xs text-text-muted">
            Have a concern?{' '}
            <Link
              href="/feedback/complaint"
              className="text-gold hover:underline"
            >
              Submit an anonymous complaint
            </Link>
          </p>

          {/* Privacy notice */}
          <p className="text-center text-xs text-text-muted/70 mt-3">
            Your feedback is handled in accordance with our{' '}
            <Link href="/privacy" className="text-gold/70 hover:text-gold hover:underline">
              Privacy Policy
            </Link>
            . Contact details are only used to follow up if you request it.
          </p>
        </form>
      </div>
    </div>
  );
}

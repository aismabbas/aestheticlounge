'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LiveAd {
  id: string;
  campaign: string;
  headline: string | null;
  body: string | null;
  cta: string | null;
  image_url: string | null;
  treatment: string;
}

const ctaLabels: Record<string, string> = {
  BOOK_TRAVEL: 'Book Now',
  BOOK_NOW: 'Book Now',
  LEARN_MORE: 'Learn More',
  SIGN_UP: 'Sign Up',
  CONTACT_US: 'Contact Us',
};

export default function Promotions() {
  const [ads, setAds] = useState<LiveAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/promotions/active-ads')
      .then((r) => r.json())
      .then((data) => {
        setAds((data.ads || []).slice(0, 3));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="promotions" className="relative bg-warm-white py-20 lg:py-36">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8">
          <div className="animate-pulse grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-border-light rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (ads.length === 0) return null;

  return (
    <section id="promotions" className="relative bg-warm-white py-20 lg:py-36">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(184,146,74,0.06)_0%,transparent_60%)]" />

      <div className="relative mx-auto max-w-[1320px] px-5 md:px-8">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
            Current Promotions
          </div>
          <h2 className="mb-4 font-serif text-[clamp(32px,4vw,48px)] leading-[1.15] font-semibold tracking-tight">
            Special Offers <em className="italic text-gold">for You</em>
          </h2>
          <p className="mx-auto max-w-[520px] text-base leading-[1.7] text-text-light">
            Take advantage of our featured treatments and book your appointment
            today.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gold-light bg-white shadow-[0_2px_20px_rgba(184,146,74,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(184,146,74,0.18)]"
            >
              {/* Ad creative image */}
              {ad.image_url ? (
                <div className="relative aspect-[4/5] overflow-hidden bg-warm-white">
                  <Image
                    src={ad.image_url}
                    alt={ad.headline || ad.treatment}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.closest('[class*="aspect-"]');
                      if (parent) {
                        (parent as HTMLElement).classList.add('flex', 'items-center', 'justify-center');
                        const fallback = document.createElement('div');
                        fallback.className = 'flex flex-col items-center gap-3 text-gold/40';
                        fallback.innerHTML = '<svg class="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span class="text-xs">Image unavailable</span>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

                  {/* Treatment tag */}
                  <span className="absolute top-4 left-4 rounded-full border border-white/20 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-dark backdrop-blur-sm">
                    {ad.treatment
                      .replace(/^AL\s*-\s*/i, '')
                      .replace(/\s*-\s*\w+\s*\d{4}$/i, '')}
                  </span>
                </div>
              ) : (
                <div className="gold-shimmer-bg h-1" />
              )}

              <div className="flex flex-1 flex-col p-7 pt-6">
                {!ad.image_url && (
                  <span className="mb-3 inline-block w-fit rounded-full border border-gold-pale bg-warm-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-dark">
                    {ad.treatment
                      .replace(/^AL\s*-\s*/i, '')
                      .replace(/\s*-\s*\w+\s*\d{4}$/i, '')}
                  </span>
                )}

                {ad.headline && (
                  <h3 className="mb-2 font-serif text-xl font-semibold tracking-tight text-text-dark transition-colors duration-300 group-hover:text-gold-dark">
                    {ad.headline}
                  </h3>
                )}

                {ad.body && (
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-text-light line-clamp-3">
                    {ad.body}
                  </p>
                )}

                <Link
                  href="/book"
                  className="gold-shimmer-bg inline-flex items-center justify-center rounded-md px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(184,146,74,0.25)]"
                >
                  {ad.cta ? ctaLabels[ad.cta] || 'Book Now' : 'Book Now'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View all link */}
        <div className="mt-12 text-center">
          <Link
            href="/promotions"
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.06em] text-gold transition-colors hover:text-gold-dark"
          >
            View All Promotions
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

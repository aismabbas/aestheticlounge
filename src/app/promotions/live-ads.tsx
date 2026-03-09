'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

export default function LiveAds() {
  const [ads, setAds] = useState<LiveAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/promotions/active-ads')
      .then((r) => r.json())
      .then((data) => {
        setAds(data.ads || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-96 bg-border-light rounded-2xl" />
        ))}
      </div>
    );
  }

  if (ads.length === 0) return null;

  return (
    <div className="mt-20">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
          Featured Campaigns
        </div>
        <h2 className="font-serif text-3xl font-semibold tracking-tight">
          Currently Running
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-text-light">
          See what we&apos;re promoting right now. Book your appointment and take
          advantage of these featured treatments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Treatment tag on image */}
                <span className="absolute top-4 left-4 rounded-full border border-white/20 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-dark backdrop-blur-sm">
                  {ad.treatment}
                </span>

                {/* Live badge */}
                <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-green-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Live
                </span>
              </div>
            ) : (
              <>
                <div className="gold-shimmer-bg h-1.5" />
                <div className="p-4">
                  <span className="inline-block rounded-full border border-gold-pale bg-warm-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-dark">
                    {ad.treatment}
                  </span>
                </div>
              </>
            )}

            <div className="flex flex-1 flex-col p-6">
              {ad.headline && (
                <h3 className="mb-2 font-serif text-xl font-semibold tracking-tight text-text-dark">
                  {ad.headline}
                </h3>
              )}

              {ad.body && (
                <p className="mb-5 flex-1 text-sm leading-relaxed text-text-light line-clamp-4">
                  {ad.body}
                </p>
              )}

              <Link
                href="/book"
                className="gold-shimmer-bg inline-flex items-center justify-center rounded-md px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(184,146,74,0.25)]"
              >
                {ad.cta ? ctaLabels[ad.cta] || 'Book Now' : 'Book Now'}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

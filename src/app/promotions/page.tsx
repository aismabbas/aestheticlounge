import { Metadata } from "next";
import Link from "next/link";
import LiveAds from "./live-ads";

export const metadata: Metadata = {
  title: "Promotions & Special Offers | Aesthetic Lounge — DHA Phase 7, Lahore",
  description:
    "Exclusive deals on HydraFacial, laser hair removal, Botox, PRP, and more at Aesthetic Lounge, Lahore. Limited-time packages at unbeatable prices.",
};

export default function PromotionsPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark pt-32 pb-20 text-center text-white">
        <h1 className="font-serif text-4xl tracking-tight md:text-5xl lg:text-6xl">
          Promotions &{" "}
          <em className="gold-shimmer-text italic">Special Offers</em>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
          Exclusive packages and limited-time deals on our most popular
          treatments. Book now before they expire.
        </p>
      </section>

      {/* Live Ads from Meta */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <LiveAds />

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-gold-pale bg-white p-8 text-center">
          <p className="mb-2 font-serif text-xl text-text-dark">
            Don&apos;t see what you&apos;re looking for?
          </p>
          <p className="mb-5 text-sm text-text-light">
            Contact us for custom packages tailored to your goals.
          </p>
          <Link
            href="/book"
            className="gold-shimmer-bg inline-block rounded-md px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(184,146,74,0.25)]"
          >
            Book Free Consultation
          </Link>
        </div>
      </section>
    </main>
  );
}

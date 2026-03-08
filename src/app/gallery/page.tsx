"use client";

import { useState } from "react";
import { categories } from "@/data/services";

const galleryItems = [
  { id: 1, category: "dermal-fillers", treatment: "Lip Fillers", label: "Lip Enhancement" },
  { id: 2, category: "dermal-fillers", treatment: "Cheek Fillers", label: "Cheek Contouring" },
  { id: 3, category: "dermal-fillers", treatment: "Jawline Contouring", label: "Jawline Definition" },
  { id: 4, category: "botox-anti-wrinkle", treatment: "Forehead Lines", label: "Forehead Smoothing" },
  { id: 5, category: "botox-anti-wrinkle", treatment: "Crow's Feet", label: "Eye Area Rejuvenation" },
  { id: 6, category: "skin-rejuvenation", treatment: "HIFU Face Lift", label: "Non-Surgical Lift" },
  { id: 7, category: "skin-rejuvenation", treatment: "Carbon Laser Facial", label: "Skin Glow" },
  { id: 8, category: "skin-rejuvenation", treatment: "Microneedling", label: "Texture Improvement" },
  { id: 9, category: "chemical-peels", treatment: "TCA Peel", label: "Pigmentation Correction" },
  { id: 10, category: "thread-lifts", treatment: "PDO Thread Lift", label: "Face Lift" },
  { id: 11, category: "hydrafacial", treatment: "Deluxe HydraFacial", label: "Deep Hydration" },
  { id: 12, category: "dental-aesthetics", treatment: "Dental Veneers", label: "Smile Makeover" },
  { id: 13, category: "dental-aesthetics", treatment: "Teeth Whitening", label: "Teeth Whitening" },
  { id: 14, category: "hair-restoration", treatment: "PRP Hair Treatment", label: "Hair Regrowth" },
  { id: 15, category: "body-contouring", treatment: "CoolSculpting", label: "Body Sculpting" },
  { id: 16, category: "prp-therapy", treatment: "Vampire Facial", label: "Skin Regeneration" },
];

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredItems =
    activeFilter === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeFilter);

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-text-dark py-20 text-center text-white">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight">
          Before &amp; After Gallery
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
          Real results from real patients. See the transformations achieved at
          Aesthetic Lounge.
        </p>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm border-b border-gold-pale">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === "all"
                  ? "bg-gold text-white"
                  : "bg-white text-text-dark border border-gold-pale hover:border-gold"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveFilter(cat.slug)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === cat.slug
                    ? "bg-gold text-white"
                    : "bg-white text-text-dark border border-gold-pale hover:border-gold"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {filteredItems.length === 0 ? (
          <p className="py-20 text-center text-text-muted">
            No gallery items in this category yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-gold-pale bg-white shadow-sm"
              >
                {/* Before / After placeholder */}
                <div className="grid grid-cols-2">
                  <div className="aspect-square bg-warm-white flex items-center justify-center border-r border-gold-pale">
                    <div className="text-center text-text-muted">
                      <p className="text-xs font-medium uppercase tracking-wider">
                        Before
                      </p>
                      <p className="text-[10px] mt-1">Photo placeholder</p>
                    </div>
                  </div>
                  <div className="aspect-square bg-gold-pale/50 flex items-center justify-center">
                    <div className="text-center text-text-muted">
                      <p className="text-xs font-medium uppercase tracking-wider">
                        After
                      </p>
                      <p className="text-[10px] mt-1">Photo placeholder</p>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-serif text-lg text-text-dark">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-xs text-text-muted">
                    {item.treatment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-12 text-center text-xs text-text-muted">
          Individual results may vary. All photos are of actual Aesthetic Lounge
          patients and are shared with their written consent.
        </p>
      </section>
    </main>
  );
}

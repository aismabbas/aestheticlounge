"use client";

import { useState } from "react";
import { categories } from "@/data/services";

const galleryItems = [
  { id: 1, category: "dermal-fillers", treatment: "Lip Fillers", label: "Lip Enhancement", slug: "lip-fillers", folder: "before-after" },
  { id: 2, category: "dermal-fillers", treatment: "Cheek Fillers", label: "Cheek Contouring", slug: "cheek-fillers", folder: "gallery" },
  { id: 3, category: "dermal-fillers", treatment: "Jawline Contouring", label: "Jawline Definition", slug: "jawline-contouring", folder: "gallery" },
  { id: 4, category: "botox-anti-wrinkle", treatment: "Forehead Lines", label: "Forehead Smoothing", slug: "botox-forehead", folder: "before-after" },
  { id: 5, category: "botox-anti-wrinkle", treatment: "Crow's Feet", label: "Eye Area Rejuvenation", slug: "crows-feet", folder: "gallery" },
  { id: 6, category: "skin-rejuvenation", treatment: "HIFU Face Lift", label: "Non-Surgical Lift", slug: "hifu-facelift", folder: "gallery" },
  { id: 7, category: "skin-rejuvenation", treatment: "Carbon Laser Facial", label: "Skin Glow", slug: "carbon-laser", folder: "gallery" },
  { id: 8, category: "skin-rejuvenation", treatment: "Microneedling", label: "Texture Improvement", slug: "microneedling", folder: "gallery" },
  { id: 9, category: "skin-rejuvenation", treatment: "Exosome Therapy", label: "Skin Regeneration", slug: "exosomes", folder: "before-after" },
  { id: 10, category: "chemical-peels", treatment: "TCA Peel", label: "Pigmentation Correction", slug: "tca-peel", folder: "gallery" },
  { id: 11, category: "chemical-peels", treatment: "Pigmentation", label: "Laser Pigmentation", slug: "pigmentation", folder: "before-after" },
  { id: 12, category: "thread-lifts", treatment: "PDO Thread Lift", label: "Face Lift", slug: "pdo-thread-lift", folder: "gallery" },
  { id: 13, category: "hydrafacial", treatment: "Deluxe HydraFacial", label: "Deep Hydration", slug: "hydrafacial", folder: "before-after" },
  { id: 14, category: "hair-restoration", treatment: "PRP Hair Treatment", label: "Hair Regrowth", slug: "prp-hair", folder: "gallery" },
  { id: 15, category: "body-contouring", treatment: "CoolSculpting", label: "Body Sculpting", slug: "coolsculpting", folder: "gallery" },
  { id: 16, category: "chemical-peels", treatment: "Acne Scarring", label: "Acne Scar Treatment", slug: "acne-scarring", folder: "before-after" },
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
      <section className="bg-text-dark pt-32 pb-20 text-center text-white">
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
                {/* Before / After images */}
                <div className="grid grid-cols-2">
                  <div className="aspect-square overflow-hidden border-r border-gold-pale relative">
                    <img src={`/images/${item.folder}/${item.slug}-before.png`} alt={`${item.label} — Before`} className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 left-2 rounded bg-text-dark/70 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Before</span>
                  </div>
                  <div className="aspect-square overflow-hidden relative">
                    <img src={`/images/${item.folder}/${item.slug}-after.png`} alt={`${item.label} — After`} className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 right-2 rounded bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-white">After</span>
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

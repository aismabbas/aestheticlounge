"use client";

import { useRef, useCallback } from "react";

const comparisons = [
  { title: "Lip Enhancement", treatment: "Dermal Fillers" },
  { title: "Acne Scarring", treatment: "Chemical Peel + PRP" },
  { title: "Pigmentation", treatment: "Laser Treatment" },
  { title: "Skin Glow", treatment: "HydraFacial" },
  { title: "Forehead Lines", treatment: "Botox" },
];

function ComparisonSlider({ title, treatment }: { title: string; treatment: string }) {
  const compRef = useRef<HTMLDivElement>(null);
  const beforeRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback((clientX: number) => {
    const comp = compRef.current;
    const before = beforeRef.current;
    const divider = dividerRef.current;
    if (!comp || !before || !divider) return;

    const rect = comp.getBoundingClientRect();
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    divider.style.left = `${pct}%`;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      update(e.clientX);
    },
    [update]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current) update(e.clientX);
    },
    [update]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div className="flex-shrink-0 snap-start overflow-hidden rounded-[20px] border border-border-light bg-white transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] w-[300px] sm:w-[380px]">
      <div
        ref={compRef}
        className="comparison-slider relative aspect-[4/3] w-full overflow-hidden bg-warm-white"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* After (background) */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F8F0E8] to-[#F2E8D8] text-sm font-semibold uppercase tracking-[0.1em] text-text-muted">
          After
        </div>
        {/* Before (clipped overlay) */}
        <div
          ref={beforeRef}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F0ECE6] to-[#E8E2DA] text-sm font-semibold uppercase tracking-[0.1em] text-text-muted"
          style={{ clipPath: "inset(0 50% 0 0)" }}
        >
          Before
        </div>
        {/* Divider */}
        <div
          ref={dividerRef}
          className="absolute top-0 bottom-0 left-1/2 z-[5] w-0.5 -translate-x-1/2 bg-gold"
        >
          <div className="absolute top-1/2 left-1/2 z-[6] flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-sm text-white shadow-[0_2px_12px_rgba(184,146,74,0.3)]">
            &#x27F7;
          </div>
        </div>
        {/* Labels */}
        <div className="absolute right-3 bottom-3 left-3 z-[7] flex justify-between">
          <span className="rounded bg-text-dark/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-white">
            Before
          </span>
          <span className="rounded bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-white">
            After
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between px-6 py-4.5">
        <strong className="text-[15px]">{title}</strong>
        <span className="text-[13px] text-text-muted">{treatment}</span>
      </div>
    </div>
  );
}

export default function BeforeAfter() {
  return (
    <section id="results" className="bg-cream py-20 lg:py-36">
      <div className="mx-auto max-w-[1320px] px-5 md:px-8">
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold before:block before:h-[1.5px] before:w-8 before:bg-gold">
            Real Results
          </div>
          <h2 className="mb-4 font-serif text-[clamp(32px,4vw,48px)] leading-[1.15] font-semibold tracking-tight">
            Before &amp; <em className="italic text-gold">After</em>
          </h2>
          <p className="mx-auto max-w-[520px] text-base leading-[1.7] text-text-light">
            Swipe through real transformations from real clients. No filters, no editing.
          </p>
        </div>
      </div>
      <div className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-8 md:px-8">
        {comparisons.map((c) => (
          <ComparisonSlider key={c.title} {...c} />
        ))}
      </div>
    </section>
  );
}

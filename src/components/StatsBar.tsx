"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { target: 1000, suffix: "+", label: "Happy Clients" },
  { target: 80, suffix: "+", label: "Treatments" },
  { target: 3, suffix: "", label: "Expert Doctors" },
  { target: 8, suffix: "+", label: "Years Experience" },
];

function useCountUp(target: number, trigger: boolean, duration = 2200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trigger, target, duration]);

  return value;
}

function StatItem({
  target,
  suffix,
  label,
  active,
}: {
  target: number;
  suffix: string;
  label: string;
  active: boolean;
}) {
  const value = useCountUp(target, active);

  return (
    <div className="text-center">
      <div className="gold-shimmer-text font-serif text-[clamp(42px,5vw,60px)] leading-[1.1] font-bold">
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-2 text-sm font-medium uppercase tracking-[0.1em] text-white/50">
        {label}
      </div>
    </div>
  );
}

export default function StatsBar() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden bg-text-dark py-20">
      {/* Subtle glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(184,146,74,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_80%_50%,rgba(184,146,74,0.05)_0%,transparent_50%)]" />

      <div className="relative z-[1] mx-auto max-w-[1320px] px-5 md:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {stats.map((s) => (
            <StatItem key={s.label} {...s} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}

const treatments = [
  "Dermal Fillers",
  "Botox",
  "Laser Treatment",
  "Skin Rejuvenation",
  "HydraFacial",
  "Chemical Peels",
  "Thread Lifts",
  "Hair Restoration",
  "Body Contouring",
  "PRP Therapy",
  "Dental Aesthetics",
];

export default function Marquee() {
  return (
    <div className="overflow-hidden border-y border-border-light bg-white py-7">
      <div className="marquee-track">
        {/* Render twice for seamless loop */}
        {[...treatments, ...treatments].map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="flex items-center gap-14 whitespace-nowrap font-elegant text-xl font-normal tracking-[0.02em] text-text-muted after:text-[10px] after:text-gold-light after:content-['✦']"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

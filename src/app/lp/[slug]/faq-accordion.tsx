'use client';

import { useState } from 'react';

interface FAQAccordionProps {
  faqs: { q: string; a: string }[];
}

export default function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={`overflow-hidden rounded-xl border transition-colors ${
              isOpen ? 'border-gold/30 bg-white shadow-sm' : 'border-border bg-warm-white'
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="text-[15px] font-semibold text-text-dark">{faq.q}</span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all ${
                  isOpen
                    ? 'rotate-45 border-gold bg-gold/10 text-gold'
                    : 'border-border text-text-muted'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="6" y1="1" x2="6" y2="11" />
                  <line x1="1" y1="6" x2="11" y2="6" />
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-[15px] leading-relaxed text-text-light">
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

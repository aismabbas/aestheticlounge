'use client';

import Link from 'next/link';

const PIPELINE_STEPS = [
  { label: 'Template Select', icon: '📐', description: 'Choose a branded carousel template' },
  { label: 'Content Fill', icon: '✍️', description: 'AI-generated copy and imagery' },
  { label: 'Preview', icon: '👁', description: 'Review all slides before publishing' },
  { label: 'Schedule', icon: '📅', description: 'Pick date and time to publish' },
];

export default function CarouselsPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/marketing"
            className="text-text-muted hover:text-text-dark transition-colors text-sm"
          >
            Marketing Studio
          </Link>
          <span className="text-text-muted">/</span>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Carousel Studio</h1>
        </div>
        <button
          disabled
          className="px-5 py-2.5 bg-gold/40 text-white text-sm font-medium rounded-lg cursor-not-allowed"
        >
          Connect Pipeline
        </button>
      </div>

      {/* Pipeline visualization */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-dark mb-4">Carousel Creation Pipeline</h2>
        <div className="flex items-start gap-2 overflow-x-auto pb-2">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-start">
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warm-white border border-border-light text-xl">
                  {step.icon}
                </div>
                <p className="text-xs font-medium text-text-dark mt-2">{step.label}</p>
                <p className="text-[10px] text-text-muted text-center mt-0.5 max-w-[110px] leading-tight">
                  {step.description}
                </p>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="flex items-center h-12 px-1">
                  <div className="w-4 h-px bg-border" />
                  <span className="text-border text-xs">&#9654;</span>
                  <div className="w-4 h-px bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-border p-12 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-pale mx-auto mb-4">
          <span className="text-3xl">🖼</span>
        </div>
        <p className="text-lg font-medium text-text-dark">No carousels yet</p>
        <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
          Carousel creation will be available once the marketing pipeline is connected.
          Choose from branded templates and let AI fill in the content.
        </p>
        <button
          disabled
          className="mt-6 px-6 py-2.5 bg-gold/40 text-white text-sm font-medium rounded-lg cursor-not-allowed"
        >
          Connect Pipeline
        </button>
      </div>
    </div>
  );
}

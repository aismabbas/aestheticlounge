'use client';

import Link from 'next/link';

export default function ReelsPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/marketing" className="text-text-muted hover:text-text-dark transition-colors text-sm">
            Marketing Studio
          </Link>
          <span className="text-text-muted">/</span>
          <h1 className="font-serif text-2xl font-semibold text-text-dark">Reel Studio</h1>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-xl border border-border p-12 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-pale mx-auto mb-4">
          <span className="text-3xl">{'\uD83C\uDFAC'}</span>
        </div>
        <p className="text-lg font-medium text-text-dark">Coming Soon</p>
        <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
          Reel creation with AI script writing, scene generation, and automated video composition is being developed separately.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/marketing"
            className="inline-flex px-5 py-2.5 bg-gold hover:bg-gold/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Back to Marketing Studio
          </Link>
        </div>
      </div>
    </div>
  );
}

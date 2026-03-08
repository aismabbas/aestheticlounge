'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function NewIntakePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center"><div className="animate-pulse"><div className="w-12 h-12 rounded-full bg-[#B8924A]/20 mx-auto mb-4" /><p className="text-[#999] text-sm">Loading...</p></div></div>}>
      <NewIntakeInner />
    </Suspense>
  );
}

function NewIntakeInner() {
  const searchParams = useSearchParams();
  const isIpad = searchParams.get('mode') === 'ipad';
  const [error, setError] = useState('');

  useEffect(() => {
    // Create a new blank intake form and redirect to it
    fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sent_via: isIpad ? 'ipad' : 'link' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError('Unable to create intake form. Please log into the dashboard first.');
          return;
        }
        const mode = isIpad ? '?mode=ipad' : '';
        window.location.href = `/intake/${data.token}${mode}`;
      })
      .catch(() => {
        setError('Unable to create intake form. Please check your connection.');
      });
  }, [isIpad]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div
            className="flex items-center justify-center rounded-full font-serif text-2xl font-bold text-white mx-auto mb-6"
            style={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #D4B876 0%, #B8924A 40%, #96742F 70%, #D4B876 100%)',
            }}
          >
            A
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A] mb-3">
            Setup Required
          </h1>
          <p className="text-base text-[#6B6B6B] mb-6">{error}</p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-[#B8924A] text-white text-sm font-semibold rounded-lg hover:bg-[#96742F] transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-full bg-[#B8924A]/20 mx-auto mb-4" />
          <p className="text-[#999] text-sm">Preparing intake form...</p>
        </div>
      </div>
    </div>
  );
}

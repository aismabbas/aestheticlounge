'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getConsent,
  acceptAll,
  rejectNonEssential,
  saveConsent,
  type ConsentPreferences,
} from '@/lib/consent';

/* ------------------------------------------------------------------ */
/* Preferences Modal                                                    */
/* ------------------------------------------------------------------ */

interface PreferencesModalProps {
  initial: ConsentPreferences | null;
  onSave: (prefs: ConsentPreferences) => void;
  onClose: () => void;
}

function PreferencesModal({ initial, onSave, onClose }: PreferencesModalProps) {
  const [analytics, setAnalytics] = useState(initial?.analytics ?? false);
  const [marketing, setMarketing] = useState(initial?.marketing ?? false);
  const [functional, setFunctional] = useState(initial?.functional ?? true);

  const handleSave = () => {
    const consent = saveConsent({ analytics, marketing, functional });
    onSave(consent);
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#FAF9F6] border border-[#EAEAEA] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#EAEAEA] px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A]">
              Cookie Preferences
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#999] transition-colors hover:bg-[#EAEAEA] hover:text-[#1A1A1A]"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-sm text-[#6B6B6B] leading-relaxed">
            Choose which cookies you allow. You can change these settings at any time via the &quot;Cookie Settings&quot; link in the footer.
          </p>
        </div>

        {/* Categories */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* Necessary */}
          <div className="rounded-xl border border-[#EAEAEA] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Necessary Cookies</h3>
              <span className="rounded-full bg-[#B8924A]/10 px-3 py-0.5 text-xs font-medium text-[#B8924A]">
                Always Active
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Essential for the website to function. These handle sessions, security, and consent storage. They cannot be disabled.
            </p>
          </div>

          {/* Analytics */}
          <div className="rounded-xl border border-[#EAEAEA] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Analytics Cookies</h3>
              <ToggleSwitch checked={analytics} onChange={setAnalytics} label="Analytics" />
            </div>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Help us understand how visitors interact with our website. We use Google Analytics to measure page views, scroll depth, and popular content. All data is aggregated and anonymous.
            </p>
          </div>

          {/* Marketing */}
          <div className="rounded-xl border border-[#EAEAEA] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Marketing Cookies</h3>
              <ToggleSwitch checked={marketing} onChange={setMarketing} label="Marketing" />
            </div>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Used by Meta (Facebook/Instagram) to measure ad performance and show you relevant content. These cookies help us understand which treatments and promotions resonate with our audience.
            </p>
          </div>

          {/* Functional */}
          <div className="rounded-xl border border-[#EAEAEA] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Functional Cookies</h3>
              <ToggleSwitch checked={functional} onChange={setFunctional} label="Functional" />
            </div>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Remember your preferences like language, theme, and display settings to provide a personalized experience across visits.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#EAEAEA] px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#EAEAEA] bg-white px-5 py-2.5 text-sm font-medium text-[#6B6B6B] transition-colors hover:border-[#B8924A] hover:text-[#B8924A]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #D4B876 0%, #B8924A 40%, #96742F 70%, #D4B876 100%)',
            }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle Switch                                                        */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={`Toggle ${label} cookies`}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-[#B8924A]' : 'bg-[#D1D5DB]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main Banner                                                          */
/* ------------------------------------------------------------------ */

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [currentConsent, setCurrentConsent] = useState<ConsentPreferences | null>(null);

  useEffect(() => {
    const consent = getConsent();
    if (!consent) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
    setCurrentConsent(consent);
  }, []);

  // Listen for external "open cookie settings" events (e.g., from footer link)
  useEffect(() => {
    const handler = () => {
      setShowPrefs(true);
      setCurrentConsent(getConsent());
    };
    window.addEventListener('al_open_cookie_settings', handler);
    return () => window.removeEventListener('al_open_cookie_settings', handler);
  }, []);

  const handleAcceptAll = useCallback(() => {
    const consent = acceptAll();
    setCurrentConsent(consent);
    setVisible(false);
    setShowPrefs(false);
  }, []);

  const handleReject = useCallback(() => {
    const consent = rejectNonEssential();
    setCurrentConsent(consent);
    setVisible(false);
    setShowPrefs(false);
  }, []);

  const handleSavePrefs = useCallback((consent: ConsentPreferences) => {
    setCurrentConsent(consent);
    setVisible(false);
    setShowPrefs(false);
  }, []);

  // Preferences modal (can be opened independently via footer)
  if (showPrefs) {
    return (
      <PreferencesModal
        initial={currentConsent}
        onSave={handleSavePrefs}
        onClose={() => setShowPrefs(false)}
      />
    );
  }

  // Banner
  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10000] animate-[slideUp_0.5s_ease-out]">
      <div className="bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-white/10">
        <div className="mx-auto max-w-[1320px] px-5 py-5 md:px-8 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
            {/* Text */}
            <div className="flex-1">
              <p className="text-sm text-white/80 leading-relaxed">
                We use cookies to improve your experience and analyze site traffic. Some cookies are necessary for the site to function.{' '}
                <Link
                  href="/privacy"
                  className="text-[#D4B876] underline underline-offset-2 hover:text-[#B8924A] transition-colors"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 shrink-0">
              <button
                onClick={handleReject}
                className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-white/70 transition-all hover:border-white/40 hover:text-white"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={() => {
                  setShowPrefs(true);
                  setCurrentConsent(getConsent());
                }}
                className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-white/70 transition-all hover:border-white/40 hover:text-white"
              >
                Manage Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #D4B876 0%, #B8924A 40%, #96742F 70%, #D4B876 100%)',
                }}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

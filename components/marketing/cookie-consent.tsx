'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ============================================================
// Cookie Consent Helpers
// ============================================================

const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_CONSENT_EVENT = 'cookie-consent-updated';

export type CookieConsentValue = 'all' | 'essential' | null;

/**
 * Returns the current cookie consent value from localStorage.
 * Returns null if no consent has been given yet.
 */
export function getCookieConsent(): CookieConsentValue {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === 'all' || value === 'essential') return value;
  return null;
}

// ============================================================
// Cookie Consent Banner Component
// ============================================================

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // If consent is already stored, don't show the banner
    const existing = getCookieConsent();
    if (existing) return;

    // Show banner after a 1-second delay for better UX
    const timer = setTimeout(() => {
      setMounted(true);
      // Small delay to allow the element to render before animating in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  function handleConsent(value: 'all' | 'essential') {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    // Dispatch custom event so other components (e.g. AnalyticsProvider) can react
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }));
    // Animate out
    setVisible(false);
    // Remove from DOM after transition
    setTimeout(() => setMounted(false), 400);
  }

  if (!mounted) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-400 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div
        className="border-t border-gray-200 shadow-lg"
        style={{ background: 'rgba(255, 255, 255, 0.97)' }}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Explanation text */}
            <div className="flex-1">
              <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                We use cookies to enhance your experience, analyse site traffic, and for marketing purposes.
                You can choose to accept all cookies or only essential ones.{' '}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 transition-colors hover:opacity-80"
                  style={{ color: 'var(--sfp-navy)' }}
                >
                  Privacy Policy
                </Link>
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => handleConsent('essential')}
                className="cursor-pointer rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium transition-all hover:border-gray-400 hover:bg-gray-50"
                style={{ color: 'var(--sfp-ink)', background: 'white' }}
              >
                Essential Only
              </button>
              <button
                onClick={() => handleConsent('all')}
                className="cursor-pointer rounded-2xl px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
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

export default CookieConsentBanner;

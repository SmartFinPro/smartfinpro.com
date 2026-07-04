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

export default function CookieConsentBanner() {
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
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-[9999] transition-all duration-400 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="rounded-2xl border border-gray-200 shadow-xl p-5"
        style={{ background: 'rgba(255, 255, 255, 0.98)' }}
      >
        {/* Explanation text */}
        <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
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

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleConsent('essential')}
            className="cursor-pointer flex-1 rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium transition-all hover:border-gray-400 hover:bg-gray-50"
            style={{ color: 'var(--sfp-ink)', background: 'white' }}
          >
            Essential Only
          </button>
          <button
            onClick={() => handleConsent('all')}
            className="cursor-pointer flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
            style={{ background: 'var(--sfp-gold)', color: 'var(--sfp-ink)' }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

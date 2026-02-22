'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  Loader2,
  Shield,
  TrendingUp,
  CreditCard,
  Plane,
  X,
  Sparkles,
} from 'lucide-react';
import { subscribeWithEmail } from '@/lib/actions/newsletter';

const STORAGE_KEY = 'sfp_cc_lead_popup_shown';
const COOLDOWN_DAYS = 30;

// Credit card page slugs that should show this popup
const CREDIT_CARD_SLUGS = [
  'credit-cards-comparison',
  'amex-gold-card-review',
  'chase-sapphire-preferred-review',
  'chase-sapphire-reserve-review',
];

/**
 * Exit-Intent popup for US Credit Card pages only.
 * - Triggers when mouse leaves viewport top
 * - 30-day localStorage cooldown
 * - Restricted to credit card review/comparison pages
 * - Light trust design with gold accents
 */
export function CreditCardLeadPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasTriggered, setHasTriggered] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Check if current page is a credit card page
  const isCreditCardPage = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    return CREDIT_CARD_SLUGS.some((slug) => path.includes(slug));
  }, []);

  // Check localStorage cooldown
  const shouldShowPopup = useCallback(() => {
    if (typeof window === 'undefined') return false;
    if (!isCreditCardPage()) return false;

    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (!lastShown) return true;

    const lastShownDate = new Date(lastShown);
    const daysSinceShown = (Date.now() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceShown >= COOLDOWN_DAYS;
  }, [isCreditCardPage]);

  // Record popup shown timestamp
  const recordPopupShown = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
  }, []);

  // Exit intent detection
  useEffect(() => {
    if (hasTriggered || !shouldShowPopup()) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasTriggered) {
        setHasTriggered(true);
        setIsOpen(true);
        recordPopupShown();
      }
    };

    // Wait 5 seconds before enabling exit detection
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasTriggered, shouldShowPopup, recordPopupShown]);

  // Client-side email validation
  const validateEmail = (value: string): boolean => {
    if (!value) {
      setValidationError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    // Clear validation error as user types (only show after blur or submit)
    if (validationError && value.includes('@') && value.includes('.')) {
      setValidationError('');
    }
  };

  const handleEmailBlur = () => {
    if (email) {
      validateEmail(email);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) return;

    setStatus('loading');
    setErrorMessage('');

    const result = await subscribeWithEmail(
      email,
      '2026 Credit Card Optimization Guide',
      'credit-card-exit-popup'
    );

    if (result.success) {
      setStatus('success');
      setEmail('');
      // Auto-close after 4 seconds
      setTimeout(() => setIsOpen(false), 4000);
    } else {
      setStatus('error');
      setErrorMessage(result.message || 'Something went wrong. Please try again.');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (!hasTriggered) {
      recordPopupShown();
    }
  };

  if (!isOpen) return null;

  return (
    <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              animation: 'fadeIn 0.3s ease both',
            }}
            onClick={handleClose}
          />

          {/* Popup Card */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            style={{ animation: 'popupEnter 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both' }}
          >
            <div
              className="relative w-full max-w-lg rounded-2xl border border-gray-200 shadow-2xl overflow-hidden pointer-events-auto bg-white"
              style={{
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15), 0 0 40px rgba(245, 166, 35, 0.08)',
              }}
            >
              {/* Gold Top Accent */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, var(--sfp-gold), #DAA520, var(--sfp-gold), transparent)',
                }}
              />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors bg-gray-100 hover:bg-gray-200"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
              </button>

              {/* Content */}
              <div className="p-8 pt-10">
                {status === 'success' ? (
                  /* Success State */
                  <div
                    className="text-center py-6"
                    style={{ animation: 'popupEnter 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both' }}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-green-100"
                      style={{
                        background: 'rgba(26, 107, 58, 0.08)',
                      }}
                    >
                      <CheckCircle className="h-8 w-8" style={{ color: 'var(--sfp-green)' }} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>Check Your Inbox!</h3>
                    <p style={{ color: 'var(--sfp-slate)' }}>
                      Your 2026 Credit Card Optimization Guide is on its way.
                    </p>
                    <p className="text-sm mt-3" style={{ color: 'var(--sfp-slate)' }}>
                      Look for an email from SmartFinPro within 2 minutes.
                    </p>
                  </div>
                ) : (
                  /* Main Content */
                  <>
                    {/* Badge */}
                    <div className="flex justify-center mb-5">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
                        style={{
                          background: 'rgba(245, 166, 35, 0.08)',
                          color: 'var(--sfp-gold)',
                          border: '1px solid rgba(245, 166, 35, 0.2)',
                        }}
                      >
                        <Sparkles className="h-3 w-3" />
                        Free Download
                      </span>
                    </div>

                    {/* Headline */}
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 leading-tight" style={{ color: 'var(--sfp-ink)' }}>
                      Wait! Don&apos;t Leave{' '}
                      <span style={{ color: 'var(--sfp-gold)' }}>
                        $800+
                      </span>{' '}
                      on the Table.
                    </h2>

                    {/* Sub-headline */}
                    <p className="text-center text-base mb-7 max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                      Download our free 2026 Credit Card Optimization Guide. Learn how to stack
                      points like a pro and travel the world for free.
                    </p>

                    {/* Value Props */}
                    <div className="grid grid-cols-3 gap-3 mb-7">
                      {[
                        { icon: CreditCard, label: 'Card Stacking', sublabel: 'Strategies' },
                        { icon: TrendingUp, label: 'Point Values', sublabel: 'Maximized' },
                        { icon: Plane, label: 'Free Travel', sublabel: 'Unlocked' },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center text-center p-3 rounded-xl border border-gray-200"
                          style={{ background: 'var(--sfp-gray)' }}
                        >
                          <item.icon className="h-5 w-5 mb-1.5" style={{ color: 'var(--sfp-gold)' }} />
                          <span className="text-xs font-medium" style={{ color: 'var(--sfp-ink)' }}>{item.label}</span>
                          <span className="text-[10px]" style={{ color: 'var(--sfp-slate)' }}>{item.sublabel}</span>
                        </div>
                      ))}
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={handleEmailChange}
                          onBlur={handleEmailBlur}
                          className="w-full h-12 px-4 rounded-xl outline-none transition-all duration-200 text-sm"
                          style={{
                            color: 'var(--sfp-ink)',
                            background: 'var(--sfp-gray)',
                            border: validationError
                              ? '1px solid rgba(214, 64, 69, 0.5)'
                              : '1px solid #e5e7eb',
                          }}
                          disabled={status === 'loading'}
                          aria-label="Email address"
                          autoComplete="email"
                        />
                        {validationError && (
                          <p className="text-xs mt-1.5 ml-1" style={{ color: 'var(--sfp-red)' }}>{validationError}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 text-white shadow-md"
                        style={{
                          background: status === 'loading'
                            ? 'rgba(245, 166, 35, 0.4)'
                            : 'var(--sfp-gold)',
                          color: status === 'loading' ? 'var(--sfp-gold)' : '#fff',
                          boxShadow: '0 4px 20px rgba(245, 166, 35, 0.2)',
                        }}
                      >
                        {status === 'loading' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send Me the Guide'
                        )}
                      </button>

                      {status === 'error' && (
                        <p className="text-sm text-center" style={{ color: 'var(--sfp-red)' }}>{errorMessage}</p>
                      )}
                    </form>

                    {/* Trust Signals */}
                    <div className="flex items-center justify-center gap-5 mt-5 text-xs" style={{ color: 'var(--sfp-slate)' }}>
                      <span className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
                        No spam, ever
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
                        Unsubscribe anytime
                      </span>
                    </div>

                    {/* Dismiss link */}
                    <button
                      onClick={handleClose}
                      className="w-full text-center text-xs mt-4 py-2 transition-colors hover:opacity-70"
                      style={{ color: 'var(--sfp-slate)' }}
                    >
                      No thanks, I&apos;ll figure it out myself
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
    </>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
 * - Gold/Amex-style glassmorphism design
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Glassmorphism Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
            onClick={handleClose}
          />

          {/* Popup Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden pointer-events-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.97), rgba(15, 10, 26, 0.98))',
                boxShadow: '0 0 80px rgba(184, 134, 11, 0.15), 0 0 40px rgba(184, 134, 11, 0.08), 0 25px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Gold Glow Top Accent */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, #B8860B, #DAA520, #B8860B, transparent)',
                }}
              />
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse, rgba(218, 165, 32, 0.12) 0%, transparent 70%)',
                }}
              />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                aria-label="Close popup"
              >
                <X className="h-4 w-4 text-slate-400 hover:text-white transition-colors" />
              </button>

              {/* Content */}
              <div className="p-8 pt-10">
                {status === 'success' ? (
                  /* Success State */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="text-center py-6"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-emerald-500/10"
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                      }}
                    >
                      <CheckCircle className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Check Your Inbox!</h3>
                    <p className="text-slate-400 text-base">
                      Your 2026 Credit Card Optimization Guide is on its way.
                    </p>
                    <p className="text-slate-500 text-sm mt-3">
                      Look for an email from SmartFinPro within 2 minutes.
                    </p>
                  </motion.div>
                ) : (
                  /* Main Content */
                  <>
                    {/* Badge */}
                    <div className="flex justify-center mb-5">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
                        style={{
                          background: 'rgba(218, 165, 32, 0.1)',
                          color: '#DAA520',
                          border: '1px solid rgba(218, 165, 32, 0.2)',
                        }}
                      >
                        <Sparkles className="h-3 w-3" />
                        Free Download
                      </span>
                    </div>

                    {/* Loss Aversion Headline */}
                    <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3 leading-tight">
                      Wait! Don&apos;t Leave{' '}
                      <span
                        className="bg-clip-text text-transparent"
                        style={{
                          backgroundImage: 'linear-gradient(135deg, #DAA520, #FFD700, #B8860B)',
                        }}
                      >
                        $800+
                      </span>{' '}
                      on the Table.
                    </h2>

                    {/* Sub-headline */}
                    <p className="text-slate-400 text-center text-base mb-7 max-w-sm mx-auto leading-relaxed">
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
                          className="flex flex-col items-center text-center p-3 rounded-xl border border-slate-700/30"
                          style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                        >
                          <item.icon className="h-5 w-5 text-amber-400/80 mb-1.5" />
                          <span className="text-xs font-medium text-white">{item.label}</span>
                          <span className="text-[10px] text-slate-500">{item.sublabel}</span>
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
                          className="w-full h-12 px-4 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 text-sm"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: validationError
                              ? '1px solid rgba(239, 68, 68, 0.5)'
                              : '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                          disabled={status === 'loading'}
                          aria-label="Email address"
                          autoComplete="email"
                        />
                        {validationError && (
                          <p className="text-red-400 text-xs mt-1.5 ml-1">{validationError}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 btn-shimmer"
                        style={{
                          background: status === 'loading'
                            ? 'rgba(218, 165, 32, 0.3)'
                            : 'linear-gradient(135deg, #B8860B, #DAA520, #B8860B)',
                          color: status === 'loading' ? '#DAA520' : '#0f0a1a',
                          boxShadow: '0 4px 20px rgba(218, 165, 32, 0.25)',
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
                        <p className="text-red-400 text-sm text-center">{errorMessage}</p>
                      )}
                    </form>

                    {/* Trust Signals */}
                    <div className="flex items-center justify-center gap-5 mt-5 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-emerald-400/60" />
                        No spam, ever
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400/60" />
                        Unsubscribe anytime
                      </span>
                    </div>

                    {/* Dismiss link */}
                    <button
                      onClick={handleClose}
                      className="w-full text-center text-xs text-slate-600 hover:text-slate-400 mt-4 py-2 transition-colors"
                    >
                      No thanks, I&apos;ll figure it out myself
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  CheckCircle,
  Loader2,
  FileText,
  Clock,
  Users,
  Shield,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { subscribeWithEmail } from '@/lib/newsletter-client';
import { useNewsletterTracking, useVisibilityTracking } from '@/lib/hooks/use-component-tracking';

interface NewsletterBoxProps {
  variant?: 'default' | 'compact' | 'hero' | 'inline';
  className?: string;
  headline?: string;
  description?: string;
}

export function NewsletterBox({
  variant = 'default',
  className = '',
  headline,
  description,
}: NewsletterBoxProps) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Tracking
  const { trackFormView, trackFocus, trackSubmit } = useNewsletterTracking(variant);
  const visibilityRef = useVisibilityTracking(`newsletter_${variant}`);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      trackFormView();
    }
  }, [trackFormView]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consent) {
      setErrorMessage('Please accept the Privacy Policy to continue');
      setStatus('error');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setStatus('error');
      trackSubmit(false, 'invalid_email');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    const result = await subscribeWithEmail(email, 'The 5-Minute AI Finance Workflow');

    if (result.success) {
      setStatus('success');
      setEmail('');
      trackSubmit(true);
    } else {
      setStatus('error');
      setErrorMessage(result.message || 'Something went wrong. Please try again.');
      trackSubmit(false, result.message);
    }
  };

  const handleFocus = () => {
    trackFocus();
  };

  // Success State
  if (status === 'success') {
    return (
      <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--sfp-sky)' }}>
            <CheckCircle className="h-8 w-8" style={{ color: 'var(--sfp-green)' }} />
          </div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>
            Check Your Inbox!
          </h3>
          <p className="mb-4" style={{ color: 'var(--sfp-slate)' }}>
            Your PDF is on its way. Look for an email from SmartFinPro.
          </p>
          <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
            Didn&apos;t get it? Check your spam folder or reply to the email for help.
          </p>
        </div>
      </div>
    );
  }

  // Compact Variant (for sidebars)
  if (variant === 'compact') {
    return (
      <div className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>Free PDF</span>
          </div>
          <h4 className="font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>The 5-Minute AI Finance Workflow</h4>
          <p className="text-sm mb-3" style={{ color: 'var(--sfp-slate)' }}>
            Save 10+ hours/week with proven AI prompts.
          </p>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={handleFocus}
              className="text-sm bg-white border-gray-300 placeholder:text-gray-400"
              style={{ color: 'var(--sfp-ink)' }}
              disabled={status === 'loading'}
            />
            <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: 'var(--sfp-slate)' }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 bg-white focus:ring-2"
                style={{ color: 'var(--sfp-navy)' }}
              />
              <span>
                I accept the{' '}
                <a href="/privacy" className="underline hover:no-underline" style={{ color: 'var(--sfp-navy)' }}>Privacy Policy</a>.
              </span>
            </label>
            <Button type="submit" className="w-full text-white" size="sm" disabled={status === 'loading'} style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}>
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Get Free PDF'
              )}
            </Button>
          </form>
          {status === 'error' && (
            <p className="text-xs mt-2" style={{ color: 'var(--sfp-red)' }}>{errorMessage}</p>
          )}
        </div>
      </div>
    );
  }

  // Inline Variant (for between content blocks)
  if (variant === 'inline') {
    return (
      <div ref={visibilityRef} className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden my-8 ${className}`}>
        <div className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            {/* Icon & Text */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--sfp-sky)' }}>
                <FileText className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              </div>
              <div>
                <h4 className="font-bold text-sm" style={{ color: 'var(--sfp-ink)' }}>{headline || 'Get the Free AI Finance Workflow Guide'}</h4>
                <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{description || 'Weekly AI tips + exclusive templates for finance professionals.'}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={handleFocus}
                  className="w-48 h-9 text-sm bg-white border-gray-300 placeholder:text-gray-400"
                  style={{ color: 'var(--sfp-ink)' }}
                  disabled={status === 'loading'}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 px-4 text-white gap-1.5"
                  disabled={status === 'loading'}
                  style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
                >
                  {status === 'loading' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      Get PDF
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
              <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: 'var(--sfp-slate)' }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 bg-white focus:ring-2"
                  style={{ color: 'var(--sfp-navy)' }}
                />
                <span>
                  I accept the{' '}
                  <a href="/privacy" className="underline hover:no-underline" style={{ color: 'var(--sfp-navy)' }}>Privacy Policy</a>.
                </span>
              </label>
            </form>
          </div>
          {status === 'error' && (
            <p className="text-xs mt-2 md:text-right" style={{ color: 'var(--sfp-red)' }}>{errorMessage}</p>
          )}
        </div>
      </div>
    );
  }

  // Default & Hero Variant
  return (
    <div ref={visibilityRef} className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="px-6 py-4 text-white" style={{ background: 'linear-gradient(to right, var(--sfp-navy), var(--sfp-navy-dark))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Free Download</span>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
            PDF Guide
          </span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: PDF Preview */}
          <div className="flex-shrink-0 flex justify-center lg:justify-start">
            <div className="relative">
              {/* PDF Mockup */}
              <div className="w-36 h-48 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden">
                {/* PDF Header */}
                <div className="p-2" style={{ background: 'var(--sfp-navy)' }}>
                  <div className="h-1 w-12 bg-white/60 rounded mb-1"></div>
                  <div className="h-1 w-8 bg-white/40 rounded"></div>
                </div>
                {/* PDF Content Lines */}
                <div className="p-3 space-y-2 flex-1">
                  <div className="h-1.5 w-full bg-gray-200 rounded"></div>
                  <div className="h-1.5 w-4/5 bg-gray-200 rounded"></div>
                  <div className="h-1.5 w-full bg-gray-200 rounded"></div>
                  <div className="h-1.5 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-6 w-full rounded mt-3" style={{ background: 'var(--sfp-sky)' }}></div>
                  <div className="h-1.5 w-full bg-gray-200 rounded"></div>
                  <div className="h-1.5 w-2/3 bg-gray-200 rounded"></div>
                </div>
              </div>
              {/* Badge */}
              <div className="absolute -top-2 -right-2 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg" style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}>
                FREE
              </div>
            </div>
          </div>

          {/* Right: Content & Form */}
          <div className="flex-1">
            {/* Headline */}
            <h3 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>
              Stop Wasting 10+ Hours Every Week.
            </h3>
            <p className="text-lg mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Get the <strong style={{ color: 'var(--sfp-ink)' }}>&ldquo;5-Minute AI Finance Workflow&rdquo;</strong> PDF — your shortcut to smarter workflows.
            </p>

            {/* What's Inside */}
            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>What&apos;s inside:</p>
              <ul className="space-y-2">
                {[
                  '3 copy-paste prompts for instant market analysis',
                  'The AI tool matrix: which tool for which task',
                  '5-point compliance checklist before automating',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--sfp-green)' }} />
                    <span style={{ color: 'var(--sfp-ink)' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your best email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={handleFocus}
                  className="flex-1 h-12 bg-white border-gray-300 placeholder:text-gray-400"
                  style={{ color: 'var(--sfp-ink)' }}
                  disabled={status === 'loading'}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-6 gap-2 border-0 shadow-lg text-white"
                  disabled={status === 'loading'}
                  style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Get the Free PDF
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: 'var(--sfp-slate)' }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 bg-white focus:ring-2"
                  style={{ color: 'var(--sfp-navy)' }}
                />
                <span>
                  I agree to receive emails and accept the{' '}
                  <a href="/privacy" className="underline hover:no-underline" style={{ color: 'var(--sfp-navy)' }}>Privacy Policy</a>.
                </span>
              </label>

              {status === 'error' && (
                <p className="text-sm" style={{ color: 'var(--sfp-red)' }}>{errorMessage}</p>
              )}
            </form>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200 text-xs" style={{ color: 'var(--sfp-slate)' }}>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" style={{ color: 'var(--sfp-green)' }} />
                Free, no spam
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" style={{ color: 'var(--sfp-navy)' }} />
                No spam, ever
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" style={{ color: 'var(--sfp-gold)' }} />
                Instant download
              </span>
            </div>

            {/* Social Proof */}
            <p className="text-xs mt-3 italic" style={{ color: 'var(--sfp-slate)' }}>
              &ldquo;Used by finance professionals at 500+ advisory firms worldwide.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal inline version for article footers
export function NewsletterInline({ className = '' }: { className?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    const result = await subscribeWithEmail(email, 'The 5-Minute AI Finance Workflow');

    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className={`flex items-center gap-2 p-4 rounded-lg ${className}`} style={{ background: 'rgba(26,107,58,0.08)' }}>
        <CheckCircle className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
        <span style={{ color: 'var(--sfp-green)' }}>Check your inbox for the PDF!</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${className}`} style={{ background: 'var(--sfp-gray)' }}>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
          <span className="font-medium" style={{ color: 'var(--sfp-ink)' }}>Get the free AI Finance Workflow PDF</span>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 flex-1 w-full sm:w-auto">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            disabled={status === 'loading'}
          />
          <Button type="submit" disabled={status === 'loading'} style={{ background: 'var(--sfp-gold)', color: 'white' }}>
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}

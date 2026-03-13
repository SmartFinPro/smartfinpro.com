'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  CheckCircle,
  Loader2,
  Users,
  Shield,
  Gift,
  Sparkles,
  Clock,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { subscribeWithEmail } from '@/lib/newsletter-client';

const STORAGE_KEY = 'sfp_exit_popup_shown';
const COOLDOWN_DAYS = 7;

export function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasTriggered, setHasTriggered] = useState(false);

  // Check if popup was recently shown
  const shouldShowPopup = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (!lastShown) return true;

    const lastShownDate = new Date(lastShown);
    const daysSinceShown = (Date.now() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24); // safe — useCallback, never SSR

    return daysSinceShown >= COOLDOWN_DAYS;
  }, []);

  // Record popup shown
  const recordPopupShown = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
  }, []);

  // Exit intent detection
  useEffect(() => {
    if (hasTriggered || !shouldShowPopup()) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Yield to review-specific exit intent popup on review pages
      if (window.__sfpReviewExitActive) return;

      // Only trigger when leaving through the top of the viewport
      if (e.clientY <= 0 && !hasTriggered) {
        setHasTriggered(true);
        setIsOpen(true);
        recordPopupShown();
      }
    };

    // Delay adding listener to avoid triggering on page load
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 5000); // Wait 5 seconds before enabling

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasTriggered, shouldShowPopup, recordPopupShown]);

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
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    const result = await subscribeWithEmail(
      email,
      'The 5-Minute AI Finance Workflow',
      'exit-intent-popup'
    );

    if (result.success) {
      setStatus('success');
      setEmail('');
      // Auto-close after success
      setTimeout(() => setIsOpen(false), 3000);
    } else {
      setStatus('error');
      setErrorMessage(result.message || 'Something went wrong. Please try again.');
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && status !== 'success') {
      // User dismissed without subscribing - still record it was shown
      recordPopupShown();
    }
  };

  // Success state content
  if (status === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md bg-white border-gray-200" showCloseButton={false}>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(26,107,58,0.1)', boxShadow: '0 0 0 4px rgba(26,107,58,0.08)' }}>
              <CheckCircle className="h-8 w-8" style={{ color: 'var(--sfp-green)' }} />
            </div>
            <DialogTitle className="text-2xl mb-2" style={{ color: 'var(--sfp-ink)' }}>Check Your Inbox!</DialogTitle>
            <DialogDescription className="text-base" style={{ color: 'var(--sfp-slate)' }}>
              Your PDF is on its way. Look for an email from SmartFinPro.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white border-gray-200">
        {/* Header Banner */}
        <div className="relative px-6 py-5 overflow-hidden border-b border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200" style={{ background: 'var(--sfp-sky)' }}>
                <Gift className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
              </div>
              <div>
                <span className="font-bold block" style={{ color: 'var(--sfp-ink)' }}>Wait! Don&apos;t Leave Empty-Handed</span>
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Exclusive resource for finance professionals</span>
              </div>
            </div>
            <Badge className="border" style={{ background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.2)', color: 'var(--sfp-gold)' }}>
              <Sparkles className="h-3 w-3 mr-1" />
              FREE PDF
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl" style={{ color: 'var(--sfp-ink)' }}>
              Before You Go...
            </DialogTitle>
            <DialogDescription className="text-base" style={{ color: 'var(--sfp-slate)' }}>
              Get our most popular resource — the AI Finance Workflow PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* PDF Preview - Premium Style */}
            <div className="flex-shrink-0 flex justify-center">
              <div className="relative">
                <div className="w-32 h-40 rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white">
                  <div className="p-3" style={{ background: 'var(--sfp-navy)' }}>
                    <FileText className="h-5 w-5 text-white mb-1" />
                    <div className="h-1 w-12 bg-white/60 rounded mb-1"></div>
                    <div className="h-1 w-8 bg-white/40 rounded"></div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="h-1 w-full bg-gray-200 rounded"></div>
                    <div className="h-1 w-4/5 bg-gray-200 rounded"></div>
                    <div className="h-1 w-full bg-gray-200 rounded"></div>
                    <div className="h-6 w-full rounded mt-2 border" style={{ background: 'var(--sfp-sky)', borderColor: 'rgba(27,79,140,0.2)' }}></div>
                    <div className="h-1 w-3/4 bg-gray-200 rounded"></div>
                    <div className="h-1 w-full bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg" style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}>
                  FREE
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                <Clock className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                The 5-Minute AI Finance Workflow
              </h3>

              <ul className="space-y-2.5 mb-5">
                {[
                  '3 copy-paste prompts for instant analysis',
                  'The AI tool matrix: which tool for which task',
                  '5-point compliance checklist',
                  'Bonus: ROI calculator spreadsheet',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--sfp-green)' }} />
                    <span style={{ color: 'var(--sfp-slate)' }}>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Visually-hidden label — WCAG 1.3.1 / 4.1.2 */}
                <label htmlFor="exit-popup-email" className="sr-only">Email address</label>
                <Input
                  id="exit-popup-email"
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-required="true"
                  className="h-12 bg-white border-gray-300 placeholder-gray-400 focus:border-blue-400"
                  style={{ color: 'var(--sfp-ink)' }}
                  disabled={status === 'loading'}
                />
                <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: 'var(--sfp-slate)' }}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 bg-white text-blue-500 focus:ring-blue-400"
                  />
                  <span>
                    I agree to receive emails and accept the{' '}
                    <a href="/privacy" className="underline underline-offset-2 transition-colors hover:opacity-80" style={{ color: 'var(--sfp-navy)' }}>Privacy Policy</a>.
                  </span>
                </label>
                <Button
                  type="submit"
                  className="w-full h-12 gap-2 border-0 shadow-lg"
                  style={{ background: 'var(--sfp-gold)', color: 'var(--sfp-ink)' }}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download for Free
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {status === 'error' && (
                  <p className="text-sm text-center" style={{ color: 'var(--sfp-red)' }}>{errorMessage}</p>
                )}
              </form>

              {/* Trust Signals */}
              <div className="flex items-center justify-center gap-5 mt-4 text-xs" style={{ color: 'var(--sfp-slate)' }}>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
                  Free PDF guide
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" style={{ color: 'var(--sfp-navy)' }} />
                  No spam, ever
                </span>
              </div>
            </div>
          </div>

          {/* No thanks link */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-center text-sm mt-5 py-2 transition-colors hover:opacity-70"
            style={{ color: 'var(--sfp-slate)' }}
          >
            No thanks, I&apos;ll figure it out myself
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

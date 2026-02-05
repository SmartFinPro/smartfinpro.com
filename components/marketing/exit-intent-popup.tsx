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
} from 'lucide-react';
import { subscribeWithEmail } from '@/lib/actions/newsletter';

const STORAGE_KEY = 'sfp_exit_popup_shown';
const COOLDOWN_DAYS = 7;

export function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasTriggered, setHasTriggered] = useState(false);

  // Check if popup was recently shown
  const shouldShowPopup = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (!lastShown) return true;

    const lastShownDate = new Date(lastShown);
    const daysSinceShown = (Date.now() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24);

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
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-2xl mb-2">Check Your Inbox!</DialogTitle>
            <DialogDescription className="text-base">
              Your PDF is on its way. Look for an email from SmartFinPro.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              <span className="font-semibold">Wait! Don&apos;t Leave Empty-Handed</span>
            </div>
            <Badge className="bg-white/20 text-white border-0">
              FREE PDF
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl">
              Before You Go...
            </DialogTitle>
            <DialogDescription className="text-base">
              Get our most popular resource absolutely free.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* PDF Preview */}
            <div className="flex-shrink-0 flex justify-center">
              <div className="relative">
                <div className="w-28 h-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                  <div className="bg-primary p-2">
                    <div className="h-1 w-10 bg-white/60 rounded mb-1"></div>
                    <div className="h-1 w-6 bg-white/40 rounded"></div>
                  </div>
                  <div className="p-2 space-y-1.5 flex-1">
                    <div className="h-1 w-full bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-1 w-4/5 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-1 w-full bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 w-full bg-primary/10 rounded mt-2"></div>
                    <div className="h-1 w-3/4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  FREE
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">
                The 5-Minute AI Finance Workflow
              </h3>

              <ul className="space-y-2 mb-4">
                {[
                  '3 copy-paste prompts for instant analysis',
                  'The AI tool matrix: which tool for which task',
                  '5-point compliance checklist',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  disabled={status === 'loading'}
                />
                <Button
                  type="submit"
                  className="w-full h-11 gap-2"
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
                    </>
                  )}
                </Button>

                {status === 'error' && (
                  <p className="text-red-600 text-sm text-center">{errorMessage}</p>
                )}
              </form>

              {/* Trust Signals */}
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  5,000+ downloads
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  No spam
                </span>
              </div>
            </div>
          </div>

          {/* No thanks link */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 py-2"
          >
            No thanks, I&apos;ll figure it out myself
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

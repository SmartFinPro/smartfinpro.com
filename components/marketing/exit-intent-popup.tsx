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
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800" showCloseButton={false}>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-500/10">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <DialogTitle className="text-2xl mb-2 text-white">Check Your Inbox!</DialogTitle>
            <DialogDescription className="text-base text-slate-400">
              Your PDF is on its way. Look for an email from SmartFinPro.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-slate-900 border-slate-800">
        {/* Header Banner with Glow */}
        <div className="relative bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 px-6 py-5 overflow-hidden">
          {/* Background glows */}
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-emerald-500/20 rounded-full blur-[60px]" />
          <div className="absolute top-0 right-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-[40px]" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/30">
                <Gift className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <span className="font-bold text-white block">Wait! Don&apos;t Leave Empty-Handed</span>
                <span className="text-xs text-slate-400">Exclusive resource for finance professionals</span>
              </div>
            </div>
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
              <Sparkles className="h-3 w-3 mr-1" />
              FREE PDF
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl text-white">
              Before You Go...
            </DialogTitle>
            <DialogDescription className="text-base text-slate-400">
              Get our most popular resource — trusted by 12,847+ finance professionals.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* PDF Preview - Premium Style */}
            <div className="flex-shrink-0 flex justify-center">
              <div className="relative">
                <div className="w-32 h-40 glass-card rounded-xl overflow-hidden shadow-2xl shadow-emerald-500/10 border-emerald-500/20">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3">
                    <FileText className="h-5 w-5 text-white mb-1" />
                    <div className="h-1 w-12 bg-white/60 rounded mb-1"></div>
                    <div className="h-1 w-8 bg-white/40 rounded"></div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="h-1 w-full bg-slate-700 rounded"></div>
                    <div className="h-1 w-4/5 bg-slate-700 rounded"></div>
                    <div className="h-1 w-full bg-slate-700 rounded"></div>
                    <div className="h-6 w-full bg-emerald-500/10 rounded mt-2 border border-emerald-500/20"></div>
                    <div className="h-1 w-3/4 bg-slate-700 rounded"></div>
                    <div className="h-1 w-full bg-slate-700 rounded"></div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/30">
                  FREE
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-3 text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
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
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500/50"
                  disabled={status === 'loading'}
                />
                <Button
                  type="submit"
                  className="w-full h-12 gap-2 btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
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
                  <p className="text-red-400 text-sm text-center">{errorMessage}</p>
                )}
              </form>

              {/* Trust Signals */}
              <div className="flex items-center justify-center gap-5 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-emerald-400/70" />
                  12,847 downloads
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-blue-400/70" />
                  No spam, ever
                </span>
              </div>
            </div>
          </div>

          {/* No thanks link */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-center text-sm text-slate-600 hover:text-slate-400 mt-5 py-2 transition-colors"
          >
            No thanks, I&apos;ll figure it out myself
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

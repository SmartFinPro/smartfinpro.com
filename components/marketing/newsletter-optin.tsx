'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Download,
  CheckCircle,
  Loader2,
  Mail,
  FileText,
  Sparkles,
  Clock,
  Gift,
} from 'lucide-react';
import { subscribeWithEmail } from '@/lib/actions/newsletter';

interface NewsletterOptinProps {
  title?: string;
  subtitle?: string;
  leadMagnet?: {
    title: string;
    description: string;
    downloadUrl?: string;
  };
  variant?: 'inline' | 'sticky' | 'exit-intent' | 'sidebar';
  className?: string;
}

export function NewsletterOptin({
  title = 'Get Our Free AI Finance Guide',
  subtitle = 'Join 12,000+ finance professionals getting weekly AI insights',
  leadMagnet,
  className = '',
}: NewsletterOptinProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    const result = await subscribeWithEmail(email, leadMagnet?.title);

    if (result.success) {
      setStatus('success');
      setEmail('');
    } else {
      setStatus('error');
      setErrorMessage(result.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <Card className={`bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 ${className}`}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
            You&apos;re In!
          </h3>
          <p className="text-green-700 dark:text-green-300 mb-4">
            Check your inbox for the download link.
          </p>
          {leadMagnet?.downloadUrl && (
            <Button asChild variant="outline" className="border-green-600 text-green-700">
              <a href={leadMagnet.downloadUrl} download>
                <Download className="h-4 w-4 mr-2" />
                Download Now
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Lead Magnet Preview */}
            {leadMagnet && (
              <div className="flex-shrink-0">
                <div className="w-32 h-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col items-center justify-center border-2 border-primary/20 relative">
                  <Badge className="absolute -top-2 -right-2 bg-primary">FREE</Badge>
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <span className="text-xs font-medium text-center px-2">PDF Guide</span>
                </div>
              </div>
            )}

            {/* Right: Form Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <Badge variant="secondary">Free Download</Badge>
              </div>

              <h3 className="text-xl md:text-2xl font-bold mb-2">
                {leadMagnet?.title || title}
              </h3>

              <p className="text-muted-foreground mb-4">
                {leadMagnet?.description || subtitle}
              </p>

              {/* Benefits */}
              <div className="flex flex-wrap gap-3 mb-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  5-min read
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Gift className="h-4 w-4" />
                  Instant access
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  No spam, ever
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  disabled={status === 'loading'}
                />
                <Button type="submit" disabled={status === 'loading'} className="whitespace-nowrap">
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Get Free PDF
                    </>
                  )}
                </Button>
              </form>

              {status === 'error' && (
                <p className="text-red-600 text-sm mt-2">{errorMessage}</p>
              )}

              <p className="text-xs text-muted-foreground mt-3">
                By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sticky Bottom Bar Version
export function StickyNewsletterBar({
  leadMagnet,
}: {
  leadMagnet?: NewsletterOptinProps['leadMagnet'];
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check if already dismissed in this session
    if (sessionStorage.getItem('newsletter-dismissed')) {
      return;
    }

    // Show after scrolling 50% of the page
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 50 && !isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    sessionStorage.setItem('newsletter-dismissed', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    const result = await subscribeWithEmail(email, leadMagnet?.title);

    if (result.success) {
      setStatus('success');
      setTimeout(() => {
        handleDismiss();
      }, 3000);
    } else {
      setStatus('error');
    }
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-primary text-primary-foreground shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 hidden sm:block" />
              <div>
                <p className="font-bold text-sm sm:text-base">
                  {leadMagnet?.title || 'Get Our Free AI Finance Guide'}
                </p>
                <p className="text-xs sm:text-sm opacity-90">
                  Join 12,000+ finance pros getting weekly AI tips
                </p>
              </div>
            </div>

            {status === 'success' ? (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5" />
                Check your inbox!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-48 bg-white/10 border-white/20 placeholder:text-white/60 text-white"
                  disabled={status === 'loading'}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Get PDF'
                  )}
                </Button>
              </form>
            )}

            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 p-1 hover:bg-white/10 rounded"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Exit Intent Popup
export function ExitIntentPopup({
  leadMagnet,
}: {
  leadMagnet: NewsletterOptinProps['leadMagnet'];
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check if already shown in this session
    if (sessionStorage.getItem('exit-intent-shown')) {
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from top of viewport
      if (e.clientY < 10 && !isVisible) {
        setIsVisible(true);
        sessionStorage.setItem('exit-intent-shown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    const result = await subscribeWithEmail(email, leadMagnet?.title);

    if (result.success) {
      setStatus('success');
      setTimeout(() => setIsVisible(false), 2000);
    } else {
      setStatus('error');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header gradient */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
          <Badge className="bg-white/20 text-white mb-3">Wait! Don&apos;t Leave Empty-Handed</Badge>
          <h2 className="text-2xl font-bold mb-2">{leadMagnet?.title}</h2>
          <p className="opacity-90">{leadMagnet?.description}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'success' ? (
            <div className="text-center py-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">You&apos;re All Set!</h3>
              <p className="text-muted-foreground">Check your inbox for the download link.</p>
            </div>
          ) : (
            <>
              {/* Benefits list */}
              <div className="space-y-2 mb-6">
                {[
                  'Save 5+ hours/week on content creation',
                  'Proven templates from top advisors',
                  'Step-by-step AI implementation guide',
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your best email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  disabled={status === 'loading'}
                />
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Send Me the Free PDF
                    </>
                  )}
                </Button>
              </form>

              {status === 'error' && (
                <p className="text-red-600 text-sm mt-2 text-center">
                  Something went wrong. Please try again.
                </p>
              )}

              <p className="text-xs text-center text-muted-foreground mt-4">
                No spam. Unsubscribe anytime. We respect your privacy.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
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
import { subscribeWithEmail } from '@/lib/actions/newsletter';

interface NewsletterBoxProps {
  variant?: 'default' | 'compact' | 'hero';
  className?: string;
}

export function NewsletterBox({ variant = 'default', className = '' }: NewsletterBoxProps) {
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

    const result = await subscribeWithEmail(email, 'The 5-Minute AI Finance Workflow');

    if (result.success) {
      setStatus('success');
      setEmail('');
    } else {
      setStatus('error');
      setErrorMessage(result.message || 'Something went wrong. Please try again.');
    }
  };

  // Success State
  if (status === 'success') {
    return (
      <div className={`glass-card rounded-2xl border-emerald-500/50 ${className}`}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Check Your Inbox!
          </h3>
          <p className="text-slate-300 mb-4">
            Your PDF is on its way. Look for an email from SmartFinPro.
          </p>
          <p className="text-sm text-slate-500">
            Didn&apos;t get it? Check your spam folder or reply to the email for help.
          </p>
        </div>
      </div>
    );
  }

  // Compact Variant (for sidebars)
  if (variant === 'compact') {
    return (
      <div className={`glass-card rounded-xl overflow-hidden ${className}`}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-emerald-400" />
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Free PDF</span>
          </div>
          <h4 className="font-bold text-white mb-2">The 5-Minute AI Finance Workflow</h4>
          <p className="text-sm text-slate-400 mb-3">
            Save 10+ hours/week with proven AI prompts.
          </p>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              disabled={status === 'loading'}
            />
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" size="sm" disabled={status === 'loading'}>
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Get Free PDF'
              )}
            </Button>
          </form>
          {status === 'error' && (
            <p className="text-red-400 text-xs mt-2">{errorMessage}</p>
          )}
        </div>
      </div>
    );
  }

  // Default & Hero Variant
  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Free Download</span>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/20">
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
              <div className="w-36 h-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 flex flex-col overflow-hidden">
                {/* PDF Header */}
                <div className="bg-emerald-500 p-2">
                  <div className="h-1 w-12 bg-white/60 rounded mb-1"></div>
                  <div className="h-1 w-8 bg-white/40 rounded"></div>
                </div>
                {/* PDF Content Lines */}
                <div className="p-3 space-y-2 flex-1">
                  <div className="h-1.5 w-full bg-slate-700 rounded"></div>
                  <div className="h-1.5 w-4/5 bg-slate-700 rounded"></div>
                  <div className="h-1.5 w-full bg-slate-700 rounded"></div>
                  <div className="h-1.5 w-3/4 bg-slate-700 rounded"></div>
                  <div className="h-6 w-full bg-emerald-500/20 rounded mt-3"></div>
                  <div className="h-1.5 w-full bg-slate-700 rounded"></div>
                  <div className="h-1.5 w-2/3 bg-slate-700 rounded"></div>
                </div>
              </div>
              {/* Badge */}
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                FREE
              </div>
            </div>
          </div>

          {/* Right: Content & Form */}
          <div className="flex-1">
            {/* Headline */}
            <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white">
              Stop Wasting 10+ Hours Every Week.
            </h3>
            <p className="text-lg text-slate-400 mb-4">
              Get the <strong className="text-white">&ldquo;5-Minute AI Finance Workflow&rdquo;</strong> PDF and join 5,000+ pros staying ahead of the curve.
            </p>

            {/* What's Inside */}
            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium text-slate-500">What&apos;s inside:</p>
              <ul className="space-y-2">
                {[
                  '3 copy-paste prompts for instant market analysis',
                  'The AI tool matrix: which tool for which task',
                  '5-point compliance checklist before automating',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{item}</span>
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
                  className="flex-1 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  disabled={status === 'loading'}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-6 gap-2 btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
                  disabled={status === 'loading'}
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

              {status === 'error' && (
                <p className="text-red-400 text-sm">{errorMessage}</p>
              )}
            </form>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-emerald-400" />
                5,000+ finance pros
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-400" />
                No spam, ever
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-violet-400" />
                Instant download
              </span>
            </div>

            {/* Social Proof */}
            <p className="text-xs text-slate-500 mt-3 italic">
              &ldquo;Trusted by analysts at Goldman Sachs, JP Morgan, and 500+ advisory firms.&rdquo;
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
      <div className={`flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg ${className}`}>
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-green-700 dark:text-green-300">Check your inbox for the PDF!</span>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-muted/50 rounded-lg ${className}`}>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          <span className="font-medium">Get the free AI Finance Workflow PDF</span>
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
          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}

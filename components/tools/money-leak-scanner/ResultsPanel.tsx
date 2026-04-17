'use client';

// components/tools/money-leak-scanner/ResultsPanel.tsx
// Sticky right-hand results panel for the single-page live calculator.
// Composes: severity badge → big animated number → LeakDonut → top 3 fixes → email gate.

import { forwardRef, useState } from 'react';
import { CheckCircle2, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnimatedCounter } from './AnimatedCounter';
import { LeakDonut } from './LeakDonut';
import type { LeakResult } from '@/lib/money-leak/types';

export type EmailState = 'idle' | 'submitting' | 'success' | 'error';

interface ResultsPanelProps {
  result: LeakResult;
  currencySymbol: string;
  scanId: string | null;
  emailState: EmailState;
  emailError: string | null;
  onSubmitEmail: (email: string) => void;
}

const SEVERITY_COPY: Record<
  LeakResult['overallSeverity'],
  { label: string; color: string }
> = {
  low: { label: 'On track', color: 'var(--sfp-green)' },
  medium: { label: 'Meaningful leak', color: 'var(--sfp-gold)' },
  high: { label: 'Significant leak', color: 'var(--sfp-gold-dark)' },
  critical: { label: 'Critical leak', color: 'var(--sfp-red)' },
};

export const ResultsPanel = forwardRef<HTMLDivElement, ResultsPanelProps>(
  function ResultsPanel(
    { result, currencySymbol, scanId, emailState, emailError, onSubmitEmail },
    ref,
  ) {
    const [email, setEmail] = useState('');
    const [consent, setConsent] = useState(true);

    const animated = useAnimatedCounter(result.totalAnnualLeak);
    const severity = SEVERITY_COPY[result.overallSeverity] ?? SEVERITY_COPY.medium;

    const submitting = emailState === 'submitting';
    const success = emailState === 'success';
    const canSubmit =
      email.length >= 5 &&
      email.includes('@') &&
      consent &&
      !submitting &&
      scanId !== null &&
      !success;

    const fmt = (n: number) =>
      `${currencySymbol}${Math.round(n).toLocaleString('en-US')}`;

    const topThree = result.categories
      .filter((c) => c.potentialSavings > 0)
      .sort((a, b) => b.potentialSavings - a.potentialSavings)
      .slice(0, 3);

    return (
      <div
        ref={ref}
        className="rounded-2xl bg-white border shadow-sm p-5 md:p-6 lg:sticky lg:top-24"
        style={{ borderColor: '#E5E7EB' }}
        aria-live="polite"
      >
        {/* Severity badge */}
        <div className="flex justify-center mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ background: severity.color, color: '#ffffff' }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {severity.label}
          </span>
        </div>

        {/* Big number */}
        <div className="text-center mb-4">
          <div
            className="text-xs uppercase tracking-wider font-semibold"
            style={{ color: 'var(--sfp-slate)' }}
          >
            Your annual money leak
          </div>
          <div
            className="text-4xl md:text-5xl font-extrabold tabular-nums leading-tight mt-1"
            style={{ color: 'var(--sfp-navy)' }}
          >
            {fmt(animated)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
            recoverable per year
          </div>
        </div>

        {/* Donut */}
        <div className="mb-5">
          <LeakDonut
            categories={result.categories}
            currencySymbol={currencySymbol}
            totalAnnual={result.totalAnnualLeak}
            size={200}
          />
        </div>

        {/* Top 3 fixes */}
        {topThree.length > 0 && (
          <div className="mb-5">
            <div
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--sfp-slate)' }}
            >
              Top 3 fixes
            </div>
            <ol className="space-y-2">
              {topThree.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-1.5"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-sm font-semibold truncate"
                      style={{ color: 'var(--sfp-ink)' }}
                    >
                      {c.label}
                    </span>
                  </span>
                  <span
                    className="text-sm font-bold tabular-nums whitespace-nowrap"
                    style={{ color: 'var(--sfp-green)' }}
                  >
                    {fmt(c.potentialSavings)}/yr
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Email gate */}
        <div
          className="rounded-xl p-4 border-2"
          style={{ borderColor: 'var(--sfp-gold)', background: '#FFFBEF' }}
        >
          {success ? (
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="h-5 w-5 mt-0.5 shrink-0"
                style={{ color: 'var(--sfp-green)' }}
                aria-hidden="true"
              />
              <div>
                <div
                  className="text-sm font-bold mb-0.5"
                  style={{ color: 'var(--sfp-ink)' }}
                >
                  Report sent — check your inbox
                </div>
                <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                  We emailed your full 6-category PDF and personalized matches.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-3">
                <Lock
                  className="h-5 w-5 mt-0.5 shrink-0"
                  style={{ color: 'var(--sfp-navy)' }}
                  aria-hidden="true"
                />
                <div>
                  <div
                    className="text-sm font-bold mb-0.5"
                    style={{ color: 'var(--sfp-ink)' }}
                  >
                    Get the full PDF report
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                    Complete breakdown + best-match products. No spam, unsubscribe anytime.
                  </div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canSubmit) onSubmitEmail(email);
                }}
                className="space-y-2.5"
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-describedby="leak-email-consent"
                  className="w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm outline-none focus:border-[color:var(--sfp-navy)] focus:ring-2 focus:ring-[color:var(--sfp-navy)]/20"
                  style={{ borderColor: '#E5E7EB', color: 'var(--sfp-ink)' }}
                />
                <label
                  id="leak-email-consent"
                  className="flex items-start gap-2 text-[11px] leading-snug"
                  style={{ color: 'var(--sfp-slate)' }}
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 cursor-pointer"
                  />
                  <span>
                    Send me the report and occasional money-saving tips.
                  </span>
                </label>

                {emailError && (
                  <p
                    className="text-xs p-2.5 rounded-lg"
                    style={{ background: '#FEF2F2', color: 'var(--sfp-red)' }}
                    role="alert"
                  >
                    {emailError}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="gold"
                  disabled={!canSubmit}
                  className="w-full h-auto py-2.5 text-sm font-bold"
                >
                  {submitting
                    ? 'Preparing your report…'
                    : scanId === null
                      ? 'Adjust a value to continue'
                      : 'Send me the report'}
                </Button>

                <p
                  className="text-[10px] flex items-center gap-1 justify-center"
                  style={{ color: 'var(--sfp-slate)' }}
                >
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  We never sell your data. Encrypted at rest.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    );
  },
);

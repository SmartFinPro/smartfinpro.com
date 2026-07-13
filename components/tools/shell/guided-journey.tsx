'use client';
// components/tools/shell/guided-journey.tsx
// Wealth Horizon / Broker Journey / Loan (SPEC 6.2) — step panel + progress
// ("Step x of y") on the left, an interim preview on the right, and the
// result canvas replacing both after the last step. Owns step-index state
// locally; step content/validation is fully owned by the caller (steps[].content).

import { useState } from 'react';

export interface GuidedJourneyStep {
  key: string;
  title: string;
  content: React.ReactNode;
}

export interface GuidedJourneyLayoutProps {
  steps: GuidedJourneyStep[];
  interim?: React.ReactNode;
  result: React.ReactNode;
  /** Called before advancing past the last step's "Next" — return false to block. */
  canAdvance?: (stepIndex: number) => boolean;
  onComplete?: () => void;
}

export function GuidedJourneyLayout({ steps, interim, result, canAdvance, onComplete }: GuidedJourneyLayoutProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const total = steps.length;
  const step = steps[stepIndex];

  function goNext(): void {
    if (canAdvance && !canAdvance(stepIndex)) return;
    if (stepIndex + 1 >= total) {
      setCompleted(true);
      onComplete?.();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function goBack(): void {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  if (completed) {
    return <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">{result}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
      <div className="flex flex-col gap-4 md:col-span-5">
        <div className="progress flex gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <i
              key={s.key}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= stepIndex ? 'var(--sfp-navy)' : 'var(--tool-border)' }}
            />
          ))}
        </div>
        <p className="step-label m-0 text-xs font-semibold uppercase tracking-[0.04em] text-[var(--sfp-slate)]">
          Step {stepIndex + 1} of {total}
        </p>
        <h2 className="t-h2 m-0 text-[22px] font-semibold leading-[28px] text-[var(--sfp-ink)]">{step.title}</h2>
        <div>{step.content}</div>
        <div className="flex gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="btn min-h-11 rounded-tool-control border px-4 text-sm font-semibold"
              style={{ borderColor: 'var(--tool-border-strong)', background: 'var(--tool-surface)', color: 'var(--sfp-ink)' }}
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={goNext}
            className="btn-primary min-h-11 rounded-tool-control px-5 text-sm font-semibold text-white"
            style={{ background: 'var(--sfp-navy)' }}
          >
            {stepIndex + 1 >= total ? 'See my result' : 'Next'}
          </button>
        </div>
      </div>
      <div className="md:col-span-7">{interim}</div>
    </div>
  );
}

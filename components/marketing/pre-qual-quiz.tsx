'use client';
// components/marketing/pre-qual-quiz.tsx
// P3: Pre-Qual Quiz — 3-step qualification modal before outbound affiliate click
//
// Opens as a modal overlay. 3 questions → POST /api/pre-qual → redirect to partner.
// Skippable — skipping still records the click and redirects.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ArrowRight, SkipForward } from 'lucide-react';
import { getQuizQuestions } from '@/lib/pre-qual/questions';
import type { QuizQuestion } from '@/lib/pre-qual/questions';

interface PreQualQuizProps {
  /** Affiliate slug (e.g. 'etoro') */
  slug: string;
  /** Market code */
  market: string;
  /** Category slug */
  category: string;
  /** Called when modal should close */
  onClose: () => void;
}

export function PreQualQuiz({ slug, market, category, onClose }: PreQualQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const questions: QuizQuestion[] = getQuizQuestions(category);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  // Submit quiz and redirect
  // IMPORTANT: window.open must be called synchronously from user gesture
  // to avoid popup blockers. We open a blank tab first, then set its URL.
  const submitAndRedirect = useCallback(async (finalAnswers: Record<string, string>, skipped: boolean) => {
    setSubmitting(true);

    // Open the tab synchronously (within user gesture context)
    const newTab = window.open('about:blank', '_blank', 'noopener,noreferrer');

    try {
      const res = await fetch('/api/pre-qual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          market,
          category,
          answers: finalAnswers,
          skipped,
          pageUrl: window.location.pathname,
        }),
      });
      const data = await res.json();
      const redirectUrl = data.redirectUrl || `/go/${slug}/`;
      if (newTab) {
        newTab.location.href = redirectUrl;
      } else {
        // Popup still blocked (e.g. aggressive browser settings) — fallback
        window.location.href = redirectUrl;
      }
    } catch {
      const fallbackUrl = `/go/${slug}/`;
      if (newTab) {
        newTab.location.href = fallbackUrl;
      } else {
        window.location.href = fallbackUrl;
      }
    }
    onClose();
  }, [slug, market, category, onClose]);

  // Handle answer selection
  const handleSelect = useCallback((questionId: string, value: string) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);

    if (step < questions.length - 1) {
      // Next question
      setStep(step + 1);
    } else {
      // Last question — submit
      submitAndRedirect(updated, false);
    }
  }, [answers, step, questions.length, submitAndRedirect]);

  // Skip quiz entirely
  const handleSkip = useCallback(() => {
    submitAndRedirect(answers, true);
  }, [answers, submitAndRedirect]);

  const currentQuestion = questions[step];
  if (!currentQuestion) return null;

  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Quick qualification quiz"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{ animation: 'fadeInScale 0.2s ease-out' }}
      >
        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: 'var(--sfp-gray)' }}>
          <div
            className="h-full transition-all duration-300 rounded-r-full"
            style={{ width: `${progress}%`, background: 'var(--sfp-gold)' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-navy)' }}>
              Quick Match
            </p>
            <p className="text-xs text-slate-500">
              Step {step + 1} of {questions.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close quiz"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Question */}
        <div className="px-5 pb-2">
          <h3 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>
            {currentQuestion.question}
          </h3>
        </div>

        {/* Options */}
        <div className="px-5 pb-4 space-y-2">
          {currentQuestion.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(currentQuestion.id, opt.value)}
              disabled={submitting}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-gray-200 text-left text-sm font-medium transition-all hover:border-blue-300 hover:shadow-sm disabled:opacity-50"
              style={{ color: 'var(--sfp-ink)' }}
            >
              <span>{opt.label}</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </button>
          ))}
        </div>

        {/* Skip */}
        <div className="px-5 pb-5 flex justify-center">
          <button
            onClick={handleSkip}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <SkipForward className="w-3 h-3" />
            <span>Skip — go directly</span>
          </button>
        </div>
      </div>

      {/* Inline animation keyframe */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

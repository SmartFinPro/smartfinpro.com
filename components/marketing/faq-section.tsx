'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateFAQSchema } from '@/lib/seo/schema';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
  title?: string;
  includeSchema?: boolean;
  /** All answers open on arrival (operator, 2026-07-21): unopened answers are
   * still in the HTML, but burying the page's most quotable, question-shaped
   * content behind a click is the opposite of what an answer engine needs.
   * Still collapsible either way; this only sets the initial state.
   * V2 reviews opt out (operator, 2026-07-25) — closed until the reader clicks. */
  defaultOpen?: boolean;
}

export function FAQSection({
  faqs,
  title = 'Frequently Asked Questions',
  includeSchema = true,
  defaultOpen = true,
}: FAQSectionProps) {
  const [closed, setClosed] = useState<Set<number>>(() =>
    defaultOpen || !Array.isArray(faqs) ? new Set() : new Set(faqs.map((_, i) => i))
  );
  const isOpen = (i: number) => !closed.has(i);
  const toggle = (i: number) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  // Defensive guard: faqs may be undefined if frontmatter scope wasn't injected
  if (!faqs || !Array.isArray(faqs) || faqs.length === 0) return null;

  return (
    <section>
      {/* Schema markup */}
      {includeSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFAQSchema(faqs)),
          }}
        />
      )}

      <h2 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--sfp-ink)' }}>{title}</h2>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="rounded-2xl bg-white overflow-hidden"
            style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <button
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={isOpen(index)}
            >
              <span className="font-medium pr-4" style={{ color: 'var(--sfp-ink)' }}>{faq.question}</span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-200',
                  isOpen(index) && 'rotate-180'
                )}
                style={{ color: 'var(--sfp-navy)' }}
              />
            </button>

            {/* grid-rows 0fr/1fr rather than a max-height guess: the old
                max-h-[500px] silently clipped any answer taller than that, and
                with every answer now open by default a clipped one would be a
                visible defect rather than a rare one. This animates to the
                content's real height, whatever it is. */}
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-200',
                isOpen(index) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <div className="mx-5 mb-5 rounded-xl px-4 py-4 leading-relaxed" style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-ink)' }}>
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Inline FAQ for shorter lists
interface InlineFAQProps {
  faqs: FAQ[];
}

export function InlineFAQ({ faqs }: InlineFAQProps) {
  return (
    <div className="space-y-6 my-8">
      {faqs.map((faq, index) => (
        <div key={index} className="rounded-2xl bg-white p-5" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>{faq.question}</h4>
          <p className="leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{faq.answer}</p>
        </div>
      ))}
    </div>
  );
}

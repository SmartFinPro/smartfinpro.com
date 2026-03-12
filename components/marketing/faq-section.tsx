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
}

export function FAQSection({
  faqs,
  title = 'Frequently Asked Questions',
  includeSchema = true,
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={openIndex === index}
            >
              <span className="font-medium pr-4" style={{ color: 'var(--sfp-ink)' }}>{faq.question}</span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-200',
                  openIndex === index && 'rotate-180'
                )}
                style={{ color: 'var(--sfp-navy)' }}
              />
            </button>

            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                openIndex === index ? 'max-h-[500px]' : 'max-h-0'
              )}
            >
              <div className="px-5 pb-5 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                {faq.answer}
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

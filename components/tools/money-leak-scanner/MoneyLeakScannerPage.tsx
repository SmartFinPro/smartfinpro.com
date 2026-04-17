import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lightbulb, Zap } from 'lucide-react';
import { MoneyLeakScanner } from './MoneyLeakScanner';
import { generateFAQSchema, generateHowToSchema } from '@/lib/seo/schema';
import type { Market } from '@/types';

interface MoneyLeakScannerPageProps {
  market: Market;
  canonicalUrl: string;
}

const MARKET_LABEL: Record<Market, string> = {
  us: 'US',
  uk: 'UK',
  ca: 'Canada',
  au: 'Australia',
};

const BACK_HREF: Record<Market, string> = {
  us: '/tools',
  uk: '/uk/tools',
  ca: '/ca/tools',
  au: '/au/tools',
};

const FAQS = [
  {
    question: 'How does the Money Leak Scanner work?',
    answer:
      'Drag sliders for your monthly income and spend across six categories (banking fees, subscriptions, credit-card interest, insurance, investment fees, FX) and toggle a few habit questions. Each slider re-scores the result instantly against market-specific benchmarks and estimates how much of your current spend is recoverable. The total is your annual money leak.',
  },
  {
    question: 'Is my data stored or shared?',
    answer:
      'Your scan inputs are stored anonymously with a hashed IP. Your email is only saved once you explicitly unlock the full report and tick the consent box. We never sell your data and you can unsubscribe any time.',
  },
  {
    question: 'Do I have to give my email to see the results?',
    answer:
      'No. The full 6-category breakdown, donut chart, and matched product recommendations are visible to everyone without an email. Email is only needed if you want a downloadable PDF report sent to you for later reference.',
  },
  {
    question: 'Are the recommendations affiliate links?',
    answer:
      'Yes. SmartFinPro earns a commission when you sign up through the partners we suggest. This never affects our scoring: the leak engine runs the same for everyone and commissions only influence the ordering among already-matched partners.',
  },
  {
    question: 'How accurate are the savings estimates?',
    answer:
      'Estimates are deliberately conservative and based on published benchmarks for each category (e.g. fee drag for investing, average balance-transfer savings for credit-card interest). They are directional, not guaranteed — the point is to show you where the biggest wins are.',
  },
  {
    question: 'Is the scanner available in my country?',
    answer:
      'Yes — the scanner works in the US, UK, Canada and Australia with market-specific thresholds and compliance labels. If you want results in a different market, switch using the country selector.',
  },
];

const HOWTO_STEPS = [
  { name: 'Drag the sliders to your numbers', description: 'Monthly income plus approximate spend across banking fees, subscriptions, credit-card interest, insurance, investing and FX.' },
  { name: 'Toggle the habits that apply', description: 'Robo-advisor, annual insurance comparison, recent refinance — the engine re-scores instantly.' },
  { name: 'Watch your annual leak update live', description: 'The big-number and donut chart update as you move each slider — no step buttons, no waiting.' },
  { name: 'Review the 6-category breakdown', description: 'Every category shows exactly what is recoverable and why.' },
  { name: 'Get the full PDF report', description: 'Optional — enter your email for a shareable PDF and your best-match partners.' },
];

export function MoneyLeakScannerPage({ market, canonicalUrl }: MoneyLeakScannerPageProps) {
  const howtoSchema = generateHowToSchema({
    name: `Money Leak Scanner — ${MARKET_LABEL[market]}`,
    description:
      'Find how much money is leaking from your household each month across banking fees, subscriptions, credit-card interest, insurance, investment fees and FX.',
    estimatedTime: 'PT60S',
    steps: HOWTO_STEPS,
  });

  const faqSchema = generateFAQSchema(FAQS);

  return (
    <div style={{ background: 'var(--sfp-gray)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howtoSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href={BACK_HREF[market]}
          className="inline-flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--sfp-slate)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tools
        </Link>
      </div>

      {/* Hero */}
      <section className="pt-2 pb-4">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3" style={{ color: 'var(--sfp-ink)' }}>
              Money Leak Scanner
            </h1>
            <p className="text-base md:text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Drag the sliders — your annual money leak updates live. See exactly where your household
              is overpaying across six categories that quietly drain thousands per year.
            </p>
          </div>
        </div>
      </section>

      {/* Affiliate disclosure banner */}
      <div
        className="container mx-auto mb-2 px-4 py-2.5 rounded-lg border text-xs bg-white shadow-sm max-w-3xl"
        style={{ color: 'var(--sfp-slate)', borderColor: '#E5E7EB' }}
      >
        <strong style={{ color: 'var(--sfp-ink)' }}>Disclosure:</strong> SmartFinPro may earn a
        commission when you sign up through links on this page. This does not affect our tool results
        or editorial independence.{' '}
        <Link href="/affiliate-disclosure" className="hover:underline" style={{ color: 'var(--sfp-navy)' }}>
          Learn more
        </Link>
      </div>

      {/* Scanner */}
      <MoneyLeakScanner market={market} />

      {/* Info section */}
      <section className="py-16 border-t" style={{ borderColor: '#E5E7EB' }}>
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--sfp-sky)' }}>
              <Lightbulb className="h-6 w-6" style={{ color: 'var(--sfp-navy)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>
                How the scoring works
              </h2>
              <p style={{ color: 'var(--sfp-slate)' }}>
                Each of the six categories is scored against market-specific benchmarks (US/UK/CA/AU). A
                spend that exceeds a healthy ratio of your income — or a habit that signals you haven&apos;t
                shopped around recently — is flagged. Flagged spend is multiplied by a conservative
                recovery factor to estimate annualised savings.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl p-5 border bg-white shadow-sm" style={{ borderColor: '#E5E7EB' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--sfp-sky)' }}>
                <ShieldCheck className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>
                Privacy-first
              </h3>
              <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                IPs are hashed. Email is only stored when you tick the consent box. We never sell data.
              </p>
            </div>
            <div className="rounded-xl p-5 border bg-white shadow-sm" style={{ borderColor: '#E5E7EB' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--sfp-sky)' }}>
                <Zap className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-ink)' }}>
                60-second scan
              </h3>
              <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                No sign-up required for the preview. Unlock the full breakdown with one email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t" style={{ borderColor: '#E5E7EB' }}>
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.question}
                className="rounded-xl border bg-white p-4 group"
                style={{ borderColor: '#E5E7EB' }}
              >
                <summary
                  className="cursor-pointer font-semibold"
                  style={{ color: 'var(--sfp-ink)' }}
                >
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-xs" style={{ color: 'var(--sfp-slate)' }}>
            Canonical: <a href={canonicalUrl} style={{ color: 'var(--sfp-navy)' }}>{canonicalUrl}</a>
          </p>
        </div>
      </section>
    </div>
  );
}

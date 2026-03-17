import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Lightbulb } from 'lucide-react';
import { DynamicAIROICalculator } from '@/components/tools/dynamic-calculators';
import { ToolRelatedReviews } from '@/components/marketing/tool-related-reviews';

export const metadata: Metadata = {
  title: 'AI ROI Calculator - Calculate AI Tool Investment Returns | SmartFinPro',
  description: 'Free AI ROI calculator. Calculate how much time and money your team can save with AI tools like Jasper AI, Copy.ai, and Writesonic.',
  openGraph: {
    title: 'AI ROI Calculator - Calculate AI Tool Investment Returns',
    description: 'Free calculator to estimate ROI from AI writing and productivity tools.',
  },
};

export default function AIROICalculatorPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }}>
          <ArrowLeft className="h-4 w-4" />
          Back to Tools
        </Link>
      </div>

      {/* Hero */}
      <section className="relative py-8 md:py-12 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-green)' }}>
              <TrendingUp className="h-4 w-4" />
              Free Calculator
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              AI ROI Calculator
            </h1>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Calculate the return on investment for AI productivity tools.
              See exactly how much time and money your team can save.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <DynamicAIROICalculator />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--sfp-sky)' }}>
                <Lightbulb className="h-6 w-6" style={{ color: 'var(--sfp-gold)' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>How We Calculate ROI</h2>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Our calculator uses industry-standard time savings data reported by users of each AI tool.
                  Results are based on reducing time spent on content creation, research, and writing tasks.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>Time Savings Factors</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>Jasper AI: 40% time reduction</li>
                  <li>Copy.ai: 35% time reduction</li>
                  <li>Writesonic: 30% time reduction</li>
                  <li>ChatGPT Plus: 25% time reduction</li>
                </ul>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>What&apos;s Included</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>Monthly and yearly projections</li>
                  <li>Team-wide impact calculation</li>
                  <li>Payback period estimation</li>
                  <li>Productivity gain percentage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Reviews */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <ToolRelatedReviews
            title="AI Tool Reviews"
            subtitle="Read our expert reviews of the AI tools featured in this calculator."
            reviews={[
              { name: 'Jasper AI Review', href: '/ai-tools/jasper-ai-review', rating: 4.7, badge: 'Best Overall' },
              { name: 'Copy.ai Review', href: '/ai-tools/copy-ai-review', rating: 4.5 },
              { name: 'AI Writing Tools Guide', href: '/ai-tools/ai-writing-tools-financial-content', badge: 'Guide' },
              { name: 'AI-Driven Finance Future', href: '/ai-tools/ai-driven-finance-future', badge: 'Research' },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

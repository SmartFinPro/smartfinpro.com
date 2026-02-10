import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Lightbulb } from 'lucide-react';
import { AIROICalculator } from '@/components/tools/ai-roi-calculator';

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
    <div className="min-h-screen bg-[#0f0a1a]">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-400 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Tools
        </Link>
      </div>

      {/* Hero */}
      <section className="relative py-8 md:py-12 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
              <TrendingUp className="h-4 w-4" />
              Free Calculator
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              AI ROI Calculator
            </h1>
            <p className="text-lg text-slate-400">
              Calculate the return on investment for AI productivity tools.
              See exactly how much time and money your team can save.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <AIROICalculator />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                <Lightbulb className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">How We Calculate ROI</h2>
                <p className="text-slate-400">
                  Our calculator uses industry-standard time savings data reported by users of each AI tool.
                  Results are based on reducing time spent on content creation, research, and writing tasks.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="font-semibold text-white mb-3">Time Savings Factors</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Jasper AI: 40% time reduction</li>
                  <li>Copy.ai: 35% time reduction</li>
                  <li>Writesonic: 30% time reduction</li>
                  <li>ChatGPT Plus: 25% time reduction</li>
                </ul>
              </div>
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="font-semibold text-white mb-3">What&apos;s Included</h3>
                <ul className="space-y-2 text-sm text-slate-400">
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
    </div>
  );
}

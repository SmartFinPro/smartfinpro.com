import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Calendar, Clock, ArrowRight, Shield, TrendingDown, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';

export const metadata: Metadata = {
  title: 'UK Cost of Living: Budgeting & Savings Strategies 2026 | SmartFinPro',
  description: 'Navigate the UK cost of living crisis with expert tips, budgeting tools, and financial planning strategies. Reduce expenses and maximise savings in 2026.',
  alternates: {
    canonical: 'https://smartfinpro.com/uk/cost-of-living',
    languages: {
      'en': 'https://smartfinpro.com/uk/cost-of-living',
      'en-US': 'https://smartfinpro.com/cost-of-living',
      'en-CA': 'https://smartfinpro.com/ca/cost-of-living',
      'en-AU': 'https://smartfinpro.com/au/cost-of-living',
    },
  },
  openGraph: {
    title: 'UK Cost of Living: Budgeting & Savings Strategies 2026 | SmartFinPro',
    description: 'Navigate the UK cost of living crisis with expert tips, budgeting tools, and financial planning strategies. Reduce expenses and maximise savings in 2026.',
    type: 'website',
    locale: 'en_GB',
  },
};

export default function UKCostOfLivingPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white body silo-uk">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-var(--sfp-sky) px-4 py-2 border border-blue-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Updated February {currentYear}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-var(--sfp-ink) leading-tight">
              UK Cost of Living <span className="text-var(--sfp-gold)">Guide</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-var(--sfp-slate) mb-8 leading-relaxed">
              Master your finances in 2026. Expert budgeting strategies, energy saving tips, and money-saving tools to reduce your cost of living across housing, utilities, food, and transport.
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-var(--sfp-slate) mb-8">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-var(--sfp-gold)" />
                Last updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-var(--sfp-navy)" />
                12 min read
              </span>
            </div>

            {/* Primary CTA */}
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-var(--sfp-gold) hover:bg-var(--sfp-gold-dark) text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Link href="/uk/cost-of-living#tools">
                  Budget Tools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-2 border-var(--sfp-navy) text-var(--sfp-navy) hover:bg-var(--sfp-sky) px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Link href="#strategies">Money Saving Tips</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <section className="container mx-auto px-4 py-8">
        <AffiliateDisclosure market="uk" position="top" />
      </section>

      {/* Answer Block - Common Question */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl bg-var(--sfp-sky) border-l-4 border-var(--sfp-navy) rounded-lg p-6 md:p-8">
          <h2 className="text-xl font-bold text-var(--sfp-navy) mb-3">
            What Is the UK Cost of Living Crisis?
          </h2>
          <p className="text-var(--sfp-ink) leading-relaxed mb-4">
            The UK cost of living refers to the total expenses needed for essential items such as housing, food, utilities, transport, and childcare. Recent years have seen significant increases in these costs due to inflation, energy price volatility, and broader economic pressures.
          </p>
          <p className="text-var(--sfp-ink) leading-relaxed">
            Understanding and managing your cost of living is critical for financial wellbeing. By identifying areas where you can cut expenses and optimising your spending, you can maintain your lifestyle whilst improving your financial security and savings.
          </p>
        </div>
      </section>

      {/* Placeholder Content Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl space-y-12">
          {/* Key Cost Categories */}
          <div id="strategies">
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Managing Your Household Costs
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Housing & Mortgages',
                  description: 'Remortgage to better rates, explore government schemes, or negotiate council tax bands to reduce housing costs.',
                  icon: '🏠',
                },
                {
                  title: 'Energy & Utilities',
                  description: 'Switch suppliers, improve insulation, and use smart metres to monitor and reduce your energy bills.',
                  icon: '⚡',
                },
                {
                  title: 'Groceries & Food',
                  description: 'Meal planning, bulk buying, using loyalty schemes, and switching to budget brands can significantly cut food costs.',
                  icon: '🛒',
                },
                {
                  title: 'Transport & Commuting',
                  description: 'Explore rail passes, car-sharing schemes, and public transport to reduce commuting expenses.',
                  icon: '🚗',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-var(--sfp-gold) transition-colors"
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-var(--sfp-navy) mb-2">{item.title}</h3>
                  <p className="text-var(--sfp-slate) text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tools & Resources Section */}
          <div id="tools">
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Money-Saving Tools
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  name: 'Budget Planner',
                  description: 'Track income and expenses across all categories to identify saving opportunities.',
                },
                {
                  name: 'Energy Cost Calculator',
                  description: 'Estimate annual energy bills and compare supplier rates in real-time.',
                },
                {
                  name: 'Mortgage Calculator',
                  description: 'Calculate remortgage savings and find the best deal for your situation.',
                },
                {
                  name: 'Savings Rate Finder',
                  description: 'Compare UK savings accounts and ISAs to maximise returns on your emergency fund.',
                },
              ].map((tool, idx) => (
                <div
                  key={idx}
                  className="bg-var(--sfp-gray) rounded-lg p-5 border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Lightbulb className="h-5 w-5 text-var(--sfp-gold) shrink-0 mt-0.5" />
                    <h4 className="font-bold text-var(--sfp-navy)">{tool.name}</h4>
                  </div>
                  <p className="text-sm text-var(--sfp-slate) leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Assistance Section */}
          <div>
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Government Support & Assistance
            </h2>
            <div className="bg-white rounded-lg border-2 border-var(--sfp-green) p-6 md:p-8">
              <div className="space-y-4">
                {[
                  'Cost of Living Payment schemes for eligible households',
                  'Pension Credit and means-tested benefits for older adults',
                  'Council Tax Reduction schemes',
                  'Fuel Duty Allowance and Winter Fuel Payment',
                  'Energy bill support schemes',
                  'Free financial advice from StepChange and Citizens Advice',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <TrendingDown className="h-5 w-5 text-var(--sfp-green) shrink-0 mt-0.5" />
                    <p className="text-var(--sfp-ink) text-sm font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related Silos */}
          <div>
            <h2 className="text-2xl font-bold text-var(--sfp-ink) mb-6">
              Related Financial Topics
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/uk/remortgaging"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  UK Remortgaging Hub
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  Find better mortgage rates and save thousands
                </p>
              </Link>
              <Link
                href="/uk/savings"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  Savings & ISA Reviews
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  Explore tax-free savings options
                </p>
              </Link>
              <Link
                href="/uk/personal-finance"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  Personal Finance Hub
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  Comprehensive money management guide
                </p>
              </Link>
              <Link
                href="/uk"
                className="block bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-var(--sfp-gold) hover:shadow-md transition-all group"
              >
                <p className="font-semibold text-var(--sfp-navy) group-hover:text-var(--sfp-gold) transition-colors">
                  UK Market Hub
                </p>
                <p className="text-xs text-var(--sfp-slate) mt-1">
                  All UK financial resources
                </p>
              </Link>
            </div>
          </div>

          {/* Final CTA */}
          <div className="bg-var(--sfp-sky) rounded-lg p-8 border-l-4 border-var(--sfp-gold) text-center">
            <h3 className="text-xl font-bold text-var(--sfp-navy) mb-3">
              Start Reducing Your Costs Today
            </h3>
            <p className="text-var(--sfp-slate) mb-6 max-w-2xl mx-auto">
              Use our tools and expert guides to identify savings opportunities across housing, energy, food, and transport. Even small reductions add up to thousands per year.
            </p>
            <Button
              asChild
              className="bg-var(--sfp-gold) hover:bg-var(--sfp-gold-dark) text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              <Link href="#tools">Explore Money-Saving Tools</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust & Credibility Footer */}
      <section className="container mx-auto px-4 py-12 border-t border-slate-200">
        <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 border border-var(--sfp-green)">
          <div className="flex items-start gap-3 mb-3">
            <Shield className="h-5 w-5 text-var(--sfp-green) shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-var(--sfp-navy) mb-2">
                Expert Verified Information
              </h4>
              <p className="text-sm text-var(--sfp-slate) leading-relaxed">
                Our cost of living guidance is based on current UK government statistics, Office for National Statistics (ONS) data, and FCA-regulated financial advice. We regularly update our information to reflect changing economic conditions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

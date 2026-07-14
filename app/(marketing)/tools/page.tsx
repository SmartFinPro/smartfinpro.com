import { Metadata } from 'next';
import Link from 'next/link';
import {
  Calculator, CreditCard, Scale, ArrowRight, Sparkles, Target,
  ScanSearch, Compass, Columns3, Bot, Banknote, TrendingDown, TrendingUp, Gauge,
  type LucideIcon,
} from 'lucide-react';
import { getToolsForMarket, type DecisionCategory } from '@/lib/tools/registry';

export const metadata: Metadata = {
  title: 'Free Financial Tools & Calculators | SmartFinPro',
  description: 'Use our free financial calculators and comparison tools. Calculate AI ROI, loan payments, compare brokers, and make smarter financial decisions.',
  openGraph: {
    title: 'Free Financial Tools & Calculators | SmartFinPro',
    description: 'Use our free financial calculators and comparison tools.',
  },
};

// Registry icon key (SPEC 9.1, lucide-Key) → Lucide component.
const iconMap: Record<string, LucideIcon> = {
  'scan-search': ScanSearch,
  compass: Compass,
  calculator: Calculator,
  'columns-3': Columns3,
  bot: Bot,
  banknote: Banknote,
  'trending-down': TrendingDown,
  'trending-up': TrendingUp,
  gauge: Gauge,
  'credit-card': CreditCard,
};

// Display label for decisionCategory (registry taxonomy) — grouping label only,
// not a data source in itself.
const categoryLabel: Record<DecisionCategory, string> = {
  spend: 'Personal Finance',
  retire: 'Personal Finance',
  broker: 'Trading',
  home: 'Personal Finance',
  debt: 'Personal Finance',
  'credit-cards': 'Personal Finance',
  fees: 'Investing',
  niche: 'Investing',
  business: 'Productivity',
};

const tools = getToolsForMarket('us').map((t) => ({
  title: t.name,
  description: t.blurb,
  icon: iconMap[t.icon] ?? Calculator,
  href: t.entryHref,
  category: categoryLabel[t.decisionCategory],
  isNew: t.isNew,
}));

export default function ToolsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-white/20 text-white">
              <Sparkles className="h-4 w-4" />
              Free to Use
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Financial Tools & Calculators
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Make smarter financial decisions with our free interactive tools.
              No sign-up required.
            </p>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-24 -mt-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {tools.map((tool) => {
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group relative rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg bg-white"
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
                      <tool.icon className="h-6 w-6" />
                    </div>
                    {tool.isNew && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--sfp-gold-dark)' }}
                      >
                        New
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sfp-slate)' }}>
                    {tool.category}
                  </span>
                  <h2 className="text-lg font-bold mt-1 mb-2 transition-colors" style={{ color: 'var(--sfp-ink)' }}>
                    {tool.title}
                  </h2>
                  <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                    {tool.description}
                  </p>
                  <span className="inline-flex items-center gap-2 font-medium text-sm group-hover:gap-3 transition-all" style={{ color: 'var(--sfp-navy)' }}>
                    Use Tool
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
            Need personalized recommendations?
          </h2>
          <p className="mb-6 max-w-xl mx-auto" style={{ color: 'var(--sfp-slate)' }}>
            Start with the Broker Finder Quiz for a personalized recommendation, then validate your shortlist in Broker Comparison.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tools/broker-finder"
              className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-medium transition-colors hover:shadow-lg"
              style={{ background: 'var(--sfp-gold)', color: 'var(--sfp-ink)' }}
            >
              <Target className="h-5 w-5" />
              Take the Quiz
            </Link>
            <Link
              href="/tools/broker-comparison"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium border border-gray-200 transition-colors hover:bg-gray-50"
              style={{ color: 'var(--sfp-navy)', background: '#fff' }}
            >
              <Scale className="h-5 w-5" />
              Open Comparison
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

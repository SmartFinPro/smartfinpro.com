import { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, DollarSign, Scale, TrendingUp, ArrowRight, Sparkles, Target, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Free Financial Tools & Calculators | SmartFinPro',
  description: 'Use our free financial calculators and comparison tools. Calculate AI ROI, loan payments, compare brokers, and make smarter financial decisions.',
  openGraph: {
    title: 'Free Financial Tools & Calculators | SmartFinPro',
    description: 'Use our free financial calculators and comparison tools.',
  },
};

const tools = [
  {
    title: 'Broker Finder Quiz',
    description: 'Answer 5 quick questions and get personalized broker recommendations with match scores. Find your perfect trading platform in under a minute.',
    icon: Target,
    href: '/tools/broker-finder',
    accent: 'cyan',
    category: 'Trading',
    badge: 'Popular',
  },
  {
    title: 'Trading Cost Calculator',
    description: 'Compare real trading costs across top brokers. See spreads, commissions, and overnight fees — discover how much you could save.',
    icon: BarChart3,
    href: '/tools/trading-cost-calculator',
    accent: 'violet',
    category: 'Trading',
    badge: 'New',
  },
  {
    title: 'Fee Savings Calculator',
    description: 'See how much you could save by switching from traditional bank mutual funds. Compare fee drag over 10, 20, and 30 years.',
    icon: DollarSign,
    href: '/tools/wealthsimple-calculator',
    accent: 'emerald',
    category: 'Investing',
    badge: 'New',
  },
  {
    title: 'AI ROI Calculator',
    description: 'Calculate the return on investment for AI tools like Jasper, Copy.ai, and more. See how much time and money your team can save.',
    icon: TrendingUp,
    href: '/tools/ai-roi-calculator',
    accent: 'emerald',
    category: 'Productivity',
    badge: null,
  },
  {
    title: 'Loan Calculator',
    description: 'Calculate monthly payments, total interest, and see a full amortization schedule for personal loans, debt consolidation, and more.',
    icon: Calculator,
    href: '/tools/loan-calculator',
    accent: 'blue',
    category: 'Personal Finance',
    badge: null,
  },
  {
    title: 'Broker Comparison',
    description: 'Compare forex and CFD brokers side by side. Filter by features, regulation, and find the best broker for your trading needs.',
    icon: Scale,
    href: '/tools/broker-comparison',
    accent: 'purple',
    category: 'Trading',
    badge: null,
  },
];

const accentMap: Record<string, { icon: string; border: string; text: string }> = {
  cyan: { icon: 'bg-cyan-500/20 text-cyan-400', border: 'hover:border-cyan-500/30', text: 'text-cyan-400' },
  violet: { icon: 'bg-violet-500/20 text-violet-400', border: 'hover:border-violet-500/30', text: 'text-violet-400' },
  emerald: { icon: 'bg-emerald-500/20 text-emerald-400', border: 'hover:border-emerald-500/30', text: 'text-emerald-400' },
  blue: { icon: 'bg-blue-500/20 text-blue-400', border: 'hover:border-blue-500/30', text: 'text-blue-400' },
  purple: { icon: 'bg-purple-500/20 text-purple-400', border: 'hover:border-purple-500/30', text: 'text-purple-400' },
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[#0f0a1a]">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="aurora-bg" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
              <Sparkles className="h-4 w-4" />
              Free to Use
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Financial Tools & Calculators
            </h1>
            <p className="text-xl text-slate-400 mb-8">
              Make smarter financial decisions with our free interactive tools.
              No sign-up required.
            </p>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {tools.map((tool) => {
              const colors = accentMap[tool.accent];
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group relative rounded-2xl border border-slate-800/50 p-6 transition-all duration-300 hover:translate-y-[-4px] ${colors.border}`}
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  {tool.badge && (
                    <span className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                      {tool.badge}
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center mb-4`}>
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
                    {tool.category}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1 mb-2 group-hover:text-cyan-400 transition-colors">
                    {tool.title}
                  </h2>
                  <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                    {tool.description}
                  </p>
                  <span className={`inline-flex items-center gap-2 ${colors.text} font-medium text-sm group-hover:gap-3 transition-all`}>
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
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Need personalized recommendations?
          </h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            Take our Broker Finder Quiz to get tailored recommendations
            based on your specific trading needs.
          </p>
          <Link
            href="/tools/broker-finder"
            className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-medium transition-colors"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
          >
            <Target className="h-5 w-5" />
            Take the Quiz
          </Link>
        </div>
      </section>
    </div>
  );
}

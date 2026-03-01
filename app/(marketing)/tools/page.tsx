import { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, CreditCard, DollarSign, Scale, TrendingUp, ArrowRight, Sparkles, Target, BarChart3, Home, PiggyBank } from 'lucide-react';

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
    category: 'Trading',
    badge: 'Popular',
  },
  {
    title: 'Trading Cost Calculator',
    description: 'Compare real trading costs across top brokers. See spreads, commissions, and overnight fees — discover how much you could save.',
    icon: BarChart3,
    href: '/tools/trading-cost-calculator',
    category: 'Trading',
    badge: 'New',
  },
  {
    title: 'Broker Comparison',
    description: 'Compare forex and CFD brokers side by side. Filter by features, regulation, and find the best broker for your trading needs.',
    icon: Scale,
    href: '/tools/broker-comparison',
    category: 'Trading',
    badge: 'Compare',
  },
  {
    title: 'Fee Savings Calculator',
    description: 'See how much you could save by switching from traditional bank mutual funds. Compare fee drag over 10, 20, and 30 years.',
    icon: DollarSign,
    href: '/ca/tools/wealthsimple-calculator',
    category: 'Investing',
    badge: 'New',
  },
  {
    title: 'AI ROI Calculator',
    description: 'Calculate the return on investment for AI tools. Includes Content & Marketing mode for teams plus a Financial Coaching sector with client capacity projections.',
    icon: TrendingUp,
    href: '/tools/ai-roi-calculator',
    category: 'Productivity',
    badge: 'Updated',
  },
  {
    title: 'Debt Payoff Calculator',
    description: 'Create a customized debt payoff plan using avalanche or snowball methods. See when you\'ll be debt-free and how much interest you\'ll save.',
    icon: Calculator,
    href: '/tools/debt-payoff-calculator',
    category: 'Personal Finance',
    badge: 'Coming Soon',
  },
  {
    title: 'Loan Calculator',
    description: 'Calculate monthly payments, total interest, and see a full amortization schedule for personal loans, debt consolidation, and more.',
    icon: Calculator,
    href: '/tools/loan-calculator',
    category: 'Personal Finance',
    badge: null,
  },
  {
    title: 'Credit Score Simulator',
    description: 'Predict how different actions affect your credit score. See the impact of paying off debt, opening new accounts, or making late payments.',
    icon: TrendingUp,
    href: '/tools/credit-score-simulator',
    category: 'Personal Finance',
    badge: 'Coming Soon',
  },
  {
    title: 'AU Mortgage Calculator',
    description: 'Calculate Australian home loan repayments, LVR, offset account savings, and stamp duty. Compare Big Four vs fintech rates.',
    icon: Home,
    href: '/au/tools/au-mortgage-calculator',
    category: 'Personal Finance',
    badge: 'New',
  },
  {
    title: 'UK Remortgage Calculator',
    description: 'Calculate your new monthly payment after remortgaging. Compare fixed vs tracker rates and see how much you could save by switching.',
    icon: Home,
    href: '/uk/tools/remortgage-calculator',
    category: 'Personal Finance',
    badge: 'Coming Soon',
  },
  {
    title: 'ISA Tax Savings Calculator',
    description: 'See how much you could save in capital gains tax and dividend tax by investing inside a Stocks & Shares ISA vs a General Investment Account.',
    icon: PiggyBank,
    href: '/uk/tools/isa-tax-savings-calculator',
    category: 'Personal Finance',
    badge: 'New',
  },
  {
    title: 'Credit Card Rewards Calculator',
    description: 'Compare Amex Gold, Chase Sapphire Preferred, and cashback cards side by side. Find which card earns the most based on your spending.',
    icon: CreditCard,
    href: '/tools/credit-card-rewards-calculator',
    category: 'Personal Finance',
    badge: 'New',
  },
  {
    title: 'CA Mortgage Affordability Calculator',
    description: 'Find out how much home you can afford in Canada. GDS/TDS ratios, OSFI stress test, CMHC insurance, and first-time buyer incentives.',
    icon: Home,
    href: '/ca/tools/ca-mortgage-affordability-calculator',
    category: 'Personal Finance',
    badge: 'New',
  },
];

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
                  {tool.badge && (
                    <span className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
                      {tool.badge}
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
                    <tool.icon className="h-6 w-6" />
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
              style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
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

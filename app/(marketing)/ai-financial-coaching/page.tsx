import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Brain,
  TrendingUp,
  Target,
  Zap,
  Shield,
  Globe,
  Users,
  CheckCircle2,
  ArrowRight,
  Clock,
  DollarSign,
  BarChart3,
  MessageSquare,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Financial Coaching - Personalized Wealth Guidance | SmartFinPro',
  description:
    'Discover AI-powered financial coaching platforms that provide personalized wealth advice, investment strategies, and automated financial planning across US, UK, Canada, and Australia.',
  alternates: {
    canonical: '/ai-financial-coaching',
    languages: {
      'en-US': '/ai-financial-coaching',
      'en-GB': '/ai-financial-coaching',
      'en-CA': '/ai-financial-coaching',
      'en-AU': '/ai-financial-coaching',
      'x-default': '/ai-financial-coaching',
    },
  },
};

const platforms = [
  {
    name: 'Wealthfront',
    description: 'AI-powered investment management with automated tax-loss harvesting',
    market: 'US',
    href: '/us/personal-finance/best-wealthfront-review-2026',
    features: ['Robo-advisor', 'Tax optimization', 'Cash account'],
  },
  {
    name: 'Jasper AI',
    description: 'Content generation for financial advisors and wealth managers',
    market: 'Global',
    href: '/us/ai-tools/jasper-ai-review',
    features: ['Content creation', 'Client communication', 'Marketing automation'],
  },
  {
    name: 'Wealthsimple',
    description: 'Canadian robo-advisor with AI-driven portfolio management',
    market: 'Canada',
    href: '/ca/personal-finance/wealthsimple-tax',
    features: ['TFSA/RRSP automation', 'Tax filing', 'Crypto investing'],
  },
];

const benefits = [
  {
    icon: Brain,
    title: '24/7 Financial Guidance',
    description: 'AI coaches available around the clock for instant financial advice and decision support',
  },
  {
    icon: Target,
    title: 'Personalized Strategies',
    description: 'Machine learning algorithms adapt to your financial goals, risk tolerance, and life stage',
  },
  {
    icon: DollarSign,
    title: 'Cost-Effective Solutions',
    description: 'Fraction of traditional advisor fees while maintaining professional-grade guidance',
  },
  {
    icon: BarChart3,
    title: 'Data-Driven Insights',
    description: 'Real-time analysis of markets, spending patterns, and investment opportunities',
  },
];

const useCases = [
  {
    title: 'Retirement Planning',
    description: 'AI optimizes contribution strategies across 401(k), IRA, and taxable accounts',
    markets: ['US', 'UK', 'CA', 'AU'],
  },
  {
    title: 'Debt Payoff Strategies',
    description: 'Automated debt avalanche or snowball methods with real-time payment optimization',
    markets: ['US', 'UK', 'CA'],
  },
  {
    title: 'Tax-Loss Harvesting',
    description: 'AI monitors portfolios daily to capture tax deductions from investment losses',
    markets: ['US', 'CA', 'AU'],
  },
  {
    title: 'Budget Optimization',
    description: 'Machine learning identifies spending patterns and suggests actionable savings',
    markets: ['US', 'UK', 'CA', 'AU'],
  },
];

const marketLinks = [
  {
    market: 'United States',
    flag: '🇺🇸',
    links: [
      { text: 'Best Robo-Advisors', href: '/us/personal-finance/best-robo-advisors' },
      { text: 'Wealthfront Review', href: '/us/personal-finance/best-wealthfront-review-2026' },
      { text: 'AI ROI Calculator', href: '/tools/ai-roi-calculator' },
    ],
  },
  {
    market: 'United Kingdom',
    flag: '🇬🇧',
    links: [
      { text: 'ISA Tax Savings', href: '/uk/personal-finance' },
      { text: 'Remortgaging Guide', href: '/uk/remortgaging' },
      { text: 'ISA Calculator', href: '/uk/tools/isa-tax-savings-calculator' },
    ],
  },
  {
    market: 'Canada',
    flag: '🇨🇦',
    links: [
      { text: 'TFSA vs RRSP', href: '/ca/tax-efficient-investing' },
      { text: 'Wealthsimple Review', href: '/ca/personal-finance/wealthsimple-tax' },
      { text: 'Tax Calculator', href: '/ca/tools/wealthsimple-calculator' },
    ],
  },
  {
    market: 'Australia',
    flag: '🇦🇺',
    links: [
      { text: 'Superannuation Guide', href: '/au/superannuation' },
      { text: 'Best Super Funds', href: '/au/personal-finance' },
      { text: 'Mortgage Calculator', href: '/au/tools/au-mortgage-calculator' },
    ],
  },
];

export default function AIFinancialCoachingPage() {
  return (
    <div className="min-h-screen bg-[var(--sfp-gray)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--sfp-navy)]/5 via-transparent to-[var(--sfp-gold)]/5" />
        <div className="container relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--sfp-sky)] px-4 py-2 text-sm font-medium text-[var(--sfp-navy)]">
              <Sparkles className="h-4 w-4" />
              Cross-Market Financial Intelligence
            </div>
            <h1 className="mb-6 text-4xl font-bold text-[var(--sfp-ink)] lg:text-5xl">
              AI Financial Coaching for the Modern Investor
            </h1>
            <p className="mb-8 text-lg text-[var(--sfp-slate)]">
              Personalized wealth guidance powered by artificial intelligence. Compare robo-advisors, AI
              investment platforms, and automated financial planning tools across the US, UK, Canada, and
              Australia.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild className="bg-[var(--sfp-gold)] hover:bg-[var(--sfp-gold-dark)]">
                <Link href="#platforms">
                  Explore Platforms <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[var(--sfp-navy)] text-[var(--sfp-navy)] hover:bg-[var(--sfp-navy)] hover:text-white"
              >
                <Link href="/tools/ai-roi-calculator">Calculate ROI</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="border-b border-gray-200 bg-white py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">
              Why AI Financial Coaching?
            </h2>
            <p className="text-lg text-[var(--sfp-slate)]">
              Machine learning meets wealth management
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--sfp-navy)]/10">
                  <benefit.icon className="h-6 w-6 text-[var(--sfp-navy)]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[var(--sfp-ink)]">{benefit.title}</h3>
                <p className="text-sm text-[var(--sfp-slate)]">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="border-b border-gray-200 py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">
              Leading AI Financial Platforms
            </h2>
            <p className="text-lg text-[var(--sfp-slate)]">
              Expert-reviewed robo-advisors and AI wealth tools
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform) => (
              <Link
                key={platform.name}
                href={platform.href}
                className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-[var(--sfp-gold)] hover:shadow-lg"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-xl font-semibold text-[var(--sfp-ink)] group-hover:text-[var(--sfp-navy)]">
                    {platform.name}
                  </h3>
                  <span className="rounded-full bg-[var(--sfp-sky)] px-3 py-1 text-xs font-medium text-[var(--sfp-navy)]">
                    {platform.market}
                  </span>
                </div>
                <p className="mb-4 text-sm text-[var(--sfp-slate)]">{platform.description}</p>
                <ul className="space-y-2">
                  {platform.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-[var(--sfp-ink)]">
                      <CheckCircle2 className="h-4 w-4 text-[var(--sfp-green)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center text-sm font-medium text-[var(--sfp-gold)] group-hover:gap-2">
                  Read Review <ArrowRight className="h-4 w-4 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-b border-gray-200 bg-white py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">Common Use Cases</h2>
            <p className="text-lg text-[var(--sfp-slate)]">
              How AI coaches solve real financial challenges
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-lg font-semibold text-[var(--sfp-ink)]">{useCase.title}</h3>
                <p className="mb-3 text-sm text-[var(--sfp-slate)]">{useCase.description}</p>
                <div className="flex flex-wrap gap-2">
                  {useCase.markets.map((market) => (
                    <span
                      key={market}
                      className="rounded-full bg-[var(--sfp-gray)] px-3 py-1 text-xs font-medium text-[var(--sfp-ink)]"
                    >
                      {market}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market-Specific Resources */}
      <section className="py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">
              Resources by Market
            </h2>
            <p className="text-lg text-[var(--sfp-slate)]">
              Localized guides and tools for your region
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {marketLinks.map((item) => (
              <div
                key={item.market}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-2xl">{item.flag}</span>
                  <h3 className="text-lg font-semibold text-[var(--sfp-ink)]">{item.market}</h3>
                </div>
                <ul className="space-y-3">
                  {item.links.map((link) => (
                    <li key={link.text}>
                      <Link
                        href={link.href}
                        className="flex items-center justify-between text-sm text-[var(--sfp-navy)] hover:text-[var(--sfp-gold)]"
                      >
                        {link.text}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-200 bg-white py-16">
        <div className="container mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">
            Ready to Optimize Your Finances with AI?
          </h2>
          <p className="mb-8 text-lg text-[var(--sfp-slate)]">
            Compare platforms, read expert reviews, and find the perfect AI financial coach for your needs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild className="bg-[var(--sfp-gold)] hover:bg-[var(--sfp-gold-dark)]">
              <Link href="/us/personal-finance/best-robo-advisors">
                View Best Robo-Advisors <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[var(--sfp-navy)] text-[var(--sfp-navy)] hover:bg-[var(--sfp-navy)] hover:text-white"
            >
              <Link href="/tools">Explore Free Tools</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

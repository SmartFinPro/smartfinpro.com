import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import {
  Leaf,
  TrendingUp,
  Globe,
  Zap,
  Droplet,
  Wind,
  Sun,
  Recycle,
  CheckCircle2,
  ArrowRight,
  Target,
  Shield,
  BarChart3,
  DollarSign,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Green Finance & ESG Investing Guide 2026 | SmartFinPro',
  description:
    'Explore sustainable investing, ESG funds, and green finance solutions across global markets. Compare eco-friendly investment platforms and impact portfolios in the US, UK, Canada, and Australia.',
  alternates: {
    canonical: '/green-finance',
    languages: {
      'en-US': '/green-finance',
      'en-GB': '/green-finance',
      'en-CA': '/green-finance',
      'en-AU': '/green-finance',
      'x-default': '/green-finance',
    },
  },
};

const esgPillars = [
  {
    icon: Leaf,
    title: 'Environmental',
    description: 'Climate action, renewable energy, pollution reduction, and resource conservation',
    examples: ['Carbon neutrality', 'Renewable energy', 'Waste reduction', 'Water conservation'],
  },
  {
    icon: Globe,
    title: 'Social',
    description: 'Human rights, labor standards, diversity, and community impact',
    examples: ['Fair labor', 'Diversity & inclusion', 'Community development', 'Data privacy'],
  },
  {
    icon: Shield,
    title: 'Governance',
    description: 'Corporate ethics, board diversity, executive compensation, and transparency',
    examples: ['Board independence', 'Anti-corruption', 'Shareholder rights', 'Tax transparency'],
  },
];

const investmentOptions = [
  {
    title: 'ESG Equity Funds',
    description: 'Stock portfolios screened for environmental, social, and governance criteria',
    risk: 'Medium',
    returns: '7-12% annually',
    markets: ['US', 'UK', 'CA', 'AU'],
  },
  {
    title: 'Green Bonds',
    description: 'Fixed-income securities funding climate and environmental projects',
    risk: 'Low',
    returns: '3-6% annually',
    markets: ['US', 'UK', 'CA', 'AU'],
  },
  {
    title: 'Impact Investing',
    description: 'Targeted investments in companies solving specific social or environmental problems',
    risk: 'High',
    returns: '10-20% annually',
    markets: ['US', 'UK', 'AU'],
  },
  {
    title: 'Renewable Energy Stocks',
    description: 'Direct ownership in solar, wind, and clean energy companies',
    risk: 'Medium-High',
    returns: '8-15% annually',
    markets: ['US', 'UK', 'CA', 'AU'],
  },
];

const platforms = [
  {
    name: 'Wealthsimple',
    market: 'Canada',
    esgOptions: 'SRI portfolios with fossil fuel exclusions',
    href: '/ca/personal-finance/wealthsimple-tax',
  },
  {
    name: 'eToro',
    market: 'Global',
    esgOptions: 'ESG-screened CopyPortfolios and thematic investing',
    href: '/us/trading/etoro-review',
  },
  {
    name: 'Hargreaves Lansdown',
    market: 'UK',
    esgOptions: 'Wide selection of ethical and sustainable funds',
    href: '/uk/trading/hargreaves-lansdown-review',
  },
  {
    name: 'Interactive Brokers',
    market: 'Global',
    esgOptions: 'ESG data integration and sustainable ETF access',
    href: '/us/trading/interactive-brokers-review',
  },
];

const certifications = [
  {
    name: 'B Corp Certification',
    description: 'Rigorous social and environmental performance standards',
  },
  {
    name: 'MSCI ESG Ratings',
    description: 'AAA to CCC scale measuring ESG risk management',
  },
  {
    name: 'Carbon Trust Standard',
    description: 'Certification for carbon, water, and waste reduction',
  },
  {
    name: 'UN PRI Signatories',
    description: 'Commitment to responsible investment principles',
  },
];

const marketTrends = [
  {
    market: 'United States',
    flag: '🇺🇸',
    trend: 'SEC climate disclosure rules drive ESG transparency',
    links: [
      { text: 'Best Robo-Advisors', href: '/us/personal-finance/best-robo-advisors' },
      { text: 'Interactive Brokers Review', href: '/us/trading/interactive-brokers-review' },
    ],
  },
  {
    market: 'United Kingdom',
    flag: '🇬🇧',
    trend: 'FCA Sustainability Disclosure Requirements (SDR) in effect',
    links: [
      { text: 'ISA Tax Savings', href: '/uk/personal-finance' },
      { text: 'Hargreaves Lansdown Review', href: '/uk/trading/hargreaves-lansdown-review' },
    ],
  },
  {
    market: 'Canada',
    flag: '🇨🇦',
    trend: 'TFSA and RRSP eligible ESG funds grow to 300+ options',
    links: [
      { text: 'Tax-Efficient Investing', href: '/ca/tax-efficient-investing' },
      { text: 'Wealthsimple Review', href: '/ca/personal-finance/wealthsimple-tax' },
    ],
  },
  {
    market: 'Australia',
    flag: '🇦🇺',
    trend: 'Superannuation funds integrate climate risk assessments',
    links: [
      { text: 'Superannuation Guide', href: '/au/superannuation' },
      { text: 'Best Super Funds', href: '/au/personal-finance' },
    ],
  },
];

const faqs = [
  {
    q: 'Do ESG investments underperform traditional funds?',
    a: 'No. Meta-analysis shows ESG funds match or outperform conventional funds over 5+ year periods, while offering downside risk protection during market volatility.',
  },
  {
    q: 'What is greenwashing and how do I avoid it?',
    a: 'Greenwashing is when companies exaggerate environmental claims. Check for third-party certifications (B Corp, MSCI ESG), read fund prospectuses, and verify holdings align with stated ESG goals.',
  },
  {
    q: 'Are green bonds tax-advantaged?',
    a: 'In some markets, yes. US municipal green bonds offer tax-free interest. UK ISAs can hold green gilts tax-free. Check local regulations for specific benefits.',
  },
  {
    q: 'Can I hold ESG investments in retirement accounts?',
    a: 'Yes. ESG ETFs and mutual funds are eligible for US 401(k)/IRA, UK ISAs/SIPPs, Canadian TFSA/RRSP, and Australian super funds.',
  },
];

export default function GreenFinancePage() {
  return (
    <div className="min-h-screen bg-[var(--sfp-gray)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--sfp-green)]/10 via-transparent to-[var(--sfp-navy)]/5" />
        <div className="container relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--sfp-green)]/10 px-4 py-2 text-sm font-medium text-[var(--sfp-green)]">
              <Leaf className="h-4 w-4" />
              Sustainable Investing Across 4 Markets
            </div>
            <h1 className="mb-6 text-4xl font-bold text-[var(--sfp-ink)] lg:text-5xl">
              Green Finance & ESG Investing Guide 2026
            </h1>
            <p className="mb-8 text-lg text-[var(--sfp-slate)]">
              Align your investments with your values. Compare ESG funds, green bonds, and sustainable
              platforms across the US, UK, Canada, and Australia. Profit with purpose.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild className="bg-[var(--sfp-green)] hover:bg-[var(--sfp-green)]/90">
                <Link href="#platforms">
                  Compare ESG Platforms <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[var(--sfp-navy)] text-[var(--sfp-navy)] hover:bg-[var(--sfp-navy)] hover:text-white"
              >
                <Link href="/tools/ai-roi-calculator">Calculate Impact</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ESG Pillars */}
      <section className="border-b border-gray-200 bg-white py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">
              The Three Pillars of ESG
            </h2>
            <p className="text-lg text-[var(--sfp-slate)]">
              Understanding environmental, social, and governance criteria
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {esgPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--sfp-green)]/10">
                  <pillar.icon className="h-7 w-7 text-[var(--sfp-green)]" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-[var(--sfp-ink)]">{pillar.title}</h3>
                <p className="mb-4 text-sm text-[var(--sfp-slate)]">{pillar.description}</p>
                <ul className="space-y-2">
                  {pillar.examples.map((example) => (
                    <li key={example} className="flex items-center gap-2 text-sm text-[var(--sfp-ink)]">
                      <CheckCircle2 className="h-4 w-4 text-[var(--sfp-green)]" />
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Options */}
      <section className="border-b border-gray-200 py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">
              Green Investment Options
            </h2>
            <p className="text-lg text-[var(--sfp-slate)]">
              From conservative bonds to high-growth impact funds
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {investmentOptions.map((option) => (
              <div
                key={option.title}
                className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-xl font-semibold text-[var(--sfp-ink)]">{option.title}</h3>
                <p className="mb-4 text-sm text-[var(--sfp-slate)]">{option.description}</p>
                <div className="mb-4 flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-[var(--sfp-slate)]">Risk: </span>
                    <span className="font-medium text-[var(--sfp-ink)]">{option.risk}</span>
                  </div>
                  <div>
                    <span className="text-[var(--sfp-slate)]">Returns: </span>
                    <span className="font-medium text-[var(--sfp-green)]">{option.returns}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {option.markets.map((market) => (
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

      {/* Platforms Section */}
      <section id="platforms" className="border-b border-gray-200 bg-white py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">
              ESG Investment Platforms
            </h2>
            <p className="text-lg text-[var(--sfp-slate)]">
              Brokers and robo-advisors with sustainable options
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {platforms.map((platform) => (
              <Link
                key={platform.name}
                href={platform.href}
                className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-[var(--sfp-green)] hover:shadow-lg"
              >
                <h3 className="mb-2 text-lg font-semibold text-[var(--sfp-ink)] group-hover:text-[var(--sfp-green)]">
                  {platform.name}
                </h3>
                <p className="mb-3 text-xs text-[var(--sfp-slate)]">{platform.market}</p>
                <p className="mb-4 text-sm text-[var(--sfp-slate)]">{platform.esgOptions}</p>
                <div className="flex items-center text-sm font-medium text-[var(--sfp-green)] group-hover:gap-2">
                  Read Review <ArrowRight className="h-4 w-4 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Market Trends */}
      <section className="border-b border-gray-200 py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">
              2026 Green Finance Trends by Market
            </h2>
            <p className="text-lg text-[var(--sfp-slate)]">
              Regulatory updates and ESG developments
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {marketTrends.map((item) => (
              <div
                key={item.market}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xl">{item.flag}</span>
                  <h3 className="text-lg font-semibold text-[var(--sfp-ink)]">{item.market}</h3>
                </div>
                <p className="mb-4 text-sm text-[var(--sfp-slate)]">{item.trend}</p>
                <ul className="space-y-2">
                  {item.links.map((link) => (
                    <li key={link.text}>
                      <Link
                        href={link.href}
                        className="flex items-center justify-between text-sm text-[var(--sfp-navy)] hover:text-[var(--sfp-green)]"
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

      {/* Certifications */}
      <section className="border-b border-gray-200 bg-white py-16">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">
              Key ESG Certifications
            </h2>
            <p className="text-lg text-[var(--sfp-slate)]">
              Third-party validations to watch for
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="rounded-lg border border-gray-200 bg-white p-6 text-center transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-base font-semibold text-[var(--sfp-ink)]">{cert.name}</h3>
                <p className="text-sm text-[var(--sfp-slate)]">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">
              Green Finance FAQs
            </h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <h3 className="mb-3 text-lg font-semibold text-[var(--sfp-ink)]">{faq.q}</h3>
                <p className="text-sm text-[var(--sfp-slate)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-200 bg-white py-16">
        <div className="container mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--sfp-ink)]">
            Start Your Sustainable Investment Journey
          </h2>
          <p className="mb-8 text-lg text-[var(--sfp-slate)]">
            Compare ESG platforms, read expert reviews, and invest in a better future.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild className="bg-[var(--sfp-green)] hover:bg-[var(--sfp-green)]/90">
              <Link href="/us/personal-finance/best-robo-advisors">
                View ESG Platforms <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[var(--sfp-navy)] text-[var(--sfp-navy)] hover:bg-[var(--sfp-navy)] hover:text-white"
            >
              <Link href="/tools">Explore Tools</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

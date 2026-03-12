// components/marketing/homepage-sections.tsx
// Homepage landing page sections — Server Components (no 'use client' needed)

import Link from 'next/link';
import {
  Sparkles,
  Shield,
  TrendingUp,
  DollarSign,
  Building,
  Wallet,
  ArrowRight,
  Search,
  BarChart3,
  CheckCircle,
  Star,
  Globe,
  FileText,
  Zap,
  Eye,
  RefreshCw,
  Users,
  Award,
  BookOpen,
  Calculator,
} from 'lucide-react';
import type { Market, Category } from '@/lib/i18n/config';
import { categoryConfig, marketCategories } from '@/lib/i18n/config';

/* ═══════════════════════════════════════════════════════════════
   ICON MAP — Maps category icon strings to Lucide components
═══════════════════════════════════════════════════════════════ */
const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  Shield,
  TrendingUp,
  DollarSign,
  Building,
  Wallet,
  BarChart: BarChart3,
  PiggyBank: DollarSign,
  Home: Building,
  Coins: DollarSign,
  Calculator,
};

/* ═══════════════════════════════════════════════════════════════
   1. CATEGORY SHOWCASE — 6 categories with icons + report counts
═══════════════════════════════════════════════════════════════ */
interface CategoryShowcaseProps {
  market: Market;
  categoryCounts: Record<string, number>;
}

export function CategoryShowcase({ market, categoryCounts }: CategoryShowcaseProps) {
  const cats = marketCategories[market];
  // Show main 6 categories (first 6)
  const displayCats = cats.slice(0, 6);
  const prefix = market === 'us' ? '' : `/${market}`;

  return (
    <section className="py-12 lg:py-16" style={{ background: 'var(--sfp-gray)' }}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-3"
              style={{ color: 'var(--sfp-navy)' }}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Market Sectors
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
              Expert Research Across{' '}
              <span style={{ color: 'var(--sfp-navy)' }}>{displayCats.length} Sectors</span>
            </h2>
            <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: 'var(--sfp-slate)' }}>
              In-depth reviews, comparisons, and guides — updated monthly by certified analysts.
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {displayCats.map((cat) => {
              const config = categoryConfig[cat];
              const IconComp = iconMap[config.icon] || Sparkles;
              const count = categoryCounts[cat] || 0;

              return (
                <Link
                  key={cat}
                  href={`${prefix}/${cat}`}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 no-underline"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'var(--sfp-sky)' }}
                    >
                      <IconComp className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0">
                      <h3
                        className="text-sm font-bold group-hover:underline"
                        style={{ color: 'var(--sfp-ink)' }}
                      >
                        {config.name}
                      </h3>
                      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                        {config.description}
                      </p>
                      {count > 0 && (
                        <span
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold"
                          style={{ color: 'var(--sfp-navy)' }}
                        >
                          <FileText className="h-3 w-3" />
                          {count} {count === 1 ? 'Report' : 'Reports'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. EDITOR'S PICKS — Top 3 featured reviews
═══════════════════════════════════════════════════════════════ */
interface EditorsPick {
  title: string;
  description: string;
  slug: string;
  category: Category;
  rating?: number;
  reviewCount?: number;
}

interface EditorsPicksProps {
  market: Market;
  picks: EditorsPick[];
}

export function EditorsPicks({ market, picks }: EditorsPicksProps) {
  if (picks.length === 0) return null;

  const prefix = market === 'us' ? '' : `/${market}`;

  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-3"
              style={{ color: 'var(--sfp-gold)' }}
            >
              <Award className="h-3.5 w-3.5" />
              Editor&apos;s Choice
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
              Top-Rated This Month
            </h2>
            <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: 'var(--sfp-slate)' }}>
              Our highest-scoring products based on rigorous testing and expert analysis.
            </p>
          </div>

          {/* Picks Grid */}
          <div className="grid md:grid-cols-3 gap-5">
            {picks.map((pick, i) => {
              const catConfig = categoryConfig[pick.category];

              return (
                <Link
                  key={pick.slug}
                  href={`${prefix}/${pick.category}/${pick.slug}`}
                  className="group relative rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 no-underline"
                >
                  {/* Top gradient accent */}
                  <div
                    className="h-1"
                    style={{
                      background:
                        i === 0
                          ? 'linear-gradient(90deg, var(--sfp-gold), var(--sfp-gold-dark))'
                          : 'linear-gradient(90deg, var(--sfp-navy), #3B82F6)',
                    }}
                  />

                  <div className="p-5">
                    {/* Badge row */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{
                          background: i === 0 ? 'var(--sfp-gold)' : 'var(--sfp-sky)',
                          color: i === 0 ? '#fff' : 'var(--sfp-navy)',
                        }}
                      >
                        {i === 0 ? 'Best Pick' : catConfig?.name || pick.category}
                      </span>

                      {pick.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-current" style={{ color: '#F59E0B' }} />
                          <span className="text-xs font-bold" style={{ color: 'var(--sfp-ink)' }}>
                            {pick.rating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className="text-base font-bold leading-snug group-hover:underline mb-2"
                      style={{ color: 'var(--sfp-ink)' }}
                    >
                      {pick.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-xs leading-relaxed line-clamp-2 mb-4"
                      style={{ color: 'var(--sfp-slate)' }}
                    >
                      {pick.description}
                    </p>

                    {/* CTA */}
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: 'var(--sfp-navy)' }}
                    >
                      Read Full Report
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. METHODOLOGY — "How We Review" 4-step process
═══════════════════════════════════════════════════════════════ */
const methodologySteps = [
  {
    icon: Search,
    title: 'Research',
    description: 'We analyze market data, competitor offerings, and regulatory filings across all 4 markets.',
    accent: 'var(--sfp-navy)',
  },
  {
    icon: Eye,
    title: 'Hands-On Testing',
    description: 'Every product is tested with real accounts — features, fees, support, and UX evaluated first-hand.',
    accent: 'var(--sfp-navy)',
  },
  {
    icon: BarChart3,
    title: 'Score & Compare',
    description: 'Proprietary scoring across 8+ dimensions. Side-by-side comparisons with industry benchmarks.',
    accent: 'var(--sfp-navy)',
  },
  {
    icon: RefreshCw,
    title: 'Monitor & Update',
    description: 'Reviews are re-verified quarterly. Price changes, new features, and regulatory updates tracked live.',
    accent: 'var(--sfp-navy)',
  },
];

export function MethodologySection() {
  return (
    <section className="py-12 lg:py-16" style={{ background: 'var(--sfp-sky)' }}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-3"
              style={{ color: 'var(--sfp-green)' }}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Our Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
              How We Review Financial Products
            </h2>
            <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: 'var(--sfp-slate)' }}>
              A transparent, multi-step methodology trusted by professionals worldwide.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {methodologySteps.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                {/* Step Number */}
                <div
                  className="absolute -top-3 -left-1 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'var(--sfp-navy)' }}
                >
                  {i + 1}
                </div>

                {/* Icon */}
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-xl mb-4"
                  style={{ background: 'var(--sfp-sky)' }}
                >
                  <step.icon className="h-5 w-5" style={{ color: step.accent }} />
                </div>

                {/* Content */}
                <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--sfp-ink)' }}>
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. PLATFORM STATS BAR — Key numbers
═══════════════════════════════════════════════════════════════ */
interface PlatformStatsProps {
  totalReviews: number;
  totalMarkets?: number;
  totalTools?: number;
}

const statsItems = (reviews: number, markets: number, tools: number) => [
  { value: `${reviews}+`, label: 'Expert Reviews', icon: FileText },
  { value: `${markets}`, label: 'Global Markets', icon: Globe },
  { value: `${tools}`, label: 'Interactive Tools', icon: Calculator },
  { value: 'Daily', label: 'Data Updates', icon: RefreshCw },
];

export function PlatformStats({
  totalReviews,
  totalMarkets = 4,
  totalTools = 9,
}: PlatformStatsProps) {
  const items = statsItems(totalReviews, totalMarkets, totalTools);

  return (
    <section className="py-10 bg-white border-y border-gray-200">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div
                className="w-10 h-10 mx-auto mb-3 flex items-center justify-center rounded-xl"
                style={{ background: 'var(--sfp-sky)' }}
              >
                <item.icon className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              </div>
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--sfp-navy)' }}>
                {item.value}
              </div>
              <div className="text-xs font-medium mt-1" style={{ color: 'var(--sfp-slate)' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. HOMEPAGE NEWSLETTER CTA — Prominent section before footer
═══════════════════════════════════════════════════════════════ */
export function HomeNewsletterCTA() {
  return (
    <section className="py-12 lg:py-16" style={{ background: 'var(--sfp-navy)' }}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 border border-white/20" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <BookOpen className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">
              Weekly Intelligence Brief
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Stay Ahead of the Market
          </h2>
          <p className="text-sm text-white/70 max-w-lg mx-auto mb-6">
            Expert analysis, new product alerts, and exclusive insights — delivered every Monday. Join 2,000+ finance professionals.
          </p>

          {/* CTA — links to newsletter page or uses inline form */}
          <Link
            href="/newsletter"
            className="no-underline inline-flex items-center justify-center h-11 px-8 text-sm font-semibold rounded-md shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.03] hover:brightness-110 hover:no-underline"
            style={{ color: '#ffffff', background: 'var(--sfp-gold)', textDecoration: 'none' }}
          >
            Subscribe Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>

          <p className="mt-3 text-[11px] text-white/50">
            No spam. Unsubscribe anytime. Read our Privacy Policy.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. GLOBAL TRUST SECTION — Markets + regulator signals
═══════════════════════════════════════════════════════════════ */
const globalMarkets = [
  { flag: '🇺🇸', name: 'United States', regulators: ['SEC', 'FINRA'], href: '/us' },
  { flag: '🇬🇧', name: 'United Kingdom', regulators: ['FCA'], href: '/uk' },
  { flag: '🇨🇦', name: 'Canada', regulators: ['CIRO', 'CSA'], href: '/ca' },
  { flag: '🇦🇺', name: 'Australia', regulators: ['ASIC'], href: '/au' },
];

export function GlobalTrustSection() {
  return (
    <section className="py-12 lg:py-16" style={{ background: 'var(--sfp-gray)' }}>
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-3"
              style={{ color: 'var(--sfp-navy)' }}
            >
              <Globe className="h-3.5 w-3.5" />
              Global Coverage
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
              Trusted Across 4 Markets
            </h2>
            <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: 'var(--sfp-slate)' }}>
              Localized research with region-specific regulatory compliance and pricing data.
            </p>
          </div>

          {/* Markets Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {globalMarkets.map((m) => (
              <Link
                key={m.name}
                href={m.href}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 no-underline"
              >
                <span className="text-3xl block mb-2">{m.flag}</span>
                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--sfp-ink)' }}>
                  {m.name}
                </h3>
                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                  {m.regulators.map((reg) => (
                    <span
                      key={reg}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                    >
                      {reg}
                    </span>
                  ))}
                </div>
                <span
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--sfp-navy)' }}
                >
                  Explore
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>

          {/* Bottom Trust Signals */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-center">
            {[
              { icon: Shield, text: 'Only Regulated Partners' },
              { icon: Users, text: 'Expert-Reviewed Content' },
              { icon: Zap, text: 'Real-Time Data Updates' },
              { icon: CheckCircle, text: 'Affiliate Disclosure on Every Page' },
            ].map((signal) => (
              <div
                key={signal.text}
                className="flex items-center gap-2 text-xs font-medium"
                style={{ color: 'var(--sfp-slate)' }}
              >
                <signal.icon className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
                {signal.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

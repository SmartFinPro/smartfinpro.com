// components/marketing/homepage-sections.tsx
// Homepage landing page sections — Server Components (no 'use client' needed)

import Link from 'next/link';
import Image from 'next/image';
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
  Clock,
  PiggyBank,
  Coins,
  Plus,
} from 'lucide-react';
import type { Market, Category } from '@/lib/i18n/config';
import { categoryConfig, marketCategories } from '@/lib/i18n/config';
import type { BestXIndexItem } from '@/lib/comparison/loader';

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
  PiggyBank,
  Home: Building,
  Coins,
  Calculator,
  Eye,
  Zap,
  RefreshCw,
};

/* ═══════════════════════════════════════════════════════════════
   1. PLATFORM STATS BAR — Floating card overlapping hero
   Sits ABOVE sectors with negative margin-top (-32px)
═══════════════════════════════════════════════════════════════ */
interface PlatformStatsProps {
  totalReviews: number;
  totalMarkets?: number;
  totalTools?: number;
}

const statsItems = (reviews: number, markets: number, tools: number) => [
  { value: `${reviews}+`, label: 'Expert Reviews' },
  { value: `${markets}`, label: 'Regulated Markets' },
  { value: '6', label: 'Sectors Covered' },
  { value: `${tools}`, label: 'Interactive Tools' },
];

export function PlatformStats({
  totalReviews,
  totalMarkets = 4,
  totalTools = 9,
}: PlatformStatsProps) {
  const items = statsItems(totalReviews, totalMarkets, totalTools);

  return (
    <div
      style={{
        maxWidth: '1140px',
        margin: '-32px auto 0',
        padding: '0 40px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '720px',
          margin: '0 auto',
        }}
        className="stats-card-responsive"
      >
        {items.map((item, i) => (
          <div
            key={item.label}
            style={{
              padding: '20px 32px',
              textAlign: 'center',
              position: 'relative',
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--sfp-navy)',
                lineHeight: 1,
                letterSpacing: '-0.3px',
              }}
            >
              {item.value}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--sfp-slate)',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              {item.label}
            </span>
            {/* Divider line — not on last item */}
            {i < items.length - 1 && (
              <span
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '25%',
                  height: '50%',
                  width: '1px',
                  background: '#E2E8F0',
                }}
                className="hidden sm:block"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. COMPLIANCE BAR — Trust ticker with regulatory signals
═══════════════════════════════════════════════════════════════ */
const complianceItems = [
  { text: 'FCA Regulated', icon: Shield },
  { text: 'ASIC Licensed', icon: Shield },
  { text: 'CIRO Compliant', icon: Shield },
  { text: 'Independent Editorial', icon: CheckCircle },
  { text: 'Updated Monthly', icon: Clock },
];

export function ComplianceBar() {
  return (
    <div
      style={{
        background: 'var(--sfp-sky)',
        borderTop: '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0',
        padding: '22px 40px',
        marginTop: '32px',
      }}
    >
      <div
        style={{
          maxWidth: '1140px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '48px',
          flexWrap: 'wrap',
        }}
      >
        {complianceItems.map((item) => (
          <div
            key={item.text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <item.icon
              style={{ width: '16px', height: '16px', color: 'var(--sfp-navy)', flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--sfp-navy)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. CATEGORY SHOWCASE — 6 sectors in 3-col bordered grid
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   3b. BEST-X COMPARE INDEX — the 10 money pages as a living grid.
   Replaces CategoryShowcase on markets that have Best-X topics; each
   tile shows the engine's current #1 pick + a Compare CTA, with
   coming-soon tiles (no link) that auto-activate as topics ship.
═══════════════════════════════════════════════════════════════ */
interface BestXIndexProps {
  market: Market;
  items: BestXIndexItem[];
}

function fmtMonthYear(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export function BestXIndex({ market, items }: BestXIndexProps) {
  const prefix = market === 'us' ? '' : `/${market}`;
  const sectorCats = marketCategories[market].slice(0, 6);

  return (
    <section style={{ maxWidth: '1140px', margin: '0 auto', padding: '56px 40px 112px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--sfp-slate)', display: 'block', marginBottom: '16px' }}>
          Best-X Comparisons
        </span>
        <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 800, color: 'var(--sfp-ink)', letterSpacing: '-0.6px', marginBottom: '16px', lineHeight: 1.15 }}>
          Compare the best financial products
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--sfp-slate)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
          Side-by-side comparison cockpits for every category — ranked by our methodology, re-verified monthly, never by commission.
        </p>
      </div>

      {/* Seamless photo mosaic — text overlaid on each image, tiles edge-to-edge */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        style={{ gap: 0, borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0' }}
      >
        {items.map((item) => {
          const comingSoon = item.status === 'coming_soon';
          const isLink = !comingSoon && !!item.href;
          const catName = categoryConfig[item.category as Category]?.name ?? item.category;

          const inner = (
            <>
              <Image
                src={item.image}
                alt={item.label}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              />
              {/* No color band — text sits on the full-color photo; a soft dark text-shadow
                  (inherited by all children) keeps it legible without tinting the image. */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: '14px 16px 15px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textShadow:
                    '0 0 4px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.92), 0 2px 16px rgba(0,0,0,0.7)',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    background: comingSoon ? '#5C6B7C' : 'var(--sfp-green)',
                    color: '#fff',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    padding: '4px 9px',
                    borderRadius: '3px',
                    marginBottom: '10px',
                  }}
                >
                  {catName}
                </span>
                <h3
                  className="inline-block transition-colors duration-200 bg-[var(--sfp-navy)] group-hover:bg-[#2F6BC0]"
                  style={{
                    margin: 0,
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    letterSpacing: '-0.1px',
                    padding: '5px 11px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    textShadow: 'none',
                  }}
                >
                  {item.label}
                </h3>

                {item.status === 'live' && item.winner && (
                  <p style={{ margin: '8px 0 0', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    <span style={{ fontWeight: 800 }}>{item.winner.name}</span>
                    {item.winner.metric ? ` · ${item.winner.metric}` : ''}
                  </p>
                )}

                {item.status === 'live' && (
                  <p style={{ margin: '6px 0 0', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock style={{ width: '13px', height: '13px' }} aria-hidden="true" />
                    {fmtMonthYear(item.verifiedAt) ? `Updated ${fmtMonthYear(item.verifiedAt)}` : 'Updated'}
                    {item.count ? ` · ${item.count} compared` : ''}
                  </p>
                )}

                {item.status === 'legacy' && (
                  <p style={{ margin: '10px 0 0', fontSize: '12.5px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Compare providers <ArrowRight style={{ width: '14px', height: '14px' }} aria-hidden="true" />
                  </p>
                )}

                {comingSoon && (
                  <p style={{ margin: '10px 0 0', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock style={{ width: '13px', height: '13px' }} aria-hidden="true" /> Launching soon
                  </p>
                )}
              </div>
            </>
          );

          const tileClass = 'group relative block no-underline overflow-hidden';
          const tileStyle: React.CSSProperties = { aspectRatio: '4 / 3', background: '#0F2E52' };

          const itemKey = `${item.category}/${item.topic}`;
          return isLink ? (
            <Link key={itemKey} href={item.href!} className={tileClass} style={tileStyle}>
              {inner}
            </Link>
          ) : (
            <div key={itemKey} className={tileClass} style={{ ...tileStyle, cursor: 'default' }}>
              {inner}
            </div>
          );
        })}

        {/* Utility fillers — complete the 3-col grid (10 topics + 2 = 12 = 4 even rows) */}
        <Link
          href="#reports"
          className="relative block no-underline overflow-hidden transition-colors duration-200 bg-[var(--sfp-navy)] hover:bg-[var(--sfp-navy-dark)]"
          style={{ aspectRatio: '4 / 3' }}
        >
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', gap: '10px' }}>
            <BookOpen style={{ width: 26, height: 26, color: 'var(--sfp-gold)' }} aria-hidden="true" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Browse all reviews</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>
              Research library <ArrowRight style={{ width: 13, height: 13 }} aria-hidden="true" />
            </span>
          </div>
        </Link>

        <Link
          href="/contact"
          className="relative block no-underline overflow-hidden transition-colors duration-200 bg-[var(--sfp-navy)] hover:bg-[var(--sfp-navy-dark)]"
          style={{ aspectRatio: '4 / 3' }}
        >
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', gap: '10px' }}>
            <Plus style={{ width: 26, height: 26, color: 'var(--sfp-gold)' }} aria-hidden="true" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Suggest a comparison</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>
              Tell us what to test <ArrowRight style={{ width: 13, height: 13 }} aria-hidden="true" />
            </span>
          </div>
        </Link>
      </div>

      {/* Browse by sector — keep the hub internal links */}
      <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: 'var(--sfp-slate)' }}>
        <span style={{ fontWeight: 600 }}>Browse by sector: </span>
        {sectorCats.map((cat, i) => (
          <span key={cat}>
            {i > 0 && <span style={{ opacity: 0.5 }}> · </span>}
            <Link href={`${prefix}/${cat}`} className="no-underline" style={{ color: 'var(--sfp-navy)' }}>
              {categoryConfig[cat].name}
            </Link>
          </span>
        ))}
      </div>
    </section>
  );
}

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
    <section style={{ maxWidth: '1140px', margin: '0 auto', padding: '112px 40px' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--sfp-slate)',
            display: 'block',
            marginBottom: '16px',
          }}
        >
          Research Coverage
        </span>
        <h2
          style={{
            fontSize: 'clamp(26px, 3.2vw, 38px)',
            fontWeight: 800,
            color: 'var(--sfp-ink)',
            letterSpacing: '-0.6px',
            marginBottom: '16px',
            lineHeight: 1.15,
          }}
        >
          Expert Analysis Across {displayCats.length} Sectors
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: 'var(--sfp-slate)',
            maxWidth: '480px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          Methodology-driven reviews updated monthly by certified financial analysts and technology experts.
        </p>
      </div>

      {/* Sectors Grid — 3-col with 1px gap borders */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        style={{
          gap: '1px',
          background: '#E2E8F0',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {displayCats.map((cat) => {
          const config = categoryConfig[cat];
          const IconComp = iconMap[config.icon] || Sparkles;
          const count = categoryCounts[cat] || 0;

          return (
            <Link
              key={cat}
              href={`${prefix}/${cat}`}
              className="no-underline sector-card-hover"
              style={{
                background: '#fff',
                padding: '36px 32px',
                transition: 'all 0.25s ease',
                display: 'block',
              }}
            >
              {/* Icon */}
              <div style={{ width: '40px', height: '40px', marginBottom: '16px', color: 'var(--sfp-navy)' }}>
                <IconComp style={{ width: '24px', height: '24px' }} />
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--sfp-ink)',
                  marginBottom: '8px',
                  letterSpacing: '-0.2px',
                }}
              >
                {config.name}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--sfp-slate)',
                  lineHeight: 1.65,
                  marginBottom: '20px',
                }}
              >
                {config.description}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {count > 0 && (
                  <span
                    className="sector-tag"
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--sfp-slate)',
                      background: 'var(--sfp-gray)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {count}+ Reviews
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. EDITOR'S PICKS — Top 3 featured reviews
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
    <section style={{ background: 'var(--sfp-gray)', padding: '64px 40px' }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        <div>
          {/* Section Header */}
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <span
              className="block"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: 'var(--sfp-slate)',
                marginBottom: '16px',
              }}
            >
              Editor&apos;s Choice
            </span>
            <h2
              style={{
                fontSize: 'clamp(26px, 3.2vw, 38px)',
                fontWeight: 800,
                color: 'var(--sfp-ink)',
                letterSpacing: '-0.6px',
                marginBottom: '16px',
                lineHeight: 1.15,
              }}
            >
              Top-Rated This Month
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--sfp-slate)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              Our highest-scoring products based on rigorous testing and expert analysis.
            </p>
          </div>

          {/* Picks Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {picks.map((pick, i) => {
              const catConfig = categoryConfig[pick.category];

              return (
                <Link
                  key={pick.slug}
                  href={`${prefix}/${pick.category}/${pick.slug}`}
                  className="group relative enterprise-card-hover overflow-hidden no-underline"
                  style={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Top accent — 1px dezent */}
                  <div
                    style={{
                      height: '1px',
                      background: 'var(--sfp-navy)',
                    }}
                  />

                  <div style={{ padding: '24px' }}>
                    {/* Badge row */}
                    <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: i === 0 ? 'var(--sfp-navy)' : 'var(--sfp-gray)',
                          color: i === 0 ? '#fff' : 'var(--sfp-ink)',
                          border: i === 0 ? 'none' : '1px solid #E2E8F0',
                        }}
                      >
                        {i === 0 ? 'Best Pick' : catConfig?.name || pick.category}
                      </span>

                      {pick.rating && (
                        <div className="flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 fill-current" style={{ color: '#F59E0B' }} />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sfp-ink)' }}>
                            {pick.rating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        lineHeight: 1.4,
                        color: 'var(--sfp-ink)',
                        letterSpacing: '-0.2px',
                        marginBottom: '8px',
                      }}
                    >
                      {pick.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="line-clamp-2"
                      style={{
                        fontSize: '13px',
                        fontWeight: 400,
                        lineHeight: 1.65,
                        color: 'var(--sfp-slate)',
                        marginBottom: '20px',
                      }}
                    >
                      {pick.description}
                    </p>

                    {/* CTA */}
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sfp-navy)' }}
                    >
                      Read Full Report
                      <ArrowRight className="h-3 w-3" />
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
   5. METHODOLOGY — "How We Review" 3-step process (3-col grid)
═══════════════════════════════════════════════════════════════ */
const methodologySteps = [
  {
    num: '01',
    title: 'Hands-On Testing',
    description:
      'Every product is tested with real accounts over 2\u20134 weeks. We evaluate UX, pricing, execution speed, and support quality firsthand.',
  },
  {
    num: '02',
    title: 'Regulatory Verification',
    description:
      'We verify FCA, ASIC, CIRO, and SEC registration status directly with regulatory databases. Only compliant products are reviewed.',
  },
  {
    num: '03',
    title: 'Monthly Data Refresh',
    description:
      'Pricing, spreads, fees, and feature sets are re-checked monthly. Reviews are timestamped and versioned for full transparency.',
  },
];

export function MethodologySection() {
  return (
    <section style={{ maxWidth: '1140px', margin: '0 auto', padding: '112px 40px' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--sfp-slate)',
            display: 'block',
            marginBottom: '16px',
          }}
        >
          Our Process
        </span>
        <h2
          style={{
            fontSize: 'clamp(26px, 3.2vw, 38px)',
            fontWeight: 800,
            color: 'var(--sfp-ink)',
            letterSpacing: '-0.6px',
            marginBottom: '16px',
            lineHeight: 1.15,
          }}
        >
          How We Review
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: 'var(--sfp-slate)',
            maxWidth: '480px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          Every product goes through a structured evaluation process before publication.
        </p>
      </div>

      {/* Method Grid — 3 columns, 48px gap */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '48px' }}>
        {methodologySteps.map((step) => (
          <div key={step.num}>
            {/* Number Badge */}
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#fff',
                background: 'var(--sfp-navy)',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              {step.num}
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--sfp-ink)',
                marginBottom: '8px',
                letterSpacing: '-0.2px',
              }}
            >
              {step.title}
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: '14px',
                color: 'var(--sfp-slate)',
                lineHeight: 1.7,
              }}
            >
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. GLOBAL TRUST SECTION — Dark navy-deep bg with market cards
═══════════════════════════════════════════════════════════════ */
const globalMarkets = [
  {
    flag: '🇺🇸',
    region: 'North America',
    name: 'United States',
    description: 'SEC & FTC compliant reviews. Credit cards, brokers, AI tools, and cybersecurity.',
    regLabel: 'FTC Compliant',
    href: '/us',
  },
  {
    flag: '🇬🇧',
    region: 'Europe',
    name: 'United Kingdom',
    description: 'FCA-authorised broker referrals. ISAs, trading platforms, and cybersecurity solutions.',
    regLabel: 'FCA Partners',
    href: '/uk',
  },
  {
    flag: '🇨🇦',
    region: 'North America',
    name: 'Canada',
    description: 'CIRO/CIPF member brokers. TFSA, RRSP, and trading platform comparisons.',
    regLabel: 'CIRO Compliant',
    href: '/ca',
  },
  {
    flag: '🇦🇺',
    region: 'Asia-Pacific',
    name: 'Australia',
    description: 'AFSL-holding partners. Super funds, home loans, and trading platform reviews.',
    regLabel: 'AFSL Licensed',
    href: '/au',
  },
];

export function GlobalTrustSection() {
  return (
    <section
      style={{
        background: '#0F2E52',
        padding: '112px 40px',
        boxShadow: 'inset 0 8px 24px rgba(15, 46, 82, 0.15)',
      }}
    >
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: 'rgba(255,255,255,0.4)',
              display: 'block',
              marginBottom: '16px',
            }}
          >
            Global Coverage
          </span>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.2vw, 38px)',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.6px',
              marginBottom: '16px',
              lineHeight: 1.15,
            }}
          >
            4 Markets. Local Compliance.
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.5)',
              maxWidth: '480px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Region-specific reviews with local regulatory frameworks, currency support, and market-relevant product selection.
          </p>
        </div>

        {/* Markets Grid — 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '20px' }}>
          {globalMarkets.map((m) => (
            <Link
              key={m.name}
              href={m.href}
              className="no-underline market-card-hover"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '36px 28px',
                display: 'block',
                textDecoration: 'none',
              }}
            >
              {/* Flag */}
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '16px' }}>{m.flag}</span>

              {/* Region label */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '8px',
                  display: 'block',
                }}
              >
                {m.region}
              </span>

              {/* Market name */}
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '10px',
                  letterSpacing: '-0.2px',
                }}
              >
                {m.name}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.65,
                  marginBottom: '20px',
                }}
              >
                {m.description}
              </p>

              {/* Regulatory badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6EE7A0',
                  letterSpacing: '0.3px',
                }}
              >
                <Shield style={{ width: '14px', height: '14px' }} />
                {m.regLabel}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

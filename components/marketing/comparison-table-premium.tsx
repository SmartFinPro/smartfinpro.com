// components/marketing/comparison-table-premium.tsx
'use client';

import Link from 'next/link';
import { Star, Award, Shield, ExternalLink, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

/* ── Data Interfaces ────────────────────────────────────────────── */

export interface ComparisonItem {
  name: string;
  slug: string;
  tagline?: string;
  rating: number;
  reviewCount?: number;
  affiliateUrl: string;
  isEditorsChoice?: boolean;
  regions?: string[];
  /** Flexible data columns — keyed by ColumnDef.key */
  data: Record<string, string>;
  /** Expandable verdict section */
  pros?: string[];
  con?: string;
  verdict?: string;
}

export interface ColumnDef {
  /** Key into item.data, e.g. "monthlyFee", "leverage" */
  key: string;
  /** Header label, e.g. "Monthly Fee", "Spreads" */
  label: string;
  /** Small sub-label under value, e.g. "EUR/USD" */
  sublabel?: string;
  /** Grid width fraction, default "1fr" */
  width?: string;
  /** Render value as colored badge pills (comma-separated) */
  isBadgeColumn?: boolean;
}

export interface ComparisonTablePremiumProps {
  items: ComparisonItem[];
  columns: ColumnDef[];
  market?: string;
  title?: string;
  ctaLabel?: string;
  editorChoiceLabel?: string;
  disclaimer?: string;
  expandableVerdict?: boolean;
}

/* ── Badge Color Map ────────────────────────────────────────────── */

const badgeColors: Record<string, string> = {
  // Financial regulators
  'FCA': 'bg-blue-50 text-blue-600 border-blue-200',
  'ASIC': 'bg-sky-50 text-sky-600 border-sky-200',
  'CySEC': 'bg-amber-50 text-amber-600 border-amber-200',
  'BaFin': 'bg-purple-50 text-purple-600 border-purple-200',
  'SEC': 'bg-blue-50 text-blue-600 border-blue-200',
  'FINRA': 'bg-blue-50 text-blue-600 border-blue-200',
  'CFTC': 'bg-blue-50 text-blue-600 border-blue-200',
  'NFA': 'bg-blue-50 text-blue-600 border-blue-200',
  'CIRO': 'bg-red-50 text-red-600 border-red-200',
  'IIROC': 'bg-red-50 text-red-600 border-red-200',
  'CIPF': 'bg-red-50 text-red-600 border-red-200',
  'MAS': 'bg-rose-50 text-rose-600 border-rose-200',
  'FMA': 'bg-teal-50 text-teal-600 border-teal-200',
  'FinCEN': 'bg-blue-50 text-blue-600 border-blue-200',
  'FDIC': 'bg-blue-50 text-blue-600 border-blue-200',
  'FSCS': 'bg-green-50 text-green-600 border-green-200',
  'SIPC': 'bg-blue-50 text-blue-600 border-blue-200',
  // Security & compliance certs
  'SOC 2': 'bg-green-50 text-green-600 border-green-200',
  'SOC 2 Type II': 'bg-green-50 text-green-600 border-green-200',
  'GDPR': 'bg-purple-50 text-purple-600 border-purple-200',
  'HIPAA': 'bg-red-50 text-red-600 border-red-200',
  'ISO 27001': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  'PCI DSS': 'bg-amber-50 text-amber-600 border-amber-200',
  'CCPA': 'bg-violet-50 text-violet-600 border-violet-200',
  // General-purpose
  'E-Money': 'bg-cyan-50 text-cyan-600 border-cyan-200',
  'Banking': 'bg-blue-50 text-blue-600 border-blue-200',
  'Neobank': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  'EMI': 'bg-cyan-50 text-cyan-600 border-cyan-200',
};

/* ── Star Rating ────────────────────────────────────────────────── */

function StarRatingInline({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.floor(value)
              ? 'text-amber-400 fill-amber-400'
              : i < value
              ? 'text-amber-400 fill-amber-400/50'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

/* ── Badge Renderer ─────────────────────────────────────────────── */

function BadgePills({ value }: { value: string }) {
  const badges = value.split(',').map((b) => b.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1">
      {badges.slice(0, 4).map((badge) => (
        <span
          key={badge}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
            badgeColors[badge] || 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

export function ComparisonTablePremium({
  items,
  columns,
  market,
  title = 'Comparison',
  ctaLabel = 'Visit Site',
  editorChoiceLabel = "Best Overall 2026 -- Editor's Choice",
  disclaimer,
  expandableVerdict = true,
}: ComparisonTablePremiumProps) {
  const [expandedMobile, setExpandedMobile] = useState<number | null>(null);
  const [expandedDesktop, setExpandedDesktop] = useState<number | null>(null);

  const filteredItems = market
    ? items.filter((item) => !item.regions || item.regions.includes(market))
    : items;

  // Grid: Name(2fr) + Rating(1fr) + dynamic columns + CTA(1fr)
  // minWidth ensures the table scrolls horizontally instead of being squeezed
  const colCount = columns.length + 3; // name + rating + dynamic + cta
  const gridCols: React.CSSProperties = {
    gridTemplateColumns: `2fr 1fr ${columns.map((c) => c.width || '1fr').join(' ')} 1fr`,
    minWidth: `${Math.max(colCount * 140, 800)}px`,
  };

  return (
    <div className="my-10 not-prose rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Title */}
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>{title}</h3>
        </div>
      )}

      {/* ── Desktop Table ──────────────────────────────────────── */}
      <div className="hidden lg:block overflow-x-auto">
        {/* Header Row */}
        <div
          className="grid gap-0 border-b border-gray-200 relative z-10"
          style={{ ...gridCols, background: 'var(--sfp-sky)' }}
        >
          {['Broker', 'Rating', ...columns.map((c) => c.label), ''].map((h) => (
            <div key={h || 'cta'} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sfp-navy)' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Data Rows */}
        {filteredItems.map((item, index) => (
          <div key={item.slug}>
            {/* Editor's Choice Banner */}
            {item.isEditorsChoice && (
              <div className="border-b border-gray-200 px-4 py-1.5 flex items-center gap-2" style={{ background: 'rgba(245,166,35,0.06)' }}>
                <Award className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sfp-gold)' }}>
                  {editorChoiceLabel}
                </span>
              </div>
            )}

            {/* Row */}
            <div
              className={`group/row grid gap-0 items-center transition-all duration-200 hover:bg-gray-50 cursor-pointer ${
                index % 2 === 0 ? 'bg-white' : ''
              } ${item.isEditorsChoice ? 'border-l-2' : ''}`}
              style={{
                ...gridCols,
                ...(item.isEditorsChoice ? { borderLeftColor: 'var(--sfp-gold)' } : {}),
                ...(index % 2 !== 0 ? { background: 'var(--sfp-gray)' } : {}),
              }}
              onClick={() => expandableVerdict && item.verdict && setExpandedDesktop(expandedDesktop === index ? null : index)}
            >
              {/* Name + Logo */}
              <div className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: 'var(--sfp-navy)' }}
                  >
                    {item.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--sfp-ink)' }}>{item.name}</span>
                      {expandableVerdict && item.verdict && (
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${expandedDesktop === index ? 'rotate-180' : ''}`}
                          style={{ color: 'var(--sfp-slate)' }}
                        />
                      )}
                    </div>
                    {item.tagline && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>{item.tagline}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="px-4 py-4">
                <div className="flex flex-col gap-1">
                  <StarRatingInline value={item.rating} />
                  <span className="text-xs tabular-nums" style={{ color: 'var(--sfp-slate)' }}>
                    {item.rating}/5
                    {item.reviewCount && ` (${item.reviewCount.toLocaleString('en-US')})`}
                  </span>
                </div>
              </div>

              {/* Dynamic Columns */}
              {columns.map((col) => (
                <div key={col.key} className="px-4 py-4">
                  {col.isBadgeColumn ? (
                    <BadgePills value={item.data[col.key] || ''} />
                  ) : (
                    <>
                      <div className="text-sm font-medium tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
                        {item.data[col.key] || '—'}
                      </div>
                      {col.sublabel && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>{col.sublabel}</div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* CTA Button */}
              <div className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                <Button
                  asChild
                  size="sm"
                  className="w-full gap-1.5 text-xs transition-all duration-200 group-hover/row:scale-105 group-hover/row:shadow-md font-normal"
                  style={{ background: item.isEditorsChoice ? 'var(--sfp-gold)' : 'var(--sfp-navy)', color: '#ffffff', borderRadius: '1rem', fontWeight: 400 }}
                >
                  <Link href={item.affiliateUrl} target="_blank" rel="noopener sponsored">
                    {ctaLabel}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Expandable Verdict */}
            {expandableVerdict && expandedDesktop === index && item.verdict && (
              <div className="border-t border-gray-200 px-6 py-5 animate-in slide-in-from-top-2 duration-200" style={{ background: 'var(--sfp-gray)' }}>
                <div className="max-w-3xl">
                  <div className="flex items-start gap-3 mb-4">
                    <Sparkles className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{item.verdict}</p>
                  </div>
                  {item.pros && (
                    <div className="space-y-2 mb-3">
                      {item.pros.map((pro, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-lg px-3 py-2 border" style={{ background: 'rgba(26,107,58,0.04)', borderColor: 'rgba(26,107,58,0.12)' }}>
                          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                          <span className="text-xs leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{pro}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.con && (
                    <div className="flex items-start gap-2.5 rounded-lg px-3 py-2 border border-gray-200" style={{ background: 'white' }}>
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-slate)' }} />
                      <span className="text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{item.con}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Mobile Card Layout ─────────────────────────────────── */}
      <div className="lg:hidden space-y-4 p-4">
        {filteredItems.map((item, index) => {
          // Separate badge columns from regular columns
          const regularCols = columns.filter((c) => !c.isBadgeColumn);
          const badgeCols = columns.filter((c) => c.isBadgeColumn);

          return (
            <div
              key={item.slug}
              className={`rounded-xl border overflow-hidden shadow-sm ${
                item.isEditorsChoice ? 'border-2' : 'border-gray-200'
              }`}
              style={item.isEditorsChoice ? { borderColor: 'var(--sfp-gold)' } : {}}
            >
              {/* Editor's Choice Banner (Mobile) */}
              {item.isEditorsChoice && (
                <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-200" style={{ background: 'rgba(245,166,35,0.06)' }}>
                  <Award className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sfp-gold)' }}>
                    Best Overall 2026
                  </span>
                </div>
              )}

              <div className="p-4 bg-white">
                {/* Name + Rating Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-lg border border-gray-200 flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: 'var(--sfp-navy)' }}
                    >
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>{item.name}</div>
                      {item.tagline && (
                        <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{item.tagline}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <StarRatingInline value={item.rating} />
                    <div className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>{item.rating}/5</div>
                  </div>
                </div>

                {/* Stat Boxes (first 3 regular columns) */}
                {regularCols.length > 0 && (
                  <div className={`grid grid-cols-${Math.min(regularCols.length, 3)} gap-3 mb-4`}>
                    {regularCols.slice(0, 3).map((col) => (
                      <div key={col.key} className="rounded-lg p-2.5 text-center border border-gray-100" style={{ background: 'var(--sfp-gray)' }}>
                        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--sfp-slate)' }}>{col.label}</div>
                        <div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
                          {item.data[col.key] || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Badge Columns */}
                {badgeCols.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Shield className="h-3.5 w-3.5 mr-1" style={{ color: 'var(--sfp-slate)' }} />
                    {badgeCols.map((col) => {
                      const badges = (item.data[col.key] || '').split(',').map((b) => b.trim()).filter(Boolean);
                      return badges.map((badge) => (
                        <span
                          key={badge}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            badgeColors[badge] || 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {badge}
                        </span>
                      ));
                    })}
                  </div>
                )}

                {/* Expandable Verdict (Mobile) */}
                {(item.pros || item.con || item.verdict) && (
                  <button
                    onClick={() => setExpandedMobile(expandedMobile === index ? null : index)}
                    className="flex items-center gap-1 text-xs transition-colors mb-3"
                    style={{ color: 'var(--sfp-navy)' }}
                  >
                    {expandedMobile === index ? (
                      <>Less <ChevronUp className="h-3 w-3" /></>
                    ) : (
                      <>Quick Verdict <ChevronDown className="h-3 w-3" /></>
                    )}
                  </button>
                )}

                {expandedMobile === index && (
                  <div className="mb-4 space-y-2">
                    {item.verdict && (
                      <div className="flex items-start gap-2 text-xs font-medium rounded-lg px-3 py-2 border" style={{ color: 'var(--sfp-ink)', background: 'var(--sfp-sky)', borderColor: 'rgba(27,79,140,0.12)' }}>
                        <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
                        {item.verdict}
                      </div>
                    )}
                    {item.pros?.map((pro, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 border" style={{ color: 'var(--sfp-ink)', background: 'rgba(26,107,58,0.04)', borderColor: 'rgba(26,107,58,0.1)' }}>
                        <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--sfp-green)' }} /> {pro}
                      </div>
                    ))}
                    {item.con && (
                      <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 border border-gray-200" style={{ color: 'var(--sfp-slate)', background: 'var(--sfp-gray)' }}>
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--sfp-slate)' }} /> {item.con}
                      </div>
                    )}
                  </div>
                )}

                {/* CTA Button (Mobile) */}
                <Button
                  asChild
                  className="w-full gap-2 font-normal"
                  style={{ background: item.isEditorsChoice ? 'var(--sfp-gold)' : 'var(--sfp-navy)', color: '#ffffff', borderRadius: '1rem', fontWeight: 400 }}
                >
                  <Link href={item.affiliateUrl} target="_blank" rel="noopener sponsored">
                    {ctaLabel} {item.name}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      {disclaimer && (
        <div className="px-6 py-3 border-t border-gray-200">
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
            {disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

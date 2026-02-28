'use client';
// components/marketing/enterprise-table.tsx
// Premium Enterprise Data Tables — market.us Research Report Style
// Adapted for SmartFinPro's Navy/Gold/Green brand system
//
// Three variants:
//   1. AnalysisTable — Multi-column impact/comparison (4 cols, gradient header)
//   2. ScopeTable    — Key-value pairs (2 cols, report metadata)
//   3. RankingTable  — Ranked items with star ratings + badges
//
// Usage in MDX:
//   <AnalysisTable title="Drivers Impact Analysis" columns={[...]} rows={[...]} />
//   <ScopeTable title="Report Scope" rows={[...]} />
//   <RankingTable title="Top 5 AI Trading Tools" items={[...]} />

import { Star, TrendingUp, TrendingDown, Minus, Award, Crown, Medal } from 'lucide-react';

// ── Shared constants ─────────────────────────────────────────────────────
// Single blue gradient header for ALL enterprise tables (no purple/teal)
// Alternating row backgrounds handled by .enterprise-table CSS class in globals.css
const HEADER_BG = 'var(--sfp-sky)';
const TITLE_COLOR = 'var(--sfp-navy)';

// ═══════════════════════════════════════════════════════════════════════════
// 1. ANALYSIS TABLE — Multi-column enterprise data table
// ═══════════════════════════════════════════════════════════════════════════
//
// MDX Usage:
//   <AnalysisTable
//     title="Key Growth Drivers"
//     columns={["Growth Driver", "Impact on CAGR (~%)", "Geographic Relevance", "Impact Timeline"]}
//     rows={[
//       ["AI-powered trading algorithms", "+2.8%", "North America, Europe", "Immediate to Medium Term"],
//       ["Mobile banking adoption", "+2.3%", "Global", "Short Term"],
//     ]}
//   />

interface AnalysisTableProps {
  title?: string;
  columns: string[];
  rows: string[][];
  variant?: 'positive' | 'negative' | 'neutral' | 'tech';
  caption?: string;
  highlightFirst?: boolean;
}

export function AnalysisTable({
  title,
  columns,
  rows,
  caption,
  highlightFirst = false,
}: AnalysisTableProps) {
  return (
    <div className="my-8 not-prose">
      {/* Title */}
      {title && (
        <h4
          className="text-lg md:text-xl font-bold mb-4"
          style={{ color: TITLE_COLOR }}
        >
          {title}
        </h4>
      )}

      {/* Table Container */}
      <div className="enterprise-table rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Gradient Header */}
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ background: HEADER_BG, color: 'var(--sfp-navy)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Data Rows */}
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`px-5 py-4 border-b border-gray-100 ${
                        cellIndex === 0 && highlightFirst
                          ? 'font-semibold'
                          : ''
                      }`}
                      style={{
                        color: cellIndex === 0 ? 'var(--sfp-ink)' : 'var(--sfp-slate)',
                      }}
                    >
                      {/* Auto-detect impact values and colorize */}
                      {isImpactValue(cell) ? (
                        <ImpactBadge value={cell} />
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-xs mt-2 italic" style={{ color: 'var(--sfp-slate)' }}>
          {caption}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. SCOPE TABLE — Key-value pairs (2-column report metadata)
// ═══════════════════════════════════════════════════════════════════════════
//
// MDX Usage:
//   <ScopeTable
//     title="Report Scope"
//     rows={[
//       { label: "Overall Rating", value: "4.8/5 ★★★★★" },
//       { label: "Best For", value: "Active day traders, swing traders" },
//       { label: "Minimum Deposit", value: "$200 / £200 / A$200" },
//       { label: "Regulation", value: "**FCA** (UK), **ASIC** (AU), **CySEC** (EU)" },
//       { label: "Available Markets", value: "Stocks, ETFs, CFDs, Crypto, Forex" },
//       { label: "Trading Platforms", value: "eToro Web, eToro App, CopyTrader" },
//     ]}
//   />

interface ScopeRow {
  label: string;
  value: string;
  highlight?: boolean;
}

interface ScopeTableProps {
  title?: string;
  rows: ScopeRow[];
  variant?: 'navy' | 'purple' | 'teal';
  caption?: string;
}

export function ScopeTable({
  title = 'Report Scope',
  rows,
  caption,
}: ScopeTableProps) {
  return (
    <div className="my-8 not-prose">
      {/* Title (consistent with AnalysisTable) */}
      {title && (
        <h4
          className="text-lg md:text-xl font-bold mb-4"
          style={{ color: TITLE_COLOR }}
        >
          {title}
        </h4>
      )}

      {/* Table Container */}
      <div className="enterprise-table rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Gradient Header */}
            <thead>
              <tr>
                <th
                  className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider w-[35%] md:w-[30%]"
                  style={{ background: HEADER_BG, color: 'var(--sfp-navy)' }}
                >
                  Feature
                </th>
                <th
                  className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider"
                  style={{ background: HEADER_BG, color: 'var(--sfp-navy)' }}
                >
                  Description
                </th>
              </tr>
            </thead>

            {/* Key-Value Rows */}
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td
                    className="px-5 py-4 border-b border-gray-100 font-semibold align-top"
                    style={{ color: 'var(--sfp-ink)' }}
                  >
                    {row.label}
                  </td>
                  <td
                    className="px-5 py-4 border-b border-gray-100"
                    style={{
                      color: row.highlight ? 'var(--sfp-navy)' : 'var(--sfp-ink)',
                      fontWeight: row.highlight ? 600 : 400,
                    }}
                  >
                    <FormattedValue text={row.value} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-xs mt-2 italic" style={{ color: 'var(--sfp-slate)' }}>
          {caption}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. RANKING TABLE — Items with star ratings, rank badges, verdict
// ═══════════════════════════════════════════════════════════════════════════
//
// MDX Usage:
//   <RankingTable
//     title="Top 5 Trading Platforms 2026"
//     items={[
//       { name: "eToro", rating: 4.8, highlight: "Best Overall", badge: "Editor's Choice", details: "Social trading + CopyTrader" },
//       { name: "Interactive Brokers", rating: 4.7, highlight: "Best for Pros", details: "Lowest commissions globally" },
//       { name: "Capital.com", rating: 4.5, highlight: "Best AI Tools", details: "AI-powered insights + 0% commission CFDs" },
//     ]}
//   />

interface RankingItem {
  name: string;
  rating: number;
  highlight?: string;
  badge?: string;
  details?: string;
  link?: string;
}

interface RankingTableProps {
  title?: string;
  items: RankingItem[];
  showRank?: boolean;
  variant?: 'positive' | 'negative' | 'neutral' | 'tech';
  caption?: string;
}

const rankIcons = [Crown, Award, Medal];

export function RankingTable({
  title,
  items,
  showRank = true,
  caption,
}: RankingTableProps) {
  return (
    <div className="my-8 not-prose">
      {/* Title (consistent with AnalysisTable) */}
      {title && (
        <h4
          className="text-lg md:text-xl font-bold mb-4"
          style={{ color: TITLE_COLOR }}
        >
          {title}
        </h4>
      )}

      {/* Ranking Cards */}
      <div className="enterprise-table rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Header */}
            <thead>
              <tr>
                {showRank && (
                  <th
                    className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider w-16"
                    style={{ background: HEADER_BG, color: 'var(--sfp-navy)' }}
                  >
                    Rank
                  </th>
                )}
                <th
                  className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider"
                  style={{ background: HEADER_BG, color: 'var(--sfp-navy)' }}
                >
                  Name
                </th>
                <th
                  className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider w-32"
                  style={{ background: HEADER_BG, color: 'var(--sfp-navy)' }}
                >
                  Rating
                </th>
                <th
                  className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider"
                  style={{ background: HEADER_BG, color: 'var(--sfp-navy)' }}
                >
                  Highlight
                </th>
                <th
                  className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell"
                  style={{ background: HEADER_BG, color: 'var(--sfp-navy)' }}
                >
                  Details
                </th>
              </tr>
            </thead>

            {/* Ranked Items */}
            <tbody>
              {items.map((item, index) => {
                const RankIcon = rankIcons[index] || null;
                const isTop3 = index < 3;

                return (
                  <tr
                    key={index}
                    style={index === 0 ? { background: 'rgba(245, 166, 35, 0.08)' } : undefined}
                  >
                    {/* Rank */}
                    {showRank && (
                      <td className="px-4 py-4 border-b border-gray-100 text-center">
                        {isTop3 && RankIcon ? (
                          <div className="flex items-center justify-center">
                            <RankIcon
                              className="h-5 w-5"
                              style={{
                                color: index === 0
                                  ? 'var(--sfp-gold)'
                                  : index === 1
                                    ? '#94A3B8'
                                    : '#CD7F32',
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-sm font-bold" style={{ color: 'var(--sfp-slate)' }}>
                            #{index + 1}
                          </span>
                        )}
                      </td>
                    )}

                    {/* Name + Badge */}
                    <td className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                            style={{ background: 'var(--sfp-gold)' }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Star Rating */}
                    <td className="px-5 py-4 border-b border-gray-100 text-center">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className="h-3.5 w-3.5"
                              style={{
                                color: star <= Math.round(item.rating) ? '#F5A623' : '#D1D5DB',
                                fill: star <= Math.round(item.rating) ? '#F5A623' : 'none',
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                          {item.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* Highlight */}
                    <td className="px-5 py-4 border-b border-gray-100">
                      {item.highlight && (
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            background: 'var(--sfp-sky)',
                            color: 'var(--sfp-navy)',
                          }}
                        >
                          {item.highlight}
                        </span>
                      )}
                    </td>

                    {/* Details */}
                    <td
                      className="px-5 py-4 border-b border-gray-100 text-sm hidden md:table-cell"
                      style={{ color: 'var(--sfp-slate)' }}
                    >
                      {item.details || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-xs mt-2 italic" style={{ color: 'var(--sfp-slate)' }}>
          {caption}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/** Detect if a cell value looks like an impact metric (e.g., "+2.8%", "-1.5%") */
function isImpactValue(value: string): boolean {
  return /^[+-]\d+(\.\d+)?%$/.test(value.trim());
}

/** Render impact value with color + icon */
function ImpactBadge({ value }: { value: string }) {
  const isPositive = value.startsWith('+');
  const isNeutral = value === '0%' || value === '0.0%';

  return (
    <span
      className="inline-flex items-center gap-1 font-semibold text-sm"
      style={{
        color: isNeutral
          ? 'var(--sfp-slate)'
          : isPositive
            ? 'var(--sfp-green)'
            : 'var(--sfp-red)',
      }}
    >
      {isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {value}
    </span>
  );
}

/** Parse simple bold syntax (**text**) in scope table values */
function FormattedValue({ text }: { text: string }) {
  // Split on **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

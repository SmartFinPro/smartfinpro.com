// components/marketing/smartfin-card.tsx
// SmartFinPro Premium Product Review Card (Forbes Advisor-inspired)
// Premium enterprise design adapted for SmartFinPro's Navy/Gold/Green brand system
//
// Usage in MDX:
//   <SmartFinCard
//     badge="Best Overall"
//     name="eToro"
//     product="Trading Account"
//     rating={4.8}
//     affiliateUrl="/go/etoro"
//     ctaText="Start Trading"
//     features={[
//       { label: "Trading Fees", value: "£0 commission", detail: "Stocks & ETFs" },
//       { label: "Access", value: "App, Web", detail: "" },
//       { label: "Markets", value: "5,000+ assets", detail: "Stocks, ETFs, Crypto" },
//     ]}
//     whyPicked="eToro leads our list thanks to its social trading features, zero-commission stock trading, and intuitive CopyTrader system that makes it ideal for both beginners and experienced traders."
//     pros={["Zero commission on stocks & ETFs", "CopyTrader social trading", "User-friendly mobile app", "Regulated by FCA, ASIC, CySEC"]}
//     cons={["Withdrawal fee of $5", "Limited research tools for advanced traders", "No ISA wrapper available", "Spreads can be wider than competitors"]}
//   />

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  CheckCircle,
  XCircle,
  ChevronDown,
  ArrowRight,
  Award,
} from 'lucide-react';

interface SmartFinCardFeature {
  label: string;
  value: string;
  detail?: string;
}

interface SmartFinCardProps {
  badge?: string;
  name: string;
  product?: string;
  rating: number;
  affiliateUrl?: string;
  ctaText?: string;
  features?: SmartFinCardFeature[];
  whyPicked?: string;
  pros?: string[];
  cons?: string[];
  complianceNote?: string;
}

export function SmartFinCard({
  badge,
  name,
  product,
  rating,
  affiliateUrl,
  ctaText = 'Visit Site',
  features = [],
  whyPicked,
  pros = [],
  cons = [],
  complianceNote,
}: SmartFinCardProps) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [prosOpen, setProsOpen] = useState(false);

  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.3;

  return (
    <div className="not-prose my-8 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">

      {/* ── Badge Banner ────────────────────────────────────────── */}
      {badge && (
        <div
          className="px-6 py-3"
          style={{ background: 'rgba(26, 107, 58, 0.06)', borderBottom: '1px solid rgba(26, 107, 58, 0.12)' }}
        >
          <span
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--sfp-green)' }}
          >
            <Award className="h-4 w-4" />
            Our Pick: {badge}
          </span>
        </div>
      )}

      {/* ── Header: Name + Logo placeholder ──────────────────────── */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl md:text-2xl font-bold leading-tight" style={{ color: 'var(--sfp-ink)' }}>
              {name}{product ? `: ${product}` : ''}
            </h3>
          </div>
          {/* Logo placeholder — Product initial badge */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 text-white shadow-sm"
            style={{ background: 'var(--sfp-navy)' }}
          >
            {name.charAt(0)}
          </div>
        </div>
      </div>

      {/* ── Rating + Feature Columns ──────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          {/* Rating */}
          <div className="shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {rating.toFixed(1)}
              </span>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-4 w-4"
                      style={{
                        color: s <= fullStars ? 'var(--sfp-gold)' : (s === fullStars + 1 && hasHalf) ? 'var(--sfp-gold)' : '#D1D5DB',
                        fill: s <= fullStars ? 'var(--sfp-gold)' : (s === fullStars + 1 && hasHalf) ? 'url(#half)' : 'none',
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider block mt-0.5"
                  style={{ color: 'var(--sfp-navy)' }}
                >
                  SmartFinPro
                </span>
              </div>
            </div>
          </div>

          {/* Feature Columns */}
          {features.length > 0 && (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:border-l lg:border-gray-200 lg:pl-5">
              {features.map((feat, i) => (
                <div key={i}>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--sfp-slate)' }}>
                    {feat.label}
                  </div>
                  <div className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>
                    {feat.value}
                  </div>
                  {feat.detail && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                      {feat.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CTA Button */}
          {affiliateUrl && (
            <div className="shrink-0 lg:self-center">
              <Link
                href={affiliateUrl}
                target="_blank"
                rel="noopener sponsored"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:brightness-110 no-underline hover:no-underline whitespace-nowrap"
                style={{ background: 'var(--sfp-gold)', color: '#ffffff', textDecoration: 'none' }}
              >
                {ctaText}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {complianceNote && (
                <div className="text-[10px] text-center mt-1.5" style={{ color: 'var(--sfp-slate)' }}>
                  {complianceNote}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── "Why We Picked It" Collapsible ────────────────────────── */}
      {whyPicked && (
        <div className="border-t border-gray-100">
          <button
            type="button"
            onClick={() => setWhyOpen(!whyOpen)}
            className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
          >
            <span className="text-sm font-bold" style={{ color: 'var(--sfp-navy)' }}>
              Why We Picked It
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-200 ${whyOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--sfp-navy)' }}
            />
          </button>
          {whyOpen && (
            <div className="px-6 pb-5">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                {whyPicked}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── "Pros & Cons" Collapsible ─────────────────────────────── */}
      {(pros.length > 0 || cons.length > 0) && (
        <div className="border-t border-gray-100">
          <button
            type="button"
            onClick={() => setProsOpen(!prosOpen)}
            className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
          >
            <span className="text-sm font-bold" style={{ color: 'var(--sfp-navy)' }}>
              Pros & Cons
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-200 ${prosOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--sfp-navy)' }}
            />
          </button>
          {prosOpen && (
            <div className="px-6 pb-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pros */}
                {pros.length > 0 && (
                  <div>
                    <ul className="space-y-2.5">
                      {pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                          <span style={{ color: 'var(--sfp-ink)' }}>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Cons */}
                {cons.length > 0 && (
                  <div>
                    <ul className="space-y-2.5">
                      {cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <XCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-red)' }} />
                          <span style={{ color: 'var(--sfp-ink)' }}>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

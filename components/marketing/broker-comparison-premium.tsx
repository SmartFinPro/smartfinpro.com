'use client';

import Link from 'next/link';
import { Star, Award, Shield, ExternalLink, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface BrokerData {
  name: string;
  slug: string;
  tagline?: string;
  rating: number;
  reviewCount?: number;
  leverage: string;
  leveragePro?: string;
  spreads: string;
  regulation: string[];
  minDeposit: string;
  affiliateUrl: string;
  isEditorsChoice?: boolean;
  instruments?: string;
  platforms?: string;
  regions?: string[];
  pros?: string[];
  con?: string;
  verdict?: string;
}

interface BrokerComparisonTablePremiumProps {
  brokers: BrokerData[];
  market?: string;
  title?: string;
  glass?: boolean;
  stickyHeader?: boolean;
  expandableVerdict?: boolean;
}

// Regulation badge colors
const regColors: Record<string, string> = {
  'FCA': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'ASIC': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'CySEC': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'BaFin': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'SEC': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'FINRA': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'CFTC': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'NFA': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'CIRO': 'bg-red-500/15 text-red-400 border-red-500/30',
  'IIROC': 'bg-red-500/15 text-red-400 border-red-500/30',
  'CIPF': 'bg-red-500/15 text-red-400 border-red-500/30',
  'MAS': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  'FMA': 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  'FinCEN': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
};

const marketDisclaimers: Record<string, string> = {
  us: 'Forex trading involves significant risk of loss. Past performance does not guarantee future results. Affiliate links may earn SmartFinPro a commission.',
  uk: 'CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money. Affiliate links may earn SmartFinPro a commission.',
  ca: 'Forex and CFD trading involves significant risk of loss. Leveraged products can result in losses exceeding your initial deposit. CIRO regulates investment dealers in Canada. Affiliate links may earn SmartFinPro a commission.',
  au: 'CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money. Affiliate links may earn SmartFinPro a commission.',
};

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
              : 'text-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

export function BrokerComparisonTablePremium({
  brokers,
  market,
  title = 'Broker Comparison',
  glass = true,
  stickyHeader = true,
  expandableVerdict = true,
}: BrokerComparisonTablePremiumProps) {
  const [expandedMobile, setExpandedMobile] = useState<number | null>(null);
  const [expandedDesktop, setExpandedDesktop] = useState<number | null>(null);

  // Filter by region if market is specified
  const filteredBrokers = market
    ? brokers.filter((b) => !b.regions || b.regions.includes(market))
    : brokers;

  const disclaimer = market ? (marketDisclaimers[market] || marketDisclaimers.uk) : marketDisclaimers.uk;

  // Inline grid columns — Tailwind arbitrary grid-cols-[...] fails in some builds.
  const gridCols: React.CSSProperties = { gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 0.8fr 1fr' };

  const wrapperClass = glass
    ? 'my-10 not-prose rounded-2xl border border-[rgba(255,255,255,0.12)] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-xl shadow-black/10 isolate [-webkit-mask-image:-webkit-radial-gradient(white,black)] [mask-image:radial-gradient(white,black)]'
    : 'my-10 not-prose';

  return (
    <div className={wrapperClass}>
      {title && (
        <div className={`px-6 py-4 ${glass ? 'border-b border-[rgba(255,255,255,0.06)]' : ''}`}>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block">
        {/* Table Header — no sticky: overflow-hidden on glass wrapper prevents it.
            Solid bg-slate-950 so content never bleeds through. */}
        <div
          className="grid gap-0 bg-slate-950 border-b border-[rgba(255,255,255,0.06)] relative z-10"
          style={gridCols}
        >
          {['Broker', 'Rating', 'Leverage', 'Spreads', 'Regulation', 'Min. Deposit', ''].map((h) => (
            <div key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {h}
            </div>
          ))}
        </div>

        {/* Table Rows */}
        {filteredBrokers.map((broker, index) => (
          <div key={broker.slug}>
            {/* Editor's Choice Banner */}
            {broker.isEditorsChoice && (
              <div className="bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent border-b border-violet-500/20 px-4 py-1.5 flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Best Overall 2026 — Editor&apos;s Choice
                </span>
              </div>
            )}

            <div
              className={`group/row grid gap-0 items-center transition-all duration-200 hover:bg-white/[0.04] cursor-pointer ${
                index % 2 === 0 ? 'bg-slate-950/50' : 'bg-white/[0.01]'
              } ${broker.isEditorsChoice ? 'border-l-2 border-l-emerald-500' : ''}`}
              style={gridCols}
              onClick={() => expandableVerdict && broker.verdict && setExpandedDesktop(expandedDesktop === index ? null : index)}
            >
              {/* Broker Name */}
              <div className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-[rgba(255,255,255,0.12)] flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {broker.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{broker.name}</span>
                      {expandableVerdict && broker.verdict && (
                        <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${expandedDesktop === index ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                    {broker.tagline && (
                      <div className="text-xs text-slate-500 mt-0.5">{broker.tagline}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="px-4 py-4">
                <div className="flex flex-col gap-1">
                  <StarRatingInline value={broker.rating} />
                  <span className="text-xs text-slate-500 tabular-nums">
                    {broker.rating}/5
                    {broker.reviewCount && ` (${broker.reviewCount.toLocaleString('en-US')})`}
                  </span>
                </div>
              </div>

              {/* Leverage */}
              <div className="px-4 py-4">
                <div className="text-sm text-white font-medium tabular-nums">{broker.leverage}</div>
                {broker.leveragePro && (
                  <div className="text-xs text-slate-500 mt-0.5">{broker.leveragePro}</div>
                )}
              </div>

              {/* Spreads */}
              <div className="px-4 py-4">
                <div className="text-sm text-cyan-400 font-medium tabular-nums">{broker.spreads}</div>
                <div className="text-xs text-slate-500 mt-0.5">EUR/USD</div>
              </div>

              {/* Regulation */}
              <div className="px-4 py-4">
                <div className="flex flex-wrap gap-1">
                  {broker.regulation.slice(0, 4).map((reg) => (
                    <span
                      key={reg}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        regColors[reg] || 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {reg}
                    </span>
                  ))}
                </div>
              </div>

              {/* Min Deposit */}
              <div className="px-4 py-4">
                <div className="text-sm text-white font-medium tabular-nums">{broker.minDeposit}</div>
              </div>

              {/* CTA */}
              <div className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                <Button
                  asChild
                  size="sm"
                  className={`w-full gap-1.5 text-xs transition-all duration-200 group-hover/row:scale-105 group-hover/row:shadow-md ${
                    broker.isEditorsChoice
                      ? 'bg-violet-500 hover:bg-violet-600 text-white border-0 shadow-sm shadow-violet-500/25 btn-shimmer group-hover/row:shadow-violet-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 group-hover/row:bg-slate-700 group-hover/row:shadow-slate-900/40'
                  }`}
                >
                  <Link href={broker.affiliateUrl} target="_blank" rel="noopener sponsored">
                    Visit Site
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Expandable Verdict Row (Desktop) */}
            {expandableVerdict && expandedDesktop === index && broker.verdict && (
              <div className="bg-slate-900/40 border-t border-[rgba(255,255,255,0.06)] px-6 py-5 animate-in slide-in-from-top-2 duration-200">
                <div className="max-w-3xl">
                  {/* Verdict */}
                  <div className="flex items-start gap-3 mb-4">
                    <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-200 font-medium leading-relaxed">{broker.verdict}</p>
                  </div>

                  {/* Pros */}
                  {broker.pros && (
                    <div className="space-y-2 mb-3">
                      {broker.pros.map((pro, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-lg px-3 py-2 bg-violet-500/[0.06] border border-violet-500/15">
                          <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-300 leading-relaxed">{pro}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Con */}
                  {broker.con && (
                    <div className="flex items-start gap-2.5 rounded-lg px-3 py-2 bg-slate-800/30 border border-slate-700/50">
                      <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-400 leading-relaxed">{broker.con}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4 p-4">
        {filteredBrokers.map((broker, index) => (
          <div
            key={broker.slug}
            className={`rounded-xl border overflow-hidden shadow-lg shadow-black/20 ${
              broker.isEditorsChoice
                ? 'border-violet-500/40 shadow-violet-500/10'
                : glass
                ? 'border-[rgba(255,255,255,0.12)]'
                : 'border-slate-800'
            }`}
          >
            {/* Editor's Choice Banner */}
            {broker.isEditorsChoice && (
              <div className="bg-gradient-to-r from-violet-500/15 to-transparent px-4 py-2 flex items-center gap-2 border-b border-violet-500/20">
                <Award className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Best Overall 2026
                </span>
              </div>
            )}

            <div className={`p-4 ${glass ? 'bg-white/[0.02]' : 'bg-slate-900/50'}`}>
              {/* Top Row: Name + Rating */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-[rgba(255,255,255,0.12)] flex items-center justify-center text-sm font-bold text-white">
                    {broker.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{broker.name}</div>
                    {broker.tagline && (
                      <div className="text-xs text-slate-500">{broker.tagline}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <StarRatingInline value={broker.rating} />
                  <div className="text-xs text-slate-500 mt-0.5">{broker.rating}/5</div>
                </div>
              </div>

              {/* Key Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className={`${glass ? 'bg-white/[0.03]' : 'bg-slate-800/50'} rounded-lg p-2.5 text-center`}>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Spreads</div>
                  <div className="text-sm text-cyan-400 font-semibold tabular-nums">{broker.spreads}</div>
                </div>
                <div className={`${glass ? 'bg-white/[0.03]' : 'bg-slate-800/50'} rounded-lg p-2.5 text-center`}>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Leverage</div>
                  <div className="text-sm text-white font-semibold tabular-nums">{broker.leverage}</div>
                </div>
                <div className={`${glass ? 'bg-white/[0.03]' : 'bg-slate-800/50'} rounded-lg p-2.5 text-center`}>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Min. Dep.</div>
                  <div className="text-sm text-white font-semibold tabular-nums">{broker.minDeposit}</div>
                </div>
              </div>

              {/* Regulation Badges */}
              <div className="flex flex-wrap gap-1 mb-4">
                <Shield className="h-3.5 w-3.5 text-slate-500 mr-1" />
                {broker.regulation.map((reg) => (
                  <span
                    key={reg}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                      regColors[reg] || 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {reg}
                  </span>
                ))}
              </div>

              {/* Expandable Details */}
              {(broker.pros || broker.con || broker.verdict) && (
                <button
                  onClick={() => setExpandedMobile(expandedMobile === index ? null : index)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors mb-3"
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
                  {broker.verdict && (
                    <div className="flex items-start gap-2 text-xs text-slate-200 font-medium bg-violet-500/5 rounded-lg px-3 py-2 border border-violet-500/10">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      {broker.verdict}
                    </div>
                  )}
                  {broker.pros?.map((pro, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-violet-500/[0.04] rounded-lg px-3 py-2">
                      <CheckCircle className="h-3.5 w-3.5 text-cyan-400 shrink-0" /> {pro}
                    </div>
                  ))}
                  {broker.con && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/30 rounded-lg px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {broker.con}
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <Button
                asChild
                className={`w-full gap-2 ${
                  broker.isEditorsChoice
                    ? 'bg-violet-500 hover:bg-violet-600 text-white border-0 shadow-sm shadow-violet-500/25 btn-shimmer'
                    : glass
                    ? 'bg-white/5 hover:bg-white/10 text-white border border-[rgba(255,255,255,0.12)]'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                <Link href={broker.affiliateUrl} target="_blank" rel="noopener sponsored">
                  Visit {broker.name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className={`px-6 py-3 ${glass ? 'border-t border-[rgba(255,255,255,0.06)]' : ''}`}>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          {disclaimer}
        </p>
      </div>
    </div>
  );
}

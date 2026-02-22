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

const regColors: Record<string, string> = {
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
              : 'text-gray-300'
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

  const filteredBrokers = market
    ? brokers.filter((b) => !b.regions || b.regions.includes(market))
    : brokers;

  const disclaimer = market ? (marketDisclaimers[market] || marketDisclaimers.uk) : marketDisclaimers.uk;

  const gridCols: React.CSSProperties = { gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 0.8fr 1fr' };

  return (
    <div className="my-10 not-prose rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>{title}</h3>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div
          className="grid gap-0 border-b border-gray-200 relative z-10"
          style={{ ...gridCols, background: 'var(--sfp-gray)' }}
        >
          {['Broker', 'Rating', 'Leverage', 'Spreads', 'Regulation', 'Min. Deposit', ''].map((h) => (
            <div key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sfp-slate)' }}>
              {h}
            </div>
          ))}
        </div>

        {filteredBrokers.map((broker, index) => (
          <div key={broker.slug}>
            {broker.isEditorsChoice && (
              <div className="border-b border-gray-200 px-4 py-1.5 flex items-center gap-2" style={{ background: 'rgba(245,166,35,0.06)' }}>
                <Award className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sfp-gold)' }}>
                  Best Overall 2026 -- Editor&apos;s Choice
                </span>
              </div>
            )}

            <div
              className={`group/row grid gap-0 items-center transition-all duration-200 hover:bg-gray-50 cursor-pointer ${
                index % 2 === 0 ? 'bg-white' : ''
              } ${broker.isEditorsChoice ? 'border-l-2' : ''}`}
              style={{ ...gridCols, ...(broker.isEditorsChoice ? { borderLeftColor: 'var(--sfp-gold)' } : {}), ...(index % 2 !== 0 ? { background: 'var(--sfp-gray)' } : {}) }}
              onClick={() => expandableVerdict && broker.verdict && setExpandedDesktop(expandedDesktop === index ? null : index)}
            >
              <div className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'var(--sfp-navy)' }}>
                    {broker.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--sfp-ink)' }}>{broker.name}</span>
                      {expandableVerdict && broker.verdict && (
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedDesktop === index ? 'rotate-180' : ''}`} style={{ color: 'var(--sfp-slate)' }} />
                      )}
                    </div>
                    {broker.tagline && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>{broker.tagline}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="flex flex-col gap-1">
                  <StarRatingInline value={broker.rating} />
                  <span className="text-xs tabular-nums" style={{ color: 'var(--sfp-slate)' }}>
                    {broker.rating}/5
                    {broker.reviewCount && ` (${broker.reviewCount.toLocaleString('en-US')})`}
                  </span>
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="text-sm font-medium tabular-nums" style={{ color: 'var(--sfp-ink)' }}>{broker.leverage}</div>
                {broker.leveragePro && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>{broker.leveragePro}</div>
                )}
              </div>

              <div className="px-4 py-4">
                <div className="text-sm font-medium tabular-nums" style={{ color: 'var(--sfp-navy)' }}>{broker.spreads}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>EUR/USD</div>
              </div>

              <div className="px-4 py-4">
                <div className="flex flex-wrap gap-1">
                  {broker.regulation.slice(0, 4).map((reg) => (
                    <span
                      key={reg}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        regColors[reg] || 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {reg}
                    </span>
                  ))}
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="text-sm font-medium tabular-nums" style={{ color: 'var(--sfp-ink)' }}>{broker.minDeposit}</div>
              </div>

              <div className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                <Button
                  asChild
                  size="sm"
                  className={`w-full gap-1.5 text-xs transition-all duration-200 group-hover/row:scale-105 group-hover/row:shadow-md text-white`}
                  style={{ background: broker.isEditorsChoice ? 'var(--sfp-gold)' : 'var(--sfp-navy)' }}
                >
                  <Link href={broker.affiliateUrl} target="_blank" rel="noopener sponsored">
                    Visit Site
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>

            {expandableVerdict && expandedDesktop === index && broker.verdict && (
              <div className="border-t border-gray-200 px-6 py-5 animate-in slide-in-from-top-2 duration-200" style={{ background: 'var(--sfp-gray)' }}>
                <div className="max-w-3xl">
                  <div className="flex items-start gap-3 mb-4">
                    <Sparkles className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{broker.verdict}</p>
                  </div>

                  {broker.pros && (
                    <div className="space-y-2 mb-3">
                      {broker.pros.map((pro, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-lg px-3 py-2 border" style={{ background: 'rgba(26,107,58,0.04)', borderColor: 'rgba(26,107,58,0.12)' }}>
                          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                          <span className="text-xs leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{pro}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {broker.con && (
                    <div className="flex items-start gap-2.5 rounded-lg px-3 py-2 border border-gray-200" style={{ background: 'white' }}>
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-slate)' }} />
                      <span className="text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{broker.con}</span>
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
            className={`rounded-xl border overflow-hidden shadow-sm ${
              broker.isEditorsChoice
                ? 'border-2'
                : 'border-gray-200'
            }`}
            style={broker.isEditorsChoice ? { borderColor: 'var(--sfp-gold)' } : {}}
          >
            {broker.isEditorsChoice && (
              <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-200" style={{ background: 'rgba(245,166,35,0.06)' }}>
                <Award className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sfp-gold)' }}>
                  Best Overall 2026
                </span>
              </div>
            )}

            <div className="p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg border border-gray-200 flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--sfp-navy)' }}>
                    {broker.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>{broker.name}</div>
                    {broker.tagline && (
                      <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{broker.tagline}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <StarRatingInline value={broker.rating} />
                  <div className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>{broker.rating}/5</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg p-2.5 text-center border border-gray-100" style={{ background: 'var(--sfp-gray)' }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--sfp-slate)' }}>Spreads</div>
                  <div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--sfp-navy)' }}>{broker.spreads}</div>
                </div>
                <div className="rounded-lg p-2.5 text-center border border-gray-100" style={{ background: 'var(--sfp-gray)' }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--sfp-slate)' }}>Leverage</div>
                  <div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--sfp-ink)' }}>{broker.leverage}</div>
                </div>
                <div className="rounded-lg p-2.5 text-center border border-gray-100" style={{ background: 'var(--sfp-gray)' }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--sfp-slate)' }}>Min. Dep.</div>
                  <div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--sfp-ink)' }}>{broker.minDeposit}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                <Shield className="h-3.5 w-3.5 mr-1" style={{ color: 'var(--sfp-slate)' }} />
                {broker.regulation.map((reg) => (
                  <span
                    key={reg}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                      regColors[reg] || 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {reg}
                  </span>
                ))}
              </div>

              {(broker.pros || broker.con || broker.verdict) && (
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
                  {broker.verdict && (
                    <div className="flex items-start gap-2 text-xs font-medium rounded-lg px-3 py-2 border" style={{ color: 'var(--sfp-ink)', background: 'var(--sfp-sky)', borderColor: 'rgba(27,79,140,0.12)' }}>
                      <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
                      {broker.verdict}
                    </div>
                  )}
                  {broker.pros?.map((pro, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 border" style={{ color: 'var(--sfp-ink)', background: 'rgba(26,107,58,0.04)', borderColor: 'rgba(26,107,58,0.1)' }}>
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--sfp-green)' }} /> {pro}
                    </div>
                  ))}
                  {broker.con && (
                    <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 border border-gray-200" style={{ color: 'var(--sfp-slate)', background: 'var(--sfp-gray)' }}>
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--sfp-slate)' }} /> {broker.con}
                    </div>
                  )}
                </div>
              )}

              <Button
                asChild
                className="w-full gap-2 text-white"
                style={{ background: broker.isEditorsChoice ? 'var(--sfp-gold)' : 'var(--sfp-navy)' }}
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
      <div className="px-6 py-3 border-t border-gray-200">
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
          {disclaimer}
        </p>
      </div>
    </div>
  );
}

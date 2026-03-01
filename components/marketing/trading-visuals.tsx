'use client';

import {
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  BarChart3,
  Shield,
  Zap,
  Headphones,
  ShieldCheck,
  ShieldAlert,
  Banknote,
  ArrowLeftRight,
  Timer,
  BanIcon,
  Globe,
  Landmark,
  Scale,
} from 'lucide-react';

// --- Spread Comparison Visual ---

interface SpreadRow {
  pair: string;
  brokers: { name: string; spread: number }[];
}

interface SpreadComparisonProps {
  title?: string;
  data: SpreadRow[];
  glass?: boolean;
}

const brokerColors: Record<string, string> = {
  'Interactive Brokers': 'bg-blue-500',
  eToro: 'bg-blue-600',
  'TD Ameritrade': 'bg-sky-500',
  OANDA: 'bg-amber-500',
  Plus500: 'bg-rose-500',
  'IG Markets': 'bg-red-500',
  'CMC Markets': 'bg-teal-500',
  Questrade: 'bg-blue-500',
};

const brokerDots: Record<string, string> = {
  'Interactive Brokers': 'bg-blue-500',
  eToro: 'bg-blue-600',
  'TD Ameritrade': 'bg-sky-500',
  OANDA: 'bg-amber-500',
  Plus500: 'bg-rose-500',
  'IG Markets': 'bg-red-500',
  'CMC Markets': 'bg-teal-500',
  Questrade: 'bg-blue-500',
};

export function SpreadComparison({ title, data }: SpreadComparisonProps) {
  const maxSpread = Math.max(...data.flatMap((d) => d.brokers.map((b) => b.spread)));

  return (
    <div className="not-prose my-10">
      {title && <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>{title}</h3>}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {data[0]?.brokers.map((b) => (
          <div key={b.name} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${brokerDots[b.name] || 'bg-gray-400'}`} />
            <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{b.name}</span>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {data.map((row) => {
          const bestSpread = Math.min(...row.brokers.map((b) => b.spread));
          return (
            <div key={row.pair} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold mb-4" style={{ color: 'var(--sfp-ink)' }}>{row.pair}</div>
              <div className="space-y-3">
                {row.brokers.map((broker) => {
                  const pct = (broker.spread / maxSpread) * 100;
                  const isBest = broker.spread === bestSpread;
                  return (
                    <div key={broker.name} className="flex items-center gap-3">
                      <div className="w-28 shrink-0 text-xs text-right truncate" style={{ color: 'var(--sfp-slate)' }}>
                        {broker.name}
                      </div>
                      <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full rounded-lg transition-all duration-700 ${
                            brokerColors[broker.name] || 'bg-gray-400'
                          } ${isBest ? 'opacity-100' : 'opacity-40'}`}
                          style={{ width: `${Math.max(pct, 8)}%` }}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                          <span
                            className="text-xs font-bold"
                            style={{ color: isBest ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}
                          >
                            {broker.spread} pips
                          </span>
                        </div>
                      </div>
                      {isBest && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider shrink-0" style={{ color: 'var(--sfp-green)' }}>
                          Best
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] mt-4" style={{ color: 'var(--sfp-slate)' }}>
        Spreads measured during London/NY overlap session. Actual spreads may vary.
      </p>
    </div>
  );
}

// --- Cost Breakdown Grid ---

interface CostItem {
  type: string;
  description: string;
  range: string;
  impact: string;
  icon: string;
}

interface CostBreakdownGridProps {
  title?: string;
  costs: CostItem[];
  glass?: boolean;
}

const costIcons: Record<string, React.ElementType> = {
  spread: ArrowLeftRight, commission: Banknote, swap: Clock, slippage: Zap,
  inactivity: BanIcon, wire: ArrowLeftRight, fx: Globe, monthly: Clock,
  interest: DollarSign, origination: Banknote, network: Shield, endpoint: Zap,
  identity: Globe, email: AlertTriangle, training: BarChart3, encryption: Shield,
  vpn: Globe, password: Shield, time: Clock, quality: TrendingUp,
  security: Shield, roi: DollarSign, subscription: Banknote,
};

const costColors: Record<string, { bg: string; icon: string; border: string }> = {
  spread: { bg: 'bg-rose-50', icon: 'text-rose-500', border: 'border-rose-200' },
  commission: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-200' },
  swap: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' },
  slippage: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-200' },
  inactivity: { bg: 'bg-gray-50', icon: 'text-gray-500', border: 'border-gray-200' },
  wire: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' },
  fx: { bg: 'bg-sky-50', icon: 'text-sky-500', border: 'border-sky-200' },
  monthly: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-200' },
  interest: { bg: 'bg-rose-50', icon: 'text-rose-500', border: 'border-rose-200' },
  origination: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-200' },
  network: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' },
  endpoint: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' },
  identity: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-200' },
  email: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-200' },
  training: { bg: 'bg-teal-50', icon: 'text-teal-500', border: 'border-teal-200' },
  encryption: { bg: 'bg-sky-50', icon: 'text-sky-500', border: 'border-sky-200' },
  vpn: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' },
  password: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-200' },
  time: { bg: 'bg-sky-50', icon: 'text-sky-500', border: 'border-sky-200' },
  quality: { bg: 'bg-sky-50', icon: 'text-sky-500', border: 'border-sky-200' },
  security: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' },
  roi: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' },
  subscription: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-200' },
};

export function CostBreakdownGrid({ title, costs }: CostBreakdownGridProps) {
  return (
    <div className="not-prose my-10">
      {title && <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>{title}</h3>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {costs.map((cost) => {
          const Icon = costIcons[cost.icon] || DollarSign;
          const colors = costColors[cost.icon] || costColors.spread;
          return (
            <div
              key={cost.type}
              className={`rounded-xl border p-5 transition-all bg-white hover:shadow-md ${colors.border}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{cost.type}</h4>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>{cost.description}</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-100">
                <div>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--sfp-slate)' }}>Range</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{cost.range}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--sfp-slate)' }}>Annual Impact</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>{cost.impact}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Scoring Criteria Visual ---

interface ScoringItem {
  name: string;
  weight: number;
  score?: number;
  description: string;
  icon: string;
}

interface ScoringCriteriaProps {
  title?: string;
  criteria: ScoringItem[];
  glass?: boolean;
}

const scoringIcons: Record<string, React.ElementType> = {
  costs: DollarSign, platform: BarChart3, regulation: Shield, execution: Zap,
  support: Headphones, quality: TrendingUp, time: Clock, security: Shield,
  ease: Globe, value: DollarSign, fees: Banknote, international: Globe,
  ux: BarChart3, access: Globe, speed: Timer, flexibility: ArrowLeftRight,
  features: Zap, detection: Shield, compliance: ShieldCheck, performance: Zap,
  rates: DollarSign, accessibility: Globe, experience: TrendingUp,
};

const scoringColors: Record<string, { bar: string; text: string; bg: string }> = {
  costs: { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  platform: { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
  regulation: { bar: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50' },
  execution: { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
  support: { bar: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' },
  quality: { bar: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' },
  time: { bar: 'bg-blue-600', text: 'text-blue-600', bg: 'bg-blue-50' },
  security: { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
  ease: { bar: 'bg-teal-500', text: 'text-teal-600', bg: 'bg-teal-50' },
  value: { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
  fees: { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  international: { bar: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' },
  ux: { bar: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50' },
  access: { bar: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' },
  speed: { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
  flexibility: { bar: 'bg-pink-500', text: 'text-pink-600', bg: 'bg-pink-50' },
  features: { bar: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' },
  detection: { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
  compliance: { bar: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50' },
  performance: { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
  rates: { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
  accessibility: { bar: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' },
  experience: { bar: 'bg-blue-600', text: 'text-blue-600', bg: 'bg-blue-50' },
};

export function ScoringCriteria({ title, criteria }: ScoringCriteriaProps) {
  return (
    <div className="not-prose my-10">
      {title && <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>{title}</h3>}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {criteria.map((item, index) => {
          const Icon = scoringIcons[item.icon] || BarChart3;
          const colors = scoringColors[item.icon] || scoringColors.costs;
          return (
            <div
              key={item.name}
              className={`flex items-center gap-4 px-5 py-4 ${
                index < criteria.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${colors.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{item.name}</h4>
                  <div className="flex items-center gap-2">
                    {item.score != null && (
                      <span className="text-sm font-bold" style={{ color: 'var(--sfp-navy)' }}>{item.score}/5</span>
                    )}
                    <span className={`text-xs font-semibold ${colors.text}`}>({item.weight}%)</span>
                  </div>
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--sfp-slate)' }}>{item.description}</p>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${item.score != null ? (item.score / 5) * 100 : (item.weight / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Regulation Tiers Visual ---

interface Regulator {
  name: string;
  country: string;
  protection: string;
}

interface RegulationTiersProps {
  tier1: Regulator[];
  tier2: Regulator[];
}

export function RegulationTiers({ tier1, tier2 }: RegulationTiersProps) {
  return (
    <div className="not-prose my-10 space-y-8">
      {/* Tier 1 */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
          </div>
          <div>
            <h4 className="text-base font-bold" style={{ color: 'var(--sfp-ink)' }}>Tier 1 -- Strongest Protection</h4>
            <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Highest investor safety standards globally</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tier1.map((reg) => (
            <div
              key={reg.name}
              className="rounded-xl border p-4 transition-all hover:shadow-sm"
              style={{ borderColor: 'rgba(26,107,58,0.15)', background: 'rgba(26,107,58,0.04)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>{reg.name}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3 w-3" style={{ color: 'var(--sfp-slate)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{reg.country}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{reg.protection}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tier 2 */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h4 className="text-base font-bold" style={{ color: 'var(--sfp-ink)' }}>Tier 2 -- Adequate Protection</h4>
            <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Good oversight with some limitations</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tier2.map((reg) => (
            <div
              key={reg.name}
              className="rounded-xl border p-4 transition-all hover:shadow-sm"
              style={{ borderColor: 'rgba(245,166,35,0.15)', background: 'rgba(245,166,35,0.04)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>{reg.name}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3 w-3" style={{ color: 'var(--sfp-slate)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{reg.country}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{reg.protection}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Position Size Guide Visual ---

interface PositionRow {
  account: string;
  risk: string;
  position: string;
}

interface PositionSizeGuideProps {
  title?: string;
  sizes: PositionRow[];
}

export function PositionSizeGuide({ title, sizes }: PositionSizeGuideProps) {
  return (
    <div className="not-prose my-10">
      {title && <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--sfp-ink)' }}>{title}</h3>}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-3 gap-0 border-b border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
          {['Account Size', 'Max Risk (2%)', 'Position Size'].map((h) => (
            <div key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sfp-slate)' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {sizes.map((row, index) => {
          const intensity = Math.min((index + 1) / sizes.length, 1);
          return (
            <div
              key={row.account}
              className={`grid grid-cols-3 gap-0 items-center border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50`}
            >
              <div className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: `rgba(26, 107, 58, ${0.3 + intensity * 0.7})`,
                    }}
                  />
                  <span className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{row.account}</span>
                </div>
              </div>
              <div className="px-5 py-4">
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-gold)' }}>{row.risk}</span>
              </div>
              <div className="px-5 py-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold border" style={{ background: 'rgba(26,107,58,0.06)', color: 'var(--sfp-green)', borderColor: 'rgba(26,107,58,0.2)' }}>
                  {row.position}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Section Divider ---

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: string;
}

const sectionIcons: Record<string, React.ElementType> = {
  costs: DollarSign, methodology: BarChart3, regulation: Shield, risk: AlertTriangle,
  faq: Scale, ai: Zap, banking: Landmark, security: Shield, loans: Banknote,
  features: TrendingUp, comparison: BarChart3, budget: DollarSign, stack: Shield,
  guide: Globe, tools: Zap, compliance: ShieldCheck, speed: Timer,
  transfer: ArrowLeftRight, verdict: TrendingUp, rates: DollarSign, credit: Banknote,
};

const sectionColors: Record<string, { icon: string; bg: string; gradientBg: string }> = {
  costs: { icon: 'text-rose-500', bg: 'bg-rose-50', gradientBg: 'rgba(225,29,72,0.04)' },
  methodology: { icon: 'text-blue-500', bg: 'bg-blue-50', gradientBg: 'rgba(59,130,246,0.04)' },
  regulation: { icon: 'text-emerald-500', bg: 'bg-emerald-50', gradientBg: 'rgba(16,185,129,0.04)' },
  risk: { icon: 'text-amber-500', bg: 'bg-amber-50', gradientBg: 'rgba(245,158,11,0.04)' },
  faq: { icon: 'text-purple-500', bg: 'bg-purple-50', gradientBg: 'rgba(168,85,247,0.04)' },
  ai: { icon: 'text-sky-500', bg: 'bg-sky-50', gradientBg: 'rgba(14,165,233,0.04)' },
  banking: { icon: 'text-emerald-500', bg: 'bg-emerald-50', gradientBg: 'rgba(16,185,129,0.04)' },
  security: { icon: 'text-red-500', bg: 'bg-red-50', gradientBg: 'rgba(239,68,68,0.04)' },
  loans: { icon: 'text-green-500', bg: 'bg-green-50', gradientBg: 'rgba(34,197,94,0.04)' },
  features: { icon: 'text-blue-500', bg: 'bg-blue-50', gradientBg: 'rgba(59,130,246,0.04)' },
  comparison: { icon: 'text-sky-500', bg: 'bg-sky-50', gradientBg: 'rgba(14,165,233,0.04)' },
  budget: { icon: 'text-orange-500', bg: 'bg-orange-50', gradientBg: 'rgba(249,115,22,0.04)' },
  stack: { icon: 'text-purple-500', bg: 'bg-purple-50', gradientBg: 'rgba(168,85,247,0.04)' },
  guide: { icon: 'text-teal-500', bg: 'bg-teal-50', gradientBg: 'rgba(20,184,166,0.04)' },
  tools: { icon: 'text-sky-500', bg: 'bg-sky-50', gradientBg: 'rgba(14,165,233,0.04)' },
  compliance: { icon: 'text-emerald-500', bg: 'bg-emerald-50', gradientBg: 'rgba(16,185,129,0.04)' },
  speed: { icon: 'text-amber-500', bg: 'bg-amber-50', gradientBg: 'rgba(245,158,11,0.04)' },
  transfer: { icon: 'text-blue-500', bg: 'bg-blue-50', gradientBg: 'rgba(59,130,246,0.04)' },
  verdict: { icon: 'text-emerald-500', bg: 'bg-emerald-50', gradientBg: 'rgba(16,185,129,0.04)' },
  rates: { icon: 'text-green-500', bg: 'bg-green-50', gradientBg: 'rgba(34,197,94,0.04)' },
  credit: { icon: 'text-amber-500', bg: 'bg-amber-50', gradientBg: 'rgba(245,158,11,0.04)' },
};

export function SectionHeader({ title, subtitle, icon }: SectionHeaderProps) {
  const Icon = sectionIcons[icon] || BarChart3;
  const colors = sectionColors[icon] || sectionColors.methodology;

  return (
    <div className="not-prose my-12 rounded-2xl border border-gray-200 px-6 py-6 relative overflow-hidden" style={{ background: colors.gradientBg }}>
      <div className="relative flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>{title}</h2>
          {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--sfp-slate)' }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

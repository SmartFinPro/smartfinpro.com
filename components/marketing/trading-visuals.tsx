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

// ─── Spread Comparison Visual ─────────────────────────────────────────

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
  'Interactive Brokers': 'bg-emerald-500',
  eToro: 'bg-blue-500',
  'TD Ameritrade': 'bg-violet-500',
  OANDA: 'bg-amber-500',
  Plus500: 'bg-rose-500',
  'IG Markets': 'bg-red-500',
  'CMC Markets': 'bg-cyan-500',
  Questrade: 'bg-teal-500',
};

const brokerDots: Record<string, string> = {
  'Interactive Brokers': 'bg-emerald-400',
  eToro: 'bg-blue-400',
  'TD Ameritrade': 'bg-violet-400',
  OANDA: 'bg-amber-400',
  Plus500: 'bg-rose-400',
  'IG Markets': 'bg-red-400',
  'CMC Markets': 'bg-cyan-400',
  Questrade: 'bg-teal-400',
};

export function SpreadComparison({ title, data, glass }: SpreadComparisonProps) {
  const maxSpread = Math.max(...data.flatMap((d) => d.brokers.map((b) => b.spread)));

  return (
    <div className="not-prose my-10">
      {title && <h3 className="text-xl font-bold text-white mb-6">{title}</h3>}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {data[0]?.brokers.map((b) => (
          <div key={b.name} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${brokerDots[b.name] || 'bg-slate-400'}`} />
            <span className="text-xs text-slate-400">{b.name}</span>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {data.map((row) => {
          const bestSpread = Math.min(...row.brokers.map((b) => b.spread));
          return (
            <div key={row.pair} className={`rounded-xl border p-5 ${glass ? 'border-white/10 bg-white/[0.03] backdrop-blur-xl' : 'border-slate-800 bg-slate-900/40'}`}>
              <div className="text-sm font-semibold text-white mb-4">{row.pair}</div>
              <div className="space-y-3">
                {row.brokers.map((broker) => {
                  const pct = (broker.spread / maxSpread) * 100;
                  const isBest = broker.spread === bestSpread;
                  return (
                    <div key={broker.name} className="flex items-center gap-3">
                      <div className="w-28 shrink-0 text-xs text-slate-400 text-right truncate">
                        {broker.name}
                      </div>
                      <div className="flex-1 h-7 bg-slate-800/60 rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full rounded-lg transition-all duration-700 ${
                            brokerColors[broker.name] || 'bg-slate-500'
                          } ${isBest ? 'opacity-100' : 'opacity-40'}`}
                          style={{ width: `${Math.max(pct, 8)}%` }}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                          <span
                            className={`text-xs font-bold ${
                              isBest ? 'text-white' : 'text-slate-500'
                            }`}
                          >
                            {broker.spread} pips
                          </span>
                        </div>
                      </div>
                      {isBest && (
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider shrink-0">
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

      <p className="text-[11px] text-slate-600 mt-4">
        Spreads measured during London/NY overlap session. Actual spreads may vary.
      </p>
    </div>
  );
}

// ─── Cost Breakdown Grid ──────────────────────────────────────────────

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
  spread: ArrowLeftRight,
  commission: Banknote,
  swap: Clock,
  slippage: Zap,
  inactivity: BanIcon,
  wire: ArrowLeftRight,
  fx: Globe,
  monthly: Clock,
  interest: DollarSign,
  origination: Banknote,
  network: Shield,
  endpoint: Zap,
  identity: Globe,
  email: AlertTriangle,
  training: BarChart3,
  encryption: Shield,
  vpn: Globe,
  password: Shield,
  time: Clock,
  quality: TrendingUp,
  security: Shield,
  roi: DollarSign,
  subscription: Banknote,
};

const costColors: Record<string, { bg: string; icon: string; border: string }> = {
  spread: { bg: 'bg-rose-500/10', icon: 'text-rose-400', border: 'border-rose-500/20' },
  commission: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20' },
  swap: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
  slippage: { bg: 'bg-violet-500/10', icon: 'text-violet-400', border: 'border-violet-500/20' },
  inactivity: { bg: 'bg-slate-500/10', icon: 'text-slate-400', border: 'border-slate-500/20' },
  wire: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
  fx: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
  monthly: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20' },
  interest: { bg: 'bg-rose-500/10', icon: 'text-rose-400', border: 'border-rose-500/20' },
  origination: { bg: 'bg-orange-500/10', icon: 'text-orange-400', border: 'border-orange-500/20' },
  network: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
  endpoint: { bg: 'bg-red-500/10', icon: 'text-red-400', border: 'border-red-500/20' },
  identity: { bg: 'bg-violet-500/10', icon: 'text-violet-400', border: 'border-violet-500/20' },
  email: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20' },
  training: { bg: 'bg-teal-500/10', icon: 'text-teal-400', border: 'border-teal-500/20' },
  encryption: { bg: 'bg-cyan-500/10', icon: 'text-cyan-400', border: 'border-cyan-500/20' },
  vpn: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400', border: 'border-indigo-500/20' },
  password: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
  time: { bg: 'bg-sky-500/10', icon: 'text-sky-400', border: 'border-sky-500/20' },
  quality: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
  security: { bg: 'bg-red-500/10', icon: 'text-red-400', border: 'border-red-500/20' },
  roi: { bg: 'bg-green-500/10', icon: 'text-green-400', border: 'border-green-500/20' },
  subscription: { bg: 'bg-violet-500/10', icon: 'text-violet-400', border: 'border-violet-500/20' },
};

export function CostBreakdownGrid({ title, costs, glass }: CostBreakdownGridProps) {
  return (
    <div className="not-prose my-10">
      {title && <h3 className="text-xl font-bold text-white mb-6">{title}</h3>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {costs.map((cost) => {
          const Icon = costIcons[cost.icon] || DollarSign;
          const colors = costColors[cost.icon] || costColors.spread;
          return (
            <div
              key={cost.type}
              className={`rounded-xl border p-5 transition-all ${glass ? `${colors.border} bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.05]` : `${colors.border} bg-slate-900/40 hover:bg-slate-900/60`}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{cost.type}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{cost.description}</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-4 pt-3 border-t border-slate-800/50">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Range</div>
                  <div className="text-sm font-semibold text-slate-300">{cost.range}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Annual Impact</div>
                  <div className="text-sm font-bold text-white">{cost.impact}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scoring Criteria Visual ──────────────────────────────────────────

interface ScoringItem {
  name: string;
  weight: number;
  description: string;
  icon: string;
}

interface ScoringCriteriaProps {
  title?: string;
  criteria: ScoringItem[];
  glass?: boolean;
}

const scoringIcons: Record<string, React.ElementType> = {
  costs: DollarSign,
  platform: BarChart3,
  regulation: Shield,
  execution: Zap,
  support: Headphones,
  quality: TrendingUp,
  time: Clock,
  security: Shield,
  ease: Globe,
  value: DollarSign,
  fees: Banknote,
  international: Globe,
  ux: BarChart3,
  access: Globe,
  speed: Timer,
  flexibility: ArrowLeftRight,
  features: Zap,
  detection: Shield,
  compliance: ShieldCheck,
  performance: Zap,
  rates: DollarSign,
  accessibility: Globe,
  experience: TrendingUp,
};

const scoringColors: Record<string, { bar: string; text: string; bg: string }> = {
  costs: { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  platform: { bar: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  regulation: { bar: 'bg-violet-500', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  execution: { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  support: { bar: 'bg-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10' },
  quality: { bar: 'bg-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  time: { bar: 'bg-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  security: { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
  ease: { bar: 'bg-teal-500', text: 'text-teal-400', bg: 'bg-teal-500/10' },
  value: { bar: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
  fees: { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  international: { bar: 'bg-sky-500', text: 'text-sky-400', bg: 'bg-sky-500/10' },
  ux: { bar: 'bg-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  access: { bar: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  speed: { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  flexibility: { bar: 'bg-pink-500', text: 'text-pink-400', bg: 'bg-pink-500/10' },
  features: { bar: 'bg-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  detection: { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
  compliance: { bar: 'bg-violet-500', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  performance: { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  rates: { bar: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
  accessibility: { bar: 'bg-sky-500', text: 'text-sky-400', bg: 'bg-sky-500/10' },
  experience: { bar: 'bg-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
};

export function ScoringCriteria({ title, criteria, glass }: ScoringCriteriaProps) {
  return (
    <div className="not-prose my-10">
      {title && <h3 className="text-xl font-bold text-white mb-6">{title}</h3>}

      <div className={`rounded-xl border overflow-hidden ${glass ? 'border-white/10 bg-white/[0.03] backdrop-blur-xl' : 'border-slate-800 bg-slate-900/40'}`}>
        {criteria.map((item, index) => {
          const Icon = scoringIcons[item.icon] || BarChart3;
          const colors = scoringColors[item.icon] || scoringColors.costs;
          return (
            <div
              key={item.name}
              className={`flex items-center gap-4 px-5 py-4 ${
                index < criteria.length - 1 ? 'border-b border-slate-800/50' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${colors.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                  <span className={`text-sm font-bold ${colors.text}`}>{item.weight}%</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{item.description}</p>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${(item.weight / 30) * 100}%` }}
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

// ─── Regulation Tiers Visual ──────────────────────────────────────────

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
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Tier 1 — Strongest Protection</h4>
            <p className="text-xs text-slate-500">Highest investor safety standards globally</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tier1.map((reg) => (
            <div
              key={reg.name}
              className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 transition-all hover:border-emerald-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">{reg.name}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-400">{reg.country}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{reg.protection}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tier 2 */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Tier 2 — Adequate Protection</h4>
            <p className="text-xs text-slate-500">Good oversight with some limitations</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tier2.map((reg) => (
            <div
              key={reg.name}
              className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 transition-all hover:border-amber-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold text-white">{reg.name}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-400">{reg.country}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{reg.protection}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Position Size Guide Visual ───────────────────────────────────────

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
      {title && <h3 className="text-xl font-bold text-white mb-6">{title}</h3>}

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 gap-0 bg-slate-900/80 border-b border-slate-800">
          {['Account Size', 'Max Risk (2%)', 'Position Size'].map((h) => (
            <div key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {sizes.map((row, index) => {
          // Color intensity increases with account size
          const intensity = Math.min((index + 1) / sizes.length, 1);
          const bgOpacity = Math.round(intensity * 15);
          return (
            <div
              key={row.account}
              className={`grid grid-cols-3 gap-0 items-center border-b border-slate-800/50 last:border-0 transition-colors hover:bg-slate-800/20`}
            >
              <div className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: `rgba(52, 211, 153, ${0.3 + intensity * 0.7})`,
                    }}
                  />
                  <span className="text-sm font-semibold text-white">{row.account}</span>
                </div>
              </div>
              <div className="px-5 py-4">
                <span className="text-sm text-amber-400 font-medium">{row.risk}</span>
              </div>
              <div className="px-5 py-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-sm font-semibold border border-emerald-500/20">
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

// ─── Section Divider ──────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: string;
}

const sectionIcons: Record<string, React.ElementType> = {
  costs: DollarSign,
  methodology: BarChart3,
  regulation: Shield,
  risk: AlertTriangle,
  faq: Scale,
  ai: Zap,
  banking: Landmark,
  security: Shield,
  loans: Banknote,
  features: TrendingUp,
  comparison: BarChart3,
  budget: DollarSign,
  stack: Shield,
  guide: Globe,
  tools: Zap,
  compliance: ShieldCheck,
  speed: Timer,
  transfer: ArrowLeftRight,
  verdict: TrendingUp,
  rates: DollarSign,
  credit: Banknote,
};

const sectionColors: Record<string, { icon: string; bg: string; gradient: string }> = {
  costs: { icon: 'text-rose-400', bg: 'bg-rose-500/10', gradient: 'from-rose-500/10 to-transparent' },
  methodology: { icon: 'text-blue-400', bg: 'bg-blue-500/10', gradient: 'from-blue-500/10 to-transparent' },
  regulation: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', gradient: 'from-emerald-500/10 to-transparent' },
  risk: { icon: 'text-amber-400', bg: 'bg-amber-500/10', gradient: 'from-amber-500/10 to-transparent' },
  faq: { icon: 'text-violet-400', bg: 'bg-violet-500/10', gradient: 'from-violet-500/10 to-transparent' },
  ai: { icon: 'text-cyan-400', bg: 'bg-cyan-500/10', gradient: 'from-cyan-500/10 to-transparent' },
  banking: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', gradient: 'from-emerald-500/10 to-transparent' },
  security: { icon: 'text-red-400', bg: 'bg-red-500/10', gradient: 'from-red-500/10 to-transparent' },
  loans: { icon: 'text-green-400', bg: 'bg-green-500/10', gradient: 'from-green-500/10 to-transparent' },
  features: { icon: 'text-indigo-400', bg: 'bg-indigo-500/10', gradient: 'from-indigo-500/10 to-transparent' },
  comparison: { icon: 'text-sky-400', bg: 'bg-sky-500/10', gradient: 'from-sky-500/10 to-transparent' },
  budget: { icon: 'text-orange-400', bg: 'bg-orange-500/10', gradient: 'from-orange-500/10 to-transparent' },
  stack: { icon: 'text-purple-400', bg: 'bg-purple-500/10', gradient: 'from-purple-500/10 to-transparent' },
  guide: { icon: 'text-teal-400', bg: 'bg-teal-500/10', gradient: 'from-teal-500/10 to-transparent' },
  tools: { icon: 'text-cyan-400', bg: 'bg-cyan-500/10', gradient: 'from-cyan-500/10 to-transparent' },
  compliance: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', gradient: 'from-emerald-500/10 to-transparent' },
  speed: { icon: 'text-amber-400', bg: 'bg-amber-500/10', gradient: 'from-amber-500/10 to-transparent' },
  transfer: { icon: 'text-blue-400', bg: 'bg-blue-500/10', gradient: 'from-blue-500/10 to-transparent' },
  verdict: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', gradient: 'from-emerald-500/10 to-transparent' },
  rates: { icon: 'text-green-400', bg: 'bg-green-500/10', gradient: 'from-green-500/10 to-transparent' },
  credit: { icon: 'text-amber-400', bg: 'bg-amber-500/10', gradient: 'from-amber-500/10 to-transparent' },
};

export function SectionHeader({ title, subtitle, icon }: SectionHeaderProps) {
  const Icon = sectionIcons[icon] || BarChart3;
  const colors = sectionColors[icon] || sectionColors.methodology;

  return (
    <div className={`not-prose my-12 rounded-2xl bg-gradient-to-r ${colors.gradient} border border-slate-800/50 px-6 py-6 relative overflow-hidden`}>
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[0.02]" />
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/[0.01]" />

      <div className="relative flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

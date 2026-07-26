'use client';

// components/marketing/trust-blocks.tsx
// TrustAuthority + MethodologyBox — split out of components/marketing/expert-box.tsx
// (Task 5a, editorial integrity remediation). Both components are personen-frei
// and stay under change-freeze per memory/design-system-locked.md: this move is
// byte-identical, no redesign. See docs/superpowers/plans/2026-07-17-editorial-integrity-remediation.md.

import {
  Shield,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  CheckCircle,
  FileText,
  MessageSquare,
  Building,
  AlertTriangle,
  Star,
  Plane,
  CreditCard,
  Calculator,
  Beaker,
} from 'lucide-react';

// Trust Authority Section
// Icon string-ID map — allows MDX files to use simple strings instead of JSX
const trustIconMap: Record<string, React.ElementType> = {
  shield: Shield,
  'trending-up': TrendingUp,
  trendingUp: TrendingUp,
  clock: Clock,
  'dollar-sign': DollarSign,
  dollarSign: DollarSign,
  users: Users,
  'bar-chart': BarChart3,
  barChart3: BarChart3,
  'check-circle': CheckCircle,
  checkCircle: CheckCircle,
  'file-text': FileText,
  fileText: FileText,
  'message-square': MessageSquare,
  messageSquare: MessageSquare,
  building: Building,
  'alert-triangle': AlertTriangle,
  alertTriangle: AlertTriangle,
  star: Star,
  plane: Plane,
  'credit-card': CreditCard,
  creditCard: CreditCard,
  calculator: Calculator,
  beaker: Beaker,
};

// Smart auto-icon detection from stat label keywords
function autoDetectIcon(label: string): React.ElementType | null {
  const l = label.toLowerCase();
  if (l.includes('customer') || l.includes('user') || l.includes('client') || l.includes('member')) return Users;
  if (l.includes('award') || l.includes('rating') || l.includes('score') || l.includes('finder')) return Star;
  if (l.includes('currenc') || l.includes('fx') || l.includes('exchange')) return CreditCard;
  if (l.includes('countr') || l.includes('global') || l.includes('international') || l.includes('market') || l.includes('region')) return Plane;
  if (l.includes('year') || l.includes('experience') || l.includes('since') || l.includes('established')) return Clock;
  if (l.includes('transaction') || l.includes('transfer') || l.includes('payment') || l.includes('volume')) return TrendingUp;
  if (l.includes('fee') || l.includes('cost') || l.includes('price') || l.includes('saving')) return DollarSign;
  if (l.includes('securit') || l.includes('regulat') || l.includes('complian') || l.includes('protect') || l.includes('licen')) return Shield;
  if (l.includes('business') || l.includes('compan') || l.includes('enterprise')) return Building;
  if (l.includes('support') || l.includes('service') || l.includes('help')) return MessageSquare;
  if (l.includes('report') || l.includes('document') || l.includes('file')) return FileText;
  if (l.includes('data') || l.includes('analytic') || l.includes('metric')) return BarChart3;
  return null;
}

// Per-stat color theme for visual variety
function getStatTheme(label: string): { bg: string; color: string } {
  const l = label.toLowerCase();
  if (l.includes('customer') || l.includes('user') || l.includes('client'))
    return { bg: 'var(--sfp-sky)', color: 'var(--sfp-navy)' };
  if (l.includes('award') || l.includes('rating') || l.includes('score') || l.includes('finder'))
    return { bg: 'rgba(245,166,35,0.1)', color: 'var(--sfp-gold-dark)' };
  if (l.includes('currenc') || l.includes('fx'))
    return { bg: 'rgba(26,107,58,0.08)', color: 'var(--sfp-green)' };
  if (l.includes('countr') || l.includes('global') || l.includes('international'))
    return { bg: 'rgba(27,79,140,0.06)', color: 'var(--sfp-navy)' };
  return { bg: 'var(--sfp-sky)', color: 'var(--sfp-navy)' };
}

interface TrustAuthorityProps {
  stats: {
    label: string;
    value: string;
    /** String icon ID (e.g. "shield") OR legacy JSX ReactNode */
    icon?: string | React.ReactNode;
  }[];
  /** Header title (default: "Verified Platform Data") */
  title?: string;
  /** Source attribution shown in header (e.g. "AUSTRAC · Finder.com.au") */
  source?: string;
}

export function TrustAuthority({ stats, title, source }: TrustAuthorityProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm my-10 overflow-hidden">
      {/* Gradient accent bar */}
      <div
        className="h-1"
        style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}
      />

      <div className="flex flex-col lg:flex-row">
        {/* Left panel: Title & Source */}
        <div
          className="shrink-0 px-6 py-5 lg:px-8 lg:py-0 flex flex-col justify-center lg:w-[260px] border-b lg:border-b-0 lg:border-r border-gray-100"
          style={{ background: 'var(--sfp-sky)' }}
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(26,107,58,0.1)' }}
            >
              <Shield className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
            </div>
            <span
              className="text-sm font-bold uppercase tracking-wider leading-tight"
              style={{ color: 'var(--sfp-navy)' }}
            >
              {title || 'Verified Platform Data'}
            </span>
          </div>
          {source && (
            <p className="text-[11px] lg:pl-[38px]" style={{ color: 'var(--sfp-slate)' }}>
              Source: {source}
            </p>
          )}
        </div>

        {/* Right panel: Stats in one row — gap-px creates implicit 1px dividers */}
        <div
          className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ backgroundColor: '#E5E7EB' }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white flex flex-col items-center justify-center py-4 px-3">
              <div
                className="font-bold whitespace-nowrap"
                style={{ color: 'var(--sfp-slate)', fontSize: '14px', lineHeight: '1.3', fontVariantNumeric: 'tabular-nums' }}
              >
                {stat.value}
              </div>
              <div
                className="whitespace-nowrap text-center"
                style={{ color: 'var(--sfp-slate)', fontSize: '12px', lineHeight: '1.4', marginTop: '3px' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Methodology Box for transparency
interface MethodologyBoxProps {
  title?: string;
  steps: string[];
  dataPoints?: number;
  hoursResearch?: number;
  testingPeriod?: string;
  lastVerified?: string;
}

export function MethodologyBox({
  title = 'How We Test & Review',
  steps = [],
  dataPoints,
  hoursResearch,
  testingPeriod,
  lastVerified,
}: MethodologyBoxProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm my-10 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
          <Shield className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
        </div>
        <h4 className="font-bold text-xl" style={{ color: 'var(--sfp-ink)' }}>{title}</h4>
      </div>

      {(hoursResearch !== undefined || dataPoints !== undefined || testingPeriod || lastVerified) && (
      <div className="grid grid-cols-2 gap-4 mb-8">
        {hoursResearch !== undefined && (
          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
            <div className="text-3xl font-bold" style={{ color: 'var(--sfp-navy)' }}>{hoursResearch}+</div>
            <div className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Hours of Research</div>
          </div>
        )}
        {dataPoints !== undefined && (
          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
            <div className="text-3xl font-bold" style={{ color: 'var(--sfp-navy)' }}>{dataPoints.toLocaleString('en-US')}+</div>
            <div className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Data Points Analyzed</div>
          </div>
        )}
        {testingPeriod && (
          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
            <Clock className="h-6 w-6 shrink-0" style={{ color: 'var(--sfp-navy)' }} />
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--sfp-navy)' }}>{testingPeriod}</div>
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Testing Period</div>
            </div>
          </div>
        )}
        {lastVerified && (
          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
            <CheckCircle className="h-6 w-6 shrink-0" style={{ color: 'var(--sfp-green)' }} />
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--sfp-navy)' }}>{lastVerified}</div>
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Last Verified</div>
            </div>
          </div>
        )}
      </div>
      )}

      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-4">
            <span className="shrink-0 w-8 h-8 rounded-lg text-white flex items-center justify-center text-sm font-bold shadow-lg" style={{ background: 'var(--sfp-navy)' }}>
              {index + 1}
            </span>
            <span className="pt-1" style={{ color: 'var(--sfp-ink)' }}>{step}</span>
          </li>
        ))}
        </ol>
      </div>
  );
}

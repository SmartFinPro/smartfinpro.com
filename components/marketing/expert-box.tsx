'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote, Award, CheckCircle, Shield, Star, TrendingUp, Clock, DollarSign, BarChart3, Users, FileText, MessageSquare, Building, AlertTriangle, Plane, CreditCard, Calculator, Beaker, ExternalLink } from 'lucide-react';

interface ExpertBoxProps {
  name?: string;
  title: string;
  credentials?: string[];
  image?: string;
  profileUrl?: string;
  quote?: string;
  rating?: number;
  variant?: 'default' | 'highlight' | 'minimal';
  children?: React.ReactNode;
}

export function ExpertBox({
  name,
  title,
  credentials,
  image,
  profileUrl,
  quote,
  rating,
  variant = 'default',
  children,
}: ExpertBoxProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm my-10 overflow-hidden">
      {/* Gradient accent bar */}
      <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

      <div className="flex flex-col lg:flex-row">
        {/* Left panel: Expert identity */}
        <div
          className="shrink-0 px-6 py-5 lg:px-8 lg:py-6 flex flex-col justify-center lg:w-[260px] border-b lg:border-b-0 lg:border-r border-gray-100"
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
              Verified Expert
            </span>
          </div>
          {name && (
            <p style={{ color: 'var(--sfp-slate)', fontSize: '11px' }} className="lg:pl-[38px]">
              {name}
            </p>
          )}
        </div>

        {/* Right panel: Expert details + quote */}
        <div className="flex-1 px-6 py-5 lg:px-8 lg:py-6">
          {/* Name, title, credentials */}
          <div className="flex items-start gap-4">
            {image ? (
              <Image
                src={image}
                alt={name || title}
                width={48}
                height={48}
                className="rounded-full border-2 shrink-0"
                style={{ borderColor: 'var(--sfp-navy)' }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center border border-gray-200 shrink-0" style={{ background: 'var(--sfp-sky)' }}>
                <Award className="h-6 w-6" style={{ color: 'var(--sfp-navy)' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {name && (
                  profileUrl ? (
                    <a
                      href={profileUrl}
                      {...(profileUrl.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="font-bold inline-flex items-center gap-1 hover:underline"
                      style={{ color: 'var(--sfp-ink)', fontSize: '14px' }}
                    >
                      {name}
                      {profileUrl.startsWith('http') && <ExternalLink className="h-3 w-3" style={{ color: 'var(--sfp-navy)' }} />}
                    </a>
                  ) : (
                    <span className="font-bold" style={{ color: 'var(--sfp-ink)', fontSize: '14px' }}>{name}</span>
                  )
                )}
              </div>
              <p style={{ color: 'var(--sfp-slate)', fontSize: '12px', marginTop: '2px' }}>{title}</p>
              {credentials && credentials.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {credentials.map((cred) => (
                    <span
                      key={cred}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200"
                      style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-ink)', fontSize: '11px' }}
                    >
                      <CheckCircle className="h-3 w-3" style={{ color: 'var(--sfp-green)' }} />
                      {cred}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quote or Children content */}
          {(quote || children) && (
            <div className="mt-4 pl-4 border-l-2" style={{ borderColor: 'var(--sfp-navy)' }}>
              {quote ? (
                <p className="italic" style={{ color: 'var(--sfp-ink)', fontSize: '13px', lineHeight: '1.5' }}>&ldquo;{quote}&rdquo;</p>
              ) : (
                <div style={{ color: 'var(--sfp-ink)', fontSize: '13px', lineHeight: '1.5' }}>{children}</div>
              )}
              {rating && (
                <div className="flex items-center gap-2 mt-3">
                  <span style={{ color: 'var(--sfp-slate)', fontSize: '12px' }}>Expert Rating:</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="font-bold ml-1.5" style={{ color: 'var(--sfp-navy)', fontSize: '14px' }}>{rating}/5</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact expert endorsement for inline use
interface ExpertEndorsementProps {
  name: string;
  title: string;
  verdict: string;
  rating: number;
}

export function ExpertEndorsement({ name, title, verdict, rating }: ExpertEndorsementProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex items-center gap-4 p-5 my-6 hover:shadow-md transition-all">
      <div className="shrink-0">
        <div className="w-12 h-12 rounded-full flex items-center justify-center border border-gray-200" style={{ background: 'var(--sfp-sky)' }}>
          <CheckCircle className="h-6 w-6" style={{ color: 'var(--sfp-green)' }} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold" style={{ color: 'var(--sfp-ink)' }}>
          {name} <span style={{ color: 'var(--sfp-slate)' }} className="font-normal">({title})</span>
        </p>
        <p className="text-sm italic font-serif mt-1" style={{ color: 'var(--sfp-slate)' }}>&ldquo;{verdict}&rdquo;</p>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-2xl font-bold" style={{ color: 'var(--sfp-navy)' }}>{rating}/5</div>
        <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Expert Score</div>
      </div>
    </div>
  );
}

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
  steps,
  dataPoints = 50,
  hoursResearch = 100,
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

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
          <div className="text-3xl font-bold" style={{ color: 'var(--sfp-navy)' }}>{hoursResearch}+</div>
          <div className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Hours of Research</div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
          <div className="text-3xl font-bold" style={{ color: 'var(--sfp-navy)' }}>{dataPoints.toLocaleString('en-US')}+</div>
          <div className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Data Points Analyzed</div>
        </div>
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

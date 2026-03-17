'use client';

import { Award, Users, TrendingUp, Shield, Zap, BarChart3, DollarSign, Target, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface QuickSummaryFact {
  icon?: string;
  label: string;
  value: string;
  detail?: string;
  href?: string;
}

interface QuickSummaryProps {
  facts: QuickSummaryFact[];
  lastUpdated?: string;
  testingNote?: string;
}

const iconMap: Record<string, React.ElementType> = {
  award: Award,
  users: Users,
  trending: TrendingUp,
  shield: Shield,
  zap: Zap,
  chart: BarChart3,
  dollar: DollarSign,
  target: Target,
  clock: Clock,
  check: CheckCircle,
};

const factColors = [
  { bg: 'rgba(27,79,140,0.08)', border: 'rgba(27,79,140,0.15)', iconColor: 'var(--sfp-navy)', accent: 'var(--sfp-navy)' },
  { bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.15)', iconColor: 'var(--sfp-gold)', accent: 'var(--sfp-gold)' },
  { bg: 'rgba(26,107,58,0.08)', border: 'rgba(26,107,58,0.15)', iconColor: 'var(--sfp-green)', accent: 'var(--sfp-green)' },
];

export function QuickSummary({ facts, lastUpdated, testingNote }: QuickSummaryProps) {
  return (
    <div className="not-prose my-8 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
              <Zap className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>Quick Summary</h3>
              <p className="text-[11px]" style={{ color: 'var(--sfp-slate)' }}>Our top picks at a glance</p>
            </div>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--sfp-slate)' }}>
              <Clock className="h-3 w-3" />
              Updated {lastUpdated}
            </div>
          )}
        </div>
      </div>

      {/* Facts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {facts.slice(0, 3).map((fact, i) => {
          const color = factColors[i % factColors.length];
          const IconComponent = iconMap[fact.icon || 'award'] || Award;

          return (
            <div key={i} className="px-6 py-5 group hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0" style={{ background: color.bg, borderColor: color.border }}>
                  <IconComponent className="h-5 w-5" style={{ color: color.iconColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider font-medium mb-1" style={{ color: 'var(--sfp-slate)' }}>{fact.label}</p>
                  <p className="text-base font-bold leading-tight" style={{ color: 'var(--sfp-ink)' }}>{fact.value}</p>
                  {fact.detail && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{fact.detail}</p>
                  )}
                  {fact.href && (
                    <Link
                      href={fact.href}
                      target="_blank"
                      rel="noopener sponsored"
                      className="inline-flex items-center gap-1 text-xs font-medium hover:underline mt-2"
                      style={{ color: color.accent }}
                    >
                      Visit Site <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {testingNote && (
        <div className="px-6 py-3 border-t border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--sfp-slate)' }}>
            <CheckCircle className="h-3 w-3" style={{ color: 'var(--sfp-green)' }} />
            {testingNote}
          </div>
        </div>
      )}
    </div>
  );
}

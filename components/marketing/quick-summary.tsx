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
  { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: 'text-cyan-400', accent: 'text-cyan-400' },
  { bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: 'text-violet-400', accent: 'text-violet-400' },
  { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', accent: 'text-amber-400' },
];

export function QuickSummary({ facts, lastUpdated, testingNote }: QuickSummaryProps) {
  return (
    <div className="not-prose my-8 rounded-2xl border border-slate-800/60 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Quick Summary</h3>
              <p className="text-[11px] text-slate-500">Our top picks at a glance</p>
            </div>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Clock className="h-3 w-3" />
              Updated {lastUpdated}
            </div>
          )}
        </div>
      </div>

      {/* Facts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800/40">
        {facts.slice(0, 3).map((fact, i) => {
          const color = factColors[i % factColors.length];
          const IconComponent = iconMap[fact.icon || 'award'] || Award;

          return (
            <div key={i} className="px-6 py-5 group hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center shrink-0`}>
                  <IconComponent className={`h-5 w-5 ${color.icon}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1">{fact.label}</p>
                  <p className={`text-base font-bold text-white leading-tight`}>{fact.value}</p>
                  {fact.detail && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{fact.detail}</p>
                  )}
                  {fact.href && (
                    <Link
                      href={fact.href}
                      target="_blank"
                      rel="noopener sponsored"
                      className={`inline-flex items-center gap-1 text-xs font-medium ${color.accent} hover:underline mt-2`}
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
        <div className="px-6 py-3 border-t border-slate-800/40 bg-slate-900/30">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <CheckCircle className="h-3 w-3 text-cyan-500/60" />
            {testingNote}
          </div>
        </div>
      )}
    </div>
  );
}

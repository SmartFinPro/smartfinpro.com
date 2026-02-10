'use client';

import { CheckCircle, AlertTriangle, Star, ExternalLink, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ExpertVerdictBoxProps {
  name: string;
  verdict: string;
  pros: string[];
  con: string;
  rating?: number;
  affiliateUrl?: string;
  ctaLabel?: string;
  accentColor?: 'emerald' | 'blue' | 'violet' | 'amber' | 'rose';
}

const accentMap: Record<string, {
  headerGradient: string;
  headerBorder: string;
  button: string;
  verdictIcon: string;
  verdictBorder: string;
  verdictBg: string;
  starActive: string;
  initial: string;
}> = {
  emerald: {
    headerGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    headerBorder: 'border-emerald-500/20',
    button: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25',
    verdictIcon: 'text-emerald-400',
    verdictBorder: 'border-emerald-500/20',
    verdictBg: 'bg-emerald-500/5',
    starActive: 'text-emerald-400',
    initial: 'from-emerald-500 to-emerald-600',
  },
  blue: {
    headerGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    headerBorder: 'border-blue-500/20',
    button: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25',
    verdictIcon: 'text-blue-400',
    verdictBorder: 'border-blue-500/20',
    verdictBg: 'bg-blue-500/5',
    starActive: 'text-blue-400',
    initial: 'from-blue-500 to-blue-600',
  },
  violet: {
    headerGradient: 'from-violet-500/10 via-violet-500/5 to-transparent',
    headerBorder: 'border-violet-500/20',
    button: 'bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/25',
    verdictIcon: 'text-violet-400',
    verdictBorder: 'border-violet-500/20',
    verdictBg: 'bg-violet-500/5',
    starActive: 'text-violet-400',
    initial: 'from-violet-500 to-violet-600',
  },
  amber: {
    headerGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    headerBorder: 'border-amber-500/20',
    button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25',
    verdictIcon: 'text-amber-400',
    verdictBorder: 'border-amber-500/20',
    verdictBg: 'bg-amber-500/5',
    starActive: 'text-amber-400',
    initial: 'from-amber-500 to-amber-600',
  },
  rose: {
    headerGradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
    headerBorder: 'border-rose-500/20',
    button: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25',
    verdictIcon: 'text-rose-400',
    verdictBorder: 'border-rose-500/20',
    verdictBg: 'bg-rose-500/5',
    starActive: 'text-rose-400',
    initial: 'from-rose-500 to-rose-600',
  },
};

export function ExpertVerdictBox({
  name,
  verdict,
  pros,
  con,
  rating,
  affiliateUrl,
  ctaLabel,
  accentColor = 'violet',
}: ExpertVerdictBoxProps) {
  const s = accentMap[accentColor] || accentMap.violet;

  return (
    <div className="not-prose my-8 rounded-2xl border border-slate-800/60 bg-slate-950/70 overflow-hidden backdrop-blur-sm">
      {/* Header: Name + Rating */}
      <div className={`bg-gradient-to-r ${s.headerGradient} border-b ${s.headerBorder} px-6 py-5`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Gradient Initial Circle */}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.initial} flex items-center justify-center text-lg font-bold text-white shadow-lg shrink-0`}>
              {name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-white">{name}</h4>
                <Shield className="h-4 w-4 text-slate-500" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-medium">Expert Verdict</p>
            </div>
          </div>

          {/* Star Rating */}
          {rating && (
            <div className="text-right shrink-0">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(rating)
                        ? 'text-amber-400 fill-amber-400'
                        : i < rating
                        ? 'text-amber-400 fill-amber-400/50'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">{rating}/5</span>
            </div>
          )}
        </div>
      </div>

      {/* Short Verdict */}
      <div className={`mx-6 mt-5 mb-4 px-4 py-3.5 rounded-xl ${s.verdictBg} border ${s.verdictBorder}`}>
        <div className="flex items-start gap-3">
          <Sparkles className={`h-5 w-5 ${s.verdictIcon} shrink-0 mt-0.5`} />
          <p className="text-sm text-slate-200 leading-relaxed font-medium">{verdict}</p>
        </div>
      </div>

      {/* Pros — green-tinted background */}
      <div className="px-6 pb-2">
        <div className="space-y-2.5">
          {pros.map((pro, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-cyan-500/[0.06] border border-cyan-500/15"
            >
              <CheckCircle className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-200 leading-relaxed">{pro}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Con — gray border */}
      <div className="px-6 pt-3 pb-5">
        <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-slate-800/30 border border-slate-700/50">
          <AlertTriangle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
          <span className="text-sm text-slate-400 leading-relaxed">{con}</span>
        </div>
      </div>

      {/* CTA */}
      {affiliateUrl && (
        <div className="px-6 pb-6">
          <Button asChild size="lg" className={`w-full sm:w-auto gap-2 font-semibold ${s.button}`}>
            <Link href={affiliateUrl} target="_blank" rel="noopener sponsored">
              {ctaLabel || `Visit ${name}`}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

'use client';

import { CheckCircle, AlertTriangle, Star, ExternalLink, Award } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface QuickVerdictCardProps {
  name: string;
  tagline?: string;
  rating?: number;
  pros: string[];
  con: string;
  verdict?: string;
  affiliateUrl?: string;
  badge?: string;
  accentColor?: 'emerald' | 'blue' | 'violet' | 'amber' | 'rose' | 'cyan';
}

const accentMap: Record<string, {
  gradient: string;
  border: string;
  badgeBg: string;
  button: string;
  text: string;
  glow: string;
  proIcon: string;
  verdictBg: string;
  initial: string;
}> = {
  emerald: {
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/25 hover:border-emerald-500/40',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    button: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'shadow-xl shadow-emerald-500/5',
    proIcon: 'text-emerald-400',
    verdictBg: 'bg-emerald-500/5 border-emerald-500/20',
    initial: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  },
  blue: {
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    border: 'border-blue-500/25 hover:border-blue-500/40',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    button: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20',
    text: 'text-blue-400',
    glow: 'shadow-xl shadow-blue-500/5',
    proIcon: 'text-blue-400',
    verdictBg: 'bg-blue-500/5 border-blue-500/20',
    initial: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  },
  violet: {
    gradient: 'from-violet-500/20 via-violet-500/5 to-transparent',
    border: 'border-violet-500/25 hover:border-violet-500/40',
    badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/25',
    button: 'bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20',
    text: 'text-violet-400',
    glow: 'shadow-xl shadow-violet-500/5',
    proIcon: 'text-violet-400',
    verdictBg: 'bg-violet-500/5 border-violet-500/20',
    initial: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  },
  amber: {
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    border: 'border-amber-500/25 hover:border-amber-500/40',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20',
    text: 'text-amber-400',
    glow: 'shadow-xl shadow-amber-500/5',
    proIcon: 'text-amber-400',
    verdictBg: 'bg-amber-500/5 border-amber-500/20',
    initial: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  },
  rose: {
    gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
    border: 'border-rose-500/25 hover:border-rose-500/40',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    button: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20',
    text: 'text-rose-400',
    glow: 'shadow-xl shadow-rose-500/5',
    proIcon: 'text-rose-400',
    verdictBg: 'bg-rose-500/5 border-rose-500/20',
    initial: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  },
  cyan: {
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    border: 'border-cyan-500/25 hover:border-cyan-500/40',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
    button: 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20',
    text: 'text-cyan-400',
    glow: 'shadow-xl shadow-cyan-500/5',
    proIcon: 'text-cyan-400',
    verdictBg: 'bg-cyan-500/5 border-cyan-500/20',
    initial: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  },
};

export function QuickVerdictCard({
  name,
  tagline,
  rating,
  pros,
  con,
  verdict,
  affiliateUrl,
  badge,
  accentColor = 'violet',
}: QuickVerdictCardProps) {
  const s = accentMap[accentColor] || accentMap.violet;

  return (
    <div
      className={`not-prose my-8 rounded-2xl border ${s.border} bg-slate-950/80 overflow-hidden transition-all duration-300 ${s.glow} backdrop-blur-sm isolate [-webkit-mask-image:-webkit-radial-gradient(white,black)] [mask-image:radial-gradient(white,black)]`}
    >
      {/* Gradient Header with decorative pattern */}
      <div className={`bg-gradient-to-r ${s.gradient} px-6 py-6 relative overflow-hidden isolate`}>
        {/* Dot grid overlay — uses SVG data URI for pixel-perfect Safari/Chrome parity.
            CSS radial-gradient renders differently across WebKit vs Blink at low opacities.
            SVG background tiles identically in all browsers. */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='1' cy='1' r='0.75' fill='white'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)',
          }}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Broker Initial */}
            <div
              className={`w-14 h-14 rounded-xl border flex items-center justify-center text-xl font-bold shrink-0 ${s.initial}`}
            >
              {name.charAt(0)}
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">{name}</h4>
              {tagline && (
                <p className={`text-sm ${s.text} mt-0.5 font-medium`}>{tagline}</p>
              )}
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

        {/* Award Badge */}
        {badge && (
          <div className="relative mt-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${s.badgeBg}`}
            >
              <Award className="h-3.5 w-3.5" />
              {badge}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="px-6 py-6">
        {/* Pros */}
        <div className="space-y-3 mb-5">
          {pros.map((pro, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-slate-900/60 rounded-xl px-4 py-3.5 border border-slate-800/50"
            >
              <CheckCircle className={`h-5 w-5 ${s.proIcon} shrink-0 mt-0.5`} />
              <span className="text-sm text-slate-200 leading-relaxed">{pro}</span>
            </div>
          ))}
        </div>

        {/* Con */}
        <div className="flex items-start gap-3 bg-amber-500/5 rounded-xl px-4 py-3.5 border border-amber-500/15 mb-5">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <span className="text-sm text-slate-300 leading-relaxed">{con}</span>
        </div>

        {/* Verdict */}
        {verdict && (
          <div className={`${s.verdictBg} rounded-xl px-4 py-4 border mb-6`}>
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className={`font-semibold ${s.text}`}>Our verdict: </span>
              {verdict}
            </p>
          </div>
        )}

        {/* CTA */}
        {affiliateUrl && (
          <Button asChild size="lg" className={`w-full sm:w-auto gap-2 font-semibold ${s.button}`}>
            <Link href={affiliateUrl} target="_blank" rel="noopener sponsored">
              Visit {name}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

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
  accentColor?: 'emerald' | 'blue' | 'navy' | 'amber' | 'rose';
}

export function ExpertVerdictBox({
  name,
  verdict,
  pros,
  con,
  rating,
  affiliateUrl,
  ctaLabel,
  accentColor = 'navy',
}: ExpertVerdictBoxProps) {
  return (
    <div className="not-prose my-8 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header: Name + Rating */}
      <div className="border-b border-gray-200 px-6 py-5" style={{ background: 'var(--sfp-gray)' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Gradient Initial Circle */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg shrink-0" style={{ background: 'var(--sfp-navy)' }}>
              {name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>{name}</h4>
                <Shield className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
              </div>
              <p className="text-xs mt-0.5 uppercase tracking-wider font-medium" style={{ color: 'var(--sfp-slate)' }}>Expert Verdict</p>
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
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs mt-1 block" style={{ color: 'var(--sfp-slate)' }}>{rating}/5</span>
            </div>
          )}
        </div>
      </div>

      {/* Short Verdict */}
      <div className="mx-6 mt-5 mb-4 px-4 py-3.5 rounded-xl border" style={{ background: 'var(--sfp-sky)', borderColor: 'rgba(27,79,140,0.15)' }}>
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
          <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--sfp-ink)' }}>{verdict}</p>
        </div>
      </div>

      {/* Pros */}
      <div className="px-6 pb-2">
        <div className="space-y-2.5">
          {pros.map((pro, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl px-4 py-3.5 border"
              style={{ background: 'rgba(26,107,58,0.04)', borderColor: 'rgba(26,107,58,0.12)' }}
            >
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
              <span className="text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{pro}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Con */}
      <div className="px-6 pt-3 pb-5">
        <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-slate)' }} />
          <span className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{con}</span>
        </div>
      </div>

      {/* CTA */}
      {affiliateUrl && (
        <div className="px-6 pb-6">
          <Button asChild size="lg" className="w-full sm:w-auto gap-2 font-semibold text-white" style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}>
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

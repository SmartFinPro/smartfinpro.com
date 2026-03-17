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
  accentColor?: 'emerald' | 'blue' | 'navy' | 'amber' | 'rose' | 'gold';
}

const accentMap: Record<string, {
  border: string;
  badgeBg: string;
  button: string;
  text: string;
  proIcon: string;
  verdictBg: string;
  initial: string;
}> = {
  emerald: {
    border: 'border-gray-200 hover:border-gray-300',
    badgeBg: 'border',
    button: 'text-white shadow-lg',
    text: '',
    proIcon: '',
    verdictBg: '',
    initial: 'border-gray-200',
  },
  blue: {
    border: 'border-gray-200 hover:border-gray-300',
    badgeBg: 'border',
    button: 'text-white shadow-lg',
    text: '',
    proIcon: '',
    verdictBg: '',
    initial: 'border-gray-200',
  },
  navy: {
    border: 'border-gray-200 hover:border-gray-300',
    badgeBg: 'border',
    button: 'text-white shadow-lg',
    text: '',
    proIcon: '',
    verdictBg: '',
    initial: 'border-gray-200',
  },
  amber: {
    border: 'border-gray-200 hover:border-gray-300',
    badgeBg: 'border',
    button: 'text-white shadow-lg',
    text: '',
    proIcon: '',
    verdictBg: '',
    initial: 'border-gray-200',
  },
  rose: {
    border: 'border-gray-200 hover:border-gray-300',
    badgeBg: 'border',
    button: 'text-white shadow-lg',
    text: '',
    proIcon: '',
    verdictBg: '',
    initial: 'border-gray-200',
  },
  gold: {
    border: 'border-gray-200 hover:border-gray-300',
    badgeBg: 'border',
    button: 'text-white shadow-lg',
    text: '',
    proIcon: '',
    verdictBg: '',
    initial: 'border-gray-200',
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
  accentColor = 'navy',
}: QuickVerdictCardProps) {
  return (
    <div
      className="not-prose my-8 rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md"
    >
      {/* Header */}
      <div className="px-6 py-6 relative overflow-hidden" style={{ background: 'var(--sfp-gray)' }}>
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Broker Initial */}
            <div
              className="w-14 h-14 rounded-xl border border-gray-200 flex items-center justify-center text-xl font-bold shrink-0 text-white"
              style={{ background: 'var(--sfp-navy)' }}
            >
              {name.charAt(0)}
            </div>
            <div>
              <h4 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>{name}</h4>
              {tagline && (
                <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--sfp-navy)' }}>{tagline}</p>
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
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs mt-1 block" style={{ color: 'var(--sfp-slate)' }}>{rating}/5</span>
            </div>
          )}
        </div>

        {/* Award Badge */}
        {badge && (
          <div className="relative mt-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{ background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.3)', color: 'var(--sfp-gold)' }}
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
              className="flex items-start gap-3 rounded-xl px-4 py-3.5 border border-gray-100"
              style={{ background: 'var(--sfp-gray)' }}
            >
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
              <span className="text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{pro}</span>
            </div>
          ))}
        </div>

        {/* Con */}
        <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 border mb-5" style={{ background: 'rgba(214,64,69,0.04)', borderColor: 'rgba(214,64,69,0.15)' }}>
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-red)' }} />
          <span className="text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{con}</span>
        </div>

        {/* Verdict */}
        {verdict && (
          <div className="rounded-xl px-4 py-4 border mb-6" style={{ background: 'var(--sfp-sky)', borderColor: 'rgba(27,79,140,0.15)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
              <span className="font-semibold" style={{ color: 'var(--sfp-navy)' }}>Our verdict: </span>
              {verdict}
            </p>
          </div>
        )}

        {/* CTA */}
        {affiliateUrl && (
          <Button asChild size="lg" className="w-full sm:w-auto gap-2 font-semibold text-white" style={{ background: 'var(--sfp-gold)' }}>
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

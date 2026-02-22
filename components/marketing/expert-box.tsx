'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote, Award, CheckCircle, Shield, Star } from 'lucide-react';

interface ExpertBoxProps {
  name?: string;
  title: string;
  credentials?: string[];
  image?: string;
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
  quote,
  rating,
  variant = 'default',
  children,
}: ExpertBoxProps) {
  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm my-10 p-8 ${
        variant === 'highlight'
          ? 'border-2 shadow-md'
          : variant === 'minimal'
          ? 'border-gray-200'
          : 'border-gray-200'
      }`}
      style={variant === 'highlight' ? { borderColor: 'var(--sfp-gold)' } : {}}
    >
      <div className="flex items-start gap-5">
        {/* Expert Avatar */}
        <div className="shrink-0">
          {image ? (
            <Image
              src={image}
              alt={name || title}
              width={72}
              height={72}
              className="rounded-full border-2"
              style={{ borderColor: 'var(--sfp-navy)' }}
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center border border-gray-200" style={{ background: 'var(--sfp-sky)' }}>
              <Award className="h-9 w-9" style={{ color: 'var(--sfp-navy)' }} />
            </div>
          )}
        </div>

        {/* Expert Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            {name && <h4 className="font-bold text-xl" style={{ color: 'var(--sfp-ink)' }}>{name}</h4>}
            <Badge className="text-xs border" style={{ background: 'rgba(26,107,58,0.08)', color: 'var(--sfp-green)', borderColor: 'rgba(26,107,58,0.2)' }}>
              <Shield className="h-3 w-3 mr-1" />
              Verified Expert
            </Badge>
          </div>
          <p style={{ color: 'var(--sfp-slate)' }} className="mb-4">{title}</p>
          {credentials && credentials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {credentials.map((cred) => (
                <span
                  key={cred}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200"
                  style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-ink)' }}
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
        <blockquote className="relative pl-5 border-l-4 mt-6" style={{ borderColor: 'var(--sfp-navy)' }}>
          <Quote className="absolute -left-4 -top-2 h-7 w-7 rounded" style={{ color: 'rgba(27,79,140,0.3)', background: 'white' }} />
          {quote ? (
            <p className="italic font-serif text-lg leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>&ldquo;{quote}&rdquo;</p>
          ) : (
            <div className="text-base leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>{children}</div>
          )}
          {rating && (
            <div className="flex items-center gap-3 mt-4">
              <span className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>Expert Rating:</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-lg font-bold ml-2" style={{ color: 'var(--sfp-navy)' }}>{rating}/5</span>
              </div>
            </div>
          )}
        </blockquote>
      )}
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
interface TrustAuthorityProps {
  stats: {
    label: string;
    value: string;
    icon?: React.ReactNode;
  }[];
}

export function TrustAuthority({ stats }: TrustAuthorityProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 my-10 p-8">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center group">
          {stat.icon && (
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors" style={{ background: 'var(--sfp-sky)' }}>
                {stat.icon}
              </div>
            </div>
          )}
          <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: 'var(--sfp-navy)' }}>{stat.value}</div>
          <div className="text-sm" style={{ color: 'var(--sfp-slate)' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// Methodology Box for transparency
interface MethodologyBoxProps {
  title?: string;
  steps: string[];
  dataPoints?: number;
  hoursResearch?: number;
}

export function MethodologyBox({
  title = 'How We Test & Review',
  steps,
  dataPoints = 50,
  hoursResearch = 100,
}: MethodologyBoxProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm my-10 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
          <Shield className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
        </div>
        <h4 className="font-bold text-xl" style={{ color: 'var(--sfp-ink)' }}>{title}</h4>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
          <div className="text-3xl font-bold" style={{ color: 'var(--sfp-navy)' }}>{hoursResearch}+</div>
          <div className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Hours of Research</div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
          <div className="text-3xl font-bold" style={{ color: 'var(--sfp-navy)' }}>{dataPoints.toLocaleString('en-US')}+</div>
          <div className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Data Points Analyzed</div>
        </div>
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

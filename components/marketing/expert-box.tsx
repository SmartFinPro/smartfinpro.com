'use client';

import Image from 'next/image';
import { Award, CheckCircle, Shield, Star, ExternalLink } from 'lucide-react';

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
                <p className="italic" style={{ color: 'var(--sfp-ink)', fontSize: '13px', lineHeight: '1.65', fontFamily: 'var(--font-secondary)' }}>&ldquo;{quote}&rdquo;</p>
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


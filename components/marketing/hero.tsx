'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Shield, Users, DollarSign } from 'lucide-react';

interface HeroProps {
  title?: string;
  subtitle?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
}

const trustBadges = [
  { icon: Users, text: '100+ Products Reviewed' },
  { icon: Shield, text: 'Regulated Partners Only' },
  { icon: DollarSign, text: '4 Global Markets' },
];

export default function Hero({
  title = 'Financial Product\nResearch, Simplified.',
  subtitle = '108+ expert-reviewed products across trading, AI, cybersecurity, and personal finance. Independent analysis. 4 regulated markets.',
  primaryCta = { text: 'Explore Reports', href: '/us/ai-tools' },
  secondaryCta = { text: 'How We Review', href: '/tools' },
}: HeroProps) {
  // Split title: everything before "\n" is the first line,
  // the first word after "\n" gets the gold accent, rest follows normally
  const lines = title.split('\n');
  const firstLine = lines[0];
  let accentWord = '';
  let restOfSecondLine = '';
  if (lines.length > 1) {
    const secondLineParts = lines[1].split(/\s+/);
    // Strip trailing comma/period from accent word for clean styling
    accentWord = secondLineParts[0].replace(/[,.]$/, '');
    const punctuation = secondLineParts[0].replace(accentWord, '');
    restOfSecondLine = punctuation + (secondLineParts.length > 1 ? ' ' + secondLineParts.slice(1).join(' ') : '');
  }

  return (
    <section
      className="relative overflow-hidden text-center"
      style={{ background: '#0F2E52', padding: '80px 40px 80px' }}
    >
      {/* Hero Background Image */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/header001.webp"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Gradient overlay matching landing page */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(15,46,82,0.45) 0%, rgba(15,46,82,0.65) 60%, rgba(15,46,82,0.85) 100%)',
          }}
        />
      </div>

      {/* Hero Inner Content */}
      <div className="relative z-[2] mx-auto" style={{ maxWidth: '720px' }}>
        {/* Chip / Kicker Badge */}
        <div
          className="mb-9 inline-flex items-center gap-2"
          style={{
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '6px',
            padding: '7px 16px',
          }}
        >
          <Shield className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.7)' }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.8px',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Independent Financial Research
          </span>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontSize: 'clamp(34px, 5.5vw, 62px)',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.06,
            marginBottom: '28px',
            letterSpacing: '-2.5px',
          }}
        >
          {firstLine}
          {lines.length > 1 && (
            <>
              <br />
              <span style={{ color: 'var(--sfp-gold)' }}>{accentWord}</span>
              {restOfSecondLine}
            </>
          )}
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto"
          style={{
            fontSize: '16px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '500px',
            marginBottom: '48px',
            lineHeight: 1.75,
          }}
        >
          {subtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={primaryCta.href}
            className="no-underline inline-flex items-center justify-center transition-all duration-200 hover:brightness-110 hover:no-underline"
            style={{
              padding: '14px 32px',
              background: 'var(--sfp-gold)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '8px',
              textDecoration: 'none',
              border: 'none',
            }}
          >
            {primaryCta.text} →
          </Link>
          <Link
            href={secondaryCta.href}
            className="no-underline inline-flex items-center justify-center transition-all duration-200 hover:border-white/40 hover:no-underline"
            style={{
              padding: '14px 32px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            {secondaryCta.text}
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {trustBadges.map((badge) => (
            <div
              key={badge.text}
              className="flex items-center gap-2"
              style={{
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '6px',
                padding: '7px 16px',
              }}
            >
              <badge.icon className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1.8px',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {badge.text}
              </span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

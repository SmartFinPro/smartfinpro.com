'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Shield, Users, DollarSign } from 'lucide-react';
import { defaultMarketHomeHeroImage } from '@/lib/images/market-home-hero';

interface HeroProps {
  title?: string;
  subtitle?: string;
  backgroundImageSrc?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  /** Hide the two hero CTA buttons (the featured card below supplies the CTA). */
  hideCtas?: boolean;
}

const trustBadges = [
  { icon: Users, text: '100+ Products Reviewed' },
  { icon: Shield, text: 'Regulated Partners Only' },
  { icon: DollarSign, text: '4 Global Markets' },
];

export default function Hero({
  title = 'Financial Product\nResearch, Simplified.',
  subtitle = '108+ expert-reviewed products across trading, AI, cybersecurity, and personal finance. Independent analysis. 4 regulated markets.',
  backgroundImageSrc = defaultMarketHomeHeroImage,
  primaryCta = { text: 'Explore Reports', href: '/us/ai-tools' },
  secondaryCta = { text: 'How We Review', href: '/tools' },
  hideCtas = false,
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
      className="relative overflow-hidden"
      style={{ background: '#0F2E52', padding: '80px 40px 80px' }}
    >
      {/* Hero Background Image */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src={backgroundImageSrc}
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
            background: 'linear-gradient(180deg, rgba(15,46,82,0.12) 0%, rgba(15,46,82,0.28) 55%, rgba(15,46,82,0.52) 100%)',
          }}
        />
        {/* Anthracite left-side wash — premium editorial depth behind the left-aligned copy */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(100deg, rgba(18,19,23,0.62) 0%, rgba(18,19,23,0.42) 32%, rgba(18,19,23,0.16) 56%, rgba(18,19,23,0) 74%)',
          }}
        />
      </div>

      {/* Hero Inner Content */}
      <div className="relative z-[2]" style={{ maxWidth: '600px' }}>
        {/* Chip / Kicker Badge */}
        <div
          className="mb-9 inline-flex items-center gap-2"
          style={{
            border: '1px solid rgba(255,255,255,0.45)',
            borderRadius: '6px',
            padding: '7px 16px',
          }}
        >
          <Shield className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.95)' }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.8px',
              color: 'rgba(255,255,255,0.95)',
            }}
          >
            Independent Financial Research
          </span>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontSize: 'clamp(34px, 5.5vw, 60px)', // 60px-Cap: "Find and compare the" (607px @62px) muss in die 600px-Spalte — sichert den 3-Zeilen-Satz
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.06,
            marginBottom: '28px',
            letterSpacing: '-2.5px',
            textShadow: '0 2px 18px rgba(8,24,44,0.55)',
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
          {lines.slice(2).map((line, i) => (
            <span key={i}>
              <br />
              {line}
            </span>
          ))}
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: '16px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.92)',
            maxWidth: '500px',
            marginBottom: '48px',
            lineHeight: 1.75,
            textShadow: '0 1px 12px rgba(8,24,44,0.6)',
          }}
        >
          {subtitle}
        </p>

        {/* CTAs — hidden when the featured Wealth Horizon card supplies the CTA */}
        {!hideCtas && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-3">
          <Link
            href={primaryCta.href}
            className="hero-cta-champ no-underline inline-flex items-center justify-center hover:no-underline"
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '14px 32px',
              // Exact champagne treatment of the Wealth Horizon card CTA (.wh-cta):
              // gradient + inset highlights + drop shadow, navy-dark label.
              background: 'linear-gradient(180deg, #E3C283 0%, #D8B36B 45%, #C9A35B 100%)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,.45), inset 0 -1px 0 rgba(94,70,26,.30), 0 2px 10px -2px rgba(0,0,0,.45)',
              color: '#163D6E',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '.01em',
              borderRadius: '999px',
              textDecoration: 'none',
              border: 'none',
            }}
          >
            {primaryCta.text}
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
              borderRadius: '999px',
              textDecoration: 'none',
            }}
          >
            {secondaryCta.text}
          </Link>
        </div>
        )}

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-start gap-3">
          {trustBadges.map((badge) => (
            <div
              key={badge.text}
              className="flex items-center gap-2"
              style={{
                border: '1px solid rgba(255,255,255,0.45)',
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
                  color: 'rgba(255,255,255,0.95)',
                }}
              >
                {badge.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Champagne CTA sheen + hover — pseudo-element effects (can't be inline),
          mirroring the Wealth Horizon card CTA (.wh-cta). */}
      <style>{`
        .hero-cta-champ {
          transition: transform .25s ease, box-shadow .25s ease, filter .25s ease;
        }
        .hero-cta-champ:hover {
          filter: brightness(1.03);
          transform: translateY(-1px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.5), inset 0 -1px 0 rgba(94,70,26,.3), 0 6px 18px -4px rgba(0,0,0,.5) !important;
        }
        .hero-cta-champ::after {
          content: "";
          position: absolute;
          inset: -2px;
          pointer-events: none;
          background: linear-gradient(105deg, transparent 42%, rgba(255,255,255,.45) 50%, transparent 58%);
          transform: translateX(-130%);
        }
        .hero-cta-champ:hover::after { transform: translateX(130%); transition: transform .9s ease .05s; }
        @media (prefers-reduced-motion: reduce) {
          .hero-cta-champ, .hero-cta-champ::after { transition: none; }
        }
      `}</style>

    </section>
  );
}

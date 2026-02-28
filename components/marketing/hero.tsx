'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Shield, Users, DollarSign, Sparkles } from 'lucide-react';

const NetworkAnimation = dynamic(
  () =>
    import('@/components/marketing/network-animation').then((m) => ({
      default: m.default,
    })),
  { ssr: false, loading: () => null }
);

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

export function Hero({
  title = 'Financial Intelligence. Automated.',
  subtitle = 'Discover AI-powered tools, cybersecurity solutions, and trading platforms — expert-reviewed for modern professionals.',
  primaryCta = { text: 'Explore Tools', href: '/us/ai-tools' },
  secondaryCta = { text: 'Start Free Trial', href: '/tools' },
}: HeroProps) {
  const [firstPart, secondPart] = title.includes('.')
    ? [title.split('.')[0], title.split('.').slice(1).join('.')]
    : [title, ''];

  return (
    <section className="relative flex items-center overflow-hidden" style={{ background: 'var(--sfp-navy)' }}>
      {/* Hero Background Image */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/header001.webp"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          quality={85}
        />
        {/* Minimal bottom fade only for smooth transition */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(27, 79, 140, 0.6), transparent 50%)' }} />
      </div>

      {/* Network Animation Background */}
      <NetworkAnimation className="opacity-20" />

      <div className="container relative z-10 mx-auto px-4 pt-10 pb-16 lg:pt-14 lg:pb-20">
        <div
          className="mx-auto max-w-4xl text-center rounded-3xl px-6 py-8 sm:px-10 sm:py-10"
          style={{ background: 'radial-gradient(ellipse at center, rgba(20, 55, 100, 0.55) 0%, rgba(20, 55, 100, 0.35) 60%, transparent 100%)' }}
        >
          {/* Kicker Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 border border-white/20" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">
              Trusted by Finance Professionals Worldwide
            </span>
          </div>

          {/* Main Headline — compact but impactful */}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-[3.5rem]" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}>
            <span className="text-white">{firstPart}.</span>
            {secondPart && (
              <>
                <br className="hidden sm:inline" />
                <span style={{ color: 'var(--sfp-gold)' }}>{secondPart}</span>
              </>
            )}
          </h1>

          {/* Subheadline */}
          <p className="mt-3 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed text-white/80" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={primaryCta.href}
              className="no-underline inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-md border-0 shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.03] hover:brightness-110 hover:no-underline"
              style={{ color: '#ffffff', background: 'var(--sfp-gold)', textDecoration: 'none' }}
            >
              {primaryCta.text}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={secondaryCta.href}
              className="no-underline hero-secondary-btn inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-md border border-white/50 transition-all duration-300 hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:scale-[1.03] hover:no-underline"
              style={{ color: '#ffffff', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)', textDecoration: 'none' }}
            >
              {secondaryCta.text}
            </Link>
          </div>

          {/* Trust Badges — inline compact row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {trustBadges.map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-2 rounded-full px-3.5 py-1.5 border border-white/20"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <badge.icon className="h-3.5 w-3.5" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-xs font-medium text-white/80">
                  {badge.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom transition: gradient fade + SVG curve */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--sfp-sky), rgba(232, 240, 251, 0.8), transparent)' }} />
      <div className="absolute -bottom-px left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 24C240 46 480 56 720 50C960 44 1200 22 1440 8V56H0V24Z"
            fill="var(--sfp-sky)"
          />
        </svg>
      </div>
    </section>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Users, DollarSign, Sparkles } from 'lucide-react';

const NetworkAnimation = dynamic(
  () => import('@/components/marketing/network-animation'),
  { ssr: false }
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
  primaryCta = { text: 'Explore Tools', href: '/ai-tools' },
  secondaryCta = { text: 'Start Free Trial', href: '/tools' },
}: HeroProps) {
  const [firstPart, secondPart] = title.includes('.')
    ? [title.split('.')[0], title.split('.').slice(1).join('.')]
    : [title, ''];

  return (
    <section className="relative min-h-[90vh] min-h-[90dvh] flex items-center overflow-hidden" style={{ background: 'var(--sfp-navy)' }}>
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
        {/* Multi-layer gradient overlay for navy brand integration */}
        {/* Base navy overlay for readability */}
        <div className="absolute inset-0" style={{ background: 'rgba(27, 79, 140, 0.74)' }} />
        {/* Navy brand tint */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(22, 61, 110, 0.84), rgba(27, 79, 140, 0.54), rgba(22, 61, 110, 0.64))' }} />
        {/* Bottom fade into next section */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(27, 79, 140, 0.97), rgba(27, 79, 140, 0.34), transparent)' }} />
        {/* Top fade from navigation */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(27, 79, 140, 0.64), transparent, transparent)' }} />
      </div>

      {/* Network Animation Background */}
      <NetworkAnimation className="opacity-20" />

      <div className="container relative z-10 mx-auto px-4 py-20 lg:py-32">
        <div className="mx-auto max-w-5xl text-center">
          {/* Kicker Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 border border-white/20" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
              Trusted by Finance Professionals Worldwide
            </span>
          </div>

          {/* Main Headline with Gradient Effect */}
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="text-white">{firstPart}.</span>
            {secondPart && (
              <>
                <br className="hidden sm:inline" />
                <span style={{ color: 'var(--sfp-gold)' }}>{secondPart}</span>
              </>
            )}
          </h1>

          {/* Subheadline */}
          <p className="mt-8 text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-white/70">
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-lg border-0 shadow-md hover:shadow-lg text-white"
              style={{ background: 'var(--sfp-gold)' }}
            >
              <Link href={primaryCta.href}>
                {primaryCta.text}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg border-white/30 text-white hover:text-white"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <Link href={secondaryCta.href}>{secondaryCta.text}</Link>
            </Button>
          </div>

          {/* Trust Badges - Premium Style */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {trustBadges.map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-3 rounded-full px-5 py-2.5 border border-white/20"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <badge.icon className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-sm font-medium text-white/80">
                  {badge.text}
                </span>
              </div>
            ))}
          </div>

          {/* Markets Served */}
          <div className="mt-20 pt-12 border-t border-white/20">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-8">Serving Professionals In</p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {['United States', 'United Kingdom', 'Canada', 'Australia'].map(
                (market) => (
                  <span
                    key={market}
                    className="text-lg font-semibold text-white/50"
                  >
                    {market}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom transition: gradient fade + SVG curve */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--sfp-sky), rgba(232, 240, 251, 0.8), transparent)' }} />
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

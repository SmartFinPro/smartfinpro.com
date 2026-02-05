'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Users, DollarSign, Sparkles } from 'lucide-react';

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
  { icon: Users, text: '50,000+ Active Users' },
  { icon: Shield, text: 'SOC 2 Compliant Partners' },
  { icon: DollarSign, text: '$500M+ Protected' },
];

export function Hero({
  title = 'Financial Intelligence. Automated.',
  subtitle = 'Discover AI-powered tools, cybersecurity solutions, and trading platforms trusted by 50,000+ professionals.',
  primaryCta = { text: 'Explore Tools', href: '/ai-tools' },
  secondaryCta = { text: 'Start Free Trial', href: '/resources' },
}: HeroProps) {
  const [firstPart, secondPart] = title.includes('.')
    ? [title.split('.')[0], title.split('.').slice(1).join('.')]
    : [title, ''];

  return (
    <section className="relative min-h-[90vh] min-h-[90dvh] flex items-center overflow-hidden bg-gradient-to-b from-slate-950 via-[#020617] to-slate-900">
      {/* Aurora Borealis Background Effect */}
      <div className="aurora-bg" aria-hidden="true">
        {/* Primary emerald glow */}
        <div className="absolute top-1/4 left-1/3 w-[800px] h-[800px] glow-emerald" />
        {/* Secondary blue glow */}
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] glow-blue" />
        {/* Accent purple glow */}
        <div className="absolute bottom-1/4 left-1/2 w-[500px] h-[500px] glow-purple" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      <div className="container relative z-10 mx-auto px-4 py-20 lg:py-32">
        <div className="mx-auto max-w-5xl text-center">
          {/* Kicker Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full badge-premium px-4 py-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="kicker text-slate-300">
              Trusted by Finance Professionals Worldwide
            </span>
          </div>

          {/* Main Headline with Gradient Effect */}
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="text-white">{firstPart}.</span>
            {secondPart && (
              <>
                <br className="hidden sm:inline" />
                <span className="gradient-text">{secondPart}</span>
              </>
            )}
          </h1>

          {/* Subheadline */}
          <p className="mt-8 text-lg text-slate-400 sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="btn-shimmer h-14 px-8 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
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
              className="h-14 px-8 text-lg border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
            >
              <Link href={secondaryCta.href}>{secondaryCta.text}</Link>
            </Button>
          </div>

          {/* Trust Badges - Premium Style */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {trustBadges.map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-3 rounded-full badge-premium px-5 py-2.5"
              >
                <badge.icon className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">
                  {badge.text}
                </span>
              </div>
            ))}
          </div>

          {/* Featured In - Refined */}
          <div className="mt-20 pt-12 border-t border-slate-800/50">
            <p className="kicker text-slate-500 mb-8">As Featured In</p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {['TechCrunch', 'Forbes', 'Bloomberg', 'WSJ', 'Reuters'].map(
                (logo) => (
                  <span
                    key={logo}
                    className="text-xl font-semibold text-slate-600 hover:text-slate-400 transition-colors cursor-default"
                  >
                    {logo}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
    </section>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink, Sparkles, Zap, Shield, Clock, TrendingUp, Building, DollarSign, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackedCTAProps {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showArrow?: boolean;
  showExternal?: boolean;
  productName?: string;
}

/**
 * TrackedCTA - All affiliate CTAs automatically use /go/[slug] routes
 * which append the unique click_id for conversion tracking
 */
export function TrackedCTA({
  href,
  children,
  variant = 'default',
  size = 'default',
  className,
  showArrow = true,
  showExternal = false,
  productName,
}: TrackedCTAProps) {
  // All /go/ links are tracked automatically via the redirect route
  const isTrackedLink = href.startsWith('/go/');

  // Use premium styling for default CTAs
  const premiumClassName = variant === 'default'
    ? 'border-0 shadow-lg text-white'
    : '';

  const premiumStyle = variant === 'default'
    ? { background: 'var(--sfp-gold)' }
    : {};

  return (
    <Button asChild variant={variant} size={size} className={cn('gap-2', premiumClassName, className)} style={premiumStyle}>
      <Link
        href={href}
        {...(isTrackedLink ? { target: '_blank', rel: 'noopener sponsored' } : {})}
        title={productName ? `Visit ${productName}` : undefined}
      >
        {children}
        {showArrow && <ArrowRight className="h-4 w-4" />}
        {showExternal && <ExternalLink className="h-4 w-4" />}
      </Link>
    </Button>
  );
}

// Special CTA variants for high-conversion scenarios
interface HighlightCTAProps {
  href: string;
  productName: string;
  headline: string;
  subtext?: string;
  badge?: string;
  icon?: 'sparkles' | 'zap' | 'shield' | 'clock' | 'trendingUp' | 'building' | 'dollarSign' | 'target';
}

export function HighlightCTA({
  href,
  productName,
  headline,
  subtext,
  badge,
  icon = 'sparkles',
}: HighlightCTAProps) {
  const IconComponent = {
    sparkles: Sparkles,
    zap: Zap,
    shield: Shield,
    clock: Clock,
    trendingUp: TrendingUp,
    building: Building,
    dollarSign: DollarSign,
    target: Target,
  }[icon];

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener sponsored"
      className="group block rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6 hover:shadow-md hover:border-gray-300 transition-all my-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-gray-200" style={{ background: 'var(--sfp-sky)' }}>
          <IconComponent className="h-7 w-7" style={{ color: 'var(--sfp-navy)' }} />
        </div>
        <div className="flex-1 min-w-0">
          {badge && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mb-2 border" style={{ color: 'var(--sfp-gold)', background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.2)' }}>
              <Sparkles className="h-3 w-3" />
              {badge}
            </span>
          )}
          <h4 className="font-bold text-lg transition-colors" style={{ color: 'var(--sfp-ink)' }}>{headline}</h4>
          {subtext && <p className="text-sm mt-1" style={{ color: 'var(--sfp-slate)' }}>{subtext}</p>}
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <Button
            size="default"
            className="w-full sm:w-auto gap-2 border-0 shadow-lg text-white"
            style={{ background: 'var(--sfp-gold)' }}
          >
            Try {productName}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </Link>
  );
}

// Inline CTA for within content
interface InlineCTAProps {
  href: string;
  text: string;
}

export function InlineCTA({ href, text }: InlineCTAProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener sponsored"
      className="inline-flex items-center gap-1.5 font-medium transition-colors"
      style={{ color: 'var(--sfp-navy)' }}
    >
      {text}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

// Sticky Bottom CTA for mobile
interface StickyBottomCTAProps {
  href: string;
  productName: string;
  price?: string;
}

export function StickyBottomCTA({ href, productName, price }: StickyBottomCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-200 md:hidden z-50" style={{ background: 'rgba(255,255,255,0.97)' }}>
      <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div>
          <div className="font-bold" style={{ color: 'var(--sfp-ink)' }}>{productName}</div>
          {price && <div className="text-sm" style={{ color: 'var(--sfp-slate)' }}>{price}</div>}
        </div>
        <Button
          asChild
          size="lg"
          className="gap-2 border-0 shadow-lg text-white"
          style={{ background: 'var(--sfp-gold)' }}
        >
          <Link href={href} target="_blank" rel="noopener sponsored">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Decision Helper CTA
interface DecisionCTAProps {
  options: {
    label: string;
    description: string;
    href: string;
    recommended?: boolean;
  }[];
  title?: string;
}

export function DecisionCTA({ options, title = "Which is right for you?" }: DecisionCTAProps) {
  return (
    <div className="my-10 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 md:p-8">
      <h4 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-3" style={{ color: 'var(--sfp-ink)' }}>
        <Target className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
        {title}
      </h4>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {options.map((option) => (
          <Link
            key={option.label}
            href={option.href}
            target="_blank"
            rel="noopener sponsored"
            className={cn(
              'group block p-5 rounded-xl border transition-all hover:shadow-md',
              option.recommended
                ? 'border-2 bg-white shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
            style={option.recommended ? { borderColor: 'var(--sfp-gold)' } : {}}
          >
            {option.recommended && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mb-3 border" style={{ color: 'var(--sfp-gold)', background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.2)' }}>
                <Sparkles className="h-3 w-3" />
                Recommended
              </span>
            )}
            <h5 className="font-bold mb-2 transition-colors" style={{ color: 'var(--sfp-ink)' }}>{option.label}</h5>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>{option.description}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--sfp-navy)' }}>
              Try Free <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

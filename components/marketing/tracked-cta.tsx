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
    ? 'btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25 text-white'
    : '';

  return (
    <Button asChild variant={variant} size={size} className={cn('gap-2', premiumClassName, className)}>
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
      className="group block glass-card p-5 md:p-6 rounded-2xl border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-500/5 transition-all my-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/30">
          <IconComponent className="h-7 w-7 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          {badge && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full mb-2">
              <Sparkles className="h-3 w-3" />
              {badge}
            </span>
          )}
          <h4 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">{headline}</h4>
          {subtext && <p className="text-sm text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <Button
            size="default"
            className="w-full sm:w-auto btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25 gap-2"
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
      className="inline-flex items-center gap-1.5 text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
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
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 md:hidden z-50">
      <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div>
          <div className="font-bold text-white">{productName}</div>
          {price && <div className="text-sm text-slate-400">{price}</div>}
        </div>
        <Button
          asChild
          size="lg"
          className="btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25 gap-2"
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
    <div className="my-10 glass-card p-6 md:p-8 rounded-2xl">
      <h4 className="text-xl font-bold mb-6 text-center text-white flex items-center justify-center gap-3">
        <Target className="h-5 w-5 text-emerald-400" />
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
              'group block p-5 rounded-xl border transition-all hover:shadow-lg',
              option.recommended
                ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500/70 shadow-lg shadow-emerald-500/10'
                : 'border-slate-700/50 bg-slate-800/30 hover:border-emerald-500/30 hover:bg-slate-800/50'
            )}
          >
            {option.recommended && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full mb-3">
                <Sparkles className="h-3 w-3" />
                Recommended
              </span>
            )}
            <h5 className="font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{option.label}</h5>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">{option.description}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">
              Try Free <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

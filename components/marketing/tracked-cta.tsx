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

  return (
    <Button asChild variant={variant} size={size} className={cn('gap-2', className)}>
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
      className="group block p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 hover:border-primary/40 transition-all my-6"
    >
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <IconComponent className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          {badge && (
            <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded mb-1">
              {badge}
            </span>
          )}
          <h4 className="font-bold group-hover:text-primary transition-colors">{headline}</h4>
          {subtext && <p className="text-sm text-muted-foreground">{subtext}</p>}
        </div>
        <div className="shrink-0">
          <Button size="sm" className="gap-1">
            Try {productName}
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
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
      className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
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
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t md:hidden z-50">
      <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div>
          <div className="font-bold">{productName}</div>
          {price && <div className="text-sm text-muted-foreground">{price}</div>}
        </div>
        <Button asChild size="lg" className="gap-2">
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
    <div className="my-8 p-6 bg-muted/30 rounded-xl border">
      <h4 className="text-lg font-bold mb-4 text-center">{title}</h4>
      <div className="grid md:grid-cols-2 gap-4">
        {options.map((option) => (
          <Link
            key={option.label}
            href={option.href}
            target="_blank"
            rel="noopener sponsored"
            className={cn(
              'block p-4 rounded-lg border-2 transition-all hover:shadow-lg',
              option.recommended
                ? 'border-primary bg-primary/5 hover:border-primary'
                : 'border-muted hover:border-primary/50'
            )}
          >
            {option.recommended && (
              <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded mb-2">
                Recommended
              </span>
            )}
            <h5 className="font-bold mb-1">{option.label}</h5>
            <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Try Free <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

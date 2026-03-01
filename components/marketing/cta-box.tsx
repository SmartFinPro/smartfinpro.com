import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Shield, Sparkles } from 'lucide-react';

interface CTABoxProps {
  headline: string;
  description?: string;
  primaryCta: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  guarantees?: string[];
  variant?: 'default' | 'highlight' | 'dark';
}

export function CTABox({
  headline,
  description,
  primaryCta,
  secondaryCta,
  guarantees = ['30-day money-back guarantee', 'No credit card required'],
  variant = 'default',
}: CTABoxProps) {
  return (
    <div
      className={`relative my-10 p-8 md:p-10 rounded-2xl text-center overflow-hidden ${
        variant === 'highlight'
          ? 'rounded-xl border border-gray-200 bg-white shadow-md'
          : variant === 'dark'
          ? 'rounded-xl border border-gray-200 bg-white shadow-sm'
          : 'rounded-xl border border-gray-200 bg-white shadow-sm'
      }`}
    >
      {/* Background glow for highlight variant */}
      {variant === 'highlight' && (
        <div className="absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-[80px]" style={{ background: 'rgba(26,107,58,0.06)' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full blur-[60px]" style={{ background: 'rgba(27,79,140,0.06)' }} />
        </div>
      )}

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
        </div>

        <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--sfp-ink)' }}>
          {headline}
        </h3>

        {description && (
          <p className="mb-8 max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
            {description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="gap-2 px-8 border-0 shadow-lg text-white"
            style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
          >
            <Link href={primaryCta.href} target="_blank" rel="noopener sponsored">
              {primaryCta.text}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          {secondaryCta && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-gray-300 bg-white hover:bg-gray-50"
              style={{ color: 'var(--sfp-ink)' }}
            >
              <Link href={secondaryCta.href}>{secondaryCta.text}</Link>
            </Button>
          )}
        </div>

        {guarantees.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            {guarantees.map((guarantee) => (
              <div
                key={guarantee}
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--sfp-slate)' }}
              >
                <Shield className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                <span>{guarantee}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickVerdictBoxProps {
  pros: string[];
  cons: string[];
  bestFor: string;
  pricing: string;
  affiliateUrl: string;
  productName: string;
}

export function QuickVerdictBox({
  pros,
  cons,
  bestFor,
  pricing,
  affiliateUrl,
  productName,
}: QuickVerdictBoxProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm my-8 p-6 md:p-8 rounded-2xl">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
          <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
        </div>
        Quick Verdict
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pros */}
        <div className="rounded-xl p-4 border" style={{ background: 'rgba(26,107,58,0.05)', borderColor: 'rgba(26,107,58,0.2)' }}>
          <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-green)' }}>
            <Check className="h-4 w-4" /> Pros
          </h4>
          <ul className="space-y-2">
            {pros.map((pro, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--sfp-green)' }} />
                <span style={{ color: 'var(--sfp-ink)' }}>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="rounded-xl p-4 border" style={{ background: 'rgba(214,64,69,0.05)', borderColor: 'rgba(214,64,69,0.2)' }}>
          <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-red)' }}>
            <span style={{ color: 'var(--sfp-red)' }}>&#10005;</span> Cons
          </h4>
          <ul className="space-y-2">
            {cons.map((con, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="mt-0.5 shrink-0" style={{ color: 'var(--sfp-red)' }}>&#10005;</span>
                <span style={{ color: 'var(--sfp-ink)' }}>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 grid sm:grid-cols-2 gap-4">
        <div>
          <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Best For:</span>
          <p className="font-medium mt-1" style={{ color: 'var(--sfp-ink)' }}>{bestFor}</p>
        </div>
        <div>
          <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Pricing:</span>
          <p className="font-medium mt-1" style={{ color: 'var(--sfp-navy)' }}>{pricing}</p>
        </div>
      </div>

      <Button
        asChild
        className="w-full mt-6 gap-2 border-0 shadow-lg text-white"
        style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
      >
        <Link href={affiliateUrl} target="_blank" rel="noopener sponsored">
          Try {productName} Free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

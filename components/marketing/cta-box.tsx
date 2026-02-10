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
          ? 'glass-card border-emerald-500/40 shadow-lg shadow-emerald-500/10'
          : variant === 'dark'
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700'
          : 'glass-card'
      }`}
    >
      {/* Background glow for highlight variant */}
      {variant === 'highlight' && (
        <div className="absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px]" />
        </div>
      )}

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-emerald-400" />
        </div>

        <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white">
          {headline}
        </h3>

        {description && (
          <p className="mb-8 text-slate-400 max-w-xl mx-auto leading-relaxed">
            {description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25 gap-2 px-8"
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
              className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600"
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
                className="flex items-center gap-2 text-sm text-slate-500"
              >
                <Shield className="h-4 w-4 text-emerald-500/70" />
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
    <div className="glass-card my-8 p-6 md:p-8 rounded-2xl">
      <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-emerald-400" />
        </div>
        Quick Verdict
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pros */}
        <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
          <h4 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <Check className="h-4 w-4" /> Pros
          </h4>
          <ul className="space-y-2">
            {pros.map((pro, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
          <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
            <span className="text-red-400">✕</span> Cons
          </h4>
          <ul className="space-y-2">
            {cons.map((con, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                <span className="text-slate-300">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-700/50 grid sm:grid-cols-2 gap-4">
        <div>
          <span className="text-sm text-slate-500">Best For:</span>
          <p className="font-medium text-white mt-1">{bestFor}</p>
        </div>
        <div>
          <span className="text-sm text-slate-500">Pricing:</span>
          <p className="font-medium gradient-text mt-1">{pricing}</p>
        </div>
      </div>

      <Button
        asChild
        className="w-full mt-6 btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25 gap-2"
      >
        <Link href={affiliateUrl} target="_blank" rel="noopener sponsored">
          Try {productName} Free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

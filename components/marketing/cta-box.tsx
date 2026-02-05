import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Check, Shield } from 'lucide-react';

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
  const bgClasses = {
    default: 'bg-muted',
    highlight: 'bg-primary/5 border-primary/20',
    dark: 'bg-primary text-primary-foreground',
  };

  return (
    <Card className={`${bgClasses[variant]} border-2`}>
      <CardContent className="p-8 text-center">
        <h3
          className={`text-2xl font-bold mb-2 ${
            variant === 'dark' ? 'text-primary-foreground' : ''
          }`}
        >
          {headline}
        </h3>

        {description && (
          <p
            className={`mb-6 ${
              variant === 'dark'
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground'
            }`}
          >
            {description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            variant={variant === 'dark' ? 'secondary' : 'default'}
            className="gap-2"
          >
            <Link href={primaryCta.href}>
              {primaryCta.text}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          {secondaryCta && (
            <Button
              asChild
              variant={variant === 'dark' ? 'outline' : 'ghost'}
              size="lg"
            >
              <Link href={secondaryCta.href}>{secondaryCta.text}</Link>
            </Button>
          )}
        </div>

        {guarantees.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {guarantees.map((guarantee) => (
              <div
                key={guarantee}
                className={`flex items-center gap-1 text-sm ${
                  variant === 'dark'
                    ? 'text-primary-foreground/80'
                    : 'text-muted-foreground'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>{guarantee}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
    <Card className="bg-muted/50 border-2">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4">Quick Verdict</h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pros */}
          <div>
            <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-1">
              <Check className="h-4 w-4" /> Pros
            </h4>
            <ul className="space-y-1">
              {pros.map((pro, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div>
            <h4 className="font-semibold text-red-600 mb-2">Cons</h4>
            <ul className="space-y-1">
              {cons.map((con, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-red-500 mt-0.5 shrink-0">✕</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t grid sm:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">Best For:</span>
            <p className="font-medium">{bestFor}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Pricing:</span>
            <p className="font-medium">{pricing}</p>
          </div>
        </div>

        <Button asChild className="w-full mt-4 gap-2">
          <Link href={affiliateUrl}>
            Try {productName} Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

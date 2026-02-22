import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Hero } from '@/components/marketing/hero';
import { UKBrokerHeroSlider } from '@/components/home/uk-broker-hero-slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Shield,
  TrendingUp,
  Building,
  DollarSign,
  ArrowRight,
  CreditCard,
  Landmark,
  Home,
  PiggyBank,
  Coins,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  isValidMarket,
  Market,
  marketConfig,
  marketCategories,
  categoryConfig,
} from '@/lib/i18n/config';
import { generateAlternates } from '@/lib/seo/hreflang';

interface MarketPageProps {
  params: Promise<{ market: string }>;
}

const categoryIcons: Record<string, typeof Sparkles> = {
  'ai-tools': Sparkles,
  cybersecurity: Shield,
  trading: TrendingUp,
  forex: DollarSign,
  'personal-finance': DollarSign,
  'business-banking': Building,
  'credit-repair': CreditCard,
  'debt-relief': Wallet,
  'credit-score': Zap,
  remortgaging: Home,
  'cost-of-living': PiggyBank,
  savings: PiggyBank,
  superannuation: Landmark,
  'gold-investing': Coins,
  'tax-efficient-investing': TrendingUp,
  housing: Home,
};

const categoryColors: Record<string, { text: string; bg: string }> = {
  'ai-tools': { text: 'text-purple-500', bg: 'bg-purple-500/10' },
  cybersecurity: { text: 'text-blue-500', bg: 'bg-blue-500/10' },
  trading: { text: 'text-green-500', bg: 'bg-green-500/10' },
  forex: { text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  'personal-finance': { text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'business-banking': { text: 'text-blue-500', bg: 'bg-blue-500/10' },
  'credit-repair': { text: 'text-orange-500', bg: 'bg-orange-500/10' },
  'debt-relief': { text: 'text-red-500', bg: 'bg-red-500/10' },
  'credit-score': { text: 'text-blue-500', bg: 'bg-blue-500/10' },
  remortgaging: { text: 'text-teal-500', bg: 'bg-teal-500/10' },
  'cost-of-living': { text: 'text-amber-500', bg: 'bg-amber-500/10' },
  savings: { text: 'text-lime-500', bg: 'bg-lime-500/10' },
  superannuation: { text: 'text-sky-500', bg: 'bg-sky-500/10' },
  'gold-investing': { text: 'text-yellow-600', bg: 'bg-yellow-600/10' },
  'tax-efficient-investing': { text: 'text-rose-500', bg: 'bg-rose-500/10' },
  housing: { text: 'text-stone-500', bg: 'bg-stone-500/10' },
};

export async function generateMetadata({
  params,
}: MarketPageProps): Promise<Metadata> {
  const { market } = await params;

  if (!isValidMarket(market)) {
    return {};
  }

  const config = marketConfig[market as Market];
  const alternates = generateAlternates('/');

  return {
    title: `SmartFinPro ${config.name} - Financial Intelligence`,
    description: `Discover AI-powered tools, cybersecurity solutions, and financial products for ${config.name} professionals.`,
    alternates: {
      canonical: `/${market}`,
      languages: alternates,
    },
    openGraph: {
      locale: config.locale.replace('-', '_'),
    },
  };
}

export default async function MarketHomePage({ params }: MarketPageProps) {
  const { market } = await params;

  if (!isValidMarket(market)) {
    notFound();
  }

  const marketData = market as Market;
  const config = marketConfig[marketData];
  const categories = marketCategories[marketData];

  return (
    <>
      {/* Hero Section */}
      <Hero
        title={`Financial Intelligence for ${config.name}.`}
        subtitle={`Discover AI-powered tools, cybersecurity solutions, and trading platforms trusted by professionals across ${config.name}.`}
        primaryCta={{
          text: 'Explore Tools',
          href: `/${market}/${categories[0]}`,
        }}
        secondaryCta={{
          text: 'Start Free Trial',
          href: '/tools',
        }}
      />

      {/* UK Broker Hero Slider — Exclusive to UK Market */}
      {marketData === 'uk' && (
        <section className="py-16 sm:py-20" style={{ background: 'var(--sfp-gray)' }}>
          <div className="container mx-auto px-4">
            <UKBrokerHeroSlider />
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4">
              {config.flag} {config.name}
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              Solutions for {config.name} Businesses
            </h2>
            <p className="text-muted-foreground">
              Curated financial technology products for {config.name}{' '}
              professionals and businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => {
              const Icon = categoryIcons[category];
              const colors = categoryColors[category];
              const categoryInfo = categoryConfig[category];

              return (
                <Card
                  key={category}
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center mb-4`}
                    >
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {categoryInfo.name}
                      <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {categoryInfo.description}
                    </p>
                    <Button asChild variant="ghost" className="p-0 h-auto">
                      <Link
                        href={`/${market}/${category}`}
                        className="text-primary"
                      >
                        Explore {categoryInfo.name} →
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Market-specific content */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Trusted by {config.name} Professionals
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of finance professionals across {config.name} who use
            SmartFinPro to find the best tools and make smarter decisions.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="text-base py-2 px-4">
              {config.currency} Pricing
            </Badge>
            <Badge variant="outline" className="text-base py-2 px-4">
              Local Support
            </Badge>
            <Badge variant="outline" className="text-base py-2 px-4">
              Compliant Reviews
            </Badge>
          </div>
        </div>
      </section>
    </>
  );
}

export function generateStaticParams() {
  return [{ market: 'uk' }, { market: 'ca' }, { market: 'au' }];
}

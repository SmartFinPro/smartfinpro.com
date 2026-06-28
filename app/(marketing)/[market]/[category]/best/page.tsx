import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  isValidMarket,
  isValidCategory,
  Market,
  Category,
  marketConfig,
  categoryConfig,
  markets,
  marketCategories,
} from '@/lib/i18n/config';
import { generateAlternates, getCanonicalUrl } from '@/lib/seo/hreflang';
import {
  generateBreadcrumbSchema,
  generateBankingComparisonSchema,
  generateFAQSchema,
} from '@/lib/seo/schema';
import { getComparisonData, getComparisonRouteParams } from '@/lib/comparison/loader';
import { ComparisonEngine } from '@/components/marketing/comparison-engine';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';
import type { ProductForComparison } from '@/lib/comparison/types';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

interface ComparePageProps {
  params: Promise<{ market: string; category: string }>;
}

function isValidCombo(market: string, category: string): market is Market {
  return (
    isValidMarket(market) &&
    isValidCategory(category) &&
    marketCategories[market as Market].includes(category as Category)
  );
}

export async function generateStaticParams() {
  const params = await getComparisonRouteParams();
  return params.length > 0 ? params : [{ market: 'us', category: 'business-banking' }];
}

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { market, category } = await params;
  if (!isValidCombo(market, category)) return {};

  const categoryInfo = categoryConfig[category as Category];
  const title = `Best ${categoryInfo.name} Accounts (${new Date().getFullYear()}) — Compared`;
  const description = `Compare the best ${categoryInfo.name.toLowerCase()} options side by side. Live cost calculator, independent scores, pros and cons, and a quick match finder.`;

  const path = `/${category}/best`;
  const canonicalUrl = getCanonicalUrl(market as Market, path);

  // Only emit hreflang for markets that actually have comparison data here.
  const routeParams = await getComparisonRouteParams();
  const marketsWithData = new Set(routeParams.filter((r) => r.category === category).map((r) => r.market));
  const availableMarkets = markets.filter((m) => marketsWithData.has(m));
  const alternates = generateAlternates(path, availableMarkets.length > 0 ? availableMarkets : [market as Market]);

  return {
    title: `${title} | SmartFinPro`,
    description,
    alternates: { canonical: canonicalUrl, languages: alternates },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      locale: marketConfig[market as Market].locale.replace('-', '_'),
    },
  };
}

function providerUrl(p: ProductForComparison, market: string, category: string): string {
  if (p.ctaMode === 'offer') return `${SITE}/go/${p.slug}`;
  if (p.ctaMode === 'review' && p.reviewSlug) return `${SITE}/${market}/${category}/${p.reviewSlug}`;
  return p.externalUrl || `${SITE}/${market}/${category}/best`;
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { market, category } = await params;
  if (!isValidCombo(market, category)) notFound();

  const products = await getComparisonData(market as Market, category as Category);
  if (products.length === 0) notFound();

  const categoryInfo = categoryConfig[category as Category];
  const year = new Date().getFullYear();
  const pageUrl = getCanonicalUrl(market as Market, `/${category}/best`);

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: `${SITE}/${market}` },
    { name: categoryInfo.name, url: `${SITE}/${market}/${category}` },
    { name: 'Best', url: pageUrl },
  ]);

  const itemList = generateBankingComparisonSchema({
    title: `Best ${categoryInfo.name} Accounts (${year})`,
    description: `Independent side-by-side comparison of the best ${categoryInfo.name.toLowerCase()} providers.`,
    url: pageUrl,
    products: products.map((p) => ({
      name: p.displayName,
      description: p.tagline || p.verdict || undefined,
      features: p.pros,
      url: providerUrl(p, market, category),
      areaServed: [market.toUpperCase()],
    })),
  });

  const faq = generateFAQSchema([
    {
      question: 'How is "Cost / yr for you" calculated?',
      answer:
        "We multiply each provider's monthly fee by 12, add your foreign spend times the FX fee, and add your ATM withdrawals times the per-withdrawal fee. Move the sliders to see your personal annual cost — the ranking updates live.",
    },
    {
      question: 'How does SmartFinPro rank these providers?',
      answer:
        'Our Smart Rank blends our independent editorial score, your calculated annual cost, signup bonuses and anonymised popularity. The order re-ranks live as you change your usage and never depends on commissions.',
    },
    {
      question: 'Are the links on this page affiliate links?',
      answer:
        'Some are. When you open an account through a "View offer" link we may earn a commission at no extra cost to you. This never affects the ranking or our editorial verdicts. Providers without an affiliate partnership are still listed for fair comparison.',
    },
  ]);

  return (
    <div style={{ background: 'var(--sfp-gray)' }}>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
          Best {categoryInfo.name} accounts for {year}
        </h1>
        <p className="mt-2 mb-6 text-base" style={{ color: 'var(--sfp-slate)' }}>
          {products.length} {market.toUpperCase()} providers compared side by side — with a live cost calculator,
          independent scores, pros and cons, and a quick match finder.
        </p>

        <AffiliateDisclosure market={market as Market} position="top" />

        <ComparisonEngine products={products} market={market as Market} category={category as Category} />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </div>
  );
}

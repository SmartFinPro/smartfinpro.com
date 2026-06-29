// app/(marketing)/[market]/[category]/best/[topic]/page.tsx
// Comparison Cockpit route — one reusable page per (market, category, topic).
// SSGs from getCockpitRouteParams; renders the pre-ordered providers + JSON-LD;
// mounts the interactive <ComparisonCockpit> (wrapped in Suspense for URL state).

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  isValidMarket,
  isValidCategory,
  marketConfig,
  categoryConfig,
  markets,
  marketCategories,
  type Market,
  type Category,
} from '@/lib/i18n/config';
import { generateAlternates, getCanonicalUrl } from '@/lib/seo/hreflang';
import {
  generateBreadcrumbSchema,
  generateComparisonItemListSchema,
  generateFAQSchema,
} from '@/lib/seo/schema';
import { getCockpitData, getCockpitRouteParams } from '@/lib/comparison/loader';
import { getTopicConfig } from '@/lib/comparison/topics/index';
import { ComparisonCockpit } from '@/components/marketing/comparison-cockpit';
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure';
import type { ProductForComparison } from '@/lib/comparison/types';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

interface CockpitPageProps {
  params: Promise<{ market: string; category: string; topic: string }>;
}

function isValidCombo(market: string, category: string): market is Market {
  return (
    isValidMarket(market) &&
    isValidCategory(category) &&
    marketCategories[market as Market].includes(category as Category)
  );
}

function providerUrl(p: ProductForComparison, market: string, category: string, topic: string): string {
  if (p.ctaMode === 'offer') return `${SITE}/go/${p.slug}`;
  if (p.ctaMode === 'review' && p.reviewSlug) return `${SITE}/${market}/${category}/${p.reviewSlug}`;
  return p.externalUrl || `${SITE}/${market}/${category}/best/${topic}`;
}

export async function generateStaticParams() {
  const params = await getCockpitRouteParams();
  return params.length > 0
    ? params
    : [{ market: 'us', category: 'personal-finance', topic: 'robo-advisors' }];
}

export async function generateMetadata({ params }: CockpitPageProps): Promise<Metadata> {
  const { market, category, topic } = await params;
  if (!isValidCombo(market, category)) return {};
  const config = getTopicConfig(category, topic);
  if (!config) return {};

  const year = new Date().getFullYear();
  const path = `/${category}/best/${topic}`;
  const canonicalUrl = getCanonicalUrl(market as Market, path);

  // hreflang only for markets that actually have this (category, topic).
  const routeParams = await getCockpitRouteParams();
  const availableMarkets = markets.filter((m) =>
    routeParams.some((r) => r.market === m && r.category === category && r.topic === topic),
  );
  const alternates = generateAlternates(
    path,
    availableMarkets.length > 0 ? availableMarkets : [market as Market],
  );

  const title = config.metaTitle(year);
  const description = config.metaDescription(year);

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

export default async function CockpitPage({ params }: CockpitPageProps) {
  const { market, category, topic } = await params;
  if (!isValidCombo(market, category)) notFound();
  const config = getTopicConfig(category, topic);
  if (!config) notFound();

  const products = await getCockpitData(market as Market, category as Category, topic);
  if (products.length === 0) notFound();

  const year = new Date().getFullYear();
  const pageUrl = getCanonicalUrl(market as Market, `/${category}/best/${topic}`);

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: `${SITE}/${market}` },
    { name: categoryConfig[category as Category].name, url: `${SITE}/${market}/${category}` },
    { name: config.label, url: pageUrl },
  ]);
  const itemList = generateComparisonItemListSchema({
    title: config.metaTitle(year),
    description: config.intro,
    url: pageUrl,
    products: products.map((p) => ({
      name: p.displayName,
      description: p.tagline || p.verdict || undefined,
      features: p.pros,
      url: providerUrl(p, market, category, topic),
      areaServed: [market.toUpperCase()],
    })),
  });
  const faq = generateFAQSchema(config.faq.map((f) => ({ question: f.q, answer: f.a })));

  return (
    <div style={{ background: 'var(--sfp-gray)' }}>
      <div className="mx-auto max-w-4xl px-4 pt-10">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
          {config.h1(year)}
        </h1>
        <p className="mt-2 text-base" style={{ color: 'var(--sfp-slate)' }}>
          {config.intro}
        </p>
        <div className="mt-4">
          <AffiliateDisclosure market={market as Market} position="top" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-4">
        <Suspense fallback={null}>
          <ComparisonCockpit
            products={products}
            market={market as Market}
            category={category as Category}
            topic={topic}
          />
        </Suspense>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </div>
  );
}

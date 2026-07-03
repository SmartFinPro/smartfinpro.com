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
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateComparisonItemListSchema,
  generateFAQSchema,
  generatePersonSchema,
} from '@/lib/seo/schema';
import { getCockpitData, getCockpitRouteParams } from '@/lib/comparison/loader';
import { getTopicConfig } from '@/lib/comparison/topics/index';
import { BEST_X_MANIFEST } from '@/lib/comparison/topics/manifest';
import { getMarketExpert } from '@/lib/actions/experts';
import { ComparisonCockpit } from '@/components/marketing/comparison-cockpit';
import { CockpitHero, CockpitBody } from '@/components/marketing/cockpit-content';
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
  // External-first: the provider's own site always exists; some review slugs have no
  // MDX yet, so review-first would emit 404s in JSON-LD/verdict links.
  if (p.externalUrl) return p.externalUrl;
  if (p.reviewSlug) return `${SITE}/${market}/${category}/${p.reviewSlug}`;
  return `${SITE}/${market}/${category}/best/${topic}`;
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

  // Article dates: publishDate from config; modifiedDate from the latest source re-verify.
  const products = await getCockpitData(market as Market, category as Category, topic);
  const expert = await getMarketExpert(market as Market, category as Category);
  const latestVerified =
    products.map((p) => p.dataVerifiedAt).filter(Boolean).sort().at(-1) ?? config.publishedDate;
  // Never let dateModified precede datePublished (invalid Article schema).
  const modified = latestVerified < config.publishedDate ? config.publishedDate : latestVerified;

  return {
    // Bare title — the root layout template ('%s | SmartFinPro') adds the brand
    // suffix exactly once (was doubled: "… | SmartFinPro | SmartFinPro").
    title,
    description,
    alternates: { canonical: canonicalUrl, languages: alternates },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      locale: marketConfig[market as Market].locale.replace('-', '_'),
      publishedTime: config.publishedDate,
      modifiedTime: modified,
      authors: [expert.name],
      // No explicit `images` here — an explicit openGraph.images shadows the
      // file-convention opengraph-image.tsx route entirely (verified empirically:
      // with this field set, og:image kept pointing at the static /og-image.png
      // fallback). Omitting it lets Next.js auto-inject the dynamic per-topic image.
    },
    twitter: { card: 'summary_large_image', title, description },
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

  const expert = await getMarketExpert(market as Market, category as Category);
  const latestVerified =
    products.map((p) => p.dataVerifiedAt).filter(Boolean).sort().at(-1) ?? config.publishedDate;
  // Never let dateModified precede datePublished (invalid Article schema).
  const modified = latestVerified < config.publishedDate ? config.publishedDate : latestVerified;

  const heroImage =
    BEST_X_MANIFEST.find((e) => e.market === market && e.category === category && e.topic === topic)?.image ?? null;

  const article = generateArticleSchema({
    title: config.metaTitle(year),
    description: config.metaDescription(year),
    image: heroImage ? `${SITE}${heroImage}` : undefined,
    publishDate: config.publishedDate,
    modifiedDate: modified,
    author: expert.name,
    url: pageUrl,
    reviewedBy: expert.name,
    reviewedByUrl: expert.linkedin_url ?? `${SITE}/about`,
  });
  const personSchema = generatePersonSchema({
    name: expert.name,
    jobTitle: expert.role,
    credentials: expert.credentials,
    image: expert.image_url ?? undefined,
    sameAs: expert.linkedin_url ? [expert.linkedin_url] : undefined,
    url: `${SITE}/about`,
  });
  // Per-provider FinancialProduct entities are already carried as the ItemList's
  // itemListElements (above) — a standalone set would duplicate them by URL.

  return (
    <div style={{ background: 'var(--sfp-gray)' }}>
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <CockpitHero
          image={heroImage}
          imageAlt={config.label}
          categoryLabel={categoryConfig[category as Category].name}
          h1={config.h1(year)}
          intro={config.intro}
          verifiedDate={modified}
          productCount={products.length}
          regulators={config.compliance.regulators}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-6">
        <Suspense fallback={null}>
          <ComparisonCockpit
            products={products}
            market={market as Market}
            category={category as Category}
            topic={topic}
          />
        </Suspense>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <CockpitBody
          label={config.label}
          methodology={config.methodology}
          buyerGuide={config.buyerGuide}
          faq={config.faq}
          reviewer={expert}
          verifiedDate={modified}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-12" id="affiliate-disclosure">
        <AffiliateDisclosure market={market as Market} position="bottom" />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
    </div>
  );
}

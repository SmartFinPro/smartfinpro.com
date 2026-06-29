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
import { getMarketExpert } from '@/lib/actions/experts';
import { ComparisonCockpit } from '@/components/marketing/comparison-cockpit';
import { CockpitVerdict, CockpitBody, type VerdictPick } from '@/components/marketing/cockpit-content';
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
  const modified =
    products.map((p) => p.dataVerifiedAt).filter(Boolean).sort().at(-1) ?? config.publishedDate;

  return {
    title: `${title} | SmartFinPro`,
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
  const modified =
    products.map((p) => p.dataVerifiedAt).filter(Boolean).sort().at(-1) ?? config.publishedDate;

  const verdictPicks: VerdictPick[] = products.slice(0, 3).map((p, i) => ({
    rank: i + 1,
    name: p.displayName,
    why: p.verdict ?? p.tagline,
    rating: p.rating,
    href: providerUrl(p, market, category, topic),
    external: p.ctaMode !== 'offer' && !!p.externalUrl,
    ctaLabel: p.ctaMode === 'offer' ? 'View offer' : p.externalUrl ? 'Visit site' : 'Read review',
  }));

  const article = generateArticleSchema({
    title: config.metaTitle(year),
    description: config.metaDescription(year),
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
      <div className="mx-auto max-w-4xl px-4 pt-10">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--sfp-ink)' }}>
          {config.h1(year)}
        </h1>
        <p className="mt-2 text-base" style={{ color: 'var(--sfp-slate)' }}>
          {config.intro}
        </p>
        <p className="mt-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>
          Advertising disclosure: some links may earn us a commission at no cost to you — it never affects our rankings.{' '}
          <a href="#affiliate-disclosure" className="underline" style={{ color: 'var(--sfp-navy)' }}>
            Details
          </a>
        </p>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-4">
        <CockpitVerdict
          intro={config.verdict.intro}
          picks={verdictPicks}
          verifiedDate={modified}
          reviewerName={expert.name}
          reviewerCredential={expert.credentials?.[0]}
          productCount={products.length}
          regulators={config.compliance.regulators}
          complianceNotice={config.compliance.notice}
        />
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

      <div className="mx-auto max-w-4xl px-4">
        <CockpitBody
          label={config.label}
          methodology={config.methodology}
          buyerGuide={config.buyerGuide}
          faq={config.faq}
          reviewer={expert}
          verifiedDate={modified}
        />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-12" id="affiliate-disclosure">
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

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  isValidMarket,
  Market,
  marketConfig,
  marketCategories,
} from '@/lib/i18n/config';
import { generateAlternates } from '@/lib/seo/hreflang';
import { getDiscoveryCatalog } from '@/lib/research/catalog';
import Hero from '@/components/marketing/hero';
import UKBrokerHeroSlider from '@/components/home/uk-broker-hero-slider';
import { WealthHorizonHeroCard } from '@/components/home/wealth-horizon-hero-card';
import { whBandGradient } from '@/lib/home/wealth-horizon-palette';
import {
  BestXIndex,
  CategoryShowcase,
  MethodologySection,
  PlatformStats,
  ComplianceBar,
  GlobalTrustSection,
  HomepageFAQSection,
} from '@/components/marketing/homepage-sections';
import { ResearchQuickFinderSection } from '@/components/marketing/research-quick-finder-section';
import { getBestXIndex } from '@/lib/comparison/loader';
import { buildBestXItemListSchema } from '@/lib/seo/best-x-item-list';
import { getMarketHomeHeroImage } from '@/lib/images/market-home-hero';
import { countLiveConcepts } from '@/lib/tools/registry';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

/* Per-market Hero content */
const marketHeroContent: Record<string, {
  title: string;
  subtitle: string;
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
}> = {
  us: {
    title: 'Find and compare the\nBest Financial\nProducts',
    subtitle: 'Compare smarter with Best-X Compare. Make confident financial decisions backed by deep research and build a stronger financial future.',
    primaryCta: { text: 'Start now', href: '#best-x-compare' },
    secondaryCta: { text: 'How We Review', href: '/integrity' },
  },
  uk: {
    // Same message as the US hero (find/compare the best, decide with confidence,
    // backed by research) — reworded per market so the 4 hero variants aren't
    // literal duplicates of each other, not just a find/replace on the country
    // name. Verb and subtitle opener differ market to market; the gold accent
    // word stays "Best" everywhere for visual consistency with the US hero.
    title: 'Compare the UK\'s\nBest Financial Products',
    subtitle: 'Compare smarter with Best-X Compare — FCA-regulated broker reviews, cybersecurity solutions and AI tools, independently researched so you can decide with confidence.',
    // Mirrors the US hero: primary CTA anchors to the Best-X tile grid now that
    // UK has live cockpit tiles (Stage 3 slice 1).
    primaryCta: { text: 'Start now', href: '#best-x-compare' },
    secondaryCta: { text: 'How We Review', href: '/integrity' },
  },
  ca: {
    title: 'Explore Canada\'s\nBest Financial Products',
    subtitle: 'Make smarter decisions with Best-X Compare — CIRO-compliant broker reviews, AI tools and financial products, independently researched so you can decide with confidence.',
    // Mirrors the US hero: primary CTA anchors to the Best-X tile grid now that
    // CA has live cockpit tiles (Stage 2 slice 1).
    primaryCta: { text: 'Start now', href: '#best-x-compare' },
    secondaryCta: { text: 'How We Review', href: '/integrity' },
  },
  au: {
    title: 'Discover Australia\'s\nBest Financial Products',
    subtitle: 'Find your best fit with Best-X Compare — ASIC-licensed broker reviews, cybersecurity solutions and AI tools, independently researched so you can decide with confidence.',
    // Mirrors the US hero: primary CTA anchors to the Best-X tile grid now that
    // AU has live cockpit tiles (Stage 1 slice 1).
    primaryCta: { text: 'Start now', href: '#best-x-compare' },
    secondaryCta: { text: 'How We Review', href: '/integrity' },
  },
};

interface MarketPageProps {
  params: Promise<{ market: string }>;
}

export async function generateMetadata({
  params,
}: MarketPageProps): Promise<Metadata> {
  const { market } = await params;

  if (!isValidMarket(market)) {
    return {};
  }

  const config = marketConfig[market as Market];
  const alternates = generateAlternates('/');

  // US gets the primary brand title, other markets get localized titles
  const isUS = market === 'us';

  // US canonical is / (no market prefix) — avoids canonical chain via /us redirect.
  // Other markets use /{market} as canonical.
  const canonicalBase = isUS ? '/' : `/${market}`;
  const canonicalUrl = isUS ? `${BASE_URL}/` : `${BASE_URL}/${market}`;

  const title = isUS
    ? 'SmartFinPro — Financial Product Reviews & Comparisons'
    : `${config.name} Financial Intelligence Hub — Expert Research Reports | SmartFinPro`;
  const description = isUS
    ? 'Discover AI-powered tools, cybersecurity solutions, and financial products for modern professionals. Expert reviews and comparisons across 4 global markets.'
    : `Discover AI-powered tools, cybersecurity solutions, and financial products for ${config.name} professionals. ${marketCategories[market as Market].length} market sectors with expert reviews.`;

  return {
    // `title: { absolute }` bypasses the root layout's `%s | SmartFinPro` template.
    // Both branches already contain the brand name once — the template would double it.
    title: { absolute: title },
    description,
    alternates: {
      canonical: canonicalBase,
      languages: alternates,
    },
    // Page-level `openGraph` fully replaces (not merges with) the layout's openGraph
    // object in Next.js metadata resolution — every field needed must be repeated here.
    openGraph: {
      type: 'website',
      locale: config.locale.replace('-', '_'),
      url: canonicalUrl,
      siteName: 'SmartFinPro',
      title,
      description,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'SmartFinPro',
        },
      ],
    },
    // Kept identical to `openGraph` so the messaging layer doesn't fork across
    // Facebook/LinkedIn (OG) vs. X (Twitter) previews.
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
      creator: '@smartfinpro',
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

  // The ONE fan-out per request (lib/research/catalog.ts's own header) — the
  // same DiscoveryCatalog the universal /research hub reads, resolved here
  // exactly once and handed to ResearchQuickFinderSection below. Replaces the
  // old market-scoped `getMarketReviews` MDX-only cache: the catalog already
  // joins reviews with qualifying Cockpit dossiers.
  const catalog = await getDiscoveryCatalog(marketData);

  const heroContent = marketHeroContent[marketData] || marketHeroContent['uk'];

  // ── Compute data for new landing page sections ──

  // Category counts — Research inventory (reviews + Cockpit dossiers), not
  // just MDX reviews, since the catalog's DiscoveryItem set is now the
  // canonical source for homepage category counts.
  const categoryCounts: Record<string, number> = {};
  for (const item of catalog.items) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }

  // Best-X Compare Index (homepage): live winners + coming-soon tiles, per market.
  const bestX = await getBestXIndex(marketData);

  // ItemList JSON-LD for non-US market homepages. The US copy is emitted by the
  // root wrapper (app/(marketing)/page.tsx) which composes this component — the
  // guard prevents a duplicate ItemList on '/'.
  const bestXItemList = marketData !== 'us' ? buildBestXItemListSchema(marketData, bestX) : null;

  // Per-market banderole gradient derived from the featured card's own palette
  // (depth → lift) so the flush band reads as the same family as the card.
  const whBandBg = whBandGradient(marketData);

  return (
    // The `<main id="main-content">` landmark is already provided by the shared
    // MarketingLayout (app/(marketing)/layout.tsx) — a second one here would
    // duplicate both the element and the id (invalid HTML, confuses a11y tree).
    <>
      {bestXItemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bestXItemList.schema) }}
        />
      )}
      {/* ═══════════════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════
          2. FEATURED WEALTH HORIZON CARD (desktop) — wide, flat band centered
             on the hero's bottom edge. Absolutely positioned (out of flow) so
             the ComplianceBar below sits FLUSH against the hero's bottom edge
             with no gap; the card straddles that junction. On mobile the
             original PlatformStats bar stays.
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative">
        <Hero
          title={heroContent.title}
          subtitle={heroContent.subtitle}
          backgroundImageSrc={getMarketHomeHeroImage(marketData)}
          primaryCta={heroContent.primaryCta}
          secondaryCta={heroContent.secondaryCta}
          hideCtas
        />
        <WealthHorizonHeroCard
          market={marketData}
          className="pointer-events-auto absolute bottom-0 left-1/2 z-20 hidden w-[700px] -translate-x-1/2 translate-y-1/2 lg:block"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2b/3. Below the hero on DESKTOP: a clean, label-free sky band flush
             against the hero's bottom edge — the featured card straddles onto
             it. On MOBILE the original PlatformStats + ComplianceBar (with the
             regulatory trust labels) are kept.
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className="hidden w-full lg:block"
        aria-hidden="true"
        style={{
          // Exact match of the top nav bar's gradient
          // (components/marketing/header.tsx), full-width — the hero is now
          // framed top + bottom by the same blue band; the card straddles it.
          // Per-market gradient derived from the card's own palette (depth →
          // lift), so the band reads as the same family as the featured card.
          background: whBandBg,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          height: '50px',
        }}
      />
      <div className="lg:hidden">
        <PlatformStats totalReviews={catalog.counts.reviewBackedCount} totalTools={countLiveConcepts()} />
        <ComplianceBar />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          4. CATEGORY SHOWCASE — 6 sectors with icons + counts
      ═══════════════════════════════════════════════════════════════ */}
      {bestX.some((t) => t.status !== 'coming_soon') ? (
        <BestXIndex market={marketData} items={bestX} />
      ) : (
        <CategoryShowcase market={marketData} categoryCounts={categoryCounts} />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          5. RESEARCH QUICK FINDER — replaces the old Report Feed + Editor's
             Picks (research-discovery-pr3 plan, Task 3; spec §9.3)
      ═══════════════════════════════════════════════════════════════ */}
      <ResearchQuickFinderSection market={marketData} catalog={catalog} />

      {/* ═══════════════════════════════════════════════════════════════
          6. GLOBAL TRUST — Markets + Regulators
      ═══════════════════════════════════════════════════════════════ */}
      <GlobalTrustSection />

      {/* ═══════════════════════════════════════════════════════════════
          6. METHODOLOGY — How We Review
      ═══════════════════════════════════════════════════════════════ */}
      <MethodologySection />

      {/* ═══════════════════════════════════════════════════════════════
          7b. FAQ — Visible Q&A + FAQPage schema (AEO)
      ═══════════════════════════════════════════════════════════════ */}
      <HomepageFAQSection market={marketData} marketName={config.name} categoryCount={categories.length} />

      {/* UK Broker Hero Slider — Exclusive to UK Market */}
      {marketData === 'uk' && (
        <section className="py-10" style={{ background: 'var(--sfp-gray)' }}>
          <div className="container mx-auto px-4">
            <UKBrokerHeroSlider />
          </div>
        </section>
      )}

    </>
  );
}

export function generateStaticParams() {
  return [{ market: 'us' }, { market: 'uk' }, { market: 'ca' }, { market: 'au' }];
}

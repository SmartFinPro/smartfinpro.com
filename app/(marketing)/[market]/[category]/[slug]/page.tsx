import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { serializeMDX } from '@/lib/mdx/serialize';
import { getContentBySlug, getAllContentSlugs, getRelatedContent, getContentByMarketAndCategory } from '@/lib/mdx';
import { isValidMarket, isValidCategory, Market, Category, marketConfig } from '@/lib/i18n/config';
import { generateAlternates, getCanonicalUrl } from '@/lib/seo/hreflang';
import { ReportLayout } from '@/components/marketing/report-layout';
import { getMarketExpert } from '@/lib/actions/experts';
import { getEnrichedCtaPartners } from '@/lib/actions/page-cta-partners';
import { rankOffersByEV } from '@/lib/actions/offer-ev';

interface ContentPageProps {
  params: Promise<{
    market: string;
    category: string;
    slug: string;
  }>;
  searchParams: Promise<{ xray?: string; [key: string]: string | undefined }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ContentPageProps): Promise<Metadata> {
  const { market, category, slug } = await params;
  const sp = await searchParams;

  if (!isValidMarket(market) || !isValidCategory(category)) {
    return {};
  }

  const content = await getContentBySlug(
    market as Market,
    category as Category,
    slug
  );

  if (!content) {
    return {};
  }

  const canonicalUrl = getCanonicalUrl(market as Market, `/${category}/${slug}`);
  const alternates = generateAlternates(`/${category}/${slug}`);

  // X-Ray Score™ share override — enrich OG tags when ?xray= is present
  let ogTitle = content.meta.seoTitle || content.meta.title;
  let ogDescription = content.meta.description;

  if (sp.xray && /^r_[a-f0-9]{8,16}$/.test(sp.xray)) {
    try {
      const { createServiceClient } = await import('@/lib/supabase/server');
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('xray_results')
        .select('xray_score, decision_label')
        .eq('result_id', sp.xray)
        .single();

      if (data) {
        const score = Number(data.xray_score);
        const label = data.decision_label || 'Analyzed';
        const productName = content.meta.title.split(' ')[0];
        ogTitle = `${productName} X-Ray Score: ${score}/100 — ${label}`;
        ogDescription = `Personalized analysis of ${productName}: scored ${score}/100 (${label}). See fit, cost, risk & value breakdown.`;
      }
    } catch {
      // X-Ray metadata non-critical — fall through to default
    }
  }

  return {
    title: content.meta.seoTitle || content.meta.title,
    description: content.meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: alternates,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      url: canonicalUrl,
      siteName: 'SmartFinPro',
      locale: marketConfig[market as Market].locale.replace('-', '_'),
      publishedTime: content.meta.publishDate,
      modifiedTime: content.meta.modifiedDate,
      authors: [content.meta.author],
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: ['/og-image.png'],
    },
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { market, category, slug } = await params;

  if (!isValidMarket(market) || !isValidCategory(category)) {
    notFound();
  }

  const content = await getContentBySlug(
    market as Market,
    category as Category,
    slug
  );

  if (!content) {
    // Check if this page was archived (soft-deleted) — redirect to replacement
    try {
      const { getArchivedRedirect } = await import('@/lib/actions/archived-pages');
      const marketPrefix = market === 'us' ? '' : `/${market}`;
      const pageUrl = `${marketPrefix}/${category}/${slug}`;
      const redirectTarget = await getArchivedRedirect(pageUrl);
      if (redirectTarget) {
        redirect(redirectTarget);
      }
    } catch (e) {
      console.warn('[archived-redirect] lookup failed:', e);
    }
    notFound();
  }

  // For review pages, use the ReportLayout (Premium Research Report style)
  if (content.meta.rating) {
    // serializeMDX separate from Promise.all — compilation errors must not crash non-MDX fetches
    let mdxSource;
    try {
      mdxSource = await serializeMDX(content.content);
    } catch (e) {
      console.error('[serialize] MDX compilation failed:', market, category, slug, e);
      notFound();
    }

    const [relatedArticles, expert, allCategoryContent, ctaPartners] = await Promise.all([
      getRelatedContent(market as Market, category as Category, slug, 3),
      getMarketExpert(market, category),
      getContentByMarketAndCategory(market as Market, category as Category),
      // URL format must match dashboard: US = no prefix, others = /market prefix
      getEnrichedCtaPartners(`${market === 'us' ? '' : `/${market}`}/${category}/${slug}`),
    ]);

    // Filter sibling reviews (exclude current + index pages)
    const siblingReviews = allCategoryContent
      .filter(item => item.slug !== slug && item.slug !== 'index' && item.meta.rating);

    // P4: Re-sort ctaPartners by Expected Value if sufficient data exists
    let rankedPartners = ctaPartners;
    try {
      const evRanked = await rankOffersByEV(market, category);
      if (evRanked && evRanked.length > 0 && ctaPartners.length > 0) {
        const evOrder = new Map(evRanked.map((e, i) => [e.slug, i]));
        rankedPartners = [...ctaPartners].sort((a, b) => {
          const aIdx = evOrder.get(a.slug) ?? 999;
          const bIdx = evOrder.get(b.slug) ?? 999;
          return aIdx - bIdx;
        });
      }
    } catch { /* EV ranking non-critical — fall through to CPA sort */ }

    return (
      <main id="main-content">
        <ReportLayout
          ctaPartners={rankedPartners}
          expert={expert}
          mdxSource={mdxSource}
          relatedArticles={relatedArticles}
          siblingReviews={siblingReviews}
          market={market as Market}
          category={category as Category}
          slug={slug}
          miniQuiz={content.meta.miniQuiz}
          review={{
            title: content.meta.seoTitle || content.meta.title,
            description: content.meta.description,
            productName: content.meta.title.split(' ')[0], // Extract product name
            category: content.meta.category,
            market: content.meta.market,
            rating: content.meta.rating,
            reviewCount: content.meta.reviewCount || 0,
            affiliateUrl: content.meta.affiliateUrl || '#',
            pros: content.meta.pros || [],
            cons: content.meta.cons || [],
            bestFor: content.meta.bestFor || '',
            pricing: content.meta.pricing || '',
            currency: content.meta.currency,
            guarantee: content.meta.guarantee,
            publishDate: content.meta.publishDate,
            modifiedDate: content.meta.modifiedDate,
            author: content.meta.author,
            reviewedBy: content.meta.reviewedBy,
            readingTime: content.readingTime?.text,
            faqs: content.meta.faqs || [],
            sections: content.meta.sections || [],
            testimonials: [],
            competitors: [],
            content: '',
          }}
        />
      </main>
    );
  }

  // For other content types (guides, articles), use the same ReportLayout in "guide mode"
  // This gives identical Two-Column Premium layout — just without rating stars, CTA buttons, and pros/cons

  // serializeMDX separate from Promise.all — compilation errors must not crash non-MDX fetches
  let mdxSource;
  try {
    mdxSource = await serializeMDX(content.content);
  } catch (e) {
    console.error('[serialize] MDX compilation failed:', market, category, slug, e);
    notFound();
  }

  const [relatedArticles, expert, allCategoryContent, ctaPartners] = await Promise.all([
    getRelatedContent(market as Market, category as Category, slug, 3),
    getMarketExpert(market, category),
    getContentByMarketAndCategory(market as Market, category as Category),
    // URL format must match dashboard: US = no prefix, others = /market prefix
    getEnrichedCtaPartners(`${market === 'us' ? '' : `/${market}`}/${category}/${slug}`),
  ]);

  // Filter sibling reviews (exclude current + index pages)
  const siblingReviews = allCategoryContent
    .filter(item => item.slug !== slug && item.slug !== 'index');

  // P4: Re-sort ctaPartners by Expected Value
  let rankedPartners = ctaPartners;
  try {
    const evRanked = await rankOffersByEV(market, category);
    if (evRanked && evRanked.length > 0 && ctaPartners.length > 0) {
      const evOrder = new Map(evRanked.map((e, i) => [e.slug, i]));
      rankedPartners = [...ctaPartners].sort((a, b) => {
        const aIdx = evOrder.get(a.slug) ?? 999;
        const bIdx = evOrder.get(b.slug) ?? 999;
        return aIdx - bIdx;
      });
    }
  } catch { /* EV ranking non-critical */ }

  return (
    <>
      <ReportLayout
        ctaPartners={rankedPartners}
        expert={expert}
        mdxSource={mdxSource}
        relatedArticles={relatedArticles}
        siblingReviews={siblingReviews}
        market={market as Market}
        category={category as Category}
        slug={slug}
        miniQuiz={content.meta.miniQuiz}
        review={{
          title: content.meta.seoTitle || content.meta.title,
          description: content.meta.description,
          productName: content.meta.title.split(':')[0].trim(), // Extract main topic
          category: content.meta.category,
          market: content.meta.market,
          rating: 0,
          reviewCount: 0,
          affiliateUrl: '#',
          pros: [],
          cons: [],
          bestFor: '',
          pricing: '',
          currency: content.meta.currency,
          publishDate: content.meta.publishDate,
          modifiedDate: content.meta.modifiedDate,
          author: content.meta.author,
          reviewedBy: content.meta.reviewedBy,
          readingTime: content.readingTime?.text,
          faqs: content.meta.faqs || [],
          sections: content.meta.sections || [],
          testimonials: [],
          competitors: [],
          content: '',
          isGuide: true,
        }}
      />
    </>
  );
}

export async function generateStaticParams() {
  const slugs = await getAllContentSlugs();

  return slugs
    .filter(({ slug }) => slug !== 'index') // Exclude pillar pages
    .map(({ market, category, slug }) => ({
      market,
      category,
      slug,
    }));
}

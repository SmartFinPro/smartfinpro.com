import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { serializeMDX } from '@/lib/mdx/serialize';
import { getContentBySlug, getAllContentSlugs, getRelatedContent, getContentByMarketAndCategory } from '@/lib/mdx';
import { isValidMarket, isValidCategory, Market, Category, marketConfig } from '@/lib/i18n/config';
import { generateAlternates, getCanonicalUrl } from '@/lib/seo/hreflang';
import { ReportLayout } from '@/components/marketing/report-layout';
import { getMarketExpert } from '@/lib/actions/experts';
import { getEnrichedCtaPartners } from '@/lib/actions/page-cta-partners';

interface ContentPageProps {
  params: Promise<{
    market: string;
    category: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ContentPageProps): Promise<Metadata> {
  const { market, category, slug } = await params;

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

  return {
    title: content.meta.seoTitle || content.meta.title,
    description: content.meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: alternates,
    },
    openGraph: {
      title: content.meta.seoTitle || content.meta.title,
      description: content.meta.description,
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
          alt: content.meta.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.meta.title,
      description: content.meta.description,
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
    } catch {
      // If archived_pages table doesn't exist yet or query fails, fall through to notFound
    }
    notFound();
  }

  // For review pages, use the ReportLayout (Premium Research Report style)
  if (content.meta.rating) {
    const [mdxSource, relatedArticles, expert, allCategoryContent, ctaPartners] = await Promise.all([
      serializeMDX(content.content),
      getRelatedContent(market as Market, category as Category, slug, 3),
      getMarketExpert(market, category),
      getContentByMarketAndCategory(market as Market, category as Category),
      // URL format must match dashboard: US = no prefix, others = /market prefix
      getEnrichedCtaPartners(`${market === 'us' ? '' : `/${market}`}/${category}/${slug}`),
    ]);

    // Filter sibling reviews (exclude current + index pages)
    const siblingReviews = allCategoryContent
      .filter(item => item.slug !== slug && item.slug !== 'index' && item.meta.rating);

    return (
      <>
        <ReportLayout
          ctaPartners={ctaPartners}
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
      </>
    );
  }

  // For other content types (guides, articles), use the same ReportLayout in "guide mode"
  // This gives identical Two-Column Premium layout — just without rating stars, CTA buttons, and pros/cons
  const [mdxSource, relatedArticles, expert, allCategoryContent, ctaPartners] = await Promise.all([
    serializeMDX(content.content),
    getRelatedContent(market as Market, category as Category, slug, 3),
    getMarketExpert(market, category),
    getContentByMarketAndCategory(market as Market, category as Category),
    // URL format must match dashboard: US = no prefix, others = /market prefix
    getEnrichedCtaPartners(`${market === 'us' ? '' : `/${market}`}/${category}/${slug}`),
  ]);

  // Filter sibling reviews (exclude current + index pages)
  const siblingReviews = allCategoryContent
    .filter(item => item.slug !== slug && item.slug !== 'index');

  return (
    <>
      <ReportLayout
        ctaPartners={ctaPartners}
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

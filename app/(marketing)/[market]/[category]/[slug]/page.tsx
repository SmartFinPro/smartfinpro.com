import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import { getContentBySlug, getAllContentSlugs, getRelatedContent } from '@/lib/mdx';
import { SafeMDX } from '@/components/content/SafeMDX';
import { isValidMarket, isValidCategory, Market, Category, marketConfig, categoryConfig } from '@/lib/i18n/config';
import { generateAlternates, getCanonicalUrl } from '@/lib/seo/hreflang';
import { generateArticleSchema, generateFAQSchema } from '@/lib/seo/schema';
import { ReviewTemplate } from '@/components/marketing/review-template';
import { CreditCardLeadPopup } from '@/components/ui/credit-card-lead-popup';
import { Breadcrumb } from '@/components/marketing/breadcrumb';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';
import { ExpertVerifier } from '@/components/marketing/expert-verifier';
import { getMarketExpert } from '@/lib/actions/experts';
import { getFirstMondayOfMonth } from '@/lib/utils/date-helpers';

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
    notFound();
  }

  // For review pages, use the ReviewTemplate with full MDX rendering
  if (content.meta.rating) {
    const mdxSource = await serialize(content.content, { mdxOptions: { remarkPlugins: [remarkGfm] } });
    const [relatedArticles, expert] = await Promise.all([
      getRelatedContent(market as Market, category as Category, slug, 3),
      getMarketExpert(market, category),
    ]);

    return (
      <>
        <ReviewTemplate
          expert={expert}
          mdxSource={mdxSource}
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
          relatedArticles={relatedArticles}
        />
        <CreditCardLeadPopup />
      </>
    );
  }

  // For other content types, render MDX directly with light trust design
  const articleUrl = getCanonicalUrl(market as Market, `/${category}/${slug}`);
  const [mdxSource, expert] = await Promise.all([
    serialize(content.content, { mdxOptions: { remarkPlugins: [remarkGfm] } }),
    getMarketExpert(market, category),
  ]);

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateArticleSchema({
              title: content.meta.title,
              description: content.meta.description,
              publishDate: content.meta.publishDate || new Date().toISOString(),
              modifiedDate: content.meta.modifiedDate || new Date().toISOString(),
              author: content.meta.author || 'SmartFinPro',
              url: articleUrl,
            })),
          }}
        />
        {content.meta.faqs && content.meta.faqs.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateFAQSchema(content.meta.faqs)),
            }}
          />
        )}
        <div className="container mx-auto px-4 py-16">
          {/* Auto-generated breadcrumbs */}
          <div className="max-w-4xl mx-auto mb-8">
            <Breadcrumb
              items={buildBreadcrumbs(
                market as Market,
                category as Category,
                content.meta.title,
                slug,
              )}
            />
          </div>
          <article className="max-w-4xl mx-auto prose prose-lg max-w-none">
            {!content.meta.customH1 && <h1 style={{ color: 'var(--sfp-ink)' }}>{content.meta.title}</h1>}
            <SafeMDX source={mdxSource} />
          </article>

          {/* Auto-Injected Expert Verifier — EEAT Trust Signal */}
          <div className="max-w-4xl mx-auto mt-12">
            <ExpertVerifier
              name={expert.name}
              title={expert.role}
              credentials={expert.credentials.length > 0 ? expert.credentials : ['Expert Reviewer']}
              lastFactChecked={getFirstMondayOfMonth()}
              bio={expert.bio || undefined}
              image={expert.image_url || undefined}
              linkedInUrl={expert.linkedin_url || undefined}
              variant="compact"
            />
          </div>
        </div>
      </div>
      <CreditCardLeadPopup />
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

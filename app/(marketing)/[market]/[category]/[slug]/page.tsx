import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getContentBySlug, getAllContentSlugs, getRelatedContent } from '@/lib/mdx';
import { mdxComponents } from '@/lib/mdx/components';
import { isValidMarket, isValidCategory, Market, Category, marketConfig } from '@/lib/i18n/config';
import { generateAlternates, getCanonicalUrl } from '@/lib/seo/hreflang';
import { generateArticleSchema } from '@/lib/seo/schema';
import { ReviewTemplate } from '@/components/marketing/review-template';
import { CreditCardLeadPopup } from '@/components/ui/credit-card-lead-popup';

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
    title: content.meta.title,
    description: content.meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: alternates,
    },
    openGraph: {
      title: content.meta.title,
      description: content.meta.description,
      type: 'article',
      locale: marketConfig[market as Market].locale.replace('-', '_'),
      publishedTime: content.meta.publishDate,
      modifiedTime: content.meta.modifiedDate,
      authors: [content.meta.author],
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

  // For review pages, use the ReviewTemplate
  if (content.meta.rating) {
    const relatedArticles = await getRelatedContent(
      market as Market,
      category as Category,
      slug,
      3
    );

    return (
      <>
        <ReviewTemplate
          review={{
            title: content.meta.title,
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
            guarantee: content.meta.guarantee,
            publishDate: content.meta.publishDate,
            modifiedDate: content.meta.modifiedDate,
            author: content.meta.author,
            reviewedBy: content.meta.reviewedBy,
            faqs: content.meta.faqs || [],
            sections: content.meta.sections || [],
            testimonials: [],
            competitors: [],
            content: '', // Will be rendered via MDX below
          }}
          relatedArticles={relatedArticles}
        />
        <CreditCardLeadPopup />
      </>
    );
  }

  // For other content types, render MDX directly with dark theme
  const articleUrl = getCanonicalUrl(market as Market, `/${category}/${slug}`);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
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
        <div className="container mx-auto px-4 py-16">
          <article className="max-w-4xl mx-auto prose prose-lg prose-invert prose-headings:text-white prose-p:text-slate-400 prose-a:text-emerald-400 prose-strong:text-white prose-code:text-emerald-400 prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-slate-800">
            <h1 className="gradient-text">{content.meta.title}</h1>
            <MDXRemote source={content.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
          </article>
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

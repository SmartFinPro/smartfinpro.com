import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleSchema, BreadcrumbSchema } from '@/components/seo';
import { ResearchLayout } from '@/components/research/research-layout';
import { serializeMDX } from '@/lib/mdx/serialize';
import { getAllResearchSlugs, getResearchBySlug } from '@/lib/research';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

interface ResearchDetailPageProps {
  params: Promise<{
    sector: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return getAllResearchSlugs();
}

export async function generateMetadata({
  params,
}: ResearchDetailPageProps): Promise<Metadata> {
  const { sector, slug } = await params;
  const item = await getResearchBySlug(sector, slug);

  if (!item) {
    return {};
  }

  const canonicalUrl = `${BASE_URL}/research/${sector}/${slug}`;
  const title = item.meta.seoTitle || item.meta.title;

  return {
    title,
    description: item.meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: canonicalUrl,
        'x-default': canonicalUrl,
      },
    },
    openGraph: {
      title,
      description: item.meta.description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'SmartFinPro',
      locale: 'en_US',
      publishedTime: item.meta.publishDate,
      modifiedTime: item.meta.modifiedDate,
      authors: [item.meta.author],
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: item.meta.description,
      images: ['/og-image.png'],
    },
  };
}

export default async function ResearchDetailPage({
  params,
}: ResearchDetailPageProps) {
  const { sector, slug } = await params;
  const item = await getResearchBySlug(sector, slug);

  if (!item) {
    notFound();
  }

  let mdxSource;
  try {
    mdxSource = await serializeMDX(item.content, { frontmatter: item.meta });
  } catch (error) {
    console.error('[research] MDX compilation failed:', sector, slug, error);
    notFound();
  }

  const canonicalUrl = `${BASE_URL}/research/${sector}/${slug}`;
  const breadcrumbItems = [
    { name: 'SmartFinPro', url: BASE_URL },
    { name: 'Research', url: `${BASE_URL}/research` },
    { name: sector.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '), url: `${BASE_URL}/research/${sector}` },
    { name: item.meta.title, url: canonicalUrl },
  ];

  return (
    <>
      <ArticleSchema
        title={item.meta.seoTitle || item.meta.title}
        description={item.meta.description}
        publishDate={item.meta.publishDate}
        modifiedDate={item.meta.modifiedDate}
        author={item.meta.author}
        url={canonicalUrl}
        reviewedBy={item.meta.reviewedBy}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      <main id="main-content">
        <ResearchLayout item={item} mdxSource={mdxSource} />
      </main>
    </>
  );
}

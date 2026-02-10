import type { ReviewData, FAQ, Product } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SmartFinPro',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [
      'https://twitter.com/smartfinpro',
      'https://linkedin.com/company/smartfinpro',
      'https://youtube.com/@smartfinpro',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@smartfinpro.com',
    },
  };
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SmartFinPro',
    url: BASE_URL,
    description: 'Financial Intelligence for Modern Professionals. Expert reviews, AI-powered tools, and trading platforms trusted by 50,000+ professionals.',
    publisher: {
      '@type': 'Organization',
      name: 'SmartFinPro',
    },
  };
}

export function generateReviewSchema(review: ReviewData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'SoftwareApplication',
      name: review.productName,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: extractPrice(review.pricing),
        priceCurrency: review.currency || 'USD',
        priceValidUntil: getNextYearDate(),
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
        reviewCount: review.reviewCount || 1,
      },
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Organization',
      name: 'SmartFinPro',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SmartFinPro',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    datePublished: review.publishDate,
    dateModified: review.modifiedDate,
    reviewBody: review.description,
    // Structured Pros and Cons for Google rich snippets
    positiveNotes: review.pros?.length ? {
      '@type': 'ItemList',
      itemListElement: review.pros.map((pro, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: pro,
      })),
    } : undefined,
    negativeNotes: review.cons?.length ? {
      '@type': 'ItemList',
      itemListElement: review.cons.map((con, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: con,
      })),
    } : undefined,
  };
}

// Helper to extract numeric price from pricing string
function extractPrice(pricing?: string): string {
  if (!pricing) return '0';
  const match = pricing.match(/[\d,.]+/);
  return match ? match[0].replace(',', '') : '0';
}

// Helper to get date one year from now for priceValidUntil
function getNextYearDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
}

export function generateFAQSchema(faqs: FAQ[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateComparisonSchema(products: Product[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: product.name,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        },
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency,
        },
      },
    })),
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  publishDate: string;
  modifiedDate: string;
  author: string;
  image?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image || `${BASE_URL}/og-image.png`,
    author: {
      '@type': 'Organization',
      name: article.author,
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SmartFinPro',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    datePublished: article.publishDate,
    dateModified: article.modifiedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
}

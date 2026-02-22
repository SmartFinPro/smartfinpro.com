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
    description: 'Financial Intelligence for Modern Professionals. Expert reviews, AI-powered tools, and trading platform comparisons across 4 global markets.',
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
      '@type': 'Person',
      name: review.author || 'SmartFinPro Editorial Team',
      url: `${BASE_URL}/about`,
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
      '@type': 'Person',
      name: article.author || 'SmartFinPro Editorial Team',
      url: `${BASE_URL}/about`,
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

/**
 * Person Schema - For author/expert profiles
 * Used to identify individual contributors and experts on the site
 */
export function generatePersonSchema(person: {
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  affiliateLinks?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: person.url || `${BASE_URL}/about`,
    image: person.image,
    jobTitle: person.jobTitle || 'Financial Expert',
    description: person.description,
    ...(person.affiliateLinks && {
      affiliation: person.affiliateLinks.map(link => ({
        '@type': 'Organization',
        url: link,
      })),
    }),
  };
}

/**
 * HowTo Schema - For problem-solution and step-by-step guides
 * Helps Google display step-by-step guides in SERPs
 */
export function generateHowToSchema(howto: {
  name: string;
  description: string;
  estimatedTime: string;
  image?: string;
  steps: Array<{
    name: string;
    description: string;
    image?: string;
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howto.name,
    description: howto.description,
    estimatedTime: howto.estimatedTime,
    image: howto.image,
    step: howto.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      description: step.description,
      image: step.image,
    })),
  };
}

/**
 * FinancialProduct Schema - For comparing financial products
 * Helps Google understand financial service offerings and features
 */
export function generateFinancialProductSchema(product: {
  name: string;
  description: string;
  brand?: string;
  rating: number;
  reviewCount: number;
  price?: string;
  priceCurrency?: string;
  features: string[];
  url?: string;
  image?: string;
  areaServed?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: product.name,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand || product.name,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      bestRating: 5,
      worstRating: 1,
      reviewCount: product.reviewCount,
    },
    ...(product.price && {
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.priceCurrency || 'USD',
      },
    }),
    url: product.url || `${BASE_URL}`,
    image: product.image || `${BASE_URL}/og-image.png`,
    areaServed: product.areaServed || ['US', 'UK', 'CA', 'AU'],
    potentialAction: {
      '@type': 'UseAction',
      target: product.url || `${BASE_URL}`,
    },
  };
}

/**
 * Product Comparison Schema - For comparison matrices
 * Helps Google understand product comparison context
 */
export function generateComparisonTableSchema(comparison: {
  title: string;
  description?: string;
  products: Array<{
    name: string;
    rating: number;
    reviewCount: number;
    price: string;
    currency: string;
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ComparisonTable',
    name: comparison.title,
    description: comparison.description,
    row: comparison.products.map((product, index) => ({
      '@type': 'TableRow',
      rowNumber: index + 1,
      cell: [
        {
          '@type': 'Cell',
          value: product.name,
        },
        {
          '@type': 'Cell',
          value: `${product.rating}/5 (${product.reviewCount} reviews)`,
        },
        {
          '@type': 'Cell',
          value: `${product.currency}${product.price}`,
        },
      ],
    })),
  };
}

/**
 * AggregateRating Schema - For standalone rating displays
 * Helps Google understand rating context on comparison pages
 */
export function generateAggregateRatingSchema(rating: {
  ratingValue: number;
  reviewCount: number;
  ratedBy?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: rating.ratingValue,
    bestRating: 5,
    worstRating: 1,
    reviewCount: rating.reviewCount,
    ratedBy: rating.ratedBy || 'SmartFinPro',
  };
}

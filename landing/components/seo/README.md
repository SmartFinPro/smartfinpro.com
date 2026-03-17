# SEO Schema.org Components

Structured data components for enhanced search engine optimization using Schema.org JSON-LD format.

## Overview

These components help Google and other search engines better understand your content, leading to:
- Rich snippets in search results
- Better SERP positioning
- Improved click-through rates (CTR)
- Enhanced knowledge graph presence

## Available Schemas

### 1. OrganizationSchema
**Purpose**: Homepage and company-level structured data
**Use Case**: Identify your business, contact info, and social profiles
**Output**: Organization rich card

```tsx
import { OrganizationSchema } from '@/components/seo';

export default function RootLayout() {
  return (
    <html>
      <head>
        <OrganizationSchema />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

### 2. WebsiteSchema
**Purpose**: Website-level metadata
**Use Case**: Define website purpose and search functionality
**Output**: Website understanding in Google

```tsx
import { WebsiteSchema } from '@/components/seo';

export default function RootLayout() {
  return (
    <html>
      <head>
        <WebsiteSchema />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

### 3. ReviewSchema
**Purpose**: Product/service review pages
**Use Case**: Display ratings and reviews in SERPs
**Output**: Rich snippet with star ratings

```tsx
import { ReviewSchema } from '@/components/seo';
import type { ReviewData } from '@/types';

export default function ReviewPage({ review }: { review: ReviewData }) {
  return (
    <>
      <ReviewSchema review={review} />
      <h1>{review.title}</h1>
      {/* Review content */}
    </>
  );
}
```

**Rich Snippet Output**:
- ⭐ 4.8/5 (2,543 reviews)
- Author: SmartFinPro
- Publication date

---

### 4. FAQSchema
**Purpose**: FAQ sections on any page
**Use Case**: Display Q&A in Google's FAQ rich snippet
**Output**: Accordion-style FAQ in SERPs

```tsx
import { FAQSchema } from '@/components/seo';
import type { FAQ } from '@/types';

export default function ReviewPage({ faqs }: { faqs: FAQ[] }) {
  return (
    <>
      <FAQSchema faqs={faqs} />
      <section>
        {faqs.map((faq) => (
          <div key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
      </section>
    </>
  );
}
```

**Rich Snippet Output**:
```
Question: How much does it cost?
Answer: Pricing starts at $10/month
```

---

### 5. BreadcrumbSchema
**Purpose**: Navigation hierarchy
**Use Case**: Improve SERP display and user navigation
**Output**: Breadcrumb navigation in SERPs

```tsx
import { BreadcrumbSchema } from '@/components/seo';

export default function ReviewPage() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://smartfinpro.com' },
    { name: 'Trading', url: 'https://smartfinpro.com/trading' },
    { name: 'eToro Review', url: 'https://smartfinpro.com/trading/etoro-review' },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <nav>{/* Display breadcrumb navigation */}</nav>
    </>
  );
}
```

**SERP Display**:
```
smartfinpro.com > Trading > eToro Review
```

---

### 6. ArticleSchema
**Purpose**: Blog posts and long-form content
**Use Case**: Better indexing and display of published content
**Output**: Article metadata in SERPs

```tsx
import { ArticleSchema } from '@/components/seo';

export default function BlogPost() {
  return (
    <>
      <ArticleSchema
        title="Complete Guide to AI Trading Tools"
        description="A comprehensive review of AI-powered trading tools..."
        publishDate="2024-01-15"
        modifiedDate="2024-02-20"
        author="John Doe"
        image="/images/header.jpg"
        url="https://smartfinpro.com/ai-trading-tools-guide"
      />
      <article>{/* Content */}</article>
    </>
  );
}
```

**Rich Snippet Output**:
- Publication date
- Author information
- Featured image
- Update date

---

### 7. PersonSchema
**Purpose**: Author and expert profiles
**Use Case**: Build author credibility and expertise signals
**Output**: Author knowledge panel (with multiple articles)

```tsx
import { PersonSchema } from '@/components/seo';

export default function AuthorPage() {
  return (
    <>
      <PersonSchema
        name="John Smith"
        jobTitle="Senior Financial Analyst"
        description="Certified financial analyst with 15+ years of trading experience"
        image="/images/john-smith.jpg"
        url="https://smartfinpro.com/author/john-smith"
      />
      <div>{/* Author bio and articles */}</div>
    </>
  );
}
```

---

### 8. HowToSchema
**Purpose**: Step-by-step guides
**Use Case**: Display guides in Google's HowTo rich snippet
**Output**: Step-by-step instructions in SERPs

```tsx
import { HowToSchema } from '@/components/seo';

export default function HowToPage() {
  const steps = [
    {
      name: 'Check Regulations',
      description: 'Verify broker is regulated by FCA or CFTC',
    },
    {
      name: 'Compare Fees',
      description: 'Look at commissions, spreads, and account fees',
    },
    {
      name: 'Test Platform',
      description: 'Use demo account to test trading platform',
    },
  ];

  return (
    <>
      <HowToSchema
        name="How to Choose a Trading Broker"
        description="Complete guide to selecting the right broker for your needs"
        estimatedTime="PT15M"
        steps={steps}
      />
      <article>{/* Guide content */}</article>
    </>
  );
}
```

**Rich Snippet Output**:
```
HOW TO: How to Choose a Trading Broker (15 mins)
Step 1: Check Regulations
Step 2: Compare Fees
Step 3: Test Platform
```

---

### 9. FinancialProductSchema
**Purpose**: Trading platforms, brokers, financial services
**Use Case**: Enhanced display of financial products in SERPs
**Output**: Product knowledge panel with ratings and features

```tsx
import { FinancialProductSchema } from '@/components/seo';

export default function BrokerPage() {
  return (
    <>
      <FinancialProductSchema
        name="Interactive Brokers"
        description="Advanced trading platform for active traders"
        brand="Interactive Brokers LLC"
        rating={4.7}
        reviewCount={2543}
        price="0"
        priceCurrency="USD"
        features={['Commission-free stocks', 'Options trading', 'Forex', 'Crypto']}
        url="https://smartfinpro.com/trading/interactive-brokers"
        areaServed={['US', 'UK', 'CA', 'AU']}
      />
      <div>{/* Product content */}</div>
    </>
  );
}
```

**Knowledge Panel Output**:
- Product name and rating
- Price information
- Key features list
- Available regions

---

### 10. ComparisonSchema
**Purpose**: Product comparison tables
**Use Case**: Display comparison data with context
**Output**: Comparison understanding in Google

```tsx
import { ComparisonSchema } from '@/components/seo';

export default function ComparisonPage() {
  const products = [
    {
      name: 'Interactive Brokers',
      rating: 4.7,
      reviewCount: 2543,
      price: '0',
      currency: 'USD',
    },
    {
      name: 'TD Ameritrade',
      rating: 4.5,
      reviewCount: 1823,
      price: '0',
      currency: 'USD',
    },
  ];

  return (
    <>
      <ComparisonSchema
        title="Best Trading Brokers Comparison"
        description="Compare top trading platforms side-by-side"
        products={products}
      />
      <table>{/* Comparison table */}</table>
    </>
  );
}
```

---

### 11. AggregateRatingSchema
**Purpose**: Standalone rating displays
**Use Case**: Rating context on comparison pages
**Output**: Rating metadata understanding

```tsx
import { AggregateRatingSchema } from '@/components/seo';

export default function WinnerBadge() {
  return (
    <>
      <AggregateRatingSchema
        ratingValue={4.8}
        reviewCount={1250}
        ratedBy="SmartFinPro Users"
      />
      <div className="winner-badge">
        <span>⭐ 4.8/5</span>
        <span>1,250 reviews</span>
      </div>
    </>
  );
}
```

---

## Best Practices

### 1. Use in Appropriate Contexts
- **Review Pages**: ReviewSchema + FAQSchema + BreadcrumbSchema
- **Comparison Pages**: ComparisonSchema + FinancialProductSchema + BreadcrumbSchema
- **Blog Articles**: ArticleSchema + FAQSchema (if applicable)
- **How-To Guides**: HowToSchema + BreadcrumbSchema
- **Homepage**: OrganizationSchema + WebsiteSchema

### 2. Validation
Always validate your schemas using:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- [Google Structured Data Testing Tool](https://developers.google.com/search/docs/advanced/structured-data)

### 3. Schema Consistency
- Keep data in components consistent with visible page content
- Update schemas when content changes
- Use ISO 8601 date formats (YYYY-MM-DD)
- Include all optional fields that are available

### 4. Performance
- Render schema components in `<head>` when possible
- Use server components for schema generation
- Avoid rendering duplicate schemas
- Keep JSON-LD scripts minimal

### 5. Mobile Optimization
- Ensure schemas work on mobile devices
- Test with Google's Mobile-Friendly Test
- Use responsive breadcrumb data

## Integration Examples

### Review Page (Complete Example)
```tsx
import { ReviewSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';

export default function ReviewPage({ review }: { review: ReviewData }) {
  return (
    <article>
      <head>
        <ReviewSchema review={review} />
        <FAQSchema faqs={review.faqs} />
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: 'https://smartfinpro.com' },
            { name: review.category, url: `https://smartfinpro.com/${review.category}` },
            { name: review.title, url: window.location.href },
          ]}
        />
      </head>
      <h1>{review.title}</h1>
      <p>{review.description}</p>
      {/* Rest of content */}
    </article>
  );
}
```

### Comparison Page (Complete Example)
```tsx
import { ComparisonSchema, FinancialProductSchema, BreadcrumbSchema } from '@/components/seo';

export default function ComparisonPage({ products }: { products: Product[] }) {
  return (
    <section>
      <head>
        <ComparisonSchema title="Broker Comparison" products={products} />
        {products.map((product) => (
          <FinancialProductSchema key={product.name} {...product} />
        ))}
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: 'https://smartfinpro.com' },
            { name: 'Trading', url: 'https://smartfinpro.com/trading' },
            { name: 'Comparisons', url: window.location.href },
          ]}
        />
      </head>
      <h1>Top Trading Brokers</h1>
      <table>{/* Comparison table */}</table>
    </section>
  );
}
```

## Troubleshooting

### Schema Not Appearing in SERPs
1. Validate with Google Rich Results Test
2. Check that schema matches actual page content
3. Wait 2-4 weeks for Google to crawl and index
4. Ensure content meets quality guidelines

### Invalid Schema Errors
1. Check date formats (ISO 8601: YYYY-MM-DD)
2. Verify required fields are present
3. Use validator to identify specific issues
4. Check for duplicate schema types

### Low CTR Despite Valid Schema
1. Optimize snippet content (titles, descriptions)
2. Add more detailed schema data
3. Improve page content quality
4. Test different schema variations

## Resources

- [Schema.org Documentation](https://schema.org/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/advanced/structured-data)
- [JSON-LD Format](https://json-ld.org/)

## Maintenance

- Review schemas quarterly
- Update when content changes
- Monitor Google Search Console for structured data issues
- Test new schema types before rollout

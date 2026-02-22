# Schema Implementation Guide

Quick reference for implementing schemas in SmartFinPro pages.

---

## Quick Implementation Examples

### 1. Review Page (Complete)

```tsx
// app/(marketing)/us/trading/etoro-review/page.tsx

import { ReviewSchema, FAQSchema, BreadcrumbSchema, FinancialProductSchema } from '@/components/seo';

export default function eToroBrokerReview() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

  const review = {
    title: 'eToro Review 2024',
    description: 'Complete review of eToro trading platform...',
    productName: 'eToro',
    rating: 4.7,
    reviewCount: 2543,
    publishDate: '2024-01-15',
    modifiedDate: '2024-02-20',
    author: 'SmartFinPro Editorial Team',
    pros: ['Copy trading', 'Low fees', 'User-friendly'],
    cons: ['Limited asset types', 'High withdrawal fees'],
    // ... additional review data
  };

  const faqs = [
    { question: 'Is eToro regulated?', answer: 'Yes, eToro is regulated by the FCA...' },
    { question: 'How much does it cost?', answer: 'eToro charges no deposit fees...' },
  ];

  const breadcrumbs = [
    { name: 'Home', url: siteUrl },
    { name: 'Trading', url: `${siteUrl}/trading` },
    { name: 'eToro Review', url: `${siteUrl}/trading/etoro-review` },
  ];

  return (
    <>
      <head>
        <ReviewSchema review={review} />
        <FAQSchema faqs={faqs} />
        <BreadcrumbSchema items={breadcrumbs} />
        <FinancialProductSchema
          name="eToro"
          description="Popular copy trading platform"
          brand="eToro"
          rating={4.7}
          reviewCount={2543}
          features={['Copy Trading', 'CryptoCurrency', 'ETFs', 'Stocks']}
          areaServed={['US', 'UK', 'CA', 'AU']}
        />
      </head>

      <article>
        <h1>{review.title}</h1>
        {/* Review content */}
      </article>
    </>
  );
}
```

---

### 2. Comparison Page

```tsx
// app/(marketing)/tools/broker-comparison/page.tsx

import { ComparisonSchema, FinancialProductSchema, BreadcrumbSchema } from '@/components/seo';

export default function BrokerComparisonPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

  const brokers = [
    {
      name: 'Interactive Brokers',
      rating: 4.7,
      reviewCount: 2543,
      price: '0',
      currency: 'USD',
      description: 'Advanced platform for active traders',
      features: ['Commission-free', 'Low fees', 'International markets'],
    },
    {
      name: 'TD Ameritrade',
      rating: 4.5,
      reviewCount: 1823,
      price: '0',
      currency: 'USD',
      description: 'Great for beginners and professionals',
      features: ['TD Thinkorswim', 'Education', 'Paper trading'],
    },
  ];

  const breadcrumbs = [
    { name: 'Home', url: siteUrl },
    { name: 'Tools', url: `${siteUrl}/tools` },
    { name: 'Broker Comparison', url: `${siteUrl}/tools/broker-comparison` },
  ];

  return (
    <>
      <head>
        <ComparisonSchema
          title="Best Trading Brokers Comparison"
          description="Compare top trading platforms side-by-side"
          products={brokers}
        />
        {brokers.map(broker => (
          <FinancialProductSchema
            key={broker.name}
            name={broker.name}
            description={broker.description}
            rating={broker.rating}
            reviewCount={broker.reviewCount}
            price={broker.price}
            priceCurrency={broker.currency}
            features={broker.features}
          />
        ))}
        <BreadcrumbSchema items={breadcrumbs} />
      </head>

      <section>
        <h1>Best Trading Brokers</h1>
        <table>{/* Comparison table */}</table>
      </section>
    </>
  );
}
```

---

### 3. How-To Guide Page

```tsx
// app/(marketing)/trading-guides/how-to-choose-broker/page.tsx

import { HowToSchema, BreadcrumbSchema, FAQSchema } from '@/components/seo';

export default function HowToChooseBrokerPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

  const steps = [
    {
      name: 'Determine Your Trading Style',
      description: 'Identify whether you are a day trader, swing trader, or long-term investor',
    },
    {
      name: 'Check Regulatory Status',
      description: 'Verify the broker is regulated by FCA, CFTC, or equivalent authority',
    },
    {
      name: 'Compare Fees and Commissions',
      description: 'Review trading commissions, spreads, and account fees',
    },
    {
      name: 'Evaluate Platform Quality',
      description: 'Test the trading platform with a demo account',
    },
  ];

  const breadcrumbs = [
    { name: 'Home', url: siteUrl },
    { name: 'Guides', url: `${siteUrl}/guides` },
    { name: 'How to Choose a Broker', url: `${siteUrl}/guides/how-to-choose-broker` },
  ];

  const faqs = [
    { question: 'How long does it take to choose a broker?', answer: 'Typically 1-2 hours of research...' },
    { question: 'What is the most important factor?', answer: 'Regulation and security are paramount...' },
  ];

  return (
    <>
      <head>
        <HowToSchema
          name="How to Choose a Trading Broker"
          description="Complete guide to selecting the best broker for your needs"
          estimatedTime="PT30M"
          steps={steps}
        />
        <BreadcrumbSchema items={breadcrumbs} />
        <FAQSchema faqs={faqs} />
      </head>

      <article>
        <h1>How to Choose a Trading Broker</h1>
        {steps.map((step, idx) => (
          <section key={idx}>
            <h2>{step.name}</h2>
            <p>{step.description}</p>
          </section>
        ))}
      </article>
    </>
  );
}
```

---

### 4. Product Page (Singular)

```tsx
// app/(marketing)/ai-tools/chatgpt/page.tsx

import { FinancialProductSchema, ReviewSchema, BreadcrumbSchema, PersonSchema } from '@/components/seo';

export default function ChatGPTReviewPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

  const author = {
    name: 'Sarah Johnson',
    jobTitle: 'AI Research Lead',
    description: 'AI and machine learning expert with 8+ years in fintech',
    image: `${siteUrl}/images/sarah-johnson.jpg`,
    url: `${siteUrl}/author/sarah-johnson`,
  };

  const review = {
    productName: 'ChatGPT',
    title: 'ChatGPT for Financial Analysis - Review 2024',
    description: 'In-depth review of ChatGPT for financial professionals...',
    rating: 4.6,
    reviewCount: 1243,
    publishDate: '2024-01-10',
    modifiedDate: '2024-02-18',
    author: author.name,
    pros: ['Powerful AI', 'Affordable', 'Easy to use'],
    cons: ['Limited financial data', 'Occasional errors'],
  };

  const breadcrumbs = [
    { name: 'Home', url: siteUrl },
    { name: 'AI Tools', url: `${siteUrl}/ai-tools` },
    { name: 'ChatGPT Review', url: `${siteUrl}/ai-tools/chatgpt` },
  ];

  return (
    <>
      <head>
        <PersonSchema {...author} />
        <ReviewSchema review={review} />
        <FinancialProductSchema
          name="ChatGPT"
          description="AI chatbot for writing, analysis, and coding"
          brand="OpenAI"
          rating={4.6}
          reviewCount={1243}
          features={['Natural language processing', 'Code generation', 'Research assistance']}
        />
        <BreadcrumbSchema items={breadcrumbs} />
      </head>

      <article>
        <h1>{review.title}</h1>
        {/* Review content */}
      </article>
    </>
  );
}
```

---

### 5. Blog Article

```tsx
// app/(marketing)/blog/ai-trading-2024/page.tsx

import { ArticleSchema, BreadcrumbSchema, FAQSchema } from '@/components/seo';

export default function BlogArticlePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

  const article = {
    title: 'The Future of AI in Trading: 2024 Predictions',
    description: 'Expert insights into how AI is transforming the trading landscape...',
    publishDate: '2024-02-01',
    modifiedDate: '2024-02-15',
    author: 'Michael Chen',
    image: `${siteUrl}/images/ai-trading-header.jpg`,
    url: `${siteUrl}/blog/ai-trading-2024`,
  };

  const breadcrumbs = [
    { name: 'Home', url: siteUrl },
    { name: 'Blog', url: `${siteUrl}/blog` },
    { name: article.title, url: article.url },
  ];

  const faqs = [
    { question: 'Will AI replace traders?', answer: 'AI will augment, not replace human traders...' },
    { question: 'Which AI tools are best for trading?', answer: 'Popular options include ChatGPT, Copilot, and Claude...' },
  ];

  return (
    <>
      <head>
        <ArticleSchema {...article} />
        <BreadcrumbSchema items={breadcrumbs} />
        <FAQSchema faqs={faqs} />
      </head>

      <article>
        <h1>{article.title}</h1>
        {/* Blog content */}
      </article>
    </>
  );
}
```

---

## Implementation Checklist

### Before Publishing

- [ ] Schema component imported at top of file
- [ ] All required data fields populated
- [ ] Date formats are ISO 8601 (YYYY-MM-DD)
- [ ] URLs are absolute (include https://)
- [ ] Images are valid URLs
- [ ] Ratings are 0-5
- [ ] Schema renders in `<head>` tag

### Testing

- [ ] Validate with [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Check [Schema.org Validator](https://validator.schema.org/)
- [ ] Verify on mobile view
- [ ] Ensure page content matches schema data
- [ ] Test with PageSpeed Insights

### Post-Publishing

- [ ] Monitor Google Search Console
- [ ] Wait 2-4 weeks for indexing
- [ ] Verify rich snippets appear in SERPs
- [ ] Check for schema warnings/errors
- [ ] Track CTR changes

---

## Common Patterns

### Conditional Rendering

```tsx
{faqs && faqs.length > 0 && <FAQSchema faqs={faqs} />}
{review && <ReviewSchema review={review} />}
```

### Multiple Schemas on One Page

```tsx
<>
  <BreadcrumbSchema items={breadcrumbs} />
  <ReviewSchema review={review} />
  <FAQSchema faqs={faqs} />
  <FinancialProductSchema {...product} />
</>
```

### Dynamic Data

```tsx
const breadcrumbs = generateBreadcrumbs(pathname);
const schema = generateSchema(pageData);

return (
  <>
    <BreadcrumbSchema items={breadcrumbs} />
    {/* Content */}
  </>
);
```

---

## Troubleshooting

### Schema Not Appearing

1. Check component is in `<head>` tag
2. Validate data types match schema requirements
3. Ensure no syntax errors in props
4. Clear browser cache and rebuild

### Validation Errors

1. Use Google Rich Results Test for specific errors
2. Check required fields are present
3. Verify data formats (dates, URLs, numbers)
4. Review schema.org docs for field requirements

### Low CTR

1. Optimize snippet content (titles, descriptions)
2. Add more detailed schema properties
3. Improve page content quality
4. Test different variations

---

## Resources

- [Schema.org Documentation](https://schema.org/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [SMartFinPro Schema Components](./index.ts)
- [Complete Inventory](./SCHEMA-INVENTORY.md)

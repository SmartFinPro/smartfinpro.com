import { generateFAQSchema } from '@/lib/seo/schema';
import type { FAQ } from '@/types';

interface FAQSchemaProps {
  faqs: FAQ[];
}

/**
 * FAQ Schema Component
 *
 * Renders FAQPage schema for FAQ sections
 * Displays questions and answers in Google's FAQ rich snippet format
 *
 * Best for:
 * - Product review FAQ sections
 * - How-to guides with common questions
 * - Service comparison pages
 *
 * Usage:
 * ```tsx
 * <FAQSchema faqs={[
 *   { question: "How much does it cost?", answer: "Pricing starts at $10/month" }
 * ]} />
 * ```
 */
export function FAQSchema({ faqs }: FAQSchemaProps) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const schema = generateFAQSchema(faqs);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}

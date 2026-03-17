import { generateHowToSchema } from '@/lib/seo/schema';

interface HowToStep {
  name: string;
  description: string;
  image?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  estimatedTime: string;
  image?: string;
  steps: HowToStep[];
}

/**
 * HowTo Schema Component
 *
 * Renders HowTo schema for step-by-step guides
 * Displays step-by-step guides in Google SERPs with rich snippet format
 *
 * Supports:
 * - Guide name and description
 * - Estimated completion time
 * - Multiple numbered steps with descriptions and images
 *
 * Best for:
 * - How-to guides (e.g., "How to choose a broker")
 * - Tutorial content
 * - Step-by-step comparison guides
 * - Problem-solution pages
 *
 * Usage:
 * ```tsx
 * <HowToSchema
 *   name="How to Choose a Trading Broker"
 *   description="A complete guide to selecting the right broker"
 *   estimatedTime="PT15M"
 *   steps={[
 *     {
 *       name: "Check Regulations",
 *       description: "Ensure the broker is regulated by FCA or CFTC"
 *     },
 *     {
 *       name: "Compare Fees",
 *       description: "Look at commissions, spreads, and account fees"
 *     }
 *   ]}
 * />
 * ```
 */
export function HowToSchema({
  name,
  description,
  estimatedTime,
  image,
  steps,
}: HowToSchemaProps) {
  if (!steps || steps.length === 0) {
    return null;
  }

  const schema = generateHowToSchema({
    name,
    description,
    estimatedTime,
    image,
    steps,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}

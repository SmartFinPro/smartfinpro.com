// components/ui/answer-block.tsx
import { cn } from "@/lib/utils";

interface AnswerBlockProps {
  question: string;
  answer: string;
  className?: string;
}

/**
 * GEO-Optimized Answer Block Component
 *
 * Designed for Generative Engine Optimization (GEO):
 * - Concise Q&A format (max 50 words)
 * - Structured for AI parsing
 * - Prominent visual design
 * - Linked to FAQPage Schema
 *
 * Usage:
 * <AnswerBlock
 *   question="What is credit repair?"
 *   answer="Credit repair is the process of identifying and disputing errors..."
 * />
 */
export function AnswerBlock({ question, answer, className }: AnswerBlockProps) {
  return (
    <div
      className={cn(
        "answer-block my-8 rounded-lg bg-sfp-sky border-l-4 border-sfp-navy p-6",
        className
      )}
      itemScope
      itemType="https://schema.org/Question"
    >
      <h3
        className="text-lg font-semibold text-sfp-navy mb-3"
        itemProp="name"
      >
        {question}
      </h3>
      <div
        className="text-base text-sfp-ink leading-relaxed"
        itemScope
        itemType="https://schema.org/Answer"
        itemProp="acceptedAnswer"
      >
        <div itemProp="text">{answer}</div>
      </div>
    </div>
  );
}

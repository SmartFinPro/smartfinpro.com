import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Info, List, HelpCircle } from 'lucide-react';

// ============================================================
// Featured Snippet Components for Google Answer Boxes
// These components are optimized to appear in Google Featured Snippets
// ============================================================

interface DefinitionBoxProps {
  term: string;
  definition: string;
  source?: string;
}

/**
 * Definition Box - Optimized for "What is X?" searches
 * Google often pulls these for definition snippets
 */
export function DefinitionBox({ term, definition, source }: DefinitionBoxProps) {
  return (
    <Card className="my-6 border-l-4 border-l-primary bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="h-5 w-5 text-primary" />
          What is {term}?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base leading-relaxed">{definition}</p>
        {source && (
          <p className="mt-2 text-xs text-muted-foreground">Source: {source}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickAnswerProps {
  question: string;
  answer: string;
  details?: string;
}

/**
 * Quick Answer Box - For direct question-answer snippets
 * Optimized for "How to" and "What are" queries
 */
export function QuickAnswer({ question, answer, details }: QuickAnswerProps) {
  return (
    <Card className="my-6 border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <HelpCircle className="h-5 w-5 text-primary" />
          {question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-medium text-foreground">{answer}</p>
        {details && (
          <p className="mt-3 text-sm text-muted-foreground">{details}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface NumberedListProps {
  title: string;
  items: string[];
  type?: 'steps' | 'list' | 'ranking';
}

/**
 * Numbered List - For "Best X" and "How to" listicle snippets
 * Google loves numbered lists for featured snippets
 */
export function NumberedList({ title, items, type = 'list' }: NumberedListProps) {
  const getIcon = () => {
    switch (type) {
      case 'steps':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'ranking':
        return <List className="h-5 w-5 text-primary" />;
      default:
        return <List className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card className="my-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getIcon()}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <span className="text-base">{item}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

interface ComparisonSnippetProps {
  title: string;
  optionA: {
    name: string;
    pros: string[];
    bestFor: string;
  };
  optionB: {
    name: string;
    pros: string[];
    bestFor: string;
  };
  verdict: string;
}

/**
 * Comparison Snippet - For "X vs Y" searches
 * Structured for Google comparison snippets
 */
export function ComparisonSnippet({
  title,
  optionA,
  optionB,
  verdict,
}: ComparisonSnippetProps) {
  return (
    <Card className="my-6 overflow-hidden">
      <CardHeader className="bg-muted/50 pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
          <div className="p-4">
            <h4 className="font-semibold text-primary mb-2">{optionA.name}</h4>
            <ul className="space-y-1 text-sm">
              {optionA.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Best for: {optionA.bestFor}
            </p>
          </div>
          <div className="p-4">
            <h4 className="font-semibold text-primary mb-2">{optionB.name}</h4>
            <ul className="space-y-1 text-sm">
              {optionB.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Best for: {optionB.bestFor}
            </p>
          </div>
        </div>
        <div className="border-t bg-primary/5 p-4">
          <p className="text-sm">
            <span className="font-semibold">Verdict:</span> {verdict}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface KeyTakeawaysProps {
  takeaways: string[];
}

/**
 * Key Takeaways Box - Summary snippet optimization
 * Appears at top of article for quick scanning
 */
export function KeyTakeaways({ takeaways }: KeyTakeawaysProps) {
  return (
    <Card className="my-6 border-2 border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-green-800 dark:text-green-200">
          <CheckCircle className="h-5 w-5" />
          Key Takeaways
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {takeaways.map((takeaway, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface StatBoxProps {
  stats: {
    value: string;
    label: string;
    context?: string;
  }[];
  source?: string;
}

/**
 * Statistics Box - For data-driven snippets
 * Google often pulls key statistics for featured snippets
 */
export function StatBox({ stats, source }: StatBoxProps) {
  return (
    <Card className="my-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-foreground">
                {stat.label}
              </div>
              {stat.context && (
                <div className="text-xs text-muted-foreground mt-1">
                  {stat.context}
                </div>
              )}
            </div>
          ))}
        </div>
        {source && (
          <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t">
            Source: {source}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ProsConsSnippetProps {
  productName: string;
  pros: string[];
  cons: string[];
}

/**
 * Pros/Cons Snippet - For review-based snippets
 * Optimized format for product review searches
 */
export function ProsConsSnippet({ productName, pros, cons }: ProsConsSnippetProps) {
  return (
    <Card className="my-6 overflow-hidden">
      <CardHeader className="pb-2 bg-muted/30">
        <CardTitle className="text-lg">{productName}: Pros and Cons</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2">
          <div className="p-4 bg-green-50/50 dark:bg-green-950/20">
            <h4 className="font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Pros
            </h4>
            <ul className="space-y-2">
              {pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600">+</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-red-50/50 dark:bg-red-950/20">
            <h4 className="font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Cons
            </h4>
            <ul className="space-y-2">
              {cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-600">-</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

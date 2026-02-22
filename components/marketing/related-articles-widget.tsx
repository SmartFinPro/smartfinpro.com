// components/marketing/related-articles-widget.tsx
// ============================================================
// RelatedArticlesWidget — Silo-Isolated Related Articles
// Server Component that auto-loads siblings from the same
// market + category directory. Never crosses silo boundaries.
// ============================================================

import Link from 'next/link';
import { BookOpen, Star, ArrowRight } from 'lucide-react';
import { getContentByMarketAndCategory } from '@/lib/mdx';
import { categoryConfig } from '@/lib/i18n/config';
import type { Market, Category } from '@/lib/i18n/config';

interface RelatedArticlesWidgetProps {
  /** Current market (e.g. 'uk') */
  market: Market;
  /** Current category (e.g. 'trading') */
  category: Category;
  /** Current article slug — excluded from the list */
  currentSlug: string;
  /** Max articles to show (default: 3) */
  maxArticles?: number;
}

export async function RelatedArticlesWidget({
  market,
  category,
  currentSlug,
  maxArticles = 3,
}: RelatedArticlesWidgetProps) {
  // Load all articles from the SAME market + category (absolute silo isolation)
  const allArticles = await getContentByMarketAndCategory(market, category);

  // Filter out: current article, index/pillar pages, drafts
  const siblings = allArticles.filter(
    (article) =>
      article.slug !== currentSlug &&
      article.slug !== 'index' &&
      !article.slug.endsWith('.draft')
  );

  if (siblings.length === 0) return null;

  const marketPrefix = market === 'us' ? '' : `/${market}`;
  const categoryName = categoryConfig[category]?.name || category;

  // Take top articles (prefer rated, then by publish date)
  const sorted = siblings.sort((a, b) => {
    // Prefer articles with ratings
    const aRating = a.meta.rating || 0;
    const bRating = b.meta.rating || 0;
    if (bRating !== aRating) return bRating - aRating;
    // Then by date (newest first)
    return (b.meta.publishDate || '').localeCompare(a.meta.publishDate || '');
  });

  const articles = sorted.slice(0, maxArticles);

  return (
    <section className="container mx-auto px-4 mb-16">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--sfp-sky)' }}
          >
            <BookOpen className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
            More in {categoryName}
          </h2>
        </div>

        {/* Article Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`${marketPrefix}/${category}/${article.slug}`}
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 transition-all duration-300 hover:shadow-md hover:border-gray-300 group"
            >
              {/* Rating Stars */}
              {article.meta.rating && (
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.floor(article.meta.rating || 0)
                          ? 'fill-current'
                          : ''
                      }`}
                      style={{
                        color: i < Math.floor(article.meta.rating || 0)
                          ? 'var(--sfp-gold)'
                          : '#CCCCCC',
                      }}
                    />
                  ))}
                  <span className="text-xs ml-1" style={{ color: 'var(--sfp-slate)' }}>
                    {article.meta.rating}/5
                  </span>
                </div>
              )}

              {/* Title */}
              <h3
                className="font-semibold mb-2 transition-colors line-clamp-2"
                style={{ color: 'var(--sfp-ink)' }}
              >
                {article.meta.title}
              </h3>

              {/* Description */}
              <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--sfp-slate)' }}>
                {article.meta.description}
              </p>

              {/* Read More */}
              <span
                className="text-sm flex items-center gap-1"
                style={{ color: 'var(--sfp-navy)' }}
              >
                Read Review
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

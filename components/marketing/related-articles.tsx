import Link from 'next/link';
import { BookOpen, Star, ArrowRight } from 'lucide-react';
import { categoryConfig } from '@/lib/i18n/config';
import type { Market, Category } from '@/lib/i18n/config';
import type { ContentItem } from '@/lib/mdx';

interface RelatedArticlesProps {
  articles: ContentItem[];
  market: Market;
  category: Category;
}

export function RelatedArticles({ articles, market, category }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  const marketPrefix = `/${market}`;
  const categoryName = categoryConfig[category]?.name || category;

  return (
    <section className="container mx-auto px-4 mb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
            <BookOpen className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>More in {categoryName}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {articles.slice(0, 3).map((article) => (
            <Link
              key={article.slug}
              href={`${marketPrefix}/${category}/${article.slug}`}
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 transition-all duration-300 hover:shadow-md hover:border-gray-300 group"
            >
              {article.meta.rating && (
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.floor(article.meta.rating || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs ml-1" style={{ color: 'var(--sfp-slate)' }}>{article.meta.rating}/5</span>
                </div>
              )}
              <h3 className="font-semibold mb-2 transition-colors line-clamp-2" style={{ color: 'var(--sfp-ink)' }}>
                {article.meta.title}
              </h3>
              <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--sfp-slate)' }}>
                {article.meta.description}
              </p>
              <span className="text-sm flex items-center gap-1" style={{ color: 'var(--sfp-navy)' }}>
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

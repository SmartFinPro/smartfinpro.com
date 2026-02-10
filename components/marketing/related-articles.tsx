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

  const marketPrefix = market === 'us' ? '' : `/${market}`;
  const categoryName = categoryConfig[category]?.name || category;

  return (
    <section className="container mx-auto px-4 mb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
            <BookOpen className="h-5 w-5 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white">More in {categoryName}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {articles.slice(0, 3).map((article) => (
            <Link
              key={article.slug}
              href={`${marketPrefix}/${category}/${article.slug}`}
              className="glass-card rounded-xl p-5 transition-all duration-300 hover:border-cyan-500/30 group"
            >
              {article.meta.rating && (
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.floor(article.meta.rating || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-slate-500 ml-1">{article.meta.rating}/5</span>
                </div>
              )}
              <h3 className="font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                {article.meta.title}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                {article.meta.description}
              </p>
              <span className="text-sm text-cyan-400 flex items-center gap-1">
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

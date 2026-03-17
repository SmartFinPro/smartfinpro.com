'use client';

import { ProblemArticle } from '@/lib/actions/dashboard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, Clock, MousePointer, Eye, Lightbulb, TrendingDown } from 'lucide-react';

interface ProblemArticlesProps {
  data: ProblemArticle[];
}

export function ProblemArticles({ data }: ProblemArticlesProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
          <TrendingDown className="h-6 w-6 text-green-600 dark:text-green-400 rotate-180" />
        </div>
        <p className="font-medium text-green-600 dark:text-green-400">Keine Sorgenkinder!</p>
        <p className="text-xs text-muted-foreground mt-1">
          Alle Artikel performen gut oder haben zu wenig Daten
        </p>
      </div>
    );
  }

  // Format time in minutes:seconds
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getSeverityBadge = (score: number): { text: string; variant: 'destructive' | 'secondary' | 'default' } => {
    if (score >= 70) return { text: 'Kritisch', variant: 'destructive' };
    if (score >= 50) return { text: 'Hoch', variant: 'destructive' };
    if (score >= 30) return { text: 'Mittel', variant: 'secondary' };
    return { text: 'Niedrig', variant: 'default' };
  };

  // Format page title for display
  const formatTitle = (article: ProblemArticle): string => {
    if (article.page_title) {
      return article.page_title.length > 50
        ? article.page_title.slice(0, 47) + '...'
        : article.page_title;
    }
    if (article.article_slug) {
      return article.article_slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return article.page_path;
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header with explanation */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Artikel mit ungenutztem Potenzial
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
              Diese Artikel haben gutes Engagement (Lesezeit, Scroll-Tiefe), aber niedrige Affiliate-Klickraten.
              Hier liegt Optimierungspotenzial.
            </p>
          </div>
        </div>

        {/* Problem articles list */}
        <div className="space-y-3">
          {data.map((article, index) => {
            const severity = getSeverityBadge(article.opportunity_score);

            return (
              <div
                key={article.page_path}
                className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <Badge variant={severity.variant} className="text-xs">
                        {severity.text}
                      </Badge>
                      {article.category && (
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium truncate" title={article.page_title || article.page_path}>
                      {formatTitle(article)}
                    </h4>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold">{article.opportunity_score}</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                </div>

                {/* Opportunity score bar */}
                <div className="mb-3">
                  <Progress
                    value={article.opportunity_score}
                    className="h-2"
                  />
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                          <Clock className="h-3 w-3" />
                          <span className="font-semibold text-sm">{formatTime(article.avg_time_on_page)}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">Lesezeit</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Durchschnittliche Verweildauer auf der Seite</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                          <TrendingDown className="h-3 w-3 rotate-180" />
                          <span className="font-semibold text-sm">{article.avg_scroll_depth}%</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">Scroll</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Durchschnittliche Scroll-Tiefe</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                          <Eye className="h-3 w-3" />
                          <span className="font-semibold text-sm">{article.page_views}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">Views</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Seitenaufrufe im Zeitraum</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                          <MousePointer className="h-3 w-3" />
                          <span className="font-semibold text-sm">{article.ctr}%</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">CTR</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Affiliate Click-Through-Rate ({article.affiliate_clicks} Klicks)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Recommendations */}
                {article.recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    {article.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-100 dark:border-blue-900"
                      >
                        <Lightbulb className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-800 dark:text-blue-200">{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary insights */}
        <div className="p-3 bg-muted/50 rounded-lg border">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Schnelle Wins
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• CTAs oberhalb der 50%-Marke platzieren (vor dem Scroll-Abbruch)</li>
            <li>• PAS-Formel im ersten Absatz verstärken (Problem-Agitation-Solution)</li>
            <li>• Social Proof näher an CTAs positionieren</li>
            <li>• Button-Text testen: &ldquo;Jetzt sichern&rdquo; vs &ldquo;Mehr erfahren&rdquo;</li>
          </ul>
        </div>
      </div>
    </TooltipProvider>
  );
}

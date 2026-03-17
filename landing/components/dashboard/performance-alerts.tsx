'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import type { LowPerformancePage, PerformanceAlertStats } from '@/lib/actions/performance-alerts';

interface PerformanceAlertsProps {
  pages: LowPerformancePage[];
  stats: PerformanceAlertStats;
}

export function PerformanceAlerts({ pages, stats }: PerformanceAlertsProps) {
  const [expanded, setExpanded] = useState(false);
  const displayPages = expanded ? pages : pages.slice(0, 3);

  if (pages.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <TrendingDown className="h-5 w-5" />
            Performance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600 dark:text-green-400">
            All pages are performing within expected conversion ranges. No action needed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={stats.criticalPages > 0
      ? 'border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
      : 'border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
    }>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 ${
            stats.criticalPages > 0
              ? 'text-red-700 dark:text-red-300'
              : 'text-amber-700 dark:text-amber-300'
          }`}>
            {stats.criticalPages > 0 ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            Low-Performance Alerts
          </CardTitle>
          <div className="flex gap-2">
            {stats.criticalPages > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {stats.criticalPages} Critical
              </Badge>
            )}
            {stats.warningPages > 0 && (
              <Badge variant="secondary" className="bg-amber-200 text-amber-800">
                {stats.warningPages} Warning
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="mt-2">
          Pages with {'>'}100 clicks but 0 conversions need psychological optimization
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalLowPerformancePages}</p>
              <p className="text-xs text-muted-foreground">Underperforming Pages</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${stats.potentialLostRevenue.toLocaleString('en-US')}</p>
              <p className="text-xs text-muted-foreground">Est. Lost Revenue</p>
            </div>
          </div>
        </div>

        {/* Page List */}
        <div className="space-y-3">
          {displayPages.map((page, index) => (
            <div
              key={page.article_slug || index}
              className={`p-4 rounded-lg border-2 ${
                page.severity === 'critical'
                  ? 'border-red-300 bg-red-100/50 dark:border-red-800 dark:bg-red-900/20'
                  : 'border-amber-300 bg-amber-100/50 dark:border-amber-800 dark:bg-amber-900/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={page.severity === 'critical' ? 'destructive' : 'secondary'}
                      className={page.severity === 'critical' ? '' : 'bg-amber-200 text-amber-800'}
                    >
                      {page.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium truncate">
                      {page.page_title || page.article_slug}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {page.page_path}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="font-mono">
                      <span className="text-muted-foreground">Clicks:</span>{' '}
                      <span className="font-bold text-foreground">{page.total_clicks}</span>
                    </span>
                    <span className="font-mono text-red-600">
                      <span className="text-muted-foreground">Conv:</span>{' '}
                      <span className="font-bold">0</span>
                    </span>
                    <span className="font-mono text-red-600">
                      <span className="text-muted-foreground">Rate:</span>{' '}
                      <span className="font-bold">0%</span>
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <a href={page.page_path} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>

              {/* Recommendation */}
              <div className="mt-3 p-3 bg-white/70 dark:bg-black/30 rounded-md">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Empfehlung: </span>
                    {page.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expand/Collapse Button */}
        {pages.length > 3 && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Weniger anzeigen
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                {pages.length - 3} weitere Seiten anzeigen
              </>
            )}
          </Button>
        )}

        {/* Action Tips */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Quick Fixes for Low Conversion
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Prüfe CTA-Button Farbe und Platzierung (above the fold)</li>
            <li>• Füge Trust-Badges hinzu (Geld-zurück-Garantie, SSL, etc.)</li>
            <li>• Teste verschiedene Headlines mit Urgency-Elementen</li>
            <li>• Überprüfe Mobile UX auf Friction Points</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for sidebar or header notifications
 */
export function PerformanceAlertBadge({ stats }: { stats: PerformanceAlertStats }) {
  if (stats.totalLowPerformancePages === 0) return null;

  return (
    <Badge
      variant={stats.criticalPages > 0 ? 'destructive' : 'secondary'}
      className={`${
        stats.criticalPages > 0 ? 'animate-pulse' : 'bg-amber-200 text-amber-800'
      }`}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      {stats.totalLowPerformancePages} Alert{stats.totalLowPerformancePages > 1 ? 's' : ''}
    </Badge>
  );
}

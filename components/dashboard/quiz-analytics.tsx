'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  MousePointer,
  Target,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface QuizAnalyticsProps {
  data: QuizStats;
}

export interface QuizStats {
  totalStarts: number;
  totalCompletions: number;
  totalCtaClicks: number; // High-intent clicks
  completionRate: number;
  ctaClickRate: number; // Conversion from completion to CTA click
  topRecommendations: Array<{
    product: string;
    count: number;
    clickRate: number;
  }>;
  answerDistribution: {
    region: Record<string, number>;
    volume: Record<string, number>;
    focus: Record<string, number>;
  };
}

export function QuizAnalytics({ data }: QuizAnalyticsProps) {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quiz Starts
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStarts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total quiz initiations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completions
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCompletions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              High-Intent Clicks
            </CardTitle>
            <MousePointer className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {data.totalCtaClicks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.ctaClickRate.toFixed(1)}% of completions clicked CTA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quiz → Affiliate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalStarts > 0
                ? ((data.totalCtaClicks / data.totalStarts) * 100).toFixed(1)
                : '0.0'}
              %
            </div>
            <p className="text-xs text-muted-foreground">Overall conversion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quiz Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Start → Complete */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  Started Quiz
                </span>
                <span className="font-medium">{data.totalStarts.toLocaleString()}</span>
              </div>
              <Progress value={100} className="h-3" />
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            {/* Completions */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Completed Quiz
                </span>
                <span className="font-medium">
                  {data.totalCompletions.toLocaleString()} ({data.completionRate.toFixed(1)}%)
                </span>
              </div>
              <Progress value={data.completionRate} className="h-3 bg-muted [&>div]:bg-green-500" />
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            {/* High-Intent CTA Clicks */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  Clicked Affiliate CTA
                  <Badge variant="secondary" className="text-xs">High-Intent</Badge>
                </span>
                <span className="font-medium">
                  {data.totalCtaClicks.toLocaleString()} ({data.ctaClickRate.toFixed(1)}%)
                </span>
              </div>
              <Progress
                value={data.totalCompletions > 0 ? (data.totalCtaClicks / data.totalCompletions) * 100 : 0}
                className="h-3 bg-muted [&>div]:bg-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Top Quiz Recommendations</CardTitle>
          <p className="text-sm text-muted-foreground">
            Which products get recommended most and their click-through rates
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topRecommendations.length > 0 ? (
              data.topRecommendations.map((rec, index) => (
                <div key={rec.product} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{rec.product}</span>
                      <span className="text-sm text-muted-foreground">
                        {rec.count} recommendations
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={rec.clickRate} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground w-12">
                        {rec.clickRate.toFixed(0)}% CTR
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No quiz data available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Answer Distribution */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Region Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Region Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.answerDistribution.region).map(([region, count]) => (
                <div key={region} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-base">
                      {region === 'us' ? '🇺🇸' : region === 'uk' ? '🇬🇧' : region === 'ca' ? '🇨🇦' : '🇦🇺'}
                    </span>
                    {region.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
              {Object.keys(data.answerDistribution.region).length === 0 && (
                <p className="text-xs text-muted-foreground">No data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Volume Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Volume Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.answerDistribution.volume).map(([volume, count]) => {
                const labels: Record<string, string> = {
                  low: '< $10k',
                  medium: '$10k-$100k',
                  high: '$100k-$500k',
                  enterprise: '$500k+',
                };
                return (
                  <div key={volume} className="flex items-center justify-between text-sm">
                    <span>{labels[volume] || volume}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                );
              })}
              {Object.keys(data.answerDistribution.volume).length === 0 && (
                <p className="text-xs text-muted-foreground">No data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Focus Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Primary Need</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.answerDistribution.focus).map(([focus, count]) => {
                const labels: Record<string, string> = {
                  fx: 'International FX',
                  domestic: 'Domestic Ops',
                  startup: 'Startup Banking',
                  both: 'Both',
                };
                return (
                  <div key={focus} className="flex items-center justify-between text-sm">
                    <span>{labels[focus] || focus}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                );
              })}
              {Object.keys(data.answerDistribution.focus).length === 0 && (
                <p className="text-xs text-muted-foreground">No data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

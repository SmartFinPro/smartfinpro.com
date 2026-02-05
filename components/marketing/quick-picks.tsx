'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star, CheckCircle, Award } from 'lucide-react';

interface QuickPick {
  rank: number;
  name: string;
  slug: string;
  tagline: string;
  rating: number;
  price: string;
  affiliateUrl: string;
  highlight: string;
  badge?: string;
}

interface QuickPicksProps {
  picks: QuickPick[];
}

export function QuickPicks({ picks }: QuickPicksProps) {
  return (
    <div className="space-y-4 my-8">
      {picks.map((pick, index) => (
        <Card
          key={pick.slug}
          className={`overflow-hidden transition-all hover:shadow-lg ${
            index === 0
              ? 'border-2 border-primary ring-2 ring-primary/20'
              : 'hover:border-primary/50'
          }`}
        >
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Rank Badge */}
              <div
                className={`flex items-center justify-center px-6 py-4 ${
                  index === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold">#{pick.rank}</div>
                  {index === 0 && (
                    <Award className="h-5 w-5 mx-auto mt-1" />
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header with badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{pick.name}</h3>
                      {pick.badge && (
                        <Badge variant="default" className="bg-primary">
                          {pick.badge}
                        </Badge>
                      )}
                    </div>

                    {/* Tagline */}
                    <p className="text-muted-foreground mb-3">{pick.tagline}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(pick.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : i < pick.rating
                                ? 'fill-yellow-400/50 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold">{pick.rating}</span>
                      <span className="text-muted-foreground">/5</span>
                    </div>

                    {/* Highlight */}
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">{pick.highlight}</span>
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{pick.price}</div>
                      <div className="text-sm text-muted-foreground">per month</div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/ai-tools/${pick.slug}`}>
                          Read Review
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="gap-1">
                        <Link
                          href={pick.affiliateUrl}
                          target="_blank"
                          rel="noopener sponsored"
                        >
                          Try Free
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Compact version for sidebar or smaller spaces
interface CompactPickProps {
  picks: QuickPick[];
  title?: string;
}

export function CompactPicks({ picks, title = "Top Picks" }: CompactPickProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-bold mb-3">{title}</h4>
        <div className="space-y-3">
          {picks.slice(0, 3).map((pick, index) => (
            <Link
              key={pick.slug}
              href={pick.affiliateUrl}
              target="_blank"
              rel="noopener sponsored"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  index === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate group-hover:text-primary transition-colors">
                  {pick.name}
                </div>
                <div className="text-xs text-muted-foreground">{pick.price}</div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {pick.rating}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star, CheckCircle, Award, Trophy, Sparkles } from 'lucide-react';

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
    <div className="space-y-4 my-10">
      {picks.map((pick, index) => (
        <div
          key={pick.slug}
          className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-emerald-500/40 ${
            index === 0
              ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20'
              : ''
          }`}
        >
          <div className="flex flex-col md:flex-row">
            {/* Rank Badge */}
            <div
              className={`flex items-center justify-center px-6 py-5 md:min-w-[100px] ${
                index === 0
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                  : index === 1
                  ? 'bg-gradient-to-br from-slate-600 to-slate-700'
                  : 'bg-slate-800/80'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white">#{pick.rank}</div>
                {index === 0 && (
                  <Trophy className="h-5 w-5 mx-auto mt-1 text-amber-300" />
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                <div className="flex-1">
                  {/* Header with badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-white">{pick.name}</h3>
                    {pick.badge && (
                      <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {pick.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Tagline */}
                  <p className="text-slate-400 mb-4">{pick.tagline}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(pick.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : i < pick.rating
                              ? 'fill-amber-400/50 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-white">{pick.rating}</span>
                    <span className="text-slate-500">/5</span>
                  </div>

                  {/* Highlight */}
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="font-medium text-emerald-300">{pick.highlight}</span>
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="flex flex-col items-start lg:items-end gap-4 lg:min-w-[180px]">
                  <div className="lg:text-right">
                    <div className="text-2xl md:text-3xl font-bold gradient-text">{pick.price}</div>
                    <div className="text-xs text-slate-500">per month</div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                    >
                      <Link href={`/ai-tools/${pick.slug}`}>
                        Read Review
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
                    >
                      <Link
                        href={pick.affiliateUrl}
                        target="_blank"
                        rel="noopener sponsored"
                      >
                        Try Free
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
    <div className="glass-card rounded-xl p-5">
      <h4 className="font-bold text-white mb-4">{title}</h4>
      <div className="space-y-3">
        {picks.slice(0, 3).map((pick, index) => (
          <Link
            key={pick.slug}
            href={pick.affiliateUrl}
            target="_blank"
            rel="noopener sponsored"
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all group"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                index === 0
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-slate-200 group-hover:text-emerald-400 transition-colors">
                {pick.name}
              </div>
              <div className="text-xs text-slate-500">{pick.price}</div>
            </div>
            <div className="flex items-center gap-1 text-sm text-white">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {pick.rating}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

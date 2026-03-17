'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  // Derive category base path from current URL (e.g. /uk/trading → /uk/trading)
  // Remove trailing /index or /overview if present, keep market prefix + category
  const segments = pathname.split('/').filter(Boolean);
  let basePath = '';
  if (['uk', 'ca', 'au'].includes(segments[0])) {
    // Non-US market: /{market}/{category}
    basePath = `/${segments[0]}/${segments[1] || ''}`;
  } else if (segments[0] === 'us') {
    // Explicit /us/ prefix: use second segment as category
    basePath = `/${segments[1] || ''}`;
  } else {
    // US market (no prefix): /{category}
    basePath = `/${segments[0] || ''}`;
  }
  return (
    <div className="space-y-4 my-10">
      {picks.map((pick, index) => (
        <div
          key={pick.slug}
          className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${
            index === 0
              ? 'border-2 shadow-md'
              : ''
          }`}
          style={index === 0 ? { borderColor: 'var(--sfp-gold)' } : {}}
        >
          <div className="flex flex-col md:flex-row">
            {/* Rank Badge */}
            <div
              className="flex items-center justify-center px-6 py-5 md:min-w-[100px]"
              style={{
                background: index === 0
                  ? 'var(--sfp-gold)'
                  : index === 1
                  ? 'var(--sfp-navy)'
                  : 'var(--sfp-gray)',
              }}
            >
              <div className="text-center">
                <div className={`text-3xl font-bold ${index < 2 ? 'text-white' : ''}`} style={index >= 2 ? { color: 'var(--sfp-ink)' } : {}}>#{pick.rank}</div>
                {index === 0 && (
                  <Trophy className="h-5 w-5 mx-auto mt-1 text-white" />
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                <div className="flex-1">
                  {/* Header with badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>{pick.name}</h3>
                    {pick.badge && (
                      <Badge className="text-xs border" style={{ background: 'rgba(245,166,35,0.1)', borderColor: 'rgba(245,166,35,0.3)', color: 'var(--sfp-gold)' }}>
                        <Sparkles className="h-3 w-3 mr-1" />
                        {pick.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Tagline */}
                  <p style={{ color: 'var(--sfp-slate)' }} className="mb-4">{pick.tagline}</p>

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
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold" style={{ color: 'var(--sfp-ink)' }}>{pick.rating}</span>
                    <span style={{ color: 'var(--sfp-slate)' }}>/5</span>
                  </div>

                  {/* Highlight */}
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                    <span className="font-medium" style={{ color: 'var(--sfp-green)' }}>{pick.highlight}</span>
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="flex flex-col items-start lg:items-end gap-4 lg:min-w-[180px]">
                  <div className="lg:text-right">
                    <div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--sfp-navy)' }}>{pick.price}</div>
                    <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>per month</div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-gray-300 bg-white hover:bg-gray-50"
                      style={{ color: 'var(--sfp-ink)' }}
                    >
                      <Link href={`${basePath}/${pick.slug}`}>
                        Read Review
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="border-0 shadow-lg text-white"
                      style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
      <h4 className="font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>{title}</h4>
      <div className="space-y-3">
        {picks.slice(0, 3).map((pick, index) => (
          <Link
            key={pick.slug}
            href={pick.affiliateUrl}
            target="_blank"
            rel="noopener sponsored"
            className="flex items-center gap-3 p-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white"
              style={{ background: index === 0 ? 'var(--sfp-gold)' : 'var(--sfp-navy)' }}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate transition-colors" style={{ color: 'var(--sfp-ink)' }}>
                {pick.name}
              </div>
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{pick.price}</div>
            </div>
            <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--sfp-ink)' }}>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {pick.rating}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

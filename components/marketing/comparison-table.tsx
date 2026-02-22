'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight, Sparkles, Star, Trophy } from 'lucide-react';
import { StarRating } from './trust-badges';

interface ComparisonProduct {
  name: string;
  slug: string;
  rating: number;
  reviewCount: number;
  price: string;
  affiliateUrl: string;
  isRecommended?: boolean;
  winnerBadge?: string; // "Best Overall", "Best Value", "Most Popular"
  features: Record<string, boolean | string>;
}

const winnerBadgeColors: Record<string, string> = {
  'Best Overall': 'bg-[var(--sfp-green)]/10 border-[var(--sfp-green)]/20 text-[var(--sfp-green)]',
  'Best Value': 'bg-[var(--sfp-navy)]/10 border-[var(--sfp-navy)]/20 text-[var(--sfp-navy)]',
  'Most Popular': 'bg-[var(--sfp-gold)]/10 border-[var(--sfp-gold)]/20 text-[var(--sfp-gold)]',
  'Best for Beginners': 'bg-[var(--sfp-navy)]/10 border-[var(--sfp-navy)]/20 text-[var(--sfp-navy)]',
};

// MDX simplified item shape (used by new silo content)
interface ComparisonItem {
  name: string;
  rating: number;
  fee?: string;
  features: string[];
  cta?: string;
  ctaLink?: string;
}

interface ComparisonTableProps {
  /** Original API: structured products with feature maps */
  products?: ComparisonProduct[];
  featureLabels?: Record<string, string>;
  /** MDX simplified API: items with string[] features */
  items?: ComparisonItem[];
  title?: string;
}

export function ComparisonTable({
  products,
  featureLabels,
  items,
  title = 'Feature Comparison',
}: ComparisonTableProps) {
  // MDX simplified mode — items with string[] features
  if (items && !products) {
    return (
      <div className="my-10">
        {title && (
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--sfp-ink)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
              <Sparkles className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
            </div>
            {title}
          </h3>
        )}

        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
                  {items.map((item) => (
                    <TableHead key={item.name} className="text-center min-w-[200px]">
                      <div className="flex flex-col items-center gap-2 py-3">
                        <span className="font-bold" style={{ color: 'var(--sfp-ink)' }}>{item.name}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(item.rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{item.rating}</span>
                        </div>
                        {item.fee && (
                          <span className="text-sm font-semibold" style={{ color: 'var(--sfp-green)' }}>{item.fee}</span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Feature rows — use the longest features array */}
                {Array.from({ length: Math.max(...items.map((it) => it.features.length)) }).map((_, rowIdx) => (
                  <TableRow key={rowIdx} className="border-b border-gray-100">
                    {items.map((item) => (
                      <TableCell key={item.name} className="text-center">
                        {item.features[rowIdx] ? (
                          <div className="flex items-start gap-2 text-sm text-left px-2" style={{ color: 'var(--sfp-ink)' }}>
                            <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                            <span>{item.features[rowIdx]}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--sfp-slate)' }}>—</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {/* CTA Row */}
                {items.some((it) => it.ctaLink) && (
                  <TableRow className="border-0" style={{ background: 'var(--sfp-gray)' }}>
                    {items.map((item) => (
                      <TableCell key={item.name} className="text-center py-5">
                        {item.ctaLink ? (
                          <Button
                            asChild
                            size="sm"
                            className="rounded-lg border-0 text-white hover:opacity-90"
                            style={{ background: 'var(--sfp-gold)' }}
                          >
                            <Link href={item.ctaLink} target="_blank" rel="noopener sponsored">
                              {item.cta || 'Visit Site'}
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        ) : null}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  // Original mode — products with featureLabels Record
  const resolvedProducts = products || [];
  const resolvedLabels = featureLabels || {};
  const features = Object.keys(resolvedLabels);

  return (
    <div className="my-10">
      {title && (
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--sfp-ink)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--sfp-sky)' }}>
            <Sparkles className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
          </div>
          {title}
        </h3>
      )}

      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {/* Header row */}
              <TableRow className="border-b border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
                <TableHead className="w-[200px] font-medium" style={{ color: 'var(--sfp-slate)' }}>Feature</TableHead>
                {resolvedProducts.map((product) => (
                  <TableHead key={product.slug} className="text-center min-w-[160px]">
                    <div className="flex flex-col items-center gap-2 py-3">
                      <span className="font-bold" style={{ color: 'var(--sfp-ink)' }}>{product.name}</span>
                      {product.winnerBadge && (
                        <Badge
                          className={`text-xs border ${
                            winnerBadgeColors[product.winnerBadge] ||
                            'bg-gray-100 border-gray-200 text-[var(--sfp-slate)]'
                          }`}
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          {product.winnerBadge}
                        </Badge>
                      )}
                      {!product.winnerBadge && product.isRecommended && (
                        <Badge
                          className="text-xs"
                          style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)', border: '1px solid rgba(26,107,58,0.2)' }}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(product.rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                          ({product.reviewCount.toLocaleString('en-US')})
                        </span>
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Pricing Row */}
              <TableRow className="border-b border-gray-100">
                <TableCell className="font-medium" style={{ color: 'var(--sfp-ink)' }}>Pricing</TableCell>
                {resolvedProducts.map((product) => (
                  <TableCell key={product.slug} className="text-center">
                    <span className="font-bold text-lg" style={{ color: 'var(--sfp-ink)' }}>{product.price}</span>
                  </TableCell>
                ))}
              </TableRow>

              {/* Feature Rows */}
              {features.map((feature) => (
                <TableRow key={feature} className="border-b border-gray-100">
                  <TableCell className="font-medium" style={{ color: 'var(--sfp-ink)' }}>
                    {resolvedLabels[feature]}
                  </TableCell>
                  {resolvedProducts.map((product) => (
                    <TableCell key={product.slug} className="text-center">
                      {renderFeatureValue(product.features[feature])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* CTA Row */}
              <TableRow className="border-0" style={{ background: 'var(--sfp-gray)' }}>
                <TableCell></TableCell>
                {resolvedProducts.map((product) => (
                  <TableCell key={product.slug} className="text-center py-5">
                    <Button
                      asChild
                      size="sm"
                      className="rounded-lg border-0 text-white hover:opacity-90"
                      style={{ background: 'var(--sfp-gold)' }}
                    >
                      <Link href={product.affiliateUrl} target="_blank" rel="noopener sponsored">
                        Visit Site
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function renderFeatureValue(value: boolean | string | undefined) {
  if (typeof value === 'boolean') {
    return value ? (
      <div className="flex items-center justify-center">
        <svg className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    ) : (
      <div className="flex items-center justify-center">
        <svg className="h-5 w-5" style={{ color: 'var(--sfp-red)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
    );
  }

  if (typeof value === 'string') {
    return <span className="text-sm" style={{ color: 'var(--sfp-ink)' }}>{value}</span>;
  }

  return <span style={{ color: 'var(--sfp-slate)' }}>—</span>;
}

// Simple comparison for inline use
interface SimpleComparisonProps {
  items: {
    label: string;
    values: (string | boolean)[];
  }[];
  headers: string[];
}

export function SimpleComparison({ items, headers }: SimpleComparisonProps) {
  return (
    <div className="rounded-xl overflow-hidden my-6 border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
              <TableHead className="w-[200px] font-medium" style={{ color: 'var(--sfp-slate)' }}>Feature</TableHead>
              {headers.map((header) => (
                <TableHead key={header} className="text-center font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.label} className="border-b border-gray-100">
                <TableCell className="font-medium" style={{ color: 'var(--sfp-ink)' }}>{item.label}</TableCell>
                {item.values.map((value, i) => (
                  <TableCell key={i} className="text-center">
                    {renderFeatureValue(value)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

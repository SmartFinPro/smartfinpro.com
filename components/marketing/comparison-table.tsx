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
import { Check, X, ArrowRight, Sparkles, Star } from 'lucide-react';
import { StarRating } from './trust-badges';

interface ComparisonProduct {
  name: string;
  slug: string;
  rating: number;
  reviewCount: number;
  price: string;
  affiliateUrl: string;
  isRecommended?: boolean;
  features: Record<string, boolean | string>;
}

interface ComparisonTableProps {
  products: ComparisonProduct[];
  featureLabels: Record<string, string>;
  title?: string;
}

export function ComparisonTable({
  products,
  featureLabels,
  title = 'Feature Comparison',
}: ComparisonTableProps) {
  const features = Object.keys(featureLabels);

  return (
    <div className="my-10">
      {title && (
        <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          {title}
        </h3>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800/50 border-b border-slate-700/50">
                <TableHead className="w-[200px] text-slate-400 font-medium">Feature</TableHead>
                {products.map((product) => (
                  <TableHead key={product.slug} className="text-center min-w-[160px]">
                    <div className="flex flex-col items-center gap-2 py-2">
                      <span className="font-bold text-white">{product.name}</span>
                      {product.isRecommended && (
                        <Badge className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/30 text-xs">
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
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">
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
              <TableRow className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <TableCell className="font-medium text-slate-300">Pricing</TableCell>
                {products.map((product) => (
                  <TableCell key={product.slug} className="text-center">
                    <span className="font-bold gradient-text text-lg">{product.price}</span>
                  </TableCell>
                ))}
              </TableRow>

              {/* Feature Rows */}
              {features.map((feature) => (
                <TableRow key={feature} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-medium text-slate-300">
                    {featureLabels[feature]}
                  </TableCell>
                  {products.map((product) => (
                    <TableCell key={product.slug} className="text-center">
                      {renderFeatureValue(product.features[feature])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* CTA Row */}
              <TableRow className="bg-slate-800/30">
                <TableCell></TableCell>
                {products.map((product) => (
                  <TableCell key={product.slug} className="text-center py-4">
                    <Button
                      asChild
                      size="sm"
                      className="btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25"
                    >
                      <Link href={product.affiliateUrl} target="_blank" rel="noopener sponsored">
                        Try Free
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
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Check className="h-4 w-4 text-emerald-400" />
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <X className="h-4 w-4 text-red-400" />
        </div>
      </div>
    );
  }

  if (typeof value === 'string') {
    return <span className="text-sm text-slate-300">{value}</span>;
  }

  return <span className="text-slate-600">-</span>;
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
    <div className="glass-card rounded-xl overflow-hidden my-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800/50 border-b border-slate-700/50">
              <TableHead className="w-[200px] text-slate-400 font-medium">Feature</TableHead>
              {headers.map((header) => (
                <TableHead key={header} className="text-center text-white font-medium">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.label} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <TableCell className="font-medium text-slate-300">{item.label}</TableCell>
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

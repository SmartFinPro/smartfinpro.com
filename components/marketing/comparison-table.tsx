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
import { Check, X, ArrowRight } from 'lucide-react';
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
    <div className="my-8">
      {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">Feature</TableHead>
              {products.map((product) => (
                <TableHead key={product.slug} className="text-center min-w-[150px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold">{product.name}</span>
                    {product.isRecommended && (
                      <Badge variant="default" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating value={product.rating} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        ({product.reviewCount})
                      </span>
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Pricing Row */}
            <TableRow>
              <TableCell className="font-medium">Pricing</TableCell>
              {products.map((product) => (
                <TableCell key={product.slug} className="text-center font-semibold">
                  {product.price}
                </TableCell>
              ))}
            </TableRow>

            {/* Feature Rows */}
            {features.map((feature) => (
              <TableRow key={feature}>
                <TableCell className="font-medium">
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
            <TableRow className="bg-muted/30">
              <TableCell></TableCell>
              {products.map((product) => (
                <TableCell key={product.slug} className="text-center">
                  <Button asChild size="sm" className="gap-1">
                    <Link href={product.affiliateUrl}>
                      Try Free
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function renderFeatureValue(value: boolean | string | undefined) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-5 w-5 text-green-500 mx-auto" />
    ) : (
      <X className="h-5 w-5 text-red-400 mx-auto" />
    );
  }

  if (typeof value === 'string') {
    return <span className="text-sm">{value}</span>;
  }

  return <span className="text-muted-foreground">-</span>;
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
    <div className="overflow-x-auto rounded-lg border my-4">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px]">Feature</TableHead>
            {headers.map((header) => (
              <TableHead key={header} className="text-center">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.label}>
              <TableCell className="font-medium">{item.label}</TableCell>
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
  );
}

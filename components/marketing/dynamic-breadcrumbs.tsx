// components/marketing/dynamic-breadcrumbs.tsx
// ============================================================
// DynamicBreadcrumbs — Auto-generates breadcrumbs from URL path
// Includes JSON-LD BreadcrumbList schema for SEO
// Uses config/navigation.ts for label resolution
// ============================================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { detectMarketFromPath, getMarketPrefix, slugToLabel } from '@/config/navigation';
import { marketConfig } from '@/lib/i18n/config';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface DynamicBreadcrumbsProps {
  /** Override labels for specific segments: { 'my-slug': 'My Custom Title' } */
  overrides?: Record<string, string>;
  /** If true, hide the breadcrumbs (e.g. on homepage) */
  hidden?: boolean;
}

function buildBreadcrumbs(pathname: string, overrides?: Record<string, string>): BreadcrumbItem[] {
  const market = detectMarketFromPath(pathname);
  const prefix = getMarketPrefix(market);
  const items: BreadcrumbItem[] = [];

  // 1. Home — always links to market home
  items.push({
    label: 'Home',
    href: prefix || '/',
  });

  // Parse the path segments
  const segments = pathname.split('/').filter(Boolean);

  // If non-US market, first segment is the market prefix
  let startIndex = 0;
  if (market !== 'us' && segments[0] === market) {
    // Add market breadcrumb
    items.push({
      label: marketConfig[market].name,
      href: `/${market}`,
    });
    startIndex = 1;
  }

  // Build remaining breadcrumbs from segments
  let currentPath = `/${market}`;

  for (let i = startIndex; i < segments.length; i++) {
    const segment = segments[i];

    // Skip 'overview' as a breadcrumb label (it's just a route folder)
    if (segment === 'overview') continue;

    currentPath += `/${segment}`;
    const label = overrides?.[segment] || slugToLabel(segment);

    items.push({
      label,
      href: currentPath,
    });
  }

  return items;
}

export function DynamicBreadcrumbs({ overrides, hidden }: DynamicBreadcrumbsProps) {
  const pathname = usePathname();

  if (hidden) return null;

  // Don't render breadcrumbs on root pages
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  // Don't render on market landing pages either (e.g. /uk, /ca, /au)
  if (segments.length === 1 && ['uk', 'ca', 'au'].includes(segments[0])) return null;

  const items = buildBreadcrumbs(pathname, overrides);

  // JSON-LD BreadcrumbList Schema
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `https://smartfinpro.com${item.href}`,
    })),
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Visual Breadcrumbs */}
      <nav
        className="flex items-center gap-1.5 text-sm mb-6 flex-wrap"
        style={{ color: 'var(--sfp-slate)' }}
        aria-label="Breadcrumb"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <span key={item.href} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--sfp-slate)', opacity: 0.5 }} />
              )}
              {isLast ? (
                // Current page — no link, darker color
                <span className="font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors flex items-center gap-1"
                  style={{ color: 'var(--sfp-slate)' }}
                  onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sfp-navy)')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sfp-slate)')}
                >
                  {index === 0 && <Home className="h-3.5 w-3.5" />}
                  {item.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}

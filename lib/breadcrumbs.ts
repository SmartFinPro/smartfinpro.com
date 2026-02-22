/**
 * Breadcrumb Engine — Auto-generates SEO breadcrumbs from MDX paths
 * ─────────────────────────────────────────────────────────────────
 * Usage:
 *   const items = buildBreadcrumbs('uk', 'trading', 'eToro Review 2026', 'etoro-review');
 *   → [{ label: 'Home', href: '/uk' }, { label: 'United Kingdom', href: '/uk' },
 *      { label: 'Trading Platforms', href: '/uk/trading' }, { label: 'eToro Review 2026' }]
 */

import {
  Market,
  Category,
  categoryConfig,
  marketConfig,
} from '@/lib/i18n/config';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Build breadcrumb items from market/category/slug.
 * US market uses clean URLs (no /us prefix).
 *
 * @param market   - Market code (us, uk, ca, au)
 * @param category - Category slug
 * @param title    - Page title (last breadcrumb, no link)
 * @param slug     - Optional slug (not used in href, just controls if title is a leaf)
 */
export function buildBreadcrumbs(
  market: Market,
  category: Category,
  title?: string,
  slug?: string,
): BreadcrumbItem[] {
  const prefix = market === 'us' ? '' : `/${market}`;
  const categoryName = categoryConfig[category]?.name || category;

  const items: BreadcrumbItem[] = [
    { label: 'Home', href: prefix || '/' },
  ];

  // For non-US markets, add the market level
  if (market !== 'us') {
    items.push({
      label: marketConfig[market].name,
      href: `/${market}`,
    });
  }

  // Category level — always links to the category page
  if (title) {
    items.push({
      label: categoryName,
      href: `${prefix}/${category}`,
    });
    // Title is the leaf (current page, no link)
    items.push({ label: title });
  } else {
    // Category page itself — leaf with no link
    items.push({ label: categoryName });
  }

  return items;
}

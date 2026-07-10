// lib/seo/best-x-item-list.ts
// Homepage Best-X ItemList JSON-LD, shared by the US root wrapper
// (app/(marketing)/page.tsx) and the non-US market homepages
// (app/(marketing)/[market]/page.tsx). One builder → identical schema shape
// across all four markets, no drift.

import { generateComparisonItemListSchema } from '@/lib/seo/schema';
import type { BestXIndexItem } from '@/lib/comparison/loader';
import type { Market } from '@/lib/i18n/config';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

export interface BestXItemListResult {
  /** Stable @id — referenced by the page's WebPage.mainEntity on the US wrapper. */
  id: string;
  schema: object;
  /** Latest data_verified_at across the live tiles (for WebPage.dateModified). */
  dateModified: string | undefined;
}

/** Returns null when the market has no live Best-X tiles yet (nothing to emit). */
export function buildBestXItemListSchema(
  market: Market,
  items: BestXIndexItem[],
): BestXItemListResult | null {
  const liveItems = items.filter(
    (item): item is BestXIndexItem & { href: string; winner: NonNullable<BestXIndexItem['winner']> } =>
      item.status === 'live' && !!item.href && !!item.winner,
  );
  if (liveItems.length === 0) return null;

  const pageUrl = market === 'us' ? `${BASE_URL}/` : `${BASE_URL}/${market}`;
  const id = `${pageUrl}#bestx-itemlist`;
  const dateModified = liveItems
    .map((item) => item.verifiedAt)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);

  const schema = generateComparisonItemListSchema({
    id,
    title: 'Best-Rated Financial Products — SmartFinPro Compare',
    description:
      "Editorially reviewed, currently-leading providers across SmartFinPro's comparison categories.",
    url: pageUrl,
    products: liveItems.map((item) => ({
      name: item.winner.name,
      description: item.label,
      url: `${BASE_URL}${item.href}`,
    })),
  });

  return { id, schema, dateModified };
}

// scripts/research/export-review-hrefs.mts
// unified-research-discovery-pr2-hubs plan, Task 8 — writes the ground-truth
// fixture e2e/research-raw-html.spec.ts checks against: every review href the
// Research hubs can possibly render, for all four markets.
//
// Deliberately reimplements ONLY the two inclusion gates
// lib/research/catalog.ts's loadMarketReviewItems() already enforces
// (`slug !== 'index'` and a numeric editorial rating) and the SAME href shape
// (`/${market}/${category}/${slug}` — market-prefixed even for 'us', exactly
// what item.review.href / reviewHrefFor() both compute, see
// lib/comparison/cta.ts and components/research/CatalogCard.tsx's
// `primaryHref`). It does NOT import catalog.ts itself: that module is
// `import 'server-only'`-guarded and throws when loaded outside a Next.js
// server/RSC boundary — a plain `tsx` script has no such boundary. Reusing
// getContentByMarketAndCategory() + marketCategories (both plain, I/O-only
// modules with no 'server-only' guard) keeps this script a genuine second,
// independent witness of the SAME inclusion rule, not a copy of catalog.ts's
// own output.
//
// The expected-hrefs fixture this produces must NEVER be read from the page
// under test — see e2e/research-raw-html.spec.ts's header comment.
//
// Run:  npx tsx scripts/research/export-review-hrefs.mts

import fs from 'fs';
import path from 'path';
import { getContentByMarketAndCategory } from '@/lib/mdx';
import { markets, marketCategories, type Market } from '@/lib/i18n/config';

async function hrefsForMarket(market: Market): Promise<string[]> {
  const categories = marketCategories[market];
  const categoryResults = await Promise.all(
    categories.map((category) => getContentByMarketAndCategory(market, category)),
  );

  const hrefs: string[] = [];
  for (let i = 0; i < categories.length; i += 1) {
    const category = categories[i];
    for (const contentItem of categoryResults[i]) {
      if (contentItem.slug === 'index') continue;
      if (typeof contentItem.meta.rating !== 'number') continue;
      hrefs.push(`/${market}/${category}/${contentItem.slug}`);
    }
  }
  return hrefs.sort();
}

async function main() {
  const record: Record<Market, string[]> = {} as Record<Market, string[]>;
  for (const market of markets) {
    record[market] = await hrefsForMarket(market);
  }

  const outPath = path.join(process.cwd(), 'e2e/fixtures/research-review-hrefs.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(record, null, 2) + '\n', 'utf8');

  for (const market of markets) {
    console.log(`${market}: ${record[market].length} rated review href(s)`);
  }
  console.log(`\nWrote ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

// components/marketing/research-quick-finder-section.tsx
// Homepage Quick Finder section — SERVER wrapper around the client
// `QuickFinder` (research-discovery-pr3 plan, Task 3; spec §9.3). Replaces
// the old two-column Report Feed (PortalSidebar + ReportCard + pagination)
// and the separate Editor's Picks block: this ONE section now owns the
// homepage's `#reports` anchor. It loads the SAME `DiscoveryCatalog` the
// universal /research hub uses — the caller ([market]/page.tsx) resolves
// `getDiscoveryCatalog(market)` exactly ONCE per request and hands the
// already-built `catalog` down here (spec's "one fan-out" rule; see
// lib/research/catalog.ts's own header) — and hands the client shell nothing
// but the normalized, MDX-body-free `DiscoveryItem[]`.
//
// Statically prerenderable: no searchParams/headers()/cookies() anywhere in
// this server tree — `catalog` was already resolved by the caller, and the
// category link row below is built with plain `URLSearchParams`.
//
// Crawlable path (Task 3 Step 5 / spec §9.3): the category row is a real,
// static `<Link>` list into the market Research hub, so it survives with JS
// disabled. `QuickFinder` itself ALSO server-renders its own (up to six) real
// review/Cockpit-hub links on the very same request — Next.js server-renders
// Client Components too, it just ALSO ships their hydration JS — so a
// crawler sees genuine review hrefs in the server HTML before any hydration.
import Link from 'next/link';
import type { Category, Market } from '@/lib/i18n/config';
import { categoryConfig } from '@/lib/i18n/config';
import { researchBaseForMarket } from '@/lib/research/catalog-shell-logic';
import type { DiscoveryCatalog } from '@/lib/research/catalog';
import { QuickFinder } from '@/components/research/QuickFinder';

export interface ResearchQuickFinderSectionProps {
  market: Market;
  catalog: DiscoveryCatalog;
}

export function ResearchQuickFinderSection({ market, catalog }: ResearchQuickFinderSectionProps) {
  const categoryCounts = Object.entries(
    catalog.items.reduce<Record<string, number>>((counts, item) => {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
      return counts;
    }, {}),
  );

  return (
    <section
      id="reports"
      aria-labelledby="research-finder-heading"
      style={{ background: '#fff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
    >
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '80px 40px' }}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span
                className="mb-2 block text-[11px] font-bold uppercase tracking-[2px]"
                style={{ color: 'var(--sfp-slate)' }}
              >
                Research Library
              </span>
              <h2
                id="research-finder-heading"
                className="text-2xl font-extrabold"
                style={{ color: 'var(--sfp-ink)', letterSpacing: '-0.6px', lineHeight: 1.2 }}
              >
                Find the research that fits your decision
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                {catalog.counts.discoveryItemCount} research entries available
              </p>
            </div>

            {categoryCounts.length > 0 && (
              <nav aria-label="Research categories" className="flex flex-wrap gap-2">
                {categoryCounts.map(([category, count]) => {
                  const params = new URLSearchParams();
                  params.set('category', category);
                  const href = `${researchBaseForMarket(market)}?${params.toString()}`;
                  return (
                    <Link
                      key={category}
                      href={href}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold no-underline"
                      style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                    >
                      {categoryConfig[category as Category].name} ({count})
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <QuickFinder market={market} items={catalog.items} />
        </div>
      </div>
    </section>
  );
}

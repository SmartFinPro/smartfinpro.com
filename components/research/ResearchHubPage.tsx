// components/research/ResearchHubPage.tsx
// The one server ResearchHubPage all four market route wrappers
// (app/(marketing)/research, /uk/research, /ca/research, /au/research)
// delegate to (unified-research-discovery-pr2-hubs plan, Task 2 foundation —
// Task 3 fills this in with the full discovery catalog snapshot: server-
// rendered dossier/card nodes, JSON-LD, hero metrics and the complete browse
// fallback per spec §8).
//
// Server Component: builds the discovery catalog for the given market and
// renders the market-specific copy (lib/research/hub-copy.ts) around it. No
// client JS, no searchParams/headers() access here — this keeps `/research`
// (and its three market siblings) statically prerenderable (spec §8).
//
// The marketing route group's layout already owns the single <main
// id="main-content"> landmark for every page under app/(marketing) — this
// component must not add a second one.

import type { Market } from '@/lib/i18n/config';
import { getDiscoveryCatalogBundle } from '@/lib/research/catalog';
import { getResearchHubCopy } from '@/lib/research/hub-copy';

export async function ResearchHubPage({ market }: { market: Market }) {
  const [{ catalog }, copy] = await Promise.all([
    getDiscoveryCatalogBundle(market),
    Promise.resolve(getResearchHubCopy(market)),
  ]);

  return (
    <article data-research-market={market}>
      <header>
        <p>{copy.eyebrow}</p>
        <h1>{copy.h1}</h1>
        <p>{copy.description}</p>
        <p>{catalog.counts.discoveryItemCount} research entries</p>
      </header>
    </article>
  );
}

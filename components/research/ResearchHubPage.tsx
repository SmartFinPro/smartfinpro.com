// components/research/ResearchHubPage.tsx
// The one server ResearchHubPage all four market route wrappers
// (app/(marketing)/research, /uk/research, /ca/research, /au/research)
// delegate to (unified-research-discovery-pr2-hubs plan, Task 3; spec §8,
// §9.1, §7.4).
//
// Server Component ONLY: builds the discovery catalog for the given market,
// the server-rendered dossier/card nodes, the audited-only JSON-LD, and a
// COMPLETE browse fallback — no client JS, no searchParams/headers() access,
// no client component anywhere in this file. That keeps `/research` (and its
// three market siblings) statically prerenderable, and every review href
// visible in raw HTML with JavaScript disabled (spec §8). The client shell
// (`ResearchHub`, URL filters, shortlist) is Task 4/5 — this file renders the
// full unfiltered browse view unconditionally, standing in for that shell's
// eventual Suspense fallback.
//
// MERGE-BLOCKER INVARIANT (operator-mandated, this task): the JSON-LD
// ItemList and the raw rendered HTML must describe the SAME audited
// products. `buildResearchHubNodes` and `buildResearchItemListSchema` are
// therefore always fed the identical, already-degraded projection list —
// never two independently filtered views of the catalog. See
// __tests__/unit/research-hub-schema.test.ts for the set-equality proof.
//
// The marketing route group's layout already owns the single <main
// id="main-content"> landmark for every page under app/(marketing) — this
// component must not add a second one.

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Market } from '@/lib/i18n/config';
import { marketConfig } from '@/lib/i18n/config';
import {
  getDiscoveryCatalogBundle,
  type DiscoveryCatalog,
  type DiscoveryCatalogBundle,
  type DiscoveryDossierRenderRow,
} from '@/lib/research/catalog';
import { getResearchHubCopy, type ResearchHubCopy } from '@/lib/research/hub-copy';
import {
  EMPTY_DISCOVERY_FILTERS,
  projectDiscoveryItems,
  projectionNodeKey,
  researchBaseForMarket,
  sortHubProjections,
  type DiscoveryProjection,
} from '@/lib/research/catalog-shell-logic';
import { Breadcrumb } from '@/components/marketing/breadcrumb';
import { generateComparisonItemListSchema } from '@/lib/seo/schema';
import { formatVerifiedDate } from './VerificationStatus';
import { ResearchCard } from './ResearchCard';
import { CatalogCard } from './CatalogCard';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

// ── Server nodes (spec §8) ───────────────────────────────────────────────────

export interface ResearchHubNode {
  key: string;
  projection: DiscoveryProjection;
  node: ReactNode;
}

/** Resolves one default projection to its rendered node (spec §9):
 *  - a plain review projection -> CatalogCard;
 *  - a Cockpit-only PROVISIONAL dossier (no review, provisional context) ->
 *    CatalogCard ("In verification", no number);
 *  - every other qualified dossier (audited any, or provisional WITH a
 *    review — i.e. never "Cockpit-only") -> ResearchCard, sourced from its
 *    full-provenance sidecar row in `dossierRows`.
 *
 *  Degradation (spec §13 "Dossier-Node fehlt"): a missing sidecar row throws
 *  in development (a real join bug must never pass silently) and degrades in
 *  production — to the review projection when the item has one, otherwise
 *  the projection is dropped entirely (returns null). Returning the
 *  DEGRADED projection (not the original) is what keeps
 *  buildResearchItemListSchema's audited-only filter and this function's own
 *  rendering choice in permanent agreement: a degraded item can never both
 *  render as a plain review AND still claim an audited ItemList entry. */
function resolveHubNode(
  projection: DiscoveryProjection,
  dossierRowsByKey: ReadonlyMap<string, DiscoveryDossierRenderRow>,
): { projection: DiscoveryProjection; node: ReactNode } | null {
  if (projection.kind === 'review') {
    return { projection, node: <CatalogCard projection={projection} /> };
  }

  const { item, context } = projection;
  const isCockpitOnly = item.review === null;

  if (isCockpitOnly && context.status === 'provisional') {
    return { projection, node: <CatalogCard projection={projection} /> };
  }

  const key = projectionNodeKey(item.id, context.cockpitKey);
  const row = dossierRowsByKey.get(key);

  if (!row) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`ResearchHubPage: missing dossier sidecar row for ${key}`);
    }
    if (item.review) {
      const degraded: DiscoveryProjection = { itemId: item.id, kind: 'review', item, context: null };
      return { projection: degraded, node: <CatalogCard projection={degraded} /> };
    }
    return null;
  }

  const variant = context.status === 'audited' && context.auditedRank === 1 ? 'featured' : 'standard';
  return { projection, node: <ResearchCard item={row.researchProduct} variant={variant} /> };
}

/** Builds every server-rendered node for the market's default (unfiltered)
 *  browse projection, in display order (spec §6.3). This is the single list
 *  both the browse fallback AND the JSON-LD are derived from — see the
 *  merge-blocker note above. */
export function buildResearchHubNodes(
  bundle: Pick<DiscoveryCatalogBundle, 'catalog' | 'dossierRows'>,
): ResearchHubNode[] {
  const dossierRowsByKey = new Map(bundle.dossierRows.map((row) => [row.key, row]));
  const projections = sortHubProjections(
    projectDiscoveryItems(bundle.catalog.items, EMPTY_DISCOVERY_FILTERS),
  );

  const nodes: ResearchHubNode[] = [];
  for (const projection of projections) {
    const resolved = resolveHubNode(projection, dossierRowsByKey);
    if (!resolved) continue;
    const cockpitKey = resolved.projection.kind === 'dossier' ? resolved.projection.context.cockpitKey : null;
    nodes.push({
      key: projectionNodeKey(resolved.projection.itemId, cockpitKey),
      projection: resolved.projection,
      node: resolved.node,
    });
  }
  return nodes;
}

// ── Audited-only JSON-LD (spec §7.4) ─────────────────────────────────────────

/** The single audited-only ItemList for this hub. Fed the SAME finalized
 *  projection list `buildResearchHubNodes` rendered from (see the file-level
 *  merge-blocker note) — never a separately re-filtered view of the catalog.
 *  A Cockpit-only audited product's URL mirrors ResearchCard's own primary
 *  href exactly (`compareBaseHref?compare=slug`), not the bare
 *  `compareBaseHref` — otherwise the ItemList would point at a URL that
 *  never actually appears as a link in that product's rendered card. */
export function buildResearchItemListSchema(
  market: Market,
  projections: readonly DiscoveryProjection[],
  copy: ResearchHubCopy,
) {
  const absoluteUrl = (path: string): string => new URL(path, BASE_URL).toString();
  const hubUrl = absoluteUrl(researchBaseForMarket(market));

  const seen = new Set<string>();
  const audited = projections.filter(
    (projection): projection is Extract<DiscoveryProjection, { kind: 'dossier' }> => {
      if (
        projection.kind !== 'dossier' ||
        projection.context.status !== 'audited' ||
        seen.has(projection.itemId)
      ) {
        return false;
      }
      seen.add(projection.itemId);
      return true;
    },
  );

  return generateComparisonItemListSchema({
    title: copy.h1,
    description: copy.description,
    url: hubUrl,
    id: `${hubUrl}#itemlist`,
    products: audited.map(({ item, context }) => ({
      name: item.display.title,
      ...(item.display.bestFor && { description: item.display.bestFor }),
      url: absoluteUrl(
        item.review?.href ?? `${context.compareBaseHref}?compare=${encodeURIComponent(context.productSlug)}`,
      ),
      areaServed: copy.areaServed,
    })),
  });
}

// ── Rendering helpers ────────────────────────────────────────────────────────

function HeroMetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3"
      style={{ borderColor: 'var(--sfp-hairline)', background: 'var(--sfp-gray)' }}
    >
      <div className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--sfp-slate)' }}>
        {label}
      </div>
    </div>
  );
}

/** Newest genuine `dataVerifiedAt` across every research context in the
 *  catalog — never a fabricated freshness claim (spec §13). */
function newestVerifiedAt(catalog: DiscoveryCatalog): string | null {
  let newest: string | null = null;
  for (const item of catalog.items) {
    for (const context of item.researchContexts) {
      if (context.dataVerifiedAt && (newest === null || context.dataVerifiedAt > newest)) {
        newest = context.dataVerifiedAt;
      }
    }
  }
  return newest;
}

interface DossierGroup {
  topic: string;
  topicLabel: string;
  entries: ResearchHubNode[];
}

/** Groups dossier nodes by Cockpit topic, preserving manifest order — every
 *  row for one topic is already contiguous in `sortHubProjections`'s output
 *  (manifestOrder is the primary sort key and identical for every row of one
 *  topic), so first-seen order here already IS manifest order. Review-only
 *  nodes are returned separately for the trailing review grid. */
function groupBrowseNodes(nodes: readonly ResearchHubNode[]): {
  dossierGroups: DossierGroup[];
  reviewEntries: ResearchHubNode[];
} {
  const dossierGroups: DossierGroup[] = [];
  const groupIndexByTopic = new Map<string, number>();
  const reviewEntries: ResearchHubNode[] = [];

  for (const entry of nodes) {
    if (entry.projection.kind !== 'dossier') {
      reviewEntries.push(entry);
      continue;
    }
    const { topic, topicLabel } = entry.projection.context;
    let index = groupIndexByTopic.get(topic);
    if (index === undefined) {
      index = dossierGroups.length;
      groupIndexByTopic.set(topic, index);
      dossierGroups.push({ topic, topicLabel, entries: [] });
    }
    dossierGroups[index].entries.push(entry);
  }

  return { dossierGroups, reviewEntries };
}

/** The complete, unsliced browse fallback (spec §8): every qualified dossier
 *  node grouped by its Cockpit topic (each topic keeps the stable
 *  `data-testid="dossier-<topic>"` scope the US trading-platforms pilot
 *  originated — spec DoD "bestehender US-Pilot bleibt mit neun
 *  Trading-Dossiers funktional"), followed by one review grid for every
 *  review-backed item not already shown in a dossier section. Never sliced
 *  or paginated. */
function BrowseFallback({ nodes }: { nodes: ResearchHubNode[] }) {
  const { dossierGroups, reviewEntries } = groupBrowseNodes(nodes);

  return (
    <>
      {dossierGroups.map((group) => {
        const featured = group.entries.find(
          (entry) =>
            entry.projection.kind === 'dossier' &&
            entry.projection.context.status === 'audited' &&
            entry.projection.context.auditedRank === 1,
        );
        const rest = featured ? group.entries.filter((entry) => entry.key !== featured.key) : group.entries;

        return (
          <section
            key={group.topic}
            data-testid={`dossier-${group.topic}`}
            className="mx-auto px-6 py-8 sm:py-12"
            style={{ maxWidth: '1280px' }}
          >
            <h2 className="mb-6 text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
              {group.topicLabel}
            </h2>
            {featured && <div className="mb-6">{featured.node}</div>}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {rest.map((entry) => (
                <div key={entry.key}>{entry.node}</div>
              ))}
            </div>
          </section>
        );
      })}

      {reviewEntries.length > 0 && (
        <section
          data-testid="research-review-grid"
          className="mx-auto px-6 py-8 sm:py-12"
          style={{ maxWidth: '1280px' }}
        >
          <h2 className="mb-6 text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
            More independent reviews
          </h2>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {reviewEntries.map((entry) => (
              <div key={entry.key}>{entry.node}</div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ── Page body (pure — I/O already resolved by the caller) ──────────────────

export interface ResearchHubBodyProps {
  market: Market;
  catalog: DiscoveryCatalog;
  copy: ResearchHubCopy;
  nodes: ResearchHubNode[];
}

/** Renders the whole hub given already-fetched data — separated from
 *  `ResearchHubPage` so unit tests (e.g. the empty-catalog case) can render
 *  it directly from a fixture bundle, without exercising the real
 *  'server-only' catalog I/O. */
export function ResearchHubBody({ market, catalog, copy, nodes }: ResearchHubBodyProps) {
  const homeHref = market === 'us' ? '/' : `/${market}`;

  if (catalog.items.length === 0) {
    return (
      <article data-research-market={market}>
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto px-6 pb-10 pt-6 sm:pb-14 sm:pt-8" style={{ maxWidth: '1280px' }}>
            <Breadcrumb items={[{ label: 'Home', href: homeHref }, { label: 'Research' }]} />
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--sfp-navy)' }}>
              {copy.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl lg:text-5xl" style={{ color: 'var(--sfp-ink)' }}>
              {copy.h1}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
              {marketConfig[market].name} research is on its way — no verified dossiers or reviews are
              published for this market yet. Check back soon.
            </p>
          </div>
        </section>
      </article>
    );
  }

  const auditedCount = catalog.counts.auditedItemCount;
  const totalCount = catalog.counts.discoveryItemCount;
  const verifiedDataPoints = catalog.counts.verifiedDataPointCount;
  const updatedIso = newestVerifiedAt(catalog);
  const updatedLabel = updatedIso ? formatVerifiedDate(updatedIso) : 'Pending';

  return (
    <article data-research-market={market} style={{ background: 'var(--sfp-gray)' }} className="min-h-screen">
      {nodes.length > 0 &&
        (() => {
          const schema = buildResearchItemListSchema(
            market,
            nodes.map((entry) => entry.projection),
            copy,
          );
          return schema.numberOfItems > 0 ? (
            <script
              type="application/ld+json"
              // Escape "<" so an editorial field (title/bestFor) that ever
              // contained "</script>" or "<" can't break out of the tag.
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
            />
          ) : null;
        })()}

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto px-6 pb-6 pt-6 sm:pb-10 sm:pt-8" style={{ maxWidth: '1280px' }}>
          <Breadcrumb items={[{ label: 'Home', href: homeHref }, { label: 'Research' }]} />

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--sfp-navy)' }}>
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl lg:text-5xl" style={{ color: 'var(--sfp-ink)' }}>
            {copy.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
            {copy.description}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-4">
            <HeroMetricTile value={String(totalCount)} label="Products" />
            <HeroMetricTile value={String(auditedCount)} label="Audited" />
            <HeroMetricTile value={String(verifiedDataPoints)} label="Verified data points" />
            <HeroMetricTile value={updatedLabel} label="Updated" />
          </div>
        </div>
      </section>

      <BrowseFallback nodes={nodes} />

      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto px-6 py-10" style={{ maxWidth: '1280px' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>
            How we score
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
            {auditedCount} of {totalCount} products above carry an audited BEST-X score: an editorial
            0–10 rating with a documented confidence level, where every key fact shown on a card is
            backed by a dated, named source. Commercial relationships never influence a score or a
            ranking.{' '}
            {/* textDecoration inline, not just the `underline` class: this
                section is wrapped in <article>, and globals.css strips the
                underline from internal links inside article/.prose (restoring
                it only on :hover). Navy against the surrounding slate is a
                1.08:1 contrast, far below the 3:1 a link needs to be
                identifiable by colour alone (WCAG 1.4.1) — an inline style
                outranks that stylesheet rule (axe: link-in-text-block). */}
            <Link
              href="/methodology"
              className="underline"
              style={{ color: 'var(--sfp-navy)', textDecoration: 'underline' }}
            >
              Read the full methodology
            </Link>
            .
          </p>
          <p className="mt-4 text-xs" style={{ color: 'var(--sfp-slate)' }}>
            Advertising disclosure: some links on this page may earn us a commission at no cost to
            you — it never affects our rankings.{' '}
            <Link
              href="/affiliate-disclosure"
              className="underline"
              style={{ color: 'var(--sfp-navy)', textDecoration: 'underline' }}
            >
              Details
            </Link>
          </p>
        </div>
      </section>
    </article>
  );
}

// ── Server entry point (I/O) ─────────────────────────────────────────────────

export async function ResearchHubPage({ market }: { market: Market }) {
  const [bundle, copy] = await Promise.all([
    getDiscoveryCatalogBundle(market),
    Promise.resolve(getResearchHubCopy(market)),
  ]);
  const nodes = buildResearchHubNodes(bundle);
  return <ResearchHubBody market={market} catalog={bundle.catalog} copy={copy} nodes={nodes} />;
}

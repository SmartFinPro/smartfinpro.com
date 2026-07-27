// __tests__/unit/research-hub-dossier-grouping.test.ts
// Regression coverage for the Research hub dossier-grouping defect (PR 2
// follow-up, 2026-07-27): both `ResearchHubPage.tsx`'s `groupBrowseNodes`
// (server, unfiltered browse fallback) and `ResearchHub.tsx`'s
// `groupResolvedEntries` (client, filtered/default views) used to key their
// dossier-section Map by the BARE `context.topic` string instead of the full
// `context.cockpitKey` (`${market}/${category}/${topic}`). BEST_X_MANIFEST
// (lib/comparison/topics/manifest.ts) genuinely reuses the topic string
// "companies" for two different US categories — `credit-repair` and
// `debt-relief` — so the old bare-topic Map silently merged both categories'
// products into ONE section under whichever manifest entry's `topicLabel`
// happened to be seen first (credit-repair, since it precedes debt-relief in
// BEST_X_MANIFEST) — i.e. debt-relief products rendered under the
// "Best Credit Repair" heading. Fixed by keying on `cockpitKey` (the same
// identity rule spec §4.1 already applies to a Cockpit-only item's id) and by
// giving each group its OWN `topicLabel`/`category`, sourced from ITS OWN
// context, never a Map-collision winner.
//
// Fixtures are built from the REAL BEST_X_MANIFEST entries for
// us/credit-repair/companies and us/debt-relief/companies (never a
// hand-rolled fake manifest) so this test fails the moment the real manifest
// stops actually colliding on that topic string, rather than silently
// testing nothing.

import { describe, expect, it } from 'vitest';
import { BEST_X_MANIFEST, type BestXManifestEntry } from '@/lib/comparison/topics/manifest';
import {
  cockpitKeyFor,
  projectionNodeKey,
  sortHubProjections,
  type CockpitKey,
  type DiscoveryItem,
  type DiscoveryProjection,
  type ResearchContext,
} from '@/lib/research/catalog-shell-logic';
import { groupBrowseNodes, type ResearchHubNode } from '@/components/research/ResearchHubPage';
import { groupResolvedEntries } from '@/components/research/ResearchHub';

// --- Real manifest entries (never fabricated) -------------------------------

const creditRepairEntryRaw = BEST_X_MANIFEST.find(
  (entry) => entry.market === 'us' && entry.category === 'credit-repair' && entry.topic === 'companies',
);
const debtReliefEntryRaw = BEST_X_MANIFEST.find(
  (entry) => entry.market === 'us' && entry.category === 'debt-relief' && entry.topic === 'companies',
);

if (!creditRepairEntryRaw || !debtReliefEntryRaw) {
  throw new Error(
    'Fixture precondition failed: BEST_X_MANIFEST no longer has both us/credit-repair/companies and ' +
      'us/debt-relief/companies — this test\'s whole premise (two categories sharing the bare topic ' +
      '"companies") no longer holds. Update the fixture, do not just delete the test.',
  );
}
// Reassigned (not just narrowed) so the two are genuinely non-undefined
// `BestXManifestEntry` bindings usable from functions defined below —
// TypeScript's control-flow narrowing of `creditRepairEntryRaw` doesn't
// survive being read inside a separately-declared function.
const creditRepairEntry: BestXManifestEntry = creditRepairEntryRaw;
const debtReliefEntry: BestXManifestEntry = debtReliefEntryRaw;

// Both entries genuinely share the bare topic string — the precondition this
// whole defect (and this test) depends on.
if (creditRepairEntry.topic !== debtReliefEntry.topic) {
  throw new Error('Fixture precondition failed: the two manifest entries no longer share one topic string.');
}

const creditRepairManifestOrder = BEST_X_MANIFEST.indexOf(creditRepairEntry);
const debtReliefManifestOrder = BEST_X_MANIFEST.indexOf(debtReliefEntry);

// --- Fixture builders --------------------------------------------------------

function makeContext(
  entry: BestXManifestEntry,
  productSlug: string,
  manifestOrder: number,
): ResearchContext {
  return {
    cockpitKey: cockpitKeyFor(entry.market, entry.category, entry.topic),
    topic: entry.topic,
    topicLabel: entry.label,
    manifestOrder,
    productSlug,
    displayName: productSlug,
    tagline: null,
    bestFor: null,
    status: 'audited',
    confidence: 'high',
    dataVerifiedAt: '2026-07-01',
    auditedScore: 8,
    auditedRank: 1,
    dataPoints: 1,
    compareBaseHref: `/${entry.market}/${entry.category}/best/${entry.topic}`,
    keyFacts: {},
  };
}

function makeItem(entry: BestXManifestEntry, productSlug: string, context: ResearchContext): DiscoveryItem {
  return {
    id: `product:${entry.market}:${entry.category}:${productSlug}`,
    market: entry.market,
    category: entry.category,
    review: null,
    display: { title: productSlug, description: '', bestFor: null, searchText: productSlug, sortDate: null },
    researchContexts: [context],
  };
}

/** Builds the two colliding-topic projections, deliberately in REVERSE
 *  manifest order, then runs them through the real `sortHubProjections` —
 *  proving both the grouping fix AND that manifest order survives it, not
 *  just that pre-sorted input happens to group correctly. */
function buildCollidingProjections(): DiscoveryProjection[] {
  const creditRepairContext = makeContext(creditRepairEntry, 'credit-saint', creditRepairManifestOrder);
  const debtReliefContext = makeContext(debtReliefEntry, 'national-debt-relief', debtReliefManifestOrder);
  const creditRepairItem = makeItem(creditRepairEntry, 'credit-saint', creditRepairContext);
  const debtReliefItem = makeItem(debtReliefEntry, 'national-debt-relief', debtReliefContext);

  const unsorted: DiscoveryProjection[] = [
    { itemId: debtReliefItem.id, kind: 'dossier', item: debtReliefItem, context: debtReliefContext },
    { itemId: creditRepairItem.id, kind: 'dossier', item: creditRepairItem, context: creditRepairContext },
  ];
  return sortHubProjections(unsorted);
}

// --- ResearchHubPage.tsx: groupBrowseNodes (server, unfiltered fallback) ---

describe('groupBrowseNodes — colliding topic names across categories (server)', () => {
  it('renders us/credit-repair/companies and us/debt-relief/companies as two separate groups, each with its own label, in manifest order', () => {
    const sorted = buildCollidingProjections();
    const nodes: ResearchHubNode[] = sorted.map((projection) => ({
      key: projectionNodeKey(
        projection.itemId,
        projection.kind === 'dossier' ? projection.context.cockpitKey : null,
      ),
      projection,
      node: null,
    }));

    const { dossierGroups, reviewEntries } = groupBrowseNodes(nodes);

    expect(reviewEntries).toHaveLength(0);
    // The core defect: a bare-topic Map key collapses both categories into
    // ONE group. Two groups is the whole point of the fix.
    expect(dossierGroups).toHaveLength(2);

    // Manifest order preserved: credit-repair (index 7) precedes debt-relief
    // (index 11) in BEST_X_MANIFEST.
    expect(creditRepairManifestOrder).toBeLessThan(debtReliefManifestOrder);
    expect(dossierGroups[0].topicLabel).toBe('Best Credit Repair');
    expect(dossierGroups[1].topicLabel).toBe('Best Debt Relief Companies');

    // Each group holds only its OWN product — never the other category's
    // product merged in under the winning label.
    expect(dossierGroups[0].entries).toHaveLength(1);
    expect(dossierGroups[1].entries).toHaveLength(1);
    expect(dossierGroups[0].entries[0].projection.itemId).toBe('product:us:credit-repair:credit-saint');
    expect(dossierGroups[1].entries[0].projection.itemId).toBe('product:us:debt-relief:national-debt-relief');

    // Cockpit-key identity, never the bare topic string.
    const creditRepairKey: CockpitKey = 'us/credit-repair/companies';
    const debtReliefKey: CockpitKey = 'us/debt-relief/companies';
    expect(dossierGroups[0].cockpitKey).toBe(creditRepairKey);
    expect(dossierGroups[1].cockpitKey).toBe(debtReliefKey);
    expect(dossierGroups[0].category).toBe('credit-repair');
    expect(dossierGroups[1].category).toBe('debt-relief');

    // data-testid rule (documented in ResearchHubPage.tsx/groupBrowseNodes):
    // bare `dossier-<topic>` when unique in-market, `dossier-<category>-<topic>`
    // when BEST_X_MANIFEST reuses the topic across categories — "companies"
    // does, in this market, so BOTH groups get the disambiguated form.
    expect(dossierGroups[0].testId).toBe('dossier-credit-repair-companies');
    expect(dossierGroups[1].testId).toBe('dossier-debt-relief-companies');
  });
});

// --- ResearchHub.tsx: groupResolvedEntries (client, filtered/default views) -

describe('groupResolvedEntries — colliding topic names across categories (client)', () => {
  it('mirrors groupBrowseNodes: two separate groups, correct labels, correct manifest order', () => {
    const sorted = buildCollidingProjections();
    const ambiguousTopics = new Set(['companies']);

    const entries = sorted
      .filter((projection): projection is Extract<DiscoveryProjection, { kind: 'dossier' }> => projection.kind === 'dossier')
      .map((projection) => ({
        key: projectionNodeKey(projection.itemId, projection.context.cockpitKey),
        kind: 'dossier' as const,
        topic: projection.context.topic,
        topicLabel: projection.context.topicLabel,
        category: projection.item.category,
        isFeatured: false,
        node: null,
        cockpitKey: projection.context.cockpitKey,
        productSlug: projection.context.productSlug,
        displayName: projection.context.displayName,
      }));

    const { dossierGroups, reviewEntries } = groupResolvedEntries(entries, ambiguousTopics);

    expect(reviewEntries).toHaveLength(0);
    expect(dossierGroups).toHaveLength(2);
    expect(dossierGroups[0].topicLabel).toBe('Best Credit Repair');
    expect(dossierGroups[1].topicLabel).toBe('Best Debt Relief Companies');
    expect(dossierGroups[0].cockpitKey).toBe('us/credit-repair/companies');
    expect(dossierGroups[1].cockpitKey).toBe('us/debt-relief/companies');
    expect(dossierGroups[0].testId).toBe('dossier-credit-repair-companies');
    expect(dossierGroups[1].testId).toBe('dossier-debt-relief-companies');
  });
});

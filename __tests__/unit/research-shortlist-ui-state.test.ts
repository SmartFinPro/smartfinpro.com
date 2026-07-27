// __tests__/unit/research-shortlist-ui-state.test.ts
// Restore-safe, multi-topic shortlist UI state (unified-research-discovery-pr2-hubs
// plan, Task 5; spec §11). Pure-logic coverage only — no DOM, no React
// rendering (vitest.config.ts runs this suite under `environment: 'node'`):
//
//   - `shortlistReducer` / `initialShortlistState` / `shortlistPersistCommand`:
//     the restore-order contract (never persist before restore completes) and
//     the cross-topic switch reducer transitions, tested as plain state
//     transforms.
//   - `buildShortlistScopeSnapshot` / `knownScopesFor`: the CLIENT-ONLY
//     three-tier ShortlistScopeSnapshot builder (spec §11.2.1) —
//     `components/research/ResearchShortlist.tsx`'s file header documents WHY
//     it is client-only and why a zero-context known scope is classified
//     `unavailableScopes` (`unknown_state`) rather than guessed as an
//     authoritative empty result. The partition-invariant test below is the
//     operator-mandated merge blocker for this design.
//   - `buildCockpitTopicIndex`: the small per-cockpitKey display-name /
//     compare-href index the shortlist bar and compare handoff read.
//
// "Cancel leaves storage byte-identical" (spec §11.3.1) is proven twice:
// here, at the pure-reducer level (the persist COMMAND a cancel produces is
// provably unchanged), and again end-to-end against real sessionStorage in
// e2e/research-shell.spec.ts's "scope switch" test (a full storage snapshot
// comparison, which this node-environment suite cannot perform).

import { describe, expect, it } from 'vitest';
import { markets, type Market } from '@/lib/i18n/config';
import { BEST_X_MANIFEST } from '@/lib/comparison/topics/manifest';
import {
  buildCockpitTopicIndex,
  buildShortlistScopeSnapshot,
  initialShortlistState,
  knownScopesFor,
  shortlistPersistCommand,
  shortlistReducer,
  type ResearchShortlistState,
} from '@/components/research/ResearchShortlist';
import {
  cockpitKeyFor,
  type CockpitKey,
  type DiscoveryItem,
  type ResearchContext,
} from '@/lib/research/catalog-shell-logic';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const makeContext = (over: Partial<ResearchContext> = {}): ResearchContext => ({
  cockpitKey: 'us/trading/trading-platforms',
  topic: 'trading-platforms',
  topicLabel: 'Best Trading Platforms',
  manifestOrder: 0,
  productSlug: 'fidelity',
  displayName: 'Fidelity',
  tagline: 'Full-service investing',
  bestFor: 'Long-term investors',
  status: 'audited',
  confidence: 'high',
  dataVerifiedAt: '2026-07-03',
  auditedScore: 9.6,
  auditedRank: 1,
  dataPoints: 4,
  compareBaseHref: '/us/trading/best/trading-platforms',
  keyFacts: {},
  ...over,
});

const makeItem = (over: Partial<DiscoveryItem> = {}): DiscoveryItem => ({
  id: 'product:us:trading:fidelity',
  market: 'us',
  category: 'trading',
  review: null,
  display: { title: 'Fidelity', description: '', bestFor: null, searchText: 'fidelity', sortDate: null },
  researchContexts: [makeContext()],
  ...over,
});

// ── shortlistReducer / initialShortlistState / shortlistPersistCommand ──────
// (Task 5 Step 1's own examples, plus the remaining transitions.)

describe('initialShortlistState / shortlistPersistCommand — restore-order contract', () => {
  it('never persists before restore completes', () => {
    const state = initialShortlistState();
    expect(shortlistPersistCommand(state)).toBeNull();
  });

  it('persists only after hasRestored becomes true', () => {
    const state = shortlistReducer(initialShortlistState(), {
      type: 'restored',
      value: { cockpitKey: 'us/trading/trading-platforms', slugs: ['fidelity'] },
    });
    expect(shortlistPersistCommand(state)).toEqual({
      cockpitKey: 'us/trading/trading-platforms',
      slugs: ['fidelity'],
    });
  });

  it('persists a genuinely empty restored state too (hasRestored is what gates persistence, not emptiness)', () => {
    const state = shortlistReducer(initialShortlistState(), {
      type: 'restored',
      value: { cockpitKey: null, slugs: [] },
    });
    expect(shortlistPersistCommand(state)).toEqual({ cockpitKey: null, slugs: [] });
  });
});

describe('shortlistReducer', () => {
  const restoredState = (): ResearchShortlistState =>
    shortlistReducer(initialShortlistState(), {
      type: 'restored',
      value: { cockpitKey: 'us/trading/trading-platforms', slugs: ['fidelity'] },
    });

  it('"set" replaces cockpitKey and slugs directly (same-scope add/remove)', () => {
    const next = shortlistReducer(restoredState(), {
      type: 'set',
      value: { cockpitKey: 'us/trading/trading-platforms', slugs: ['fidelity', 'charles-schwab'] },
    });
    expect(next.cockpitKey).toBe('us/trading/trading-platforms');
    expect(next.slugs).toEqual(['fidelity', 'charles-schwab']);
    expect(next.pendingSwitch).toBeNull();
  });

  it('"request-switch" sets pendingSwitch WITHOUT touching cockpitKey/slugs — a blocked mutation', () => {
    const before = restoredState();
    const requested = shortlistReducer(before, {
      type: 'request-switch',
      cockpitKey: 'us/personal-finance/robo-advisors',
      slug: 'betterment',
    });
    expect(requested.cockpitKey).toBe(before.cockpitKey);
    expect(requested.slugs).toEqual(before.slugs);
    expect(requested.pendingSwitch).toEqual({
      cockpitKey: 'us/personal-finance/robo-advisors',
      slug: 'betterment',
    });
  });

  it('"cancel-switch" clears pendingSwitch and leaves cockpitKey/slugs untouched', () => {
    const requested = shortlistReducer(restoredState(), {
      type: 'request-switch',
      cockpitKey: 'us/personal-finance/robo-advisors',
      slug: 'betterment',
    });
    const cancelled = shortlistReducer(requested, { type: 'cancel-switch' });
    expect(cancelled.pendingSwitch).toBeNull();
    expect(cancelled.cockpitKey).toBe('us/trading/trading-platforms');
    expect(cancelled.slugs).toEqual(['fidelity']);
  });

  it('"cancel-switch" leaves the PERSIST COMMAND unchanged — the pure-logic half of the byte-identical guarantee (spec §11.3.1). The other half — real sessionStorage never touched — is proven end-to-end in e2e/research-shell.spec.ts.', () => {
    const requested = shortlistReducer(restoredState(), {
      type: 'request-switch',
      cockpitKey: 'us/personal-finance/robo-advisors',
      slug: 'betterment',
    });
    const beforeCancel = shortlistPersistCommand(requested);
    const cancelled = shortlistReducer(requested, { type: 'cancel-switch' });
    const afterCancel = shortlistPersistCommand(cancelled);
    expect(afterCancel).toEqual(beforeCancel);
  });

  it('"cancel-switch" with no pendingSwitch is a no-op (returns the exact same state reference)', () => {
    const before = restoredState();
    const after = shortlistReducer(before, { type: 'cancel-switch' });
    expect(after).toBe(before);
  });

  it('"confirm-switch" applies the pending scope with EXACTLY its one requested slug — it never merges the old scope\'s other slugs into the new one', () => {
    const twoSlugState = shortlistReducer(restoredState(), {
      type: 'set',
      value: { cockpitKey: 'us/trading/trading-platforms', slugs: ['fidelity', 'charles-schwab'] },
    });
    const requested = shortlistReducer(twoSlugState, {
      type: 'request-switch',
      cockpitKey: 'us/personal-finance/robo-advisors',
      slug: 'betterment',
    });
    const confirmed = shortlistReducer(requested, { type: 'confirm-switch' });
    expect(confirmed.cockpitKey).toBe('us/personal-finance/robo-advisors');
    expect(confirmed.slugs).toEqual(['betterment']);
    expect(confirmed.pendingSwitch).toBeNull();
  });

  it('"confirm-switch" with no pendingSwitch is a defensive no-op', () => {
    const before = restoredState();
    const after = shortlistReducer(before, { type: 'confirm-switch' });
    expect(after).toBe(before);
  });

  it('"clear" resets cockpitKey/slugs/pendingSwitch to empty', () => {
    const requested = shortlistReducer(restoredState(), {
      type: 'request-switch',
      cockpitKey: 'us/personal-finance/robo-advisors',
      slug: 'betterment',
    });
    const cleared = shortlistReducer(requested, { type: 'clear' });
    expect(cleared).toEqual({
      hasRestored: true,
      cockpitKey: null,
      slugs: [],
      pendingSwitch: null,
    });
  });
});

// ── buildShortlistScopeSnapshot / knownScopesFor (spec §11.2.1) ─────────────

describe('knownScopesFor', () => {
  it('matches real BEST_X_MANIFEST entries for the US market, including the credit-repair/debt-relief "companies" pair', () => {
    const known = knownScopesFor('us');
    expect(known.has('us/trading/trading-platforms')).toBe(true);
    expect(known.has('us/credit-repair/companies')).toBe(true);
    expect(known.has('us/debt-relief/companies')).toBe(true);
    // Same topic string, different category — must stay two distinct keys.
    expect(known.size).toBeGreaterThanOrEqual(2);
  });
});

describe('buildShortlistScopeSnapshot — partition invariant (merge blocker)', () => {
  // Operator-mandated proof: knownScopes must partition COMPLETELY into
  // availableScopes ∪ unavailableScopes for every market — disjoint (no key
  // in both) and gapless (no key in neither). Run against the REAL
  // BEST_X_MANIFEST for all four markets so a future manifest edit or a
  // regression in the builder itself is caught here, not discovered live.
  it.each(markets)('holds for market=%s with an EMPTY catalog (every known scope has zero observed contexts)', (market: Market) => {
    const snapshot = buildShortlistScopeSnapshot(market, []);
    const known = knownScopesFor(market);

    for (const key of known) {
      const inAvailable = snapshot.availableScopes.has(key);
      const inUnavailable = snapshot.unavailableScopes.has(key);
      // Disjoint: never both.
      expect(inAvailable && inUnavailable).toBe(false);
      // Gapless: never neither.
      expect(inAvailable || inUnavailable).toBe(true);
    }
    // No extra keys leak into either map beyond knownScopes.
    for (const key of snapshot.availableScopes.keys()) expect(known.has(key)).toBe(true);
    for (const key of snapshot.unavailableScopes.keys()) expect(known.has(key)).toBe(true);
  });

  it.each(markets)('holds for market=%s with every known topic represented by at least one context', (market: Market) => {
    const items: DiscoveryItem[] = BEST_X_MANIFEST.filter((entry) => entry.market === market).map((entry, index) =>
      makeItem({
        id: `product:${market}:${entry.category}:fixture-${index}`,
        market,
        category: entry.category,
        researchContexts: [
          makeContext({
            cockpitKey: cockpitKeyFor(market, entry.category, entry.topic),
            topic: entry.topic,
            topicLabel: entry.label,
            productSlug: `fixture-${index}`,
          }),
        ],
      }),
    );

    const snapshot = buildShortlistScopeSnapshot(market, items);
    const known = knownScopesFor(market);

    for (const key of known) {
      expect(snapshot.availableScopes.has(key) !== snapshot.unavailableScopes.has(key)).toBe(true);
    }
    for (const key of snapshot.availableScopes.keys()) expect(known.has(key)).toBe(true);
    for (const key of snapshot.unavailableScopes.keys()) expect(known.has(key)).toBe(true);
  });
});

describe('buildShortlistScopeSnapshot — behavior', () => {
  const tradingKey: CockpitKey = 'us/trading/trading-platforms';
  const roboKey: CockpitKey = 'us/personal-finance/robo-advisors';

  it('classifies a cockpitKey with at least one observed context as available, with its full slug set', () => {
    const items = [
      makeItem({
        id: 'a',
        researchContexts: [makeContext({ cockpitKey: tradingKey, productSlug: 'fidelity' })],
      }),
      makeItem({
        id: 'b',
        researchContexts: [makeContext({ cockpitKey: tradingKey, productSlug: 'charles-schwab' })],
      }),
    ];
    const snapshot = buildShortlistScopeSnapshot('us', items);
    expect(snapshot.availableScopes.get(tradingKey)).toEqual(new Set(['fidelity', 'charles-schwab']));
    expect(snapshot.unavailableScopes.has(tradingKey)).toBe(false);
  });

  it('classifies a KNOWN manifest cockpitKey with ZERO observed contexts as unavailable("unknown_state") — never as an available-empty result, since the client cannot tell "failed to load" apart from "loaded fine, zero rows" (see the file header of ResearchShortlist.tsx)', () => {
    // No item anywhere carries a context for roboKey.
    const items = [
      makeItem({ id: 'a', researchContexts: [makeContext({ cockpitKey: tradingKey, productSlug: 'fidelity' })] }),
    ];
    const snapshot = buildShortlistScopeSnapshot('us', items);
    expect(snapshot.availableScopes.has(roboKey)).toBe(false);
    expect(snapshot.unavailableScopes.get(roboKey)).toBe('unknown_state');
  });

  it('is built from the FULL items array regardless of what a caller might otherwise filter — passing every context for two topics classifies BOTH as available in one snapshot (never derived from a single-topic projection)', () => {
    const items = [
      makeItem({ id: 'a', researchContexts: [makeContext({ cockpitKey: tradingKey, productSlug: 'fidelity' })] }),
      makeItem({
        id: 'b',
        category: 'personal-finance',
        researchContexts: [
          makeContext({
            cockpitKey: roboKey,
            topic: 'robo-advisors',
            topicLabel: 'Best Robo-Advisors',
            productSlug: 'betterment',
          }),
        ],
      }),
    ];
    const snapshot = buildShortlistScopeSnapshot('us', items);
    expect(snapshot.availableScopes.has(tradingKey)).toBe(true);
    expect(snapshot.availableScopes.has(roboKey)).toBe(true);
  });
});

// ── buildCockpitTopicIndex ───────────────────────────────────────────────────

describe('buildCockpitTopicIndex', () => {
  it('indexes compareBaseHref and productSlug -> displayName per cockpitKey', () => {
    const items = [
      makeItem({
        id: 'a',
        researchContexts: [
          makeContext({
            cockpitKey: 'us/trading/trading-platforms',
            productSlug: 'fidelity',
            displayName: 'Fidelity',
            compareBaseHref: '/us/trading/best/trading-platforms',
          }),
        ],
      }),
      makeItem({
        id: 'b',
        researchContexts: [
          makeContext({
            cockpitKey: 'us/trading/trading-platforms',
            productSlug: 'charles-schwab',
            displayName: 'Charles Schwab',
            compareBaseHref: '/us/trading/best/trading-platforms',
          }),
        ],
      }),
    ];
    const index = buildCockpitTopicIndex(items);
    const entry = index.get('us/trading/trading-platforms');
    expect(entry?.compareBaseHref).toBe('/us/trading/best/trading-platforms');
    expect(entry?.namesBySlug.get('fidelity')).toBe('Fidelity');
    expect(entry?.namesBySlug.get('charles-schwab')).toBe('Charles Schwab');
  });

  it('keeps two different cockpitKeys in separate entries (credit-repair/debt-relief "companies" collision)', () => {
    const items = [
      makeItem({
        id: 'a',
        category: 'credit-repair',
        researchContexts: [
          makeContext({
            cockpitKey: 'us/credit-repair/companies',
            topic: 'companies',
            topicLabel: 'Best Credit Repair',
            productSlug: 'credit-saint',
            displayName: 'Credit Saint',
            compareBaseHref: '/us/credit-repair/best/companies',
          }),
        ],
      }),
      makeItem({
        id: 'b',
        category: 'debt-relief',
        researchContexts: [
          makeContext({
            cockpitKey: 'us/debt-relief/companies',
            topic: 'companies',
            topicLabel: 'Best Debt Relief Companies',
            productSlug: 'national-debt-relief',
            displayName: 'National Debt Relief',
            compareBaseHref: '/us/debt-relief/best/companies',
          }),
        ],
      }),
    ];
    const index = buildCockpitTopicIndex(items);
    expect(index.get('us/credit-repair/companies')?.namesBySlug.get('credit-saint')).toBe('Credit Saint');
    expect(index.get('us/debt-relief/companies')?.namesBySlug.get('national-debt-relief')).toBe(
      'National Debt Relief',
    );
    expect(index.get('us/credit-repair/companies')?.namesBySlug.has('national-debt-relief')).toBe(false);
  });
});

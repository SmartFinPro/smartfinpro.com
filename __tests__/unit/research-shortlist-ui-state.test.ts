// __tests__/unit/research-shortlist-ui-state.test.ts
// Restore-safe, multi-topic shortlist UI state (unified-research-discovery-pr2-hubs
// plan, Task 5; spec §11). Pure-logic coverage only — no DOM, no React
// rendering (vitest.config.ts runs this suite under `environment: 'node'`):
//
//   - `shortlistReducer` / `initialShortlistState` / `shortlistPersistCommand`:
//     the restore-order contract (never persist before restore completes) and
//     the cross-topic switch reducer transitions, tested as plain state
//     transforms.
//   - `buildShortlistScopeSnapshotDTO` / `knownScopesFor` (lib/research/catalog-shell-logic.ts,
//     relocated here 2026-07-27, operator merge-blocker fix): the three-tier
//     ShortlistScopeSnapshotDTO builder now runs SERVER-SIDE, fed the typed
//     per-topic `TopicOverlayResult[]` load (lib/research/catalog.ts's
//     `buildDiscoveryScopeSnapshot` adapts to it) — the client-only version
//     that used to live in `components/research/ResearchShortlist.tsx` was
//     removed because it could not tell "this topic loaded fine with zero
//     rows" apart from "this topic's load failed/backed off" once data had
//     already flattened into `DiscoveryItem[]`. The partition-invariant test
//     below is the operator-mandated merge blocker for this design, still run
//     against the REAL `BEST_X_MANIFEST` for all four markets.
//   - `hydrateShortlistScopeSnapshot`: the pure DTO -> Set/Map reshape the
//     client hook applies to the server-built DTO — no classification logic
//     of its own.
//   - `buildCockpitTopicIndex`: the small per-cockpitKey display-name /
//     compare-href index the shortlist bar and compare handoff read.
//   - The mandatory "empty catalog" restore scenario (operator merge-blocker,
//     2026-07-27, tests (a)/(b)): composes the real `buildDiscoveryScopeSnapshot`
//     (lib/research/catalog.ts) + `hydrateShortlistScopeSnapshot` +
//     `restoreScopedShortlist` pipeline exactly as `ShortlistRestoreController`
//     invokes it, proving the destructive-cleanup (ok:true, zero contexts) and
//     byte-identical-preservation (ok:false, load_failed) cases both behave
//     correctly for a market whose catalog renders zero cards.
//
// "Cancel leaves storage byte-identical" (spec §11.3.1) is proven twice:
// here, at the pure-reducer level (the persist COMMAND a cancel produces is
// provably unchanged), and again end-to-end against real sessionStorage in
// e2e/research-shell.spec.ts's "scope switch" test (a full storage snapshot
// comparison, which this node-environment suite cannot perform).

import { describe, expect, it } from 'vitest';
import { markets, type Market } from '@/lib/i18n/config';
import { BEST_X_MANIFEST, type BestXManifestEntry } from '@/lib/comparison/topics/manifest';
import {
  buildCockpitTopicIndex,
  initialShortlistState,
  shortlistPersistCommand,
  shortlistReducer,
  type ResearchShortlistState,
} from '@/components/research/ResearchShortlist';
import {
  buildShortlistScopeSnapshotDTO,
  cockpitKeyFor,
  hydrateShortlistScopeSnapshot,
  knownScopesFor,
  restoreScopedShortlist,
  shortlistPointerKey,
  shortlistStorageKey,
  type CockpitKey,
  type DiscoveryItem,
  type ResearchContext,
  type StorageLike,
  type TopicScopeResult,
} from '@/lib/research/catalog-shell-logic';
import { buildDiscoveryScopeSnapshot, type TopicOverlayResult } from '@/lib/research/catalog';

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

// ── buildShortlistScopeSnapshotDTO / knownScopesFor (spec §11.2.1, relocated
//    to lib/research/catalog-shell-logic.ts — operator merge-blocker fix
//    2026-07-27) ────────────────────────────────────────────────────────────

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

/** Builds one `TopicScopeResult` fixture for `entry`, mirroring exactly what
 *  lib/research/catalog.ts's `toTopicScopeResult` adapter produces from a
 *  real `TopicOverlayResult`. */
const toTopicScopeResult = (
  market: Market,
  entry: BestXManifestEntry,
  result: { ok: true; slugs: string[] } | { ok: false; reason: 'load_failed' | 'backoff' | 'missing_topic_config' },
): TopicScopeResult => ({
  cockpitKey: cockpitKeyFor(market, entry.category, entry.topic),
  ok: result.ok,
  slugs: result.ok ? result.slugs : [],
  reason: result.ok ? null : result.reason,
});

describe('buildShortlistScopeSnapshotDTO — partition invariant (merge blocker)', () => {
  // Operator-mandated proof: knownScopes must partition COMPLETELY into
  // availableScopes ∪ unavailableScopes for every market — disjoint (no key
  // in both) and gapless (no key in neither). Run against the REAL
  // BEST_X_MANIFEST for all four markets so a future manifest edit or a
  // regression in the builder itself is caught here, not discovered live.
  // With the DTO in place (operator fix 2026-07-27), `unknown_state` is no
  // longer the DEFAULT bucket for a topic with no observed products — the
  // second case below gives every known topic a REAL ok:true/ok:false result
  // and proves `unknown_state` never appears at all in that scenario.
  it.each(markets)('holds for market=%s with NO results at all (every known scope is a genuinely missing result bucket)', (market: Market) => {
    const dto = buildShortlistScopeSnapshotDTO(market, []);
    const known = knownScopesFor(market);

    expect(dto.knownScopes).toHaveLength(known.size);
    for (const key of known) {
      const inAvailable = dto.availableScopes.some((entry) => entry.cockpitKey === key);
      const inUnavailable = dto.unavailableScopes.some((entry) => entry.cockpitKey === key);
      // Disjoint: never both.
      expect(inAvailable && inUnavailable).toBe(false);
      // Gapless: never neither.
      expect(inAvailable || inUnavailable).toBe(true);
    }
    // With zero results, every known scope is a genuinely missing bucket —
    // never a guess about a zero-context topic.
    expect(dto.unavailableScopes.every((entry) => entry.reason === 'unknown_state')).toBe(true);
  });

  it.each(markets)('holds for market=%s with every known topic represented by a REAL ok:true or ok:false result — unknown_state never appears (the case the old client-only builder could never produce)', (market: Market) => {
    const known = knownScopesFor(market);
    const entries = BEST_X_MANIFEST.filter((entry) => entry.market === market);
    const results: TopicScopeResult[] = entries.map((entry, index) =>
      index % 2 === 0
        ? toTopicScopeResult(market, entry, { ok: true, slugs: [`fixture-${index}`] })
        : toTopicScopeResult(market, entry, { ok: false, reason: 'load_failed' }),
    );

    const dto = buildShortlistScopeSnapshotDTO(market, results);

    expect(dto.knownScopes).toHaveLength(known.size);
    for (const key of known) {
      const inAvailable = dto.availableScopes.some((entry) => entry.cockpitKey === key);
      const inUnavailable = dto.unavailableScopes.some((entry) => entry.cockpitKey === key);
      expect(inAvailable !== inUnavailable).toBe(true);
    }
    expect(dto.unavailableScopes.some((entry) => entry.reason === 'unknown_state')).toBe(false);
  });
});

describe('buildShortlistScopeSnapshotDTO — behavior', () => {
  const tradingKey: CockpitKey = 'us/trading/trading-platforms';
  const roboKey: CockpitKey = 'us/personal-finance/robo-advisors';
  const tradingEntry = BEST_X_MANIFEST.find(
    (entry) => entry.market === 'us' && entry.category === 'trading' && entry.topic === 'trading-platforms',
  )!;
  const roboEntry = BEST_X_MANIFEST.find(
    (entry) => entry.market === 'us' && entry.category === 'personal-finance' && entry.topic === 'robo-advisors',
  )!;

  it('classifies an ok:true result as available, with its full slug set', () => {
    const results = [toTopicScopeResult('us', tradingEntry, { ok: true, slugs: ['fidelity', 'charles-schwab'] })];
    const dto = buildShortlistScopeSnapshotDTO('us', results);
    expect(dto.availableScopes.find((entry) => entry.cockpitKey === tradingKey)?.slugs).toEqual([
      'fidelity',
      'charles-schwab',
    ]);
    expect(dto.unavailableScopes.some((entry) => entry.cockpitKey === tradingKey)).toBe(false);
  });

  it('classifies an ok:true result with an EMPTY slug list as available-empty — the authoritative "loaded fine, zero rows" case (spec §11.2.1 Rule 4), never guessed unavailable', () => {
    const results = [toTopicScopeResult('us', tradingEntry, { ok: true, slugs: [] })];
    const dto = buildShortlistScopeSnapshotDTO('us', results);
    expect(dto.availableScopes.find((entry) => entry.cockpitKey === tradingKey)).toEqual({
      cockpitKey: tradingKey,
      slugs: [],
    });
    expect(dto.unavailableScopes.some((entry) => entry.cockpitKey === tradingKey)).toBe(false);
  });

  it('classifies a KNOWN manifest cockpitKey with NO corresponding result as unavailable("unknown_state") — a genuinely missing result bucket, distinct from an ok:true-zero-rows result', () => {
    const results = [toTopicScopeResult('us', tradingEntry, { ok: true, slugs: ['fidelity'] })];
    // No result anywhere for roboKey.
    const dto = buildShortlistScopeSnapshotDTO('us', results);
    expect(dto.availableScopes.some((entry) => entry.cockpitKey === roboKey)).toBe(false);
    expect(dto.unavailableScopes.find((entry) => entry.cockpitKey === roboKey)?.reason).toBe('unknown_state');
  });

  it('classifies an ok:false result with its real reason — never defaulted to unknown_state', () => {
    const results = [toTopicScopeResult('us', tradingEntry, { ok: false, reason: 'backoff' })];
    const dto = buildShortlistScopeSnapshotDTO('us', results);
    expect(dto.unavailableScopes.find((entry) => entry.cockpitKey === tradingKey)?.reason).toBe('backoff');
  });

  it('is built from results for MULTIPLE topics in one snapshot — both land in availableScopes (never derived from a single-topic projection)', () => {
    const results = [
      toTopicScopeResult('us', tradingEntry, { ok: true, slugs: ['fidelity'] }),
      toTopicScopeResult('us', roboEntry, { ok: true, slugs: ['betterment'] }),
    ];
    const dto = buildShortlistScopeSnapshotDTO('us', results);
    expect(dto.availableScopes.some((entry) => entry.cockpitKey === tradingKey)).toBe(true);
    expect(dto.availableScopes.some((entry) => entry.cockpitKey === roboKey)).toBe(true);
  });
});

describe('hydrateShortlistScopeSnapshot', () => {
  it('rebuilds the Set/Map shape from the DTO — pure reshape, no re-classification', () => {
    const dto = {
      knownScopes: ['us/trading/trading-platforms', 'us/personal-finance/robo-advisors'] as CockpitKey[],
      availableScopes: [
        { cockpitKey: 'us/trading/trading-platforms' as CockpitKey, slugs: ['fidelity', 'fidelity'] },
      ],
      unavailableScopes: [
        { cockpitKey: 'us/personal-finance/robo-advisors' as CockpitKey, reason: 'load_failed' as const },
      ],
    };

    const snapshot = hydrateShortlistScopeSnapshot(dto);

    expect(snapshot.knownScopes).toEqual(new Set(dto.knownScopes));
    // Duplicate slugs in the DTO collapse into the Set, as expected.
    expect(snapshot.availableScopes.get('us/trading/trading-platforms')).toEqual(new Set(['fidelity']));
    expect(snapshot.unavailableScopes.get('us/personal-finance/robo-advisors')).toBe('load_failed');
  });
});

// ── Mandatory empty-catalog restore scenario (operator merge-blocker,
//    2026-07-27, tests (a) and (b)) ──────────────────────────────────────────
// Composes the REAL pipeline `ShortlistRestoreController` invokes when
// `ResearchHubBody` renders a market whose catalog has zero items:
// `buildDiscoveryScopeSnapshot` (lib/research/catalog.ts, run against the
// REAL BEST_X_MANIFEST for 'us') -> `hydrateShortlistScopeSnapshot` ->
// `restoreScopedShortlist`. Proves the two counter-cases the operator
// mandated for a hub that renders no cards: an authoritatively empty topic
// MUST clean up; an unverifiable topic MUST NOT touch storage at all.

describe('empty-catalog restore scenario — server DTO -> hydrate -> restore (mandatory tests a & b)', () => {
  const targetKey: CockpitKey = 'us/trading/trading-platforms';
  const targetEntry = BEST_X_MANIFEST.find(
    (entry) => entry.market === 'us' && entry.category === 'trading' && entry.topic === 'trading-platforms',
  )!;

  /** In-memory StorageLike, pre-seeded exactly like a real, previously
   *  persisted scoped shortlist for `cockpitKey` — the market pointer AND
   *  the scoped slug array. Returns the backing Map too, so a test can take
   *  a FULL storage snapshot (not a key-by-key spot check). */
  const seededStorage = (
    cockpitKey: CockpitKey,
    slugs: string[],
  ): { storage: StorageLike; data: Map<string, string> } => {
    const data = new Map<string, string>();
    const [, category, topic] = cockpitKey.split('/');
    data.set(shortlistPointerKey('us'), `${category}:${topic}`);
    data.set(shortlistStorageKey(cockpitKey), JSON.stringify(slugs));
    const storage: StorageLike = {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value);
      },
      removeItem: (key) => {
        data.delete(key);
      },
    };
    return { storage, data };
  };

  it('(a) server reports ok:true, contexts:[] for the stored scope — the page renders no cards — removes BOTH the stored pointer and the scoped key', () => {
    const { storage, data } = seededStorage(targetKey, ['fidelity']);
    expect(data.size).toBe(2); // sanity: pointer + scoped key both present before restore

    const results: TopicOverlayResult[] = [{ ok: true, entry: targetEntry, contexts: [], rows: [] }];
    const snapshot = hydrateShortlistScopeSnapshot(buildDiscoveryScopeSnapshot('us', results));

    const restored = restoreScopedShortlist(storage, 'us', snapshot);

    expect(restored).toEqual({ cockpitKey: null, slugs: [] });
    expect(data.has(shortlistPointerKey('us'))).toBe(false);
    expect(data.has(shortlistStorageKey(targetKey))).toBe(false);
    expect(data.size).toBe(0);
  });

  it('(b) counter-case: server reports ok:false, reason:"load_failed" for the stored scope — the SAME visibly empty hub — leaves storage BYTE-IDENTICAL (full snapshot comparison, not key-by-key)', () => {
    const { storage, data } = seededStorage(targetKey, ['fidelity']);
    const before = new Map(data); // full snapshot taken BEFORE restore runs

    const results: TopicOverlayResult[] = [{ ok: false, entry: targetEntry, reason: 'load_failed' }];
    const snapshot = hydrateShortlistScopeSnapshot(buildDiscoveryScopeSnapshot('us', results));

    const restored = restoreScopedShortlist(storage, 'us', snapshot);

    expect(restored).toEqual({ cockpitKey: null, slugs: [] });
    expect(data).toEqual(before); // not a single key touched
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

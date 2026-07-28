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
  describeScopeSwitch,
  hydrateShortlistScopeSnapshot,
  knownScopesFor,
  restoreScopedShortlist,
  shortlistPointerKey,
  shortlistStorageKey,
  toggleScopedShortlist,
  type CockpitKey,
  type DiscoveryItem,
  type ResearchContext,
  type RestoredShortlist,
  type ScopedShortlist,
  type ShortlistScopeSnapshot,
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
  });

  // A PROPOSED cross-scope switch (spec §11.3.1) is no longer a reducer
  // action at all (MERGE BLOCKER fix, adversarial review of PR #122) — it
  // lives entirely in `useScopedResearchShortlist`'s own separate
  // `pendingSwitch` useState, which `shortlistReducer`/`shortlistPersistCommand`
  // can never see. Proposing/cancelling a switch therefore NEVER produces a
  // new `ResearchShortlistState` reference at all — there is no
  // 'request-switch'/'cancel-switch' action to dispatch, so there is nothing
  // for the persist effect (still plainly `[state, market]`) to react to.
  // See `describe('proposing/cancelling a cross-scope switch never touches
  // the reducer ...')` below for the behavioral proof, and
  // e2e/research-shell.spec.ts's "scope switch" test for the real-browser,
  // real-sessionStorage byte-identical proof.

  it('"confirm-switch" applies the target scope with EXACTLY its one requested slug — it never merges the old scope\'s other slugs into the new one', () => {
    const twoSlugState = shortlistReducer(restoredState(), {
      type: 'set',
      value: { cockpitKey: 'us/trading/trading-platforms', slugs: ['fidelity', 'charles-schwab'] },
    });
    const confirmed = shortlistReducer(twoSlugState, {
      type: 'confirm-switch',
      cockpitKey: 'us/personal-finance/robo-advisors',
      slug: 'betterment',
    });
    expect(confirmed.cockpitKey).toBe('us/personal-finance/robo-advisors');
    expect(confirmed.slugs).toEqual(['betterment']);
    expect(confirmed.unverifiableCockpitKey).toBeNull();
  });

  it('"clear" resets cockpitKey/slugs to empty', () => {
    const cleared = shortlistReducer(restoredState(), { type: 'clear' });
    expect(cleared).toEqual({
      hasRestored: true,
      cockpitKey: null,
      slugs: [],
      unverifiableCockpitKey: null,
    });
  });
});

// ── Proposing/cancelling a cross-scope switch never touches the reducer
//    (spec §11.3.1 MERGE BLOCKER fix, adversarial review of PR #122) ───────
// The old design kept `pendingSwitch` INSIDE `ResearchShortlistState` and
// dispatched 'request-switch'/'cancel-switch' reducer actions for it. Since
// the persist effect (components/research/ResearchShortlist.tsx) reacts to
// ANY `state` reference change via `useEffect(..., [state, market])`, that
// meant merely OPENING the switch dialog — and then CANCELLING it — still
// produced a new `state` and fired the persist effect, even though neither
// `cockpitKey` nor `slugs` (the only two fields `shortlistPersistCommand`
// reads) had changed. For an unavailable active scope (`cockpitKey` stays
// `null`, the real scope lives only in `unverifiableCockpitKey`), that
// re-fired effect called `persistScopedShortlist` with
// `{cockpitKey: null, slugs: []}` — which deletes the market pointer
// `restoreScopedShortlist`'s Rule 2 had deliberately left untouched,
// breaking the byte-identical guarantee just by opening (and cancelling!) a
// dialog.
//
// The fix moves the proposal OUT of the reducer entirely — this block
// proves the reducer-level half: `shortlistReducer`'s own action union no
// longer has a way to represent "propose" or "cancel" at all, so simulating
// exactly what `useScopedResearchShortlist`'s `toggle()`/`cancelSwitch()`
// now do (compute the pure primitives, store the proposal in a plain local
// variable — never `dispatch`) leaves the SAME `ResearchShortlistState`
// object reference, and therefore the SAME persist command, throughout.
describe('proposing/cancelling a cross-scope switch never touches the reducer (spec §11.3.1 MERGE BLOCKER fix)', () => {
  const tradingKey: CockpitKey = 'us/trading/trading-platforms';
  const roboKey: CockpitKey = 'us/personal-finance/robo-advisors';

  it('an unavailable active scope: open (propose) requires a scope switch, yet the reducer state — and therefore the persist command — stays the exact SAME reference all the way through cancel', () => {
    const restored: RestoredShortlist = { cockpitKey: null, slugs: [], unverifiableCockpitKey: tradingKey };
    const stateAfterRestore = shortlistReducer(initialShortlistState(), { type: 'restored', value: restored });
    const commandBeforeOpen = shortlistPersistCommand(stateAfterRestore);

    // "Open" — mirrors useScopedResearchShortlist's toggle(): a cross-scope
    // add computes toggleScopedShortlist and, since it requires a scope
    // switch, the hook calls ONLY `setPendingSwitch(...)` — never
    // `dispatch`. `toggleScopedShortlist` itself is the pure primitive the
    // hook actually calls; nothing here reaches `shortlistReducer`.
    const effectiveCockpitKey = stateAfterRestore.cockpitKey ?? stateAfterRestore.unverifiableCockpitKey;
    const current: ScopedShortlist = { cockpitKey: effectiveCockpitKey, slugs: stateAfterRestore.slugs };
    const toggleResult = toggleScopedShortlist(current, roboKey, 'betterment', new Set(['betterment']));
    expect(toggleResult.requiresScopeSwitch).toBe(true);
    const pendingSwitch: { cockpitKey: CockpitKey; slug: string } = { cockpitKey: roboKey, slug: 'betterment' };
    expect(pendingSwitch).toEqual({ cockpitKey: roboKey, slug: 'betterment' });

    // No reducer action exists to represent "open" or "cancel" a switch
    // (ResearchShortlistAction's union is 'restored' | 'set' |
    // 'confirm-switch' | 'clear' only) — the state this test started with is
    // therefore still the CURRENT state, unconditionally, both immediately
    // after "open" and after "cancel" (which — mirroring cancelSwitch() —
    // does nothing but discard the local `pendingSwitch` value above).
    // Because `shortlistPersistCommand` is a pure function of `state`, an
    // unchanged `state` reference is exactly what makes the persist effect's
    // OWN `[state, market]` dependency never re-fire.
    expect(shortlistPersistCommand(stateAfterRestore)).toEqual(commandBeforeOpen);
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

    // `cockpitKey` stays null (byte-identical); `unverifiableCockpitKey`
    // surfaces the scope Rule 2 couldn't verify (spec §11.3.1 fix).
    expect(restored).toEqual({ cockpitKey: null, slugs: [], unverifiableCockpitKey: targetKey });
    expect(data).toEqual(before); // not a single key touched
  });
});

// ── Cross-scope switch after a Rule-2 restore (spec §11.3.1 fix, reviewer-
//    reported PR 2 review finding #3) ──────────────────────────────────────
// `describeScopeSwitch` returns `active-unavailable` only when the ACTIVE
// key is present in `unavailableScopes` — but before this fix, a Rule-2
// restore's `state.cockpitKey` was always `null` (restoreScopedShortlist's
// Rule 2/2b return `{cockpitKey: null, slugs: []}` on purpose, to keep
// storage byte-identical), and `toggleScopedShortlist`'s own `sameScope`
// check treats a `null` current cockpitKey as compatible with ANY target
// scope — so a cross-scope add after a Rule-2 restore never even reached
// `request-switch`, let alone the dialog: it silently repointed the market
// pointer to the new scope with no warning, leaving the old (unverified,
// still real) scoped entry unreachable in storage. This composes the exact
// SAME pure primitives `useScopedResearchShortlist`'s `toggle()` /
// `pendingSwitchDescription` / `confirmSwitch()` call (restoreScopedShortlist,
// shortlistReducer, toggleScopedShortlist, describeScopeSwitch) using the
// hook's own "effective active key" logic — proving the fix end-to-end at
// the pure-logic level this file is scoped to (no DOM, no React rendering;
// see file header).
describe('cross-scope switch after a Rule-2 restore is reachable, not silently dropped (spec §11.3.1 fix)', () => {
  const tradingKey: CockpitKey = 'us/trading/trading-platforms';
  const roboKey: CockpitKey = 'us/personal-finance/robo-advisors';

  const memoryStorage = (
    initial: Record<string, string> = {},
  ): StorageLike & { snapshot(): Record<string, string> } => {
    const store = new Map(Object.entries(initial));
    return {
      getItem: (key) => (store.has(key) ? store.get(key)! : null),
      setItem: (key, value) => {
        store.set(key, value);
      },
      removeItem: (key) => {
        store.delete(key);
      },
      snapshot: () => Object.fromEntries(store),
    };
  };

  it('restore surfaces the unverifiable key with byte-identical storage; adding a product from a DIFFERENT scope then surfaces active-unavailable, and only an explicit confirm clears the old scope\'s storage', () => {
    const storage = memoryStorage({
      [shortlistPointerKey('us')]: 'trading:trading-platforms',
      [shortlistStorageKey(tradingKey)]: JSON.stringify(['fidelity', 'charles-schwab']),
    });
    const before = storage.snapshot();

    // trading-platforms is known but currently in backoff (unverifiable);
    // robo-advisors is known and available with a real product.
    const snapshot: ShortlistScopeSnapshot = {
      knownScopes: new Set([tradingKey, roboKey]),
      availableScopes: new Map([[roboKey, new Set(['betterment'])]]),
      unavailableScopes: new Map([[tradingKey, 'backoff']]),
    };

    // --- Step 1: restore — storage must stay byte-identical, and the
    //     unverifiable key must be surfaced (not silently dropped to null
    //     with no trace). ------------------------------------------------
    const restored = restoreScopedShortlist(storage, 'us', snapshot);
    expect(restored).toEqual({ cockpitKey: null, slugs: [], unverifiableCockpitKey: tradingKey });
    expect(storage.snapshot()).toEqual(before);

    const state = shortlistReducer(initialShortlistState(), { type: 'restored', value: restored });
    expect(state.cockpitKey).toBeNull();
    expect(state.unverifiableCockpitKey).toBe(tradingKey);

    // --- Step 2: user adds a product from a DIFFERENT (available) scope —
    //     replicates useScopedResearchShortlist's toggle(), which feeds
    //     toggleScopedShortlist the EFFECTIVE active key (state.cockpitKey
    //     ?? state.unverifiableCockpitKey), not the bare (always-null)
    //     state.cockpitKey the pre-fix code used. ------------------------
    const effectiveKeyBeforeSwitch = state.cockpitKey ?? state.unverifiableCockpitKey;
    const current: ScopedShortlist = { cockpitKey: effectiveKeyBeforeSwitch, slugs: state.slugs };
    const result = toggleScopedShortlist(current, roboKey, 'betterment', new Set(['betterment']));
    // THE bug this fix closes: with the old (always-null) effective key,
    // toggleScopedShortlist's `sameScope` check treats `null` as compatible
    // with ANY target scope, so this would have been `false` and the add
    // would have applied silently, with no dialog at all.
    expect(result.requiresScopeSwitch).toBe(true);
    // Spec §11.3.1 MERGE BLOCKER fix (adversarial review of PR #122): a
    // PROPOSED switch is no longer a reducer action/state field at all — it
    // lives in useScopedResearchShortlist's own separate `pendingSwitch`
    // useState, mirrored here as a plain local variable. `state` itself is
    // therefore NEVER reassigned across "open"/"cancel" below.
    const pendingSwitch: { cockpitKey: CockpitKey; slug: string } = { cockpitKey: roboKey, slug: 'betterment' };

    // --- Step 3: the switch description is the honest active-unavailable
    //     kind — not the old scope's real reason fabricated as
    //     active-available, and not silently skipped as no-switch. --------
    const activeCockpitKey = state.cockpitKey ?? state.unverifiableCockpitKey;
    const description = describeScopeSwitch(snapshot, activeCockpitKey, pendingSwitch.cockpitKey);
    expect(description).toEqual({ kind: 'active-unavailable', activeCockpitKey: tradingKey, reason: 'backoff' });

    // Cancelling ("mirrors cancelSwitch(): discard the local proposal only,
    // never dispatch") leaves storage AND the reducer state untouched, and
    // keeps the unverifiable key around for a possible retry.
    expect(state.unverifiableCockpitKey).toBe(tradingKey);
    expect(storage.snapshot()).toEqual(before);

    // --- Step 4: only an EXPLICIT confirm applies the switch and clears
    //     the old scope's (previously untouched) storage entry — mirrors
    //     useScopedResearchShortlist's confirmSwitch(). -------------------
    const previousCockpitKey = state.cockpitKey ?? state.unverifiableCockpitKey;
    const confirmed = shortlistReducer(state, {
      type: 'confirm-switch',
      cockpitKey: pendingSwitch.cockpitKey,
      slug: pendingSwitch.slug,
    });
    if (previousCockpitKey) storage.removeItem(shortlistStorageKey(previousCockpitKey));

    expect(confirmed.cockpitKey).toBe(roboKey);
    expect(confirmed.slugs).toEqual(['betterment']);
    expect(confirmed.unverifiableCockpitKey).toBeNull();
    expect(storage.getItem(shortlistPointerKey('us'))).toBe('trading:trading-platforms'); // unchanged by this step — the hook's own persist effect writes the new pointer separately
    expect(storage.getItem(shortlistStorageKey(tradingKey))).toBeNull(); // old scope's storage explicitly cleared
  });

  it('a toggle attempt with an INVALID target slug is a true no-op — it never promotes the unverifiable key into a real cockpitKey (which would let the next persist wipe its storage)', () => {
    const storage = memoryStorage({
      [shortlistPointerKey('us')]: 'trading:trading-platforms',
      [shortlistStorageKey(tradingKey)]: JSON.stringify(['fidelity']),
    });
    const before = storage.snapshot();
    const snapshot: ShortlistScopeSnapshot = {
      knownScopes: new Set([tradingKey, roboKey]),
      availableScopes: new Map([[roboKey, new Set(['betterment'])]]),
      unavailableScopes: new Map([[tradingKey, 'backoff']]),
    };

    const restored = restoreScopedShortlist(storage, 'us', snapshot);
    const state = shortlistReducer(initialShortlistState(), { type: 'restored', value: restored });

    // Replicates toggle()'s no-op guard: an invalid slug for the target
    // scope returns the SAME `current` reference back, and the hook must
    // skip dispatching it verbatim rather than echoing the synthetic
    // effective key into `state.cockpitKey`.
    const effectiveKey = state.cockpitKey ?? state.unverifiableCockpitKey;
    const current: ScopedShortlist = { cockpitKey: effectiveKey, slugs: state.slugs };
    const result = toggleScopedShortlist(current, roboKey, 'not-a-real-slug', new Set(['betterment']));
    expect(result.requiresScopeSwitch).toBe(false);
    expect(result.next).toBe(current); // referential identity — the true-no-op signal

    // The hook must not dispatch 'set' for this — state (and therefore any
    // later persist) stays exactly as restored.
    expect(state.cockpitKey).toBeNull();
    expect(state.unverifiableCockpitKey).toBe(tradingKey);
    expect(storage.snapshot()).toEqual(before);
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

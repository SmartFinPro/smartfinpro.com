// components/research/ResearchShortlist.tsx
// Restore-safe, multi-topic shortlist UI for the universal Research hub
// (unified-research-discovery-pr2-hubs plan, Task 5; spec §11). Generalizes
// the Research Library pilot's single-topic shortlist
// (components/research/ResearchLibrary.tsx, `us/trading/trading-platforms`
// only) to every Cockpit topic the hub can show, scoped so same-named topics
// in different categories (e.g. `us/credit-repair/companies` vs
// `us/debt-relief/companies`) never collide (spec §11.1).
//
// AMENDED CONTRACT (2026-07-27, spec §11.2.1/§11.3.1 — see the plan's "Amended
// preconditions" section): this file builds on the three-tier
// `ShortlistScopeSnapshot` / `restoreScopedShortlist` / `describeScopeSwitch`
// contract already shipped in lib/research/catalog-shell-logic.ts — it does
// NOT reintroduce the old flat `ReadonlyMap<CockpitKey, ReadonlySet<string>>`
// "validScopes" contract the plan's own Task 5 step-3 prose still describes
// (that prose predates the amendment).
//
// SNAPSHOT PROVENANCE (binding requirement, this task): `buildShortlistScopeSnapshot`
// below is deliberately CLIENT-ONLY — built from `items` (the full, unfiltered
// market catalog `ResearchHub` already holds, never the current
// search/category/topic projection) plus the static `BEST_X_MANIFEST` (plain
// data, client-safe). It does NOT have access to the server's real per-topic
// `TopicOverlayResult` (lib/research/catalog.ts) — that value is intentionally
// never sent across the RSC boundary (only the joined, already-qualified
// `DiscoveryItem[]` is). A manifest topic with ZERO observed contexts among
// `items` is therefore classified `unavailableScopes` with the honest
// `unknown_state` reason rather than guessed as an authoritatively-empty
// `availableScopes` entry: the client cannot tell "this topic's server load
// just failed/backed off" apart from "this topic loaded fine but currently
// has zero qualifying products" — both collapse to the same zero-contexts
// observation once data has crossed into DiscoveryItem[] (see catalog.ts's
// TopicOverlayResult header comment for the server-side version of this same
// problem). Rule 2's non-destructive treatment (lib/research/catalog-shell-logic.ts)
// is IDENTICAL for both real causes, so this never risks a wrong destructive
// delete — the only cost is that Rule 4's destructive cleanup of a genuinely,
// authoritatively emptied topic never fires through this client-only path.
// That trade is deliberate: protecting a user's stored shortlist always
// outranks automatic tidiness. By construction, every `knownScopes` member
// lands in EXACTLY ONE of `availableScopes`/`unavailableScopes` (never both,
// never neither) — see the partition-invariant test in
// __tests__/unit/research-shortlist-ui-state.test.ts.
'use client';

import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { GitCompare, X } from 'lucide-react';
import type { Market } from '@/lib/i18n/config';
import { BEST_X_MANIFEST } from '@/lib/comparison/topics/manifest';
import {
  MAX_SHORTLIST,
  buildScopedCompareUrl,
  cockpitKeyFor,
  describeScopeSwitch,
  migrateLegacyTradingShortlist,
  persistScopedShortlist,
  restoreScopedShortlist,
  shortlistStorageKey,
  toggleScopedShortlist,
  type CockpitKey,
  type DiscoveryItem,
  type ScopedShortlist,
  type ScopeSwitchDescription,
  type ShortlistScopeSnapshot,
} from '@/lib/research/catalog-shell-logic';

// ── Pure state (Task 5 Step 1/3) ────────────────────────────────────────────
// Extracted so the restore-order contract — never persist before restore
// completes — is testable without a DOM (__tests__/unit/research-shortlist-ui-state.test.ts).

export interface ResearchShortlistState {
  hasRestored: boolean;
  cockpitKey: CockpitKey | null;
  slugs: string[];
  pendingSwitch: { cockpitKey: CockpitKey; slug: string } | null;
}

export type ResearchShortlistAction =
  | { type: 'restored'; value: ScopedShortlist }
  | { type: 'set'; value: ScopedShortlist }
  | { type: 'request-switch'; cockpitKey: CockpitKey; slug: string }
  | { type: 'cancel-switch' }
  | { type: 'confirm-switch' }
  | { type: 'clear' };

export const initialShortlistState = (): ResearchShortlistState => ({
  hasRestored: false,
  cockpitKey: null,
  slugs: [],
  pendingSwitch: null,
});

/** Pure reducer — no storage I/O, no side effects. `confirm-switch` applies
 *  the pending switch's target scope with exactly its one requested slug
 *  (mirrors `toggleScopedShortlist`'s own cross-scope result: a switch never
 *  merges the old scope's other slugs into the new one). A `confirm-switch`
 *  with no `pendingSwitch` set is a no-op (defensive — the dialog is never
 *  rendered without one, but the reducer itself must not assume the caller
 *  got that right). */
export function shortlistReducer(
  state: ResearchShortlistState,
  action: ResearchShortlistAction,
): ResearchShortlistState {
  switch (action.type) {
    case 'restored':
      return {
        hasRestored: true,
        cockpitKey: action.value.cockpitKey,
        slugs: action.value.slugs,
        pendingSwitch: null,
      };
    case 'set':
      return { ...state, cockpitKey: action.value.cockpitKey, slugs: action.value.slugs };
    case 'request-switch':
      return { ...state, pendingSwitch: { cockpitKey: action.cockpitKey, slug: action.slug } };
    case 'cancel-switch':
      return state.pendingSwitch ? { ...state, pendingSwitch: null } : state;
    case 'confirm-switch': {
      if (!state.pendingSwitch) return state;
      return {
        ...state,
        cockpitKey: state.pendingSwitch.cockpitKey,
        slugs: [state.pendingSwitch.slug],
        pendingSwitch: null,
      };
    }
    case 'clear':
      return { ...state, cockpitKey: null, slugs: [], pendingSwitch: null };
    default:
      return state;
  }
}

/** Never returns a persistable value before restore has completed — the
 *  ONLY guard against the classic effect-order hazard (spec §11.2): a persist
 *  effect that fires before restore has read storage would overwrite a real
 *  stored shortlist with the reducer's initial empty state. */
export function shortlistPersistCommand(state: ResearchShortlistState): ScopedShortlist | null {
  return state.hasRestored ? { cockpitKey: state.cockpitKey, slugs: state.slugs } : null;
}

// ── Client-only ShortlistScopeSnapshot (spec §11.2.1) ───────────────────────

/** All manifest Cockpit keys for `market` — the static universe
 *  `buildShortlistScopeSnapshot` classifies against. Exported separately so a
 *  test can assert it against the real `BEST_X_MANIFEST` without rebuilding
 *  the whole snapshot. */
export function knownScopesFor(market: Market): ReadonlySet<CockpitKey> {
  const scopes = new Set<CockpitKey>();
  for (const entry of BEST_X_MANIFEST) {
    if (entry.market === market) scopes.add(cockpitKeyFor(market, entry.category, entry.topic));
  }
  return scopes;
}

/** Builds the three-tier `ShortlistScopeSnapshot` from the FULL, unfiltered
 *  `items` array — see the file header for why every zero-context known scope
 *  lands in `unavailableScopes` with reason `unknown_state` rather than being
 *  guessed as an authoritative empty result. Callers must always pass the
 *  page's complete market catalog (`ResearchHub`'s own `items` prop), never a
 *  search/category/topic-filtered subset — passing a filtered list would
 *  make a topic outside the current filter look "unavailable" even though it
 *  never actually failed to load, which is exactly the bug §11.2.1 exists to
 *  prevent. */
export function buildShortlistScopeSnapshot(
  market: Market,
  items: readonly DiscoveryItem[],
): ShortlistScopeSnapshot {
  const knownScopes = knownScopesFor(market);

  const availableScopes = new Map<CockpitKey, Set<string>>();
  for (const item of items) {
    for (const context of item.researchContexts) {
      let slugs = availableScopes.get(context.cockpitKey);
      if (!slugs) {
        slugs = new Set<string>();
        availableScopes.set(context.cockpitKey, slugs);
      }
      slugs.add(context.productSlug);
    }
  }

  const unavailableScopes = new Map<CockpitKey, 'unknown_state'>();
  for (const cockpitKey of knownScopes) {
    if (!availableScopes.has(cockpitKey)) unavailableScopes.set(cockpitKey, 'unknown_state');
  }

  return { knownScopes, availableScopes, unavailableScopes };
}

/** Per-cockpitKey rendering metadata `ResearchHub` needs for the shortlist bar
 *  and the compare handoff — a product's display name (for chips) and the
 *  topic's Cockpit compare base href — both already present on every
 *  `ResearchContext` attached to `items`, just re-indexed by cockpitKey. */
export interface CockpitTopicIndexEntry {
  compareBaseHref: string;
  namesBySlug: ReadonlyMap<string, string>;
}

export function buildCockpitTopicIndex(
  items: readonly DiscoveryItem[],
): ReadonlyMap<CockpitKey, CockpitTopicIndexEntry> {
  const index = new Map<CockpitKey, { compareBaseHref: string; namesBySlug: Map<string, string> }>();
  for (const item of items) {
    for (const context of item.researchContexts) {
      let entry = index.get(context.cockpitKey);
      if (!entry) {
        entry = { compareBaseHref: context.compareBaseHref, namesBySlug: new Map<string, string>() };
        index.set(context.cockpitKey, entry);
      }
      entry.namesBySlug.set(context.productSlug, context.displayName);
    }
  }
  return index;
}

// ── The stateful hook ────────────────────────────────────────────────────────

export interface UseScopedResearchShortlistResult {
  cockpitKey: CockpitKey | null;
  slugs: string[];
  compareUrl: string | null;
  displayNameFor(slug: string): string;
  cardState(cockpitKey: CockpitKey, slug: string): { selected: boolean; disabled: boolean };
  toggle(cockpitKey: CockpitKey, slug: string): void;
  removeSlug(slug: string): void;
  clearAll(): void;
  pendingSwitchDescription: ScopeSwitchDescription | null;
  confirmSwitch(): void;
  cancelSwitch(): void;
}

export function useScopedResearchShortlist(
  market: Market,
  items: readonly DiscoveryItem[],
): UseScopedResearchShortlistResult {
  const [state, dispatch] = useReducer(shortlistReducer, undefined, initialShortlistState);

  const snapshot = useMemo(() => buildShortlistScopeSnapshot(market, items), [market, items]);
  const topicIndex = useMemo(() => buildCockpitTopicIndex(items), [items]);

  // Restore-on-mount (spec §11.2, amended §11.2.1): migrate the pilot's flat
  // key, then classify the pointer's scope against the three-tier snapshot
  // BEFORE touching anything, and dispatch exactly one `restored` action.
  // Deliberately `[]` deps — `market`/`snapshot` are stable for this page's
  // lifetime, and restore must run exactly once regardless of any later
  // reference change in `items` (a fresh catalog only ever arrives via a full
  // page load, which remounts this hook anyway).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    migrateLegacyTradingShortlist(sessionStorage);
    const restored = restoreScopedShortlist(sessionStorage, market, snapshot);
    dispatch({ type: 'restored', value: restored });
  }, []);

  // Persist on every change — but NEVER on the transition that merely
  // OBSERVES the just-restored state. Skipping that one transition is what
  // keeps Rule 2/2b's byte-identical guarantee (lib/research/catalog-shell-logic.ts)
  // intact end-to-end: `restoreScopedShortlist` may legitimately return
  // `{cockpitKey: null, slugs: []}` for an `unavailable` scope WITHOUT
  // touching storage (the pointer is deliberately left alone so a later,
  // successful load can still find it). If this effect blindly re-persisted
  // that value the moment `hasRestored` flips true, `persistScopedShortlist`
  // would remove the still-valid pointer — turning a "temporarily can't
  // verify" state into a real, permanent data loss. Every subsequent,
  // genuinely user-driven change (`set`/`confirm-switch`/`clear`) still
  // persists normally.
  const skippedInitialPersist = useRef(false);
  useEffect(() => {
    const command = shortlistPersistCommand(state);
    if (!command) return;
    if (!skippedInitialPersist.current) {
      skippedInitialPersist.current = true;
      return;
    }
    persistScopedShortlist(sessionStorage, market, command);
  }, [state, market]);

  const validSlugsFor = (cockpitKey: CockpitKey): ReadonlySet<string> =>
    snapshot.availableScopes.get(cockpitKey) ?? new Set<string>();

  const toggle = (cockpitKey: CockpitKey, slug: string): void => {
    const current: ScopedShortlist = { cockpitKey: state.cockpitKey, slugs: state.slugs };
    const result = toggleScopedShortlist(current, cockpitKey, slug, validSlugsFor(cockpitKey));
    if (result.requiresScopeSwitch) {
      dispatch({ type: 'request-switch', cockpitKey, slug });
      return;
    }
    dispatch({ type: 'set', value: result.next });
  };

  const removeSlug = (slug: string): void => {
    if (!state.cockpitKey) return;
    toggle(state.cockpitKey, slug);
  };

  const clearAll = (): void => {
    const previousCockpitKey = state.cockpitKey;
    dispatch({ type: 'clear' });
    // persistScopedShortlist's own "empty" branch only ever removes the
    // POINTER — it has no way to know which scoped key it just orphaned. The
    // scope this shortlist WAS in must be removed explicitly here, or its
    // (now-unreferenced) storage entry survives forever as dead data.
    if (previousCockpitKey) {
      try {
        sessionStorage.removeItem(shortlistStorageKey(previousCockpitKey));
      } catch {
        /* storage blocked — in-memory state still clears correctly */
      }
    }
  };

  const confirmSwitch = (): void => {
    if (!state.pendingSwitch) return;
    const previousCockpitKey = state.cockpitKey;
    dispatch({ type: 'confirm-switch' });
    // Spec §11.3: "alten scoped Storage-Eintrag löschen" — the persist effect
    // (below) writes the NEW scope's pointer + value, but only this explicit
    // call removes the OLD scope's now-orphaned storage entry.
    if (previousCockpitKey) {
      try {
        sessionStorage.removeItem(shortlistStorageKey(previousCockpitKey));
      } catch {
        /* storage blocked — in-memory switch still applies correctly */
      }
    }
  };

  const cancelSwitch = (): void => {
    dispatch({ type: 'cancel-switch' });
  };

  const pendingSwitchDescription = useMemo<ScopeSwitchDescription | null>(() => {
    if (!state.pendingSwitch) return null;
    return describeScopeSwitch(snapshot, state.cockpitKey, state.pendingSwitch.cockpitKey);
  }, [snapshot, state.cockpitKey, state.pendingSwitch]);

  const compareUrl = state.cockpitKey
    ? buildScopedCompareUrl(
        topicIndex.get(state.cockpitKey)?.compareBaseHref ?? '',
        state.slugs,
        validSlugsFor(state.cockpitKey),
      )
    : null;

  const displayNameFor = (slug: string): string => {
    if (!state.cockpitKey) return slug;
    return topicIndex.get(state.cockpitKey)?.namesBySlug.get(slug) ?? slug;
  };

  const cardState = (cockpitKey: CockpitKey, slug: string) => {
    const selected = state.cockpitKey === cockpitKey && state.slugs.includes(slug);
    const sameScopeFull = state.cockpitKey === cockpitKey && state.slugs.length >= MAX_SHORTLIST;
    return { selected, disabled: sameScopeFull && !selected };
  };

  return {
    cockpitKey: state.cockpitKey,
    slugs: state.slugs,
    compareUrl,
    displayNameFor,
    cardState,
    toggle,
    removeSlug,
    clearAll,
    pendingSwitchDescription,
    confirmSwitch,
    cancelSwitch,
  };
}

// ── Presentational pieces ───────────────────────────────────────────────────

/** Wraps an opaque, already-built card node with the shortlist toggle pill —
 *  a corner overlay so it never intrudes on the card's own design (pilot
 *  precedent: components/research/ResearchLibrary.tsx's `SelectableCard`).
 *  Cards without a Cockpit identity (plain reviews) never get this wrapper —
 *  the shortlist only ever holds Cockpit products (spec §11.1: "alle aus
 *  exakt einem cockpitKey"). */
export function ShortlistToggleCard({
  name,
  node,
  selected,
  disabled,
  onToggle,
}: {
  name: string;
  node: ReactNode;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="relative"
      style={selected ? { boxShadow: '0 0 0 2px var(--sfp-navy)', borderRadius: 18 } : undefined}
    >
      <button
        type="button"
        aria-pressed={selected}
        aria-label={
          disabled
            ? `Shortlist full — remove one to add ${name} (maximum ${MAX_SHORTLIST} products)`
            : selected
              ? `Remove ${name} from shortlist`
              : `Add ${name} to shortlist`
        }
        title={disabled ? `Maximum ${MAX_SHORTLIST} products` : undefined}
        disabled={disabled}
        onClick={onToggle}
        className="absolute -right-2.5 -top-2.5 z-10 inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        style={
          selected
            ? { background: 'var(--sfp-navy)', color: '#ffffff' }
            : { background: '#ffffff', color: 'var(--sfp-navy)', border: '1px solid var(--sfp-navy)' }
        }
      >
        {selected ? '✓ Shortlisted' : '+ Shortlist'}
      </button>
      {node}
    </div>
  );
}

/** Honest cross-topic replacement dialog (spec §11.3/§11.3.1). Renders `null`
 *  for `no-switch` so a caller can mount it unconditionally. The two
 *  non-null branches read `ScopeSwitchDescription.kind` — never guess from
 *  UI-local state — because only the snapshot-driven description actually
 *  knows whether the scope about to be replaced is currently verifiable. */
export function ShortlistSwitchDialog({
  description,
  onCancel,
  onConfirm,
}: {
  description: ScopeSwitchDescription;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (description.kind === 'no-switch') return null;

  const copy =
    description.kind === 'active-unavailable'
      ? "We can't verify your current shortlist right now, but switching topics will still replace it."
      : 'Shortlists compare within one research topic.';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(26, 26, 46, 0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Switch research topic"
    >
      <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: '#ffffff' }}>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
          {copy}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold hover:underline"
            style={{ color: 'var(--sfp-slate)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 text-sm font-bold"
            style={{ background: 'var(--sfp-navy)', color: '#ffffff' }}
          >
            Switch &amp; add
          </button>
        </div>
      </div>
    </div>
  );
}

/** The fixed shortlist bar — desktop shows the name chips inline, mobile
 *  stays a compact single-line action bar (count · Edit · Compare) and
 *  reveals names in an "Edit" sheet (pilot precedent). Bottom clearance is
 *  handled by padding the whole document (see the effect below) rather than
 *  an in-component spacer, so the affiliate disclosure section that follows
 *  this one on the page never hides behind this fixed bar — fully reset the
 *  moment the bar disappears. */
export function ShortlistBar({
  slugs,
  displayNameFor,
  onRemove,
  onClearAll,
  compareUrl,
}: {
  slugs: string[];
  displayNameFor: (slug: string) => string;
  onRemove: (slug: string) => void;
  onClearAll: () => void;
  compareUrl: string | null;
}) {
  const visible = slugs.length > 0;
  const barRef = useRef<HTMLDivElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // If the shortlist empties (chips removed one-by-one via the mobile Edit
  // sheet), collapse the sheet so the bar never remounts pre-expanded.
  // Render-time reset — conditional + self-terminating, so it's lint-safe
  // (pilot precedent: components/research/ResearchLibrary.tsx).
  if (!visible && sheetOpen) setSheetOpen(false);

  useEffect(() => {
    if (!visible) {
      document.body.style.paddingBottom = '';
      return;
    }
    const el = barRef.current;
    if (!el) return;
    const apply = () => {
      document.body.style.paddingBottom = `${el.getBoundingClientRect().height}px`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = '';
    };
  }, [visible]);

  if (!visible) return null;

  const chip = (slug: string) => (
    <span
      key={slug}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
    >
      {displayNameFor(slug)}
      <button
        type="button"
        aria-label={`Remove ${displayNameFor(slug)} from shortlist`}
        onClick={() => onRemove(slug)}
        className="inline-flex"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </span>
  );

  const compareCta = compareUrl ? (
    <a
      href={compareUrl}
      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold"
      style={{ background: 'var(--sfp-navy)', color: '#ffffff', textDecoration: 'none' }}
    >
      <GitCompare size={15} aria-hidden="true" />
      <span className="hidden sm:inline">Compare in the cockpit</span>
      <span className="sm:hidden">Compare</span>
    </a>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold"
      style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-slate)' }}
      aria-disabled="true"
    >
      <GitCompare size={15} aria-hidden="true" />
      Add one more to compare
    </span>
  );

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-4px_24px_rgba(27,79,140,0.10)]"
      style={{ background: '#ffffff', borderColor: 'var(--sfp-hairline)' }}
      role="region"
      aria-label="Research shortlist"
    >
      {sheetOpen && (
        <div className="border-b px-6 py-3 sm:hidden" style={{ borderColor: 'var(--sfp-hairline)' }}>
          <div className="flex flex-wrap gap-1.5">{slugs.map(chip)}</div>
        </div>
      )}
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-6 py-3">
        <span className="whitespace-nowrap text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>
          Shortlist
          <span className="ml-1 font-medium" style={{ color: 'var(--sfp-slate)' }}>
            {slugs.length}/{MAX_SHORTLIST}
          </span>
        </span>

        <div className="hidden flex-wrap gap-1.5 sm:flex">{slugs.map(chip)}</div>

        <button
          type="button"
          onClick={() => setSheetOpen((open) => !open)}
          aria-expanded={sheetOpen}
          className="text-xs font-semibold hover:underline sm:hidden"
          style={{ color: 'var(--sfp-navy)' }}
        >
          {sheetOpen ? 'Done' : 'Edit'}
        </button>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onClearAll}
            className="whitespace-nowrap text-xs font-semibold hover:underline"
            style={{ color: 'var(--sfp-slate)' }}
          >
            Clear
          </button>
          {compareCta}
        </div>
      </div>
    </div>
  );
}


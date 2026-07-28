// __tests__/unit/research-hub-tracking.test.ts
// P1 fix, adversarial review of PR #122 (spec §12/§11.3): the shortlist
// analytics contract must only ever describe transitions that actually
// COMMITTED, and a review-kind entry's click/evidence-open events must carry
// the item's real category. Pure-logic coverage of the three exported
// decision functions components/research/ResearchHub.tsx's
// handleShortlistToggle/handleConfirmSwitch/entriesForRender now delegate to
// — the component itself is 'use client' and has no DOM-free render seam in
// this repo's vitest setup (environment: 'node', no jsdom), so these pure
// functions are what's actually unit-testable; the real-browser counterpart
// lives in e2e/research-tracking.spec.ts.

import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import {
  resolveConfirmSwitchAnalytics,
  resolveEntry,
  resolveShortlistToggleAnalytics,
  trackedDimensionsFor,
  type ResolvedEntry,
} from '@/components/research/ResearchHub';
import type { CockpitKey, DiscoveryItem, DiscoveryProjection, ResearchContext } from '@/lib/research/catalog-shell-logic';
import { cockpitKeyFor, projectionNodeKey, reviewItemId } from '@/lib/research/catalog-shell-logic';

const tradingKey: CockpitKey = 'us/trading/trading-platforms';
const roboKey: CockpitKey = 'us/personal-finance/robo-advisors';

// ── (a) cancel → zero shortlist events ──────────────────────────────────────
// A cancel itself never calls the tracker at all (ResearchHub.tsx's
// handleCancelSwitch only clears pendingSwitchTrackingRef + calls
// shortlist.cancelSwitch() — no tracker.* call in that function, by
// construction). The only way a "false event" could ever exist is if OPENING
// the dialog had already fired one — which is exactly what
// resolveShortlistToggleAnalytics must never do for a cross-scope toggle.

describe('resolveShortlistToggleAnalytics — never reports an add/remove for a mere PROPOSAL (spec §11.3/§12 MERGE BLOCKER fix)', () => {
  it('an unavailable active scope (cockpitKey null, unverifiableCockpitKey real) toggling a DIFFERENT scope is "pending", never "add" — the bug this fix closes', () => {
    // Before the fix, ResearchHub.tsx's handleShortlistToggle checked the
    // bare `shortlist.cockpitKey === null` and treated this exactly like a
    // fresh, no-scope-yet add — firing 'add' immediately even though the
    // hook's own toggle() (fed the EFFECTIVE key) would actually request a
    // switch dialog. Feeding the EFFECTIVE key here is the fix.
    const effectiveCockpitKey = tradingKey; // cockpitKey ?? unverifiableCockpitKey
    const decision = resolveShortlistToggleAnalytics(false, effectiveCockpitKey, roboKey);
    expect(decision).toEqual({ kind: 'pending' });
  });

  it('cancelling a pending switch has NOTHING to undo — open already reported zero events, so total is zero', () => {
    const decision = resolveShortlistToggleAnalytics(false, tradingKey, roboKey);
    expect(decision.kind).not.toBe('add');
    expect(decision.kind).not.toBe('remove');
    // (the component's handleCancelSwitch calls no tracker method at all —
    // see the file header; nothing here EVER produces an event to undo)
  });

  it('a same-scope add (effective key equals the target) still fires immediately — the fix does not defer a genuinely simple add', () => {
    expect(resolveShortlistToggleAnalytics(false, tradingKey, tradingKey)).toEqual({ kind: 'add' });
  });

  it('a fresh add (no active scope at all, available or unverifiable) still fires immediately', () => {
    expect(resolveShortlistToggleAnalytics(false, null, tradingKey)).toEqual({ kind: 'add' });
  });

  it('removing an already-selected product is always immediate, regardless of the effective key', () => {
    expect(resolveShortlistToggleAnalytics(true, tradingKey, tradingKey)).toEqual({ kind: 'remove' });
  });
});

// ── (b) confirm → exactly clear(old) then add(target) ──────────────────────

describe('resolveConfirmSwitchAnalytics — the full clear(old) + add(target) pair, in order (spec §12 MERGE BLOCKER fix)', () => {
  it('a genuine prior scope (available OR unverifiable) yields exactly [clear(old), add(target)]', () => {
    const oldDimensions = { topic: 'trading-platforms', category: 'trading' as const };
    const targetDimensions = { topic: 'robo-advisors', category: 'personal-finance' as const };
    const events = resolveConfirmSwitchAnalytics(tradingKey, oldDimensions, {
      productSlug: 'betterment',
      dimensions: targetDimensions,
    });

    expect(events).toEqual([
      { action: 'clear', productSlug: null, count: 0, dimensions: oldDimensions },
      { action: 'add', productSlug: 'betterment', count: 1, dimensions: targetDimensions },
    ]);
  });

  it('no genuine prior scope (previousCockpitKey null) yields ONLY add(target) — never a clear for a scope that was never real', () => {
    const targetDimensions = { topic: 'robo-advisors', category: 'personal-finance' as const };
    const events = resolveConfirmSwitchAnalytics(null, null, {
      productSlug: 'betterment',
      dimensions: targetDimensions,
    });
    expect(events).toEqual([{ action: 'add', productSlug: 'betterment', count: 1, dimensions: targetDimensions }]);
  });

  it("confirm-switch's add always reports count 1 — never derived from the prior scope's slug count", () => {
    const oldDimensions = { topic: 'trading-platforms', category: 'trading' as const };
    const events = resolveConfirmSwitchAnalytics(tradingKey, oldDimensions, {
      productSlug: 'betterment',
      dimensions: { topic: 'robo-advisors', category: 'personal-finance' },
    });
    const add = events.find((e) => e.action === 'add')!;
    expect(add.count).toBe(1);
  });
});

// ── (c) a review click on a credit-repair item still reports
//        category:'credit-repair' ──────────────────────────────────────────

describe('review-kind entries carry their REAL category (P1 fix, adversarial review of PR #122)', () => {
  const makeContext = (over: Partial<ResearchContext> = {}): ResearchContext => ({
    cockpitKey: tradingKey,
    topic: 'trading-platforms',
    topicLabel: 'Best Trading Platforms',
    manifestOrder: 0,
    productSlug: 'fidelity',
    displayName: 'Fidelity',
    tagline: null,
    bestFor: null,
    status: 'audited',
    confidence: 'high',
    dataVerifiedAt: '2026-07-01',
    auditedScore: 9,
    auditedRank: 1,
    dataPoints: 3,
    compareBaseHref: '/us/trading/best/trading-platforms',
    keyFacts: {},
    ...over,
  });

  it('resolveEntry sets the item\'s REAL category for a plain review-kind entry — never null', () => {
    const item: DiscoveryItem = {
      id: reviewItemId('/us/credit-repair/credit-saint-review'),
      market: 'us',
      category: 'credit-repair',
      review: {
        slug: 'credit-saint-review',
        href: '/us/credit-repair/credit-saint-review',
        title: 'Credit Saint Review',
        description: 'Independent Credit Saint review',
        bestFor: null,
        editorialRating: 4.5,
        publishDate: '2026-01-01',
        modifiedDate: '2026-02-01',
        readingWords: 3000,
        featured: false,
        pricing: null,
      },
      display: { title: 'Credit Saint Review', description: '', bestFor: null, searchText: '', sortDate: null },
      researchContexts: [],
    };
    const projection: DiscoveryProjection = { itemId: item.id, kind: 'review', item, context: null };
    const key = projectionNodeKey(item.id, null);
    const nodeByKey = new Map<string, ReactNode>([[key, 'card-node']]);

    const entry = resolveEntry(projection, nodeByKey);
    expect(entry).not.toBeNull();
    expect(entry!.category).toBe('credit-repair');
    expect(entry!.topic).toBeNull(); // a plain review genuinely has no Cockpit topic
  });

  it('resolveEntry sets the real category even on the dossier-lookup-miss degrade-to-review path', () => {
    const item: DiscoveryItem = {
      id: reviewItemId('/us/debt-relief/national-debt-relief-review'),
      market: 'us',
      category: 'debt-relief',
      review: {
        slug: 'national-debt-relief-review',
        href: '/us/debt-relief/national-debt-relief-review',
        title: 'National Debt Relief Review',
        description: 'Independent review',
        bestFor: null,
        editorialRating: 4.6,
        publishDate: '2026-01-01',
        modifiedDate: '2026-02-01',
        readingWords: 3000,
        featured: false,
        pricing: null,
      },
      display: { title: '', description: '', bestFor: null, searchText: '', sortDate: null },
      researchContexts: [makeContext({ cockpitKey: cockpitKeyFor('us', 'debt-relief', 'companies'), topic: 'companies' })],
    };
    const projection: DiscoveryProjection = {
      itemId: item.id,
      kind: 'dossier',
      item,
      context: item.researchContexts[0],
    };
    // The dossier node is deliberately ABSENT from nodeByKey — only the
    // review node is present — forcing resolveEntry's degrade path.
    const reviewKey = projectionNodeKey(item.id, null);
    const nodeByKey = new Map<string, ReactNode>([[reviewKey, 'review-card-node']]);

    const entry = resolveEntry(projection, nodeByKey);
    expect(entry).not.toBeNull();
    expect(entry!.kind).toBe('review');
    expect(entry!.category).toBe('debt-relief');
  });

  it('trackedDimensionsFor surfaces {category} alone for a review-kind entry (no dossier topic to report)', () => {
    const entry: Pick<ResolvedEntry, 'category'> = { category: 'credit-repair' };
    expect(trackedDimensionsFor(entry, undefined)).toEqual({ category: 'credit-repair' });
  });

  it('trackedDimensionsFor prefers the full dossier {topic, category} pair when present', () => {
    const entry: Pick<ResolvedEntry, 'category'> = { category: 'trading' };
    const dossierDimensions = { topic: 'trading-platforms', category: 'trading' as const };
    expect(trackedDimensionsFor(entry, dossierDimensions)).toBe(dossierDimensions);
  });
});

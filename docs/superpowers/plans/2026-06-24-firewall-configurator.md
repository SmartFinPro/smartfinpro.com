# Firewall Configurator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An interactive 4-question "Firewall Configurator" on the firewall page (after Phase 01) that generates a personalized card-map + spending limits + hardening SOP and routes to Mercury, with 5 fire-and-forget CRO events.

**Architecture:** A pure, unit-tested engine (`firewall-plan.ts`) computes the plan; a `'use client'` UI (`firewall-configurator.tsx`) renders the 4 questions + plan output and reuses the EXISTING `useAnalytics().trackEvent` hook (already fire-and-forget via `sendBeacon`/`keepalive`) for events; a generic `tracked-review-link.tsx` keeps `EditorialBacklink` a Server Component while tracking the review backlink click.

**Tech Stack:** Next.js 16 (React 19), Tailwind v4 (dark firewall palette), vitest, existing `lib/hooks/use-analytics.ts` (event tracking → `/api/track`).

**Spec:** `docs/superpowers/specs/2026-06-24-firewall-configurator-design.md`

> **Deviation from spec (improvement):** The spec proposed a new `firewall-analytics.ts`. The codebase already has `lib/hooks/use-analytics.ts` → `useAnalytics({trackPageViews:false}).trackEvent(name, {category, properties})`, which is already fire-and-forget (sendBeacon + keepalive + silent catch) and adds `pagePath`. We reuse it instead of adding a new file. No separate analytics file is created.

---

## File Structure

| File | Responsibility |
|---|---|
| `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-plan.ts` | **new** — pure engine: types, config, `buildFirewallPlan()` |
| `__tests__/unit/firewall-plan.test.ts` | **new** — engine unit tests |
| `components/marketing/tracked-review-link.tsx` | **new** — generic `'use client'` tracked `<Link>` wrapper |
| `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-configurator.tsx` | **new** — `'use client'` configurator UI + plan output + events |
| `components/marketing/EditorialBacklink.tsx` | mod — use `<TrackedReviewLink>` for the review link (stays a Server Component) |
| `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-client.tsx` | mod — render `<FirewallConfigurator>` after Phase 01; lift `location` state; make International chips clickable + tracked |

---

## Task 1: Pure engine `firewall-plan.ts` (TDD)

**Files:**
- Create: `__tests__/unit/firewall-plan.test.ts`
- Create: `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-plan.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/unit/firewall-plan.test.ts
import { describe, it, expect } from 'vitest';
import { buildFirewallPlan } from '@/app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-plan';

describe('buildFirewallPlan', () => {
  it('derives nodes from the selected stack in display order', () => {
    const p = buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['saas', 'ads', 'hosting'], teamAccess: 'solo' });
    expect(p.nodes.map((n) => n.key)).toEqual(['ads', 'hosting', 'saas']); // ads, hosting, payroll, saas, contractors order
    expect(p.nodes.map((n) => n.label)).toEqual(['Ad Spend', 'Core Infrastructure', 'Team SaaS']);
  });

  it('normalizes weights over the selected nodes and rounds limits to the nearest 100', () => {
    const p = buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['ads', 'hosting', 'saas'], teamAccess: 'solo' });
    // total 15000; weights ads .50 hosting .22 saas .10 → sum .82
    expect(p.totalBudget).toBe(15000);
    expect(p.nodes.find((n) => n.key === 'ads')!.monthlyLimit).toBe(9100);   // 15000*.50/.82=9146 → 9100
    expect(p.nodes.find((n) => n.key === 'hosting')!.monthlyLimit).toBe(4000); // 15000*.22/.82=4024 → 4000
    expect(p.nodes.find((n) => n.key === 'saas')!.monthlyLimit).toBe(1800);  // 15000*.10/.82=1829 → 1800
    p.nodes.forEach((n) => expect(n.monthlyLimit % 100).toBe(0));
  });

  it('gives a single selected node ~the full budget', () => {
    const p = buildFirewallPlan({ location: 'us', monthlySpend: 'under-5k', stack: ['ads'], teamAccess: 'solo' });
    expect(p.nodes).toHaveLength(1);
    expect(p.nodes[0].monthlyLimit).toBe(4000); // 4000 * (.50/.50) = 4000
  });

  it('supports all five nodes', () => {
    const p = buildFirewallPlan({ location: 'us', monthlySpend: '25k-plus', stack: ['ads', 'hosting', 'saas', 'payroll', 'contractors'], teamAccess: '2-5' });
    expect(p.nodes).toHaveLength(5);
    expect(p.headline).toBe('A 5-node cash-flow firewall');
  });

  it('applies the international modifier for non-US founders', () => {
    const us = buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['ads'], teamAccess: 'solo' });
    const uk = buildFirewallPlan({ location: 'uk', monthlySpend: '5k-25k', stack: ['ads'], teamAccess: 'solo' });
    expect(us.international).toBe(false);
    expect(uk.international).toBe(true);
    expect(uk.hardening.length).toBe(us.hardening.length + 1);
    expect(uk.hardening[uk.hardening.length - 1]).toMatch(/FIDO2 is mandatory/);
    expect(uk.subline).toMatch(/^International founder/);
    expect(us.subline).toMatch(/^US founder/);
  });

  it('scales hardening SOP by team size', () => {
    const solo = buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['ads'], teamAccess: 'solo' });
    const team = buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['ads'], teamAccess: '6-plus' });
    expect(solo.hardening).toHaveLength(2);
    expect(team.hardening).toHaveLength(4);
  });

  it('maps spend tiers to budgets and keeps the fixed CTA', () => {
    expect(buildFirewallPlan({ location: 'us', monthlySpend: 'under-5k', stack: ['ads'], teamAccess: 'solo' }).totalBudget).toBe(4000);
    expect(buildFirewallPlan({ location: 'us', monthlySpend: '25k-plus', stack: ['ads'], teamAccess: 'solo' }).totalBudget).toBe(40000);
    expect(buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['ads'], teamAccess: 'solo' }).cta).toEqual({
      label: 'Launch Mercury and build this card map',
      href: '/go/mercury',
    });
  });
});
```

- [ ] **Step 2: Run the test, confirm it FAILS**

Run: `npx vitest run __tests__/unit/firewall-plan.test.ts`
Expected: FAIL — "Cannot find module '.../firewall-plan'".

NOTE on the import path: the file lives under a route group `(marketing)`. The `@/app/(marketing)/…` alias path is literal and resolves. If vitest cannot resolve it, fall back to a relative import in the test: `import { buildFirewallPlan } from '../../app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-plan';` — do not change the file location.

- [ ] **Step 3: Implement `firewall-plan.ts`**

```typescript
// app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-plan.ts
// Pure recommendation engine for the Firewall Configurator. No React/Next imports → unit-testable.
// All limits are SmartFinPro RECOMMENDED operating limits, not Mercury product limits.

export type FounderLocation = 'us' | 'uk' | 'ca' | 'au' | 'other';
export type MonthlySpend = 'under-5k' | '5k-25k' | '25k-plus';
export type StackItem = 'ads' | 'hosting' | 'saas' | 'payroll' | 'contractors';
export type TeamAccess = 'solo' | '2-5' | '6-plus';

export interface FirewallConfigInput {
  location: FounderLocation;
  monthlySpend: MonthlySpend;
  stack: StackItem[];
  teamAccess: TeamAccess;
}

export type NodeAccent = 'cyan' | 'emerald' | 'amber' | 'sky' | 'violet';

export interface PlanNode {
  key: StackItem;
  label: string;
  vendors: string;
  monthlyLimit: number;
  accent: NodeAccent;
}

export interface FirewallPlan {
  nodes: PlanNode[];
  hardening: string[];
  headline: string;
  subline: string;
  international: boolean;
  totalBudget: number;
  cta: { label: string; href: string };
}

interface NodeConfig {
  label: string;
  vendors: string;
  weight: number;
  accent: NodeAccent;
}

/** Display order for nodes (independent of stack-selection order). */
const NODE_ORDER: StackItem[] = ['ads', 'hosting', 'payroll', 'saas', 'contractors'];

const NODE_CONFIG: Record<StackItem, NodeConfig> = {
  ads: { label: 'Ad Spend', vendors: 'Google Ads · Meta · TikTok · LinkedIn', weight: 0.5, accent: 'cyan' },
  hosting: { label: 'Core Infrastructure', vendors: 'Vercel · AWS · Supabase · OpenAI', weight: 0.22, accent: 'emerald' },
  payroll: { label: 'Payroll & Reserves', vendors: 'Gusto · Deel · Rippling', weight: 0.13, accent: 'sky' },
  saas: { label: 'Team SaaS', vendors: 'Slack · Notion · Workspace · Loom', weight: 0.1, accent: 'amber' },
  contractors: { label: 'Contractor Payouts', vendors: 'Deel · Wise · Upwork', weight: 0.05, accent: 'violet' },
};

const BUDGET_BY_SPEND: Record<MonthlySpend, number> = { 'under-5k': 4000, '5k-25k': 15000, '25k-plus': 40000 };
const SPEND_LABEL: Record<MonthlySpend, string> = { 'under-5k': '<$5k', '5k-25k': '$5k–$25k', '25k-plus': '$25k+' };
const TEAM_LABEL: Record<TeamAccess, string> = { solo: 'solo', '2-5': '2–5', '6-plus': '6+' };

const HARDENING_BY_TEAM: Record<TeamAccess, string[]> = {
  solo: [
    'Put one FIDO2/WebAuthn hardware key (plus a backup key) on the owner login and remove SMS 2FA.',
    'Monitor balances and transactions from the Mercury CLI instead of leaving browser sessions open.',
  ],
  '2-5': [
    'Issue a per-seat FIDO2/WebAuthn hardware key for everyone who can touch money; remove SMS 2FA.',
    'Require a receipt on every card and assign an owner; give each role only the cards it needs.',
  ],
  '6-plus': [
    'Issue a per-seat FIDO2/WebAuthn hardware key for everyone who can touch money; remove SMS 2FA.',
    'Require a receipt on every card and assign an owner; give each role only the cards it needs.',
    'Add an approval workflow for new vendors and limit increases, plus a quarterly seat audit.',
    'Use a separate read-only API token for ops/monitoring so dashboards never hold write access.',
  ],
};

const INTERNATIONAL_HARDENING =
  'US LLC operated from abroad: FIDO2 is mandatory (cross-border SIM-swap risk). Monitor via the Mercury API/CLI instead of browser sessions, and keep one US-reachable recovery method.';

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function buildFirewallPlan(input: FirewallConfigInput): FirewallPlan {
  const international = input.location !== 'us';
  const totalBudget = BUDGET_BY_SPEND[input.monthlySpend];

  const selected = NODE_ORDER.filter((key) => input.stack.includes(key));
  const weightSum = selected.reduce((sum, key) => sum + NODE_CONFIG[key].weight, 0) || 1;

  const nodes: PlanNode[] = selected.map((key) => {
    const cfg = NODE_CONFIG[key];
    return {
      key,
      label: cfg.label,
      vendors: cfg.vendors,
      monthlyLimit: roundTo(totalBudget * (cfg.weight / weightSum), 100),
      accent: cfg.accent,
    };
  });

  const hardening = [...HARDENING_BY_TEAM[input.teamAccess]];
  if (international) hardening.push(INTERNATIONAL_HARDENING);

  return {
    nodes,
    hardening,
    headline: `A ${nodes.length}-node cash-flow firewall`,
    subline: `${international ? 'International' : 'US'} founder · ${TEAM_LABEL[input.teamAccess]} team · ${SPEND_LABEL[input.monthlySpend]}/mo · US LLC`,
    international,
    totalBudget,
    cta: { label: 'Launch Mercury and build this card map', href: '/go/mercury' },
  };
}
```

- [ ] **Step 4: Run the test, confirm it PASSES**

Run: `npx vitest run __tests__/unit/firewall-plan.test.ts`
Expected: PASS (8 passing). If a limit assertion is off by a rounding step, recompute `roundTo(totalBudget * weight/weightSum, 100)` by hand and correct the EXPECTED value in the test (the implementation is the source of truth for rounding) — do not change the weights/budgets.

- [ ] **Step 5: Commit**

```bash
git add __tests__/unit/firewall-plan.test.ts "app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-plan.ts"
git commit -m "feat(firewall): pure buildFirewallPlan recommendation engine (tested)"
```

---

## Task 2: Generic `TrackedReviewLink` + wire into `EditorialBacklink`

**Files:**
- Create: `components/marketing/tracked-review-link.tsx`
- Modify: `components/marketing/EditorialBacklink.tsx`

- [ ] **Step 1: Create `tracked-review-link.tsx`**

```tsx
// components/marketing/tracked-review-link.tsx
'use client';

/**
 * TrackedReviewLink — a thin client wrapper around next/link that fires a
 * fire-and-forget analytics event on click. Lets Server Components (e.g.
 * EditorialBacklink) keep their own server rendering while still tracking a
 * single link, without going 'use client' themselves.
 *
 * Tracking is best-effort only (useAnalytics().trackEvent uses sendBeacon /
 * keepalive + silent catch) — it never blocks navigation.
 */

import Link from 'next/link';
import { useAnalytics } from '@/lib/hooks/use-analytics';

export function TrackedReviewLink({
  href,
  eventName,
  eventCategory = 'firewall_configurator',
  className,
  children,
}: {
  href: string;
  eventName: string;
  eventCategory?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { trackEvent } = useAnalytics({ trackPageViews: false });
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvent(eventName, { category: eventCategory })}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Use it in `EditorialBacklink.tsx` for the review link**

In `components/marketing/EditorialBacklink.tsx`, add the import at the top (with the other imports):

```tsx
import { TrackedReviewLink } from '@/components/marketing/tracked-review-link';
```

Then replace the existing review `<Link>` block:

```tsx
        <Link
          href={reviewHref}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-white no-underline"
          style={{ borderBottom: '2px solid #F5A623', paddingBottom: '2px' }}
        >
          Read the full Mercury review
          <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
            →
          </span>
        </Link>
```

with (swap `<Link>` → `<TrackedReviewLink>` + add `eventName`; the inline `style` stays):

```tsx
        <TrackedReviewLink
          href={reviewHref}
          eventName="firewall_review_backlink_click"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-white no-underline"
        >
          Read the full Mercury review
          <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
            →
          </span>
        </TrackedReviewLink>
```

NOTE: `TrackedReviewLink` does not accept a `style` prop, so move the gold underline into the className via arbitrary values. Replace the className above with:

```tsx
          className="mt-2 inline-flex items-center gap-1.5 border-b-2 border-[#F5A623] pb-0.5 text-sm font-bold text-white no-underline"
```

Remove the now-unused `import Link from 'next/link';` from `EditorialBacklink.tsx` ONLY IF `Link` is no longer referenced anywhere else in that file (grep first: `grep -n "<Link" components/marketing/EditorialBacklink.tsx`). `EditorialBacklink` stays a Server Component (no `'use client'`).

- [ ] **Step 3: Verify types + RSC boundary**

Run: `npm run check:types && npm run check:imports`
Expected: both green. `EditorialBacklink` still has no `'use client'`; `TrackedReviewLink` is the only new client unit.

- [ ] **Step 4: Commit**

```bash
git add components/marketing/tracked-review-link.tsx components/marketing/EditorialBacklink.tsx
git commit -m "feat(marketing): TrackedReviewLink — track review backlink, keep EditorialBacklink server-rendered"
```

---

## Task 3: `FirewallConfigurator` UI

**Files:**
- Create: `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-configurator.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-configurator.tsx
'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useAnalytics } from '@/lib/hooks/use-analytics';
import {
  buildFirewallPlan,
  type FirewallPlan,
  type FounderLocation,
  type MonthlySpend,
  type StackItem,
  type TeamAccess,
} from './firewall-plan';

const LOCATIONS: { value: FounderLocation; label: string }[] = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'other', label: 'Other' },
];
const SPENDS: { value: MonthlySpend; label: string }[] = [
  { value: 'under-5k', label: '<$5k' },
  { value: '5k-25k', label: '$5k–$25k' },
  { value: '25k-plus', label: '$25k+' },
];
const STACK_ITEMS: { value: StackItem; label: string }[] = [
  { value: 'ads', label: 'Ads' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'saas', label: 'SaaS' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'contractors', label: 'Contractors' },
];
const TEAMS: { value: TeamAccess; label: string }[] = [
  { value: 'solo', label: 'Solo' },
  { value: '2-5', label: '2–5' },
  { value: '6-plus', label: '6+' },
];

const NODE_BORDER: Record<string, string> = {
  cyan: 'border-cyan-400/40',
  emerald: 'border-emerald-400/40',
  amber: 'border-amber-400/40',
  sky: 'border-sky-400/40',
  violet: 'border-violet-400/40',
};
const NODE_TEXT: Record<string, string> = {
  cyan: 'text-cyan-300',
  emerald: 'text-emerald-300',
  amber: 'text-amber-300',
  sky: 'text-sky-300',
  violet: 'text-violet-300',
};

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ' +
        (active
          ? 'border-cyan-300/60 bg-cyan-950/30 text-white'
          : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-cyan-300/40 hover:text-white')
      }
    >
      {children}
    </button>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function FirewallConfigurator({
  location,
  onLocationChange,
}: {
  location: FounderLocation;
  onLocationChange: (loc: FounderLocation) => void;
}) {
  const { trackEvent } = useAnalytics({ trackPageViews: false });
  const [monthlySpend, setMonthlySpend] = useState<MonthlySpend>('5k-25k');
  const [stack, setStack] = useState<StackItem[]>([]);
  const [teamAccess, setTeamAccess] = useState<TeamAccess>('solo');
  const [plan, setPlan] = useState<FirewallPlan | null>(null);
  const startedRef = useRef(false);

  function markStarted(field: string) {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent('firewall_config_started', { category: 'firewall_configurator', properties: { firstField: field } });
  }

  function pickLocation(value: FounderLocation) {
    markStarted('location');
    onLocationChange(value);
  }
  function pickSpend(value: MonthlySpend) {
    markStarted('monthlySpend');
    setMonthlySpend(value);
  }
  function toggleStack(value: StackItem) {
    markStarted('stack');
    setStack((s) => (s.includes(value) ? s.filter((x) => x !== value) : [...s, value]));
  }
  function pickTeam(value: TeamAccess) {
    markStarted('teamAccess');
    setTeamAccess(value);
  }

  function generate() {
    const built = buildFirewallPlan({ location, monthlySpend, stack, teamAccess });
    setPlan(built);
    trackEvent('firewall_plan_generated', {
      category: 'firewall_configurator',
      properties: { location, monthlySpend, stack, teamAccess, nodeCount: built.nodes.length, totalBudget: built.totalBudget },
    });
  }

  return (
    <section id="firewall-configurator" className="scroll-mt-32 px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 md:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Build your own firewall</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">Answer four things — get your card map.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
          A personalized, copy-paste setup: virtual card structure, recommended limits per node, and a hardening SOP.
        </p>

        <div className="mt-8 grid gap-6">
          <Question label="Founder location">
            {LOCATIONS.map((o) => (
              <Pill key={o.value} active={location === o.value} onClick={() => pickLocation(o.value)}>{o.label}</Pill>
            ))}
          </Question>
          <Question label="Monthly spend">
            {SPENDS.map((o) => (
              <Pill key={o.value} active={monthlySpend === o.value} onClick={() => pickSpend(o.value)}>{o.label}</Pill>
            ))}
          </Question>
          <Question label="Stack (pick all that apply)">
            {STACK_ITEMS.map((o) => (
              <Pill key={o.value} active={stack.includes(o.value)} onClick={() => toggleStack(o.value)}>{o.label}</Pill>
            ))}
          </Question>
          <Question label="Team access">
            {TEAMS.map((o) => (
              <Pill key={o.value} active={teamAccess === o.value} onClick={() => pickTeam(o.value)}>{o.label}</Pill>
            ))}
          </Question>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={generate}
            disabled={stack.length === 0}
            className={
              'inline-flex items-center gap-2 rounded-[1rem] border px-6 py-3 text-sm font-bold transition-all duration-300 ' +
              (stack.length === 0
                ? 'cursor-not-allowed border-white/10 bg-white/[0.03] text-zinc-600'
                : 'border-cyan-300/50 bg-black/80 text-white hover:-translate-y-0.5 hover:border-cyan-200/70')
            }
          >
            Build my firewall plan
            <span className="text-cyan-300" aria-hidden>→</span>
          </button>
          {stack.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">Pick at least one stack lane to generate your plan.</p>
          ) : null}
        </div>

        {plan ? (
          <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-[#0a0a0c] p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Your firewall plan</p>
            <p className="mt-2 text-2xl font-extrabold text-white">{plan.headline}</p>
            <p className="mt-1 text-sm text-zinc-400">{plan.subline}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plan.nodes.map((n) => (
                <div key={n.key} className={'rounded-2xl border bg-white/[0.02] p-4 ' + NODE_BORDER[n.accent]}>
                  <p className={'text-xs font-bold ' + NODE_TEXT[n.accent]}>{n.label}</p>
                  <p className="mt-1 text-xl font-extrabold text-white">${n.monthlyLimit.toLocaleString('en-US')}/mo</p>
                  <p className="text-[10px] text-zinc-500">recommended cap</p>
                  <p className="mt-2 text-[11px] leading-5 text-zinc-400">{n.vendors}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">Hardening SOP</p>
            <ul className="mt-2 space-y-2">
              {plan.hardening.map((h) => (
                <li key={h} className="flex gap-2 text-[13px] leading-6 text-zinc-300">
                  <span className="mt-0.5 shrink-0 text-cyan-300" aria-hidden>✓</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-2.5 text-xs font-semibold text-amber-200">
              SmartFinPro recommended operating limits, not Mercury product limits — you set your own caps in Mercury.
            </p>

            <div className="mt-6">
              <Link
                href={plan.cta.href}
                target="_blank"
                rel="noopener sponsored"
                onClick={() =>
                  trackEvent('firewall_cta_after_plan_click', {
                    category: 'firewall_configurator',
                    properties: { location, monthlySpend, nodeCount: plan.nodes.length },
                  })
                }
                className="inline-flex items-center gap-2 rounded-[1rem] border border-cyan-300/50 bg-black/80 px-6 py-3 text-sm font-bold text-white no-underline transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/70"
              >
                {plan.cta.label}
                <span className="text-cyan-300" aria-hidden>→</span>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify types**

Run: `npm run check:types`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-configurator.tsx"
git commit -m "feat(firewall): interactive FirewallConfigurator UI (plan output + events)"
```

---

## Task 4: Wire into `firewall-client.tsx` (after Phase 01) + International chips

**Files:**
- Modify: `app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-client.tsx`

- [ ] **Step 1: Add imports + lifted location state + analytics hook**

At the top of `firewall-client.tsx`, add to the existing relative-import area:

```tsx
import { FirewallConfigurator } from './firewall-configurator';
import type { FounderLocation } from './firewall-plan';
import { useAnalytics } from '@/lib/hooks/use-analytics';
```

Inside `FirewallClient(...)`, near the other `useState` calls (e.g. after `const [activeHardeningStep, setActiveHardeningStep] = useState(0);`), add:

```tsx
  const [configLocation, setConfigLocation] = useState<FounderLocation>('us');
  const { trackEvent: trackFirewallEvent } = useAnalytics({ trackPageViews: false });
```

- [ ] **Step 2: Render the configurator after Phase 01**

Find the Phase-02 section opener:

```tsx
        <section id="phase-02" className="scroll-mt-32 px-4 py-24 sm:px-6 md:py-32 lg:px-8">
```

Insert the configurator IMMEDIATELY BEFORE it (so it lands right after Phase 01 closes):

```tsx
        <FirewallConfigurator location={configLocation} onLocationChange={setConfigLocation} />

        <section id="phase-02" className="scroll-mt-32 px-4 py-24 sm:px-6 md:py-32 lg:px-8">
```

- [ ] **Step 3: Make the International-Founder chips clickable + tracked**

Find the three International chips (in the "International Founder Routing" block):

```tsx
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-200">🇬🇧 United Kingdom</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-200">🇨🇦 Canada</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-200">🇦🇺 Australia</span>
                </div>
```

Replace with a mapped set of buttons that set the configurator location, scroll to it, and fire the event:

```tsx
                <div className="flex flex-wrap gap-2">
                  {([
                    { market: 'uk' as FounderLocation, label: '🇬🇧 United Kingdom' },
                    { market: 'ca' as FounderLocation, label: '🇨🇦 Canada' },
                    { market: 'au' as FounderLocation, label: '🇦🇺 Australia' },
                  ]).map((chip) => (
                    <button
                      key={chip.market}
                      type="button"
                      onClick={() => {
                        setConfigLocation(chip.market);
                        trackFirewallEvent('firewall_international_chip_click', {
                          category: 'firewall_configurator',
                          properties: { market: chip.market },
                        });
                        document.getElementById('firewall-configurator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-cyan-300/45 hover:text-white"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
```

- [ ] **Step 4: Verify types + RSC boundary + tests**

Run: `npm run check:types && npm run check:imports && npx vitest run __tests__/unit/firewall-plan.test.ts`
Expected: all green. (`firewall-client.tsx` is already `'use client'`; the configurator + hook are client-safe.)

- [ ] **Step 5: Commit**

```bash
git add "app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-client.tsx"
git commit -m "feat(firewall): mount configurator after Phase 01 + make international chips interactive"
```

---

## Task 5: Final verification

- [ ] **Step 1: Full static suite**

Run: `npm run check:types && npm run check:imports && npm run check:mdx && npx vitest run __tests__/unit/firewall-plan.test.ts`
Expected: all green.

- [ ] **Step 2: Visual + behavior (preview)**

Run a clean webpack preview: `rm -rf .next && npm run dev:webpack`, open `/us/business-banking/programmatic-financial-firewall`. Verify:
- The configurator sits directly after the Phase 01 section.
- No plan is shown until "Build my firewall plan" is clicked; the button is disabled until ≥1 stack lane is selected.
- Generated plan shows nodes with `$X/mo recommended cap`, the hardening SOP (with the international bullet when a non-US location is selected), the prominent amber disclaimer, and the "Launch Mercury and build this card map" CTA → `/go/mercury`.
- Clicking a 🇬🇧/🇨🇦/🇦🇺 chip scrolls to the configurator and pre-selects that location.

- [ ] **Step 3: Events fire (network tab / console)**

With the dev server, confirm POSTs to `/api/track` (or `navigator.sendBeacon`) for: `firewall_config_started` (first interaction), `firewall_plan_generated` (Build), `firewall_cta_after_plan_click` (plan CTA), `firewall_international_chip_click` (chip), `firewall_review_backlink_click` (EditorialBacklink link). None block navigation.

---

## Self-Review (author)

- **Spec coverage:** engine + types (§3/§4 → Task 1), TrackedReviewLink keeping EditorialBacklink server-rendered (§6 → Task 2), configurator UI + progressive disclosure + recommended wording + prominent disclaimer + CTA text (§5 → Task 3), placement after Phase 01 + international chips + lifted location (§5/§6 → Task 4), 5 events fire-and-forget via existing `useAnalytics` (§6 → Tasks 2–4), tests (§9 → Task 1), verification (§9 → Task 5). No gap. Spec's `firewall-analytics.ts` intentionally replaced by reusing `lib/hooks/use-analytics.ts` (documented at top).
- **Non-Goals respected:** no localized pages, no extra editorial text, no dashboard integration, no URL state, no email gate, no server-side plan computing.
- **Type consistency:** `FounderLocation`/`MonthlySpend`/`StackItem`/`TeamAccess`/`FirewallPlan`/`PlanNode` defined in Task 1 and imported unchanged in Tasks 3–4. `FirewallConfigurator` props (`location`, `onLocationChange`) match the firewall-client wiring. `TrackedReviewLink` props (`href`, `eventName`, `eventCategory?`, `className`, `children`) match the EditorialBacklink usage. Event names identical across spec and tasks.

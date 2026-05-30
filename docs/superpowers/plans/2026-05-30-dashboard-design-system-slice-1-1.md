# Dashboard Design-System — Slice 1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 6 Dashboard-Primitives (`PageHeader`, `StatCard`, `SectionCard`, `ActionButton`, `EmptyState`, `FilterBar`) plus brand tone-tokens, and migrate the 4 Pilot pages (`revenue`, `ranking`, `analytics`, `links`) onto them — normalizing the violet shell/control outliers without behavior change.

**Architecture:** New `components/dashboard/ui/` library. Presentational primitives are Server Components (no `'use client'`); colors come exclusively from CSS classes in `app/(dashboard)/dashboard.css` (no hex in JSX). `ActionButton` is a thin semantic wrapper over the existing `components/ui/button.tsx` brand variants. `FilterBar` is a pure layout shell wrapping the existing (unchanged) `TimeRangeSelector` / `SiloFilterDropdown`. A single pure tone-resolver (`tokens.ts`) is unit-tested with vitest; all UI is verified on localhost per the agreed process.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, Tailwind v4, lucide-react, `cn` from `@/lib/utils`, vitest (existing).

**Process (binding):** lokal bauen → auf localhost visuell + funktional testen → Abnahme anfordern → **erst nach expliziter Freigabe deployen**. No push/deploy in this plan.

---

## File Structure

**Create:**
- `components/dashboard/ui/tokens.ts` — pure tone→className resolver (`DashTone`, `dashToneIconClass`, `dashToneTextClass`).
- `components/dashboard/ui/page-header.tsx` — `PageHeader` (Server Component).
- `components/dashboard/ui/stat-card.tsx` — `StatCard` (Server Component).
- `components/dashboard/ui/section-card.tsx` — `SectionCard` (Server Component).
- `components/dashboard/ui/action-button.tsx` — `ActionButton` (wrapper over `Button`).
- `components/dashboard/ui/empty-state.tsx` — `EmptyState` (Server Component).
- `components/dashboard/ui/filter-bar.tsx` — `FilterBar` layout shell (Server Component).
- `components/dashboard/ui/index.ts` — barrel export.
- `__tests__/unit/dashboard-tone-tokens.test.ts` — vitest unit test for `tokens.ts`.

**Modify:**
- `app/(dashboard)/dashboard.css` — add `.dash-tone-*` + `.dash-tone-text-*` brand tone classes.
- `app/(dashboard)/dashboard/ranking/page.tsx` — migrate header → `PageHeader`.
- `app/(dashboard)/dashboard/links/page.tsx` — add `PageHeader` + replace `!bg-violet-600` button → `ActionButton`.
- `app/(dashboard)/dashboard/revenue/page.tsx` — header → `PageHeader`, local `StatCard` → primitive, card sections → `SectionCard`.
- `app/(dashboard)/dashboard/analytics/page.tsx` — header → `PageHeader` + `FilterBar`, 5 stat cards → `StatCard`.

**Out of scope (per spec Non-Goals):** all-widget color normalization, chart palettes, feature accent colors, Saved Views, Cohort/LTV, the `silo-filter-dropdown.tsx` hard-push bug.

---

### Task 1: Brand tone classes in `dashboard.css`

**Files:**
- Modify: `app/(dashboard)/dashboard.css` (append near the existing `.stat-icon` block)

- [ ] **Step 1: Add the tone classes**

Append to `app/(dashboard)/dashboard.css`:

```css
/* ============================================================
   PRIMITIVE TONE TOKENS — brand-aligned icon tints for
   components/dashboard/ui/* (StatCard icon box, header icons).
   Foreground = brand --sfp-* vars; tints kept as hex (matches
   existing dashboard.css convention). No hex in component JSX.
   ============================================================ */
.dash-tone-navy  { background: var(--sfp-sky, #E8F0FB); color: var(--sfp-navy, #1B4F8C); }
.dash-tone-green { background: #E7F3EC; color: var(--sfp-green, #1A6B3A); }
.dash-tone-gold  { background: #FDF1DD; color: var(--sfp-gold-dark, #D48B1A); }
.dash-tone-red   { background: #FBE3E4; color: var(--sfp-red, #D64045); }
.dash-tone-slate { background: #F1F5F9; color: #475569; }
.dash-tone-blue  { background: #DBEAFE; color: #2563EB; }
.dash-tone-amber { background: #FEF3C7; color: #D97706; }

.dash-tone-text-navy  { color: var(--sfp-navy, #1B4F8C); }
.dash-tone-text-green { color: var(--sfp-green, #1A6B3A); }
.dash-tone-text-gold  { color: var(--sfp-gold-dark, #D48B1A); }
.dash-tone-text-red   { color: var(--sfp-red, #D64045); }
.dash-tone-text-slate { color: #64748B; }
.dash-tone-text-blue  { color: #2563EB; }
.dash-tone-text-amber { color: #D97706; }
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/dashboard.css"
git commit -m "feat(dashboard): add brand tone-token classes for ui primitives"
```

---

### Task 2: `tokens.ts` tone resolver (TDD)

**Files:**
- Create: `components/dashboard/ui/tokens.ts`
- Test: `__tests__/unit/dashboard-tone-tokens.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/unit/dashboard-tone-tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { dashToneIconClass, dashToneTextClass } from '@/components/dashboard/ui/tokens';

describe('dashboard tone tokens', () => {
  it('defaults to navy when no tone given', () => {
    expect(dashToneIconClass()).toBe('dash-tone-navy');
    expect(dashToneTextClass()).toBe('dash-tone-text-navy');
  });

  it('maps each valid tone to its class', () => {
    for (const tone of ['navy', 'green', 'gold', 'red', 'slate', 'blue', 'amber'] as const) {
      expect(dashToneIconClass(tone)).toBe(`dash-tone-${tone}`);
      expect(dashToneTextClass(tone)).toBe(`dash-tone-text-${tone}`);
    }
  });

  it('falls back to navy for an unknown tone', () => {
    // @ts-expect-error intentional invalid input
    expect(dashToneIconClass('violet')).toBe('dash-tone-navy');
    // @ts-expect-error intentional invalid input
    expect(dashToneTextClass('purple')).toBe('dash-tone-text-navy');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/unit/dashboard-tone-tokens.test.ts`
Expected: FAIL — cannot resolve `@/components/dashboard/ui/tokens`.

- [ ] **Step 3: Write minimal implementation**

Create `components/dashboard/ui/tokens.ts`:

```ts
// components/dashboard/ui/tokens.ts
// Pure mapping from a brand tone to the CSS class defined in
// app/(dashboard)/dashboard.css. Keeps all color decisions token-driven
// (no hex in component JSX). Default + fallback = brand navy.

export type DashTone = 'navy' | 'green' | 'gold' | 'red' | 'slate' | 'blue' | 'amber';

const TONES: readonly DashTone[] = ['navy', 'green', 'gold', 'red', 'slate', 'blue', 'amber'];

function normalize(tone: DashTone): DashTone {
  return TONES.includes(tone) ? tone : 'navy';
}

/** Class for a filled icon box (background tint + foreground color). */
export function dashToneIconClass(tone: DashTone = 'navy'): string {
  return `dash-tone-${normalize(tone)}`;
}

/** Class for a bare colored icon/text (foreground only). */
export function dashToneTextClass(tone: DashTone = 'navy'): string {
  return `dash-tone-text-${normalize(tone)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/unit/dashboard-tone-tokens.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/ui/tokens.ts __tests__/unit/dashboard-tone-tokens.test.ts
git commit -m "feat(dashboard): tone resolver for ui primitives (+ unit test)"
```

---

### Task 3: `PageHeader` primitive

**Files:**
- Create: `components/dashboard/ui/page-header.tsx`

- [ ] **Step 1: Write the component**

Create `components/dashboard/ui/page-header.tsx`:

```tsx
// components/dashboard/ui/page-header.tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashToneTextClass, type DashTone } from './tokens';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Icon accent. Default = brand navy. Override only for special cases. */
  tone?: DashTone;
  /** Right-aligned slot for buttons/filters. */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  tone = 'navy',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          {Icon && <Icon className={cn('h-6 w-6', dashToneTextClass(tone))} />}
          {title}
        </h1>
        {description && <p className="text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `page-header.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ui/page-header.tsx
git commit -m "feat(dashboard): PageHeader primitive"
```

---

### Task 4: `StatCard` primitive

**Files:**
- Create: `components/dashboard/ui/stat-card.tsx`

- [ ] **Step 1: Write the component**

Create `components/dashboard/ui/stat-card.tsx`. Consolidates the local revenue `StatCard` and the analytics inline stat markup onto the existing `.dashboard-card` frame.

```tsx
// components/dashboard/ui/stat-card.tsx
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashToneIconClass, type DashTone } from './tokens';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  icon?: LucideIcon;
  /** Icon box accent. Default = brand navy. */
  tone?: DashTone;
  /** Optional delta badge next to the value. */
  delta?: { direction: 'up' | 'down' | 'neutral'; value: string };
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'navy',
  delta,
  className,
}: StatCardProps) {
  return (
    <div className={cn('dashboard-card p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-semibold text-slate-900 tabular-nums">{value}</p>
            {delta && delta.direction !== 'neutral' && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  delta.direction === 'up' ? 'text-emerald-600' : 'text-red-500',
                )}
              >
                {delta.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {delta.value}
              </span>
            )}
          </div>
          {subtext && <p className="text-sm text-slate-400 mt-1">{subtext}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              dashToneIconClass(tone),
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `stat-card.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ui/stat-card.tsx
git commit -m "feat(dashboard): StatCard primitive"
```

---

### Task 5: `SectionCard` primitive

**Files:**
- Create: `components/dashboard/ui/section-card.tsx`

- [ ] **Step 1: Write the component**

Create `components/dashboard/ui/section-card.tsx`. Wraps the existing `.dashboard-card` class with an optional header row.

```tsx
// components/dashboard/ui/section-card.tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashToneTextClass, type DashTone } from './tokens';

export interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  /** Icon accent. Default = brand navy. */
  tone?: DashTone;
  /** Right-aligned slot in the header row. */
  actions?: React.ReactNode;
  className?: string;
  /** Body padding override. Default 'p-6'; use 'p-4' for dense tables. */
  contentClassName?: string;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  tone = 'navy',
  actions,
  className,
  contentClassName = 'p-6',
  children,
}: SectionCardProps) {
  const hasHeader = Boolean(title || actions || Icon);
  return (
    <div className={cn('dashboard-card overflow-hidden', className)}>
      {hasHeader && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          {Icon && <Icon className={cn('h-5 w-5', dashToneTextClass(tone))} />}
          {title && <h3 className="font-semibold text-slate-900">{title}</h3>}
          {description && <span className="text-xs text-slate-400">{description}</span>}
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `section-card.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ui/section-card.tsx
git commit -m "feat(dashboard): SectionCard primitive"
```

---

### Task 6: `ActionButton` primitive

**Files:**
- Create: `components/dashboard/ui/action-button.tsx`

- [ ] **Step 1: Write the component**

Create `components/dashboard/ui/action-button.tsx`. Thin semantic wrapper over the existing `Button` brand variants — no new color/hex logic. `primary` maps to `default` (navy via the dashboard `--primary` override), reserving the uppercase-bold `navy`/`gold` Button variants for marketing CTAs only.

```tsx
// components/dashboard/ui/action-button.tsx
import type { LucideIcon } from 'lucide-react';
import { Button, type buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';

type ButtonSize = VariantProps<typeof buttonVariants>['size'];

export interface ActionButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'variant'> {
  /** Semantic dashboard intent. */
  variant?: 'primary' | 'cta' | 'success' | 'secondary' | 'danger';
  size?: ButtonSize;
  icon?: LucideIcon;
}

const VARIANT_MAP: Record<
  NonNullable<ActionButtonProps['variant']>,
  React.ComponentProps<typeof Button>['variant']
> = {
  primary: 'default',   // navy in dashboard via --primary override
  cta: 'gold',
  success: 'green',
  secondary: 'outline',
  danger: 'destructive',
};

export function ActionButton({
  variant = 'primary',
  icon: Icon,
  children,
  ...props
}: ActionButtonProps) {
  return (
    <Button variant={VARIANT_MAP[variant]} {...props}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Button>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `action-button.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ui/action-button.tsx
git commit -m "feat(dashboard): ActionButton primitive (wraps Button brand variants)"
```

---

### Task 7: `EmptyState` primitive

**Files:**
- Create: `components/dashboard/ui/empty-state.tsx`

- [ ] **Step 1: Write the component**

Create `components/dashboard/ui/empty-state.tsx`:

```tsx
// components/dashboard/ui/empty-state.tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashToneIconClass, type DashTone } from './tokens';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  tone?: DashTone;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'slate',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      {Icon && (
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', dashToneIconClass(tone))}>
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `empty-state.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ui/empty-state.tsx
git commit -m "feat(dashboard): EmptyState primitive"
```

---

### Task 8: `FilterBar` layout shell

**Files:**
- Create: `components/dashboard/ui/filter-bar.tsx`

- [ ] **Step 1: Write the component**

Create `components/dashboard/ui/filter-bar.tsx`. **Layout only** — no state, no URL/query logic, no persistence (that arrives in Sub-Project 2).

```tsx
// components/dashboard/ui/filter-bar.tsx
// Pure layout shell for dashboard filter controls. It does NOT own any
// state, URL params, or persistence — it only arranges whatever filter
// controls (TimeRangeSelector, SiloFilterDropdown, etc.) are passed in.
// Saved-Views logic is intentionally deferred to Sub-Project 2.
import { cn } from '@/lib/utils';

export interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `filter-bar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ui/filter-bar.tsx
git commit -m "feat(dashboard): FilterBar layout shell (no state/persistence)"
```

---

### Task 9: Barrel export

**Files:**
- Create: `components/dashboard/ui/index.ts`

- [ ] **Step 1: Write the barrel**

Create `components/dashboard/ui/index.ts`:

```ts
// components/dashboard/ui/index.ts
export { PageHeader, type PageHeaderProps } from './page-header';
export { StatCard, type StatCardProps } from './stat-card';
export { SectionCard, type SectionCardProps } from './section-card';
export { ActionButton, type ActionButtonProps } from './action-button';
export { EmptyState, type EmptyStateProps } from './empty-state';
export { FilterBar, type FilterBarProps } from './filter-bar';
export { dashToneIconClass, dashToneTextClass, type DashTone } from './tokens';
```

- [ ] **Step 2: Verify client/server boundary**

Run: `npm run check:imports`
Expected: PASS — no `'use server'` modules pulled into client chunks (none of the primitives import server actions).

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ui/index.ts
git commit -m "feat(dashboard): barrel export for ui primitives"
```

---

### Task 10: Migrate `ranking` page (PageHeader)

**Files:**
- Modify: `app/(dashboard)/dashboard/ranking/page.tsx`

- [ ] **Step 1: Replace the hand-rolled header**

In `app/(dashboard)/dashboard/ranking/page.tsx`, add the import and replace the header `<div>` block.

Add to imports (after the existing `import { Search } from 'lucide-react';`):

```tsx
import { PageHeader } from '@/components/dashboard/ui';
```

Replace lines 14–23 (the `{/* Header */}` block):

```tsx
      <PageHeader
        icon={Search}
        title="Ranking Tracker"
        description="Google-Positionen & SERP-Monitoring für alle 4 Märkte"
      />
```

(Note: the violet `text-violet-500` on the Search icon is removed — PageHeader renders it brand-navy by default.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `ranking/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/dashboard/ranking/page.tsx"
git commit -m "refactor(dashboard): ranking page uses PageHeader primitive"
```

---

### Task 11: Migrate `links` page (PageHeader + ActionButton)

**Files:**
- Modify: `app/(dashboard)/dashboard/links/page.tsx`

- [ ] **Step 1: Rewrite the page**

Per the explicit refinement, `links` gets a real `PageHeader` (not just a button row) and the violet button becomes `ActionButton`. Replace the full file `app/(dashboard)/dashboard/links/page.tsx`:

```tsx
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { Link2, Plus } from 'lucide-react';
import { AffiliateCommandCenter } from '@/components/dashboard/affiliate-command-center';
import { CreateLinkDialog } from '@/components/dashboard/create-link-dialog';
import { getAffiliateLinksService } from '@/lib/actions/affiliate-links';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';
import { PageHeader, ActionButton } from '@/components/dashboard/ui';

export default async function LinksPage() {
  const { data: links } = await getAffiliateLinksService();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Link2}
        title="Affiliate Links"
        description="Manage cloaked affiliate links and CPA mapping"
        actions={
          <CreateLinkDialog>
            <ActionButton variant="primary" icon={Plus}>
              Add Link
            </ActionButton>
          </CreateLinkDialog>
        }
      />

      <WidgetErrorBoundary label="Affiliate Links" minHeight="h-[600px]">
        <Suspense
          fallback={
            <div className="h-[600px] animate-pulse bg-slate-100 rounded-lg" />
          }
        >
          <AffiliateCommandCenter initialLinks={links || []} />
        </Suspense>
      </WidgetErrorBoundary>
    </div>
  );
}
```

- [ ] **Step 2: Verify `CreateLinkDialog` accepts a child trigger**

Run: `grep -n "children" components/dashboard/create-link-dialog.tsx | head -3`
Expected: it renders `children` as the dialog trigger (it already wrapped a `<Button>` child). If it uses `asChild` on a trigger, `ActionButton` must forward refs/props — `Button` already supports `asChild`; `ActionButton` forwards `...props`. If the grep shows it does NOT render `children`, STOP and report before editing.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `links/page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/dashboard/links/page.tsx"
git commit -m "refactor(dashboard): links page uses PageHeader + ActionButton (drops !bg-violet-600)"
```

---

### Task 12: Migrate `revenue` page (PageHeader + StatCard + SectionCard)

**Files:**
- Modify: `app/(dashboard)/dashboard/revenue/page.tsx`

- [ ] **Step 1: Update imports + delete local StatCard**

In `app/(dashboard)/dashboard/revenue/page.tsx`:

Add to the primitive imports (after the `ExportButton` import line 24):

```tsx
import { PageHeader, StatCard, SectionCard } from '@/components/dashboard/ui';
```

Delete the local `StatCard` component definition (lines 34–84, the `// Stat card component` block). Keep the `Skeleton` helper.

- [ ] **Step 2: Replace the header (lines 96–102)**

```tsx
      <PageHeader
        title="Revenue Analytics"
        description="Automatic revenue tracking from affiliate conversions"
      />
```

(No icon on this header today — keep it iconless to avoid an unintended visual addition.)

- [ ] **Step 3: Update the 4 stat cards to the primitive API**

Replace the four `<StatCard .../>` usages (lines 106–137) — they now use `tone` + `delta` instead of `iconColor` + `trend`/`trendValue`. The violet `bg-purple-50 text-purple-500` EPC card becomes `tone="navy"`:

```tsx
        <StatCard
          label="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="from approved conversions"
          icon={DollarSign}
          tone="green"
          delta={
            stats.revenueTrendChange
              ? { direction: stats.revenueTrend, value: `${stats.revenueTrendChange}%` }
              : undefined
          }
        />
        <StatCard
          label="Global EPC"
          value={`$${stats.globalEPC.toFixed(2)}`}
          subtext="earnings per click"
          icon={Zap}
          tone="navy"
          delta={
            stats.epcTrendChange
              ? { direction: stats.epcTrend, value: `${stats.epcTrendChange}%` }
              : undefined
          }
        />
        <StatCard
          label="Total Clicks"
          value={stats.totalClicks.toLocaleString('en-US')}
          subtext="last 30 days"
          icon={MousePointer}
          tone="blue"
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats.globalConversionRate.toFixed(2)}%`}
          subtext={`${stats.totalConversions} conversions`}
          icon={Target}
          tone="amber"
        />
```

- [ ] **Step 4: Migrate the card sections to `SectionCard`**

Replace the four bespoke `bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden` card blocks (EPC Trend, Monthly Revenue, Top Products by Revenue, Revenue by Page, Recent Conversions). The EPC-Trend `text-purple-500` icon is normalized to `tone="navy"`. Example replacements:

EPC Trend + Monthly Revenue (the `grid lg:grid-cols-2` row, lines 164–187):

```tsx
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="EPC Trend" icon={TrendingUp} tone="navy" description="Last 7 days">
          <EPCTrendChart data={stats.epcTrendData} globalEPC={stats.globalEPC} />
        </SectionCard>
        <SectionCard title="Monthly Revenue" icon={BarChart3} tone="green">
          <RevenueChart data={stats.conversionsByMonth} />
        </SectionCard>
      </div>
```

Top Products (lines 189–203):

```tsx
      <SectionCard title="Top Products by Revenue" icon={ArrowUpRight} tone="slate" description="All time" contentClassName="p-4">
        <WidgetErrorBoundary label="Revenue by Product" minHeight="h-64">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <RevenueByProductTable products={stats.revenueByProduct} />
          </Suspense>
        </WidgetErrorBoundary>
      </SectionCard>
```

Revenue by Page (lines 205–222) — keeps the `ExportButton` in `actions` and the page count in `description`:

```tsx
      <SectionCard
        title="Revenue by Page"
        icon={FileText}
        tone="blue"
        description={`${pageStats.totalPages} pages tracked`}
        actions={<ExportButton dataset="revenue-by-page" />}
        contentClassName="p-4"
      >
        <WidgetErrorBoundary label="Revenue by Page" minHeight="h-64">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <RevenueByPageTable pages={pageStats.pages} />
          </Suspense>
        </WidgetErrorBoundary>
      </SectionCard>
```

Recent Conversions (lines 224–240) — keeps `AddConversionForm` in `actions`:

```tsx
      <SectionCard
        title="Recent Conversions"
        icon={DollarSign}
        tone="green"
        actions={<AddConversionForm affiliateLinks={affiliateLinks} />}
      >
        <WidgetErrorBoundary label="Recent Conversions" minHeight="h-48">
          <Suspense fallback={<Skeleton className="h-48" />}>
            <RecentConversions conversions={stats.recentConversions} />
          </Suspense>
        </WidgetErrorBoundary>
      </SectionCard>
```

Leave the "Revenue by Market" block (lines 145–161, which has its own small `w-8 h-8` icon header layout) **unchanged** — it is not a standard card-header section and migrating it adds churn beyond the demo value.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `revenue/page.tsx`. Confirm `TrendingDown` is still imported (used by StatCard internally, not the page) — the page may now have unused imports (`TrendingDown` was only used by the deleted local StatCard). Remove any now-unused imports flagged by tsc/eslint.

- [ ] **Step 6: Lint the file for unused imports**

Run: `npx eslint "app/(dashboard)/dashboard/revenue/page.tsx"`
Expected: no `no-unused-vars` errors. Remove `TrendingUp`/`TrendingDown` from the page import if eslint flags them as unused (they are referenced in the SectionCard EPC/Monthly headers as `TrendingUp`/`BarChart3`, so verify before deleting).

- [ ] **Step 7: Commit**

```bash
git add "app/(dashboard)/dashboard/revenue/page.tsx"
git commit -m "refactor(dashboard): revenue page uses PageHeader/StatCard/SectionCard primitives"
```

---

### Task 13: Migrate `analytics` page (PageHeader + FilterBar + StatCard)

**Files:**
- Modify: `app/(dashboard)/dashboard/analytics/page.tsx`

This is the FilterBar reference migration. The `TimeRangeSelector` and `SiloFilterDropdown` are wrapped **unchanged** inside `FilterBar` — `searchParams`/`router.push` behavior is identical.

- [ ] **Step 1: Update imports**

Add to `app/(dashboard)/dashboard/analytics/page.tsx` imports:

```tsx
import { PageHeader, StatCard, FilterBar } from '@/components/dashboard/ui';
```

- [ ] **Step 2: Replace the page header block (lines 66–86)**

```tsx
      {/* Page Header */}
      <PageHeader
        icon={BarChart3}
        title="Traffic Analytics"
        description={`Detailed traffic analysis for ${rangeLabels[range]}${silo !== 'all' ? ` • ${silo.replace(/-/g, ' ')}` : ''}`}
        actions={
          <FilterBar>
            <SimulationButton />
            <SiloFilterDropdown currentSilo={silo} />
            <WidgetErrorBoundary label="Time Range" minHeight="h-10">
              <Suspense fallback={<div className="h-10 w-40 bg-slate-200 animate-pulse rounded-lg" />}>
                <TimeRangeSelector />
              </Suspense>
            </WidgetErrorBoundary>
          </FilterBar>
        }
      />
```

- [ ] **Step 3: Replace the 5 stat cards (lines 107–~190)**

Replace the `iconStyles` object usage with `StatCard` + `tone`. The violet `time: 'bg-purple-50 text-purple-500'` becomes `tone="navy"`. The full 5-card grid:

```tsx
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Page Views"
          value={stats.overview.pageViewsInRange.toLocaleString('en-US')}
          subtext={`${stats.overview.totalPageViews.toLocaleString('en-US')} total`}
          icon={FileText}
          tone="green"
        />
        <StatCard
          label="Unique Sessions"
          value={stats.overview.uniqueSessions.toLocaleString('en-US')}
          subtext="unique visitors"
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Avg. Time on Page"
          value={`${Math.floor(stats.overview.avgTimeOnPage / 60)}:${(stats.overview.avgTimeOnPage % 60).toString().padStart(2, '0')}`}
          subtext="min:sec"
          icon={Clock}
          tone="navy"
        />
        <StatCard
          label="Avg. Scroll Depth"
          value={`${stats.overview.avgScrollDepth}%`}
          subtext="of page content"
          icon={ScrollText}
          tone="amber"
        />
        <StatCard
          label="Bounce Rate"
          value={`${stats.overview.bounceRate}%`}
          subtext="single-page sessions"
          icon={TrendingDown}
          tone="red"
        />
      </div>
```

**Important:** verify the exact value expressions for the Bounce Rate card against the current source (lines ~176–190) before replacing — match whatever field/label it currently renders. If the current Bounce Rate value/subtext differs, keep the current values; only the wrapper changes.

- [ ] **Step 4: Remove the now-unused `iconStyles` object (lines 39–45)**

Delete the `const iconStyles = { ... }` block — no longer referenced.

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint "app/(dashboard)/dashboard/analytics/page.tsx"`
Expected: no errors; no unused-var warnings (remove any icon imports that are no longer used after migration, e.g. if any lucide icon was only used by removed markup).

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/dashboard/analytics/page.tsx"
git commit -m "refactor(dashboard): analytics page uses PageHeader/FilterBar/StatCard (behavior unchanged)"
```

---

### Task 14: Full local verification + checklist

**Files:** none (verification only)

- [ ] **Step 1: Build-time checks**

Run: `npm run check:imports && npx tsc --noEmit && npm run test`
Expected: all PASS (check:imports clean, no type errors, vitest incl. the new tone-tokens test green).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds (prebuild check:imports + check:mdx etc. pass).

- [ ] **Step 3: Start dev server + verify each pilot route**

Start the dev server (preview_start) and walk the localhost test matrix below using `preview_snapshot`, `preview_screenshot`, `preview_console_logs`, and the functional clicks for analytics filters.

- [ ] **Step 4: Run the dashboard e2e smoke test**

Run: `npm run test:dashboard-smoke`
Expected: PASS (no regressions in dashboard shell/navigation).

- [ ] **Step 5: Request Abnahme**

Do **not** push or deploy. Present screenshots + the completed checklist and request explicit release approval.

---

## localhost Test Matrix (Slice 1.1)

| Route | Visual checks | Functional checks |
|---|---|---|
| `/dashboard/ranking` | Header icon is **navy** (was violet); heading `text-2xl font-bold text-slate-900`; description present | Page loads; no console errors |
| `/dashboard/links` | New **PageHeader** with navy Link2 icon; "Add Link" button is **navy** (not violet), not uppercase | Clicking "Add Link" opens `CreateLinkDialog`; dialog submit still works |
| `/dashboard/revenue` | PageHeader; 4 StatCards (EPC icon **navy**, not violet); SectionCards have identical border/shadow/radius; ExportButton still in "Revenue by Page" header; AddConversionForm still in "Recent Conversions" header | Export button downloads CSV; AddConversionForm opens; trend deltas render where data exists |
| `/dashboard/analytics` | PageHeader with FilterBar (Simulation + Silo + TimeRange) right-aligned; 5 StatCards (Time icon **navy**, not violet) | **TimeRange** 24h/7d/30d/all updates `?range=` and reloads data (unchanged); **Silo** updates `?silo=` (unchanged); no hydration warnings in console |

**Cross-cutting:**
- [ ] No `violet`/`purple` classes remain on the 4 pilot pages' headers/stat icons (`grep -nE "violet|purple" <the 4 files>` → none in migrated markup).
- [ ] No hex literals introduced in the new primitive JSX (`grep -nE "#[0-9a-fA-F]{3,6}" components/dashboard/ui/*.tsx` → none).
- [ ] Sidebar, KPI-Header, Topbar, Command-Palette unchanged.
- [ ] Charts and non-pilot widgets untouched.

---

## Self-Review notes
- **Spec coverage:** all 6 primitives (Tasks 2–8) + tone normalization in shell/controls (Task 1 + migrations) + 4-page pilot incl. `analytics` FilterBar reference (Task 13) + `links` PageHeader (Task 11) ✓. FilterBar layout-only, no persistence ✓. Non-goals untouched ✓.
- **Type consistency:** `DashTone`, `dashToneIconClass`, `dashToneTextClass` defined in Task 2, consumed identically in Tasks 3/4/5/7. `StatCard.delta` shape (`{direction, value}`) used consistently in Task 12. `ActionButton` variant union matches usage in Task 11.
- **No placeholders:** every code step contains full code; verification steps have exact commands + expected output.

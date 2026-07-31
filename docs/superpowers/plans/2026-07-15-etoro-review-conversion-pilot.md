# eToro Review Conversion Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the US eToro review into SmartFinPro's reusable decision-first review pattern: editorially credible, easy to scan, and conversion-focused without aggressive sales language.

**Architecture:** Add an opt-in `decisionFirst` presentation contract to review frontmatter and normalize it through the existing MDX pipeline. A focused `DecisionFirstVerdict` component will render the first 60-second buying decision, while `ReportLayout` keeps its current flow for every page that does not opt in. The eToro MDX will then be rewritten around verified reader scenarios, explicit trade-offs, and primary sources.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, MDX/gray-matter, Tailwind CSS, Vitest, Playwright.

## Global Constraints

- Scope is `content/us/trading/etoro-review.mdx` plus the smallest reusable template and type changes needed for the opt-in decision-first pattern.
- Tone is trusted advisory, not aggressive selling.
- The first decision block must say who should choose eToro, who should skip it, and the main trade-off.
- Keep all existing review pages on the current layout unless `decisionFirst: true` is present.
- Do not remove X-Ray Score or MiniQuiz globally; decision-first pages place them in a secondary collapsed tool panel.
- Keep disclosures, risk warnings, author details, JSON-LD, FAQ, related links, canonical, and hreflang behavior intact.
- SEO title must be 45-60 characters and description 140-160 characters.
- Set `modifiedDate` and `dataVerifiedDate` to `2026-07-15`.
- MDX contains no H1; `ReportLayout` remains the single H1 owner.
- Every `sections` entry has an explicit matching `id="..."` anchor.
- Target at least 8 internal links, 6 external authority links, and a content quality score of at least 90.
- Target 2,600-3,600 words where the verified subject matter supports it; remove repetition before adding length.
- No new dependency and no unrelated refactor.

---

## File Map

- `lib/mdx/index.ts`: normalize the new optional decision-first frontmatter fields.
- `types/index.ts`: expose the same fields on `ReviewData` for rendering.
- `app/(marketing)/[market]/[category]/[slug]/page.tsx`: pass normalized decision-first fields into `ReportLayout`.
- `lib/reviews/decision-first.ts`: pure fallback and display-model logic for the reusable verdict component.
- `components/marketing/decision-first-verdict.tsx`: render the first 60-second decision and its specific CTA.
- `components/marketing/report-layout.tsx`: opt eToro into the new verdict flow while preserving the legacy flow by default.
- `content/us/trading/etoro-review.mdx`: new editorial structure, current metadata, explicit anchors, and primary-source links.
- `__tests__/unit/decision-first-review.test.ts`: unit coverage for frontmatter normalization and decision-model fallbacks.

### Task 1: Add The Decision-First Frontmatter Contract

**Files:**
- Create: `__tests__/unit/decision-first-review.test.ts`
- Modify: `lib/mdx/index.ts`
- Modify: `types/index.ts`
- Modify: `app/(marketing)/[market]/[category]/[slug]/page.tsx`

**Interfaces:**
- Consumes: raw gray-matter frontmatter fields.
- Produces: `ContentMeta.decisionFirst`, `decisionSummary`, `chooseIf`, `skipIf`, and `primaryCtaLabel`; identical optional fields on `ReviewData`.

- [ ] **Step 1: Write the failing normalization test**

Create `__tests__/unit/decision-first-review.test.ts` with this initial test:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeFrontmatter } from '@/lib/mdx';

describe('decision-first review metadata', () => {
  it('normalizes the opt-in review presentation fields', () => {
    const meta = normalizeFrontmatter({
      title: 'eToro Review 2026: Copy Trading, Fees & Verdict',
      description: 'A sufficiently complete review description.',
      author: 'SmartFinPro Trading Team',
      publishDate: '2026-01-22',
      modifiedDate: '2026-07-15',
      category: 'trading',
      market: 'us',
      affiliateDisclosure: true,
      decisionFirst: true,
      decisionSummary: 'Best for beginners who want to learn through copy trading.',
      chooseIf: ['You want to test copy trading with virtual funds.'],
      skipIf: ['You need advanced charting and order types.'],
      primaryCtaLabel: 'Try eToro Demo',
    });

    expect(meta.decisionFirst).toBe(true);
    expect(meta.decisionSummary).toContain('copy trading');
    expect(meta.chooseIf).toEqual(['You want to test copy trading with virtual funds.']);
    expect(meta.skipIf).toEqual(['You need advanced charting and order types.']);
    expect(meta.primaryCtaLabel).toBe('Try eToro Demo');
  });

  it('leaves the decision-first fields undefined for legacy reviews', () => {
    const meta = normalizeFrontmatter({
      title: 'Legacy Review',
      description: 'Legacy review description.',
      author: 'SmartFinPro Editorial Team',
      publishDate: '2026-01-01',
      modifiedDate: '2026-01-01',
      category: 'trading',
      market: 'us',
      affiliateDisclosure: true,
    });

    expect(meta.decisionFirst).toBeUndefined();
    expect(meta.chooseIf).toBeUndefined();
    expect(meta.skipIf).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test and confirm the contract is absent**

Run: `npx vitest run __tests__/unit/decision-first-review.test.ts`

Expected: FAIL because `normalizeFrontmatter` is not exported and the decision-first properties do not exist.

- [ ] **Step 3: Implement the metadata contract**

In `lib/mdx/index.ts`, export `normalizeFrontmatter` and add these fields to `ContentMeta`:

```ts
  decisionFirst?: boolean;
  decisionSummary?: string;
  chooseIf?: string[];
  skipIf?: string[];
  primaryCtaLabel?: string;
```

Normalize them without changing legacy defaults:

```ts
    decisionFirst: raw.decisionFirst === true || undefined,
    decisionSummary: (raw.decisionSummary as string) || undefined,
    chooseIf: (raw.chooseIf as string[]) || undefined,
    skipIf: (raw.skipIf as string[]) || undefined,
    primaryCtaLabel: (raw.primaryCtaLabel as string) || undefined,
```

Add the same optional fields to `ReviewData` in `types/index.ts`, then pass them in the review object in `app/(marketing)/[market]/[category]/[slug]/page.tsx`:

```ts
            decisionFirst: content.meta.decisionFirst,
            decisionSummary: content.meta.decisionSummary,
            chooseIf: content.meta.chooseIf,
            skipIf: content.meta.skipIf,
            primaryCtaLabel: content.meta.primaryCtaLabel,
```

- [ ] **Step 4: Run the focused test and type-check**

Run: `npx vitest run __tests__/unit/decision-first-review.test.ts`

Expected: 2 tests PASS.

Run: `npx tsc --noEmit`

Expected: exit 0 with no TypeScript errors.

- [ ] **Step 5: Commit the contract**

```bash
git add __tests__/unit/decision-first-review.test.ts lib/mdx/index.ts types/index.ts 'app/(marketing)/[market]/[category]/[slug]/page.tsx'
git commit -m "Add decision-first review metadata"
```

### Task 2: Build The Reusable Decision Model And Verdict Component

**Files:**
- Modify: `__tests__/unit/decision-first-review.test.ts`
- Create: `lib/reviews/decision-first.ts`
- Create: `components/marketing/decision-first-verdict.tsx`

**Interfaces:**
- Consumes: `ReviewData` plus market and category for CTA tracking.
- Produces: `getDecisionFirstModel(review): DecisionFirstModel` and `<DecisionFirstVerdict review market category />`.

- [ ] **Step 1: Add failing tests for explicit and fallback copy**

Append to `__tests__/unit/decision-first-review.test.ts`:

```ts
import type { ReviewData } from '@/types';
import { getDecisionFirstModel } from '@/lib/reviews/decision-first';

const baseReview: ReviewData = {
  title: 'eToro Review 2026: Copy Trading, Fees & Verdict',
  description: 'Default description',
  productName: 'eToro',
  category: 'trading',
  market: 'us',
  rating: 4.7,
  reviewCount: 0,
  affiliateUrl: '/go/etoro',
  pros: ['Beginner-friendly copy trading', 'Virtual portfolio', 'Simple stock investing'],
  cons: ['Limited advanced charting', 'Costs vary by asset', 'No specialist desktop terminal'],
  bestFor: 'Beginners and copy-trading learners',
  pricing: 'Costs vary by asset and account activity',
  publishDate: '2026-01-22',
  modifiedDate: '2026-07-15',
  author: 'SmartFinPro Trading Team',
  faqs: [],
  sections: [],
  testimonials: [],
  competitors: [],
  content: '',
};

describe('getDecisionFirstModel', () => {
  it('prefers explicit editorial decision copy', () => {
    const model = getDecisionFirstModel({
      ...baseReview,
      decisionSummary: 'Choose eToro for guided copy-trading discovery, not pro-grade execution.',
      chooseIf: ['You want to study traders before allocating money.'],
      skipIf: ['You need professional order controls.'],
      primaryCtaLabel: 'Try eToro Demo',
    });

    expect(model.heading).toBe('Is eToro right for you?');
    expect(model.summary).toContain('not pro-grade execution');
    expect(model.chooseIf).toHaveLength(1);
    expect(model.skipIf).toHaveLength(1);
    expect(model.ctaLabel).toBe('Try eToro Demo');
  });

  it('falls back to description, pros, cons, and the standard CTA', () => {
    const model = getDecisionFirstModel(baseReview);

    expect(model.summary).toBe('Default description');
    expect(model.chooseIf).toEqual(baseReview.pros.slice(0, 3));
    expect(model.skipIf).toEqual(baseReview.cons.slice(0, 3));
    expect(model.ctaLabel).toBe('Visit eToro');
  });
});
```

- [ ] **Step 2: Run the test and confirm the model is missing**

Run: `npx vitest run __tests__/unit/decision-first-review.test.ts`

Expected: FAIL because `@/lib/reviews/decision-first` does not exist.

- [ ] **Step 3: Implement the pure decision model**

Create `lib/reviews/decision-first.ts`:

```ts
import type { ReviewData } from '@/types';

export interface DecisionFirstModel {
  heading: string;
  summary: string;
  chooseIf: string[];
  skipIf: string[];
  ctaLabel: string;
}

export function getDecisionFirstModel(review: ReviewData): DecisionFirstModel {
  return {
    heading: `Is ${review.productName} right for you?`,
    summary: review.decisionSummary || review.description,
    chooseIf: review.chooseIf?.slice(0, 3) || review.pros.slice(0, 3),
    skipIf: review.skipIf?.slice(0, 3) || review.cons.slice(0, 3),
    ctaLabel: review.primaryCtaLabel || `Visit ${review.productName}`,
  };
}
```

- [ ] **Step 4: Implement the verdict component**

Create `components/marketing/decision-first-verdict.tsx` with the complete server component below:

```tsx
import { ArrowRight, CheckCircle, Star, XCircle } from 'lucide-react';
import { TrackedAffiliateLink } from '@/components/marketing/tracked-affiliate-link';
import { getDecisionFirstModel } from '@/lib/reviews/decision-first';
import type { Category, Market } from '@/lib/i18n/config';
import type { ReviewData } from '@/types';

interface DecisionFirstVerdictProps {
  review: ReviewData;
  market: Market;
  category: Category;
}

export function DecisionFirstVerdict({
  review,
  market,
  category,
}: DecisionFirstVerdictProps) {
  const model = getDecisionFirstModel(review);
  const hasAffiliate = review.affiliateUrl && review.affiliateUrl !== '#';

  return (
    <section
      id="overview"
      data-testid="decision-first-verdict"
      className="mb-8 rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:p-8"
      aria-labelledby="decision-first-heading"
    >
      <p className="mb-2 text-xs font-bold uppercase" style={{ color: 'var(--sfp-navy)', letterSpacing: 0 }}>
        60-second decision
      </p>
      <h2 id="decision-first-heading" className="mb-3 text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
        {model.heading}
      </h2>
      <p className="mb-6 max-w-3xl leading-7" style={{ color: 'var(--sfp-slate)' }}>
        {model.summary}
      </p>

      <div className="mb-6 grid gap-6 border-y border-gray-100 py-6 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--sfp-green)' }}>
            Choose {review.productName} if...
          </h3>
          <ul className="space-y-3">
            {model.chooseIf.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-6" style={{ color: 'var(--sfp-ink)' }}>
                <CheckCircle className="mt-1 h-4 w-4 shrink-0" style={{ color: 'var(--sfp-green)' }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--sfp-red)' }}>
            Skip {review.productName} if...
          </h3>
          <ul className="space-y-3">
            {model.skipIf.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-6" style={{ color: 'var(--sfp-ink)' }}>
                <XCircle className="mt-1 h-4 w-4 shrink-0" style={{ color: 'var(--sfp-red)' }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          SmartFinPro rating {review.rating}/5
        </div>
        {hasAffiliate && (
          <div className="sm:text-right">
            <TrackedAffiliateLink
              href={review.affiliateUrl}
              eventLabel={model.ctaLabel}
              market={market}
              category={category}
              pageType="review"
              layoutVariant="decision_first"
              placement="decision_verdict"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold no-underline hover:no-underline hover:brightness-110"
              style={{ background: 'var(--sfp-green)', color: '#ffffff', textDecoration: 'none' }}
            >
              {model.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </TrackedAffiliateLink>
            <p className="mt-2 text-xs" style={{ color: 'var(--sfp-slate)' }}>
              Affiliate link. Investing involves risk, including loss of principal.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run focused tests and type-check**

Run: `npx vitest run __tests__/unit/decision-first-review.test.ts`

Expected: 4 tests PASS.

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 6: Commit the reusable component**

```bash
git add __tests__/unit/decision-first-review.test.ts lib/reviews/decision-first.ts components/marketing/decision-first-verdict.tsx
git commit -m "Build decision-first review verdict"
```

### Task 3: Integrate The Opt-In Flow Without Changing Legacy Reviews

**Files:**
- Modify: `components/marketing/report-layout.tsx`

**Interfaces:**
- Consumes: `ReviewData.decisionFirst` and `<DecisionFirstVerdict>` from Task 2.
- Produces: `data-review-flow="decision-first|standard"` and a secondary collapsed tool panel for opted-in reviews.

- [ ] **Step 1: Add the decision-first component and CTA label override**

Import the component:

```ts
import { DecisionFirstVerdict } from '@/components/marketing/decision-first-verdict';
```

Change the CTA label calculation to preserve the debt-relief special case and otherwise honor frontmatter:

```ts
  const primaryCtaLabel =
    category === 'debt-relief'
      ? 'Get Free Debt Analysis'
      : review.primaryCtaLabel || `Visit ${review.productName}`;
```

Add the flow marker to the article root:

```tsx
<article
  className="min-h-screen"
  data-review-flow={review.decisionFirst ? 'decision-first' : 'standard'}
  style={{ background: 'var(--sfp-gray)' }}
>
```

Stop the legacy title suffix from duplicating `Review 2026` on decision-first pages:

```tsx
{review.title}{isGuide || review.decisionFirst ? '' : ` — Expert Review & Analysis Report ${year}`}
```

- [ ] **Step 2: Keep the existing Quick Verdict for legacy reviews only**

Change its guard from:

```tsx
{hasProscons && (
```

to:

```tsx
{hasProscons && !review.decisionFirst && (
```

Immediately after that block, render:

```tsx
{review.decisionFirst && (
  <DecisionFirstVerdict review={review} market={market} category={category} />
)}
```

This keeps all non-opted-in pages byte-for-byte on the current component path.

- [ ] **Step 3: Collapse navigation and personalization for decision-first pages**

Change Quick Navigation's `details` opening behavior to:

```tsx
<details
  id="quick-navigation"
  className="rounded-2xl border border-[#E2E8F0] bg-white p-5 mb-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] group"
  open={!review.decisionFirst}
>
```

Before the JSX return, resolve the quiz topic once:

```ts
  const decisionQuizTopic =
    (miniQuiz?.topic as QuizTopic | undefined) || CATEGORY_TO_TOPIC[category];
```

After Quick Navigation and before MDX content, add a decision-first-only collapsed panel:

```tsx
{review.decisionFirst && decisionQuizTopic && (
  <details className="rounded-2xl border border-[#E2E8F0] bg-white p-5 mb-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] group">
    <summary className="font-bold text-lg cursor-pointer flex items-center justify-between" style={{ color: 'var(--sfp-ink)' }}>
      <span className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
        Personalize this review
      </span>
      <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" style={{ color: 'var(--sfp-slate)' }} />
    </summary>
    <div className="mt-5 space-y-5 border-t border-gray-100 pt-5">
      <MiniQuiz
        topic={decisionQuizTopic}
        market={(miniQuiz?.market as Market) || market}
        title={miniQuiz?.title}
      />
      <XRayScore
        slug={slug || ''}
        market={market}
        category={category}
        productName={review.productName}
        pricing={review.pricing}
        rating={review.rating}
        affiliateUrl={review.affiliateUrl}
        ctaPartners={ctaPartners?.map((partner) => ({
          slug: partner.slug,
          partner_name: partner.partner_name,
        }))}
      />
    </div>
  </details>
)}
```

Do not remove the legacy in-card MiniQuiz or X-Ray block because standard reviews still use it.

- [ ] **Step 4: Type-check the integration**

Run: `npx tsc --noEmit`

Expected: exit 0; no `QuizTopic` or optional-field errors.

- [ ] **Step 5: Commit the opt-in layout**

```bash
git add components/marketing/report-layout.tsx
git commit -m "Integrate decision-first review flow"
```

### Task 4: Rewrite And Verify The eToro Review

**Files:**
- Modify: `content/us/trading/etoro-review.mdx`

**Interfaces:**
- Consumes: the opt-in frontmatter fields from Task 1 and the layout behavior from Task 3.
- Produces: the approved eToro pilot content and the reusable editorial pattern for later reviews.

- [ ] **Step 1: Capture and save the before metrics in the implementation notes**

Record this baseline before editing:

```text
Title length: 59
Description length: 149
Modified date: 2026-04-12
Data verified date: missing
Words: 5,771
H2/H3: 19/29
Internal/external links: 31/6
Tracked components/images: 11/0
Estimated AGENTS.md quality score: 93
```

- [ ] **Step 2: Verify every time-sensitive product claim against primary sources**

Use current official sources only for fees, account availability, virtual portfolio, regulation, and investor protection. At minimum inspect:

```text
https://www.etoro.com/en-us/trading/fees/
https://www.etoro.com/customer-service/help/
https://brokercheck.finra.org/
https://www.sipc.org/list-of-members
https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/executing-order
https://www.finra.org/investors/investing/investment-products/stocks/day-trading
```

Remove or qualify any value that cannot be supported for US customers on `2026-07-15`. In particular, do not retain the current hard claims about `50M+ users`, `80+ cryptocurrencies`, `$5 withdrawal fee`, forex availability/spreads, app-store review counts, copied-trader returns, or exact minimum deposits unless an official US source confirms them. Do not present back-tested or observed copy-trader returns as expected outcomes.

- [ ] **Step 3: Replace the frontmatter with decision-first metadata**

Use these exact SEO and presentation fields:

```yaml
title: 'eToro Review 2026: Copy Trading, Fees & Verdict'
description: 'We tested eToro for 90 days. See how copy trading, fees, safety, and the demo account compare, plus who should choose or skip the platform in 2026.'
modifiedDate: '2026-07-15'
dataVerifiedDate: '2026-07-15'
decisionFirst: true
decisionSummary: >-
  eToro is most compelling for beginners who want to explore copy trading and
  practice with virtual funds. Active traders who prioritize specialist tools,
  tight execution costs, or advanced order controls should compare alternatives.
chooseIf:
  - You want to study and copy other investors from one beginner-friendly platform
  - You want to practice with virtual funds before depositing real money
  - You mainly value guided discovery over professional trading controls
skipIf:
  - You trade frequently enough for spreads and non-trading fees to compound
  - You need advanced charting, order types, automation, or direct market tools
  - You prefer a traditional broker with broad retirement and support services
primaryCtaLabel: 'Try eToro Demo'
```

Rewrite `pros`, `cons`, `bestFor`, `pricing`, `guarantee`, and every FAQ answer so they match the verified US product facts. Remove the hardcoded `reviewCount: 24567` unless it represents a documented SmartFinPro methodology; use `reviewCount: 0` when no defensible aggregate count exists.

- [ ] **Step 4: Replace the section map with a shorter buyer journey**

Use this exact `sections` order:

```yaml
sections:
  - id: is-etoro-right-for-you
    title: Is eToro Right for You?
  - id: how-we-tested-etoro
    title: How We Tested eToro
  - id: copy-trading
    title: Copy Trading
  - id: fees-and-value
    title: Fees and Value
  - id: platform-experience
    title: Platform Experience
  - id: safety-and-regulation
    title: Safety and Regulation
  - id: who-should-use-etoro
    title: Who Should Use eToro?
  - id: alternatives
    title: Alternatives
  - id: verdict
    title: Verdict
  - id: faq
    title: Frequently Asked Questions
  - id: sources
    title: Sources and Review Standards
```

Add `<span id="..."></span>` immediately before every matching H2. Do not rely on generated heading slugs because `check-comparison-quality.mjs` requires literal anchors in strict mode.

- [ ] **Step 5: Rewrite the opening as human editorial prose**

The first MDX section must start exactly with:

```mdx
<span id="is-etoro-right-for-you"></span>

## Is eToro Right for You?

eToro makes the most sense when the way you want to learn matters as much as the assets you want to buy. Its defining feature is not simply stock or crypto access; it is the ability to inspect other investors, understand how they position a portfolio, and choose whether to copy them. That can shorten the learning curve for a beginner, but it does not remove investment risk or the need to judge the person being copied.

Our view is straightforward: choose eToro if you want a guided, social way to explore investing and you will use the virtual portfolio before committing money. Skip it if your priority is professional charting, specialist execution, retirement planning, or the lowest possible cost on frequent trades. The right comparison is therefore not “Is eToro good?” but “Does eToro's learning model fit the way I plan to invest?”

<ExecutiveSummary title="The Decision in 60 Seconds">

- **Best fit:** A newer investor who wants to research copy trading and practice first.
- **Main advantage:** Trader discovery, portfolio visibility, and execution live in one workflow.
- **Main trade-off:** Simplicity comes before specialist trading controls and full-service brokerage depth.
- **First step:** Use virtual funds to test the interface and copying behavior before considering a deposit.

</ExecutiveSummary>

<AffiliateDisclosure market="us" position="top" />
```

Follow it with one concrete scenario paragraph for a beginner with `$100-$500`, one scenario for an active trader, and a link to `/integrity` explaining SmartFinPro's editorial standards. Never call live investing or copy trading “risk-free.”

- [ ] **Step 6: Rebuild the evidence, fee, and scenario sections**

Keep the strongest existing hands-on observations, but apply these exact editorial rules:

- `How We Tested eToro`: state test dates, device/platform, tasks performed, whether real money was used, and the `2026-07-15` source-verification date. Remove unverifiable staff biography or license claims.
- `Copy Trading`: explain selection, allocation, monitoring, stop-copy behavior, and concentration risk in prose before any component or table. Replace historical-return promotion with a neutral checklist for evaluating track record, drawdown, portfolio concentration, and communication.
- `Fees and Value`: use one verified fee table and two reader examples: a low-frequency stock investor and a frequent multi-asset trader. Clearly label illustrative calculations and link directly to eToro's official US fee page.
- `Platform Experience`: retain web, mobile, and virtual-portfolio observations, but merge repetitive feature lists into flowing paragraphs.
- `Safety and Regulation`: distinguish broker registration, SIPC membership, and market-risk protection. State explicitly that SIPC does not protect against investment losses.
- `Who Should Use eToro?`: use four short scenarios: beginner learner, copy-trading researcher, active/cost-sensitive trader, and advanced/full-service investor.
- `Alternatives`: compare eToro only with live internal pages that exist in the repository; use concise choice rules rather than a feature dump.
- `Verdict`: give one clear recommendation, one clear skip condition, and a specific demo CTA after the argument.

Keep at least six tracked components. Use the following verified set; `EvidenceCarousel` is conditional on real evidence assets existing:

```mdx
<ExecutiveSummary>
<ExpertBox>
<TrustAuthority>
<Info>
<Warning>
<AffiliateButton>
<AutoDisclaimer />
```

Use `<AffiliateButton href="/go/etoro" productName="eToro">Try eToro Demo</AffiliateButton>` for the in-article verdict CTA. If the five evidence image files referenced by the current `EvidenceCarousel` are still absent, replace the carousel with only real assets that exist under `public/images/` or remove the carousel and unsupported screenshot claims. Do not ship broken evidence paths.

- [ ] **Step 7: Finish with primary sources and strict-gate elements**

The final source section must contain at least six direct authority links, including the current official eToro fee/help pages, FINRA BrokerCheck, SIPC member information, Investor.gov, and FINRA investor education. Include at least eight natural internal links across the review, including `/trading/etoro-vs-robinhood/`, `/trading/robinhood-review/`, `/trading/fidelity-review/`, `/trading/charles-schwab-review/`, `/trading/interactive-brokers-review/`, `/trading/webull-review/`, `/trading/best-brokerage-accounts-for-online-investing/`, and `/integrity` only after confirming those routes resolve.

The body must include:

```mdx
<Warning>
Copy trading and investing can result in loss of principal. Another investor's past performance does not predict future results, and SIPC protection does not cover market losses. Review current fees, eligibility, and product availability on eToro's official US site before opening or funding an account.
</Warning>

<AutoDisclaimer />
```

- [ ] **Step 8: Run the content gates before committing**

Run:

```bash
bash scripts/check-mdx-syntax.sh
node scripts/check-frontmatter.mjs
node scripts/check-prose-first.mjs
node scripts/check-comparison-quality.mjs --verbose
node scripts/check-seo-quality.mjs --report
```

Expected: the eToro file has no MDX, frontmatter, prose-first, strict-tier, or SEO regression errors. Existing unrelated legacy warnings may remain but must be reported separately.

- [ ] **Step 9: Commit the editorial pilot**

```bash
git add content/us/trading/etoro-review.mdx
git commit -m "Rewrite eToro review for buyer decisions"
```

### Task 5: Run The Full Review Quality Gate And Visual Smoke Test

**Files:**
- Verify only; change a scoped file only if a failure is caused by this implementation.

**Interfaces:**
- Consumes: Tasks 1-4.
- Produces: passing build, local page evidence, and the final before/after report.

- [ ] **Step 1: Run focused and repository verification**

Run:

```bash
npx vitest run __tests__/unit/decision-first-review.test.ts
npx tsc --noEmit
npx vitest run
npx next build
```

Expected: all commands exit 0. If the full Vitest suite or build fails in an unrelated pre-existing area, rerun the focused command, capture the exact unrelated failure, and do not modify unrelated files.

- [ ] **Step 2: Start the local app on an unused port**

Run: `PORT=3004 npm run dev`

Expected: Next.js reports a ready URL at `http://localhost:3004` and the process remains running for smoke testing.

- [ ] **Step 3: Verify the rendered eToro route**

Open `http://localhost:3004/us/trading/etoro-review` with Playwright or the in-app browser and verify:

```text
HTTP status is 200.
Exactly one h1 is present.
[data-review-flow="decision-first"] is present.
[data-testid="decision-first-verdict"] appears before .mdx-content-wrapper.
The heading “Is eToro right for you?” is visible without opening a disclosure.
Quick Navigation and Personalize this review are collapsed initially.
The CTA label is “Try eToro Demo”.
No content overlaps at 1280x720 or 390x844.
No missing image request, console error, or page error is introduced.
FAQ JSON-LD, Review JSON-LD, canonical, and hreflang remain present.
```

- [ ] **Step 4: Confirm a legacy review remains on the standard flow**

Open one unchanged review such as `/us/trading/robinhood-review` and verify:

```text
[data-review-flow="standard"] is present.
The existing Quick Verdict, MiniQuiz, and X-Ray placement remains visible.
The page has exactly one h1 and no new console errors.
```

- [ ] **Step 5: Calculate the after metrics with the AGENTS.md formula**

Report title length, description length, dates, words, H2/H3, internal links, external links, tracked component count, Markdown image count, and final quality score. Required result:

```text
Title: 45-60 characters
Description: 140-160 characters
Dates: 2026-07-15 / 2026-07-15
Words: 2,600-3,600 unless verified coverage needs a documented exception
Internal links: at least 8
External authority links: at least 6
Tracked components: at least 6
Quality score: at least 90
```

- [ ] **Step 6: Inspect the final diff and repository status**

Run:

```bash
git diff --check
git status --short
git log -5 --oneline
```

Expected: no whitespace errors; only the planned files are in the implementation commits; all pre-existing unrelated modifications and untracked files remain untouched.

- [ ] **Step 7: Deliver the completion report**

Provide a concise German report containing:

- changed files and what the new pattern does;
- before/after metric table;
- exact verification commands and outcomes;
- any current product claims intentionally removed because they could not be verified;
- implementation commit hashes.

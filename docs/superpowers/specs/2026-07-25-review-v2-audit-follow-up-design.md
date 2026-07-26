# Review V2 Audit Follow-up — Design

**Date:** 2026-07-25

**Scope:** shared Review V2 components, verified on `/us/trading/etoro-review`

**Branch:** `design/review-v2-premium`

## Context

The original Review V2 audit fixes are already present as an uncommitted
working-tree change: landmark and anchor correction, alternatives/final-decision
deduplication, verdict reordering, the 1024 px grid fix, and a two-row layout
that bounds the sticky rail.

A browser review of that state found six remaining presentation defects:

1. On a 390 × 844 viewport the first actionable CTA appears about four screens
   down because the complete desktop sidebar is repeated after the verdict and
   score distribution.
2. That mobile sidebar repeats the field ranking immediately after
   `ScoreInField`, so it adds length without adding a new decision signal.
3. Essential Facts occupy a long always-open block before the section
   navigation on narrow screens.
4. MDX-owned H2 headings render at 16 px while article copy renders at 18 px.
5. The desktop rail leaves its last 124 px visible when Alternatives reaches
   the sticky-nav offset.
6. The global footer overflows by 6 px at 320 px, and the sidebar reports the
   publication month instead of the more useful verification date.

## Goals

- Put the first Compare/Visit action within 2 mobile viewport heights.
- Remove the duplicated mobile Market Check while preserving the audited
  `ScoreInField` visualization.
- Shorten the mobile opening without deleting any facts.
- Establish an unmistakable H2/body hierarchy in the V2 MDX article only.
- Reach zero horizontal document overflow from 320 px upward.
- Ensure the desktop rail is fully gone before the closing CTA zones.
- Show the latest available data-verification date in the desktop report card.
- Preserve desktop information architecture, affiliate disclosure, tracking,
  null-degradation, schema, anchors, and all MDX/frontmatter content.

## Options considered

### A. Compact mobile action surface inside the verdict card — selected

Render Compare/Visit plus the required disclosure directly after
`BestForNotFor`, suppress the full mobile `ReviewSidebar`, and make Essential
Facts progressive disclosure on mobile while retaining the current desktop
rail presentation.

This is the smallest change that fixes CTA latency and duplicate ranking at
their source. It preserves all copy and the desktop layout.

### B. Move the complete mobile sidebar above `ScoreInField`

This moves the CTA earlier than today but still places it after the 2,000+ px
verdict card, and it retains the duplicated Market Check and large provider
card. It does not meet the two-viewport target.

### C. Shorten or remove verdict/frontmatter copy

This could reduce height, but it changes editorial content, triggers the Review
Quality Gate, and weakens the evidence presented to readers. The layout can
solve the problem without touching content.

## Selected component design

### Shared CTA buttons

Add `ReviewActionButtons`, a server component that owns the existing Compare
and tracked Visit button pair. Both the desktop sidebar and the new mobile
surface use it, preventing tracking/style drift.

### Mobile actions

Add `ReviewMobileActions`, a server component containing:

- `ReviewActionButtons`;
- the existing minimal affiliate disclosure when a Visit URL exists;
- the existing leverage warning when `hasLeverageRisk` is true, otherwise the
  current general investment-risk line.

`ReviewLayoutV2` builds this node only when a decision bridge is available and
passes it into a new `mobileActions` slot on `VerdictCard`. The slot renders
immediately after `BestForNotFor` and is hidden from `lg` upward. If a malformed
review has a decision bridge but no verdict block, the same mobile action
surface renders as an in-flow fallback so null-degradation does not remove the
page's primary action.

The old mobile `ReviewSidebar` render is removed. The desktop sidebar remains.

### Essential Facts

Desktop keeps the existing Essential Facts rail under the score. On viewports
below `md`, the same facts are available in a native collapsed `details`
control labelled “Essential facts”. This preserves every fact and source while
removing the block's default height from the opening.

### Type hierarchy

Add a rule scoped to `.review-v2-prose h2`:

- 24 px Georgia/secondary font on desktop;
- 22 px on narrow screens;
- 600 weight, compact line height;
- additional top margin and a controlled bottom margin.

No shared MDX component or V1 page changes.

### Rail boundary, freshness, and reflow

- Reserve the 124 px sticky-chrome offset as bottom margin on the desktop rail
  grid item, shortening the sticky containing block before row 2.
- Replace `publishDate` in `ReviewSidebar` with the latest available
  `dataVerifiedDate`, then `modifiedDate`, then `publishDate`; render the label
  as “Data verified” with an exact deterministic date.
- Allow the footer's logo/social group to wrap and reduce narrow-screen
  horizontal padding, while retaining the current spacing from `sm` upward.

## Accessibility and compliance

- DOM order matches the visual/mobile reading order: score, audience fit,
  actions, limitation, summary, optional facts, field position, navigation.
- Native `details` provides keyboard-operable progressive disclosure.
- Affiliate disclosure stays directly adjacent to the mobile affiliate CTA.
- Focus styles and tracked-link behavior continue to come from the shared
  button primitives.
- No content, schema, canonical, hreflang, or review metadata changes.

## Verification

- Unit tests first for ordering, one mobile Market Check removal, shared CTA
  behavior, verified-date rendering, collapsed facts markup, H2 scope, rail
  boundary, and footer wrapping.
- Relevant Vitest suite, `npx tsc --noEmit`, repository checks, lint, and
  production build.
- Browser measurements at 320, 390, 768, 1024, 1280, and 1440 px:
  document reflow, first CTA position, section-nav position, H2 computed style,
  visible CTA density, `#verdict`, and sticky-rail exit.
- Smoke a second Review V2 page and a review without a cockpit position.

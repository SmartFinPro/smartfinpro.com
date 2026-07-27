# Unified Research Discovery PR 5 Funnel Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove every Research and Finder event on the wire, provide reproducible production smoke queries, and generate the required two-week funnel evaluation from observed analytics rows.

**Architecture:** Playwright intercepts the real `/api/track` payloads for deterministic contract proof. A pure aggregation module computes session- and event-scoped metrics from `page_views` and `analytics_events`; a paginated Supabase script fetches a bounded measurement window and writes a complete Markdown report. SQL remains a human-readable production smoke companion.

**Tech Stack:** Playwright · Vitest · TypeScript · Supabase JavaScript client · PostgreSQL SQL · existing `page_views` and `analytics_events`

## Global Constraints

- PR 4 must be deployed before the production measurement window begins.
- No schema migration or analytics provider is introduced.
- `research_v1` remains the schema string.
- Raw search strings, prices, and new user identifiers remain forbidden.
- Production queries are read-only.
- Finder and hub metrics are separated by `properties.surface`.
- Research handoff reporting groups by both market and topic.
- Session metrics deduplicate by `session_id`.
- Zero-result rate is event-scoped.
- The two-week report is generated from observed rows; no hand-entered metric values.
- PR 5 is not complete until the 14-day measurement window has ended and the generated report is committed.

---

### Task 1: Complete wire-payload browser coverage

**Files:**

- Create: `e2e/research-funnel-tracking.spec.ts`
- Modify: `e2e/research-tracking.spec.ts`

**Interfaces:**

- Consumes: the live Finder and hub UI plus `/api/track`.
- Produces: one browser assertion for every event name and every optional routing dimension.

- [ ] **Step 1: Add a shared batch collector**

```ts
interface ResearchWireEvent {
  eventName: string;
  properties: Record<string, unknown>;
}

async function collectResearchEvents(page: Page): Promise<ResearchWireEvent[]> {
  const events: ResearchWireEvent[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "sendBeacon", {
      value: () => false,
      configurable: true,
    });
  });
  await page.route("**/api/track", async (route) => {
    const body = route.request().postDataJSON();
    if (body?.type === "research_event_batch") {
      events.push(...(body.data?.events ?? []));
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"success":true}',
    });
  });
  return events;
}

async function seedCookieConsent(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("cookie-consent", "essential");
  });
}
```

- [ ] **Step 2: Add the Finder funnel test**

With JavaScript enabled:

```ts
test("Finder emits search, review, dossier, and view-all dimensions", async ({
  page,
}) => {
  const events = await collectResearchEvents(page);
  await seedCookieConsent(page);
  await page.goto("/");
  await page
    .getByRole("searchbox", { name: /search research/i })
    .fill("schwab");
  await expect
    .poll(() => events.some((event) => event.eventName === "research_search"))
    .toBe(true);

  const search = events.find((event) => event.eventName === "research_search");
  expect(search?.properties).toMatchObject({
    schemaVersion: "research_v1",
    market: "us",
    topic: "hub",
    surface: "finder",
    queryLength: 6,
  });
  expect(JSON.stringify(events).toLowerCase()).not.toContain("schwab");
});
```

Continue the same test with separate navigation-safe page visits to assert:

- `research_review_click` with `surface: 'finder'`, `kind: 'review'`, category, and actual topic when available;
- `research_finder_cta` with `trigger: 'dossier_item'`, `kind: 'dossier'`, category, and actual topic;
- `research_finder_cta` with `trigger: 'view_all'`.

- [ ] **Step 3: Add the hub funnel test**

Exercise and assert:

- `research_search`
- `research_filter_change` for category, status, topic, and spec
- `research_evidence_open`
- `research_review_click`
- `research_shortlist_change` add, remove, and clear
- `research_cockpit_handoff`

Global search/filter events use `topic: 'hub'`. Item events use the selected projection's topic/category. Handoff and review navigation produce exactly one immediate event each.

- [ ] **Step 4: Run the focused tracking suite**

```bash
BASE_URL=http://127.0.0.1:3012 npx playwright test \
  e2e/research-funnel-tracking.spec.ts \
  e2e/research-tracking.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the wire proof**

```bash
git add e2e/research-funnel-tracking.spec.ts e2e/research-tracking.spec.ts
git commit -m "test(research): prove complete funnel payloads"
```

### Task 2: Pure funnel aggregation

**Files:**

- Create: `lib/analytics/research-funnel-report.ts`
- Create: `__tests__/unit/research-funnel-report.test.ts`

**Interfaces:**

- Consumes: normalized page-view and Research event rows.
- Produces: `ResearchFunnelReport`, `aggregateResearchFunnel()`, `renderResearchFunnelMarkdown()`, and zero-denominator-safe rates.

- [ ] **Step 1: Write failing aggregation tests**

Use a fixture with:

- two US homepage sessions;
- one UK homepage session;
- two US Research sessions;
- one Finder search session;
- one Finder view-all session;
- one Finder review-click session;
- one hub review-click session;
- two Cockpit handoffs in different topics;
- two searches, one with zero results.

Assert:

```ts
const from = "2026-07-28T00:00:00Z";
const to = "2026-08-11T00:00:00Z";
const pageViews: FunnelPageView[] = [
  { sessionId: "home-us-1", pagePath: "/", viewedAt: from },
  { sessionId: "home-us-2", pagePath: "/", viewedAt: from },
  { sessionId: "home-uk-1", pagePath: "/uk", viewedAt: from },
  { sessionId: "research-us-1", pagePath: "/research", viewedAt: from },
  { sessionId: "research-us-2", pagePath: "/research", viewedAt: from },
];
const event = (
  sessionId: string,
  eventName: string,
  properties: FunnelResearchEvent["properties"],
): FunnelResearchEvent => ({
  sessionId,
  eventName,
  occurredAt: from,
  properties,
});
const events: FunnelResearchEvent[] = [
  event("home-us-1", "research_search", {
    market: "us",
    topic: "hub",
    surface: "finder",
    resultCount: 2,
  }),
  event("home-us-1", "research_finder_cta", {
    market: "us",
    topic: "hub",
    surface: "finder",
    trigger: "view_all",
  }),
  event("home-us-2", "research_review_click", {
    market: "us",
    topic: "trading-platforms",
    surface: "finder",
  }),
  event("research-us-1", "research_review_click", {
    market: "us",
    topic: "trading-platforms",
    surface: "hub",
  }),
  event("research-us-1", "research_cockpit_handoff", {
    market: "us",
    topic: "trading-platforms",
    surface: "hub",
  }),
  event("research-us-2", "research_cockpit_handoff", {
    market: "us",
    topic: "robo-advisors",
    surface: "hub",
  }),
  event("research-us-1", "research_search", {
    market: "us",
    topic: "hub",
    surface: "hub",
    resultCount: 0,
  }),
  event("research-us-2", "research_search", {
    market: "us",
    topic: "hub",
    surface: "hub",
    resultCount: 3,
  }),
];
const report = aggregateResearchFunnel({ from, to, pageViews, events });

expect(report.byMarket.us.finderEngagementRate).toBe(0.5);
expect(report.byMarket.us.finderToResearchCtr).toBe(0.5);
expect(report.byMarket.us.finderToReviewCtr).toBe(0.5);
expect(report.byMarket.us.researchToReviewCtr).toBe(0.5);
expect(report.byMarket.us.hubZeroResultRate).toBe(0.5);
expect(report.handoffByMarketTopic).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ market: "us", topic: "trading-platforms" }),
    expect.objectContaining({ market: "us", topic: "robo-advisors" }),
  ]),
);
```

Also assert every rate is `null`, not `NaN` or `Infinity`, when its denominator is zero.

- [ ] **Step 2: Run and confirm the aggregation module is missing**

```bash
npx vitest run __tests__/unit/research-funnel-report.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Define normalized input and output contracts**

```ts
export interface FunnelPageView {
  sessionId: string;
  pagePath: string;
  viewedAt: string;
}

export interface FunnelResearchEvent {
  sessionId: string;
  eventName: string;
  occurredAt: string;
  properties: {
    market?: string;
    topic?: string;
    surface?: "hub" | "finder";
    trigger?: "view_all" | "dossier_item";
    resultCount?: number;
    action?: "add" | "remove" | "clear";
  };
}

export interface MarketFunnelMetrics {
  homepageSessions: number;
  researchSessions: number;
  finderEngagementRate: number | null;
  finderToResearchCtr: number | null;
  finderToReviewCtr: number | null;
  researchToReviewCtr: number | null;
  hubZeroResultRate: number | null;
}

export interface ResearchFunnelReport {
  from: string;
  to: string;
  byMarket: Record<"us" | "uk" | "ca" | "au", MarketFunnelMetrics>;
  handoffByMarketTopic: Array<{
    market: string;
    topic: string;
    sessions: number;
    researchSessions: number;
    rate: number | null;
  }>;
  eventVolume: Array<{
    eventName: string;
    market: string;
    surface: string;
    rows: number;
  }>;
}

export function aggregateResearchFunnel(input: {
  from: string;
  to: string;
  pageViews: readonly FunnelPageView[];
  events: readonly FunnelResearchEvent[];
}): ResearchFunnelReport;

export function renderResearchFunnelMarkdown(
  report: ResearchFunnelReport,
): string;
```

- [ ] **Step 4: Implement exact denominators**

Market from page path:

```ts
export function marketFromPath(path: string): "us" | "uk" | "ca" | "au" | null {
  if (path === "/" || path === "/research") return "us";
  const match = path.match(/^\/(uk|ca|au)(?:\/research)?\/?$/);
  return match ? (match[1] as "uk" | "ca" | "au") : null;
}
```

Homepage paths are `/`, `/uk`, `/ca`, `/au`. Research paths are `/research`, `/uk/research`, `/ca/research`, `/au/research`.

Rates:

```ts
const rate = (numerator: number, denominator: number): number | null =>
  denominator === 0 ? null : numerator / denominator;
```

- Finder engagement: distinct homepage sessions with `research_search` or `research_filter_change` and `surface='finder'` divided by homepage sessions.
- Finder → Research: distinct homepage sessions with `research_finder_cta`, `surface='finder'`, `trigger='view_all'` divided by homepage sessions.
- Finder → Review: distinct homepage sessions with `research_review_click`, `surface='finder'` divided by homepage sessions.
- Research → Review: distinct Research sessions with `research_review_click`, `surface='hub'` divided by Research sessions.
- Hub zero results: hub `research_search` events whose `resultCount` is zero divided by all hub `research_search` events.
- Handoff market/topic: distinct hub handoff sessions for the market/topic divided by Research sessions for that market.

- [ ] **Step 5: Render deterministic Markdown**

`renderResearchFunnelMarkdown(report)` must include:

- ISO window start/end;
- one four-market table;
- one market/topic handoff table;
- one event-volume table;
- explicit `n/a` for null rates;
- numerator and denominator beside every percentage;
- a note that rates are session-scoped except zero-result rate.

- [ ] **Step 6: Run aggregation tests**

```bash
npx vitest run __tests__/unit/research-funnel-report.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the aggregation core**

```bash
git add lib/analytics/research-funnel-report.ts __tests__/unit/research-funnel-report.test.ts
git commit -m "feat(research): add funnel report aggregation"
```

### Task 3: Read-only Supabase report generator and SQL smoke

**Files:**

- Create: `scripts/research/report-research-funnel.mts`
- Create: `scripts/sql/research-funnel-smoke.sql`
- Modify: `docs/research-library/analytics-research-v1.md`

**Interfaces:**

- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and a generated measurement-window JSON file.
- Produces: a generated Markdown report and a human-readable 24-hour smoke query.

- [ ] **Step 1: Implement strict CLI argument parsing**

The script exposes two commands:

```text
start-window --out audits/reports/research-measurement-window.json
report --window-file audits/reports/research-measurement-window.json --out-dir audits/reports
```

`start-window` records current UTC time as `from` and exactly 14 days later as
`to`. `report` derives
`research-funnel-YYYY-MM-DD-to-YYYY-MM-DD.md` from those timestamps. Reject
missing/invalid commands, non-increasing timestamps, a report run before `to`,
and any output path outside `audits/reports/`.

- [ ] **Step 2: Implement bounded pagination**

Use `@supabase/supabase-js` with:

```ts
const PAGE_SIZE = 1000;
const HARD_CAP = 100_000;
```

Fetch `page_views` columns:

```text
id,session_id,page_path,viewed_at
```

bounded by `viewed_at >= from` and `< to`, with page paths restricted to the eight homepage/Research paths.

Fetch `analytics_events` columns:

```text
id,session_id,event_name,occurred_at,properties
```

bounded by `occurred_at >= from`, `< to`, and `event_category = research`.

Order by timestamp and ID for deterministic pages. Stop and exit non-zero if either query reaches `HARD_CAP`.

- [ ] **Step 3: Generate the report atomically**

Call `aggregateResearchFunnel()` and `renderResearchFunnelMarkdown()`. Write to a temporary file in the destination directory and rename it to `--out` only after all queries and rendering succeed.

Log only row counts, window, and output path; never log service keys or complete analytics rows.

- [ ] **Step 4: Add the exact 24-hour SQL smoke query**

`scripts/sql/research-funnel-smoke.sql`:

```sql
select
  event_name,
  properties->>'market' as market,
  properties->>'surface' as surface,
  properties->>'trigger' as trigger,
  count(*) as rows,
  count(distinct session_id) as sessions,
  min(occurred_at) as first_seen,
  max(occurred_at) as last_seen
from analytics_events
where event_category = 'research'
  and occurred_at >= now() - interval '24 hours'
group by 1, 2, 3, 4
order by 1, 2, 3, 4;

select
  properties->>'market' as market,
  properties->>'topic' as topic,
  count(distinct session_id) as handoff_sessions
from analytics_events
where event_name = 'research_cockpit_handoff'
  and occurred_at >= now() - interval '24 hours'
group by 1, 2
order by 1, 2;
```

- [ ] **Step 5: Document commands and metric definitions**

Document:

```bash
npx tsx --env-file=.env.local scripts/research/report-research-funnel.mts \
  start-window \
  --out audits/reports/research-measurement-window.json

npx tsx --env-file=.env.local scripts/research/report-research-funnel.mts \
  report \
  --window-file audits/reports/research-measurement-window.json \
  --out-dir audits/reports
```

The first command runs immediately after the PR 4 production deployment. The
second command succeeds only after its recorded 14-day window.

- [ ] **Step 6: Run type, unit, and import checks**

```bash
npx tsc --noEmit
npx vitest run __tests__/unit/research-funnel-report.test.ts
npm run check:imports
```

Expected: PASS.

- [ ] **Step 7: Commit generator and runbook**

```bash
git add scripts/research/report-research-funnel.mts scripts/sql/research-funnel-smoke.sql docs/research-library/analytics-research-v1.md
git commit -m "feat(research): add funnel measurement runbook"
```

### Task 4: Production 24-hour smoke gate

**Files:**

- Create through `start-window`: `audits/reports/research-measurement-window.json`
- Create after the query: `audits/reports/research-funnel-smoke-24h.md`

**Interfaces:**

- Consumes: deployed PR 4 analytics rows.
- Produces: observed 24-hour event coverage and a release decision.

- [ ] **Step 1: Record the deployment timestamp**

Immediately after the production deployment, run:

```bash
npx tsx --env-file=.env.local scripts/research/report-research-funnel.mts \
  start-window \
  --out audits/reports/research-measurement-window.json
```

The JSON file contains exact `from` and `to` UTC timestamps. The smoke window
ends 24 hours after `from`.

- [ ] **Step 2: Run the read-only smoke SQL after the window closes**

Run `scripts/sql/research-funnel-smoke.sql` in the Supabase SQL editor or an approved read-only database session.

Expected rows:

- every event exercised by actual traffic appears with its correct market/surface;
- no row contains an unsupported surface or trigger;
- handoff rows include both market and topic.

An event with zero organic occurrences is not fabricated. With explicit user
approval, exercise one consented manual production journey for each missing
surface, rerun the query, and label those rows as manual smoke traffic in the
report. Without that approval, record the missing event honestly.

- [ ] **Step 3: Write observed smoke evidence**

Create `audits/reports/research-funnel-smoke-24h.md` with the literal query output, deployment timestamp, query timestamp, manual-smoke session marker if used, and pass/fail reasoning for each expected event.

- [ ] **Step 4: Commit the smoke evidence**

```bash
git add audits/reports/research-measurement-window.json audits/reports/research-funnel-smoke-24h.md
git commit -m "docs(research): record production funnel smoke"
```

### Task 5: Generate and commit the two-week evaluation

**Files:**

- Create through the generator: a date-derived `research-funnel-YYYY-MM-DD-to-YYYY-MM-DD.md` under `audits/reports/`
- Create: `audits/reports/research-discovery-pr5.md`

**Interfaces:**

- Consumes: the exact 14-day production window.
- Produces: final series metrics and PR 5 verification evidence.

- [ ] **Step 1: Run the generator after exactly 14 complete days**

```bash
npx tsx --env-file=.env.local scripts/research/report-research-funnel.mts \
  report \
  --window-file audits/reports/research-measurement-window.json \
  --out-dir audits/reports
```

Expected: the script exits 0 and prints the derived report path. Running before
the recorded `to` timestamp exits non-zero without writing a report.

- [ ] **Step 2: Inspect the generated report**

Verify:

- four market rows exist;
- every percentage includes numerator and denominator;
- null denominators render as `n/a`;
- handoffs group by market and topic;
- event volume groups by event name, market, and surface;
- the report contains no raw search string or user identifier.

- [ ] **Step 3: Run the final series gate**

```bash
npx tsc --noEmit
npx vitest run
npm run check:imports
npm run build
BASE_URL=http://127.0.0.1:3012 npx playwright test \
  e2e/research-funnel-tracking.spec.ts \
  e2e/research-tracking.spec.ts \
  e2e/homepage-quick-finder.spec.ts \
  e2e/research-topic-facets.spec.ts \
  e2e/research-hub-markets.spec.ts \
  e2e/research-raw-html.spec.ts \
  e2e/research-a11y.spec.ts
```

Expected: every command exits 0.

- [ ] **Step 4: Write the PR 5 verification report**

Create `audits/reports/research-discovery-pr5.md` with literal test totals, build route types, 24-hour smoke commit, generated 14-day report path, report row counts, and final commit hash.

- [ ] **Step 5: Commit the evaluation**

```bash
git add audits/reports/research-funnel-*.md audits/reports/research-discovery-pr5.md
git commit -m "docs(research): publish two-week funnel evaluation"
```

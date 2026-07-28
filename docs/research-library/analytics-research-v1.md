# research_v1 — Event contract & success metrics

Status: **contract frozen** (implement against this, don't drift). The schema
string (`research_v1`) and the original six event names are frozen; the
dimensions below and the 7th event name (`research_finder_cta`, PR 3 Task 1)
are ADDITIVE extensions (unified-research-discovery-pr2-hubs plan Task 6 /
research-discovery-pr3 plan Task 1, spec §12) — every future change here
still lands in the TypeScript builder (`lib/analytics/research-events.ts`)
and the strict Zod schema (`lib/validation/index.ts`) in the SAME commit as
this doc, never one without the other.
Scope: the Research Library discovery surface. Pilot: US trading platforms
(`/research`). Generalized (Task 6) to every market hub — `/research`,
`/uk/research`, `/ca/research`, `/au/research` — and every category/topic
each hub's catalog contains. Extended (PR 3 Task 1) to the Homepage Quick
Finder's own CTA event, ahead of the Finder surface itself shipping.

## Why this exists

The Research Library's whole hypothesis is that an evidence-first *discovery*
layer moves people into Review and Compare better than the conversion-oriented
Cockpit alone. Without measurement that hypothesis can't be proven or falsified,
and the first real user journeys are unrecoverable after the fact — so analytics
ships **before merge and before deploy**, not after.

## Infrastructure — reuse only, no new provider

| Concern | Reused |
|---|---|
| Transport | `sendBeacon` → `POST /api/track` with `{ type: 'research_event_batch', data: { events } }`, `fetch(keepalive)` fallback |
| Batching / debounce / dedup | `lib/analytics/event-queue.ts` (the generic primitives; `tool_v1` is the sibling consumer) |
| Session id | `getOrCreateAnalyticsSessionId()` (`lib/analytics/session.ts`) |
| Storage | existing `analytics_events` table — one insert per batch (same as `event_batch` / `tool_event_batch`) |
| Killswitch | `NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false'` (same flag as cockpit/tool); every entry point no-ops on SSR |
| Consent | whatever gates the existing trackers — research adds **no** new cookie, storage key or vendor |

`cockpit_v1` files stay **frozen and untouched**; `research_v1` is strictly additive.

## Privacy rules (binding)

- **Never send the raw search string.** Only its length (bucketed as a plain
  integer character count) and the result count.
- No product prices, no user identifiers beyond the existing anonymous session id.
- Slugs are our own editorial identifiers and are safe to send.

## Event contract

All events share: `sessionId`, `market`, `topic`, plus the properties below.

| Event | When | Properties |
|---|---|---|
| `research_search` | after the search debounce settles / the URL `q` is stable — **never per keystroke** | `queryLength` (int), `resultCount` (int), `surface` |
| `research_filter_change` | a filter chip is toggled | `facet` (`status`\|`confidence`\|`fresh`\|`category`\|`type`), `value` (string\|null), `active` (bool), `resultCount` (int), `surface` |
| `research_evidence_open` | a card's "View evidence" disclosure is opened (open only, not close) | `productSlug`, `status`, `dataPoints` (int), `kind`, `category` |
| `research_review_click` | a card's review link is followed | `productSlug`, `status`, `rank` (int\|null), `position` (1-based index in the rendered list), `kind`, `category` |
| `research_shortlist_change` | shortlist mutates | `action` (`add`\|`remove`\|`clear`), `productSlug` (null for `clear`), `count` (new size), `kind`, `category` |
| `research_cockpit_handoff` | "Compare in the cockpit" is followed | `productSlugs` (string[]), `count` (int), `kind`, `category` |
| `research_finder_cta` | the Homepage Quick Finder's own CTA is clicked (PR 3 Task 1) | `trigger` (`view_all`\|`dossier_item`), `surface: 'finder'`, `queryLength` (int), `resultCount` (int — the count VISIBLE AT CLICK TIME), `productSlug`/`kind` (`dossier_item` only) |

Emission discipline:
- `research_search` fires on the **settled** query only (same debounce that writes
  the URL), and not for an empty query.
- `research_evidence_open` fires once per card per open (close is not an event).
- `research_cockpit_handoff` is sent **immediately** (not queued) — the page is
  navigating away.
- `research_finder_cta` is sent **immediately** too, for both triggers — both
  navigate away. It fires **only on an actual CTA click** (never on render,
  search, or filter changes), and `resultCount` is always the exact number of
  cards visible to the user at that click — never recomputed or stale.
- A throwing tracker must never break the UI: every entry point is fail-soft.

## Hub dimensions (v1.1, additive — Task 6, spec §12)

The schema string stays `research_v1`; every addition below is optional and
lands in the TypeScript builder + strict Zod schema together, never one
without the other. `cockpit_v1` and `tool_v1` are untouched.

New optional properties:

```ts
surface?: 'hub' | 'finder';
kind?: 'review' | 'dossier';
trigger?: 'view_all' | 'dossier_item';
category?: Category;
```

- **`topic` for the two GLOBAL events is always `'hub'`**: `research_search`
  and the hub-wide `research_filter_change`. These describe the surface as a
  whole, not one product — there is no single topic to attach them to once a
  hub spans every category/topic in a market.
- **The four ITEM events use the selected `DiscoveryProjection`'s REAL topic
  and category**: `research_review_click`, `research_evidence_open`,
  `research_shortlist_change`, `research_cockpit_handoff`. This is what keeps
  two same-named topics in different categories — e.g. `us/credit-repair/companies`
  vs `us/debt-relief/companies` — analytically separable; a bare topic string
  alone collapses them into one bucket.
- **`topicOverride` is never a serialized property.** It is an optional
  argument to the track functions (`buildResearchEventData`'s `dimensions`
  parameter) and only ever replaces `properties.topic` (and stamps
  `properties.category`) at build time — it never appears as its own key on
  the wire.
- **`surface`** identifies which discovery surface emitted the event —
  `'hub'` for the universal Research hub (Task 6); `'finder'` for the
  Homepage Quick Finder (PR 3 Task 1).
- **`kind`** mirrors the clicked/opened/shortlisted item's own
  `DiscoveryProjection['kind']` (`'review'` or `'dossier'`).
- Raw search text is still never transmitted — this extension changes
  dimensions, not the privacy rule above.

Track functions accept an optional final `options` argument
(`{ topic?, category?, surface?, kind?, trigger? }`) carrying these
dimensions; omitting it keeps every pre-Task-6 call site byte-identical.

## Quick Finder CTA event (v1.2, additive — PR 3 Task 1, spec §12)

The Homepage Quick Finder is a `surface: 'finder'` client (never writes the
homepage URL) that reuses `research_v1` end to end — no new schema string, no
new endpoint, no new table. It ships one new event, `research_finder_cta`,
sent by `trackFinderCta()` (`lib/analytics/research-tracking.ts`):

- **`trigger: 'view_all'`** — the Finder's primary "View all research" CTA.
  This is a **GLOBAL** event: `topic: 'hub'`, no `category`, same as
  `research_search`. `resultCount` MUST be the exact number of cards the user
  saw when they clicked — never a value recomputed after the click or left
  over (stale) from an earlier `research_search`/`research_filter_change`.
- **`trigger: 'dossier_item'`** — a Cockpit-only card's own CTA (no review
  exists yet). This is an **ITEM** event: pass the card's real `topic`/
  `category` dimensions (same override mechanism as `research_review_click`)
  plus `productSlug` and `kind: 'dossier'`.
- Sent **immediately** (not queued) — both variants navigate away.
- Fires **only** when the Finder's own CTA is actually clicked — never on
  render, mount, search, or filter changes.
- Same privacy rule as every other event in this contract: the raw query
  text is never serialized, only its trimmed `queryLength`.

## Category/type filter facets (v1.3, additive — PR 5 gap-close)

`ResearchFacet` (`lib/analytics/research-events.ts`) and its strict Zod
counterpart (`lib/validation/index.ts`) originally shipped with only
`'status' | 'confidence' | 'fresh'` (Task 6) — the category chips both hubs
render, and the type chip the universal hub renders, had no legal facet value
to report through `research_filter_change` at all. This was supposed to land
in PR 2 Task 6 alongside the other three and did not; it arrives here,
additively, because it closes a real measurement gap rather than because
anything about category/type filtering itself changed: PR 3's Quick Finder
correctly declined to invent an out-of-contract facet value rather than widen
a frozen enum outside its own scope, so the category dimension stayed a blind
spot on both surfaces until now.

- **`'category'`** — the category chip on both the universal hub (`/research`
  and its market variants) and the Homepage Quick Finder. `surface: 'hub'` or
  `surface: 'finder'` respectively, same as every other `research_filter_change`.
- **`'type'`** — the `review`/`dossier` type chip on the universal hub only
  (the Quick Finder has no type chip). `surface: 'hub'`.
- `deriveLabel`/`deriveValue` (`lib/analytics/research-events.ts`) needed no
  new branch for either value: both were already facet-agnostic (`eventLabel`
  is the facet name itself, `eventValue` is `resultCount`) — only the
  `ResearchFacet` union and the Zod `facet` enum widened.
- Same emission discipline as every other `research_filter_change`: fires on
  the toggle, carries the resulting `resultCount` (the count AFTER the change,
  never the count before it).

## Success metrics

Denominator for the rate metrics is **sessions with a `/research` pageview**
(existing pageview event). All are session-scoped unless noted.

| Metric | Definition |
|---|---|
| Search/filter engagement | sessions with ≥1 `research_search` **or** `research_filter_change` ÷ research sessions |
| Evidence-open rate | sessions with ≥1 `research_evidence_open` ÷ research sessions |
| Research → Review CTR | sessions with ≥1 `research_review_click` ÷ research sessions |
| Shortlist rate | sessions with ≥1 `research_shortlist_change` where `action='add'` ÷ research sessions |
| Research → Cockpit handoff rate | sessions with ≥1 `research_cockpit_handoff` ÷ research sessions |
| Zero-result rate | `research_search` events with `resultCount = 0` ÷ all `research_search` events (event-scoped, not session-scoped) |

Reading the pilot: a healthy discovery layer shows meaningful evidence-open and
review CTR (people engage with the *proof*, which the Cockpit can't measure), and
a handoff rate that proves the funnel into Compare actually works. A high
zero-result rate means the search or the catalogue is too narrow.

## Out of scope for research_v1

Impression tracking per card (the Cockpit already owns product impressions),
scroll depth, A/B variants, and any per-keystroke telemetry.

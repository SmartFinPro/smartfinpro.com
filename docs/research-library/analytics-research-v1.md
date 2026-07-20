# research_v1 — Event contract & success metrics

Status: **contract frozen** (implement against this, don't drift).
Scope: the Research Library discovery surface (`/research`). Pilot: US trading platforms.

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
| `research_search` | after the search debounce settles / the URL `q` is stable — **never per keystroke** | `queryLength` (int), `resultCount` (int) |
| `research_filter_change` | a filter chip is toggled | `facet` (`status`\|`confidence`\|`fresh`), `value` (string\|null), `active` (bool), `resultCount` (int) |
| `research_evidence_open` | a card's "View evidence" disclosure is opened (open only, not close) | `productSlug`, `status`, `dataPoints` (int) |
| `research_review_click` | a card's review link is followed | `productSlug`, `status`, `rank` (int\|null), `position` (1-based index in the rendered list) |
| `research_shortlist_change` | shortlist mutates | `action` (`add`\|`remove`\|`clear`), `productSlug` (null for `clear`), `count` (new size) |
| `research_cockpit_handoff` | "Compare in the cockpit" is followed | `productSlugs` (string[]), `count` (int) |

Emission discipline:
- `research_search` fires on the **settled** query only (same debounce that writes
  the URL), and not for an empty query.
- `research_evidence_open` fires once per card per open (close is not an event).
- `research_cockpit_handoff` is sent **immediately** (not queued) — the page is
  navigating away.
- A throwing tracker must never break the UI: every entry point is fail-soft.

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

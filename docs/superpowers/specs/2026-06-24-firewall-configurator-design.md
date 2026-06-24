# Firewall Configurator — Design Spec

> **Datum:** 2026-06-24
> **Status:** Approved (Brainstorming abgeschlossen)
> **Scope:** Eine in sich geschlossene interaktive Feature-Einheit auf der Firewall-Seite. Kein Backend-Neubau (Events nutzen bestehendes `/api/track`).

---

## 1. Problem & Ziel

Die Firewall-Seite ist aktuell rein editorial — der Leser konsumiert passiv. Der größte CRO-Hebel ist ein **interaktiver Plan-Generator**: Der Leser beantwortet 4 Fragen und baut sein **eigenes** Cash-Flow-Firewall-Setup. Dadurch wird der Mercury-CTA zur logischen Fortsetzung („ich habe gerade meinen Plan gebaut → jetzt umsetzen"), statt zu einem generischen Button. Zusätzlich liefern getrackte Events echte CRO-Daten.

## 2. Grundsatzentscheidungen (vom User bestätigt)

- **Platzierung:** direkt **nach Phase 01** (das Node-Modell ist gerade erklärt → der Leser baut sofort sein eigenes).
- **Guardrails (Compliance):** Alle Zahlen sind **„recommended / suggested operating limits" von SmartFinPro — NICHT offizielle Mercury-Produktlimits.** Disclaimer-Zeile pflicht.
- **Progressive Disclosure:** Der Plan erscheint **erst nach Interaktion** (nach „Build my firewall plan"), nicht sofort dominant.
- **Kein E-Mail-Gate** — der Wert ist sofort sichtbar.
- **URL-State:** out of scope (später optional).

## 3. Architektur — 3 saubere Einheiten

1. **`firewall-plan.ts`** — *pure* Empfehlungs-Engine. Kein React/Next, keine Imports außer Typen → **unit-testbar (TDD)**. Export: `buildFirewallPlan(input) → FirewallPlan` + die Config-Konstanten + Typen.
2. **`firewall-configurator.tsx`** (`'use client'`) — die interaktive UI (4 Fragen → Plan-Output). Ruft `buildFirewallPlan`. Hält den eigenen Frage-State; `location` ist ein **controlled** Prop (damit die International-Chips ihn setzen können).
3. **`firewall-analytics.ts`** — dünner Client-Helper `trackFirewallEvent(name, properties)` → `POST /api/track` (`type:'event'`, `event_category:'firewall_configurator'`). Wiederverwendet die bestehende Session-ID-Mechanik (wie der globale Analytics-Client / `/api/track-cta`).
   - **Defensiv & fire-and-forget (Pflicht):** `trackFirewallEvent` ist `void` (Rückgabe `void`, **nie awaited**), nutzt `fetch(url, { method:'POST', keepalive: true, … })` und **schluckt alle Fehler** (`.catch(() => {})`). Tracking darf **niemals** Navigation, CTA, State oder Render blockieren oder verzögern. Kein Click-Handler wartet auf das Event.

Alle drei liegen im Seitenverzeichnis: `app/(marketing)/us/business-banking/programmatic-financial-firewall/`.

## 4. Datenmodell & Empfehlungs-Logik (`firewall-plan.ts`)

```ts
export type FounderLocation = 'us' | 'uk' | 'ca' | 'au' | 'other';
export type MonthlySpend = 'under-5k' | '5k-25k' | '25k-plus';
export type StackItem = 'ads' | 'hosting' | 'saas' | 'payroll' | 'contractors';
export type TeamAccess = 'solo' | '2-5' | '6-plus';

export interface FirewallConfigInput {
  location: FounderLocation;
  monthlySpend: MonthlySpend;
  stack: StackItem[];        // ≥1 erforderlich
  teamAccess: TeamAccess;
}

export interface PlanNode {
  key: StackItem;
  label: string;             // 'Ad Spend'
  vendors: string;           // 'Google Ads · Meta · TikTok · LinkedIn'
  monthlyLimit: number;      // recommended cap (gerundet)
  accent: 'cyan' | 'emerald' | 'amber' | 'sky' | 'violet';
}

export interface FirewallPlan {
  nodes: PlanNode[];
  hardening: string[];       // SOP-Bullets
  headline: string;          // 'A 3-node cash-flow firewall'
  subline: string;           // 'International founder · 2–5 team · $5k–$25k/mo · US LLC'
  international: boolean;
  totalBudget: number;
  cta: { label: string; href: string };
}
```

**Node-Config** (Reihenfolge = Anzeige-Reihenfolge):

| key | label | vendors | weight | accent |
|---|---|---|---|---|
| ads | Ad Spend | Google Ads · Meta · TikTok · LinkedIn | 0.50 | cyan |
| hosting | Core Infrastructure | Vercel · AWS · Supabase · OpenAI | 0.22 | emerald |
| payroll | Payroll & Reserves | Gusto · Deel · Rippling | 0.13 | sky |
| saas | Team SaaS | Slack · Notion · Workspace · Loom | 0.10 | amber |
| contractors | Contractor Payouts | Deel · Wise · Upwork | 0.05 | violet |

**Budget je Spend-Tier** (`BUDGET_BY_SPEND`): `under-5k → 4000` · `5k-25k → 15000` · `25k-plus → 40000`.

**Per-Node-Limit** = `round( totalBudget × (node.weight / Σ weights der gewählten Nodes), nearest 100 )`. (Nur gewählte Stack-Items werden zu Nodes; Gewichte werden über die Auswahl normalisiert.)

**Hardening-SOP** (`teamAccess`):
- `solo`: 1 FIDO2-Hardware-Key + 1 Backup-Key auf dem Owner-Login · SMS-2FA entfernen · Mercury-CLI fürs Monitoring.
- `2-5`: per-Seat-FIDO2-Keys · Receipt-Pflicht auf jeder Karte · rollenbasierte Karten-Sichtbarkeit.
- `6-plus`: (wie 2-5) **plus** Approval-Workflow für neue Vendor/Limit-Erhöhungen · Quartals-Seat-Audit · separater Read-only-API-Token für Ops.

**Location-Modifier** (`location !== 'us'` ⇒ `international = true`): zusätzlicher SOP-Bullet — „US LLC operated from abroad: FIDO2 is mandatory (cross-border SIM-swap risk); monitor via the Mercury API/CLI instead of browser sessions; keep one US-reachable recovery method."

**Headline/Subline:** `headline = 'A {n}-node cash-flow firewall'` (n = Anzahl Nodes). `subline = '{International|US} founder · {Solo|2–5|6+} team · {<$5k|$5k–$25k|$25k+}/mo · US LLC'`.

**CTA:** `{ label: 'Launch Mercury and build this card map', href: '/go/mercury' }`.

**Edge cases:** leerer `stack` ⇒ `buildFirewallPlan` wirft NICHT, aber die UI verlangt ≥1 Stack-Item bevor „Build" aktiv wird. `location: 'other'` ⇒ international.

## 5. UI/UX (`firewall-configurator.tsx`)

- **4 Fragen** kompakt (Single-Screen, keine Multi-Step-Navigation nötig):
  1. Founder location: US / UK / Canada / Australia / Other (single-select, controlled prop).
  2. Monthly spend: `<$5k` / `$5k–$25k` / `$25k+` (single-select).
  3. Stack: Ads / Hosting / SaaS / Payroll / Contractors (**multi-select**, ≥1).
  4. Team access: Solo / 2–5 / 6+ (single-select).
- **„Build my firewall plan"**-Button → rendert den Plan-Output darunter (Progressive Disclosure: vorher kein Plan sichtbar). Button disabled, solange kein Stack-Item gewählt.
- **Plan-Output:** Headline + Subline, Node-Karten (label, vendors, „recommended" Limit), Hardening-SOP-Liste (inkl. International-Bullet), **prominenter Disclaimer** (sichtbare, abgesetzte Zeile direkt am Plan — **kein** Kleingedrucktes): „**SmartFinPro recommended operating limits, not Mercury product limits.**", danach die CTA-Pill. Scanbar/klar gegliedert, aber **kein** zusätzlicher Wizard und **kein** URL-State.
- **Wording:** jedes Limit trägt „recommended" / „suggested" (z. B. „$9,300/mo recommended").
- **Design:** dunkle Firewall-Palette (zinc/cyan), konsistent mit den Node-Cards/`ProtocolBridge`. `'use client'` (State + Events).
- **Kein** E-Mail-Feld, **kein** externer Call zum Plan-Bauen (rein client-seitig via `buildFirewallPlan`).

## 6. Events (`firewall-analytics.ts` → `/api/track`, `type:'event'`)

`event_category: 'firewall_configurator'`, `page_path: '/us/business-banking/programmatic-financial-firewall'`, `properties` = relevanter Kontext.

| Event | Trigger | properties |
|---|---|---|
| `firewall_config_started` | erste Antwort-Interaktion (einmalig pro Session) | `{ firstField }` |
| `firewall_plan_generated` | „Build my firewall plan" / Plan gerendert | `{ location, monthlySpend, stack, teamAccess, nodeCount, totalBudget }` |
| `firewall_cta_after_plan_click` | Mercury-CTA **im Plan-Output** geklickt | `{ location, monthlySpend, nodeCount }` |
| `firewall_international_chip_click` | 🇬🇧/🇨🇦/🇦🇺-Chip im „International Founder Routing"-Block | `{ market }` |
| `firewall_review_backlink_click` | „Read the full Mercury review"-Link (EditorialBacklink) | `{}` |

- **`firewall_cta_after_plan_click`** wird **getrennt** vom generischen CTA getrackt (zusätzlich zum normalen `/go/mercury`-Click-Tracking).
- **International-Chips** werden klickbar: `onClick` → (a) Event, (b) Configurator-`location` setzen (controlled state in `firewall-client.tsx`, geteilt mit dem Configurator), (c) zum Configurator scrollen.
- **`EditorialBacklink` bleibt Server Component** (Bundle/RSC-Architektur sauber). Statt die ganze Komponente zu `'use client'` zu machen, wird **nur der Review-Link in ein winziges Client-Child** ausgelagert: neue `tracked-review-link.tsx` (`'use client'`) — ein **generischer** dünner `<Link>`-Wrapper mit Props `{ href, eventName, eventCategory?, className, children }`, der das Event im `onClick` **fire-and-forget** feuert (kein Firewall-Hardcoding → keine Kopplung von `components/marketing` an das Seitenverzeichnis). `EditorialBacklink` (server) rendert es mit `eventName="firewall_review_backlink_click"`; alles andere bleibt server-rendered.

## 7. Integration / Einbaustellen

| Datei | Änderung |
|---|---|
| `…/programmatic-financial-firewall/firewall-plan.ts` | **neu** — pure Engine + Typen + Config |
| `…/programmatic-financial-firewall/firewall-configurator.tsx` | **neu** — `'use client'` UI |
| `…/programmatic-financial-firewall/firewall-analytics.ts` | **neu** — `trackFirewallEvent` Helper |
| `__tests__/unit/firewall-plan.test.ts` | **neu** — Engine-Tests (TDD) |
| `firewall-client.tsx` | Configurator **nach Phase-01-Section** einhängen; `location`-State lifted (geteilt mit International-Chips); International-Chips → klickbar + Event |
| `components/marketing/tracked-review-link.tsx` | **neu** — `'use client'` Mini-Link-Wrapper, feuert `firewall_review_backlink_click` |
| `components/marketing/EditorialBacklink.tsx` | bleibt **Server Component**; nutzt `<TrackedReviewLink>` für den Review-Link (nicht selbst `'use client'`) |

## 8. Non-Goals (YAGNI / vom User gesetzt)

- Keine UK/CA/AU-Duplikat-/lokalisierten Seiten.
- Keine weiteren langen Editorial-Textblöcke.
- Keine komplexe Dashboard-Integration vor Launch (`content_items`-Zeile bleibt separat/optional).
- Kein URL-State, kein Multi-Step-Wizard, kein E-Mail-Gate, kein Server-seitiges Plan-Computing.

## 9. Verifikation

- **TDD:** `firewall-plan.ts` per vitest — Node-Ableitung aus Stack, Limit-Normalisierung/Rundung, SOP per Team-Size, International-Modifier, Edge cases (1 Node, alle 5 Nodes, leerer Stack-Guard in der UI).
- `npm run check:types` + `npm run check:imports` grün (RSC-Grenze: `EditorialBacklink` weiter nur via Slot, nicht in `firewall-client` importiert).
- Visuelle Preview (Webpack): Configurator nach Phase 01, Plan erscheint erst nach „Build", Limits tragen „recommended", Disclaimer sichtbar, dunkles Design konsistent.
- Events: in der Konsole/Network bestätigen, dass die 5 Events an `/api/track` (`type:'event'`) feuern.

## 10. Offene Punkte

Keine blockierenden. Konkrete $-Limits sind als **SmartFinPro-Empfehlungen** deklariert (Disclaimer) — keine Mercury-Produktclaims.

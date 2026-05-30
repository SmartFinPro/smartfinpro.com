# SmartFinPro.com — Essenzielle Verbesserungsanalyse (Frontend + Backend-Dashboard)

> **Datum:** 29. Mai 2026
> **Analyse-Basis:** Statische Codebase-Analyse (read-only) auf Branch `feat/mcp-server-phase1` + Live-Daten aus der Produktions-DB über den `smartfinpro` MCP-Server
> **Methodik:** Erst Belege gesammelt (Datei:Zeile / Live-Query), dann bewertet. Nicht verifizierte Aussagen sind als **Annahme** markiert.
> **Priorität:** 🔴 Kritisch · 🟠 Hoch · 🟡 Mittel · 🟢 Nice-to-have
> **ID-Schema:** `F-NN` zur Verlinkung in TASKS.md

---

## 0. Executive Summary

Die Plattform ist technisch überdurchschnittlich solide: vorbildliche Image-/Font-/CSP-/Rate-Limit-/RLS-Konfiguration, durchdachte Hreflang- und Schema-Infrastruktur, saubere DB-Indizes. Die größten Hebel liegen **nicht** in fehlender Infrastruktur, sondern in **drei Mustern**:

1. **Fertig gebaute Komponenten werden nicht verdrahtet.** Risk-Warning, Affiliate-Disclosure, FAQPage-Schema, ItemList-Schema, RegulatorBadge existieren — aber das aktive Review-Layout bindet sie nicht ein. Hoher Compliance-/SEO-Effekt bei minimalem Aufwand.
2. **Die Monetarisierungs-Schicht ist faktisch nicht angeschlossen.** Live-DB zeigt: nur 64 von 203 in Content referenzierten `/go/`-Slugs sind in `affiliate_links` aktiv; 261 Klicks in 30 Tagen, aber **0 Conversions** über alle Postback-Stufen. Jeder CTA-Klick auf einen Orphan-Slug ist verschenkter Umsatz.
3. **Ein einziger `headers()`-Call im Root-Layout** macht die gesamte `generateStaticParams`-SSG-Infrastruktur wirkungslos und zwingt 200+ Seiten in SSR mit Pro-Request-DB-Queries.

Dazu kommt **eine real ausnutzbare Security-Lücke** (Genesis-API ohne Auth) und ein **Dashboard-Widget, das erfundene „100% Health"-Werte als Live-Daten ausgibt**.

### Top-10 nach Business-Impact

| # | Befund | Ebene | Impact | Aufwand |
|---|---|---|---|---|
| [F-01](#f-01) | 139 verwaiste `/go/`-Affiliate-Slugs → Klicks ohne Provision | Conversion/Revenue | 🔴 hoch | mittel |
| [F-02](#f-02) | 261 Klicks / 30 Tage, **0 Conversions** — Postback-Tracking liefert nichts | Revenue/Daten | 🔴 hoch | mittel |
| [F-03](#f-03) | Genesis-API: mutierende Routen ohne jede Authentifizierung | Security | 🔴 hoch | mittel |
| [F-04](#f-04) | CFD/Forex-Risikowarnung nicht above-the-fold + ohne Verlustquote | Compliance/Risk | 🔴 hoch | mittel |
| [F-05](#f-05) | Keine Above-the-fold Affiliate-Disclosure im aktiven Review-Layout | Compliance/Risk | 🔴 hoch | niedrig |
| [F-06](#f-06) | `headers()` im Root-Layout deaktiviert SSG für die ganze Site | Performance | 🟠 hoch | mittel |
| [F-07](#f-07) | FAQPage-Schema nirgends emittiert — 184 MDX mit `faqs:` ungenutzt | SEO/AEO | 🟠 hoch | niedrig |
| [F-08](#f-08) | SystemIntegrityWidget zeigt hartcodierte Fake-„100% Health"-Daten | Daten/Risk | 🟠 hoch | mittel |
| [F-09](#f-09) | Gold-CTA mit weißem Text — Kontrast 1,9:1 (WCAG-Fail) auf allen Money-Buttons | UX/A11y | 🟠 hoch | mittel |
| [F-10](#f-10) | GPTBot & CCBot komplett blockiert — widerspricht der AEO-Strategie | SEO/AEO | 🟠 hoch | niedrig |

---

# EBENE 1 — Frontend (öffentliche Seite)

## 1.1 Conversion & Compliance

### <a id="f-01"></a>F-01 🔴 139 verwaiste `/go/`-Affiliate-Slugs — Klicks generieren keine Provision
- **Befund:** Live-Query (`smartfinpro` MCP `get_orphan_slugs`): In `content/**/*.mdx` werden **203 unique** `/go/<slug>`-Slugs referenziert (1.303 Referenzen, 216 Dateien), aber nur **64 sind in `affiliate_links` aktiv**. → **139 Slugs sind verwaist.** Darunter hoch-frequentierte, eindeutig monetarisierbare Partner: `revolut-business` (33 Refs), `questrade` (17), `chatgpt`/`plus500` (je 12), `athena-home-loans` (10), `ynab`/`monarch-money`/`sofi`/`bluevine`/`tastyfx` (je 7). Diese Links laufen über `/go/[slug]` ins Fallback (Homepage-Redirect, `app/(marketing)/go/[slug]/route.ts`) statt zum Affiliate-Programm — der Klick wird getrackt, bringt aber **keine Provision**.
- **Impact:** **Revenue hoch** — direkter, messbarer Umsatzverlust auf den meistgenutzten CTAs. Der jüngste Commit (`7c64e6c affiliate links cleanup, orphan slugs`) hat das Thema angefasst, aber nicht abgeschlossen.
- **Aufwand:** mittel (Triage + Anlage der Affiliate-Programme)
- **Konkreter Fix:** Orphan-Liste triagieren in (a) **echte Partner** → in `affiliate_links` mit korrekter Affiliate-URL aktivieren (Priorität nach `ref_count`); (b) **bewusst nicht monetarisierte Erwähnungen** (ETF-Ticker wie `icln`, `eagg`, Wettbewerber-Mentions) → im MDX als normalen Text statt `/go/`-Link ausgeben, damit sie nicht als toter Affiliate-Link erscheinen. Den vorhandenen Cron `check-links` so erweitern, dass Orphan-Slugs einen Telegram-Alert auslösen (Regression-Schutz). Verifikation jederzeit per MCP `get_orphan_slugs`.

### <a id="f-02"></a>F-02 🔴 261 Klicks in 30 Tagen, aber 0 Conversions über alle Postback-Stufen
- **Befund:** Live-Query (`get_conversion_funnel`, 30-Tage-Fenster): `total_clicks: 261`, aber **alle** Funnel-Stufen (`registration`, `kyc_submitted`, `kyc_approved`, `ftd`, `approved`, `reversed`) stehen auf `count: 0`. In Kombination mit F-01 deutet das stark darauf hin, dass die Conversion-/Postback-Pipeline nicht produktiv angeschlossen ist (kein Netzwerk-Postback kommt an, oder die Klicks landen mangels aktiver Slugs gar nicht beim Partner). **Annahme:** Es liegt nicht an fehlendem Traffic (261 Klicks sind vorhanden), sondern an der fehlenden Verbindung Klick → Partner → Postback.
- **Impact:** **Revenue hoch / Daten hoch** — ohne Conversion-Daten sind Dashboard-EPC, EV-Ranking (`rankOffersByEV`) und der autonome Executor blind; sie optimieren auf Nullwerten.
- **Aufwand:** mittel
- **Konkreter Fix:** End-to-End-Test eines Postbacks pro Netzwerk (`/api/postback`, `/api/webhooks/conversions`): Test-Conversion einspielen und prüfen, ob sie in `conversions` landet. Postback-URLs in den Affiliate-Dashboards verifizieren (Sub-ID = `click_id`-Mapping). Hängt direkt an F-01 — erst aktive Slugs, dann fließen Conversions. Siehe auch [F-19](#f-19) (Fail-Open der Webhook-Signaturprüfung).

### <a id="f-04"></a>F-04 🔴 Forex/CFD-Risikowarnung nicht above-the-fold und ohne Pflicht-Verlustquote
- **Befund:** Im aktiv gerenderten `components/marketing/report-layout.tsx:1293-1298` steht die einzige CFD-Warnung ganz im Footer und ist generisch („CFDs are complex instruments…") — **ohne** die FCA/ASIC-pflichtige standardisierte Verlustquote („XX% of retail investor accounts lose money", prominent). Hero-CTA (`:400-414`) und Sidebar-CTA (`:1159-1173`) feuern den Affiliate-Klick ab, **bevor** der Nutzer eine Warnung sieht. Die fertige `components/marketing/risk-warning.tsx` (`RiskWarningBox` mit markt-/quotenspezifischen Texten + `lossPercentage`) wird im aktiven Layout **gar nicht** eingebunden, nur in 7 von 47 MDX manuell.
- **Impact:** **Risk hoch** — FCA COBS 4.5 / ASIC RG 227. Lizenz-/Abmahnrisiko für die beworbenen Partner.
- **Aufwand:** mittel
- **Konkreter Fix:** `RiskWarningBox` in `ReportLayout` **vor dem Hero-CTA** rendern, gegated auf `category ∈ {forex, trading}` **oder** ein Frontmatter-Flag `hasLeverageRisk: true` (löst auch F-04b).

### F-04b 🔴 CFD-Produkt unter `personal-finance` umgeht die Risiko-Gate-Logik
- **Befund:** `content/uk/personal-finance/trading-212-isa-review.mdx` bewirbt einen Anbieter, dessen „CFD business is the primary revenue driver" (Zeile ~201), ist aber als `personal-finance` kategorisiert. Da die Warnung nur auf `category ∈ {trading, forex}` triggert, erscheint **keine** strukturierte CFD-Warnung; die „76%"-Quote steht nur einmal in einer FAQ-Antwort. (Verifiziert sauber: `au/personal-finance/selfwealth-review.mdx` — „No CFDs".)
- **Impact:** **Risk hoch**
- **Aufwand:** niedrig
- **Konkreter Fix:** Risk-Gate auf Frontmatter-Flag `hasLeverageRisk` umstellen (siehe F-04) statt nur auf `category`; im Trading-212-MDX setzen.

### <a id="f-05"></a>F-05 🔴 Keine Above-the-fold Affiliate-Disclosure im aktiven Review-Layout
- **Befund:** Im aktiven `report-layout.tsx` erscheint die Disclosure nur im Footer (`:1287`). Der erste Affiliate-Link (Hero-CTA, `:400`) steht ganz oben ohne sichtbare Offenlegung. Die fertige, markt-spezifische `components/ui/affiliate-disclosure.tsx` (FTC/FCA/ASIC/CIRO, `position="top"`) wird nur auf statischen Landing-/Tool-Seiten genutzt, nicht auf den ~108 Reviews.
- **Impact:** **Risk hoch** (FTC 16 CFR Part 255 „clear and conspicuous") / Revenue mittel (Trust)
- **Aufwand:** niedrig
- **Konkreter Fix:** `<AffiliateDisclosure market={market} position="top" />` in `ReportLayout` oberhalb des Hero-CTA einbinden.

### F-11 🟡 Drei gleichzeitige CTA-Overlays erzeugen Funnel-Reibung (mobil)
- **Befund:** Auf Review-Seiten parallel aktiv: `StickyReviewNav` (sticky top), `ReviewExitIntent` (Exit-Popup) und der mobile fixed bottom-CTA (`report-layout.tsx:1241`). Auf Mobile überlagern oben + unten dauerhaft den Lesebereich.
- **Impact:** Revenue mittel (Friction, CLS-Risiko)
- **Aufwand:** niedrig–mittel
- **Konkreter Fix:** Auf Mobile entweder StickyNav **oder** fixed-bottom-CTA zeigen. Siehe auch [F-13](#f-13) (Sticky-Stacking-Kollision).

### F-12 🟡 Pauschale, ggf. irreführende Claims im Exit-Intent-Popup
- **Befund:** `components/marketing/review-exit-intent.tsx:288-290` zeigt für **jeden** Partner pauschal „Exclusive sign-up bonus for SmartFinPro readers" und „Verified & regulated platform" — letzteres auch für `ai-tools`/`cybersecurity` ohne Finanzregulator.
- **Impact:** Risk mittel–hoch (FTC / ASA UK: unbelegte Werbeaussage)
- **Aufwand:** niedrig
- **Konkreter Fix:** Claims datengetrieben aus Partner-Daten ziehen; „regulated" nur für regulierte Kategorien.

### F-12b 🟢 RegulatorBadge an Haupt-CTAs nicht ausgerollt
- **Befund:** `RegulatorBadge` (Mapping korrekt in `lib/affiliate/regulator-map.ts`) wird nur in `sticky-review-nav.tsx` + `affiliate-link.tsx` genutzt, fehlt aber an Hero-/Sidebar-CTA in `ReportLayout`.
- **Impact:** Revenue/Trust mittel
- **Aufwand:** niedrig
- **Konkreter Fix:** `<RegulatorBadge market category />` neben Hero- und Sidebar-CTA ergänzen.

> ✅ **Korrekt verifiziert (kein Handlungsbedarf):** `rel="nofollow noopener sponsored"` auf allen `/go/`-Links (`lib/mdx/components.tsx:1766`, `affiliate-link.tsx:22`); `/go/[slug]`-Handler mit Bot-Detection, IP-Blocklist, Rate-Limit (10/min), Hostname-Whitelist gegen Open-Redirect, 307 no-store; Pre-Qual-Quiz sauber. **Kleiner Bug:** Tippfehler in der Whitelist `hargreaveslandsdwon.co.uk`/`hargreaveslansdwon.co.uk` (`go/[slug]/route.ts:106-107`) — echte HL-Links würden ins Fallback laufen.

---

## 1.2 Performance & Caching

### <a id="f-06"></a>F-06 🟠 `headers()` im Root-Layout deaktiviert SSG für die gesamte Site
- **Befund:** `app/layout.tsx:91-95` ruft `readSilo()` → `await headers()`. `headers()` ist eine Dynamic API: sie opted den **kompletten** Render-Tree in dynamic rendering (SSR pro Request) — inklusive aller Review-/Markt-/Kategorie-Seiten. Damit erzeugen die vorhandenen `generateStaticParams()`-Exporte (`[slug]/page.tsx:331` u.a.) **kein** echtes SSG. Es existiert zudem **kein einziges** `export const revalidate` auf einer Content-Seite. Pro Review-Render laufen 5 parallele Supabase/FS-Queries (`[slug]/page.tsx:140-157`). Cloudflare-Edge (`s-maxage=86400`) federt das für Anonyme ab, aber Origin-TTFB bei Cache-Miss/Revalidation ist hoch.
- **Impact:** Performance hoch (TTFB, Origin-Last, LCP-Risiko bei Cache-Miss). *Reale CWV erfordern Live-Messung.*
- **Aufwand:** mittel
- **Konkreter Fix:** Das `data-silo` wird bereits client-seitig durch `SiloClassProvider` (via `usePathname`) gesetzt — der server-seitige `headers()`-Read ist **redundant**. `readSilo()` aus `app/layout.tsx` entfernen, dann `export const revalidate = 86400;` in `[slug]/page.tsx` + `[category]/page.tsx`. Löst F-06, F-14, F-15 gemeinsam.

### F-14 🟡 Content-Seiten-Queries ungecacht (außer Markt-Homepage)
- **Befund:** `[slug]/page.tsx:140-157` und `[category]/page.tsx:78-96` führen ungecachte Supabase-Calls pro Render aus; nur die Markt-Homepage nutzt `unstable_cache` (`[market]/page.tsx:19-37`).
- **Impact:** Performance mittel (wird durch F-06/ISR mitgelöst)
- **Aufwand:** niedrig
- **Konkreter Fix:** ISR (F-06) macht es obsolet; sonst `getMarketExpert`/`getEnrichedCtaPartners`/`getContentByMarketAndCategory` in `unstable_cache(..., {revalidate:300})` wrappen.

### F-15 🟡 `'use client'` ohne Interaktivität — unnötiges First-Load-JS
- **Befund:** `components/marketing/hero.tsx:1` ist `'use client'`, hat aber keinen State/Effect/Handler — rein präsentational. Muster verbreitet: **54 von 76** Marketing-Komponenten tragen `'use client'`.
- **Impact:** Performance mittel (Hydration/INP/Bundle — *exakter JS-Betrag erfordert Live-Bundle-Analyse*)
- **Aufwand:** niedrig (Hero) / mittel (systematisches Audit)
- **Konkreter Fix:** `'use client'` aus `hero.tsx` entfernen. Kandidaten finden: `grep -L "useState\|useEffect\|onClick\|onChange\|usePathname\|motion\." $(grep -rl "'use client'" components/marketing)`.

> ✅ **Überdurchschnittlich sauber:** 0 rohe `<img>` (durchgängig `next/image`, AVIF/WebP, `minimumCacheTTL` 1 Jahr); Hero-LCP korrekt mit `priority`+`fill`+`sizes`; `next/font` mit `display:swap` (CLS-sicher); framer-motion nur 9 Dateien, Tool-Rechner lazy via `next/dynamic ssr:false`; kein moment/lodash; durchdachte Cache-Header (immutable Static, CDN 24h, Preconnect-Hints). **Cleanup-Kandidat:** unreferenzierte 1,4 MB-JPG-Header + `experts-collage.jpg` (7,9 MB) — reiner Repo-Bloat.

---

## 1.3 SEO & AEO

### <a id="f-07"></a>F-07 🟠 FAQPage-Schema wird nirgends emittiert — 184 MDX mit `faqs:` ungenutzt
- **Befund:** `lib/seo/schema.ts:139` definiert `generateFAQSchema()`, wird aber in keiner Page aufgerufen. Gleichzeitig haben 184 Review-MDX strukturierte `faqs:`-Arrays im Frontmatter. `report-layout.tsx` emittiert Review/Article/Person/Breadcrumb — **kein FAQPage**. Die `AnswerBlock`-Microdata (`components/ui/answer-block.tsx:32`) nutzt `Question`/`Answer` **ohne** umschließenden `FAQPage`-Scope → für Rich Results/AI-Overviews wirkungslos.
- **Impact:** SEO/AEO hoch — verschenkte FAQ-Rich-Snippets und AI-Overview-Zitierbarkeit über 184 Seiten. Die teure Arbeit (Content) ist erledigt, nur die Verdrahtung fehlt.
- **Aufwand:** niedrig
- **Konkreter Fix:** In `report-layout.tsx` ein `<script type="application/ld+json">` mit `generateFAQSchema(review.faqs)` ergänzen, wenn `faqs` vorhanden.

### <a id="f-10"></a>F-10 🟠 GPTBot & CCBot komplett blockiert — Selbstwiderspruch zur AEO-Strategie
- **Befund:** `app/robots.ts:43-51` setzt `GPTBot: disallow /` und `CCBot: disallow /`. Das Projekt investiert massiv in GEO/AEO (`answer-block.tsx`), sperrt aber genau die Crawler aus, die ChatGPT-Search und Common-Crawl-basierte LLMs (Perplexity etc.) speisen. Anthropic/Google-Extended/PerplexityBot sind ungeregelt.
- **Impact:** SEO/AEO hoch (verhindert Zitierbarkeit in den Answer-Engines, auf die die Strategie zielt)
- **Aufwand:** niedrig
- **Konkreter Fix:** Bewusste Entscheidung treffen. Für AEO: GPTBot/CCBot/Google-Extended/PerplexityBot/ClaudeBot `allow`. **Annahme:** reflexhafte „AI-Scraper"-Abwehr, kein bewusster Trade-off — kurz mit Inhaber bestätigen.

### F-16 🟡 Widersprüchliche Canonical-Signale für die US-Homepage
- **Befund:** Routing ist symmetrisch (`/{market}` für alle, inkl. `/us` — `lib/seo/hreflang.ts:29`), aber `app/(marketing)/page.tsx:14` setzt Canonical auf `${BASE_URL}/`, während Hreflang `x-default` und Sitemap (`app/sitemap.ts:122`) auf `/us` zeigen. Die Sitemap enthält kein bare `/`. Google sieht zwei konkurrierende US-Startseiten (`/` und `/us`) mit gegensätzlichen Signalen. (CLAUDE.md „US = kein Prefix" ist gegenüber dem Code veraltet.)
- **Impact:** SEO mittel (Crawl-Budget, „Duplicate, Google chose different canonical")
- **Aufwand:** mittel
- **Konkreter Fix:** Eine Konvention festlegen — Empfehlung: 301 `/us` → `/`, Canonical+Hreflang der Homepage auf `/`, Sitemap-Homepage-Loop für US auf `${BASE_URL}` umstellen.

### F-17 🟡 Schema-URL ≠ Canonical-URL (Article nutzt veraltete No-Prefix-Logik)
- **Befund:** `report-layout.tsx:241` baut Article-`url` mit `market==='us' ? '' : ...` → `…/ai-tools/<slug>`, während Canonical/Breadcrumb `…/us/ai-tools/<slug>` nutzen. Dieselbe `us ? '' :`-Logik im Archived-Redirect-Lookup (`[slug]/page.tsx:136`) → potenzielle Redirect-Misses.
- **Impact:** SEO mittel
- **Aufwand:** niedrig
- **Konkreter Fix:** `us ? '' :`-Sonderfall entfernen, einheitlich `getCanonicalUrl()` / `/${market}/...`.

### F-18 🟡 Kategorie-/Pillar-Seiten ohne ItemList-Schema
- **Befund:** `[market]/[category]/page.tsx:204` emittiert nur Article-Schema. `lib/seo/schema.ts:154` (`generateComparisonSchema` → `ItemList`) existiert, wird aber nirgends genutzt — obwohl die Kategorieseiten (Sitemap-Priorität 0.9) Produktlisten sind.
- **Impact:** SEO mittel (verschenkte Carousel/Listen-Rich-Results auf Money-Seiten)
- **Aufwand:** mittel
- **Konkreter Fix:** `generateComparisonSchema()` mit den gelisteten Reviews einbinden (Daten via `getContentByMarketAndCategory` vorhanden).

### F-18b 🟢 Kein llms.txt
- **Befund:** Weder `public/llms.txt` noch `app/llms.txt/route.ts`. Infrastruktur für Text-Discovery-Files existiert (`app/api/security-txt/route.ts`).
- **Impact:** AEO mittel
- **Aufwand:** niedrig
- **Konkreter Fix:** `app/llms.txt/route.ts` mit Site-Beschreibung + Links zu Markt-Homepages, Pillar-Seiten, Top-Reviews (generierbar aus `lib/i18n/config.ts` + `getAllContent()`).

### F-18c 🟢 robots.ts: `/private/` und `/sfp-mk-*` für Googlebot/Bingbot crawlbar
- **Befund:** `/sfp-mk-2026-x9k.pdf` (existiert real in `public/`) und `/private/` sind nur unter `*` disallowed; die spezifischeren Googlebot/Bingbot-Gruppen (`robots.ts:25-41`) erben das nicht.
- **Impact:** niedrig (geheimes Marketing-PDF für Googlebot crawlbar)
- **Aufwand:** niedrig
- **Konkreter Fix:** Disallow auch in den Googlebot-/Bingbot-Gruppen ergänzen.

> ✅ **Sauber:** noindex treffsicher (Coming-Soon-Tools, leere Kategorien, Broker-Templates, Pagination) — nicht überbreit; Hreflang vollständig + content-aware (filtert tote Verweise); Sitemap mit Fallback bei Build-Fehler; aggregateRating bewusst weggelassen mangels echter Daten (korrekte YMYL-Entscheidung); `/go/`-Cloaking korrekt geblockt; interne Verlinkung via `getRelatedContent`+`getCrossCategoryContent`.

---

## 1.4 UX/UI & Accessibility

### <a id="f-09"></a>F-09 🟠 Gold-CTA mit weißem Text — Kontrast 1,9:1 (WCAG-Fail) auf allen Money-Buttons
- **Befund:** Weiß (`#fff`) auf Gold (`#F5A623`) = **≈1,9:1** (AA verlangt 4,5:1). Der Shadcn-Token `--accent-foreground` ist bereits korrekt auf dunkles Ink umgestellt (`globals.css:31`, Kommentar „was #fff = 2.0:1 ✗"), aber **49 inline-gestylte CTAs** umgehen den Token: u.a. `sticky-footer-cta.tsx:127,165`, `report-layout.tsx:1262`, `sticky-comparison-bar.tsx:102,182`, `footer.tsx:89`, `header.tsx:327`, alle 9 Tool-Komponenten. Inkonsistent: `exit-intent-popup.tsx:257` macht es bereits richtig (`color: var(--sfp-ink)`).
- **Impact:** UX/A11y hoch (betrifft die wichtigsten Conversion-Buttons; YMYL-Finanzseite)
- **Aufwand:** mittel (mechanisches Suchen/Ersetzen + Re-Test)
- **Konkreter Fix:** `.btn-gold`-Utility in `globals.css` mit `color: var(--sfp-ink)` (dunkel auf Gold ≈ 8:1, AA+AAA) und die 49 Inline-Styles dadurch ersetzen.

### <a id="f-13"></a>F-13 🟠 Sticky-Element-Kollision auf Review-Seiten
- **Befund:** Mehrere Fixed-Layer ohne koordinierte Offsets: `StickyReviewNav` (`fixed top-0 z-50`), `StickyComparisonBar` (`fixed top-16 z-40`), `StickyTableOfContents` (`sticky top-[64px] z-30`), mobiler Bottom-CTA (`fixed bottom-0 z-40`), globales ExitIntent. ComparisonBar (`top-16`) und TOC (`top-[64px]`) zielen beide auf die 64px-Headerkante → Überlappung; ReviewNav (top-0) legt sich über beide.
- **Impact:** UX hoch (mobil) — bis zu drei Balken übereinander; TOC unbenutzbar
- **Aufwand:** mittel
- **Konkreter Fix:** Sticky-Hierarchie mit CSS-Variable `--sticky-offset` staffeln; auf Review-Seiten ComparisonBar **oder** TOC zeigen; ExitIntent auf Review-Seiten via vorhandenes `window.__sfpReviewExitActive`-Flag unterdrücken (prüfen, ob `ReviewExitIntent` es setzt).

### F-21 🟠 Mobiler Menü-Button ohne `aria-label` + Sheet ohne `SheetTitle`
- **Befund:** Icon-only Hamburger ohne Label (`header.tsx:263`); `SheetContent` (`:267`) ohne `SheetTitle` → Radix-Dialog wirft A11y-Warnung, Screenreader-Dialog bleibt namenlos (WCAG 4.1.2/1.3.1).
- **Impact:** A11y hoch (primäre Mobilnavigation für Screenreader nicht eindeutig)
- **Aufwand:** niedrig
- **Konkreter Fix:** `aria-label="Open menu"` an den Button; `<SheetTitle className="sr-only">Navigation</SheetTitle>` (Export vorhanden in `ui/sheet.tsx:108`).

### F-22 🟡 Hardcodierte Broker-Cards in der Navigation — markt-inkonsistent, 404-Risiko
- **Befund:** `brokerCards` (`header.tsx:66-74`) ist eine feste, **nicht** markt-gefilterte Liste (IG, eToro, Plus500…), gerendert in jedem Markt → für US werden EU/UK-Broker beworben, deren Review-Slug im US-Silo evtl. nicht existiert. Übrige Nav-Gruppen sind sauber pro Markt gefiltert (`getNavGroupsForMarket`).
- **Impact:** UX mittel (Inkonsistenz, mögliche 404)
- **Aufwand:** mittel
- **Konkreter Fix:** `brokerCards` um `markets`-Feld erweitern + `getBrokerCardsForMarket(market)` (analog `getToolCardsForMarket`).

### F-23 🟡 Kein globales `prefers-reduced-motion`-Handling für Framer Motion
- **Befund:** 9 Komponenten nutzen framer-motion, keine respektiert `useReducedMotion()`/`MotionConfig` (WCAG 2.3.3). Reduced-Motion nur punktuell in CSS.
- **Impact:** A11y mittel
- **Aufwand:** niedrig
- **Konkreter Fix:** `<MotionConfig reducedMotion="user">` einmal im Marketing-Layout um die Client-Bäume.

### F-24 🟢 Weitere A11y-Punkte
- **Slate-Sekundärtext** `#64748B` auf Weiß ≈ 4,6:1 (grenzwertig), auf `--sfp-gray`/`--sfp-sky`-Boxen unter 4,5:1 (`globals.css:65`). → auf getönten Boxen `#475569` (≈7:1) verwenden.
- **Disclosure-Text 9-10px** (`sticky-footer-cta.tsx:115,170`) — für Pflicht-Disclosure zu klein. → min. `text-xs` (12px).
- **Tap-Targets < 44px** bei Dismiss-Buttons (`sticky-footer-cta.tsx:154`, `sticky-comparison-bar.tsx:201`). → `h-11 w-11` Hit-Area.

> ✅ **Sauber:** Skip-Link korrekt; Radix-Dialoge (Fokus-Trap/Escape/Restore) out-of-the-box; `StickyReviewNav` vorbildlich (`inert`, focus-visible, „opens in new tab"-Labels, `aria-hidden` für Deko); Hero-Bild korrekt `alt=""` + `aria-hidden`; Markt-Switcher konsistent.

### F-25 🟡 Zwei parallele Review-Templates (Architektur-Drift) — querschnittlich
- **Befund:** Review-Seiten können über `report-layout.tsx` **oder** `review-template.tsx` rendern. Sie divergieren in Compliance-Verhalten (Top-Disclosure/Risk), Sticky-CTA-Mechanismus (`StickyFooterCTA` vs. inline, `report-layout.tsx:33` importiert `StickyFooterCTA` ungenutzt) und Exit-Intent. Aktives Routing nutzt `ReportLayout` (`[slug]/page.tsx:14`) — `review-template.tsx` ist **vermutlich toter Code** (*Annahme: bitte verifizieren*).
- **Impact:** Maintainability mittel — die Compliance-Fixes F-04/F-05 müssen sonst doppelt gepflegt werden.
- **Aufwand:** hoch (Konsolidierung) / niedrig (toten Import + Datei prüfen)
- **Konkreter Fix:** Auf `report-layout` als kanonisches Layout konsolidieren; `review-template.tsx` löschen, falls bestätigt tot.

---

# EBENE 2 — Backend-Dashboard (eingeloggt)

## 2.1 Datenqualität & -aktualität

### <a id="f-08"></a>F-08 🟠 SystemIntegrityWidget zeigt hartcodierte Fake-„100% Health"-Daten als Live
- **Befund:** `components/dashboard/system-integrity-widget.tsx:55-77` rendert komplett aus der Konstante `INTEGRITY_DATA` (healthScore 100, 147/147 Seiten, 14/14 Vulns gefixt, 0,00% Fehlerrate). Der „Re-Scan System"-Button (`:281-290`) ist reines `setTimeout`-Theater („in production, this would hit an API endpoint"), der „Last scan"-Timestamp wird per `useEffect` auf `new Date()` gesetzt (`:277`) → suggeriert einen nie stattgefundenen Scan. Prominent als 2/3-Block auf dem Command Center (`page.tsx:406`).
- **Impact:** Risk hoch — der Betreiber trifft Vertrauensentscheidungen auf erfundenen Werten („grünes Dashboard, während es brennt"). Reale Tabellen (`cron_run_audit`, `web_vitals`, `compliance_audit_runs`) wären vorhanden.
- **Aufwand:** mittel
- **Konkreter Fix:** Werte aus echten Tabellen ableiten; mindestens als „Static baseline, last verified <Datum>" labeln statt animierter Live-Schein. Nebenbefund: nutzt verbotenes Glassmorphism (`backdrop-blur-md`, `bg-white/70`, `:149-301`) — laut CLAUDE.md untersagt.

### F-26 🟡 Schema-Drift: 2 Spalten in `subscribers` fehlen in der Live-DB
- **Befund:** Live-Query (`detect_schema_drift`): `subscribers.user_agent` und `subscribers.referrer` sind in `supabase/schema.sql` als `text` deklariert, existieren aber **nicht** in der Live-DB (`missing_in_db`). INSERTs, die diese Felder schreiben, schlagen fehl oder verlieren Daten still.
- **Impact:** Daten mittel (Lead-Quellen-Attribution verloren, ggf. Insert-Fehler bei Subscribe)
- **Aufwand:** niedrig
- **Konkreter Fix:** Migration `ALTER TABLE subscribers ADD COLUMN user_agent text, ADD COLUMN referrer text;` — oder, falls bewusst entfernt, aus `schema.sql` + Insert-Code streichen. Regelmäßig per MCP `detect_schema_drift` prüfen.

### F-27 🟡 `content_health_scores` ist 47 Tage alt und durchgängig 0
- **Befund:** Live-Query (`get_content_health`): alle 212 Seiten haben `computed_at: 2026-04-12` (47 Tage vor heute), `monthly_revenue: 0`, `monthly_clicks: 0`, `epc: 0`, `health_score ≈ 0,09-0,11`. Der Score-berechnende Cron (freshness/ev-refresh-Kette) hat seit dem 12.04. nicht mehr aktualisiert — **Annahme**: Cron läuft nicht oder schreibt nicht zurück. Dashboard-Widgets, die diese Tabelle lesen, zeigen veraltete Nullwerte.
- **Impact:** Daten mittel–hoch — der autonome Insight-/Executor-Stack priorisiert auf 6 Wochen alten Nullwerten.
- **Aufwand:** mittel
- **Konkreter Fix:** `cron_run_audit` für die Health-/EV-Crons prüfen (laufen sie? Fehler?), Recompute manuell triggern, Monitoring-Alert bei `computed_at` älter als X Tage. Hängt mit F-02 zusammen (ohne Conversions bleiben Revenue/EPC strukturell 0).

## 2.2 State- & Datenfluss / API-Effizienz

### F-28 🟠 Doppelter Server-Action-Fan-out auf der Home-Seite
- **Befund:** `app/(dashboard)/dashboard/page.tsx:286` awaitet `getDashboardStats` + `getGlobalMarketIntelligence` parallel; beide lesen unabhängig `link_clicks`, `conversions`, `affiliate_links`, `page_views` über denselben Zeitraum (`lib/actions/dashboard.ts:429` bzw. `:1221`). ~19 DB-Queries/Render, mehrere redundant.
- **Impact:** Performance hoch (verdoppelter Roundtrip; bei `force-dynamic` jeder Request)
- **Aufwand:** hoch (sauber) / niedrig (Quick Win F-29)
- **Konkreter Fix:** Gemeinsame `_loadDashboardRawData(range)` einmal laden, beide Aggregationen in-memory ableiten.

### <a id="f-29"></a>F-29 🟠 `getGlobalMarketIntelligence` nicht gecacht (`getDashboardStats` schon)
- **Befund:** `getDashboardStats` ist in `unstable_cache(revalidate:30)` (`dashboard.ts:1128`), `getGlobalMarketIntelligence` (`:1213`) ist eine nackte async function ohne Cache — obwohl es die teurere der beiden ist (6 Queries + viel In-Memory-Join). Inkonsistenz, kein Designprinzip (`getAnalyticsStats` ist ebenfalls gecacht).
- **Impact:** Performance hoch
- **Aufwand:** niedrig
- **Konkreter Fix:** GMI analog wrappen: `unstable_cache(_getGlobalMarketIntelligence, ['dashboard:gmi'], {revalidate:30, tags:['dashboard-stats']})`; `loadFxRates()` vor den Wrapper ziehen.

### F-30 🟡 Doppeltes Polling derselben API auf der Analytics-Seite
- **Befund:** `LiveDashboardBar` pollt `/api/dashboard/live-stats` alle 30s, `LiveClicksFeed` denselben Endpoint alle 10s (`live-clicks-feed.tsx:115`) — beide gleichzeitig gemountet. Pro Aufruf 4 Queries; `activeSessions` (`live-stats/route.ts:74`) zieht alle Session-Rows der letzten 5 Min ohne `head:true` und dedupliziert clientseitig.
- **Impact:** Performance mittel (~8 Queries/10s pro offenem Tab)
- **Aufwand:** mittel
- **Konkreter Fix:** Ein gemeinsamer Poller/Context für `live-stats`; `activeSessions` auf `COUNT(DISTINCT session_id)`-RPC umstellen.

### F-31 🟡 Code-Qualität: Lint-Umgehung + stille Catches + toter Suspense
- **Befund:** `autonomous-actions-widget.tsx:2` deaktiviert die projekteigene Regel `sfp/require-widget-error-boundary`; `catch {}` ohne Logging (`:57,85`). Auf der Home-Seite sind fast alle `<Suspense>`-Wrapper wirkungslos (`page.tsx:357` ff.), weil die Daten als bereits aufgelöste Props aus dem `await Promise.all` kommen → kein Streaming, toter Skeleton-Code.
- **Impact:** Maintainability mittel
- **Aufwand:** niedrig
- **Konkreter Fix:** `eslint-disable` entfernen / Boundary in die Komponente ziehen, `catch` loggen; toten Suspense entfernen **oder** Daten-Fetch in die Widgets verlagern (echtes Streaming).

> ✅ **Sauber:** Index-Abdeckung der Hot-Columns vollständig (composite Indizes auf `link_clicks(link_id, clicked_at)`, `conversions(status, converted_at)` etc. — `migrations/20260306120000`); **keine** echten N+1-DB-Loops (Aggregation in-memory nach Bulk-Fetch); keine leakenden Realtime-Subscriptions; `setInterval`-Poller räumen via `clearInterval` korrekt auf.

## 2.3 Security & Robustheit

### <a id="f-03"></a>F-03 🔴 Genesis-API: mutierende Routen ohne jede Authentifizierung
- **Befund:** Die Middleware `proxy.ts` gated nur `/api/dashboard/*` (`:270`) und `/dashboard/*` (`:315`). `/api/genesis/*` fällt unter den `PROTECTED_PREFIXES`-Skip (`:28`) und wird **ungeprüft** durchgereicht; die dahinterliegenden Server Actions in `lib/actions/genesis.ts` authentifizieren auch nicht. Ohne Auth erreichbar: `genesis/generate` (voller Claude-Lauf, `maxDuration=300`), `magic-find` (Serper+Claude-Kosten), `distribute` (schreibt MDX + Affiliate-Mapping + Google Indexing), `delete`, `update-content` (überschreibt beliebige MDX), `create-template`, `insert-images`, `reindex`. Im Kontrast sind `edit-section`/`alt-text`/`index-url`/`process-images` korrekt via `validateBearer(CRON_SECRET)` geschützt → die Lücke ist vergessene Absicherung, kein Design.
- **Impact:** Risk hoch — anonyme Angreifer können Claude-/Serper-Budget verbrennen (DoS), beliebige MDX-Inhalte auf der Live-Site injizieren/überschreiben (Content-Injection, SEO-Sabotage, Affiliate-Link-Manipulation), Runs löschen.
- **Aufwand:** mittel
- **Konkreter Fix:** In `proxy.ts` einen Auth-Gate für `/api/genesis` **vor** der `PROTECTED_PREFIXES`-Schleife ergänzen (Session-Cookie ODER `Bearer CRON_SECRET`), analog zum bestehenden `/api/dashboard`-Block (`:270-304`). Deckt alle Genesis-Routen auf einen Schlag und bleibt zum bestehenden `validateBearer`-Pattern kompatibel.

### <a id="f-19"></a>F-19 🟠 Conversion-Webhook-Connectoren: Fail-Open bei fehlendem Secret
- **Befund:** `lib/api/connectors/partnerstack.ts:177-180` und `financeads.ts:193-196` geben bei fehlendem `webhook_secret`/`api_secret` `return true` zurück → akzeptieren **unsignierte** Webhooks. `/api/webhooks/conversions` (rate-limited, aber öffentlich) schreibt das Ergebnis via `saveConversion` in `conversions`.
- **Impact:** Risk mittel (potenziell hoch) — bei fehlendem Secret kann jeder gefälschte Conversions/Payouts einschleusen → verfälscht Revenue-Reporting + füttert autonome Crons mit Falschdaten. Exploitbar nur bei tatsächlich fehlendem Secret (**Annahme**: in Prod gesetzt, aber nicht erzwungen).
- **Aufwand:** niedrig
- **Konkreter Fix:** Fail-Closed: bei fehlendem Secret `return false` (Webhook ablehnen) — analog zum vorbildlichen Resend-Webhook (`app/api/webhooks/resend/route.ts:69-75`, 503 + Reject).

### F-20 🟡 Genesis Same-Origin-Auth über Referer/Origin spoofbar (Nicht-Browser)
- **Befund:** `genesis/edit-section/route.ts:28-44` (+ `process-images`, `alt-text`) akzeptiert, wenn `Origin`/`Referer`-Host == `Host`. CSRF-resistent für Browser, aber ein curl-Client kann `Origin:` frei setzen und den Zweig passieren. Rate-limited (10/min), schreibt keine MDX → reines Budget-Abuse-Risiko.
- **Impact:** Risk niedrig
- **Aufwand:** niedrig
- **Konkreter Fix:** Mit dem Genesis-Sammel-Gate aus F-03 (Session-Pflicht) entfällt der schwache Zweig automatisch.

### F-32 🟢 CSP enthält `'unsafe-inline'` + `'unsafe-eval'`
- **Befund:** `next.config.ts:126` — `'unsafe-eval'` ist für clientseitige MDX-Evaluierung (`new Function()`) nötig (dokumentiert `:115`), `'unsafe-inline'` für Inline-Scripts. Schwächt nur Defense-in-Depth.
- **Impact:** Risk niedrig
- **Aufwand:** hoch (Nonce-basierte CSP = Umbau)
- **Konkreter Fix:** Mittelfristig Nonce-basierte `script-src`; `'unsafe-eval'` als akzeptiertes Restrisiko der SafeMDX-Architektur dokumentieren.

> ✅ **Vorbildlich:** Alle 23 Cron-Routen prüfen `Bearer CRON_SECRET`; Dashboard-Auth mit HMAC-Session, timing-safe Vergleich, Brute-Force-Lockout (5/15min), optionales TOTP, IP-Whitelist, Sliding-Session; `trigger-cron` mit SSRF-Mitigation; durchgängiges Rate-Limiting (Upstash + In-Memory-Fallback, fail-closed) auf allen Public-Schreibpfaden; vollständiges Security-Header-Set (HSTS preload, X-Frame DENY, `frame-ancestors 'none'`, nosniff, Permissions-Policy, COOP/CORP); keine hardcodierten Secrets; Service-Client nur server-only; RLS auf allen neuen Tabellen (ENABLE + 0 Policies = deny-all, sicher).

---

## 3. Priorisierung

### 🟢 Quick Wins (hoher Impact, niedriger Aufwand) — zuerst
| # | Befund | Warum jetzt |
|---|---|---|
| [F-05](#f-05) | Affiliate-Disclosure above-the-fold einbinden | Compliance-Pflicht, Komponente fertig — 1 Zeile JSX |
| [F-07](#f-07) | FAQPage-Schema verdrahten | 184 Seiten, Content fertig, nur 1 Script-Tag — höchster SEO-Ertrag/Aufwand |
| [F-10](#f-10) | GPTBot/CCBot freigeben (nach Bestätigung) | Schaltet AEO-Sichtbarkeit frei, robots.ts-Edit |
| [F-29](#f-29) | GMI in `unstable_cache` wrappen | Halbiert teuerste Dashboard-Query, ~3 Zeilen |
| [F-19](#f-19) | Webhook Fail-Closed | Verhindert Conversion-Fälschung, 1 Zeile pro Connector |
| [F-21](#f-21) | aria-label + SheetTitle Mobilmenü | A11y-Blocker, 2 kleine Edits |
| [F-26](#f-26) | Schema-Drift `subscribers` beheben | Verhindert stillen Datenverlust bei Leads, 1 Migration |
| [F-12](#f-12) | Pauschale Bonus/„regulated"-Claims entschärfen | FTC/ASA-Risiko, kleine Edits |

### 🔴 Strategische Maßnahmen (höherer Aufwand oder Abhängigkeiten)
| # | Befund | Charakter |
|---|---|---|
| [F-01](#f-01) + [F-02](#f-02) | **Monetarisierung reparieren** — Orphan-Slugs aktivieren + Postback-Pipeline verifizieren | Größter Revenue-Hebel; Triage + Netzwerk-Config |
| [F-03](#f-03) | Genesis-API absichern | Security-kritisch; zentral in `proxy.ts` |
| [F-04](#f-04) | Risk-Warning above-the-fold + Frontmatter-Gate | Compliance; betrifft Layout + Content |
| [F-06](#f-06) | SSG/ISR reaktivieren (`headers()` entfernen + `revalidate`) | Größter Performance-Hebel; löst F-14/F-15 mit |
| [F-08](#f-08) | SystemIntegrityWidget an echte Daten anbinden | Verhindert Fehlentscheidungen auf Fake-Health |
| [F-09](#f-09) | Gold-CTA-Kontrast plattformweit (`.btn-gold`) | A11y; 49 Stellen mechanisch |
| [F-13](#f-13) | Sticky-Stacking entwirren | UX mobil; Layout-Koordination |
| [F-25](#f-25) | Review-Template-Konsolidierung | Architektur; entlastet F-04/F-05-Pflege |
| [F-27](#f-27) | content_health_scores-Cron-Kette reparieren | Daten; macht autonomes System funktional |
| [F-28](#f-28)/[F-30](#f-30) | Dashboard-Query-Fan-out konsolidieren | Performance; Skalierungs-Vorsorge |

---

## 4. Was nicht aus dem Code verifizierbar ist (Live-Zugriff nötig)

- **Reale Core Web Vitals** (LCP/INP/CLS-Felddaten): erfordern Live-Messung (PageSpeed/CrUX/`web_vitals`-Tabelle). Im Code wurden nur Risikofaktoren identifiziert (F-06, F-09, F-13).
- **Bundle-Size in kB**: erfordert `next build --profile` / Bundle-Analyzer (F-15 nennt Indizien, keine Zahlen).
- **Cloudflare-Cache-Hit-Rate**: erfordert Cloudflare-Analytics (relevant für die Bewertung von F-06).
- **Ob Health-/EV-Crons laufen**: `cron_run_audit` bzw. `cron_logs` live prüfen (F-27).
- **Ob Webhook-Secrets in Prod gesetzt sind**: bestimmt, ob F-19 latent oder aktiv ist.

---

*SmartFinPro.com | Essenzielle Verbesserungsanalyse | 29. Mai 2026*
*Evidenzbasiert: statische Codebase-Analyse + Live-Produktionsdaten (smartfinpro MCP)*

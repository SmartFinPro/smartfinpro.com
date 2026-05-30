# Orphan-Slug Triage — Befund F-01

> Erzeugt: 2026-05-29 · Quelle: MCP smartfinpro.get_orphan_slugs + list_affiliate_links
> Scan: 216 Dateien · 203 unique /go/<slug> Slugs in MDX · 64 aktiv in DB · 139 verwaiste Slugs
>
> Ein verwaister Slug ist in content/**/*.mdx referenziert, aber NICHT als active=true in
> affiliate_links vorhanden, sodass der /go/<slug>-Handler auf die Homepage zurueckfaellt (keine Provision).
>
> Drei Aktivierungs-Pfade:
> 1. INSERT (Slug fehlt komplett in DB) -> Migrations-Scaffold, active=false, Platzhalter-URL.
> 2. UPDATE (Slug existiert in DB, aber active=false) -> eigener Block im Scaffold, da ON CONFLICT DO NOTHING diese Zeilen sonst stillschweigend ueberspringt.
> 3. MDX-Edit zu Klartext (nicht monetarisierbar) -> Gruppe B / C, NICHT in DB aufnehmen.
>
> Diese Session editiert KEIN MDX und setzt NICHTS live. Sie liefert nur Triage + Scaffold.

---

## Bereits in DB, aber active=false (-> UPDATE, nicht INSERT!)

Diese Slugs erscheinen als "verwaist", existieren aber bereits als Zeile in affiliate_links.
ON CONFLICT (slug) DO NOTHING wuerde sie ueberspringen. Sie brauchen ein UPDATE active=true
(siehe Migrations-Scaffold, Block 2) UND eine gepruefte/funktionierende destination_url,
da die meisten health_status='dead' haben.

| slug | ref_count | market | category (DB) | partner_name | health_status | Massnahme |
|---|---|---|---|---|---|---|
| revolut-business | 33 | uk | business-banking | Revolut Business | dead | URL pruefen + active=true |
| questrade | 17 | ca | trading | Questrade | dead | URL pruefen + active=true |
| plus500 | 12 | uk | trading | Plus500 | dead | URL pruefen + active=true |
| plus500-au | 3 | au | trading | Plus500 | dead | URL pruefen + active=true |
| plus500-uk | 1 | uk | trading | Plus500 | dead | URL pruefen + active=true |
| silvergoldbull-ca | 3 | ca | gold-investing | Silver Gold Bull | dead | URL pruefen + active=true |
| silvergoldbull-us | 3 | us | gold-investing | Silver Gold Bull | dead | URL pruefen + active=true |
| ally-invest-robo | 2 | us | personal-finance | Ally Invest Robo | dead | URL pruefen + active=true |

Hinweis: revolut-business ist in DB als market=uk hinterlegt, wird aber primaer in au/business-banking/ referenziert. Inhaber pruefen ob ein zweiter au-Slug noetig ist.

---

## Gruppe A — Echte Partner (aktivieren, sobald URL vorliegt)

Eigene Review-Seite oder klar bewerbbares Finanzprodukt mit Affiliate-Potenzial.
-> INSERT als active=false mit Platzhalter-URL (Migrations-Scaffold Block 3).

> Kategorie-Hinweis: Slugs aus superannuation, savings, housing (mit [!] markiert) verletzen die
> aktuelle category-CHECK-Constraint. Das Scaffold erweitert die Constraint zuvor (Block 1).
> cross-market-Slugs haben keinen Markt -> Inhaber-Entscheidung (siehe Gruppe C).

| slug | ref_count | market | category | partner_name | Beispiel-Datei |
|---|---|---|---|---|---|
| australian-retirement-trust | 8 | au | [!] superannuation | Australian Retirement Trust | au/superannuation/australian-retirement-trust-review.mdx |
| barclays-personal-loan | 8 | uk | personal-finance | Barclays Personal Loan | uk/personal-finance/barclays-personal-loan-review.mdx |
| amex-gold | 8 | us | personal-finance | American Express Gold Card | us/personal-finance/amex-gold-card-review.mdx |
| chase-sapphire-preferred | 8 | us | personal-finance | Chase Sapphire Preferred | us/personal-finance/chase-sapphire-preferred-review.mdx |
| td-ameritrade | 8 | us | trading | TD Ameritrade | us/trading/td-ameritrade-review.mdx |
| ainslie-bullion | 7 | au | gold-investing | Ainslie Bullion | au/gold-investing/ainslie-bullion-review.mdx |
| commbank-home-loan | 7 | au | personal-finance | CommBank Home Loan | au/personal-finance/commbank-home-loan-review.mdx |
| westpac-home-loan | 7 | au | personal-finance | Westpac Home Loan | au/personal-finance/westpac-home-loan-review.mdx |
| ubank | 7 | au | [!] savings | uBank | au/savings/ubank-review.mdx |
| trading-212 | 7 | uk | trading | Trading 212 | uk/trading/freetrade-review.mdx |
| copilot-money | 7 | us | ai-tools | Copilot Money | us/ai-tools/copilot-money-review.mdx |
| ynab | 7 | us | ai-tools | YNAB | us/ai-tools/ynab-review.mdx |
| monarch-money | 7 | us | ai-tools | Monarch Money | us/ai-tools/monarch-money-review.mdx |
| bluevine | 7 | us | business-banking | Bluevine | us/business-banking/bluevine-review.mdx |
| tastyfx | 7 | us | forex | tastyfx | us/forex/tastyfx-review.mdx |
| sofi | 7 | us | personal-finance | SoFi | us/personal-finance/sofi-review.mdx |
| writesonic | 6 | us | ai-tools | Writesonic | au/ai-tools/index.mdx |
| perth-mint | 6 | au | gold-investing | The Perth Mint | au/gold-investing/perth-mint-review.mdx |
| nab-home-loan | 6 | au | personal-finance | NAB Home Loan | au/personal-finance/nab-home-loan-review.mdx |
| ubank-home-loan | 6 | au | personal-finance | uBank Home Loan | au/personal-finance/ubank-home-loan-review.mdx |
| australian-super | 6 | au | [!] superannuation | AustralianSuper | au/superannuation/australian-super-review.mdx |
| borrowell | 6 | ca | credit-score | Borrowell | ca/personal-finance/index.mdx |
| lending-works | 6 | uk | personal-finance | Lending Works | uk/personal-finance/lending-works-review.mdx |
| chip | 6 | uk | [!] savings | Chip | uk/savings/chip-review.mdx |
| freetrade | 6 | uk | trading | Freetrade | uk/trading/freetrade-review.mdx |
| lexington-law | 6 | us | credit-repair | Lexington Law | us/credit-repair/lexington-law-review.mdx |
| credit-saint | 6 | us | credit-repair | Credit Saint | us/credit-repair/credit-saint-review.mdx |
| sentinelone | 6 | us | cybersecurity | SentinelOne | us/cybersecurity/sentinelone-review.mdx |
| apmex | 6 | us | gold-investing | APMEX | us/gold-investing/apmex-review.mdx |
| jm-bullion | 6 | us | gold-investing | JM Bullion | us/gold-investing/jm-bullion-review.mdx |
| chase-sapphire-reserve | 6 | us | personal-finance | Chase Sapphire Reserve | us/personal-finance/chase-sapphire-reserve-review.mdx |
| empower | 6 | us | personal-finance | Empower | us/personal-finance/empower-review.mdx |
| tastytrade | 6 | us | trading | tastytrade | us/trading/tastytrade-review.mdx |
| webull | 6 | us | trading | Webull | us/trading/webull-review.mdx |
| anz-home-loan | 5 | au | personal-finance | ANZ Home Loan | au/personal-finance/anz-home-loan-review.mdx |
| spaceship | 5 | au | personal-finance | Spaceship | au/personal-finance/spaceship-review.mdx |
| ing-savings | 5 | au | [!] savings | ING Savings Maximiser | au/savings/ing-savings-maximiser-review.mdx |
| etoro-au | 5 | au | trading | eToro AU | au/trading/index.mdx |
| monzo | 5 | uk | personal-finance | Monzo | uk/personal-finance/monzo-review.mdx |
| raisin-uk | 5 | uk | [!] savings | Raisin UK | uk/savings/best-high-yield-savings-uk.mdx |
| hsbc-personal-loan | 5 | uk | personal-finance | HSBC Personal Loan | uk/personal-finance/hsbc-personal-loan-review.mdx |
| nutmeg | 5 | uk | personal-finance | Nutmeg | uk/personal-finance/nutmeg-review.mdx |
| quickbooks-ai | 5 | us | ai-tools | QuickBooks AI | us/ai-tools/quickbooks-ai-review.mdx |
| stripe-radar | 5 | us | ai-tools | Stripe Radar | us/ai-tools/stripe-radar-review.mdx |
| rho | 5 | us | business-banking | Rho | us/business-banking/rho-review.mdx |
| goldco | 5 | us | gold-investing | Goldco | us/gold-investing/goldco-review.mdx |
| etrade | 5 | us | trading | E-TRADE | us/trading/etrade-review.mdx |
| cisco-anyconnect | 4 | us | cybersecurity | Cisco AnyConnect | au/cybersecurity/index.mdx |
| cibc-personal-loans | 4 | ca | personal-finance | CIBC Personal Loans | ca/personal-finance/index.mdx |
| lightstream | 4 | us | personal-finance | LightStream | us/personal-finance/index.mdx |
| etoro-uk | 2 | uk | trading | eToro UK | uk/trading/ig-vs-plus500-vs-etoro.mdx |
| interactive-investor | 2 | uk | trading | interactive investor | uk/trading/index.mdx |
| airwallex | 2 | au | business-banking | Airwallex | au/business-banking/revolut-business-review.mdx |
| commsec | 2 | au | trading | CommSec | au/trading/selfwealth-trading-review.mdx |
| superhero | 2 | au | trading | Superhero | au/trading/selfwealth-trading-review.mdx |
| hostplus | 2 | au | [!] superannuation | Hostplus | au/superannuation/australian-super-review.mdx |
| rbc-business | 2 | ca | business-banking | RBC Business | ca/business-banking/eq-bank-business-review.mdx |
| nesto | 2 | ca | [!] housing | nesto | ca/housing/best-mortgage-rates-canada.mdx |
| tangerine | 2 | ca | personal-finance | Tangerine | ca/personal-finance/eq-bank-review.mdx |
| td-personal-loans | 2 | ca | personal-finance | TD Personal Loans | ca/personal-finance/index.mdx |
| barclays-business | 2 | uk | business-banking | Barclays Business | uk/business-banking/index.mdx |
| expressvpn | 2 | us | cybersecurity | ExpressVPN | us/cybersecurity/nordvpn-review.mdx |
| surfshark | 2 | us | cybersecurity | Surfshark | us/cybersecurity/nordvpn-review.mdx |
| marcus | 2 | us | personal-finance | Marcus by Goldman Sachs | us/personal-finance/index.mdx |
| raiz | 1 | au | personal-finance | Raiz | au/personal-finance/spaceship-review.mdx |
| vanguard-au | 1 | au | personal-finance | Vanguard AU | au/personal-finance/spaceship-review.mdx |
| macquarie-savings | 1 | au | [!] savings | Macquarie Savings | au/savings/ing-savings-maximiser-review.mdx |
| neo-financial | 1 | ca | personal-finance | Neo Financial | ca/personal-finance/wealthsimple-cash.mdx |
| td-direct | 1 | ca | trading | TD Direct Investing | ca/personal-finance/wealthsimple-review.mdx |
| rbc-direct | 1 | ca | trading | RBC Direct Investing | ca/personal-finance/wealthsimple-review.mdx |
| aj-bell-isa | 3 | uk | personal-finance | AJ Bell ISA | uk/personal-finance/aj-bell-isa-review.mdx |
| fidelity-isa | 3 | uk | personal-finance | Fidelity ISA | uk/personal-finance/fidelity-isa-review.mdx |
| nutmeg-isa | 3 | uk | personal-finance | Nutmeg ISA | uk/personal-finance/nutmeg-isa-review.mdx |
| trading-212-isa | 3 | uk | personal-finance | Trading 212 ISA | uk/personal-finance/trading-212-isa-review.mdx |
| vanguard-isa | 3 | uk | personal-finance | Vanguard ISA | uk/personal-finance/vanguard-isa-review.mdx |
| upstart | 3 | us | personal-finance | Upstart | us/personal-finance/index.mdx |
| discover-personal-loans | 1 | us | personal-finance | Discover Personal Loans | us/personal-finance/index.mdx |
| mettle | 1 | uk | business-banking | Mettle | uk/business-banking/index.mdx |
| moneyfarm | 1 | uk | personal-finance | Moneyfarm | uk/personal-finance/nutmeg-review.mdx |
| brex | 1 | us | business-banking | Brex | us/business-banking/index.mdx |
| augusta | 1 | us | gold-investing | Augusta Precious Metals | us/gold-investing/goldco-review.mdx |
| birch-gold | 1 | us | gold-investing | Birch Gold | us/gold-investing/goldco-review.mdx |

> Die Slugs ally-invest-robo, plus500*, questrade, revolut-business, silvergoldbull-* sind SCHON in DB -> ueber den UPDATE-Block aktivieren, NICHT im INSERT-Block.

---

## Gruppe B — Generische Erwaehnungen / nicht monetarisierbar

Kein Affiliate-Programm bzw. reine Vergleichs-/Wettbewerbs-Nennung. Empfehlung: im MDX
den /go/<slug>-Link durch Klartext (Produktname ohne Link) ersetzen. Nicht in DB aufnehmen.

| slug | ref_count | MDX-Datei(en) zum Editieren |
|---|---|---|
| chatgpt | 12 | au/ai-tools/index.mdx, au/ai-tools/jasper-ai-review.mdx, ca/ai-tools/index.mdx |
| chatgpt-plus | 4 | us/ai-tools/chatgpt-for-finance-review.mdx |
| claude-ai | 2 | us/ai-tools/ai-writing-tools-financial-content.mdx |
| claude-business | 1 | us/ai-tools/index.mdx |
| microsoft-defender | 2 | us/cybersecurity/crowdstrike-review.mdx, us/cybersecurity/sentinelone-review.mdx |
| uipath | 1 | us/ai-tools/ai-driven-finance-future.mdx |
| blue-prism | 1 | us/ai-tools/ai-driven-finance-future.mdx |
| vanguard | 1 | cross-market/best-esg-funds.mdx |
| vanguard-esg | 2 | cross-market/best-esg-funds.mdx |
| vanguard-international-esg | 1 | cross-market/best-esg-funds.mdx |
| ishares-esg | 1 | cross-market/best-esg-funds.mdx |
| ishares-global-esg | 1 | cross-market/best-esg-funds.mdx |
| parnassus | 1 | cross-market/best-esg-funds.mdx |
| icln | 1 | cross-market/best-esg-funds.mdx |
| tan-solar | 1 | cross-market/best-esg-funds.mdx |
| eagg | 1 | cross-market/best-esg-funds.mdx |
| grnb | 1 | cross-market/best-esg-funds.mdx |
| esge | 1 | cross-market/best-esg-funds.mdx |
| kount | 1 | us/ai-tools/stripe-radar-review.mdx |
| signifyd | 1 | us/ai-tools/stripe-radar-review.mdx |
| writer | 1 | us/ai-tools/copy-ai-review.mdx |
| freshbooks | 1 | us/ai-tools/quickbooks-ai-review.mdx |
| wave | 1 | us/ai-tools/quickbooks-ai-review.mdx |
| bitwarden | 1 | us/cybersecurity/1password-business-review.mdx |
| dashlane | 1 | us/cybersecurity/1password-business-review.mdx |
| cyberghost | 1 | us/cybersecurity/nordvpn-review.mdx |
| cyberghost-vpn | 1 | uk/cybersecurity/nordvpn-review-uk-2026-best-vpn-for-investors.mdx |

> ETF-/Fonds-Ticker (icln, eagg, grnb, esge, tan-solar, vanguard-esg, ishares-esg, parnassus ...) sind reine Vergleichs-Erwaehnungen in cross-market/best-esg-funds.mdx — kein klassisches Affiliate-Programm. AI-Modelle (chatgpt, claude-ai, microsoft-defender, uipath, blue-prism) haben kein nutzbares Affiliate-Programm und sind nur als Wettbewerber genannt.

---

## Gruppe C — Unklar / Inhaber-Entscheidung

Mehrdeutige Zuordnung, fehlender Markt, oder Pillar-Seiten-Slug (kein echter Affiliate).
Inhaber muss pro Slug entscheiden: Gruppe A (aktivieren) oder Gruppe B (Klartext).

| slug | ref_count | Hinweis | MDX-Datei(en) |
|---|---|---|---|
| best-ai-writing-tools-finance | 12 | Pillar-Seiten-Slug, kein Produkt -> vermutlich interner Link-Fehler | us/ai-tools/best-ai-writing-tools-finance.mdx |
| best-mortgage-rates-canada | 2 | Pillar-Seiten-Slug, kein Produkt | ca/housing/best-mortgage-rates-canada.mdx, ca/housing/ratehub-review.mdx |
| wealthsimple-tax | 3 | Wealthsimple-Sub-Produkt (Steuer) — eigener Affiliate? | ca/personal-finance/wealthsimple-tax.mdx |
| wealthsimple-invest | 3 | Sub-Produkt; wealthsimple ist bereits aktiv (anderer Slug) | ca/tax-efficient-investing/best-robo-advisors-canada.mdx, cross-market/best-ai-financial-advisors.mdx |
| sofi-invest | 1 | Sub-Produkt von SoFi; sofi-robo/sofi-personal-loans aktiv | cross-market/best-ai-financial-advisors.mdx |
| m1-finance | 1 | US robo-advisor — Affiliate moeglich, Markt cross-market | cross-market/best-ai-financial-advisors.mdx |
| ellevest | 1 | US robo-advisor — Affiliate moeglich, Markt cross-market | cross-market/best-ai-financial-advisors.mdx |
| schwab | 3 | Dublette zu aktivem charles-schwab -> MDX auf charles-schwab umbiegen? | us/personal-finance/wealthfront-review.mdx |
| ing | 1 | Zu generisch (ING AU vs ING DiBa) -> Markt/Produkt klaeren | au/savings/ubank-review.mdx |
| macquarie | 1 | Generisch (Bank vs Super vs Savings) | au/savings/ubank-review.mdx |
| australiansuper | 1 | Dublette zu australian-super (Schreibvariante) -> MDX vereinheitlichen | au/superannuation/australian-retirement-trust-review.mdx |
| rbc | 1 | Generisch; rbc-business/rbc-direct spezifischer | ca/business-banking/wise-business-review.mdx |
| desjardins | 1 | CA business-banking — Affiliate? | ca/business-banking/wise-business-review.mdx |
| rateshop | 1 | CA mortgage broker — Affiliate? | ca/housing/best-mortgage-rates-canada.mdx |
| newton | 1 | CA Krypto-Boerse — Compliance pruefen (Krypto-Affiliate) | ca/personal-finance/wealthsimple-crypto.mdx |
| kraken | 1 | Krypto-Boerse — Compliance pruefen | ca/personal-finance/wealthsimple-crypto.mdx |
| shakepay | 1 | CA Krypto-Boerse — Compliance pruefen | ca/personal-finance/wealthsimple-crypto.mdx |
| vanguard-uk | 1 | UK ISA/Invest — vanguard-isa bereits in Gruppe A | uk/personal-finance/nutmeg-review.mdx |
| nab-business | 2 | AU business-banking — Affiliate verfuegbar? | au/business-banking/index.mdx |
| up-business | 2 | AU business-banking — Affiliate verfuegbar? | au/business-banking/index.mdx |
| lending-tree | 3 | US Lead-Gen — Compliance/Programm pruefen | us/debt-relief/debt-consolidation-loans-bad-credit.mdx |
| freedom-debt-relief | 1 | US debt-relief — Compliance pruefen | us/debt-relief/debt-consolidation-vs-debt-management.mdx |
| sky-blue-credit | 1 | US credit-repair Wettbewerber-Nennung | us/credit-repair/best-credit-repair-companies.mdx |
| safeport-law | 1 | US credit-repair Wettbewerber-Nennung | us/credit-repair/best-credit-repair-companies.mdx |
| msi-credit | 1 | US credit-repair Wettbewerber-Nennung | us/credit-repair/best-credit-repair-companies.mdx |
| ovation-credit | 1 | US credit-repair Wettbewerber-Nennung | us/credit-repair/best-credit-repair-companies.mdx |
| sd-bullion | 1 | US gold — Affiliate? sonst Gruppe B | us/gold-investing/apmex-review.mdx |
| pmgold | 1 | AU gold (Perth Mint ETF) — Affiliate? | au/gold-investing/ainslie-bullion-review.mdx |

---

## Regression-Guard-Vorschlag — Orphan-Check in check-links

app/api/cron/check-links/route.ts prueft heute nur die Health aktiver Links (HEAD-Requests),
aber nicht, ob neu in MDX hinzugekommene /go/<slug>-Links ueberhaupt aktiv in der DB stehen.
Dadurch konnte F-01 (139 verwaiste Slugs) unbemerkt entstehen.

Vorschlag: Am Ende des erfolgreichen Health-Checks zusaetzlich die Orphan-Liste berechnen
(MDX-Refs gegen affiliate_links WHERE active=true) und bei Zuwachs einen Telegram-Alert feuern.
So wird jeder neue verwaiste Slug innerhalb von 24h sichtbar.

Konkret — ein Helper plus ein zusaetzlicher Block in der bestehenden Route (nicht in dieser
Session umgesetzt, nur Vorschlag):

```typescript
// NEU: lib/actions/orphan-slugs.ts  (Server Action, 'use server' + 'server-only')
//   - liest content/**/*.mdx, extrahiert /go/<slug>/ via Regex
//   - vergleicht gegen SELECT slug FROM affiliate_links WHERE active = true
//   - gibt { orphanCount, orphanSlugs: string[] } zurueck
//   (entspricht der Logik des MCP-Tools get_orphan_slugs)

// In app/api/cron/check-links/route.ts, NACH dem erfolgreichen runHealthChecks()-Block,
// VOR logCron(...):

import { getOrphanSlugs } from '@/lib/actions/orphan-slugs';

const orphan = await getOrphanSlugs();           // { orphanCount, orphanSlugs }
const ORPHAN_THRESHOLD = 0;                       // jeder neue Orphan ist meldenswert

if (orphan.orphanCount > ORPHAN_THRESHOLD) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
  const sample = orphan.orphanSlugs
    .slice(0, 10)
    .map((s) => `  - <code>${s}</code>`)
    .join('\n');
  const overflow = orphan.orphanCount > 10 ? `  ... und ${orphan.orphanCount - 10} mehr\n` : '';

  const orphanMsg = [
    `<b>ORPHAN-SLUG ALERT</b>`,
    ``,
    `${orphan.orphanCount} /go/-Links in MDX ohne aktiven affiliate_links-Eintrag`,
    `-> diese CTAs fallen auf die Homepage zurueck (keine Provision).`,
    ``,
    `<b>Beispiele:</b>\n${sample}${overflow}`,
    `<a href="${siteUrl}/dashboard/links">Affiliate Links verwalten</a>`,
    `<i>${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`,
  ].join('\n');

  await sendTelegramAlert(orphanMsg);             // sendTelegramAlert ist bereits importiert
}

// und im logCron(...)-Aufruf zusaetzlich: orphan_count: orphan.orphanCount
```

Hinweise zur Umsetzung:
- getOrphanSlugs() sollte das Ergebnis cachen (z.B. 60s, analog MCP-Tool), damit das MDX-Scanning
  den 02:00-Cron nicht spuerbar verlangsamt.
- Alternativ als eigener Cron (/api/cron/orphan-check, woechentlich) statt Huckepack auf
  check-links — sauberere Trennung, falls das MDX-Scanning teuer wird.
- Schwellwert via system_settings (orphan_alert_threshold) konfigurierbar machen, damit
  bewusst tolerierte Gruppe-B-Slugs nicht dauerhaft alarmieren — oder eine Allowlist der
  bekannten Gruppe-B/C-Slugs gegen die Orphan-Liste diffen und nur neue melden.

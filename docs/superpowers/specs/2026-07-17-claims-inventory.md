# Claims-Inventar — SmartFinPro Vertrauensseiten

**Erstellt:** 2026-07-17 · **Status:** Vertrag für Task 8 des Plans [`2026-07-17-editorial-integrity-remediation.md`](../plans/2026-07-17-editorial-integrity-remediation.md)

Dieses Dokument ist die **einzige Quelle der Wahrheit** darüber, was SmartFinPro über sich behaupten darf. Jede Aussage auf `/integrity`, `/review-policy`, `/editorial-policy`, `/methodology`, `/corrections-policy` und `/about` muss auf eine Zeile hier zurückführbar sein, deren Verdikt `WAHR` lautet.

> **Für den ausführenden Agenten:** Du darfst keine Aussage schreiben, die nicht unten mit `WAHR` steht. Wenn dir eine Formulierung besser klingt, aber hier keine Deckung hat — **schreib sie nicht**. Genau dieser Impuls hat den Schaden verursacht, der hier behoben wird. Im Zweifel: weglassen.

---

## Trennlinie

**ERLAUBT**
- Unternehmerisches „wir" für die **SmartFin Value LLC**. Eine Firma darf von sich in der Wir-Form sprechen, auch wenn eine Person dahintersteht.
- Beschreibung des **tatsächlich ablaufenden** Prozesses.
- Eigene redaktionelle Bewertung („wir bewerten X mit 8,2/10") — das ist eine Meinung, keine Tatsachenbehauptung über Dritte.
- Anonymität des Inhabers. Das Impressum nennt die LLC, Adresse und Kontakt. **Das genügt und bleibt unverändert.**

**VERBOTEN**
- Benannte Personen, die nicht existieren.
- Berufstitel ohne Träger (CFA, CFP, AFA, CPA, CISI, CIM, CMT, ACA).
- Prüfschritte, die niemand ausführt (Hands-on-Tests, Konteneröffnung, Fact-Checking durch Menschen).
- Zertifizierungen ohne Zertifikat.
- `AggregateRating` ohne echte Bewerter. Die vorhandene `AggregateRatingSchema`-Komponente wird **nicht** ausgeliefert und darf nie mit den Werten aus #24a/#24b verdrahtet werden.
- Gründungs-/Bestehensdaten, die nicht belegt sind.
- Fremde Bewertungen als eigene Produktbewertungen ausgeben (App-Bewertung ≠ Produktbewertung).
- Geplante Prozesse im Präsens. Zusagen gehören ins Futur.

**Der Maßstab ist „wahr", nicht „nachprüfbar".** Dass eine Aussage schwer zu prüfen ist, ist kein Grund sie zu treffen — sondern nur die Hoffnung, nicht erwischt zu werden. Entschieden mit dem Betreiber am 2026-07-17.

---

## Faktenlage (in Session 2026-07-16/17 verifiziert)

| Sachverhalt | Befund | Beleg |
|---|---|---|
| Betreiber | SmartFin Value LLC, Wyoming — **eine Person**, kein Team, kein Board | Nutzerangabe 2026-07-17 |
| Reviewer-Personas | **27 erfunden**, über 216 MDX | `grep reviewedBy content/` |
| CFA / CFP / AFA / CPA behauptet | 167 / 44 / 42 / 7 Seiten | dito |
| Titel als JSON-LD an Google | `EducationalOccupationalCredential` ×2, `Person` ×4 | Live-Abruf AU-Pillar |
| Inhaltserstellung | **KI-generiert** über Genesis-Pipeline (Claude API) | `app/api/genesis/*`, CLAUDE.md |
| Hands-on-Tests / Konteneröffnung | **findet nicht statt** | Nutzerangabe |
| Produktdaten (Cockpits) | **273 Zeilen**, alle mit `data_verified_at` (2026-06-27 – 2026-07-11), `source_url`, `source_type` (262 `official`, 6 `editorial`), `confidence` (76 high / 161 medium / 31 low) | `product_attributes` |
| Re-Verifikation der Produktdaten | **kein Automatismus** — einmaliger Durchgang Jun/Jul 2026 (`scripts/apply-cockpit-seed.mjs`) | `freshness-check` fasst `product_attributes` nicht an |
| `freshness-check`-Cron | scannt **MDX-Frontmatter-Daten**, flaggt Artikel > 180 Tage, schreibt `content_freshness`, Telegram-Alert. Läuft täglich 05:00, 47 Logs | Route-Header + `cron_logs` |
| Bewertungssystem | **echt**: 273/273 mit `score` + `sub_scores`, z. B. `{"ux":8.4,"fees":8.0,"support":7.8,"features":8.2}` | `product_attributes` |
| Site-Alter | **2026** — erster Commit 2026-03-11, ältestes MDX-`publishDate` 2026-01-10 | `git log`, `content/` |
| `review_count` — **Cockpit-Daten** | **NICHT erfunden, aber falsch zugeordnet.** 273 Zeilen. Es sind **App-Store-Bewertungen der Banking-App** des Anbieters, im Seed ehrlich dokumentiert (`review_source: 'App Store iOS'`, `app_store_rating`). Werte gerundet (3.500.000 statt exakt). `source_url` zeigt auf die Marketing-Seite und **belegt den Wert nicht**. | `scripts/seed-credit-card-companies.mjs:23ff`, `product_attributes` |
| `review_count` — **8 MDX** | **ERFUNDEN.** `schema.review_count` sitzt auf **Kategorie-Indizes** (`au/superannuation/index.mdx`: 328) und **Vergleichsartikeln** (`etoro-vs-robinhood.mdx`: 48567). Für „328 Bewertungen einer Kategorieseite" existiert keine mögliche Quelle. Genesis-generiertes Frontmatter. | 8 MDX |
| `AggregateRating`-JSON-LD | **wird NICHT ausgeliefert** — 0 Vorkommen auf allen geprüften Seiten. Exposure geringer als zunächst angenommen. | Live-Abruf ×3 |
| Sichtbare Darstellung | **beide erscheinen als Text**: Cockpit „3,500,000 reviews / 2,500,000 reviews / 1,800,000 reviews", eToro-Vergleich „48,567 Ratings" | Live-Abruf |
| Veröffentlichte Korrekturen | **keine, nie** | Betreiber-Auskunft 2026-07-17 |
| Registrierungsprüfung (FCA/ASIC/CIRO/SEC) | **findet derzeit nicht statt** — als gemeinsame Aufgabe geplant | Betreiber-Auskunft 2026-07-17 (⚠️ Rückfrage offen, s. u.) |

**Reichweiten-Warnung für Task 8:** Die strukturierten Produktdaten decken die **273 Cockpit-Produkte** ab, **nicht** die 216 MDX-Review-Artikel. Jede Methodik-Aussage muss ihren Geltungsbereich nennen. „Every factual claim is verified" ist selbst dann falsch, wenn die Cockpit-Daten sauber sind.

---

## Inventar

| # | Seite | Aussage (wörtlich) | Realität | Verdikt | Aktion |
|---|---|---|---|---|---|
| 1 | /integrity | „Our **Professional Expert Board**" | Existiert nicht. | **FALSCH** | ersatzlos streichen |
| 2 | /integrity | „every category is **overseen by our Expert Board**" | Niemand beaufsichtigt. | **FALSCH** | ersatzlos streichen |
| 3 | /integrity | „composed of **distinguished specialists** with deep, region-specific expertise" | Existieren nicht. | **FALSCH** | ersatzlos streichen |
| 4 | /integrity | „**Expert Fact-Checked**" (Badge) | Kein Mensch prüft. | **FALSCH** | ersatzlos streichen |
| 5 | /integrity | „**Certified: March 2026**" | Keine Zertifizierung existiert, kein Zertifizierer. | **FALSCH** | ersatzlos streichen |
| 6 | /integrity | „validates every data point mathematically and **through expert review**" | Der mathematische Teil trifft zu; „expert review" nicht. | **TEILWEISE** | „through expert review" streichen, Rest prüfen |
| 7 | /integrity | „**fully automated**, transparent, and auditable" | Trifft zu — Pipeline ist automatisiert. | **WAHR** | bleibt |
| 8 | /review-policy | „**30–90 Day Hands-On Testing** — Our reviewers create real accounts and use products during normal conditions" | Findet nicht statt. Es gibt keine Reviewer. | **FALSCH** | ersatzlos streichen |
| 9 | /review-policy | „**Every factual claim** is verified against primary sources: regulator databases, provider terms, official pricing pages, and **direct product testing**" | Cockpit-Daten: 262/273 `official` mit Quell-URL — trifft zu. „Every factual claim" über 216 KI-Artikel: nein. „direct product testing": nein. | **TEILWEISE** | auf Cockpit-Daten begrenzen, „direct product testing" streichen |
| 10 | /review-policy | „We verify **FCA/ASIC/CIRO/SEC-FINRA registrations** before inclusion" | **Im richtigen Zuschnitt WAHR** (Betreiber, 2026-07-17): Für die tatsächlich verlinkten Anbieter — Mercury und Silver Gold Bull — wurde die Registrierung geprüft. Für künftige Aufnahmen ist die Prüfung verbindlich zugesagt. Der Fehler lag im **Geltungsbereich**, nicht in der Aussage. | **WAHR (umformuliert)** | Neu: „**We verify the regulatory registration of every provider we link to.**" — Bezug auf verlinkte Anbieter, nicht auf alle 273 Datensätze. Künftige Aufnahmen im **Futur** als Zusage, nie als Bilanz. |
| 11 | /review-policy | „Independence — Editorial decisions are made independently from affiliate relationships" | Trifft zu; Ranking folgt `score`/`sub_scores`. | **WAHR** | bleibt |
| 12 | /methodology | „grounded in **real-world testing**" | Findet nicht statt. | **FALSCH** | ersatzlos streichen |
| 13 | /methodology | „undergoes a **rigorous, multi-step evaluation process**" | Es gibt einen Prozess, aber „rigorous" ist unbelegte Selbstauszeichnung. | **TEILWEISE** | Prozess sachlich beschreiben, Wertung streichen |
| 14 | /methodology | „weighted **1-5 star** rating system … **five key criteria** (Features 30%, Ease of Use 20%, …)" | Reale Daten: **vier** Sub-Scores auf **0–10**-Skala (`ux/fees/support/features`). Die Seite beschreibt ein anderes System als das implementierte. | **FALSCH** | an die reale Implementierung anpassen |
| 15 | /methodology | Bewertungen existieren und sind strukturiert | 273/273 mit `score` + `sub_scores`. | **WAHR** | bleibt, als **eigene redaktionelle** Bewertung ausweisen |
| 16 | /corrections-policy | „We **never quietly edit away mistakes** — we acknowledge them" | **Nie eine Korrektur veröffentlicht** (Betreiber, 2026-07-17). Als Bilanz über vergangenes Verhalten damit unbelegt. | **FALSCH als Bilanz** | in die Zukunft formulieren: „When we get something wrong, we will…" — keine Behauptung über Vergangenes |
| 17 | /corrections-policy | Korrektur-Klassen + „[Updated YYYY-MM-DD]"-Verfahren | Verfahrensbeschreibung, umsetzbar. | **WAHR** | bleibt (als Policy) |
| 18 | /about | „**Since 2024**, SmartFinPro has been the trusted voice" | Erster Commit **2026-03-11**, ältestes Inhaltsdatum **2026-01-10**. Um ~2 Jahre falsch. | **FALSCH** | **ersatzlos streichen** (Betreiber-Entscheidung 2026-07-17) — kein Ersatzdatum, Alter ist kein Argument |
| 19 | /about | „Our team of **certified financial professionals — including CFP®, CFA®, and FCA-regulated advisers** — evaluates products" | **Schärfste Aussage der Site.** Kein Team, keine Zertifizierten, keine FCA-Regulierung. ®-Zeichen ruft die eingetragenen Zertifizierungsmarken explizit auf. | **FALSCH** | ersatzlos streichen — **höchste Priorität** |
| 20 | /about | „rigorous fact-checking" | Kein Mensch prüft. | **FALSCH** | ersatzlos streichen |
| 21 | /about | „strict editorial independence … transparent methodologies" | Trifft zu, sofern die Methodik ehrlich beschrieben ist. | **WAHR** | bleibt |
| 22 | /imprint | „We operate as an **affiliate publisher** — we do not provide financial advice, manage client funds, or hold any financial services licences" | Trifft zu. | **WAHR** | **unverändert** |
| 23 | /imprint | Legal Entity / Adresse / Regulierungshinweise (FTC, FCA, CIRO, AFSL) | Vollständig und korrekt. | **WAHR** | **unverändert** |
| 24a | Cockpits (273) | sichtbar: „Chase — 4.8 ★, **3,500,000 reviews**" | Der Wert ist **echt**, aber es ist die **App-Store-Bewertung der Banking-App**, nicht des Kreditkartenprodukts. Der Leser versteht „3,5 Mio. bewerteten diese Kreditkarte". Gerundet; `source_url` belegt ihn nicht. | **FALSCH ZUGEORDNET** (nicht erfunden) | Zwei zulässige Wege: **(a)** entfernen, oder **(b)** exakt beschriften — „Chase Mobile app: 4.8★, ~3.5M App Store ratings" + `source_url` auf das App-Store-Listing. **Nie** als Bewertung des Finanzprodukts. **Nie** als `AggregateRating`. |
| 24b | 8 MDX | sichtbar: „**48,567 Ratings**" (eToro-vs-Robinhood); `schema.review_count: 328` auf `au/superannuation/index.mdx` | **Erfunden.** Kategorie-Index und Vergleichsartikel haben keine Bewerter. Keine mögliche Quelle. | **FALSCH** | `schema.rating` + `schema.review_count` **ersatzlos entfernen**. Kein Ersatzwert, keine Schätzung. |
| 24c | JSON-LD | `AggregateRating` | Wird **nicht** ausgeliefert (0 Vorkommen live). | **kein Befund** | `AggregateRatingSchema`-Komponente bleibt ungenutzt — darf nie mit 24a/24b-Daten verdrahtet werden. |
| 25 | 216 MDX | `reviewedBy: '<Name>, CFA, …'` | 27 erfundene Personen mit geschützten Titeln. | **FALSCH** | Task 5: ersatzlos entfernen |
| 26 | 216 MDX | `author: 'SmartFinPro AU Finance Team'` | Kein Team. | **FALSCH** | → `SmartFinPro Research` |
| 27 | JSON-LD | `Person` + `EducationalOccupationalCredential` | Maschinenlesbare Titel-Behauptung an Google. | **FALSCH** | Task 3: → `Organization` |

---

## Was WAHR ist — die Bausteine für den Neutext

Diese Aussagen sind belegt und dürfen verwendet werden. **Nur diese.**

> **Positionierung (Betreiber-Entscheidung 2026-07-17):** Optimale Selbstdarstellung ist ausdrücklich gewollt — **mit dem echten Material**. Der stärkste Trumpf sind die **ausgewiesenen Konfidenzstufen**: Kein Vergleichsportal legt freiwillig offen, dass 31 seiner Datenpunkte niedrige Konfidenz haben. Das gehört nach vorne, nicht ins Kleingedruckte. Selbstbewusst formulieren — aber jede Aussage aus dieser Liste.

1. Herausgeber ist die **SmartFin Value LLC** (Wyoming, USA), ein kleiner unabhängiger Betrieb. Kein Newsroom, kein Beirat.
1b. **Für jeden Anbieter, den wir verlinken, prüfen wir die regulatorische Registrierung** (FCA / ASIC / CIRO / SEC-FINRA). Derzeit verlinkt: Mercury, Silver Gold Bull. Für künftige Aufnahmen gilt dieselbe Prüfung — als Zusage im Futur formulieren.
1c. **App-Store-Bewertungen sind zulässig, wenn exakt beschriftet**: „Chase Mobile app: 4.8★, ~3,5 Mio. App-Store-Bewertungen (iOS)" — mit `source_url` auf das App-Store-Listing. **Nie** als Bewertung des Finanzprodukts, nie ohne das Wort „app".
2. Für die Vergleiche werden **273 Produkte** in einer strukturierten Datenbank geführt — je Eintrag mit **Quell-URL**, **Prüfdatum** und **Konfidenzstufe** (76 hoch / 161 mittel / 31 niedrig).
3. **262 von 273** Einträgen stammen aus **offiziellen Quellen** (Anbieter-Preisseiten, Bedingungen, Regulierungsregister).
4. Bewertungen sind **eigene redaktionelle Einschätzungen** aus vier Teilwerten — `features`, `fees`, `ux`, `support` — auf einer 0–10-Skala. **Keine Nutzerumfrage.**
5. Inhalte werden **KI-gestützt** aus diesen Quellen erstellt und redaktionell freigegeben.
6. Ein täglicher Automatismus **überwacht das Alter der Artikel** und meldet Inhalte über 180 Tage zur Überarbeitung.
7. **Affiliate-Provisionen** fließen; sie beeinflussen kein Ranking — Ranglisten entstehen aus denselben Kriterien für jedes Produkt.
8. Was vom Anbieter stammt und nicht von uns, wird als solches gekennzeichnet.

## Was explizit gesagt werden sollte

Nicht nur Weglassen — aktiv klarstellen, weil es die Erwartung korrigiert:

> We do not open accounts with the providers we compare, and we do not claim to. Our assessments are based on published information from official sources, not on hands-on account testing.

---

## Korrektur am Plan-Entwurf

Der Textvorschlag in Task 8 des Plans enthält den Satz „**we re-check it on a schedule**". **Das ist falsch** und wäre eine neu eingeführte Unwahrheit: `freshness-check` überwacht Artikelalter, **nicht** die Produktdaten. Die `data_verified_at`-Werte stammen aus einem einmaligen Durchgang (2026-06-27 bis 2026-07-11).

Zulässige Ersatzformulierung:

> Every attribute carries the date we last checked it and a link to the source, so you can see how current it is. A daily job flags articles older than 180 days for review.

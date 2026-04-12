# SEO Optimization Plan — 6-Wochen-Sprint
> Start: 13. April 2026 | Domain-Alter: ~32 Tage | Indexed Pages: ~384

## Baseline (Tag 0 — 12. April 2026)
> Fill these values from GSC + Dashboard after first sync-rankings run

| KPI | Baseline | Woche 3 | Woche 6 |
|-----|----------|---------|---------|
| GSC Impressions (7d) | _TBD_ | | |
| GSC Clicks (7d) | _TBD_ | | |
| GSC Avg Position | _TBD_ | | |
| Indexed Pages | 384 | | |
| Non-brand Clicks (7d) | _TBD_ | | |
| Keywords in Top 10 | _TBD_ | | |
| Keywords in Top 20 | _TBD_ | | |
| Keywords in Top 50 | _TBD_ | | |
| Tracked Keywords | 10 → 120+ | | |
| Referral Traffic (Reddit/Medium) | 0 | | |
| Revenue per 1k Sessions | _TBD_ | | |

## Phase 1: Technische Bereinigung (Woche 1 — 13.–19. April)
- [x] noindex auf 28 Broker-Template-Seiten
- [x] noindex auf leere Kategorie-Seiten (automatisch)
- [x] noindex auf 3 Coming-Soon-Tool-Seiten
- [x] Sitemap bereinigt (Broker + Coming-Soon entfernt)
- [x] Keyword-Tracking von 10 → 120+ erweitert
- [x] sync-rankings Cron erstellt (täglich 3:30 AM UTC)
- [ ] VPS crontab: sync-rankings eintragen (SSH nötig — siehe Crontab-Einträge unten)
- [ ] Sitemap in GSC neu einreichen (GSC → Sitemaps → smartfinpro.com/sitemap.xml)
- [x] noindex auf Live-Site verifiziert (4/4 Stichproben: etoro-us, etoro-uk, ibkr-ca, debt-payoff — alle noindex,follow)
- [ ] Baseline-KPIs aus GSC erfassen (Dashboard → Ranking → Screenshot machen)

### Go-Kriterien Woche 1
- [x] 100% der Zielseiten liefern noindex (verifiziert via curl + cachebust)
- [ ] Sitemap ohne kritische Fehler angenommen
- [x] 120 Keywords aktiv im Monitoring (seeded am 12.04.2026)
- [ ] Baseline dokumentiert

## Phase 2: Top-20 Seiten Qualitätshub (Woche 2-3 — 20. April–3. Mai)

### Priorisierte Top-20 Seiten (CPA × Content-Qualität × Markt-Potenzial)

| # | Seite | Markt | CPA | Wörter | Priorität |
|---|-------|-------|-----|--------|-----------|
| 1 | `/us/trading/interactive-brokers-review` | US | $200 | 7,535 | Höchster CPA |
| 2 | `/uk/trading/interactive-brokers-review` (falls existiert) | UK | $150 | - | Zweithöchster CPA |
| 3 | `/us/trading/etoro-review` | US | $100 | 4,376 | Hoher CPA, kurz → erweitern |
| 4 | `/uk/trading/etoro-review` | UK | $80 | - | Cross-Market |
| 5 | `/us/business-banking/mercury-review` (falls existiert) | US | $100 | - | Hoher CPA, Business |
| 6 | `/us/personal-finance/wealthfront-review` | US | $75 | 8,250 | Starker Content |
| 7 | `/us/personal-finance/betterment-review` | US | $50 | 8,988 | Umfangreichster Review |
| 8 | `/us/personal-finance/sofi-review` | US | $50 | 9,110 | Sehr umfangreich |
| 9 | `/ca/trading/questrade-forex-review` | CA | $50 | 8,448 | CA-Marktführer |
| 10 | `/us/personal-finance/empower-review` | US | $50 | 8,432 | Robo-Advisor |
| 11 | `/us/trading/fidelity-review` | US | $60 | 9,525 | Längster Review |
| 12 | `/us/trading/charles-schwab-review` | US | $60 | 8,380 | Top-Broker |
| 13 | `/us/cybersecurity/nordvpn-review` | US | $30/mo | 8,785 | Recurring Revenue |
| 14 | `/us/ai-tools/chatgpt-for-finance-review` | US | $40/mo | 8,699 | AI Trending |
| 15 | `/us/forex/interactive-brokers-forex-review` | US | $200 | 8,904 | Höchster CPA, Forex |
| 16 | `/us/forex/forex-com-review` | US | - | 9,225 | Umfangreich |
| 17 | `/us/trading/robinhood-review` | US | - | 8,645 | Hohes Suchvolumen |
| 18 | `/us/business-banking/relay-review` | US | $75 | 8,568 | Business Banking |
| 19 | `/uk/savings/best-high-yield-savings-uk` | UK | $45 | 4,375 | UK Nische |
| 20 | `/au/trading/cmc-markets-review` | AU | $80 | 8,989 | AU-Marktführer |

### Qualitäts-Checkliste pro Seite
- [ ] Pro Seite: unique Markt-Intro (nicht Template-Text)
- [ ] Bessere interne Links (min. 5 kontextuelle Links pro Seite)
- [ ] E-E-A-T Signale: Autoren-Seiten, LinkedIn, Editorial Policy
- [ ] Schema.org + Canonical QA (0 Fehler)
- [ ] Review-/Fact-Update-Log sichtbar machen
- [ ] Unique "Why We Recommend" Absatz mit First-Hand Experience
- [ ] Competitor-Vergleich (vs. 2-3 Alternativen) mit internen Links

### Go-Kriterien Woche 2-3
- [ ] 20/20 Seiten mit Qualitäts-Checkliste durch
- [ ] 0 kritische Schema-/Canonical-Fehler
- [ ] Alle Money-Pages mit Autor-/Review-Transparenz

## Phase 3: Backlink-System aktivieren (Woche 4 — 4.–10. Mai)
- [ ] Reddit OAuth2 Credentials einrichten
- [ ] Medium Integration Token generieren
- [ ] Credentials in system_settings eintragen
- [ ] Start mit niedrigem Takt (3-5 Posts/Tag)
- [ ] Nur hochwertige, nicht-spammige Placements

### Go-Kriterien Woche 4
- [ ] 8-12 saubere Placements
- [ ] Referral-Traffic > 0
- [ ] Keine manuellen Maßnahmen/Warnungen in GSC

## Phase 4: Gewinner ausbauen (Woche 5 — 11.–17. Mai)
- [ ] Auswertung: welche Seiten/Cluster reagieren
- [ ] Gewinnerseiten weiter optimieren
- [ ] Schwache Seiten konsolidieren/noindex beibehalten

### Go-Kriterien Woche 5
- [ ] Non-brand Impressions +5-10% vs. Baseline
- [ ] Keywords in Top-50 deutlich gestiegen
- [ ] CTR stabil oder verbessert

## Phase 5: Skalierungsentscheidung (Woche 6 — 18.–24. Mai)
- [ ] Voll-Review: SEO + Revenue + Linkqualität
- [ ] Entscheidungsmatrix: Was skalieren? Was stoppen?

### Go-Kriterien für Skalierung
- [ ] Non-brand Clicks +10-20% vs. Baseline
- [ ] Mindestens ein Cluster zeigt Ranking-Aufwärtstrend
- [ ] Kein Qualitäts-/Spam-Rückfall

## Wöchentliche Routine
- **Montag:** KPI-Review + Prioritäten
- **Mittwoch:** Qualitäts-Checks (Top-Seiten)
- **Freitag:** Backlink-/Index-Status
- **Sonntag:** Go/No-Go Entscheidung

## Crontab-Einträge (VPS — manuell eintragen via SSH)
```bash
# sync-rankings — Daily 3:30 AM UTC (seed keywords + GSC sync)
30 3 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-rankings >> /home/master/applications/brvnvntpcj/public_html/logs/cron.log 2>&1

# insight-engine — Sunday 4:00 AM UTC (weekly cross-analysis)
0 4 * * 0 curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/insight-engine >> /home/master/applications/brvnvntpcj/public_html/logs/cron.log 2>&1

# auto-executor — Daily 5:00 AM UTC (risk-tiered action execution)
0 5 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/auto-executor >> /home/master/applications/brvnvntpcj/public_html/logs/cron.log 2>&1

# feedback-loop — Daily 22:00 UTC (outcome measurement + learnings)
0 22 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/feedback-loop >> /home/master/applications/brvnvntpcj/public_html/logs/cron.log 2>&1
```

## Backlink-Credentials einrichten (Phase 3 Vorbereitung)

### Reddit OAuth2
1. Geh auf https://www.reddit.com/prefs/apps
2. Klick "create another app"
3. Typ: "script"
4. Name: "SmartFinPro Content" (o.ä.)
5. Redirect URI: http://localhost:8080 (egal, wird nicht gebraucht)
6. Du bekommst: `client_id` (unter App-Name) + `client_secret`
7. In Supabase `system_settings` eintragen:
   - `reddit_client_id` = dein client_id
   - `reddit_client_secret` = dein client_secret
   - `reddit_username` = dein Reddit-Username
   - `reddit_password` = dein Reddit-Passwort

### Medium Integration Token
1. Geh auf https://medium.com/me/settings/security
2. Klick "Integration tokens"
3. Token generieren
4. In Supabase `system_settings` eintragen:
   - `medium_api_token` = dein Token

---
# COPY this file to content/research-notes/<sector>/<slug>.mdx and fill in.
# Filename = slug. All numeric data MUST be verified (see README) — no invented figures.
type: "research"
title: "<Company> (<TICKER>) Research Note"
seoTitle: "<Company> (<TICKER>) Research Note 2026 | SmartFinPro"
description: "<One-sentence summary: consensus, technical levels, valuation, catalysts, broker routes for US and Canadian investors.>"
author: "SmartFinPro Research Desk"            # use a real, credentialed author for E-E-A-T / MAR
publishDate: "YYYY-MM-DD"
modifiedDate: "YYYY-MM-DD"
sector: "<sector>"                              # e.g. gold-mining  (matches folder name)
slug: "<slug>"                                  # e.g. newmont-nem
ticker: "<TICKER>"
exchanges: ["NYSE", "TSX"]
markets: ["us", "ca"]                           # US + English-Canada only
ratingSource: "consensus"                       # NEVER a house rating
ratingLabel: "BUY"                              # the ANALYST CONSENSUS label, attributed
consensusAnalysts: 0
currentPriceUsd: 0
currentPriceCad: 0
currentPriceEur: 0
priceTargetUsd: 0
priceTargetCad: 0
priceTargetEur: 0
upsidePotential: 0
marketCapUsd: 0
forwardPe: 0
dividendYield: 0
as_of: "YYYY-MM-DD"                             # visible "data as of" date — required
next_review: "YYYY-MM-DD"                       # freshness cron alerts when this passes — required
dataSources:                                    # license-clean only — NO Bloomberg
  - "Finviz"
  - "SEC Filings"
  - "Public Aggregation"
brokers:                                        # only slugs ACTIVE in affiliate_links
  - "interactive-brokers"
summary: "<2-sentence neutral thesis + the main risk.>"
sections:
  - { id: "investment-thesis", title: "Investment Thesis" }
  - { id: "key-data", title: "Key Data" }
  - { id: "technical-levels", title: "Technical Levels" }
  - { id: "quarterly-results", title: "Latest Results" }
  - { id: "peer-comparison", title: "Peer Comparison" }
  - { id: "scenarios", title: "Scenarios" }
  - { id: "catalysts-risks", title: "Catalysts and Risks" }
  - { id: "valuation", title: "Valuation" }
  - { id: "bottom-line", title: "Bottom Line" }
  - { id: "faq", title: "FAQ" }
faqs:
  - question: "Why does this page use analyst consensus instead of a house rating?"
    answer: "SmartFinPro attributes the headline view to public analyst aggregation rather than a personalized recommendation, which keeps the content as general commentary."
hasInvestmentContent: true                      # triggers the equity risk + compliance framing
---

{/* COMPLIANCE RULES (keep): consensus-attributed, NOT a house call. Technical
levels are DESCRIPTIVE only — no "build X% position", no stop-loss instructions.
Frame entry zones as observations ("a level some technical analysts watch").
Cross-link to relevant SmartFinPro pillars (US/CA gold, trading, CA forex). */}

<Info>
This note complements SmartFinPro&apos;s [US gold investing guide](/us/gold-investing) and [Canada gold investing guide](/ca/gold-investing). It is general market commentary, not a tailored recommendation.
</Info>

<h2 id="investment-thesis">Investment Thesis</h2>

{/* thesis paragraphs (verified facts only) */}

<h2 id="key-data">Key Data</h2>

| Metric | USD (NYSE) | CAD (TSX) | EUR | Source |
| --- | ---: | ---: | ---: | --- |
| Current price | | | | Finviz |

{/* …remaining sections per `sections` above. Every figure must be verifiable. */}

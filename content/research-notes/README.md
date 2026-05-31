# SmartFinPro Research — Content Notes

> **This folder holds the PUBLISHED research notes** rendered at `smartfinpro.com/research/[sector]/[slug]`.
> ⚠️ Do NOT confuse with `content/research/` — that is the **Genesis Hub research-brief INPUT** folder. They are different.

## Layout
```
content/research-notes/
├── README.md            # this file (ignored by the loader)
├── _TEMPLATE.md         # copy-paste skeleton (ignored: not .mdx, not in a sector dir)
└── <sector>/            # e.g. gold-mining/
    └── <slug>.mdx       # e.g. agnico-eagle-aem.mdx  → /research/gold-mining/agnico-eagle-aem
```
The loader (`lib/research/index.ts`) only reads `.mdx` files inside **sector subdirectories**. Root-level files (README, _TEMPLATE) are ignored, as is the freshness cron and sitemap.

## How to add a note (replicable process)
1. **Get verified data first.** Run the research in Cowork/Perplexity (as was done for AEM). **Never invent prices, targets, or financials** — every number is published as fact and carries liability. Use license-clean sources (company filings, SEC/SEDAR, public consensus aggregation). **No Bloomberg republishing.**
2. Copy `_TEMPLATE.md` → `content/research-notes/<sector>/<slug>.mdx`, fill the frontmatter + body.
3. Keep the **compliance framing** exactly (see _TEMPLATE): consensus attribution (never a house rating), descriptive technical language (no "build X% position" / stop-loss instructions), `as_of` + `next_review`, US + Canada scope.
4. `brokers:` — only include slugs that are **active in `affiliate_links`**. `interactive-brokers` is active; add `questrade-ca` only once its DB slug is live.
5. Cross-link: add a hard internal link from the relevant **pillar** pages (e.g. `content/us/gold-investing/index.mdx`) — **pillars only**, never review/comparison pages (those trigger the quality-gate cascade per AGENTS.md).
6. Verify: `npm run check:mdx`, `npm run check:imports`, `npx tsc --noEmit`.

## Compliance is not optional
US + English-Canada only. NI 31-103 §8.25 (general-advice exemption) framing; not a FINRA 2241 report; conflict-of-interest disclosure at every broker CTA; Quebec/Loi 96 French notice. Legal sign-off (Canadian securities counsel + US view) is required before scaling beyond the pilot.

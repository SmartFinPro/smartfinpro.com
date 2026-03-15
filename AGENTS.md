# SmartFinPro — Agent Instructions
> **Version 1.0 | März 2026**
> Ergänzt CLAUDE.md. Beide Dateien gelten gemeinsam.

---

## Mandatory Review Content Quality Gate (Always-On)

Applies to every change on review/comparison pages (`content/**` MDX + related SEO/layout/schema files).

### Required post-edit checks (must run automatically)

**1. SEO meta quality**
- `title` intent-strong, non-generic — **length: 45–60 chars** (green range)
- `description` length: **140–160 chars** (green range)
- `modifiedDate` and `dataVerifiedDate` updated to current date

**2. Document structure**
- Exactly one `H1`
- Logical `H2/H3` hierarchy
- TOC/anchor IDs present and valid

**3. Link quality targets (when context allows)**
- Internal links target: `>= 8`
- External authority links target: `>= 6`
- No broken/internal 404 links introduced

**4. Content quality**
- Strengthen E-E-A-T signals (method, risk notes, recommendation clarity)
- No keyword stuffing
- Keep premium-professional tone consistent with existing design language

**5. SEO/Schema integrity**
- JSON-LD valid, no missing required fields
- Correct canonical/hreflang behavior
- Avoid structural duplicates (e.g., duplicate H1/schema spam)

**6. Quality target**
- Page quality score target: `>= 90`
- If below target, perform focused optimization loop automatically until target is met or clearly blocked

**7. Verification commands (minimum)**
- `npx tsc --noEmit`
- `npx vitest run` (relevant scope minimum)
- `npx next build` when routing/SEO/rendering is affected

### Reporting (required in final response)

- Files changed
- Before/after key metrics (word count, meta length, internal/external links, score)
- Build/test status
- Commit hash

### Constraints

- No unnecessary refactors
- Edit only relevant files
- No design-system changes unless explicitly requested

---

## Internal Link Scoring Reference (lib/actions/content-hub.ts)

```
L = min(internalLinks, 8) × 7  +  min(externalLinks, 6) × 7  (cap 100)
C = min(componentCount, 6) × 12  +  min(imageCount, 4) × 7   (cap 100)
Quality = W×0.30 + S×0.25 + L×0.20 + C×0.25
```

**Green thresholds:** Title 45–60 chars · Description 140–160 chars · W: 4000–7000 words = 100 · L: 8 internal + 6 external = 98 · C: 6 tracked components + 4 images = 100

**Tracked MDX components for C-score:**
`<TrustAuthority>` · `<ExpertBox>` · `<Rating>` · `<AffiliateButton>` · `<ExecutiveSummary>` · `<CollapsibleSection>` · `<ComparisonTable>` · `<SimpleComparison>` · `<BrokerComparison>` · `<EnterpriseTable>` · `<FAQ>` · `<Pros>` · `<Cons>` · `<Info>` · `<Warning>` · `<Tip>` · `<EvidenceCarousel>` · `<NewsletterBox>` · `<WinnerAtGlance>`

---

*SmartFinPro.com | AGENTS.md | v1.0 | März 2026*

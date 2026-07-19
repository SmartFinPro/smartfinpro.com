# Apply-Log — Research Library data foundation (us/trading/trading-platforms)

**Applied:** 2026-07-19 13:30 CEST
**Project:** SmartFinPro (prod, ref `devkeyhniwdxsqvoscdu`, org wmcons, branch `main PRODUCTION`)
**Branch:** `feat/research-library-pilot` — commits ad77655, d42eed8, 6fff156, a7fd814, 323260a
**Method:** Supabase Dashboard SQL Editor (Claude-in-Chrome; each migration base64→Monaco `setValue`,
content verified in-editor before Run; comment lines stripped, executable SQL identical to file).

## Migrations applied (in order)
1. `20260718100000_audit_trading_platforms_options.sql` (T0b) — eToro exclusivity-claim + $100→$50 min fix. Success.
2. `20260719120000_research_data_contract.sql` (schema: research_status / methodology_version / research_sources + CHECKs). Success.
3. `20260719130000_seed_trading_research_sources.sql` (research_sources + methodology_version + research_status; 8 audited-intent, eToro provisional). Success.
4. `20260719140000_seed_trading_confidence_reasons.sql` (attributes.confidence_reason for the 8 audited rows). Success.

## Verified end-state (read-only, service key)
- T0b: eToro confidence=medium, account_minimum=50, confidence_reason set; **no mass overwrite** (only eToro's tagline changed).
- Columns present; 9 rows selectable.
- Runtime classification (`scripts/research/verify-trading-research-state.mjs`, exit 0):
  **8 audited / 1 provisional / 0 unavailable** — eToro the only provisional (extended_hours low/open, 3/4 sourced);
  no audited row missing 4/4 sources or confidence_reason.
- Global scope: exactly 9 rows have research_status set, **none outside** us/trading/trading-platforms.

## Rollback reference
- Pre-apply snapshot: `docs/superpowers/plans/data/2026-07-19-trading-research-pre-apply-snapshot.json`.
- Each migration carries a documented ROLLBACK block (commented, run manually).

## Follow-ups (not done here)
- **Cockpit SSG revalidation / redeploy** — T0b changed eToro's cockpit-visible fields (tagline/pros/cons/min);
  the live cockpit is SSG (1-day revalidate) and will reflect T0b on next regeneration/redeploy.
- **Research Library UI** = Step 3 (P7–P10) — not yet built; the research_* data has no rendering surface yet.

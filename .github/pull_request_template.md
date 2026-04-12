## Summary

<!-- What does this PR do? Why? -->

## Changes

<!-- List key files changed and what was changed -->

## Test plan

<!-- How was this tested? -->

---

## Pre-merge checklist

- [ ] `npm run refresh:agent-context` ran — no drift (memory/generated/ up to date)
- [ ] `npm run check:claude-stats` green — CLAUDE.md counts + names match generated indexes
- [ ] `npm run test:dashboard-smoke` green — all 5 fixture-backed dashboard tests pass

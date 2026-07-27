# PR 1 Baseline — Unified Research Discovery

Recorded 2026-07-27, worktree `.worktrees/research-discovery-pr1`,
branch `codex/research-discovery-pr1` @ `a8868a6` (= origin/main incl. docs PR #118).

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0, no errors |
| `npx vitest run __tests__/unit/research-shell-logic.test.ts __tests__/unit/research-events.test.ts` | both files pass (duration 170 ms) |
| `npm run check:imports` | "No client→server-action import violations" |
| `npm run build` | exit 0; 241 top-level route lines; `/research` prerendered `○ Static` (log line 568) |

Environment: `.env.local` copied from main repo; `node_modules` symlinked (no install);
build log archived in session scratchpad (`pr1-baseline-build.log`).

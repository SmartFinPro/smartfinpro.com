# SmartFinPro MCP Server (Phase 1)

Local MCP (Model Context Protocol) server exposing 7 bounded tools for Claude Code. Stdio-based, runs on-demand when Claude Code is active. No public HTTP exposure.

## Tools

### Read-only (6) — auto-allowed via `.claude/settings.json`

| Tool | Purpose |
|---|---|
| `get_orphan_slugs` | MDX `/go/<slug>` references not active in `affiliate_links` |
| `list_affiliate_links` | Filter affiliate_links rows (market, category, active) |
| `get_revenue_stats` | Approved-only revenue, clicks, EPC across markets/products |
| `get_conversion_funnel` | Funnel stages from `conversion_events` (rate vs prev stage) |
| `get_content_health` | Pages from `content_health_scores`, sorted worst-first |
| `detect_schema_drift` | Diff `supabase/schema.sql` declarations vs live DB columns |

### Write (1) — `ask`-gated via `.claude/settings.local.json`

| Tool | Purpose |
|---|---|
| `activate_affiliate_slug` | Upsert row in `affiliate_links` (idempotent, host-change-guarded) |

## Setup

```bash
cd scripts/mcp-server
npm install
```

Environment variables are loaded from the repo-root `.env.local` (not from a separate `.env` in this folder). Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

The `.mcp.json` at the repo root tells Claude Code to launch this server via `npm --prefix ./scripts/mcp-server run start`. No manual start needed.

## Audit Log

Every tool call is logged (fire-and-forget) to `claude_audit_log` with args, result-summary, status, duration. Migration: `supabase/migrations/20260420140000_claude_audit_log.sql`.

Query last 10 calls:
```sql
SELECT tool_name, status, duration_ms, executed_at, result_summary
FROM claude_audit_log
ORDER BY executed_at DESC
LIMIT 10;
```

## Architecture (C-ready)

- `src/server.ts` — MCP stdio transport adapter. Registers tools.
- `src/tools/*.ts` — One file per tool. Pure business logic.
- `src/lib/supabase.ts` — Service-role client.
- `src/lib/audit.ts` — `logToolCall()` helper (fire-and-forget DB insert).
- `src/lib/validation.ts` — Zod schemas + DB-CHECK-matched allowlists.
- `src/lib/content-walker.ts` — MDX file walker (for `get_orphan_slugs`).

Phase 2 can add HTTP transport by adding `src/transport-http.ts` without touching tools/*.ts.

## Scope boundaries

Not in Phase 1:
- Raw SQL execution
- Bulk write operations
- Cron triggers
- Content mutation (MDX)
- HTTP transport

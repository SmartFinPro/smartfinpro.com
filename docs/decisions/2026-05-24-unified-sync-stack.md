# Unified Sync Stack

Date: 2026-05-24

## Decision

`lib/api/sync-service.ts` plus `api_connectors` plus `sync_logs` is the operational source of truth for affiliate conversion synchronization.

## Context

- Settings and Sync History already read from `api_connectors` and `sync_logs`.
- `app/api/cron/sync-revenue/route.ts` previously called `syncAllNetworks()` from `lib/api/affiliate-networks.ts`.
- `syncAllNetworks()` wrote to legacy `api_sync_logs`, which made Revenue/Cron behavior diverge from Settings.
- There was no existing `runAllConnectors()` aggregator in `sync-service.ts`; only per-connector `syncConnector()` existed.

## Reader Audit

- Active writer on legacy `api_sync_logs`: `lib/api/affiliate-networks.ts`
- Active route depending on that writer: `app/api/cron/sync-revenue/route.ts`
- Active dashboard readers for the new stack:
  - `lib/actions/connectors.ts`
  - `app/(dashboard)/dashboard/settings/page.tsx`

## Outcome

- `runAllConnectors()` is introduced in `lib/api/sync-service.ts`.
- `sync-revenue` and `sync-conversions` use the same connector stack.
- `syncAllNetworks()` remains only as a compatibility adapter and no longer writes to `api_sync_logs`.
- Legacy `api_sync_logs` is kept for now until the remaining schema/view strategy is applied explicitly.

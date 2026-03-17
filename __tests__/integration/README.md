# Integration Tests

## Quick Start

```bash
# Set test DB credentials (separate Supabase project, NOT production)
export SUPABASE_TEST_URL="https://your-test-project.supabase.co"
export SUPABASE_TEST_SERVICE_KEY="eyJ..."

# Run integration tests
npm run test:integration
```

Or create `.env.test.local` with the credentials and the script will load them.

## What's Covered

### Unit Tests (`__tests__/unit/`) — mocked Supabase
- Application-level validation (event type, click_id format)
- Routing logic (WITH txn_id → pre-flight SELECT, WITHOUT → straight INSERT)
- Error handling (23505 → duplicate_skipped, other codes → failure)
- Dual-bucket math (sfpDayBucket, sfpDayBucketOffset, wouldBeBlocked)

### Integration Tests (`__tests__/integration/`) — real PostgreSQL
- **IMMUTABLE function correctness**: SQL `sfp_day_bucket` / `sfp_day_bucket_offset` match JS equivalents
- **Bucket A constraint** (midnight-aligned): same UTC day → 23505
- **Bucket B constraint** (noon-aligned): cross-midnight same noon-window → 23505
- **12h–24h ambiguous zone**: 18h same-day blocked, 22h cross-midnight blocked, 14h cross-both allowed
- **≥24h always allowed**: exactly 24h apart passes both indexes
- **Partial index bypass**: events WITH `network_event_id` skip fingerprint indexes
- **Concurrent race condition**: parallel INSERTs → exactly one 23505

## Test Project Setup

1. Create a **separate** Supabase project for integration tests
2. Link to the test project: `npx supabase link --project-ref <test-project-ref>`
3. Push migrations: `npx supabase db push`
   (Or connect directly via Postgres: `psql $DATABASE_URL < supabase/migrations/*.sql`)
4. Set env vars in `.env.test.local`:
   ```
   SUPABASE_TEST_URL=https://<test-project-ref>.supabase.co
   SUPABASE_TEST_SERVICE_KEY=eyJ...
   ```
5. Tests clean up after themselves (DELETE by `TEST_CLICK_ID`)

**Safety:** The test suite hard-blocks known production project refs
(see `BLOCKED_PROJECT_REFS` in `postback-dedup-db.test.ts`). If
`SUPABASE_TEST_URL` points to production, the suite throws immediately.

## Skipping

Without env vars, `npm run test:integration` reports "skipped" — safe for CI
without a test DB. The `npm run test` (unit only) is unaffected.

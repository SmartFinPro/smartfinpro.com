-- Research Library data contract — ADDITIVE, nullable columns on
-- public.product_attributes backing the Discovery-layer's honest BEST-X
-- contract (see lib/research/types.ts). Reuses the existing provenance columns
-- (score, sub_scores, source_type, confidence, source_url, data_verified_at)
-- and adds only what the per-Tier-1-fact contract genuinely needs.
--
-- Deliberately NOT added: a `confidence_reason` column. The project stores the
-- reason INSIDE product_attributes.attributes (see
-- 20260718100000_audit_trading_platforms_options.sql, which sets
-- attributes.confidence_reason for the eToro row); the Research adapter reads
-- attributes.confidence_reason. Adding a column would create two homes for the
-- same fact.
--
-- APPLICATION: manual, and ONLY via this versioned file — there is no second
-- service-key DML path (deploy.yml runs no migrations; see
-- memory/deploy-no-migration-step.md). Suggested flow:
--   Dry-Run/Staging → Audit-Freigabe → apply (supabase db push / Dashboard SQL
--   / psql) → run the verification block below → revalidate the cockpit/hub.
-- This file is NOT auto-applied. STATUS: APPLIED to production on 2026-07-19
-- via the Supabase SQL editor, verified read-only afterwards (8 audited /
-- 1 provisional, no mass overwrite). See
-- docs/superpowers/plans/data/2026-07-19-trading-research-apply-log.md.
-- Re-running is safe: the statements are idempotent.
--
-- research_sources key convention (per-Tier-1-fact provenance) — the JSONB keys
-- are the topic's TopicConfig specColumn keys. For us/trading/trading-platforms
-- (lib/comparison/topics/trading-platforms.ts) those are, mapped to the
-- source-matrix attributes
-- (docs/superpowers/plans/2026-07-03-cockpit-trading-platforms-source-matrix.md):
--   optionsFee     -> source-matrix `options_contract_fee`
--   minDeposit     -> source-matrix `account_minimum`
--   extendedHours  -> source-matrix `extended_hours`
--   tradingview    -> source-matrix `tradingview_integration`
-- Each value is { "sourceUrl": <https>, "sourceType":
-- official|regulator|editorial|user_reviews, "verifiedAt": <YYYY-MM-DD> },
-- validated at runtime by FieldSourceSchema (lib/research/types.ts).

BEGIN;

ALTER TABLE public.product_attributes
  ADD COLUMN IF NOT EXISTS research_status     VARCHAR(12)
    CONSTRAINT product_attributes_research_status_check
    CHECK (research_status IN ('audited', 'provisional', 'unavailable')),
  ADD COLUMN IF NOT EXISTS methodology_version TEXT,
  ADD COLUMN IF NOT EXISTS research_sources    JSONB
    CONSTRAINT product_attributes_research_sources_object_check
    CHECK (research_sources IS NULL OR jsonb_typeof(research_sources) = 'object');

COMMENT ON COLUMN public.product_attributes.research_status IS
  'Research Library gate. audited = Tier-1 facts backed by research_sources + verified score inputs (shows score + rank); provisional = facts exist but not fully backed (no rank); unavailable = no usable score. NULL = not part of the Research Library yet. Enforced at runtime by deriveResearchScore (lib/research/types.ts) — this column is the editorial intent, the adapter degrades if invariants are unmet.';
COMMENT ON COLUMN public.product_attributes.methodology_version IS
  'Research Library BEST-X methodology version applied to this row (e.g. "trading-platforms-v1"). Required for research_status = audited.';
COMMENT ON COLUMN public.product_attributes.research_sources IS
  'Per-Tier-1-fact provenance: { <specColumnKey>: { sourceUrl, sourceType, verifiedAt } }. Keys = TopicConfig.specColumns keys. Populated from the topic source-matrix. Validated by FieldSourceSchema.';

COMMIT;

-- ── Dry-run / verification (run manually AFTER apply; not part of the forward migration) ──
-- SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--  WHERE table_name = 'product_attributes'
--    AND column_name IN ('research_status', 'methodology_version', 'research_sources')
--  ORDER BY column_name;
-- Expect exactly 3 rows, all is_nullable = 'YES'.
--
-- SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--  WHERE conrelid = 'public.product_attributes'::regclass
--    AND conname LIKE '%research%';
-- Expect the two CHECK constraints (research_status enum, research_sources object-or-null).

-- ── ROLLBACK (run manually) ──
-- BEGIN;
-- ALTER TABLE public.product_attributes
--   DROP COLUMN IF EXISTS research_status,
--   DROP COLUMN IF EXISTS methodology_version,
--   DROP COLUMN IF EXISTS research_sources;
-- COMMIT;

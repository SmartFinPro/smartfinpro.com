-- Extend affiliate_links.category CHECK constraint — add debt-relief
--
-- Context: Comparison Cockpit Slice 1 (debt-relief). Discovered live while trying to fix
-- national-debt-relief's category to 'debt-relief' — the live CHECK constraint (verified via
-- introspection: `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid =
-- 'affiliate_links'::regclass AND contype='c'`) only allows: ai-tools, cybersecurity, trading,
-- forex, personal-finance, business-banking, credit-repair, credit-score, gold-investing —
-- 'debt-relief' is missing, even though it's a registered category everywhere else
-- (lib/i18n/config.ts marketCategories, product_attributes.category has no CHECK at all). This
-- is very likely why the original Feb 2026 migration (20260221000001, which tried to insert
-- national-debt-relief with category='debt-relief') never actually landed in prod — that
-- INSERT would have hit this exact constraint violation, explaining the "personal-finance"
-- category drift documented in 20260703090000_fix_ndr_category.sql.
--
-- Mirrors the same robust, name-independent DROP+ADD pattern as the precedent migration
-- 20260420150100_extend_affiliate_links_category_constraint.sql (added credit-repair,
-- credit-score, gold-investing) — never assume a static constraint name, find it by definition.
--
-- Follow-up (separate, not part of this migration):
--   - supabase/schema.sql:21 inline CHECK — sync to 10 values.
--   - scripts/mcp-server/validation.ts:13 + :181 category allowlist — sync to 10 values,
--     otherwise the MCP write path (activate_affiliate_slug) still rejects debt-relief.

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE cls.relname = 'affiliate_links'
      AND ns.nspname = 'public'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE public.affiliate_links DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$$;

ALTER TABLE public.affiliate_links
  ADD CONSTRAINT affiliate_links_category_check
  CHECK (category IN (
    'ai-tools',
    'cybersecurity',
    'trading',
    'forex',
    'personal-finance',
    'business-banking',
    'credit-repair',
    'credit-score',
    'gold-investing',
    'debt-relief'
  ));

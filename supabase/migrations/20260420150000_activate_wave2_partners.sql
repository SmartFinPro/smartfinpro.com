-- Wave 2 Partner Activation — 3 primary/alias slugs (cmc-markets, cmc-markets-au, questrade)
--
-- Context: Nach Wave 1 (18 Rows) Fortsetzung der Orphan-Slug-Aktivierung.
-- Auswahl basiert auf: bestehendes Surface + verifiziertes offizielles Affiliate-Programm
-- + Host bereits in ALLOWED_HOSTS + keine DB-Blocker.
--
-- MCP-Vorab-Check (2026-04-20): Keine der drei Slugs existiert in affiliate_links.
-- ON CONFLICT bleibt für Idempotenz bei Re-Run und Konsistenz mit Wave-1-Pattern.
--
-- Attributions-Trade-off (bewusst):
--   cmc-markets wird heute aus mehreren Märkten/Kategorien referenziert
--   (au/trading/cmc-markets-review.mdx:20, au/forex/cmc-markets-review.mdx:12,
--   ca/forex/cmc-markets-review.mdx:12). Diese Aktivierung ist "redirect-first",
--   nicht perfekte Markt-/Kategorie-Attribution. Ziel ist Bounce-Stop +
--   Revenue-Aktivierung. Perfekte Attribution kommt später über markt-/
--   kategoriespezifische Slug-Varianten.
--
-- Column Set = Live-Schema (probed 2026-04-20, identisch zu Wave 1):
--   slug, partner_name, destination_url, category, market,
--   commission_type, commission_value, active
-- `network`, `description`, `updated_at` stehen in schema.sql, existieren aber
-- NICHT in Prod — Schema-Reconcile ist out-of-scope für diesen Sprint.

INSERT INTO affiliate_links (slug, partner_name, destination_url, category, market, commission_type, commission_value, active)
VALUES
  -- ── Primary slug ────────────────────────────────────────────
  ('cmc-markets', 'CMC Markets', 'https://www.cmcmarkets.com/', 'trading', 'au', 'cpa', 0, true),

  -- ── Market alias (referenziert in au/trading/index.mdx:38) ──
  ('cmc-markets-au', 'CMC Markets', 'https://www.cmcmarkets.com/', 'trading', 'au', 'cpa', 0, true),

  -- ── Primary slug ────────────────────────────────────────────
  ('questrade', 'Questrade', 'https://www.questrade.com/', 'trading', 'ca', 'cpa', 0, true)

ON CONFLICT (slug) DO UPDATE SET
  partner_name     = EXCLUDED.partner_name,
  destination_url  = EXCLUDED.destination_url,
  market           = EXCLUDED.market,
  category         = EXCLUDED.category,
  commission_type  = EXCLUDED.commission_type,
  commission_value = EXCLUDED.commission_value,
  active           = EXCLUDED.active;

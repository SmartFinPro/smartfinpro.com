-- Silver Gold Bull — CJ Advertiser 3468748 (Silver Gold Bull Profit Trove)
-- CA: Homepage link (CJ Link 13658063) — 3M EPC $138.74
-- US: Storage deep link (CJ Link 13287715) — silvergoldbull.com/storage
-- Publisher ID: 101710331
--
-- NOTE: Uses actual production column set (schema.sql is ahead of live DB).
-- Columns in live DB: id, slug, partner_name, destination_url, category,
--   market, commission_type, commission_value, active, created_at

INSERT INTO affiliate_links (
  slug,
  partner_name,
  destination_url,
  market,
  category,
  commission_type,
  commission_value,
  active
)
VALUES
  (
    'silvergoldbull-ca',
    'Silver Gold Bull',
    'https://www.kqzyfj.com/click-101710331-13658063',
    'ca',
    'gold-investing',
    'revenue-share',
    0.00,
    true
  ),
  (
    'silvergoldbull-us',
    'Silver Gold Bull',
    'https://www.kqzyfj.com/click-101710331-13287715',
    'us',
    'gold-investing',
    'revenue-share',
    0.00,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  partner_name      = EXCLUDED.partner_name,
  destination_url   = EXCLUDED.destination_url,
  market            = EXCLUDED.market,
  category          = EXCLUDED.category,
  commission_type   = EXCLUDED.commission_type,
  commission_value  = EXCLUDED.commission_value,
  active            = EXCLUDED.active;

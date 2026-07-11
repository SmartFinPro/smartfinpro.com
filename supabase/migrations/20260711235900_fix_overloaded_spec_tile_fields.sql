-- Audit trail for a direct data fix applied via .scratch-migration/fix_overloaded_specfields.mjs
-- (service-role UPDATE against prod, matching the pattern used throughout this rollout —
-- deploy.yml runs no migrations, so this file documents an already-applied change).
--
-- Why: the "Investment universe" / "Instrument range" spec-tile fields on the UK
-- investing-apps and AU cfd-brokers cockpits rendered as a cramped, comma-heavy
-- multi-number stat dump (e.g. "~8,200 shares, 4,000+ funds, 3,400 ETFs, 450 trusts,
-- 134 bonds/gilts, 24 markets") in a UI slot designed for one scannable headline fact.
-- Collapsed each to a single consolidated figure or trimmed to the one relevant clause;
-- no factual claim was dropped without confirming it doesn't live only in this field.

UPDATE product_attributes SET attributes = jsonb_set(attributes, '{investment_universe_note}', '"16,000+ investments across shares, funds, ETFs, trusts and bonds"')
  WHERE market = 'uk' AND category = 'personal-finance' AND topic = 'investing-apps' AND slug = 'aj-bell';

UPDATE product_attributes SET attributes = jsonb_set(attributes, '{investment_universe_note}', '"Thousands of UK, US and EU shares and ETFs; new 2026 SIPP product (75,000+ on the waitlist)"')
  WHERE market = 'uk' AND category = 'personal-finance' AND topic = 'investing-apps' AND slug = 'trading-212';

UPDATE product_attributes SET attributes = jsonb_set(attributes, '{investment_universe_note}', '"~830 ETFs only, no individual stocks"')
  WHERE market = 'uk' AND category = 'personal-finance' AND topic = 'investing-apps' AND slug = 'investengine';

UPDATE product_attributes SET attributes = jsonb_set(attributes, '{investment_universe_note}', '"40,000+ combined instruments across funds, ETFs and bonds"')
  WHERE market = 'uk' AND category = 'personal-finance' AND topic = 'investing-apps' AND slug = 'interactive-investor';

UPDATE product_attributes SET attributes = jsonb_set(attributes, '{investment_universe_note}', '"A growing universe under IG Group ownership (AUM +34% to £3.3bn in FY2025)"')
  WHERE market = 'uk' AND category = 'personal-finance' AND topic = 'investing-apps' AND slug = 'freetrade';

UPDATE product_attributes SET attributes = jsonb_set(attributes, '{investment_universe_note}', '"13,500+ investments across shares, funds, ETFs, trusts and bonds"')
  WHERE market = 'uk' AND category = 'personal-finance' AND topic = 'investing-apps' AND slug = 'hargreaves-lansdown';

UPDATE product_attributes SET attributes = jsonb_set(attributes, '{cfd_range_note}', '"~2,800 CFDs across shares, indices, FX, ETFs and commodities (crypto CFDs unconfirmed)"')
  WHERE market = 'au' AND category = 'trading' AND topic = 'cfd-brokers' AND slug = 'plus500-cfd-au';

UPDATE product_attributes SET attributes = jsonb_set(attributes, '{cfd_range_note}', '"12,000+ instruments across forex, indices, commodities and shares"')
  WHERE market = 'au' AND category = 'trading' AND topic = 'cfd-brokers' AND slug = 'cmc-markets-cfd-au';

UPDATE product_attributes SET attributes = jsonb_set(attributes, '{cfd_range_note}', '"~1,400-2,700 instruments across FX, indices, shares, commodities and crypto"')
  WHERE market = 'au' AND category = 'trading' AND topic = 'cfd-brokers' AND slug = 'pepperstone-cfd-au';

UPDATE product_attributes SET attributes = jsonb_set(attributes, '{cfd_range_note}', '"~18,000 tradable markets across shares, ETFs, indices, FX and commodities"')
  WHERE market = 'au' AND category = 'trading' AND topic = 'cfd-brokers' AND slug = 'ig-markets-cfd-au';

UPDATE product_attributes SET attributes = jsonb_set(attributes, '{cfd_range_note}', '"3,000+ CFD assets across FX, commodities, indices, stocks, ETFs and crypto"')
  WHERE market = 'au' AND category = 'trading' AND topic = 'cfd-brokers' AND slug = 'etoro-cfd-au';

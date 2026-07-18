-- T0b — Cockpit-Datenaudit `us/trading/trading-platforms`: corrects the eToro row's
-- unbacked "only true $0-fee options broker" exclusivity claim (repeated in tagline,
-- pros[0], attributes.options_fee_note and deep_dive), the quote-less $100
-- account_minimum (correct value is a $50 standard minimum across all methods), and adds
-- transparency notes to the two rows (Robinhood, Webull) whose options_fee_note text
-- was compared against eToro's on an inconsistent semantic basis.
--
-- This migration implements EXACTLY the alt->neu cell changes documented in the
-- T0b audit artefact — nothing here is reworded beyond what that document specifies:
--   docs/superpowers/specs/2026-07-18-etoro-cockpit-audit.md (§3 "Feld-für-Feld: alt → neu")
--
-- Scope: 3 of the 9 `trading-platforms` rows (the audit reviewed all 9; only these 3
-- were found inconsistent — see audit §3/§4). The remaining 6 rows (Fidelity, Schwab,
-- IBKR, tastytrade, E*TRADE, Merrill Edge) charge classic broker-imposed per-contract
-- commissions and are definition-conformant already — no migration needed for them.
--
-- NOT changed by this migration (audit §4 "Bewusst NICHT geändert"): `score` 8.3 and
-- `sub_scores` (redaktionelle Bewertungen, not an extern-verifiable fact — a full
-- fees-subscore recalibration across all 9 rows is out of scope, deferred to the
-- Task-10 Gesamtaudit); `rating`/`review_count` (V2 does not read them per the
-- Source-of-Truth-Matrix; their cleanup is also Task-10); `extended_hours` (already
-- honestly `null` with a transparent note — the audit's own template for
-- `confidence_reason`); `verdict`, `best_for`, `chips`, `badges`, `source_url`,
-- `data_verified_at` and every other row/column not listed below.
--
-- Applied to Prod: MANUALLY ONLY (deploy.yml runs no migrations — see
-- memory/deploy-no-migration-step.md). This file is NOT auto-applied.
--
-- WHERE clause convention: every UPDATE is scoped by slug + market='us' +
-- topic='trading-platforms', matching the seed migration's uniqueness key
-- (market, category, topic, slug) — see 20260703100000_seed_trading_platforms_us.sql.

-- ============================================================
-- 1) eToro — full correction (tagline, account_minimum, attributes.deposit_note,
--    attributes.options_fee_note, pros[0], cons[0], deep_dive, confidence,
--    attributes.confidence_reason). pros[1..3]/cons[1..2] are re-set byte-identical
--    to the seed (20260703100000_seed_trading_platforms_us.sql:183ff) per the plan's
--    "Neusetzen des kompletten Arrays" instruction — only element [0] changes.
-- ============================================================
UPDATE public.product_attributes
SET
  tagline = 'Copy trading at scale, with $0 broker contract fees on options',
  account_minimum = 50,
  confidence = 'medium',
  pros = ARRAY[
    'No commission or broker-imposed per-contract fee on US options (regulatory pass-throughs apply)',
    '$100,000 virtual demo portfolio, automatically included for every account',
    'Native TradingView integration, independently confirmed by BrokerChooser and ForexBrokers.com',
    'Industry-leading social/copy-trading community with 50M+ global users'
  ]::text[],
  cons = ARRAY[
    '$50 minimum first deposit — most peers require $0',
    'No futures trading available on the US platform',
    'Extended-hours trading availability for US accounts is not established — we show it as unverified rather than claim it'
  ]::text[],
  deep_dive = 'eToro charges no commission or broker-imposed per-contract fee on US options — only regulatory and exchange pass-through costs, which run comparable in size to what other brokers charge outright. It pairs this with a large, well-known social/copy-trading community and a permanent $100,000 demo account. It requires a $50 minimum first deposit, and its extended-hours trading availability for US accounts could not be verified at the time of research, so we show it as unestablished rather than claim a feature that may not exist for US customers.',
  attributes = jsonb_set(
    jsonb_set(
      jsonb_set(
        attributes,
        '{options_fee_note}',
        '"eToro charges no commission or broker-imposed per-contract fee on US options. Regulatory and exchange pass-through fees still apply (ORF $0.02, LQT $0.02, FINRA TAF $0.00279/contract on sales — ~$0.04–0.05 per contract per side, comparable to peers'' combined fees)."'::jsonb,
        true
      ),
      '{deposit_note}',
      '"$50 standard minimum first deposit across all methods; wire transfers from $500 (eToro deposit FAQ, checked 18 Jul 2026)."'::jsonb,
      true
    ),
    '{confidence_reason}',
    '"Core pricing and deposit terms verified against official eToro pages (18 Jul 2026). Extended-hours availability for US accounts remains unestablished — no citable source; shown as unverified."'::jsonb,
    true
  )
WHERE slug = 'etoro' AND market = 'us' AND topic = 'trading-platforms';

-- ============================================================
-- 2) Robinhood — attributes.options_fee_note ONLY. `options_fee: 0.08` is left
--    unchanged (audit §3: correct under the round-trip broker-imposed definition).
-- ============================================================
UPDATE public.product_attributes
SET attributes = jsonb_set(
  attributes,
  '{options_fee_note}',
  '"Round-trip of Robinhood''s broker-set $0.04/contract combined fee (in effect since Jan 10, 2025) covering regulatory/exchange costs; per Robinhood''s fee schedule it \"may differ from or exceed the actual fee\". Index options $0.50/contract ($0.35 with Gold)."'::jsonb,
  true
)
WHERE slug = 'robinhood' AND market = 'us' AND topic = 'trading-platforms';

-- ============================================================
-- 3) Webull — attributes.options_fee_note ONLY. `options_fee: 0.0` is left
--    unchanged (audit §3: definition-conformant — no broker-imposed contract fee).
-- ============================================================
UPDATE public.product_attributes
SET attributes = jsonb_set(
  attributes,
  '{options_fee_note}',
  '"$0 broker fee on US equity options; regulatory/exchange pass-throughs apply. $0.50/contract on certain index options; $0.10/contract on oversized orders (Webull pricing, checked 18 Jul 2026)."'::jsonb,
  true
)
WHERE slug = 'webull' AND market = 'us' AND topic = 'trading-platforms';

-- ============================================================
-- ROLLBACK — restores the pre-audit values (run manually, not part of the
-- forward migration). deposit_note and confidence_reason did not exist
-- before this migration, so the rollback removes those keys rather than
-- reverting them to a prior value.
-- ============================================================
-- BEGIN;
--
-- UPDATE public.product_attributes
-- SET
--   tagline = 'Only true $0-fee options broker',
--   account_minimum = 100,
--   confidence = 'low',
--   pros = ARRAY[
--     '$0/contract options — the only true zero-fee options broker in this comparison',
--     '$100,000 virtual demo portfolio, automatically included for every account',
--     'Native TradingView integration, independently confirmed by BrokerChooser and ForexBrokers.com',
--     'Industry-leading social/copy-trading community with 50M+ global users'
--   ]::text[],
--   cons = ARRAY[
--     '$100 minimum first deposit for US customers, higher than most peers'' $0',
--     'No futures trading available on the US platform',
--     'Extended-hours trading availability for US accounts is not established — we show it as unverified rather than claim it'
--   ]::text[],
--   deep_dive = 'eToro is the only broker in this comparison charging genuinely $0 per options contract for US customers, backed by a large, well-known social/copy-trading community and a permanent $100,000 demo account. It requires a $100 minimum first deposit (versus $0 at most peers), and its extended-hours trading availability for US accounts could not be verified at the time of research, so we show it as unestablished rather than claim a feature that may not exist for US customers.',
--   attributes = (attributes - 'deposit_note' - 'confidence_reason') || jsonb_build_object(
--     'options_fee_note', '$0/contract for US customers — no commission or contract fees beyond regulatory pass-throughs. The only true $0-options broker among these 9.'
--   )
-- WHERE slug = 'etoro' AND market = 'us' AND topic = 'trading-platforms';
--
-- UPDATE public.product_attributes
-- SET attributes = jsonb_set(
--   attributes,
--   '{options_fee_note}',
--   '"Round-trip of the combined $0.04/contract regulatory/clearing pass-through fee (in effect since January 10, 2025; Robinhood no longer charges $0/contract on options)."'::jsonb,
--   true
-- )
-- WHERE slug = 'robinhood' AND market = 'us' AND topic = 'trading-platforms';
--
-- UPDATE public.product_attributes
-- SET attributes = jsonb_set(
--   attributes,
--   '{options_fee_note}',
--   '"$0/contract on equity options; $0.50/contract on certain index options."'::jsonb,
--   true
-- )
-- WHERE slug = 'webull' AND market = 'us' AND topic = 'trading-platforms';
--
-- COMMIT;

-- Migration: compliance_overrides
-- DB-backed override layer for regulatory compliance labels.
--
-- Architecture:
--   The code constant in lib/affiliate/compliance-labels.ts remains the
--   canonical fallback (must stay client-safe / no server imports).
--   This table allows regulatory label updates WITHOUT a code redeploy.
--
--   Precedence: DB override > code constant
--
-- Use cases:
--   - FCA tightens CFD risk warning text → update DB row, live immediately
--   - New market/category added → insert row without touching source code
--   - A/B test different disclaimer wording
--
-- API: lib/actions/compliance-db.ts → getComplianceLabel(market, category)

CREATE TABLE IF NOT EXISTS compliance_overrides (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which market+category this override applies to
  market       text        NOT NULL,   -- 'us' | 'uk' | 'ca' | 'au'
  category     text        NOT NULL,   -- 'trading' | 'forex' | ... | '_default'

  -- The override label text (NULL = use code constant)
  label        text        NOT NULL,

  -- Who last updated this + when
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   text        NOT NULL DEFAULT 'admin',

  -- Optional: link to the regulatory reference (for audit trail)
  regulatory_ref text,                -- e.g. 'FCA CP23/28', 'ASIC RG 227'

  -- Active flag — allows disabling without deleting
  is_active    boolean     NOT NULL DEFAULT true,

  CONSTRAINT compliance_overrides_market_category_unique UNIQUE (market, category)
);

-- Primary access pattern: lookup by market+category
CREATE INDEX IF NOT EXISTS compliance_overrides_market_category_idx
  ON compliance_overrides(market, category)
  WHERE is_active = true;

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE compliance_overrides ENABLE ROW LEVEL SECURITY;

-- Service role: full CRUD (server actions, cron, admin dashboard)
CREATE POLICY "Service role: full access"
  ON compliance_overrides FOR ALL
  USING (auth.role() = 'service_role');

-- ── Seed: Pre-populate with current regulatory labels ────────────────────────
-- This ensures the table matches the code constants at migration time.
-- Future updates can be done via Supabase dashboard or admin API.

INSERT INTO compliance_overrides (market, category, label, updated_by, regulatory_ref) VALUES
  -- US
  ('us', '_default',       'Terms and conditions apply. 18+ only.', 'migration', NULL),
  ('us', 'trading',        'Investing involves risk of loss and is not suitable for all investors. Securities offered through SEC-registered entities. Not FDIC insured.', 'migration', 'SEC/NFA'),
  ('us', 'forex',          'Forex trading involves significant risk of loss. NFA/CFTC regulated. Leverage can amplify gains and losses.', 'migration', 'NFA/CFTC'),
  ('us', 'personal-finance','Rates and fees apply. See issuer''s terms for details. Not financial advice. APRs may vary.', 'migration', NULL),
  ('us', 'business-banking','Terms apply. Deposits may be FDIC insured where applicable. Business eligibility requirements apply.', 'migration', 'FDIC'),
  ('us', 'cybersecurity',  'Affiliate link. Terms apply. Feature availability may vary by plan.', 'migration', NULL),
  ('us', 'ai-tools',       'Affiliate link. Terms apply. Not an endorsement.', 'migration', NULL),

  -- UK
  ('uk', '_default',       'Terms and conditions apply. 18+ only.', 'migration', NULL),
  ('uk', 'trading',        'Capital at risk. 74-89% of retail CFD accounts lose money. FCA regulated. Professional controls apply.', 'migration', 'FCA'),
  ('uk', 'forex',          'Capital at risk. CFDs are complex instruments with high risk of rapid loss due to leverage. FCA authorised.', 'migration', 'FCA'),
  ('uk', 'personal-finance','Your capital is at risk. FCA regulated. FSCS protected up to £85,000 where applicable.', 'migration', 'FCA/FSCS'),
  ('uk', 'business-banking','Terms apply. FCA authorised. FSCS protection may apply to eligible deposits.', 'migration', 'FCA/FSCS'),
  ('uk', 'cybersecurity',  'Affiliate link. Terms apply. Feature availability may vary by plan.', 'migration', NULL),
  ('uk', 'ai-tools',       'Affiliate link. Terms apply. Not an endorsement.', 'migration', NULL),

  -- CA
  ('ca', '_default',       'Terms and conditions apply. 18+ only.', 'migration', NULL),
  ('ca', 'trading',        'Investing involves risk. CIRO regulated. CIPF member. Not CDIC insured.', 'migration', 'CIRO/CIPF'),
  ('ca', 'forex',          'Forex trading involves risk. CIRO regulated. CFDs not available to Canadian retail clients.', 'migration', 'CIRO'),
  ('ca', 'personal-finance','Terms apply. CDIC insured deposits where eligible. Not investment advice.', 'migration', 'CDIC'),
  ('ca', 'business-banking','Terms apply. CDIC protection may apply to eligible deposits. Business requirements apply.', 'migration', 'CDIC'),
  ('ca', 'cybersecurity',  'Affiliate link. Terms apply. Feature availability may vary by plan.', 'migration', NULL),
  ('ca', 'ai-tools',       'Affiliate link. Terms apply. Not an endorsement.', 'migration', NULL),

  -- AU
  ('au', '_default',       'Terms and conditions apply. 18+ only.', 'migration', NULL),
  ('au', 'trading',        'Investing involves risk of loss. ASIC regulated. Not CDIA insured.', 'migration', 'ASIC'),
  ('au', 'forex',          'Forex and CFD trading involve significant risk. ASIC regulated. Losses may exceed deposits.', 'migration', 'ASIC RG 227'),
  ('au', 'personal-finance','General advice only. Not personal financial advice. Consider your circumstances. ASIC regulated.', 'migration', 'ASIC'),
  ('au', 'business-banking','Terms apply. Not government guaranteed unless stated. Business eligibility requirements apply.', 'migration', NULL),
  ('au', 'cybersecurity',  'Affiliate link. Terms apply. Feature availability may vary by plan.', 'migration', NULL),
  ('au', 'ai-tools',       'Affiliate link. Terms apply. Not an endorsement.', 'migration', NULL)

ON CONFLICT (market, category) DO NOTHING;

COMMENT ON TABLE compliance_overrides IS
  'DB-override layer for regulatory compliance labels. '
  'Takes precedence over code constants in lib/affiliate/compliance-labels.ts. '
  'Allows regulatory updates without code redeploy.';

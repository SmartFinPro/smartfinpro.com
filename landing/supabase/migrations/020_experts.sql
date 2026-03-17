-- ============================================================
-- 020: Experts Table
-- Centralized expert data for EEAT ExpertVerifier component
-- Supports market-level defaults + category-specific experts
-- ============================================================

-- ── Table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_slug TEXT NOT NULL CHECK (market_slug IN ('us', 'uk', 'ca', 'au')),
  category TEXT CHECK (category IN (
    'ai-tools', 'cybersecurity', 'trading', 'forex', 'personal-finance', 'business-banking'
  )),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  credentials TEXT[] NOT NULL DEFAULT '{}',
  linkedin_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────

-- Category-specific experts: one per market+category
CREATE UNIQUE INDEX IF NOT EXISTS idx_experts_market_category
  ON experts (market_slug, category)
  WHERE category IS NOT NULL;

-- Market defaults: exactly one per market (category IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_experts_market_default
  ON experts (market_slug)
  WHERE category IS NULL;

-- Fast lookup by market
CREATE INDEX IF NOT EXISTS idx_experts_market
  ON experts (market_slug);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE experts ENABLE ROW LEVEL SECURITY;

-- Anon can read verified experts (public data)
CREATE POLICY "experts_anon_read" ON experts
  FOR SELECT TO anon
  USING (verified = true);

-- Authenticated can read all
CREATE POLICY "experts_auth_read" ON experts
  FOR SELECT TO authenticated
  USING (true);

-- Service role has full access
CREATE POLICY "experts_service_all" ON experts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Seed Data ────────────────────────────────────────────────

-- 4 Market Defaults (fallback when no category-specific expert exists)
INSERT INTO experts (market_slug, category, name, role, bio, image_url, credentials, verified) VALUES
  ('us', NULL, 'James Miller', 'Senior Financial Analyst',
   'Former Wall Street analyst with 15+ years experience in financial technology and investment research.',
   '/images/experts/james-miller.jpg', ARRAY['CFA', 'CFP'], true),

  ('uk', NULL, 'Sarah Thompson', 'Lead Market Analyst',
   'Chartered financial analyst specialising in UK financial markets and fintech platforms with over 12 years of industry experience.',
   '/images/experts/sarah-thompson.jpg', ARRAY['CFA', 'CISI'], true),

  ('ca', NULL, 'Marc Fontaine', 'Canadian Markets Specialist',
   'Expert in Canadian investment platforms and registered financial planner with 12 years experience across banking and fintech.',
   '/images/experts/marc-fontaine.jpg', ARRAY['CFA', 'CIM'], true),

  ('au', NULL, 'Daniel Whitfield', 'APAC Finance Expert',
   'Australian financial services expert covering trading, banking, and personal finance platforms across the Asia-Pacific region.',
   '/images/experts/daniel-whitfield.jpg', ARRAY['CFA', 'AFA'], true);

-- 8 Category-Specific Experts (override defaults for key categories)
INSERT INTO experts (market_slug, category, name, role, bio, image_url, credentials, verified) VALUES
  ('us', 'trading', 'Robert Hayes', 'Senior Trading Analyst',
   'Certified Market Technician with 10+ years of hands-on trading experience across equities, options, and futures markets.',
   '/images/experts/robert-hayes.jpg', ARRAY['CMT', 'CFA'], true),

  ('us', 'cybersecurity', 'James Mitchell', 'Cybersecurity Expert',
   'Certified information security professional with expertise in enterprise security architecture and threat assessment.',
   '/images/experts/james-mitchell.jpg', ARRAY['CISSP', 'CISM'], true),

  ('us', 'personal-finance', 'Michael Torres', 'Personal Finance Specialist',
   'Certified Financial Planner helping individuals optimize savings, investments, and credit strategies for over 8 years.',
   '/images/experts/michael-torres.jpg', ARRAY['CFP', 'CFA'], true),

  ('us', 'business-banking', 'Michael Chen', 'Business Banking Analyst',
   'Former fintech CFO with deep expertise in business banking, payment processing, and corporate financial solutions.',
   '/images/experts/michael-chen.jpg', ARRAY['CPA'], true),

  ('us', 'ai-tools', 'Dr. Sarah Chen', 'AI & Finance Researcher',
   'PhD researcher specializing in the intersection of artificial intelligence and financial technology.',
   '/images/experts/sarah-chen.jpg', ARRAY['CPA', 'CFP'], true),

  ('uk', 'trading', 'James Blackwood', 'UK Markets Analyst',
   'FCA-regulated investment analyst specialising in UK equities, spread betting, and CFD trading platforms.',
   '/images/experts/james-blackwood.jpg', ARRAY['CFA', 'CISI'], true),

  ('ca', 'forex', 'Philippe Leblanc', 'Forex Specialist',
   'Chartered Financial Analyst with extensive experience in Canadian forex markets and cross-border currency strategies.',
   '/images/experts/philippe-leblanc.jpg', ARRAY['CFA'], true),

  ('au', 'forex', 'James Liu', 'APAC Forex Expert',
   'Licensed Australian financial adviser specializing in foreign exchange markets and Asia-Pacific currency dynamics.',
   '/images/experts/james-liu.jpg', ARRAY['AFA'], true);

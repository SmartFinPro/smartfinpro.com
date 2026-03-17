-- 20260308120000_click_segments.sql
-- P3: Pre-Qual Quiz — click_segments table
--
-- Stores first-party segment data from the 2-step qualification quiz
-- that fires before outbound affiliate clicks on review pages.

CREATE TABLE click_segments (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id          VARCHAR(36)  NOT NULL,
  link_id           UUID         REFERENCES affiliate_links(id) ON DELETE SET NULL,
  market            VARCHAR(4)   NOT NULL,
  category          VARCHAR(50)  NOT NULL,
  experience_level  VARCHAR(20),
  investment_amount VARCHAR(20),
  priority          VARCHAR(30),
  device_type       VARCHAR(10),
  answers           JSONB        DEFAULT '{}',
  skipped           BOOLEAN      DEFAULT false,
  page_url          TEXT,
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- Indexes for segment analysis and EV computation (P4)
CREATE INDEX idx_cs_click_id   ON click_segments (click_id);
CREATE INDEX idx_cs_market_cat ON click_segments (market, category);
CREATE INDEX idx_cs_link_id    ON click_segments (link_id) WHERE link_id IS NOT NULL;
CREATE INDEX idx_cs_created    ON click_segments (created_at DESC);

-- RLS
ALTER TABLE click_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access"
  ON click_segments FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "anon_insert"
  ON click_segments FOR INSERT
  WITH CHECK (true);

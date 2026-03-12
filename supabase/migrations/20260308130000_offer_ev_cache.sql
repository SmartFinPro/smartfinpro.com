-- 20260308130000_offer_ev_cache.sql
-- P4: Offer-Ranking nach Expected Value
--
-- Pre-computed EV values per offer × segment for fast ranking lookups.
-- Rebuilt nightly by the ev-refresh cron job.

CREATE TABLE offer_ev_cache (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id         UUID         NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  market          VARCHAR(4)   NOT NULL,
  category        VARCHAR(50)  NOT NULL,
  segment_key     VARCHAR(80)  NOT NULL DEFAULT 'overall',
  total_clicks    INT          NOT NULL DEFAULT 0,
  approved_count  INT          NOT NULL DEFAULT 0,
  reversed_count  INT          NOT NULL DEFAULT 0,
  avg_payout      DECIMAL(12,2) NOT NULL DEFAULT 0,
  approval_rate   DECIMAL(6,4) NOT NULL DEFAULT 0,
  reversal_rate   DECIMAL(6,4) NOT NULL DEFAULT 0,
  compliance_score DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  ev              DECIMAL(12,4) NOT NULL DEFAULT 0,
  data_sufficient BOOLEAN      NOT NULL DEFAULT false,
  computed_at     TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (link_id, market, category, segment_key)
);

CREATE INDEX idx_oev_market_cat   ON offer_ev_cache (market, category);
CREATE INDEX idx_oev_ev_desc      ON offer_ev_cache (market, category, segment_key, ev DESC);
CREATE INDEX idx_oev_link_id      ON offer_ev_cache (link_id);
CREATE INDEX idx_oev_sufficient   ON offer_ev_cache (data_sufficient) WHERE data_sufficient = true;

-- RLS
ALTER TABLE offer_ev_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access"
  ON offer_ev_cache FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "authenticated_read"
  ON offer_ev_cache FOR SELECT
  USING (auth.role() = 'authenticated');

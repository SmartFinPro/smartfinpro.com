-- 20260308140000_bandit_arms.sql
-- P5: Contextual Bandit — Thompson Sampling
--
-- Only 2 dimensions: Market × Device = 12 segments total
-- (4 markets × 3 device types) to avoid fragmentation.

CREATE TABLE bandit_arms (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id       UUID         NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  market        VARCHAR(4)   NOT NULL,
  category      VARCHAR(50)  NOT NULL,
  device_type   VARCHAR(10)  NOT NULL DEFAULT 'desktop',
  -- Beta distribution parameters (prior: alpha=1, beta=1 = uniform)
  alpha         DECIMAL(12,4) NOT NULL DEFAULT 1.0,
  beta_param    DECIMAL(12,4) NOT NULL DEFAULT 1.0,
  total_shown   INT          NOT NULL DEFAULT 0,
  total_reward  INT          NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (link_id, market, category, device_type)
);

CREATE INDEX idx_ba_segment ON bandit_arms (market, category, device_type);
CREATE INDEX idx_ba_link    ON bandit_arms (link_id);

-- SQL function for atomic posterior update
CREATE OR REPLACE FUNCTION update_bandit_posterior(
  p_link_id UUID,
  p_market VARCHAR(4),
  p_category VARCHAR(50),
  p_device_type VARCHAR(10),
  p_is_reward BOOLEAN
) RETURNS VOID AS $$
BEGIN
  INSERT INTO bandit_arms (link_id, market, category, device_type, alpha, beta_param, total_shown, total_reward)
  VALUES (
    p_link_id, p_market, p_category, p_device_type,
    CASE WHEN p_is_reward THEN 2.0 ELSE 1.0 END,
    CASE WHEN p_is_reward THEN 1.0 ELSE 2.0 END,
    1,
    CASE WHEN p_is_reward THEN 1 ELSE 0 END
  )
  ON CONFLICT (link_id, market, category, device_type)
  DO UPDATE SET
    alpha       = bandit_arms.alpha + CASE WHEN p_is_reward THEN 1.0 ELSE 0.0 END,
    beta_param  = bandit_arms.beta_param + CASE WHEN p_is_reward THEN 0.0 ELSE 1.0 END,
    total_shown = bandit_arms.total_shown + 1,
    total_reward = bandit_arms.total_reward + CASE WHEN p_is_reward THEN 1 ELSE 0 END,
    updated_at  = NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE bandit_arms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access"
  ON bandit_arms FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "authenticated_read"
  ON bandit_arms FOR SELECT
  USING (auth.role() = 'authenticated');

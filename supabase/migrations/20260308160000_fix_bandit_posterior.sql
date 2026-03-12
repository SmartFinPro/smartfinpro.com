-- 20260308160000_fix_bandit_posterior.sql
-- Fix: update_bandit_posterior should NOT increment total_shown.
-- total_shown tracks impressions (incremented in selectOffer server action),
-- not conversion events. Double-counting made warmup fire too early/late.

-- Atomic impression counter for warmup phase.
-- Called from selectOffer() fallback path (EV/static) to track that an arm
-- was shown, so the segment accumulates toward the warmup threshold.
CREATE OR REPLACE FUNCTION increment_bandit_shown(
  p_link_id UUID,
  p_market VARCHAR(4),
  p_category VARCHAR(50),
  p_device_type VARCHAR(10)
) RETURNS VOID AS $$
BEGIN
  INSERT INTO bandit_arms (link_id, market, category, device_type, alpha, beta_param, total_shown, total_reward)
  VALUES (p_link_id, p_market, p_category, p_device_type, 1.0, 1.0, 1, 0)
  ON CONFLICT (link_id, market, category, device_type)
  DO UPDATE SET
    total_shown = bandit_arms.total_shown + 1,
    updated_at  = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fix: update_bandit_posterior should NOT increment total_shown.
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
    0,
    CASE WHEN p_is_reward THEN 1 ELSE 0 END
  )
  ON CONFLICT (link_id, market, category, device_type)
  DO UPDATE SET
    alpha       = bandit_arms.alpha + CASE WHEN p_is_reward THEN 1.0 ELSE 0.0 END,
    beta_param  = bandit_arms.beta_param + CASE WHEN p_is_reward THEN 0.0 ELSE 1.0 END,
    total_reward = bandit_arms.total_reward + CASE WHEN p_is_reward THEN 1 ELSE 0 END,
    updated_at  = NOW();
END;
$$ LANGUAGE plpgsql;

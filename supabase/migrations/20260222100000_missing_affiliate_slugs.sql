-- ============================================================
-- Migration: Add missing affiliate link slugs
-- These slugs are referenced in MDX content but were missing
-- from the affiliate_links table, causing 403/404 on /go/ routes.
-- ============================================================

INSERT INTO affiliate_links (slug, partner_name, destination_url, market, category, commission_type, commission_value, active)
VALUES
  ('ally-invest-robo', 'Ally Invest', 'https://www.ally.com/invest/robo-portfolio/', 'us', 'personal-finance', 'cpa', 0, true),
  ('sofi-robo', 'SoFi Automated Investing', 'https://www.sofi.com/invest/automated/', 'us', 'personal-finance', 'cpa', 0, true),
  ('fidelity-go', 'Fidelity Go', 'https://www.fidelity.com/managed-accounts/fidelity-go/', 'us', 'personal-finance', 'cpa', 0, true)
ON CONFLICT (slug) DO NOTHING;

-- 20260308110000_perf_budgets.sql
-- P2b: Performance-Governance — Seed CWV budget thresholds into system_settings
--
-- These budgets are used by the perf-governance cron job to detect regressions
-- and auto-pause A/B tests that degrade Core Web Vitals.

INSERT INTO system_settings (key, value, category)
VALUES
  ('cwv_budget_lcp',             '2500',  'performance'),
  ('cwv_budget_inp',             '200',   'performance'),
  ('cwv_budget_cls',             '0.1',   'performance'),
  ('cwv_regression_threshold',   '15',    'performance'),
  ('cwv_governance_enabled',     'true',  'performance')
ON CONFLICT (key) DO NOTHING;

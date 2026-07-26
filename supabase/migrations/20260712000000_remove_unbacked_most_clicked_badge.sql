-- Audit trail for a direct data fix applied via .scratch-migration/remove_most_clicked.mjs
-- (service-role UPDATE against prod, matching the pattern used throughout this rollout).
--
-- Why: the "Most clicked" badge on Mercury (us:business-banking/business-bank-accounts)
-- and Wealthfront (us:personal-finance/robo-advisors) was hand-authored in the original
-- seed migrations, never computed from real click data. With cockpit_v1 tracking now
-- live (PR #71), this kind of social-proof badge should only ever be auto-derived from
-- real event volume above a robust minimum sample size — never hardcoded text. Removed
-- now rather than left live and unsubstantiated; a future auto-computed "Most clicked"
-- badge (gated on real tracking + a minimum session threshold) can reintroduce this once
-- there's enough baseline data (see project memory: 7-14 day unchanged baseline first).
-- "Top pick" badges on both rows are untouched — those are editorial, not click-derived.

UPDATE product_attributes
SET badges = (
  SELECT jsonb_agg(b) FROM jsonb_array_elements(badges) b WHERE b->>'label' != 'Most clicked'
)
WHERE slug = 'mercury' AND market = 'us' AND category = 'business-banking';

UPDATE product_attributes
SET badges = (
  SELECT jsonb_agg(b) FROM jsonb_array_elements(badges) b WHERE b->>'label' != 'Most clicked'
)
WHERE slug = 'wealthfront' AND market = 'us' AND category = 'personal-finance';

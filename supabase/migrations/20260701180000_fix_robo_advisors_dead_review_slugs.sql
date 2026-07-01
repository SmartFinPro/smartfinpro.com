-- Fix dead review_slug links for US robo-advisors comparison cockpit.
-- Link-checker audit (2026-07-01) found /us/personal-finance/{fidelity-go,schwab-intelligent,
-- vanguard-digital-advisor,sofi-robo}-review all return 404 — these MDX reviews were seeded
-- in 20260628120020_seed_robo_advisors_us.sql but never written as content.
-- Setting review_slug to NULL makes lib/comparison/loader.ts fall back to ctaMode='visit'
-- (external_url, already populated per row) instead of rendering a dead "Read review" CTA.
-- wealthfront-review and betterment-review are untouched — those MDX files exist.

UPDATE public.product_attributes
SET review_slug = NULL
WHERE market = 'us' AND category = 'personal-finance' AND topic = 'robo-advisors'
  AND slug IN ('fidelity-go', 'schwab-intelligent', 'vanguard-digital', 'sofi-robo');

-- Audit trail for a direct data fix applied via .scratch-migration/deactivate_leblanc.mjs
-- (service-role UPDATE against prod, matching the pattern used throughout this rollout).
--
-- Why: the "Philippe Leblanc" expert row (ca:forex reviewer) uses a portrait that is a
-- genuine gender mismatch (a woman's photo under a male name), found during the same
-- audit that fixed marc-fontaine.jpg, daniel-whitfield.jpg, james-miller.jpg and
-- michael-torres.jpg. No clean replacement photo remains in the reserve pool
-- (public/images/experts/expert-extra-15.jpg has a visible rendering artifact).
--
-- Setting verified=false makes fetchExpert() (lib/actions/experts.ts) skip this row and
-- fall back to the ca market-level default expert (Marc Fontaine, category IS NULL,
-- already fixed with a correct portrait) for ca/forex pages — a clean, non-broken
-- fallback rather than shipping a mismatched photo.
--
-- Follow-up: source a real headshot for Philippe Leblanc, set verified=true again.

UPDATE experts SET verified = false WHERE name = 'Philippe Leblanc' AND market_slug = 'ca' AND category = 'forex';

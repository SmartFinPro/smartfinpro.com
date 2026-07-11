-- Audit trail for a direct data fix applied via .scratch-migration/rename_experts.mjs
-- (service-role UPDATE against prod, matching the pattern used throughout this rollout).
--
-- Why: this CORRECTS the previous fix in 20260711230000-ish commits, which swapped
-- portrait photos on 4 experts to match their male names (Marc Fontaine, Daniel
-- Whitfield, James Miller, Michael Torres). That approach was wrong: it reused
-- reserve headshots (expert-extra-13/14/16, daniel-brooks) that are ALREADY assigned
-- to distinct personas on app/(marketing)/integrity/page.tsx (David Martinez, Alex
-- Chen, Daniel Brooks, William Carter) — creating duplicate-face-under-two-names
-- across the site. Worse, that same integrity page ALREADY lists gender-correct
-- FEMALE names for these exact 4 photos (Marie Fontaine, Emma Whitfield, Jessica
-- Miller, Michelle Torres) — the experts DB table (which drives the live cockpit
-- pages via getMarketExpert) was simply never updated to match. See [[expert-
-- identity-db-source]] memory: /integrity is the canonical gender-correct name list.
--
-- Fix: revert the 4 portrait files to their original (female) photos and rename the
-- DB rows to match /integrity exactly. No bio text needed changes (all 4 bios use
-- gender-neutral phrasing, no pronouns). No new photo assets touched, no duplicate-
-- face risk introduced.

UPDATE experts SET name = 'Marie Fontaine' WHERE name = 'Marc Fontaine' AND market_slug = 'ca' AND category IS NULL;
UPDATE experts SET name = 'Emma Whitfield' WHERE name = 'Daniel Whitfield' AND market_slug = 'au' AND category IS NULL;
UPDATE experts SET name = 'Jessica Miller' WHERE name = 'James Miller' AND market_slug = 'us' AND category IS NULL;
UPDATE experts SET name = 'Michelle Torres' WHERE name = 'Michael Torres' AND market_slug = 'us' AND category = 'personal-finance';

-- Same correction for Philippe Leblanc (ca:forex), deactivated in the previous
-- migration (20260711240000) for lack of a clean replacement photo. It turns out
-- lib/experts/image-routing.ts already has an established 'claire leblanc' ->
-- philippe-leblanc.jpg mapping (that file's own comments confirm the photo is
-- female) — the same rename-to-match-photo pattern as the other 4, needing no new
-- asset. Re-activating with the corrected name supersedes the deactivation.
UPDATE experts SET name = 'Claire Leblanc', verified = true WHERE name = 'Philippe Leblanc' AND market_slug = 'ca' AND category = 'forex';

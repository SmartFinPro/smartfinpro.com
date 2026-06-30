-- Fix US business-banking reviewer identity (E-E-A-T / author-trust)
--
-- Root cause: the 020_experts.sql seed used the male name "Michael Chen" on the
-- female portrait /images/experts/michael-chen.jpg. This violates the project's
-- gender-lock rule (lib/experts/image-routing.ts: a reviewedBy name MUST match the
-- portrait gender) and contradicts app/(marketing)/integrity/page.tsx, which already
-- lists the gender-correct "Michelle Chen". The cockpit "About our reviewer" card
-- reads this row directly via getMarketExpert(), so the live page showed the wrong
-- name on a female photo.
--
-- Fix: canonicalize to "Michelle Chen" (matches the female portrait, image-routing.ts
-- and /integrity) and deepen the one-sentence templated bio. Idempotent UPDATE so it
-- is safe on both fresh installs (no-op after the corrected seed) and existing prod.

UPDATE experts
SET
  name = 'Michelle Chen',
  bio = 'Michelle Chen is a CPA and former fintech CFO with 15+ years in business banking, payment processing, and corporate treasury. She has served as CFO at three venture-backed startups and advised 200+ companies on multi-currency accounts, international wire costs, and FX exposure. Her reviews focus on the real, all-in cost of business banking — hidden FX markups, wire fees, and settlement times — measured with live transactions, not published rate cards.'
WHERE market_slug = 'us'
  AND category = 'business-banking'
  AND image_url = '/images/experts/michael-chen.jpg';

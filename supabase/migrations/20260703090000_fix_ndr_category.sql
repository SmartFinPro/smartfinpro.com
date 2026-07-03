-- Fix national-debt-relief's affiliate_links category (Comparison Cockpit debt-relief slice).
--
-- The link was originally created with category='debt-relief' (20260221000001), but a later
-- orphan-slug migration (20260525100100, `ON CONFLICT (slug) DO NOTHING`) shows the live row
-- under category='personal-finance' — evidence the original migration never actually applied
-- in prod. Wrong category means getLinksForMarketCategory('us','debt-relief') never finds it,
-- so the debt-relief Cockpit would show no monetized offer for an otherwise-active link.
--
-- Fable-5 checkpoint review (Slice 1): do NOT restore the `?a=smartfinpro` destination_url
-- param or set tracking_status here — that same placeholder param appears identically on
-- multiple unrelated providers in the same 20260221000001 migration (a template value, not a
-- verified real referral code), and no S2S/dashboard confirmation exists for this session.
-- tracking_status stays at its DB default ('unverified') until externally verified — the
-- Cockpit will render National Debt Relief as a `review` CTA (its MDX review exists), not a
-- monetized `/go` offer, until that verification happens as a separate, explicit follow-up.
--
-- Idempotent (safe to re-run) and scoped to a single slug — no other affiliate_links rows touched.

UPDATE public.affiliate_links
SET category = 'debt-relief'
WHERE slug = 'national-debt-relief'
  AND market = 'us'
  AND category <> 'debt-relief';

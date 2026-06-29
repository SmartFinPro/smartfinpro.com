-- Comparison Cockpit — attribution gate columns on affiliate_links.
-- A provider only renders a monetized "View offer" /go CTA when its link's
-- tracking_status is 'verified' or 'dashboard_only' (see lib/comparison/loader.ts).
-- `network` was drifted out of the live DB; this restores it so the SubID router works.
-- Apply manually before the topic route ships.

ALTER TABLE public.affiliate_links
  ADD COLUMN IF NOT EXISTS tracking_status    VARCHAR(20) NOT NULL DEFAULT 'unverified'
    CHECK (tracking_status IN ('verified','dashboard_only','unverified','inactive')),
  ADD COLUMN IF NOT EXISTS postback_supported BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subid_param        VARCHAR(40),
  ADD COLUMN IF NOT EXISTS network            VARCHAR(40);

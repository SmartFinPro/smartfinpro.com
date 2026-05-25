-- Migration: Fix placeholder.com URLs and deactivate confirmed-dead affiliate links
-- Date: 2026-05-25
-- Reason: Audit revealed 3 links pointing to placeholder.com and 8 links with
--         health_status='dead' as of 2026-05-25 02:00 UTC check-links cron run.

-- ── 1. Fix placeholder.com URLs ────────────────────────────────────────────────
-- These active links redirect to placeholder.com — real product URLs below.
-- Real tracked affiliate URLs should replace these once program credentials are set up.

UPDATE affiliate_links
SET destination_url = 'https://www.etoro.com/trading/'
WHERE slug = 'etoro' AND destination_url LIKE '%placeholder.com%';

UPDATE affiliate_links
SET destination_url = 'https://systeme.io/'
WHERE slug = 'systeme-io' AND destination_url LIKE '%placeholder.com%';

UPDATE affiliate_links
SET destination_url = 'https://www.wealthsimple.com/en-ca/invest'
WHERE slug = 'wealthsimple' AND destination_url LIKE '%placeholder.com%';

-- ── 2. Deactivate dead links ────────────────────────────────────────────────────
-- health_status = 'dead' confirmed by check-links cron on 2026-05-25.
-- Deactivating prevents /go/ redirector from sending visitors to broken URLs.
-- Re-activate individually once destination URLs are confirmed working.

UPDATE affiliate_links
SET active = false
WHERE slug IN (
  'ally-invest-robo',
  'plus500',
  'plus500-au',
  'plus500-uk',
  'questrade',
  'revolut-business',
  'silvergoldbull-ca',
  'silvergoldbull-us'
)
AND health_status = 'dead';

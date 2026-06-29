-- Set official-site URLs on the US business-banking cockpit rows so each card
-- shows the green "Visit site → on <domain>" primary CTA (1:1 with the
-- robo-advisors cards). "Visit site" is the NON-monetized external CTA — the
-- attribution gate stays intact (no /go without a verified affiliate link).
-- Idempotent. Applied manually to prod on 2026-06-30 (deploy.yml runs no migrations).

UPDATE public.product_attributes SET external_url = 'https://mercury.com'
  WHERE market = 'us' AND category = 'business-banking' AND topic = 'business-bank-accounts' AND slug = 'mercury';

UPDATE public.product_attributes SET external_url = 'https://www.novo.co'
  WHERE market = 'us' AND category = 'business-banking' AND topic = 'business-bank-accounts' AND slug = 'novo';

UPDATE public.product_attributes SET external_url = 'https://relayfi.com'
  WHERE market = 'us' AND category = 'business-banking' AND topic = 'business-bank-accounts' AND slug = 'relay';

UPDATE public.product_attributes SET external_url = 'https://www.bluevine.com'
  WHERE market = 'us' AND category = 'business-banking' AND topic = 'business-bank-accounts' AND slug = 'bluevine';

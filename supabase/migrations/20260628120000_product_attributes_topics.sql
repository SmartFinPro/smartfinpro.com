-- Comparison Cockpit — generic topic + provenance columns on product_attributes.
-- Makes the banking-shaped table reusable for any "Best X" topic page.
-- Apply manually (deploy.yml runs no migrations) BEFORE the topic route ships.

ALTER TABLE public.product_attributes
  ADD COLUMN IF NOT EXISTS topic            VARCHAR(60),
  ADD COLUMN IF NOT EXISTS management_fee   DECIMAL(6,3),
  ADD COLUMN IF NOT EXISTS account_minimum  DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS attributes       JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deep_dive        TEXT,
  ADD COLUMN IF NOT EXISTS source_type      VARCHAR(20)
    CHECK (source_type IN ('official','regulator','editorial','user_reviews')),
  ADD COLUMN IF NOT EXISTS confidence       VARCHAR(10)
    CHECK (confidence IN ('high','medium','low'));

-- Backfill BEFORE the NOT NULL constraint (only business-banking rows exist today).
UPDATE public.product_attributes SET topic = 'business-bank-accounts'
  WHERE category = 'business-banking' AND topic IS NULL;

-- Any remaining NULL topic is a data error — fail loudly rather than allow dup-prone NULLs.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.product_attributes WHERE topic IS NULL;
  IF n > 0 THEN
    RAISE EXCEPTION 'Cannot set topic NOT NULL: % rows still have NULL topic', n;
  END IF;
END $$;

-- CRITICAL: a NULL in a unique constraint would allow duplicate (market,category,NULL,slug).
ALTER TABLE public.product_attributes ALTER COLUMN topic SET NOT NULL;

-- Drop the old unique constraint by lookup (do NOT trust the auto-generated name).
DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname
    FROM pg_constraint
   WHERE conrelid = 'public.product_attributes'::regclass
     AND contype  = 'u'
     AND conkey = (SELECT array_agg(attnum ORDER BY attnum)
                     FROM pg_attribute
                    WHERE attrelid = 'public.product_attributes'::regclass
                      AND attname IN ('market','category','slug')
                      AND NOT attisdropped);
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.product_attributes DROP CONSTRAINT %I', cname);
  END IF;
END $$;

-- Preflight: refuse to add the new constraint if it would be violated (rollback-safe).
DO $$
DECLARE dup int;
BEGIN
  SELECT count(*) INTO dup FROM (
    SELECT 1 FROM public.product_attributes
     GROUP BY market, category, topic, slug
    HAVING count(*) > 1
  ) d;
  IF dup > 0 THEN
    RAISE EXCEPTION 'Duplicate (market,category,topic,slug) rows present — resolve before unique constraint (% groups)', dup;
  END IF;
END $$;

ALTER TABLE public.product_attributes
  ADD CONSTRAINT product_attributes_uq UNIQUE (market, category, topic, slug);

-- Loader query path: market + category + topic, active only.
CREATE INDEX IF NOT EXISTS idx_pa_market_category_topic_active
  ON public.product_attributes (market, category, topic)
  WHERE active;

-- Comparison Cockpit — widen product_attributes.management_fee precision.
-- Existing DECIMAL(6,3) (3 decimal places) was sized for the fee ranges seen so far
-- (robo-advisor management fees like 0.25%, debt-relief settlement fees like 18.5%).
-- Forex-brokers (Slice 4) needs a genuine hundredths-of-a-basis-point rate — e.g.
-- Interactive Brokers' all-in round-turn cost is 0.00686% of notional. At 3 decimal
-- places Postgres silently rounds every one of the 5 seeded forex rates (0.0115,
-- 0.00686, 0.00837, 0.0168, 0.0127 -> 0.012/0.007/0.008/0.017/0.013), a 4-9% swing per
-- broker that would corrupt both the ranking metric and the live cost calculator's
-- dollar output. DECIMAL(8,5) gives 5 decimal places (up to 999.99999), comfortably
-- covering both the existing larger fee percentages and this new tiny-rate case.
-- Purely additive/widening — no existing data can be out of range, no CHECK
-- constraint exists on this column (see 20260628120000_product_attributes_topics.sql).
-- Apply manually (deploy.yml runs no migrations) BEFORE the forex-brokers seed
-- migration (20260703110000_seed_forex_brokers_us.sql).

ALTER TABLE public.product_attributes
  ALTER COLUMN management_fee TYPE DECIMAL(8,5);

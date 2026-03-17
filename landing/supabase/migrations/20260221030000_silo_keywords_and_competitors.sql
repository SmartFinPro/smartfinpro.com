-- Migration: Insert silo-specific keywords for ranking tracking
-- Phase 7.3: Competitor Intelligence — New Keywords for new silos
-- Run: npx supabase db push

-- US Credit Repair & Debt Relief Keywords
INSERT INTO keyword_rankings (keyword, market, position, impressions, clicks, ctr, date)
SELECT keyword, 'us', 0, 0, 0, 0, CURRENT_DATE
FROM unnest(ARRAY[
  'credit repair companies',
  'best credit repair companies',
  'fix credit score fast',
  'how to repair credit',
  'credit repair vs debt consolidation',
  'lexington law review',
  'the credit people review',
  'free credit score check',
  'debt relief programs',
  'national debt relief review',
  'debt consolidation loans bad credit',
  'best debt relief companies',
  'credit repair services near me',
  'how to dispute credit report errors',
  'credit repair for beginners',
  'debt consolidation vs bankruptcy',
  'credit score simulator',
  'how long does credit repair take',
  'legitimate credit repair companies',
  'debt payoff calculator'
]) AS keyword
ON CONFLICT DO NOTHING;

-- UK Remortgaging & Cost of Living Keywords
INSERT INTO keyword_rankings (keyword, market, position, impressions, clicks, ctr, date)
SELECT keyword, 'uk', 0, 0, 0, 0, CURRENT_DATE
FROM unnest(ARRAY[
  'remortgage rates 2026',
  'best remortgage deals',
  'fixed rate mortgage ending',
  'what to do when fixed rate ends',
  'habito review',
  'best mortgage brokers uk',
  'habito vs trussle',
  'remortgage calculator',
  'cost of living crisis uk',
  'how to reduce energy bills uk',
  'best high yield savings uk',
  'best savings accounts uk 2026',
  'mortgage broker comparison uk',
  'when should i remortgage',
  'remortgage fees explained',
  'svr mortgage rate',
  'best fixed rate mortgage uk',
  'uk cost of living 2026',
  'warm home discount eligibility',
  'energy saving tips uk'
]) AS keyword
ON CONFLICT DO NOTHING;

-- AU Superannuation & Gold Keywords
INSERT INTO keyword_rankings (keyword, market, position, impressions, clicks, ctr, date)
SELECT keyword, 'au', 0, 0, 0, 0, CURRENT_DATE
FROM unnest(ARRAY[
  'best super funds australia',
  'division 296 tax',
  'superannuation guide australia',
  'self managed super fund',
  'smsf setup guide',
  'perth mint review',
  'buy gold australia',
  'how to buy gold australia',
  'high interest savings accounts australia',
  'best savings accounts australia 2026',
  'super fund comparison australia',
  'division 296 super tax explained',
  'gold investing australia',
  'perth mint gold',
  'australian super review',
  'hostplus super review',
  'best performing super funds',
  'smsf investment strategy',
  'gold roi calculator',
  'superannuation calculator australia'
]) AS keyword
ON CONFLICT DO NOTHING;

-- CA Tax-Efficient Investing & Housing Keywords
INSERT INTO keyword_rankings (keyword, market, position, impressions, clicks, ctr, date)
SELECT keyword, 'ca', 0, 0, 0, 0, CURRENT_DATE
FROM unnest(ARRAY[
  'tfsa vs rrsp 2026',
  'fhsa guide canada',
  'first home savings account canada',
  'wealthsimple vs questrade',
  'best robo advisors canada',
  'first time home buyer grants canada',
  'best mortgage rates canada',
  'tax efficient investing canada',
  'rrsp contribution limit 2026',
  'tfsa contribution limit 2026',
  'wealthsimple review',
  'questrade review',
  'fhsa vs rrsp',
  'best tfsa investments',
  'best rrsp investments canada',
  'canadian robo advisor comparison',
  'first time home buyer incentive',
  'fhbi canada',
  'tfsa rrsp calculator',
  'mortgage rates canada today'
]) AS keyword
ON CONFLICT DO NOTHING;

-- Cross-Market Keywords
INSERT INTO keyword_rankings (keyword, market, position, impressions, clicks, ctr, date)
SELECT keyword, 'us', 0, 0, 0, 0, CURRENT_DATE
FROM unnest(ARRAY[
  'ai financial coaching',
  'best ai financial advisors',
  'ai financial advisor review',
  'green finance guide',
  'best esg funds 2026',
  'esg investing guide',
  'sustainable investing',
  'ai wealth management'
]) AS keyword
ON CONFLICT DO NOTHING;

-- Insert competitor domains for new silos
INSERT INTO competitors (domain, market, cps_score, keywords, last_checked)
VALUES
  -- US Competitors
  ('creditrepair.com', 'us', 0, '{"credit repair companies", "fix credit score"}', CURRENT_TIMESTAMP),
  ('lexingtonlaw.com', 'us', 0, '{"lexington law", "credit repair"}', CURRENT_TIMESTAMP),
  ('nationaldebtrelief.com', 'us', 0, '{"debt relief", "debt consolidation"}', CURRENT_TIMESTAMP),
  ('creditkarma.com', 'us', 0, '{"free credit score", "credit monitoring"}', CURRENT_TIMESTAMP),
  -- UK Competitors
  ('habito.com', 'uk', 0, '{"mortgage broker", "remortgage"}', CURRENT_TIMESTAMP),
  ('trussle.com', 'uk', 0, '{"remortgage", "online mortgage broker"}', CURRENT_TIMESTAMP),
  ('moneysavingexpert.com', 'uk', 0, '{"savings accounts", "cost of living"}', CURRENT_TIMESTAMP),
  ('which.co.uk', 'uk', 0, '{"best mortgage", "savings comparison"}', CURRENT_TIMESTAMP),
  -- AU Competitors
  ('canstar.com.au', 'au', 0, '{"super funds", "savings accounts"}', CURRENT_TIMESTAMP),
  ('finder.com.au', 'au', 0, '{"super funds", "gold investing"}', CURRENT_TIMESTAMP),
  ('moneysmart.gov.au', 'au', 0, '{"superannuation", "financial advice"}', CURRENT_TIMESTAMP),
  -- CA Competitors
  ('wealthsimple.com', 'ca', 0, '{"robo advisor", "tfsa"}', CURRENT_TIMESTAMP),
  ('ratehub.ca', 'ca', 0, '{"mortgage rates", "tfsa vs rrsp"}', CURRENT_TIMESTAMP),
  ('moneysense.ca', 'ca', 0, '{"investing", "fhsa"}', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert A/B test configurations for new silo CTAs (Phase 7.4)
INSERT INTO ab_tests (name, variant_a, variant_b, impressions, significance)
VALUES
  ('US Credit Repair CTA Color', 'gold-bg', 'navy-bg', 0, 0),
  ('UK Remortgage CTA Text', 'Get Free Quote', 'Compare Rates Now', 0, 0),
  ('AU Super CTA Position', 'above-fold', 'after-comparison', 0, 0),
  ('CA TFSA CTA Style', 'button-large', 'button-inline', 0, 0)
ON CONFLICT DO NOTHING;

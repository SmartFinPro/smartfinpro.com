// lib/comparison/dev-seed.ts
// DEV-ONLY fallback data, mirroring supabase/migrations/20260627121000_seed_business_banking_us.sql.
// Lets `npm run dev` render /[market]/[category]/best BEFORE the migration is
// applied to Supabase. The loader uses this ONLY when NODE_ENV !== 'production'
// and the product_attributes query is empty/unavailable — it can never affect
// production. Once the migration + seed are live, real DB rows take over.

/* eslint-disable @typescript-eslint/no-explicit-any */
export const DEV_SEED_ROWS: Record<string, any[]> = {
  'us/business-banking': [
    {
      slug: 'mercury', market: 'us', category: 'business-banking', display_name: 'Mercury',
      tagline: 'Best business banking for VC-backed startups', logo_url: null, verified: true,
      score: 9.4, rating: 4.5, review_count: 1240, monthly_fee: 0, signup_bonus: 0, fx_fee_pct: 1, atm_fee: 0, apy: 0, clicks: 1240,
      badges: [{ type: 'gold', label: 'Top pick' }, { type: 'sky', label: 'Most clicked' }],
      chips: ['FDIC up to $5M', 'Opens in ~10 min', 'US LLCs & C-Corps'],
      pros: ['No monthly fees, no minimums', '$5M FDIC via sweep network', 'Free USD wires + treasury option'],
      cons: ['No cash deposits', 'US-registered businesses only'],
      sub_scores: { fees: 9.6, features: 9.3, ux: 9.2, support: 8.9 },
      effective_apr: 'n/a (debit)', cashback: '—', card_network: 'Mastercard', wire_transfers: 'Free USD wires', fdic_coverage: '$5M (sweep)', apps: ['apple', 'android', 'web'],
      verdict: 'The best all-rounder for funded startups',
      has_no_monthly_fee: true, has_free_atm: false, has_no_fx_fee: false, has_cashback: false, has_bonus: false, has_sub_accounts: true, has_interest: false, has_apple_pay: true,
      entity_types: ['llc', 's-corp', 'c-corp'], supports_cash_deposits: false, supports_intl_wires: true, has_bookkeeping: false, has_lending: false, integrations: ['quickbooks', 'stripe', 'xero'],
      is_affiliate: true, review_slug: 'mercury-review', external_url: null, is_top_pick: true, best_for: 'Funded startups', display_order: 1,
    },
    {
      slug: 'novo', market: 'us', category: 'business-banking', display_name: 'Novo',
      tagline: 'Best for freelancers and solopreneurs', logo_url: null, verified: true,
      score: 8.8, rating: 4.0, review_count: 910, monthly_fee: 0, signup_bonus: 0, fx_fee_pct: 0, atm_fee: 0, apy: 0, clicks: 1050,
      badges: [{ type: 'green', label: 'Best for freelancers' }],
      chips: ['FDIC standard', 'Refunds ATM fees', 'US sole props & LLCs'],
      pros: ['Truly $0 monthly fee', 'Refunds all ATM fees', 'Stripe & Shopify integrations'],
      cons: ['No interest on balances', 'No international wires'],
      sub_scores: { fees: 9.4, features: 8.6, ux: 8.8, support: 8.4 },
      effective_apr: 'n/a (debit)', cashback: '—', card_network: 'Mastercard', wire_transfers: 'Domestic only', fdic_coverage: 'Standard ($250k)', apps: ['apple', 'android', 'web'],
      verdict: 'The strongest truly-free pick for freelancers',
      has_no_monthly_fee: true, has_free_atm: true, has_no_fx_fee: true, has_cashback: false, has_bonus: false, has_sub_accounts: false, has_interest: false, has_apple_pay: true,
      entity_types: ['sole-prop', 'llc', 's-corp'], supports_cash_deposits: false, supports_intl_wires: false, has_bookkeeping: false, has_lending: false, integrations: ['stripe', 'shopify', 'quickbooks'],
      is_affiliate: true, review_slug: 'novo-review', external_url: null, is_top_pick: false, best_for: 'Freelancers', display_order: 2,
    },
    {
      slug: 'relay', market: 'us', category: 'business-banking', display_name: 'Relay',
      tagline: 'Best for teams and Profit First', logo_url: null, verified: true,
      score: 9.0, rating: 4.2, review_count: 780, monthly_fee: 0, signup_bonus: 0, fx_fee_pct: 1, atm_fee: 0, apy: 0, clicks: 760,
      badges: [{ type: 'green', label: 'Best for teams' }],
      chips: ['FDIC up to $3M', 'Up to 20 accounts', 'US businesses'],
      pros: ['Up to 20 checking accounts', 'Roles & permissions for teams', 'No-fee Allpoint ATMs'],
      cons: ['Wires $5 on free plan (free on Grow)', 'No lending'],
      sub_scores: { fees: 9.2, features: 9.0, ux: 8.6, support: 8.5 },
      effective_apr: 'n/a (debit)', cashback: '—', card_network: 'Visa', wire_transfers: 'Outgoing $5 (free on Grow)', fdic_coverage: '$3M (sweep)', apps: ['apple', 'android', 'web'],
      verdict: 'Built for teams and Profit-First budgeting',
      has_no_monthly_fee: true, has_free_atm: true, has_no_fx_fee: false, has_cashback: false, has_bonus: false, has_sub_accounts: true, has_interest: false, has_apple_pay: true,
      entity_types: ['llc', 's-corp', 'c-corp', 'sole-prop'], supports_cash_deposits: true, supports_intl_wires: true, has_bookkeeping: false, has_lending: false, integrations: ['quickbooks', 'xero'],
      is_affiliate: true, review_slug: 'relay-review', external_url: null, is_top_pick: false, best_for: 'Teams', display_order: 3,
    },
    {
      slug: 'bluevine', market: 'us', category: 'business-banking', display_name: 'Bluevine',
      tagline: 'Best APY if you keep a balance', logo_url: null, verified: true,
      score: 8.7, rating: 4.0, review_count: 1520, monthly_fee: 0, signup_bonus: 500, fx_fee_pct: 2.9, atm_fee: 2.5, apy: 1.3, clicks: 900,
      badges: [{ type: 'green', label: 'Highest APY' }],
      chips: ['FDIC up to $3M', '1.3% APY (Standard)', 'US businesses'],
      pros: ['1.3% APY on balances up to $250k', '$500 signup bonus (terms apply)', 'Lines of credit available'],
      cons: ['$2.50 out-of-network ATM fee', '2.9% foreign transaction fee'],
      sub_scores: { fees: 7.8, features: 8.8, ux: 8.2, support: 8.2 },
      effective_apr: 'n/a (debit)', cashback: '—', card_network: 'Mastercard', wire_transfers: 'Outgoing wires (fee)', fdic_coverage: '$3M (sweep)', apps: ['apple', 'android', 'web'],
      verdict: 'The pick if you park a higher balance',
      has_no_monthly_fee: true, has_free_atm: false, has_no_fx_fee: false, has_cashback: false, has_bonus: true, has_sub_accounts: false, has_interest: true, has_apple_pay: true,
      entity_types: ['llc', 's-corp', 'c-corp', 'sole-prop'], supports_cash_deposits: true, supports_intl_wires: false, has_bookkeeping: false, has_lending: true, integrations: ['quickbooks'],
      is_affiliate: false, review_slug: 'bluevine-review', external_url: null, is_top_pick: false, best_for: 'High balances', display_order: 4,
    },
    {
      slug: 'lili', market: 'us', category: 'business-banking', display_name: 'Lili',
      tagline: 'Best built-in tax tools for freelancers', logo_url: null, verified: true,
      score: 8.2, rating: 4.0, review_count: 640, monthly_fee: 15, signup_bonus: 0, fx_fee_pct: 3, atm_fee: 0, apy: 0, clicks: 540,
      badges: [{ type: 'green', label: 'Best tax tools' }],
      chips: ['FDIC standard', 'Free MoneyPass ATMs', 'US sole props'],
      pros: ['Built-in tax buckets (Pro)', '1% cashback (Pro)', 'Free MoneyPass ATMs'],
      cons: ['$15/mo for Pro features', '3% foreign transaction fee'],
      sub_scores: { fees: 8.0, features: 8.2, ux: 8.4, support: 7.8 },
      effective_apr: 'n/a (debit)', cashback: '1% (Pro)', card_network: 'Visa', wire_transfers: 'Not supported', fdic_coverage: 'Standard ($250k)', apps: ['apple', 'android', 'web'],
      verdict: 'Best for tax-conscious freelancers',
      has_no_monthly_fee: false, has_free_atm: true, has_no_fx_fee: false, has_cashback: true, has_bonus: false, has_sub_accounts: false, has_interest: false, has_apple_pay: true,
      entity_types: ['sole-prop', 'llc'], supports_cash_deposits: true, supports_intl_wires: false, has_bookkeeping: true, has_lending: false, integrations: [],
      is_affiliate: false, review_slug: null, external_url: 'https://lili.co/', is_top_pick: false, best_for: 'Tax tools', display_order: 5,
    },
  ],
};
/* eslint-enable @typescript-eslint/no-explicit-any */

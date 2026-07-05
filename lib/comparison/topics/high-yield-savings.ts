// lib/comparison/topics/high-yield-savings.ts
// TopicConfig for "Best High-Yield Savings Accounts" (US, personal-finance silo).
// Pure module — no React, no server imports.
//
// Route: /us/personal-finance/best/high-yield-savings
//
// 8 candidates: SoFi, CIT Bank Platinum Savings, Barclays Tiered Savings,
// Marcus by Goldman Sachs, Synchrony Bank, Ally Bank, American Express National
// Bank, Capital One 360 Performance Savings.
// Discover Bank is excluded — Capital One merger (May 2025) halted new accounts.
//
// Cost model note: All 8 accounts carry $0 monthly fees. The 'banking' cost
// model's `annualCost = monthlyFee × 12 × years` collapses to $0 for every
// row. We seed monthly_fee = 0 for all — the cost calculator is honest (no
// fees) but the primary comparison signal lives in specColumns (APY, min
// balance). This mirrors the credit-monitoring pattern.
//
// APY note: HYSA rates are variable and can change weekly. All figures verified
// July 2–5, 2026. Federal Funds Rate target 3.50–3.75% (unchanged June 2026).
// Rates are seeded in `attributes.apy` as the PRIMARY rate a new customer is
// likely to see; conditions live in `attributes.apy_note`. SoFi's headline is
// the direct-deposit tier (3.10%); the 4.50% Plus tier is in apy_note.
//
// Attribution Gate: None of the 8 providers has an active affiliate_links row
// in prod (SoFi has one for personal loans; a separate savings link does not
// exist). All CTAs resolve to 'visit'. is_affiliate = false for all rows.
//
// Provenance: docs/superpowers/plans/2026-07-05-cockpit-hysa-source-matrix.md
// + docs/superpowers/plans/2026-07-05-cockpit-hysa-planned-seed-values.md.

import { z } from 'zod';
import type { TopicConfig } from './types';
import type { ProductForComparison } from '@/lib/comparison/types';

/** HYSA-specific attributes stored in product_attributes.attributes. Validated per row. */
export const highYieldSavingsAttributesSchema = z
  .object({
    apy: z.number(), // Primary APY (e.g. 3.10 = 3.10%) — see apy_note for full picture
    apy_note: z.string(), // Conditions, tiers, expiry dates — always shown alongside apy
    apy_type: z.enum(['standard', 'conditional', 'tiered']),
    // standard = no conditions; conditional = requires DD/Plus; tiered = balance-based
    min_balance_for_apy: z.number(), // $0 for most; $5000 for CIT
    min_opening_deposit: z.number(), // $100 CIT only; $0 all others
    atm_access: z.boolean(),
    atm_note: z.string().optional(),
    max_fdic_coverage: z.number(), // 250000 standard; 2000000 for SoFi sweep
    fdic_note: z.string().optional(),
    review_score: z.number(), // consumer rating (source in review_source)
    review_count: z.number(), // 0 if source has no public count
    review_source: z.string(), // 'Trustpilot', 'App Store', 'Google Play'
    review_note: z.string().optional(), // cross-platform caveats
    bbb_rating: z.string().optional(), // 'A+', 'A', etc.
    bbb_complaints_3yr: z.number().optional(),
    app_store_rating_ios: z.number().optional(),
    regulatory_history_note: z.string(),
    affiliate_status_note: z.string().optional(),
  })
  .passthrough();

const apy = (p: ProductForComparison): number =>
  typeof p.attributes?.apy === 'number' ? (p.attributes.apy as number) : 0;

const minBal = (p: ProductForComparison): number =>
  typeof p.attributes?.min_balance_for_apy === 'number'
    ? (p.attributes.min_balance_for_apy as number)
    : 0;

const fdic = (p: ProductForComparison): number =>
  typeof p.attributes?.max_fdic_coverage === 'number'
    ? (p.attributes.max_fdic_coverage as number)
    : 250000;

const attrStr = (p: ProductForComparison, k: string): string => {
  const v = p.attributes?.[k];
  return v != null && v !== '' ? String(v) : '—';
};

export const highYieldSavingsConfig: TopicConfig = {
  slug: 'high-yield-savings',
  category: 'personal-finance',
  label: 'High-Yield Savings Accounts',
  h1: (y) => `Best high-yield savings accounts in ${y}`,
  metaTitle: (y) => `Best High-Yield Savings Accounts (${y}) — Compared & Ranked`,
  metaDescription: (y) =>
    `Compare the best US high-yield savings accounts of ${y}: APY rates, FDIC coverage, minimum balances, ATM access, and a side-by-side fee analysis — all FDIC-insured, no fees.`,
  intro:
    'Independent comparison of the leading FDIC-insured high-yield savings accounts — ranked by APY, minimum balance requirements, and features. All $0 monthly fees. Rates verified July 2026.',
  publishedDate: '2026-07-05',
  attributesSchema: highYieldSavingsAttributesSchema,

  specColumns: [
    {
      key: 'apy',
      label: 'APY',
      accessor: (p) => apy(p),
      format: (v) => (v != null && Number(v) > 0 ? `${Number(v).toFixed(2)}%` : '—'),
      winner: 'max',
      sortKey: 'highestApy',
    },
    {
      key: 'minBalance',
      label: 'Min. for top rate',
      accessor: (p) => minBal(p),
      format: (v) => (Number(v) === 0 ? 'None' : `$${Number(v).toLocaleString('en-US')}`),
      winner: 'min',
      sortKey: 'lowestMinimum',
    },
    {
      key: 'fdic',
      label: 'FDIC coverage',
      accessor: (p) => fdic(p),
      format: (v) => (Number(v) > 250000 ? 'Up to $2M' : '$250k'),
      winner: 'max',
    },
  ],

  filters: [
    {
      key: 'noMinBalance',
      label: 'No min. for top APY',
      predicate: (p) => minBal(p) === 0,
    },
    {
      key: 'atmAccess',
      label: 'ATM / debit card',
      predicate: (p) => p.attributes?.atm_access === true,
    },
    {
      key: 'extendedFdic',
      label: 'Extended FDIC ($2M+)',
      predicate: (p) => fdic(p) > 250000,
    },
    {
      key: 'noConditions',
      label: 'No APY conditions',
      predicate: (p) => p.attributes?.apy_type === 'standard',
    },
  ],

  priorityChips: [
    { id: 'highestApy', label: 'Highest APY', icon: 'TrendingUp', sort: 'highestApy' },
    { id: 'noMin', label: 'No minimum', icon: 'Coins', sort: 'lowestMinimum' },
    { id: 'atmAccess', label: 'ATM access', icon: 'CreditCard', sort: 'smart' },
    { id: 'bestRated', label: 'Top rated', icon: 'Star', sort: 'rating' },
  ],

  matcher: [
    {
      id: 'balance',
      label: 'How much are you planning to save?',
      weight: 14,
      options: [
        { value: 'small', label: 'Under $5,000' },
        { value: 'medium', label: '$5,000 – $25,000' },
        { value: 'large', label: 'Over $25,000' },
      ],
      award: (p, a) => {
        const min = minBal(p);
        const cov = fdic(p);
        if (a === 'small') {
          return { matched: min === 0, reason: 'No minimum balance required' };
        }
        if (a === 'large') {
          return {
            matched: cov > 250000,
            reason: cov > 250000 ? 'Up to $2M FDIC via partner banks' : undefined,
          };
        }
        return { matched: true };
      },
    },
    {
      id: 'directDeposit',
      label: 'Do you receive regular direct deposits or payroll?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      award: (p, a) => {
        const type = p.attributes?.apy_type as string | undefined;
        if (a === 'yes') {
          return {
            matched: type === 'conditional' || type === 'standard',
            reason: type === 'conditional' ? 'Direct deposit unlocks competitive APY' : 'No conditions required',
          };
        }
        return {
          matched: type === 'standard',
          reason: type === 'standard' ? 'No direct deposit required' : undefined,
        };
      },
    },
    {
      id: 'atmNeeded',
      label: 'Do you want a debit card or ATM access?',
      weight: 8,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "No, I'll transfer electronically" },
      ],
      award: (p, a) => {
        const hasAtm = p.attributes?.atm_access as boolean | undefined;
        if (a === 'yes') return { matched: hasAtm === true, reason: 'Debit card / ATM included' };
        return { matched: true };
      },
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Best overall', metric: (p) => p.score },
    {
      value: 'highestApy',
      label: 'Highest APY',
      metric: (p) => apy(p),
      dir: 'desc',
    },
    {
      value: 'lowestMinimum',
      label: 'No minimum balance',
      metric: (p) => -minBal(p),
      dir: 'desc',
    },
    { value: 'rating', label: 'Top rated', metric: (p) => p.rating, dir: 'desc' },
  ],

  costModel: {
    kind: 'banking',
    amountLabel: 'Balance',
    amountMin: 1000,
    amountMax: 100000,
    amountStep: 1000,
    amountDefault: 10000,
    yearsLabel: 'Years',
    yearsMin: 1,
    yearsMax: 10,
    yearsDefault: 3,
  },

  compareRows: [
    {
      key: 'apy',
      label: 'APY',
      accessor: (p) => {
        const a = apy(p);
        return a > 0 ? `${a.toFixed(2)}%` : '—';
      },
      score: (p) => apy(p),
    },
    {
      key: 'minBalance',
      label: 'Min. for top APY',
      accessor: (p) => {
        const m = minBal(p);
        return m > 0 ? `$${m.toLocaleString('en-US')}` : 'None';
      },
      score: (p) => (minBal(p) === 0 ? 1 : 0),
    },
    {
      key: 'atm',
      label: 'ATM / debit card',
      accessor: (p) => (p.attributes?.atm_access ? 'Yes' : 'No'),
      score: (p) => (p.attributes?.atm_access ? 1 : 0),
    },
    {
      key: 'fdic',
      label: 'Max FDIC coverage',
      accessor: (p) => {
        const cov = fdic(p);
        return cov > 250000
          ? `$${(cov / 1_000_000).toFixed(0)}M via sweep`
          : '$250k (standard)';
      },
      score: (p) => fdic(p),
    },
    {
      key: 'monthlyFee',
      label: 'Monthly fee',
      accessor: () => '$0',
      score: () => 1,
    },
    {
      key: 'minOpen',
      label: 'Min. to open',
      accessor: (p) => (p.accountMinimum > 0 ? `$${p.accountMinimum}` : '$0'),
      score: (p) => (p.accountMinimum === 0 ? 1 : 0),
    },
  ],

  detailRows: [
    {
      key: 'apyNote',
      label: 'APY conditions',
      accessor: (p) => attrStr(p, 'apy_note'),
    },
    {
      key: 'fdicNote',
      label: 'FDIC details',
      accessor: (p) => attrStr(p, 'fdic_note') !== '—' ? attrStr(p, 'fdic_note') : 'Standard $250k per depositor',
    },
    {
      key: 'atmNote',
      label: 'ATM / card details',
      accessor: (p) => attrStr(p, 'atm_note') !== '—' ? attrStr(p, 'atm_note') : 'No ATM card issued',
    },
    {
      key: 'reviewSource',
      label: 'Consumer rating',
      accessor: (p) => {
        const score = p.attributes?.review_score as number | undefined;
        const count = p.attributes?.review_count as number | undefined;
        const source = p.attributes?.review_source as string | undefined;
        if (!score || !source) return '—';
        const countStr = count && count > 0 ? ` from ${count.toLocaleString('en-US')} reviews` : '';
        return `${score}/5${countStr} (${source})`;
      },
    },
    {
      key: 'bbb',
      label: 'BBB rating',
      accessor: (p) => {
        const r = p.attributes?.bbb_rating as string | undefined;
        const c = p.attributes?.bbb_complaints_3yr as number | undefined;
        if (!r) return '—';
        return c != null && c > 0 ? `${r} (${c.toLocaleString('en-US')} complaints / 3 yr)` : r;
      },
    },
    {
      key: 'regulatory',
      label: 'Regulatory history',
      accessor: (p) => attrStr(p, 'regulatory_history_note'),
    },
  ],

  verdict: {
    intro:
      'SoFi leads for members who receive direct deposit — 3.10% APY with no minimums, a debit card, 55k ATMs, and up to $2M FDIC coverage. CIT Bank Platinum Savings wins on pure APY (4.10% promo through August 2026, 3.75% standard) but requires $5,000 to unlock the competitive rate.',
    picks: [
      { slug: 'sofi', label: 'Best overall (direct deposit members)' },
      { slug: 'cit-bank', label: 'Highest APY ($5k+ balance)' },
      { slug: 'barclays', label: 'Best no-conditions APY' },
      { slug: 'synchrony', label: 'Only account with an ATM card option' },
      { slug: 'ally', label: 'Best savings goal tools' },
      { slug: 'capital-one', label: 'Best mobile app and ATM network' },
    ],
  },

  methodology:
    'We compared eight FDIC-insured US high-yield savings accounts against six criteria: current APY (verified July 2–5, 2026 via official bank sites and at least two independent aggregators), minimum balance requirements, ATM/debit card access, FDIC coverage, consumer ratings (Trustpilot, App Store, and BBB — noting where ratings are skewed by co-branded credit card complaints), and regulatory/compliance history. Affiliate relationships do not influence rankings; SoFi and Ally are confirmed affiliate partners but are ranked on merit.',

  buyerGuide: [
    {
      h3: 'APY conditions matter more than the headline rate',
      body: "The highest advertised APY rarely applies unconditionally. SoFi's 3.10% requires regular direct deposit; without it you earn 1.20%. CIT's 3.75% requires $5,000 on deposit — below that, it pays 0.25%. Always check what you need to do to earn the advertised rate, not just the number.",
    },
    {
      h3: 'FDIC coverage: $250k standard, $2M with SoFi',
      body: "Every account here is FDIC-insured up to the standard $250,000 per depositor per institution. SoFi uses a partner-bank sweep network to extend coverage up to $2 million — relevant only if you're keeping large balances. Note: Capital One and Discover accounts opened after May 18, 2025 share a single $250k limit across both institutions.",
    },
    {
      h3: 'ATM access is rare in this category — and matters',
      body: 'Most HYSAs are electronic-only savings vaults with no debit card. Only SoFi (55k ATMs via Allpoint) and Synchrony (optional ATM card, $5/month reimbursement) provide direct cash access. Capital One 360 connects to 70k+ ATMs but functions as a savings account, not a checking account. If you need cash flexibility, these three are your options.',
    },
    {
      h3: 'Online-only banks and transfer delays',
      body: 'Every account on this page is an online bank with no physical branch (Capital One has select branches, but not everywhere). Transfers typically take 1–3 business days via ACH. Barclays users report 5-business-day delays. SoFi and Ally are generally faster. If you need same-day liquidity, keep a small amount in your primary checking account.',
    },
    {
      h3: 'Rates are variable — bookmark this page',
      body: "HYSA APYs track the Federal Funds Rate and can change without notice. The Fed held rates at 3.50–3.75% at its June 2026 meeting; 11 of 14 major HYSA rate changes since May 2026 have been decreases. Barclays' current promotional rates expire July 31, 2026. CIT's 4.10% promo runs through August 2026. We update this comparison monthly — rates shown here were verified July 2–5, 2026.",
    },
  ],

  faq: [
    {
      q: 'What is a high-yield savings account?',
      a: 'A high-yield savings account (HYSA) is an FDIC-insured savings account that pays a significantly higher interest rate than a traditional bank savings account (currently 10–20x the national average of 0.41%). They are typically offered by online banks with no physical branches, which allows them to pass overhead savings on as higher APYs. Your money is safe up to $250,000 per institution — or $2M with SoFi.',
    },
    {
      q: 'How are HYSA rates set?',
      a: 'HYSA rates are variable and largely track the Federal Funds Rate set by the Federal Reserve. When the Fed raises rates, HYSA APYs typically follow within days to weeks. When the Fed cuts rates, banks usually lower HYSA rates quickly. The current target range (July 2026) is 3.50–3.75%. Rates can change without notice — always verify the current rate directly with the bank before opening an account.',
    },
    {
      q: "Is SoFi's 4.50% APY too good to be true?",
      a: "No — but it requires a $10/month SoFi Plus subscription ($120/year). On a $10,000 balance, the difference between SoFi Plus (4.50%) and standard direct deposit (3.10%) is $140/year in extra interest — roughly $20 net after the subscription cost. On smaller balances, the math doesn't work in your favor. The 3.10% direct-deposit rate requires no subscription and is competitive on its own.",
    },
    {
      q: 'What happens to my rate if the Fed cuts interest rates?',
      a: 'HYSA rates are not fixed — they fall when the Fed cuts rates, sometimes within days. If you opened a CIT Bank account for its 4.10% promo APY (valid through August 2026), the rate will reset after the promotional period. Barclays promotional rates expire July 31, 2026. There is no way to lock in an HYSA rate the way a CD locks in a fixed rate for a term.',
    },
    {
      q: 'How is FDIC insurance calculated if I bank at both Capital One and Discover?',
      a: "Since Capital One completed its acquisition of Discover in May 2025, accounts at both institutions are treated as deposits at the same FDIC member institution. If you hold accounts at both Capital One and Discover opened after May 18, 2025, your FDIC coverage is capped at $250,000 combined — not $250,000 at each bank. If you have existing accounts predating the merger, contact both banks to clarify your coverage status.",
    },
    {
      q: 'Can I lose money in a high-yield savings account?',
      a: "No — all accounts in this comparison are FDIC-insured up to $250,000 per depositor per institution (SoFi extends coverage to $2M via its partner-bank sweep network). Unlike money market funds, HYSA deposits are bank deposits protected by the full faith and credit of the US government. You won't lose principal, though your interest rate can decrease at any time.",
    },
  ],

  compliance: {
    notice:
      'All accounts in this comparison are FDIC-insured up to $250,000 per depositor per institution; SoFi uses a partner-bank sweep network to extend coverage up to $2,000,000. APY rates are variable and can change without notice — verify the current rate directly with the bank before opening. SmartFinPro earns affiliate commissions on referrals to SoFi and Ally Bank; editorial rankings are independent of these relationships. Capital One and Discover customers should note that combined balances at both institutions now share a single $250k FDIC limit.',
    regulators: ['FDIC', 'CFPB'],
  },
};

// lib/tools/registry/registry.ts
// Single Source of Truth für alle 17 Tool-Konzepte / 20 Routen-Varianten (Ist-Zustand, PR 0.1).
// Title/Description/H1 sind WÖRTLICH aus SPEC Kapitel 9.1 übernommen
// (docs/superpowers/specs/2026-07-12-financial-decision-lab-design.md), außer wo unten
// dokumentiert. indexable folgt SPEC Kapitel 9.2.
//
// Bekannte Ist-Zustand-Abweichungen (Parity-Pflicht, siehe Plan Task 1):
// - gold-roi: Umzug nach /au/tools/gold-roi-calculator ist mit Task 0.3
//   abgeschlossen (vorher: alter US-Pfad '/tools/gold-roi-calculator', siehe
//   legacyPaths + next.config.ts-Redirect). Titel kommt weiterhin von der
//   BESTEHENDEN Page, nicht aus SPEC 9.1 — H1/Description sind pfadunabhängig
//   korrekt und kommen aus SPEC.
// - credit-utilization: registriert unter dem alten Slug
//   '/tools/credit-score-simulator' (Slug-Wechsel erst Phase 5). Titel kommt daher von
//   der BESTEHENDEN Page (app/(marketing)/tools/credit-score-simulator/page.tsx),
//   nicht aus SPEC 9.1 — H1/Description sind pfadunabhängig korrekt und kommen aus SPEC.

import type { ToolDefinition, ToolId } from './types';

export const TOOL_REGISTRY: Record<ToolId, ToolDefinition> = {
  'money-leak-scanner': {
    id: 'money-leak-scanner',
    name: 'Money Leak Scanner',
    tier: 'major',
    decisionCategory: 'spend',
    shellMode: 'live-canvas',
    icon: 'scan-search',
    blurb: 'Scan your budget in two minutes to reveal hidden money leaks and get three fixes.',
    variants: [
      {
        market: 'us',
        path: '/tools/money-leak-scanner',
        status: 'live',
        indexable: true,
        title: 'Money Leak Scanner: Find Hidden Household Overspend',
        metaDescription:
          'Scan your household budget in two minutes to reveal hidden money leaks, see your biggest cost drains and get three prioritized fixes with savings.',
        h1: 'Money Leak Scanner',
      },
      {
        market: 'uk',
        path: '/uk/tools/money-leak-scanner',
        status: 'live',
        indexable: true,
        title: 'Money Leak Scanner UK: Find Hidden Household Waste',
        metaDescription:
          'Scan your UK household budget in two minutes to reveal hidden money leaks from subscriptions to insurance, with three prioritized fixes and savings.',
        h1: 'Money Leak Scanner UK',
      },
      {
        market: 'ca',
        path: '/ca/tools/money-leak-scanner',
        status: 'live',
        indexable: true,
        title: 'Money Leak Scanner Canada: Find Hidden Overspend',
        metaDescription:
          'Scan your Canadian household budget in two minutes to reveal hidden money leaks from banking fees to insurance, with three prioritized fixes.',
        h1: 'Money Leak Scanner Canada',
      },
      {
        market: 'au',
        path: '/au/tools/money-leak-scanner',
        status: 'live',
        indexable: true,
        title: 'Money Leak Scanner Australia: Find Hidden Overspend',
        metaDescription:
          'Scan your Australian household budget in two minutes to reveal hidden money leaks from subscriptions to insurance, with three prioritized fixes.',
        h1: 'Money Leak Scanner Australia',
      },
    ],
  },

  'broker-finder': {
    id: 'broker-finder',
    name: 'Broker Finder Quiz',
    tier: 'major',
    decisionCategory: 'broker',
    shellMode: 'guided-journey',
    icon: 'compass',
    blurb: 'Answer five quick questions and get a matched broker shortlist with clear reasoning.',
    // SPEC 4.2: globales Broker-Triple — funktional in allen 4 Märkten via
    // getToolEntryHref() + validiertem ?market=-Param, keine lokalisierten Duplikat-Routen.
    availableMarkets: ['us', 'uk', 'ca', 'au'],
    variants: [
      {
        market: 'us',
        path: '/tools/broker-finder',
        status: 'live',
        indexable: true,
        title: 'Broker Finder Quiz: Match Your Ideal Trading Platform',
        metaDescription:
          'Answer five quick questions about your trading style and get a matched broker shortlist with clear reasoning, estimated costs and sensible next steps.',
        h1: 'Broker Finder Quiz',
      },
    ],
  },

  'trading-cost': {
    id: 'trading-cost',
    name: 'Trading Cost Calculator',
    tier: 'supporting',
    decisionCategory: 'broker',
    shellMode: 'precision-worksheet',
    icon: 'calculator',
    blurb: 'Estimate yearly trading costs and compare spreads, commissions and fees across brokers.',
    // SPEC 4.2: globales Broker-Triple — funktional in allen 4 Märkten via
    // getToolEntryHref() + validiertem ?market=-Param, keine lokalisierten Duplikat-Routen.
    availableMarkets: ['us', 'uk', 'ca', 'au'],
    variants: [
      {
        market: 'us',
        path: '/tools/trading-cost-calculator',
        status: 'live',
        indexable: true,
        title: 'Trading Cost Calculator: Compare Broker Fees Fast',
        metaDescription:
          'Estimate your yearly trading costs from trade size and frequency, compare spreads, commissions and fees across brokers, and find the cheapest fit.',
        h1: 'Trading Cost Calculator',
      },
    ],
  },

  'broker-comparison': {
    id: 'broker-comparison',
    name: 'Broker Comparison Tool',
    tier: 'supporting',
    decisionCategory: 'broker',
    shellMode: 'live-canvas',
    icon: 'columns-3',
    blurb: 'Compare forex and CFD brokers side by side on spreads, fees, platforms and regulation.',
    // SPEC 4.2: globales Broker-Triple — funktional in allen 4 Märkten via
    // getToolEntryHref() + validiertem ?market=-Param, keine lokalisierten Duplikat-Routen.
    availableMarkets: ['us', 'uk', 'ca', 'au'],
    variants: [
      {
        market: 'us',
        path: '/tools/broker-comparison',
        status: 'live',
        indexable: true,
        title: 'Broker Comparison Tool: Forex & CFD Brokers Compared',
        metaDescription:
          'Compare forex and CFD brokers side by side on spreads, fees, platforms and regulation, pre-filtered by your quiz shortlist and personal cost profile.',
        h1: 'Broker Comparison Tool',
      },
    ],
  },

  'ai-roi': {
    id: 'ai-roi',
    name: 'AI ROI Calculator',
    tier: 'supporting',
    decisionCategory: 'business',
    shellMode: 'live-canvas',
    icon: 'bot',
    blurb: 'Estimate the return on AI writing and productivity tools for your business.',
    variants: [
      {
        market: 'us',
        path: '/tools/ai-roi-calculator',
        status: 'live',
        indexable: true,
        title: 'AI ROI Calculator: Measure AI Tool Payback for Business',
        metaDescription:
          "Estimate the return on AI writing and productivity tools for your business: monthly cost, time saved, payback period and a realistic ROI range.",
        h1: 'AI ROI Calculator for Business',
      },
    ],
  },

  loan: {
    id: 'loan',
    name: 'Loan Calculator',
    tier: 'supporting',
    decisionCategory: 'debt',
    shellMode: 'guided-journey',
    icon: 'banknote',
    blurb: 'Work out monthly payments, total interest and payoff time before you borrow.',
    variants: [
      {
        market: 'us',
        path: '/tools/loan-calculator',
        status: 'live',
        indexable: true,
        title: 'Loan Calculator: Monthly Payments, Interest & Payoff',
        metaDescription:
          'Work out monthly payments, total interest and payoff time for personal or consolidation loans, then compare scenarios before you borrow anything.',
        h1: 'Loan Calculator',
      },
    ],
  },

  'debt-payoff': {
    id: 'debt-payoff',
    name: 'Debt Payoff Calculator',
    tier: 'supporting',
    decisionCategory: 'debt',
    shellMode: 'precision-worksheet',
    icon: 'trending-down',
    blurb: 'Compare avalanche versus snowball payoff plans and see your debt-free date.',
    variants: [
      {
        market: 'us',
        path: '/tools/debt-payoff-calculator',
        status: 'live',
        indexable: false, // SPEC 9.2: noindex bis Gate (erwartet nach PR 2.3)
        title: 'Debt Payoff Calculator: Your Debt-Free Date & Plan',
        metaDescription:
          'List your debts and compare avalanche versus snowball payoff plans: see your debt-free date, total interest saved and three moves that speed it up.',
        h1: 'Debt Payoff Calculator',
      },
    ],
  },

  'credit-utilization': {
    id: 'credit-utilization',
    name: 'Credit Utilization & Score Impact Explorer',
    tier: 'supporting',
    decisionCategory: 'debt',
    shellMode: 'live-canvas',
    icon: 'gauge',
    blurb: 'See realistic credit score impact ranges from paying down balances or limits.',
    variants: [
      {
        market: 'us',
        // Ist-Pfad (Slug-Wechsel zu /tools/credit-utilization-explorer erst Phase 5 / PR 5.3)
        path: '/tools/credit-score-simulator',
        status: 'live',
        indexable: false, // SPEC 9.2: noindex bis Gate (nach PR 5.3); Page hat heute schon robots index:false
        // Ist-Title der bestehenden Page (bare, ohne "| SmartFinPro"-Anteil) — NICHT der
        // SPEC-9.1-Title für /tools/credit-utilization-explorer, der den Zielzustand
        // nach dem Slug-/Framing-Wechsel beschreibt.
        title: 'Credit Score Simulator 2026 | See How Actions Affect Your Score',
        metaDescription:
          'Explore how paying down balances or changing limits shifts your credit utilization, with realistic score impact ranges instead of false precision.',
        h1: 'Credit Utilization & Score Impact Explorer',
      },
    ],
  },

  'gold-roi': {
    id: 'gold-roi',
    name: 'Gold ROI Calculator',
    tier: 'niche',
    decisionCategory: 'niche',
    shellMode: 'live-canvas',
    icon: 'coins',
    blurb: 'Model gold investment returns for Australian investors across three scenarios.',
    legacyPaths: ['/tools/gold-roi-calculator'],
    variants: [
      {
        market: 'au',
        // Moved to /au/tools/ in Task 0.3 (was '/tools/gold-roi-calculator');
        // the old path now 308s here, see legacyPaths + next.config.ts redirects.
        path: '/au/tools/gold-roi-calculator',
        status: 'live',
        indexable: true,
        // Ist-Title der bestehenden Page (bare) — NICHT der SPEC-9.1-Title für den
        // Umzugsziel-Pfad /au/tools/gold-roi-calculator.
        title: 'Gold ROI Calculator Australia 2026 | Investment Returns Analysis',
        metaDescription:
          'Model gold investment returns for Australian investors across conservative to optimistic scenarios, with dated assumptions and clear methodology.',
        h1: 'Gold ROI Calculator Australia',
      },
    ],
  },

  'credit-card-rewards': {
    id: 'credit-card-rewards',
    name: 'Credit Card Rewards Calculator',
    tier: 'supporting',
    decisionCategory: 'credit-cards',
    shellMode: 'live-canvas',
    icon: 'credit-card',
    blurb: 'Compare credit card rewards side by side to see which card pays you back the most.',
    variants: [
      {
        market: 'us',
        path: '/tools/credit-card-rewards-calculator',
        status: 'live',
        indexable: true,
        title: 'Credit Card Rewards Calculator: Find Your Best Card',
        metaDescription:
          'Enter monthly spending by category and compare credit card rewards side by side to see which card pays you back the most each year after annual fees.',
        h1: 'Credit Card Rewards Calculator',
      },
    ],
  },

  isa: {
    id: 'isa',
    name: 'ISA Tax Savings Calculator',
    tier: 'supporting',
    decisionCategory: 'retire',
    shellMode: 'live-canvas',
    icon: 'piggy-bank',
    blurb: 'See how much capital gains and dividend tax an ISA could save you in 2026/27.',
    variants: [
      {
        market: 'uk',
        path: '/uk/tools/isa-tax-savings-calculator',
        status: 'live',
        indexable: true,
        title: 'ISA Tax Savings Calculator 2026/27: Your Tax Shield',
        metaDescription:
          'See how much capital gains and dividend tax an ISA could save you in 2026/27, with verified HMRC rates, allowances and the 2027 cash ISA change.',
        h1: 'ISA Tax Savings Calculator',
      },
    ],
  },

  remortgage: {
    id: 'remortgage',
    name: 'UK Remortgage Calculator',
    tier: 'supporting',
    decisionCategory: 'home',
    shellMode: 'precision-worksheet',
    icon: 'house',
    blurb: 'Compare your current mortgage against a new rate and find your break-even point.',
    variants: [
      {
        market: 'uk',
        path: '/uk/tools/remortgage-calculator',
        status: 'live',
        indexable: false, // SPEC 9.2: noindex bis Gate (nach PR 5.2)
        title: 'Remortgage Calculator UK: Interest Savings & Fees',
        metaDescription:
          'Compare your current mortgage against a new rate: monthly savings, total interest, fees and break-even point, with sourced and dated assumptions.',
        h1: 'UK Remortgage Calculator',
      },
    ],
  },

  'tfsa-rrsp': {
    id: 'tfsa-rrsp',
    name: 'TFSA vs RRSP Calculator',
    tier: 'supporting',
    decisionCategory: 'retire',
    shellMode: 'live-canvas',
    icon: 'scale',
    blurb: 'Compare TFSA and RRSP outcomes with verified 2026 CRA contribution limits.',
    variants: [
      {
        market: 'ca',
        path: '/ca/tools/tfsa-rrsp-calculator',
        status: 'live',
        indexable: true,
        title: 'TFSA vs RRSP Calculator 2026: Compare Tax Savings',
        metaDescription:
          'Compare TFSA and RRSP outcomes with verified 2026 CRA limits: after-tax growth, refund effects and which account fits your income and timeline.',
        h1: 'TFSA vs RRSP Calculator',
      },
    ],
  },

  'wealthsimple-fees': {
    id: 'wealthsimple-fees',
    name: 'Wealthsimple Fee Savings Calculator',
    tier: 'supporting',
    decisionCategory: 'fees',
    shellMode: 'live-canvas',
    icon: 'percent',
    blurb: "Compare Wealthsimple's fees against typical Canadian mutual fund costs.",
    variants: [
      {
        market: 'ca',
        path: '/ca/tools/wealthsimple-calculator',
        status: 'live',
        indexable: true,
        title: 'Wealthsimple Fee Savings Calculator: What You Save',
        metaDescription:
          "Compare Wealthsimple's management fees against typical Canadian mutual fund costs and see what lower fees could add to your portfolio over time.",
        h1: 'Wealthsimple Fee Savings Calculator',
      },
    ],
  },

  'ca-affordability': {
    id: 'ca-affordability',
    name: 'Canadian Mortgage Affordability Calculator',
    tier: 'supporting',
    decisionCategory: 'home',
    shellMode: 'precision-worksheet',
    icon: 'home',
    blurb: 'Check what home you can afford in Canada using GDS/TDS ratios and the stress test.',
    variants: [
      {
        market: 'ca',
        path: '/ca/tools/ca-mortgage-affordability-calculator',
        status: 'live',
        indexable: true,
        title: 'Canada Mortgage Affordability: GDS, TDS & Stress Test',
        metaDescription:
          'Check what home you can afford in Canada using GDS and TDS ratios, the mortgage stress test and CMHC insurance tiers, with a clear payment stack.',
        h1: 'Canadian Mortgage Affordability Calculator',
      },
    ],
  },

  superannuation: {
    id: 'superannuation',
    name: 'Superannuation Calculator',
    tier: 'supporting',
    decisionCategory: 'retire',
    shellMode: 'live-canvas',
    icon: 'sunrise',
    blurb: 'Project your super balance at retirement with the current 12% guarantee and caps.',
    variants: [
      {
        market: 'au',
        path: '/au/tools/superannuation-calculator',
        status: 'live',
        indexable: true,
        title: 'Superannuation Calculator: Project Your Super at 67',
        metaDescription:
          'Project your super balance at retirement with the current 12% guarantee and 2026-27 caps: contributions, fees and three levers that grow it faster.',
        h1: 'Superannuation Calculator',
      },
    ],
  },

  'au-mortgage': {
    id: 'au-mortgage',
    name: 'Australian Home Loan Calculator',
    tier: 'supporting',
    decisionCategory: 'home',
    shellMode: 'precision-worksheet',
    icon: 'house',
    blurb: 'Calculate Australian home loan repayments with LVR and offset account savings.',
    variants: [
      {
        market: 'au',
        path: '/au/tools/au-mortgage-calculator',
        status: 'live',
        indexable: true,
        title: 'Australian Mortgage Calculator: Repayments & Offset',
        metaDescription:
          'Calculate Australian home loan repayments with LVR, offset account savings and a rate stress buffer, using dated assumptions that you can verify.',
        h1: 'Australian Home Loan Calculator',
      },
    ],
  },

  'wealth-horizon': {
    id: 'wealth-horizon',
    name: 'Retirement & Financial Freedom Calculator',
    tier: 'major',
    decisionCategory: 'retire',
    shellMode: 'guided-journey',
    icon: 'trending-up',
    blurb: 'Project your retirement in today’s money across three scenarios and find your FI date.',
    variants: [
      {
        market: 'us',
        path: '/tools/retirement-calculator',
        status: 'live',
        // FDL 4.2 (PR 4.2 brief): deliberate noindex until the 4-market
        // cluster is complete (SPEC 9.2 targets "ja (Launch komplett)" —
        // documented deviation, index flip ships in PR 4.3). `hidden: true`
        // additionally keeps the route out of every hub/footer/llms.txt
        // consumer during the active tool_v1 analytics baseline window
        // (0.5) — the route is reachable only via direct link until 4.3
        // removes the flag.
        indexable: false,
        hidden: true,
        title: 'Retirement Calculator: 401(k), IRA & FIRE Scenarios',
        metaDescription:
          "Project your retirement in today's dollars across three scenarios: 401(k) and IRA balances, financial independence date, income gap and fee impact.",
        h1: 'Retirement & Financial Freedom Calculator',
      },
      {
        market: 'uk',
        path: '/uk/tools/pension-calculator',
        status: 'live',
        // FDL 4.3 — bindende Plan-Abweichung (User-Entscheidung, dokumentiert
        // im PR-Bericht): der ursprüngliche 4.3-Brief sah hier den atomaren
        // Index-Flip aller 4 Routen vor. Alle 3 neuen Varianten bleiben
        // stattdessen noindex+hidden wie die US-Route bis zum separaten
        // Launch-PR nach Ende des Baseline-Fensters (~20.07.2026).
        indexable: false,
        hidden: true,
        // Slug bindend "pension-calculator" (Head-Term, SPEC 9.1, Zeile 663)
        // — NICHT "retirement-calculator" wie US/CA/AU.
        title: 'Pension Calculator UK: ISA, SIPP & Retirement Income',
        metaDescription:
          "Project your UK retirement in today's money across three scenarios: ISA and SIPP growth, financial independence date, income gap and fee impact.",
        h1: 'Pension & Financial Freedom Calculator',
      },
      {
        market: 'ca',
        path: '/ca/tools/retirement-calculator',
        status: 'live',
        indexable: false,
        hidden: true,
        title: 'Retirement Calculator Canada: TFSA, RRSP & FI Date',
        metaDescription:
          "Project your Canadian retirement in today's dollars across three scenarios: TFSA and RRSP growth, financial independence date and fee impact.",
        h1: 'Retirement & Financial Freedom Calculator',
      },
      {
        market: 'au',
        path: '/au/tools/retirement-calculator',
        status: 'live',
        indexable: false,
        hidden: true,
        title: 'Retirement Calculator Australia: Super & FIRE Date',
        metaDescription:
          "Project your Australian retirement in today's dollars across three scenarios: super growth at the 12% guarantee, FIRE date, income gap and fees.",
        h1: 'Retirement & Financial Freedom Calculator',
      },
    ],
    shareableFields: ['ageBand', 'retireAge', 'balanceBand', 'contributionBand', 'feeBand', 'withdrawalRatePct', 'scenario'],
  },
};

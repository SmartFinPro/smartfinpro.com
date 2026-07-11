// lib/comparison/topics/ca/mortgage-brokers.ts
// TopicConfig for "Best Mortgage Brokers & Rate Comparison Platforms
// (Canada)", registered under 'ca:housing/mortgage-brokers'. CA-exclusive
// category/topic (no US/UK/AU equivalent on this site). Pure module: no
// React/server imports.
//
// Cost model: 'fee-on-amount' with a flatFeeAccessor that always returns 0:
// every provider on this page is paid by the LENDER via commission, not the
// consumer, for a standard residential mortgage (mirrors the debt-relief.ts
// GreenPath DMP precedent for showing a real fixed-dollar/zero figure instead
// of a misleading fee%-of-amount calculation). costLabel overridden to "Est.
// broker cost" since "Cost on volume" doesn't fit a $0-to-consumer product.
//
// Business-model honesty (SEO addendum §4): Canada has NO single national
// mortgage-broker regulator: licensing is entirely provincial (FSRA
// Ontario, BCFSA British Columbia, RECA Alberta, FCAA Saskatchewan, AMF
// Quebec, and separate regimes elsewhere). "Best rate" from any of these
// platforms means best rate among the lenders that work with that platform,
// not an exhaustive market scan; made explicit in intro/methodology/FAQ
// rather than implied as comprehensive. nesto and True North Mortgage blend
// broker and in-house-lender roles on some files; DLC (Dominion Lending
// Centres) was considered but replaced with Mortgage Alliance per the
// approved shortlist; DLC's 2023 Competition Bureau antitrust inquiry was
// discontinued in June 2024 with no wrongdoing found, so this is NOT an
// exclusion-for-cause, simply following the pre-approved candidate list.

import { z } from 'zod';
import type { TopicConfig } from './../types';
import type { ProductForComparison } from '@/lib/comparison/types';

export const caMortgageBrokersAttributesSchema = z
  .object({
    business_model: z.enum(['rate_comparison_platform', 'licensed_brokerage', 'hybrid_broker_lender', 'franchise_network']),
    business_model_note: z.string(),
    provincial_licenses: z.array(z.string()).min(1),
    lender_panel_note: z.string(),
    consumer_fee_note: z.string(),
    trustpilot_rating: z.number().nullable(),
    trustpilot_count: z.number().nullable(),
    trustpilot_note: z.string(),
    regulatory_note: z.string().optional(), // material, sourced compliance/complaint history; empty if none
  })
  .passthrough();

const attrStr = (p: ProductForComparison, k: string): string =>
  typeof p.attributes?.[k] === 'string' ? (p.attributes[k] as string) : '';
const attrNumOrNull = (p: ProductForComparison, k: string): number | null =>
  typeof p.attributes?.[k] === 'number' ? (p.attributes[k] as number) : null;
const attrArr = (p: ProductForComparison, k: string): string[] =>
  Array.isArray(p.attributes?.[k]) ? (p.attributes[k] as string[]) : [];
const MODEL_LABEL: Record<string, string> = {
  rate_comparison_platform: 'Rate-comparison platform',
  licensed_brokerage: 'Licensed brokerage',
  hybrid_broker_lender: 'Broker + in-house lender',
  franchise_network: 'Franchise network',
};

export const caMortgageBrokersConfig: TopicConfig = {
  slug: 'mortgage-brokers',
  category: 'housing',
  label: 'Mortgage Brokers',
  h1: (y) => `Best mortgage brokers & rate comparison platforms in Canada (${y})`,
  metaTitle: (y) => `Best Mortgage Brokers Canada (${y})`,
  metaDescription: (y) =>
    `Compare Canadian mortgage brokers and rate-comparison platforms of ${y} by lender panel, licensing and consumer rating, independent, sourced.`,
  intro:
    "Independent, side-by-side comparison of Canadian mortgage brokers and rate-comparison platforms: every one is paid by the lender, not you, but that also means \"best rate\" reflects each platform's own lender panel, not an exhaustive market scan.",
  publishedDate: '2026-07-11',
  attributesSchema: caMortgageBrokersAttributesSchema,

  specColumns: [
    {
      key: 'model',
      label: 'Business model',
      accessor: (p) => attrStr(p, 'business_model'),
      format: (v) => MODEL_LABEL[String(v)] ?? String(v),
    },
    {
      key: 'licenses',
      label: 'Provinces licensed',
      accessor: (p) => attrArr(p, 'provincial_licenses').length,
      format: (v) => `${v}`,
      winner: 'max',
    },
    {
      key: 'rating',
      label: 'Consumer rating',
      accessor: (p) => attrNumOrNull(p, 'trustpilot_rating') ?? 0,
      format: (v) => (Number(v) === 0 ? 'Not yet rated' : `${Number(v).toFixed(1)}/5`),
      winner: 'max',
    },
  ],

  filters: [
    { key: 'brokerage', label: 'Licensed brokerage', predicate: (p) => attrStr(p, 'business_model') === 'licensed_brokerage' || attrStr(p, 'business_model') === 'hybrid_broker_lender' },
    { key: 'atlantic', label: 'Covers Atlantic Canada', predicate: (p) => attrArr(p, 'provincial_licenses').some((l) => /NB|NS|PE|NL/.test(l)) },
    { key: 'quebec', label: 'Licensed in Quebec', predicate: (p) => attrArr(p, 'provincial_licenses').includes('QC') },
  ],

  priorityChips: [
    { id: 'rating', label: 'Top rated', icon: 'Star', sort: 'rating' },
    { id: 'coverage', label: 'Widest provincial coverage', icon: 'Layers', sort: 'coverage' },
  ],

  matcher: [
    {
      id: 'quebec',
      label: 'Are you in Quebec?',
      weight: 14,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrArr(p, 'provincial_licenses').includes('QC'), reason: 'Licensed in Quebec' } : { matched: true }),
    },
    {
      id: 'digital',
      label: 'Do you want a fully digital, no-branch experience?',
      weight: 10,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: "Doesn't matter" },
      ],
      award: (p, a) => (a === 'yes' ? { matched: attrStr(p, 'business_model') !== 'franchise_network', reason: 'Digital-first platform' } : { matched: true }),
    },
  ],

  sortOptions: [
    { value: 'smart', label: 'Smart rank', metric: (p) => p.score },
    { value: 'rating', label: 'Best rated', metric: (p) => (attrNumOrNull(p, 'trustpilot_rating') ?? 0) * 100 + p.score },
    { value: 'coverage', label: 'Widest provincial coverage', metric: (p) => attrArr(p, 'provincial_licenses').length * 10 + p.score },
  ],

  costModel: {
    kind: 'fee-on-amount',
    flatFeeAccessor: () => 0,
    costLabel: 'Est. broker cost',
    amountLabel: 'Mortgage amount',
    amountMin: 200_000,
    amountMax: 2_000_000,
    amountStep: 50_000,
    amountDefault: 500_000,
    yearsLabel: 'Term (years)',
    yearsMin: 1,
    yearsMax: 5,
    yearsDefault: 5,
  },

  compareRows: [
    { key: 'model', label: 'Business model', accessor: (p) => attrStr(p, 'business_model_note') || MODEL_LABEL[attrStr(p, 'business_model')] || 'N/A' },
    { key: 'licenses', label: 'Provinces licensed', accessor: (p) => attrArr(p, 'provincial_licenses').join(', ') || 'N/A', score: (p) => attrArr(p, 'provincial_licenses').length },
    { key: 'lenders', label: 'Lender panel', accessor: (p) => attrStr(p, 'lender_panel_note') || 'N/A' },
    { key: 'fee', label: 'Cost to you', accessor: (p) => attrStr(p, 'consumer_fee_note') || '$0 (paid by the lender)' },
    {
      key: 'rating',
      label: 'Consumer rating',
      accessor: (p) => {
        const r = attrNumOrNull(p, 'trustpilot_rating');
        return r === null ? 'Not yet rated' : `${r}/5 (${attrStr(p, 'trustpilot_note')})`;
      },
      score: (p) => attrNumOrNull(p, 'trustpilot_rating') ?? 0,
    },
  ],

  detailRows: [
    { key: 'regulatory', label: 'Regulatory / dispute history', accessor: (p) => attrStr(p, 'regulatory_note') || 'No material issues found at research time.' },
  ],

  verdict: {
    intro:
      "Scale is what separates Ratehub from the rest of this list: it has facilitated more than $15 billion in mortgages since 2015 through its own licensed brokerage, CanWise, and carries the broadest brand recognition of any candidate researched. For a completely paperless process, nesto is Canada's largest all-digital mortgage broker, serving 450,000+ customers behind a rate-match guarantee. And on pure customer satisfaction, True North Mortgage stands alone with a 4.9-out-of-5 Trustpilot score, the strongest independently corroborated rating in this comparison.",
    picks: [
      { slug: 'ratehub', label: 'Best overall' },
      { slug: 'nesto', label: 'Best fully-digital experience' },
      { slug: 'true-north-mortgage', label: 'Highest-rated by customers' },
    ],
  },
  methodology:
    "We compare each platform's business model (rate-comparison platform, licensed brokerage, hybrid broker/lender, or franchise network), provincial licensing footprint, lender panel breadth and consumer rating from official disclosures and independent review platforms. Canada has no single national mortgage-broker regulator: licensing is entirely provincial, and we verify each platform's specific provincial registrations rather than assume uniform national coverage. Every provider on this page is compensated by the lender via commission for a standard residential mortgage, not by the consumer; we disclose this plainly and note that 'best rate' from any platform reflects its own lender panel, not an exhaustive market scan. We disclose real, sourced regulatory and complaint history plainly rather than silently omitting a candidate. Rankings never depend on commissions. Every provider on this page is currently a visit-only listing.",
  buyerGuide: [
    {
      h3: 'There is no single national mortgage-broker regulator',
      body: 'Unlike investment dealers (CIRO) or banks (OSFI), mortgage brokering is licensed provincially: FSRA in Ontario, BCFSA in British Columbia, RECA in Alberta, FCAA in Saskatchewan, AMF in Quebec (under its financial-products distribution regime), and separate regimes in Manitoba and Atlantic Canada. A platform can be fully licensed in one province and unregistered in another; check the "provinces licensed" row for your own location before applying.',
    },
    {
      h3: '"Best rate" means best rate from lenders who work with that platform',
      body: "None of these platforms scan the entire Canadian mortgage market: each works with its own panel of lenders (ranging from a handful of institutional partners to 350+ tracked lenders at the broader end). A platform showing you the \"best rate\" is showing the best rate among lenders that pay it a commission, which is nearly always a real subset of the market, not the whole thing. This doesn't make any of them dishonest (it's how the entire industry is compensated), but it's worth understanding before assuming full market coverage.",
    },
    {
      h3: 'Broker, lender, or both: the model varies by platform',
      body: 'Ratehub, Butler Mortgage, Pine, Perch and Mortgage Alliance operate as licensed brokerages placing your mortgage with a third-party lender. nesto and True North Mortgage are hybrids: both operate a licensed brokerage arm alongside an in-house lending capacity (nesto funds some of its own insured mortgages; True North operates THINK Financial as an in-house lender for some files). As a licensed brokerage, each is still obligated to present suitable options, not just proprietary products, but the structure is worth knowing.',
    },
    {
      h3: 'Franchise networks: the license sits with the individual broker',
      body: "Mortgage Alliance is a large franchise network (part of M3 Financial Group, ~2,400+ mortgage professionals across 100+ franchises), not a single licensed brokerage: each individual broker or franchise holds their own provincial license. Network quality and service depend heavily on which individual broker you're matched with, more so than with a centrally-operated digital platform.",
    },
  ],
  faq: [
    {
      q: 'What is the best mortgage broker in Canada?',
      a: "Ratehub, by scale: $15B+ in mortgages facilitated since 2015 through its own brokerage, CanWise, and the broadest brand recognition of the group, our top pick. nesto fits best for a fully digital process, Canada's largest all-digital broker with 450,000+ customers and a rate-match guarantee. True North Mortgage wins on satisfaction alone, a 4.9/5 Trustpilot score stronger than any other candidate researched. We re-verify licensing regularly, and the ranking never depends on commissions.",
    },
    {
      q: 'Do I have to pay a mortgage broker in Canada?',
      a: 'For a standard residential mortgage, no, every platform on this page is compensated by the lender via commission when your mortgage closes, not by you directly. Some non-standard files (e.g. self-employed or private-lender scenarios) can carry broker fees at certain platforms. Always confirm the fee structure for your specific situation before signing.',
    },
    {
      q: 'Do these brokers see every mortgage lender in Canada?',
      a: "No, each platform works with its own panel of lenders, which can range from a handful of institutional partners to 350+ tracked lenders depending on the platform. \"Best rate\" reflects the best rate among that platform's own lender panel, not an exhaustive scan of the entire Canadian mortgage market.",
    },
    {
      q: 'Is my mortgage broker actually licensed?',
      a: "Canada has no single national mortgage-broker regulator: licensing is provincial (FSRA in Ontario, BCFSA in BC, RECA in Alberta, and others elsewhere). Check the \"provinces licensed\" row for each platform, and verify directly against your own province's regulator if you want independent confirmation.",
    },
    {
      q: 'How current is this data?',
      a: 'Every business-model detail, licensing reference and rating on this page was verified against official sources on 11 July 2026. Mortgage rates change frequently, so get a live, dated quote directly from the platform before relying on any historical rate figure.',
    },
  ],
  compliance: {
    notice:
      'Not financial advice. Mortgage brokering in Canada is licensed provincially, not nationally. Confirm a broker\'s current license in your own province before proceeding. Rates and lender panels change frequently.',
    regulators: [],
  },

  sources: [
    { label: 'FSRA: Mortgage Brokering (Ontario)', url: 'https://www.fsrao.ca/industry/mortgage-brokering' },
    { label: 'Financial Consumer Agency of Canada: mortgages', url: 'https://www.canada.ca/en/financial-consumer-agency/services/mortgages.html' },
  ],
  relatedLinks: [
    { label: 'Canada housing hub', href: '/ca/housing' },
    { label: 'Best business bank accounts (Canada)', href: '/ca/business-banking/best/business-bank-accounts' },
    { label: 'How SmartFinPro reviews products', href: '/methodology' },
  ],
};

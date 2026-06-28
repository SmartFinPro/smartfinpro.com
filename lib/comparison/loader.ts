// lib/comparison/loader.ts
import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { getLinksForMarketCategory } from '@/lib/affiliate/link-registry';
import type { Market, Category } from '@/lib/i18n/config';
import type { AffiliateLink } from '@/types';
import type { Badge, CtaMode, FilterKey, ProductForComparison, SubScores } from './types';
import type { TopicConfig } from './topics/types';
import { getTopicConfig } from './topics/index';
import { DEFAULT_USAGE, rankProducts } from './ranking';
import { orderProducts } from './cost';
import { DEV_SEED_ROWS } from './dev-seed';

const IS_DEV = process.env.NODE_ENV !== 'production';
// Throw on invalid seed data only in true local dev; staging/prod log + exclude.
const IS_DEV_THROW = process.env.NODE_ENV === 'development';

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
};
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

function toBadges(v: unknown): Badge[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((b): b is { type?: string; label?: string } => !!b && typeof b === 'object')
    .map((b) => ({
      type: (['gold', 'green', 'sky'].includes(String(b.type)) ? b.type : 'sky') as Badge['type'],
      label: String(b.label ?? ''),
    }))
    .filter((b) => b.label.length > 0);
}

function toSubScores(v: unknown): SubScores {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return { fees: num(o.fees), features: num(o.features), ux: num(o.ux), support: num(o.support) };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRow(row: any, activeOfferSlugs: Set<string>): ProductForComparison {
  const isOffer = !!row.is_affiliate && activeOfferSlugs.has(row.slug);
  const ctaMode: CtaMode = isOffer ? 'offer' : row.review_slug ? 'review' : 'visit';

  const flags: Record<FilterKey, boolean> = {
    noMonthly: !!row.has_no_monthly_fee,
    freeAtm: !!row.has_free_atm,
    noFx: !!row.has_no_fx_fee,
    cashback: !!row.has_cashback,
    bonus: !!row.has_bonus,
    subAccounts: !!row.has_sub_accounts,
    interest: !!row.has_interest,
    applePay: !!row.has_apple_pay,
  };

  const displayName = String(row.display_name ?? row.slug);

  return {
    slug: String(row.slug),
    displayName,
    initial: displayName.charAt(0).toUpperCase(),
    tagline: String(row.tagline ?? ''),
    logoUrl: row.logo_url ?? null,
    verified: row.verified !== false,

    score: num(row.score),
    rating: num(row.rating),
    reviewCount: Math.round(num(row.review_count)),
    monthlyFee: num(row.monthly_fee),
    signupBonus: num(row.signup_bonus),
    fxFeePct: num(row.fx_fee_pct),
    atmFee: num(row.atm_fee),
    apy: num(row.apy),
    clicks: Math.round(num(row.clicks)),

    badges: toBadges(row.badges),
    chips: strArr(row.chips),
    pros: strArr(row.pros),
    cons: strArr(row.cons),
    subScores: toSubScores(row.sub_scores),
    effectiveApr: row.effective_apr ?? null,
    cashback: row.cashback ?? null,
    cardNetwork: row.card_network ?? null,
    wireTransfers: row.wire_transfers ?? null,
    fdicCoverage: row.fdic_coverage ?? null,
    apps: strArr(row.apps),
    verdict: row.verdict ?? null,

    flags,

    entityTypes: strArr(row.entity_types),
    supportsCashDeposits: !!row.supports_cash_deposits,
    supportsIntlWires: !!row.supports_intl_wires,
    hasBookkeeping: !!row.has_bookkeeping,
    hasLending: !!row.has_lending,
    hasSubAccounts: !!row.has_sub_accounts,
    integrations: strArr(row.integrations),

    ctaMode,
    reviewSlug: row.review_slug ?? null,
    externalUrl: row.external_url ?? null,

    isTopPick: !!row.is_top_pick,
    bestFor: row.best_for ?? null,
    displayOrder: Math.round(num(row.display_order)),

    // Generic topic fields (banking defaults for the legacy engine path).
    topic: String(row.topic ?? 'business-bank-accounts'),
    managementFee: num(row.management_fee),
    accountMinimum: num(row.account_minimum),
    attributes: row.attributes && typeof row.attributes === 'object' ? row.attributes : {},
    deepDive: row.deep_dive ?? null,
    sourceType: row.source_type ?? null,
    confidence: row.confidence ?? null,
    offerAttribution: null,

    market: row.market as Market,
    category: row.category as Category,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Map a raw product_attributes row to a ProductForComparison for the Cockpit.
 * - Validates the topic-specific `attributes` JSONB via the config's Zod schema
 *   (dev throws; staging/prod log + exclude the row → returns null).
 * - Applies the ATTRIBUTION GATE: a monetized `offer` (/go) CTA renders ONLY
 *   when an active link's tracking_status is verified|dashboard_only.
 * Pure — exported for unit testing.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapCockpitRow(
  row: any,
  linksBySlug: Map<string, AffiliateLink>,
  config: TopicConfig,
): ProductForComparison | null {
  const parsed = config.attributesSchema.safeParse(row.attributes ?? {});
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    if (IS_DEV_THROW) {
      throw new Error(`[cockpit] ${row.slug} attributes invalid: ${JSON.stringify(issues)}`);
    }
    console.error('[cockpit] excluding row — invalid attributes', { slug: row.slug, issues });
    return null;
  }

  const link = linksBySlug.get(String(row.slug));
  const gateOpen =
    link?.tracking_status === 'verified' || link?.tracking_status === 'dashboard_only';
  // is_affiliate alone NEVER yields '/go' — the gate also requires a verified link.
  const isOffer = !!row.is_affiliate && !!link && gateOpen;
  const ctaMode: CtaMode = isOffer ? 'offer' : row.review_slug ? 'review' : 'visit';
  const offerAttribution = isOffer
    ? (link!.tracking_status as 'verified' | 'dashboard_only')
    : null;

  const flags: Record<FilterKey, boolean> = {
    noMonthly: !!row.has_no_monthly_fee,
    freeAtm: !!row.has_free_atm,
    noFx: !!row.has_no_fx_fee,
    cashback: !!row.has_cashback,
    bonus: !!row.has_bonus,
    subAccounts: !!row.has_sub_accounts,
    interest: !!row.has_interest,
    applePay: !!row.has_apple_pay,
  };

  const displayName = String(row.display_name ?? row.slug);

  return {
    slug: String(row.slug),
    displayName,
    initial: displayName.charAt(0).toUpperCase(),
    tagline: String(row.tagline ?? ''),
    logoUrl: row.logo_url ?? null,
    verified: row.verified !== false,

    score: num(row.score),
    rating: num(row.rating),
    reviewCount: Math.round(num(row.review_count)),
    monthlyFee: num(row.monthly_fee),
    signupBonus: num(row.signup_bonus),
    fxFeePct: num(row.fx_fee_pct),
    atmFee: num(row.atm_fee),
    apy: num(row.apy),
    clicks: Math.round(num(row.clicks)),

    badges: toBadges(row.badges),
    chips: strArr(row.chips),
    pros: strArr(row.pros),
    cons: strArr(row.cons),
    subScores: toSubScores(row.sub_scores),
    effectiveApr: row.effective_apr ?? null,
    cashback: row.cashback ?? null,
    cardNetwork: row.card_network ?? null,
    wireTransfers: row.wire_transfers ?? null,
    fdicCoverage: row.fdic_coverage ?? null,
    apps: strArr(row.apps),
    verdict: row.verdict ?? null,

    flags,

    entityTypes: strArr(row.entity_types),
    supportsCashDeposits: !!row.supports_cash_deposits,
    supportsIntlWires: !!row.supports_intl_wires,
    hasBookkeeping: !!row.has_bookkeeping,
    hasLending: !!row.has_lending,
    hasSubAccounts: !!row.has_sub_accounts,
    integrations: strArr(row.integrations),

    ctaMode,
    reviewSlug: row.review_slug ?? null,
    externalUrl: row.external_url ?? null,

    isTopPick: !!row.is_top_pick,
    bestFor: row.best_for ?? null,
    displayOrder: Math.round(num(row.display_order)),

    topic: String(row.topic ?? config.slug),
    managementFee: num(row.management_fee),
    accountMinimum: num(row.account_minimum),
    attributes: (parsed.data ?? {}) as Record<string, unknown>,
    deepDive: row.deep_dive ?? null,
    sourceType: row.source_type ?? null,
    confidence: row.confidence ?? null,
    offerAttribution,

    market: row.market as Market,
    category: row.category as Category,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Load + normalize all active comparison rows for a market×category, derive
 * each provider's CTA mode, and return them in initial Smart-Rank order
 * (DEFAULT_USAGE) so the SSR HTML matches the client's first render.
 *
 * Source of truth is `product_attributes` (NOT the active-only link list).
 * The link list is used only to gate which providers qualify for a tracked
 * `/go/[slug]` offer CTA.
 */
export async function getComparisonData(
  market: Market,
  category: Category,
): Promise<ProductForComparison[]> {
  const [linksRes, attrsRes] = await Promise.allSettled([
    getLinksForMarketCategory(market, category),
    (async () => {
      try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
          .from('product_attributes')
          .select('*')
          .eq('market', market)
          .eq('category', category)
          .eq('active', true);
        if (error) throw new Error(error.message);
        if ((!data || data.length === 0) && IS_DEV) {
          return DEV_SEED_ROWS[`${market}/${category}`] ?? [];
        }
        return data ?? [];
      } catch (err) {
        // DEV-only fallback so the page renders before the migration is applied.
        if (IS_DEV) return DEV_SEED_ROWS[`${market}/${category}`] ?? [];
        throw err;
      }
    })(),
  ]);

  const activeOfferSlugs = new Set<string>(
    linksRes.status === 'fulfilled' ? linksRes.value.map((l) => l.slug) : [],
  );
  const rows = attrsRes.status === 'fulfilled' ? attrsRes.value : [];

  const products = rows.map((row) => mapRow(row, activeOfferSlugs));
  return rankProducts(products, DEFAULT_USAGE, 'smart');
}

/** Distinct active market×category combos that have comparison data — for
 *  generateStaticParams. Returns [] gracefully if the service client is a
 *  build-time stub or the query fails. */
export async function getComparisonRouteParams(): Promise<{ market: string; category: string }[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('product_attributes')
      .select('market, category')
      .eq('active', true);
    if (error || !data || (data.length === 0 && IS_DEV)) {
      // Only legacy 2-segment keys (market/category); cockpit topic keys have 3.
      return IS_DEV
        ? Object.keys(DEV_SEED_ROWS)
            .map((k) => k.split('/'))
            .filter((parts) => parts.length === 2)
            .map(([market, category]) => ({ market, category }))
        : [];
    }
    const seen = new Set<string>();
    const params: { market: string; category: string }[] = [];
    for (const row of data) {
      const key = `${row.market}/${row.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        params.push({ market: String(row.market), category: String(row.category) });
      }
    }
    return params;
  } catch {
    return [];
  }
}

/**
 * Cockpit data loader — topic-aware. Filters product_attributes by
 * market×category×topic, validates + gates each row via mapCockpitRow, and
 * returns them pre-ordered (Smart Rank, top pick pinned) so SSR HTML matches
 * the client's first render. Returns [] for an unregistered topic.
 */
export async function getCockpitData(
  market: Market,
  category: Category,
  topic: string,
): Promise<ProductForComparison[]> {
  const config = getTopicConfig(category, topic);
  if (!config) return [];

  const [linksRes, attrsRes] = await Promise.allSettled([
    getLinksForMarketCategory(market, category),
    (async () => {
      try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
          .from('product_attributes')
          .select('*')
          .eq('market', market)
          .eq('category', category)
          .eq('topic', topic)
          .eq('active', true);
        if (error) throw new Error(error.message);
        if ((!data || data.length === 0) && IS_DEV) {
          return DEV_SEED_ROWS[`${market}/${category}/${topic}`] ?? [];
        }
        return data ?? [];
      } catch (err) {
        if (IS_DEV) return DEV_SEED_ROWS[`${market}/${category}/${topic}`] ?? [];
        throw err;
      }
    })(),
  ]);

  const links = linksRes.status === 'fulfilled' ? linksRes.value : [];
  const linksBySlug = new Map(links.map((l) => [l.slug, l]));
  const rows = attrsRes.status === 'fulfilled' ? attrsRes.value : [];

  const products = rows
    .map((row) => mapCockpitRow(row, linksBySlug, config))
    .filter((p): p is ProductForComparison => p !== null);

  return orderProducts(
    products,
    config,
    { amount: config.costModel.amountDefault, years: config.costModel.yearsDefault },
    'smart',
    'desc',
  );
}

/** Distinct active (market, category, topic) combos that have a registered
 *  TopicConfig — for the topic route's generateStaticParams. */
export async function getCockpitRouteParams(): Promise<
  { market: string; category: string; topic: string }[]
> {
  const registered = (p: { category: string; topic: string }) =>
    getTopicConfig(p.category, p.topic) !== null;
  const fromDevSeed = () =>
    Object.keys(DEV_SEED_ROWS)
      .map((k) => k.split('/'))
      .filter((parts) => parts.length === 3)
      .map(([market, category, topic]) => ({ market, category, topic }))
      .filter(registered);

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('product_attributes')
      .select('market, category, topic')
      .eq('active', true)
      .not('topic', 'is', null);
    if (error || !data || (data.length === 0 && IS_DEV)) {
      return IS_DEV ? fromDevSeed() : [];
    }
    const seen = new Set<string>();
    const params: { market: string; category: string; topic: string }[] = [];
    for (const row of data) {
      if (!row.topic) continue;
      const key = `${row.market}/${row.category}/${row.topic}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = {
        market: String(row.market),
        category: String(row.category),
        topic: String(row.topic),
      };
      if (registered(entry)) params.push(entry);
    }
    return params;
  } catch {
    return IS_DEV ? fromDevSeed() : [];
  }
}

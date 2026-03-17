// lib/xray/profile-resolver.ts
// Resolves a ProductProfile for the score engine from DB or MDX fallback.
// Server-only — called from API routes, NOT from 'use client' components.

import { createServiceClient } from '@/lib/supabase/server';
import { getContentBySlug } from '@/lib/mdx';
import type { Market, Category } from '@/lib/i18n/config';
import type { ProductProfile } from './score-engine';

// ── DB row → ProductProfile mapper ──────────────────────────────────

interface ProfileRow {
  base_price_monthly: number;
  seat_price_monthly: number;
  free_seats: number;
  usage_overage_monthly: number;
  addon_cost_monthly: number;
  onboarding_hours: number;
  fit_beginner: number;
  fit_advanced: number;
  fit_teams: number;
  fit_solo: number;
  fit_low_cost: number;
  fit_feature_rich: number;
  fit_compliance: number;
  compliance_gap: number;
  lockin_risk: number;
  support_risk: number;
  outage_risk: number;
  policy_risk: number;
  expected_hours_saved: number;
}

function rowToProfile(row: ProfileRow): ProductProfile {
  return {
    basePriceMonthly: Number(row.base_price_monthly),
    seatPriceMonthly: Number(row.seat_price_monthly),
    freeSeats: Number(row.free_seats),
    usageOverageMonthly: Number(row.usage_overage_monthly),
    addonCostMonthly: Number(row.addon_cost_monthly),
    onboardingHours: Number(row.onboarding_hours),
    fitDimensions: {
      beginner: Number(row.fit_beginner),
      advanced: Number(row.fit_advanced),
      teams: Number(row.fit_teams),
      solo: Number(row.fit_solo),
      lowCost: Number(row.fit_low_cost),
      featureRich: Number(row.fit_feature_rich),
      compliance: Number(row.fit_compliance),
    },
    riskDimensions: {
      complianceGap: Number(row.compliance_gap),
      lockinRisk: Number(row.lockin_risk),
      supportRisk: Number(row.support_risk),
      outageRisk: Number(row.outage_risk),
      policyRisk: Number(row.policy_risk),
    },
    expectedHoursSaved: Number(row.expected_hours_saved),
  };
}

// ── MDX fallback: estimate profile from frontmatter ─────────────────

function parsePriceFromString(pricing: string): number {
  // Extract first dollar/pound amount from strings like "From $49/month"
  const match = pricing.match(/[\$£€](\d+(?:\.\d{2})?)/);
  return match ? parseFloat(match[1]) : 0;
}

function estimateFitFromRating(rating: number): ProductProfile['fitDimensions'] {
  // Higher rating → better general fit; moderate defaults for unknowns
  const base = Math.min(rating / 5, 1);
  return {
    beginner: base * 0.85,
    advanced: base * 0.65,
    teams: base * 0.60,
    solo: base * 0.80,
    lowCost: 0.50, // unknown — neutral
    featureRich: base * 0.75,
    compliance: base * 0.50,
  };
}

function estimateRiskFromMeta(
  prosCount: number,
  consCount: number,
  rating: number,
): ProductProfile['riskDimensions'] {
  // More cons relative to pros → higher risk
  const conRatio = consCount / Math.max(prosCount + consCount, 1);
  const ratingPenalty = Math.max(0, (5 - rating) / 5); // lower rating → more risk
  const baseRisk = (conRatio * 0.5 + ratingPenalty * 0.5) * 0.4; // scale to reasonable range
  return {
    complianceGap: Math.min(baseRisk + 0.05, 0.5),
    lockinRisk: Math.min(baseRisk + 0.10, 0.5),
    supportRisk: Math.min(baseRisk, 0.3),
    outageRisk: 0.05, // default low
    policyRisk: Math.min(baseRisk + 0.05, 0.3),
  };
}

function mdxToProfile(meta: {
  pricing?: string;
  rating?: number;
  pros?: string[];
  cons?: string[];
}): ProductProfile {
  const price = meta.pricing ? parsePriceFromString(meta.pricing) : 0;
  const rating = meta.rating ?? 3.5;
  const prosCount = meta.pros?.length ?? 3;
  const consCount = meta.cons?.length ?? 2;

  return {
    basePriceMonthly: price,
    seatPriceMonthly: Math.round(price * 0.2), // estimate seat cost as 20% of base
    freeSeats: 1,
    usageOverageMonthly: 0,
    addonCostMonthly: 0,
    onboardingHours: price > 100 ? 8 : price > 30 ? 4 : 2,
    fitDimensions: estimateFitFromRating(rating),
    riskDimensions: estimateRiskFromMeta(prosCount, consCount, rating),
    expectedHoursSaved: price > 100 ? 20 : price > 30 ? 10 : 5,
  };
}

// ── Public API ──────────────────────────────────────────────────────

export async function resolveProductProfile(
  slug: string,
  market: string,
): Promise<ProductProfile | null> {
  // 1. Try DB first (dashboard-editable, most accurate)
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('product_profiles')
      .select('*')
      .eq('slug', slug)
      .eq('market', market)
      .single();

    if (!error && data) {
      return rowToProfile(data as unknown as ProfileRow);
    }
  } catch {
    // DB table may not exist yet — fall through to MDX
  }

  // 2. Fallback: derive from MDX frontmatter
  try {
    // Slug in MDX is just the filename slug, strip any suffix like "-review"
    const content = await getContentBySlug(
      market as Market,
      // Category unknown here — try all categories
      '' as Category,
      slug,
    ).catch(() => null);

    // If direct lookup fails, search across categories
    if (!content) {
      const { getAllContentSlugs } = await import('@/lib/mdx');
      const allSlugs = await getAllContentSlugs();
      const match = allSlugs.find(
        (s) => s.slug === slug && s.market === market,
      );
      if (match) {
        const found = await getContentBySlug(
          match.market as Market,
          match.category as Category,
          match.slug,
        );
        if (found) {
          return mdxToProfile(found.meta);
        }
      }
    } else {
      return mdxToProfile(content.meta);
    }
  } catch {
    // MDX lookup failed — return null
  }

  return null;
}

export { mdxToProfile, parsePriceFromString };

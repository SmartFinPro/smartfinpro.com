'use server';

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { sendTelegramAlert } from '@/lib/alerts/telegram';

// ════════════════════════════════════════════════════════════════
// A/B Testing Engine for ComparisonHub
//
// Variant A = "Profit-First"  → sort by CPA DESC (max revenue)
// Variant B = "Trust-First"   → sort by user rating DESC (max trust)
//
// Statistical evaluation after 500+ impressions per variant
// Auto-declares winner + Telegram notification
// ════════════════════════════════════════════════════════════════

export type AbVariant = 'A' | 'B';

export interface AbTestStats {
  hubId: string;
  variant: AbVariant;
  impressions: number;
  clicks: number;
  cr: number; // conversion rate %
  winnerDeclared: boolean;
}

export interface AbTestLiveView {
  hubId: string;
  category: string;
  market: string;
  variantA: { impressions: number; clicks: number; cr: number };
  variantB: { impressions: number; clicks: number; cr: number };
  winner: AbVariant | null;
  winnerLift: number | null;
  confidence: number | null;
  totalImpressions: number;
  status: 'collecting' | 'ready' | 'concluded';
}

// ── Helpers ──────────────────────────────────────────────────

function buildHubId(category: string, market: string): string {
  return `${category}__${market}`;
}

function parseHubId(hubId: string): { category: string; market: string } {
  const [category, market] = hubId.split('__');
  return { category: category || 'unknown', market: market || 'us' };
}

/** Detect device type from User-Agent */
function getDeviceType(ua: string): string {
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Z-test for two proportions — returns confidence level (0–100).
 * p1/n1 = variant A CR, p2/n2 = variant B CR.
 */
function calculateConfidence(
  clicksA: number,
  impressionsA: number,
  clicksB: number,
  impressionsB: number,
): number {
  if (impressionsA === 0 || impressionsB === 0) return 0;

  const p1 = clicksA / impressionsA;
  const p2 = clicksB / impressionsB;
  const pPool =
    (clicksA + clicksB) / (impressionsA + impressionsB);
  const se = Math.sqrt(
    pPool * (1 - pPool) * (1 / impressionsA + 1 / impressionsB),
  );

  if (se === 0) return 0;

  const z = Math.abs(p1 - p2) / se;

  // Approximate Φ(z) using standard normal CDF
  // We need one-tailed p-value → two-tailed confidence
  if (z >= 3.29) return 99.9;
  if (z >= 2.576) return 99;
  if (z >= 2.326) return 98;
  if (z >= 1.96) return 95;
  if (z >= 1.645) return 90;
  if (z >= 1.282) return 80;
  if (z >= 1.0) return 68;
  return Math.round(z * 40); // rough approximation below 68%
}

// ── Log Impression ──────────────────────────────────────────

export async function logHubImpression(
  category: string,
  market: string,
  variant: AbVariant,
  sessionId?: string,
): Promise<void> {
  try {
    const supabase = createServiceClient();
    const hubId = buildHubId(category, market);

    // Atomic increment via SQL function (race-condition safe)
    await supabase.rpc('increment_ab_stat', {
      p_hub_id: hubId,
      p_variant: variant,
      p_field: 'impressions',
    });

    // Log granular event
    const headersList = await headers();
    const ua = headersList.get('user-agent') || '';

    await supabase.from('ab_test_events').insert({
      hub_id: hubId,
      variant,
      event_type: 'impression',
      session_id: sessionId || null,
      device_type: getDeviceType(ua),
    });
  } catch {
    // Silent fail — analytics must never break UX
  }
}

// ── Log Click ───────────────────────────────────────────────

export async function logHubClick(
  category: string,
  market: string,
  variant: AbVariant,
  providerName: string,
  sessionId?: string,
): Promise<void> {
  try {
    const supabase = createServiceClient();
    const hubId = buildHubId(category, market);

    // Atomic increment via SQL function (race-condition safe)
    await supabase.rpc('increment_ab_stat', {
      p_hub_id: hubId,
      p_variant: variant,
      p_field: 'clicks',
    });

    // Log granular event
    const headersList = await headers();
    const ua = headersList.get('user-agent') || '';

    await supabase.from('ab_test_events').insert({
      hub_id: hubId,
      variant,
      event_type: 'click',
      provider_name: providerName,
      session_id: sessionId || null,
      device_type: getDeviceType(ua),
    });

    // Check if we should evaluate the test
    await maybeEvaluateTest(hubId);
  } catch {
    // Silent fail — analytics must never break UX
  }
}

// ── Evaluate Test ───────────────────────────────────────────

const MIN_IMPRESSIONS = 500;
const MIN_CONFIDENCE = 95;

async function maybeEvaluateTest(hubId: string): Promise<void> {
  const supabase = createServiceClient();

  // Fetch both variants
  const { data: stats } = await supabase
    .from('ab_test_stats')
    .select('*')
    .eq('hub_id', hubId);

  if (!stats || stats.length < 2) return;

  const a = stats.find((s) => s.variant === 'A');
  const b = stats.find((s) => s.variant === 'B');

  if (!a || !b) return;

  // Already concluded?
  if (a.winner_declared || b.winner_declared) return;

  // Minimum threshold
  if (a.impressions < MIN_IMPRESSIONS || b.impressions < MIN_IMPRESSIONS) return;

  const crA = a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0;
  const crB = b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0;

  const confidence = calculateConfidence(
    a.clicks,
    a.impressions,
    b.clicks,
    b.impressions,
  );

  // Not significant enough
  if (confidence < MIN_CONFIDENCE) return;

  // Declare winner
  const winner: AbVariant = crA >= crB ? 'A' : 'B';
  const loserCr = winner === 'A' ? crB : crA;
  const winnerCr = winner === 'A' ? crA : crB;
  const lift = loserCr > 0 ? ((winnerCr - loserCr) / loserCr) * 100 : 0;

  const { category, market } = parseHubId(hubId);
  const now = new Date().toISOString();

  // Mark test as concluded
  await supabase
    .from('ab_test_stats')
    .update({ winner_declared: true, winner_declared_at: now })
    .eq('hub_id', hubId);

  // Log winner
  await supabase.from('ab_test_winners').insert({
    hub_id: hubId,
    winning_variant: winner,
    variant_a_cr: crA,
    variant_b_cr: crB,
    variant_a_impressions: a.impressions,
    variant_b_impressions: b.impressions,
    variant_a_clicks: a.clicks,
    variant_b_clicks: b.clicks,
    lift_percent: lift,
    confidence,
  });

  // Telegram notification
  const variantLabel = winner === 'A' ? 'Profit-First' : 'Trust-First';
  await sendTelegramAlert(
    `🚀 <b>A/B-Test Update</b>\n\n` +
      `Variant <b>${winner}</b> (${variantLabel}) gewinnt in <b>${category}</b> (${market.toUpperCase()}) ` +
      `mit <b>+${lift.toFixed(1)}%</b> CR.\n\n` +
      `📊 Variant A (Profit): ${crA.toFixed(2)}% CR (${a.impressions} imp, ${a.clicks} clicks)\n` +
      `📊 Variant B (Trust): ${crB.toFixed(2)}% CR (${b.impressions} imp, ${b.clicks} clicks)\n` +
      `🎯 Confidence: ${confidence}%\n\n` +
      `Hub wird automatisch auf <b>${variantLabel}</b> umgestellt.`,
  );
}

// ── Get Winner (for rendering) ──────────────────────────────

/**
 * Returns the winning variant for a hub, or null if test still running.
 * Used by ComparisonHub to permanently lock in the winning sort order.
 */
export async function getHubWinner(
  category: string,
  market: string,
): Promise<AbVariant | null> {
  try {
    const supabase = createServiceClient();
    const hubId = buildHubId(category, market);

    const { data } = await supabase
      .from('ab_test_winners')
      .select('winning_variant')
      .eq('hub_id', hubId)
      .order('declared_at', { ascending: false })
      .limit(1)
      .single();

    return (data?.winning_variant as AbVariant) || null;
  } catch {
    return null;
  }
}

// ── Dashboard: Live View Data ───────────────────────────────

export async function getAbTestLiveData(): Promise<AbTestLiveView[]> {
  const supabase = createServiceClient();

  const { data: stats } = await supabase
    .from('ab_test_stats')
    .select('*')
    .order('hub_id');

  if (!stats) return [];

  // Group by hub_id
  const hubMap = new Map<string, typeof stats>();
  for (const row of stats) {
    const existing = hubMap.get(row.hub_id) || [];
    existing.push(row);
    hubMap.set(row.hub_id, existing);
  }

  // Get existing winners
  const { data: winners } = await supabase
    .from('ab_test_winners')
    .select('hub_id, winning_variant, lift_percent, confidence');

  const winnerMap = new Map<string, (typeof winners extends (infer U)[] | null ? U : never)>();
  if (winners) {
    for (const w of winners) {
      winnerMap.set(w.hub_id, w);
    }
  }

  const results: AbTestLiveView[] = [];

  for (const [hubId, rows] of hubMap) {
    const a = rows.find((r) => r.variant === 'A');
    const b = rows.find((r) => r.variant === 'B');
    if (!a || !b) continue;

    const crA = a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0;
    const crB = b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0;

    const totalImpressions = a.impressions + b.impressions;
    const isReady =
      a.impressions >= MIN_IMPRESSIONS && b.impressions >= MIN_IMPRESSIONS;
    const isConcluded = a.winner_declared || b.winner_declared;

    const existingWinner = winnerMap.get(hubId);
    const { category, market } = parseHubId(hubId);

    // Skip hubs with zero activity
    if (totalImpressions === 0) continue;

    results.push({
      hubId,
      category,
      market,
      variantA: { impressions: a.impressions, clicks: a.clicks, cr: crA },
      variantB: { impressions: b.impressions, clicks: b.clicks, cr: crB },
      winner: existingWinner
        ? (existingWinner.winning_variant as AbVariant)
        : null,
      winnerLift: existingWinner?.lift_percent ?? null,
      confidence: existingWinner?.confidence ?? (isReady
        ? calculateConfidence(a.clicks, a.impressions, b.clicks, b.impressions)
        : null),
      totalImpressions,
      status: isConcluded ? 'concluded' : isReady ? 'ready' : 'collecting',
    });
  }

  // Sort: active tests first, then by total impressions
  results.sort((x, y) => {
    if (x.status !== y.status) {
      const order = { collecting: 0, ready: 1, concluded: 2 };
      return order[x.status] - order[y.status];
    }
    return y.totalImpressions - x.totalImpressions;
  });

  return results;
}

// ── Reset Test ──────────────────────────────────────────────

export async function resetAbTest(hubId: string): Promise<{ success: boolean }> {
  try {
    const supabase = createServiceClient();

    await supabase
      .from('ab_test_stats')
      .update({
        impressions: 0,
        clicks: 0,
        winner_declared: false,
        winner_declared_at: null,
        last_reset: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('hub_id', hubId);

    return { success: true };
  } catch {
    return { success: false };
  }
}

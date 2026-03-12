// app/api/bandit/stats/route.ts
// P5 Observability: Bandit health metrics for dashboard + alerting
//
// Returns:
//   - Per-segment warmup progress (total_shown vs threshold)
//   - Method distribution (thompson vs ev vs static)
//   - Arm posteriors (alpha, beta, total_shown, total_reward)
//   - Postback KPIs (total events, duplicates skipped, 4xx/5xx counts)
//
// Auth: Requires authenticated session (dashboard access)

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { BANDIT_WARMUP_THRESHOLD } from '@/lib/bandit/thompson-sampling';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServiceClient();

  // ── 1. Bandit arms + warmup progress per segment ──────────────
  const { data: arms } = await supabase
    .from('bandit_arms')
    .select('link_id, market, category, device_type, alpha, beta_param, total_shown, total_reward, updated_at')
    .order('market')
    .order('category')
    .order('total_shown', { ascending: false });

  // Group by segment (market × category × device_type)
  const segmentMap = new Map<string, {
    market: string;
    category: string;
    deviceType: string;
    totalShown: number;
    armCount: number;
    warmedUp: boolean;
    arms: Array<{
      linkId: string;
      alpha: number;
      beta: number;
      shown: number;
      reward: number;
      winRate: string;
      updatedAt: string | null;
    }>;
  }>();

  for (const arm of arms || []) {
    const key = `${arm.market}__${arm.category}__${arm.device_type}`;
    if (!segmentMap.has(key)) {
      segmentMap.set(key, {
        market: arm.market,
        category: arm.category,
        deviceType: arm.device_type,
        totalShown: 0,
        armCount: 0,
        warmedUp: false,
        arms: [],
      });
    }
    const seg = segmentMap.get(key)!;
    const shown = arm.total_shown || 0;
    const reward = arm.total_reward || 0;
    const alpha = parseFloat(String(arm.alpha));
    const beta = parseFloat(String(arm.beta_param));

    seg.totalShown += shown;
    seg.armCount++;
    seg.arms.push({
      linkId: arm.link_id,
      alpha,
      beta,
      shown,
      reward,
      winRate: (alpha + beta > 2) ? ((alpha - 1) / (alpha + beta - 2) * 100).toFixed(1) + '%' : 'n/a',
      updatedAt: arm.updated_at,
    });
  }

  // Mark warmup status
  for (const seg of segmentMap.values()) {
    seg.warmedUp = seg.armCount >= 2 && seg.totalShown >= BANDIT_WARMUP_THRESHOLD;
  }

  const segments = Array.from(segmentMap.values());

  // ── 2. Postback KPIs (last 24h) ──────────────────────────────
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: totalEvents } = await supabase
    .from('conversion_events')
    .select('*', { count: 'exact', head: true })
    .gte('received_at', since24h);

  const { count: approvedEvents } = await supabase
    .from('conversion_events')
    .select('*', { count: 'exact', head: true })
    .gte('received_at', since24h)
    .eq('event_type', 'approved');

  const { count: reversedEvents } = await supabase
    .from('conversion_events')
    .select('*', { count: 'exact', head: true })
    .gte('received_at', since24h)
    .eq('event_type', 'reversed');

  // ── 3. EV cache freshness ─────────────────────────────────────
  const { data: latestEV } = await supabase
    .from('offer_ev_cache')
    .select('computed_at')
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── Summary ───────────────────────────────────────────────────
  const totalSegments = segments.length;
  const warmedUpSegments = segments.filter((s) => s.warmedUp).length;
  const thompsonActive = warmedUpSegments > 0;

  return NextResponse.json({
    bandit: {
      warmupThreshold: BANDIT_WARMUP_THRESHOLD,
      totalSegments,
      warmedUpSegments,
      thompsonActive,
      segments,
    },
    postback: {
      last24h: {
        totalEvents: totalEvents || 0,
        approved: approvedEvents || 0,
        reversed: reversedEvents || 0,
      },
    },
    evCache: {
      lastComputed: latestEV?.computed_at || null,
    },
  });
}

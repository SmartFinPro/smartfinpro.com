'use server';
import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { loadFxRates, toUSD } from '@/lib/fx-rates';
import { logger } from '@/lib/logging';
import {
  computeCohorts,
  type CohortClick,
  type CohortRevenueEvent,
  type CohortResult,
} from '@/lib/cohorts/aggregate';

type Result<T> = { success: boolean; data?: T; error?: string };

// Hard row caps keep the at-render-time aggregation bounded (materialisation is
// a later, separate scope). Window is bounded by `weeks`.
const ROW_CAP = 50_000;

/**
 * Weekly click-cohort LTV from link_clicks × conversion_events.
 *
 * Sources (per-click, click_id-linked — the only model that supports cohorts;
 * the `conversions` table used by revenue.ts is link-level/reconciled and has
 * no click_id):
 *   - link_clicks(click_id, clicked_at)           → cohort = ISO week of click
 *   - conversion_events(click_id, received_at,
 *       event_value, currency, event_type)        → approved revenue per click
 *
 * Assumptions: approved = event_type 'approved'; revenue = FX→USD via toUSD;
 * cohorts = ISO weeks (Monday, UTC). Both tables are windowed by `weeks`
 * (Slice 3.1 simplification — late conversions of older cohorts beyond the
 * window are out of scope here).
 */
export async function getCohortData(weeks = 12): Promise<Result<CohortResult>> {
  try {
    await loadFxRates();
    const supabase = createServiceClient();
    const sinceIso = new Date(Date.now() - weeks * 7 * 86_400_000).toISOString();

    const [clicksRes, eventsRes] = await Promise.all([
      supabase
        .from('link_clicks')
        .select('click_id, clicked_at')
        .gte('clicked_at', sinceIso)
        .not('click_id', 'is', null)
        .limit(ROW_CAP),
      supabase
        .from('conversion_events')
        .select('click_id, received_at, event_value, currency, event_type')
        .eq('event_type', 'approved')
        .gte('received_at', sinceIso)
        .not('click_id', 'is', null)
        .limit(ROW_CAP),
    ]);

    if (clicksRes.error) {
      logger.error('getCohortData clicks query failed', { error: clicksRes.error.message });
      return { success: false, error: clicksRes.error.message };
    }
    if (eventsRes.error) {
      logger.error('getCohortData events query failed', { error: eventsRes.error.message });
      return { success: false, error: eventsRes.error.message };
    }

    const clicks: CohortClick[] = (clicksRes.data ?? []).map((r) => ({
      clickId: String(r.click_id),
      clickedAt: String(r.clicked_at),
    }));

    const events: CohortRevenueEvent[] = (eventsRes.data ?? []).map((r) => ({
      clickId: String(r.click_id),
      receivedAt: String(r.received_at),
      valueUsd: toUSD(Number(r.event_value) || 0, r.currency as string | null),
      eventType: String(r.event_type),
    }));

    const data = computeCohorts(clicks, events, {
      maxAgeWeeks: weeks,
      nowIso: new Date().toISOString(),
    });

    return { success: true, data };
  } catch (err) {
    logger.error('getCohortData failed', err);
    return { success: false, error: 'Internal error' };
  }
}

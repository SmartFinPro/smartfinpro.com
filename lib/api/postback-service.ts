/**
 * S2S Postback Service
 *
 * Processes incoming postback events from affiliate networks and records them
 * in the conversion_events table. Handles validation, dedup, click matching,
 * and side-effects (syncing approved/reversed status to the conversions table).
 */

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import { FUNNEL_EVENT_TYPES, type FunnelEventType } from './connectors/types';
import { updatePosterior } from '@/lib/actions/bandit';

// ── Types ────────────────────────────────────────────────────────────────────

interface PostbackParams {
  click_id: string;
  event: string;
  payout?: number;
  currency?: string;
  txn_id?: string;
  connector?: string;
  metadata?: Record<string, unknown>;
}

interface PostbackResult {
  success: boolean;
  reason?: string;
  event_id?: string;
}

// UUID v4 pattern (loose — some networks may use non-standard formats)
const CLICK_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_EVENTS = new Set<string>(FUNNEL_EVENT_TYPES);

// ── Token Validation ─────────────────────────────────────────────────────────

/**
 * Validate a postback token against connector config or global secret.
 * Returns the connector name if valid, null if invalid.
 */
export async function validatePostbackToken(
  token: string,
  connectorName?: string,
): Promise<{ valid: boolean; connector?: string }> {
  // 1. Check global POSTBACK_SECRET fallback
  const globalSecret = process.env.POSTBACK_SECRET;
  if (globalSecret && token === globalSecret) {
    return { valid: true, connector: connectorName || 'global' };
  }

  // 2. Check connector-specific token
  if (connectorName) {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('api_connectors')
      .select('config')
      .eq('name', connectorName)
      .eq('is_enabled', true)
      .single();

    if (data?.config) {
      const config = data.config as Record<string, unknown>;
      if (config.postback_token && config.postback_token === token) {
        return { valid: true, connector: connectorName };
      }
    }
  }

  // 3. Check all connectors for matching token (when connector not specified)
  if (!connectorName) {
    const supabase = createServiceClient();
    const { data: connectors } = await supabase
      .from('api_connectors')
      .select('name, config')
      .eq('is_enabled', true);

    if (connectors) {
      for (const c of connectors) {
        const config = c.config as Record<string, unknown> | null;
        if (config?.postback_token && config.postback_token === token) {
          return { valid: true, connector: c.name };
        }
      }
    }
  }

  return { valid: false };
}

// ── Main Processing ──────────────────────────────────────────────────────────

/**
 * Process a single S2S postback event.
 *
 * 1. Validate event type + click_id format
 * 2. Match click_id to link_clicks → get link_id
 * 3. Dedup check (click_id + event_type + network_event_id)
 * 4. INSERT into conversion_events
 * 5. Side-effects: sync approved/reversed to conversions table
 */
export async function processPostback(params: PostbackParams): Promise<PostbackResult> {
  const { click_id, event, payout, currency, txn_id, connector, metadata } = params;

  // ── Validate event type ──
  if (!VALID_EVENTS.has(event)) {
    return { success: false, reason: `Invalid event type: ${event}` };
  }
  const eventType = event as FunnelEventType;

  // ── Validate click_id format ──
  if (!click_id || !CLICK_ID_RE.test(click_id)) {
    return { success: false, reason: `Invalid click_id format: ${click_id}` };
  }

  const supabase = createServiceClient();

  // ── Match click_id to link_clicks ──
  // P2-03: Enforce referential integrity at app level — reject orphan events.
  // Affiliate networks MUST send a valid click_id from our /go/ redirect.
  const { data: click } = await supabase
    .from('link_clicks')
    .select('link_id')
    .eq('click_id', click_id)
    .single();

  if (!click) {
    logger.warn(`[postback] Rejected — click_id not found in link_clicks: ${click_id}`);
    return { success: false, reason: 'click_id_not_found' };
  }

  const linkId: string | null = click.link_id;

  // ── Dedup pre-check ──
  //
  // WITH txn_id:
  //   App-level exact-match SELECT (click_id + event_type + txn_id) as fast-path.
  //   Atomic backstop: idx_ce_dedup_with_txn → 23505 on INSERT.
  //
  // WITHOUT txn_id:
  //   NO app-level SELECT — fully atomic via DUAL overlapping DB constraints:
  //     idx_ce_fingerprint_daily_dedup        (midnight-aligned day bucket)
  //     idx_ce_fingerprint_daily_offset_dedup  (noon-aligned day bucket, +12h)
  //   Dedup windows:
  //     < 12h apart:  ALWAYS blocked (≥1 bucket overlap)
  //     12h–24h apart: MAY be blocked (depends on bucket alignment)
  //     ≥ 24h apart:  ALWAYS allowed (both buckets guaranteed different)
  //   This eliminates all SELECT→INSERT race conditions at day boundaries.
  //
  //   TRADE-OFF: Without txn_id, same-type events from the same click_id
  //   within the same bucket (~24h) are treated as duplicates. Networks
  //   SHOULD send txn_id for recurring event types (deposit, etc.).
  if (txn_id) {
    const { count } = await supabase
      .from('conversion_events')
      .select('*', { count: 'exact', head: true })
      .eq('click_id', click_id)
      .eq('event_type', eventType)
      .eq('network_event_id', txn_id);

    if ((count || 0) > 0) {
      return { success: true, reason: 'duplicate_skipped' };
    }
  }

  // ── INSERT into conversion_events ──
  const { data: inserted, error: insertError } = await supabase
    .from('conversion_events')
    .insert({
      click_id,
      link_id: linkId,
      event_type: eventType,
      event_value: payout ?? null,
      event_currency: currency || 'USD',
      network: connector || null,
      network_event_id: txn_id || null,
      metadata: metadata || {},
      occurred_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) {
    // Unique constraint violation = duplicate
    if (insertError.code === '23505') {
      return { success: true, reason: 'duplicate_skipped' };
    }
    logger.error(`[postback] INSERT failed:`, insertError);
    return { success: false, reason: `DB error: ${insertError.message}` };
  }

  // ── Side-effects: sync to conversions table ──
  await syncToConversions(supabase, {
    click_id,
    link_id: linkId,
    event_type: eventType,
    payout,
    currency: currency || 'USD',
    txn_id,
    connector,
  });

  // ── P5: Update bandit posterior on reward/penalty events ──
  if (linkId && (eventType === 'approved' || eventType === 'ftd' || eventType === 'reversed' || eventType === 'rejected')) {
    try {
      // Look up device_type from click_segments (P3) or link_clicks
      let deviceType = 'desktop';
      const { data: segment } = await supabase
        .from('click_segments')
        .select('device_type')
        .eq('click_id', click_id)
        .maybeSingle();

      if (segment?.device_type) {
        deviceType = segment.device_type;
      } else {
        const { data: clickData } = await supabase
          .from('link_clicks')
          .select('device_type')
          .eq('click_id', click_id)
          .maybeSingle();
        if (clickData?.device_type) deviceType = clickData.device_type;
      }

      // Look up market + category from affiliate_links
      const { data: linkData } = await supabase
        .from('affiliate_links')
        .select('market, category')
        .eq('id', linkId)
        .maybeSingle();

      if (linkData?.market && linkData?.category) {
        const isReward = eventType === 'approved' || eventType === 'ftd';
        await updatePosterior(linkId, linkData.market, linkData.category, deviceType, isReward);
      }
    } catch (e) {
      // Non-critical — bandit update failure should not block postback processing
      logger.error('[postback] Bandit posterior update failed', { error: e, click_id });
    }
  }

  logger.info(
    `[postback] ${eventType} recorded for click ${click_id.slice(0, 8)}… ` +
    `(link=${linkId?.slice(0, 8) ?? 'unmatched'}, value=${payout ?? 0} ${currency || 'USD'})`,
  );

  return { success: true, event_id: inserted?.id };
}

// ── Side-effect: Sync approved/reversed to conversions table ─────────────────

type SupabaseClient = Awaited<ReturnType<typeof createServiceClient>>;

async function syncToConversions(
  supabase: SupabaseClient,
  params: {
    click_id: string;
    link_id: string | null;
    event_type: FunnelEventType;
    payout?: number;
    currency: string;
    txn_id?: string;
    connector?: string;
  },
): Promise<void> {
  const { click_id, link_id, event_type, payout, currency, txn_id, connector } = params;

  try {
    if (event_type === 'approved' && payout && payout > 0) {
      // Create/update conversions entry for revenue dashboard compatibility
      const existing = await supabase
        .from('conversions')
        .select('id')
        .eq('network_reference', txn_id || click_id)
        .single();

      if (!existing.data) {
        await supabase.from('conversions').insert({
          link_id,
          converted_at: new Date().toISOString(),
          commission_earned: payout,
          currency,
          network: connector || null,
          network_reference: txn_id || click_id,
          status: 'approved',
          approved_at: new Date().toISOString(),
        });
      } else {
        await supabase
          .from('conversions')
          .update({ status: 'approved', approved_at: new Date().toISOString() })
          .eq('id', existing.data.id);
      }
    }

    if (event_type === 'reversed') {
      // Mark matching conversion as reversed
      const ref = txn_id || click_id;
      await supabase
        .from('conversions')
        .update({ status: 'reversed' })
        .eq('network_reference', ref);
    }

    if (event_type === 'rejected') {
      const ref = txn_id || click_id;
      await supabase
        .from('conversions')
        .update({ status: 'rejected' })
        .eq('network_reference', ref);
    }
  } catch (err) {
    // Non-blocking — event graph is the source of truth
    logger.warn(`[postback] syncToConversions side-effect failed:`, err);
  }
}

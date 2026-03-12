'use server';

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { FUNNEL_STAGE_ORDER, type FunnelEventType } from '@/lib/api/connectors/types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FunnelStage {
  event_type: FunnelEventType;
  unique_clicks: number;
  conversion_rate: number; // % from previous stage
  total_value: number;
}

export interface FunnelStats {
  totalClicks: number;
  stages: FunnelStage[];
}

export interface OfferEV {
  partner_name: string;
  market: string;
  category: string;
  total_clicks: number;
  registrations: number;
  ftds: number;
  approved: number;
  reversed: number;
  gross_revenue: number;
  net_revenue: number;
  registration_rate: number;
  ftd_rate: number;
  approval_rate: number;
  reversal_rate: number;
  expected_value: number;
}

export interface ClickLifecycle {
  click: {
    click_id: string;
    clicked_at: string;
    slug: string | null;
    country_code: string;
    utm_source: string | null;
    device_type: string | null;
    partner_name: string | null;
  };
  events: {
    event_type: string;
    event_value: number | null;
    event_currency: string;
    network: string | null;
    occurred_at: string | null;
    received_at: string;
  }[];
  conversion: {
    status: string;
    commission_earned: number;
    currency: string;
  } | null;
}

export interface RecentEvent {
  id: string;
  click_id: string;
  event_type: string;
  event_value: number | null;
  event_currency: string;
  network: string | null;
  received_at: string;
  partner_name: string | null;
  market: string | null;
}

// ── 1. Funnel Stats (aggregated) ─────────────────────────────────────────────

export async function getFunnelStats(params?: {
  days?: number;
  market?: string;
  category?: string;
  partner?: string;
}): Promise<FunnelStats> {
  const supabase = createServiceClient();
  const days = params?.days ?? 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  // Total clicks in the period
  let clickQuery = supabase
    .from('link_clicks')
    .select('click_id', { count: 'exact', head: true })
    .gte('clicked_at', since);

  if (params?.market) {
    // ISO 3166-1 alpha-2: our market codes differ from country codes for UK
    const marketToISO: Record<string, string> = { uk: 'GB', us: 'US', ca: 'CA', au: 'AU' };
    const isoCode = marketToISO[params.market.toLowerCase()] || params.market.toUpperCase();
    clickQuery = clickQuery.eq('country_code', isoCode);
  }

  const { count: totalClicks } = await clickQuery;

  // Events per stage in the period
  let eventsQuery = supabase
    .from('conversion_events')
    .select('event_type, click_id, event_value')
    .gte('received_at', since);

  if (params?.partner || params?.market || params?.category) {
    // Filter link_ids first, then scope events to those links
    const linkFilter = supabase.from('affiliate_links').select('id');
    if (params?.partner) linkFilter.eq('partner_name', params.partner);
    if (params?.market) linkFilter.eq('market', params.market);
    if (params?.category) linkFilter.eq('category', params.category);
    const { data: links } = await linkFilter;
    if (!links || links.length === 0) {
      // No links match the filter → return empty funnel (not unfiltered fallback)
      return {
        totalClicks: totalClicks || 0,
        stages: FUNNEL_STAGE_ORDER.map((et) => ({
          event_type: et,
          unique_clicks: 0,
          conversion_rate: 0,
          total_value: 0,
        })),
      };
    }
    eventsQuery = eventsQuery.in('link_id', links.map((l) => l.id));
  }

  const { data: events } = await eventsQuery;

  // Aggregate by event type
  const stageMap = new Map<string, { clicks: Set<string>; totalValue: number }>();
  for (const e of events || []) {
    if (!stageMap.has(e.event_type)) {
      stageMap.set(e.event_type, { clicks: new Set(), totalValue: 0 });
    }
    const stage = stageMap.get(e.event_type)!;
    stage.clicks.add(e.click_id);
    stage.totalValue += Number(e.event_value) || 0;
  }

  // Build ordered stages
  const stages: FunnelStage[] = [];
  let previousCount = totalClicks || 0;

  for (const eventType of FUNNEL_STAGE_ORDER) {
    const data = stageMap.get(eventType);
    const uniqueClicks = data?.clicks.size ?? 0;
    const rate = previousCount > 0 ? (uniqueClicks / previousCount) * 100 : 0;

    stages.push({
      event_type: eventType,
      unique_clicks: uniqueClicks,
      conversion_rate: Math.round(rate * 100) / 100,
      total_value: data?.totalValue ?? 0,
    });

    // Next stage's rate is relative to this stage (if > 0)
    if (uniqueClicks > 0) previousCount = uniqueClicks;
  }

  return {
    totalClicks: totalClicks || 0,
    stages,
  };
}

// ── 2. Offer Expected Values ─────────────────────────────────────────────────

export async function getOfferExpectedValues(params?: {
  days?: number;
  market?: string;
}): Promise<OfferEV[]> {
  const supabase = createServiceClient();
  const days = params?.days ?? 90;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  // Get affiliate links
  let linksQuery = supabase
    .from('affiliate_links')
    .select('id, partner_name, market, category')
    .eq('active', true);
  if (params?.market) linksQuery = linksQuery.eq('market', params.market);
  const { data: links } = await linksQuery;
  if (!links || links.length === 0) return [];

  const linkIds = links.map((l) => l.id);

  // Get clicks per link
  const { data: clicks } = await supabase
    .from('link_clicks')
    .select('link_id, click_id')
    .in('link_id', linkIds)
    .gte('clicked_at', since);

  // Group clicks by link_id
  const clicksByLink = new Map<string, number>();
  for (const c of clicks || []) {
    clicksByLink.set(c.link_id, (clicksByLink.get(c.link_id) || 0) + 1);
  }

  // Get events per link
  const { data: events } = await supabase
    .from('conversion_events')
    .select('link_id, event_type, event_value, click_id')
    .in('link_id', linkIds)
    .gte('received_at', since);

  // Group events by link_id → event_type
  type EventAgg = { clicks: Set<string>; totalValue: number };
  const eventsByLink = new Map<string, Map<string, EventAgg>>();
  for (const e of events || []) {
    if (!e.link_id) continue;
    if (!eventsByLink.has(e.link_id)) eventsByLink.set(e.link_id, new Map());
    const linkEvents = eventsByLink.get(e.link_id)!;
    if (!linkEvents.has(e.event_type)) {
      linkEvents.set(e.event_type, { clicks: new Set(), totalValue: 0 });
    }
    const agg = linkEvents.get(e.event_type)!;
    agg.clicks.add(e.click_id);
    agg.totalValue += Number(e.event_value) || 0;
  }

  // Calculate EV per offer
  const results: OfferEV[] = [];

  for (const link of links) {
    const totalClicks = clicksByLink.get(link.id) || 0;
    if (totalClicks === 0) continue;

    const linkEvents = eventsByLink.get(link.id);
    const getCount = (type: string) => linkEvents?.get(type)?.clicks.size ?? 0;
    const getValue = (type: string) => linkEvents?.get(type)?.totalValue ?? 0;

    const registrations = getCount('registration');
    const ftds = getCount('ftd');
    const approved = getCount('approved');
    const reversed = getCount('reversed');
    const grossRevenue = getValue('approved') + getValue('ftd');
    const reversedRevenue = getValue('reversed');
    const netRevenue = grossRevenue - reversedRevenue;

    const registrationRate = totalClicks > 0 ? registrations / totalClicks : 0;
    const ftdRate = registrations > 0 ? ftds / registrations : 0;
    const approvalRate = ftds > 0 ? approved / ftds : 0;
    const reversalRate = approved > 0 ? reversed / approved : 0;

    // EV = P(approved|click) × avg_payout × (1 - reversal_rate)
    const pApproved = totalClicks > 0 ? approved / totalClicks : 0;
    const avgPayout = approved > 0 ? grossRevenue / approved : 0;
    const ev = pApproved * avgPayout * (1 - reversalRate);

    results.push({
      partner_name: link.partner_name,
      market: link.market,
      category: link.category,
      total_clicks: totalClicks,
      registrations,
      ftds,
      approved,
      reversed,
      gross_revenue: Math.round(grossRevenue * 100) / 100,
      net_revenue: Math.round(netRevenue * 100) / 100,
      registration_rate: Math.round(registrationRate * 10000) / 100,
      ftd_rate: Math.round(ftdRate * 10000) / 100,
      approval_rate: Math.round(approvalRate * 10000) / 100,
      reversal_rate: Math.round(reversalRate * 10000) / 100,
      expected_value: Math.round(ev * 100) / 100,
    });
  }

  // Sort by EV descending
  results.sort((a, b) => b.expected_value - a.expected_value);

  return results;
}

// ── 3. Click Lifecycle (trace a single click) ────────────────────────────────

export async function getClickLifecycle(clickId: string): Promise<ClickLifecycle | null> {
  const supabase = createServiceClient();

  // Get click data
  const { data: click } = await supabase
    .from('link_clicks')
    .select('click_id, clicked_at, page_slug, country_code, utm_source, device_type, link_id')
    .eq('click_id', clickId)
    .single();

  if (!click) return null;

  // Get affiliate link info
  let partnerName: string | null = null;
  if (click.link_id) {
    const { data: link } = await supabase
      .from('affiliate_links')
      .select('partner_name')
      .eq('id', click.link_id)
      .single();
    partnerName = link?.partner_name ?? null;
  }

  // Get events
  const { data: events } = await supabase
    .from('conversion_events')
    .select('event_type, event_value, event_currency, network, occurred_at, received_at')
    .eq('click_id', clickId)
    .order('received_at', { ascending: true });

  // Get conversion
  const { data: conversion } = await supabase
    .from('conversions')
    .select('status, commission_earned, currency')
    .eq('network_reference', clickId)
    .single();

  return {
    click: {
      click_id: click.click_id,
      clicked_at: click.clicked_at,
      slug: click.page_slug,
      country_code: click.country_code,
      utm_source: click.utm_source,
      device_type: click.device_type,
      partner_name: partnerName,
    },
    events: (events || []).map((e) => ({
      event_type: e.event_type,
      event_value: e.event_value,
      event_currency: e.event_currency || 'USD',
      network: e.network,
      occurred_at: e.occurred_at,
      received_at: e.received_at,
    })),
    conversion: conversion
      ? {
          status: conversion.status,
          commission_earned: Number(conversion.commission_earned),
          currency: conversion.currency,
        }
      : null,
  };
}

// ── 4. Recent Events Stream ──────────────────────────────────────────────────

export async function getRecentEvents(limit = 20): Promise<RecentEvent[]> {
  const supabase = createServiceClient();

  const { data: events } = await supabase
    .from('conversion_events')
    .select('id, click_id, event_type, event_value, event_currency, network, received_at, link_id')
    .order('received_at', { ascending: false })
    .limit(limit);

  if (!events || events.length === 0) return [];

  // Batch-fetch partner names
  const linkIds = [...new Set(events.filter((e) => e.link_id).map((e) => e.link_id!))];
  const linkMap = new Map<string, { partner_name: string; market: string }>();

  if (linkIds.length > 0) {
    const { data: links } = await supabase
      .from('affiliate_links')
      .select('id, partner_name, market')
      .in('id', linkIds);

    for (const l of links || []) {
      linkMap.set(l.id, { partner_name: l.partner_name, market: l.market });
    }
  }

  return events.map((e) => {
    const link = e.link_id ? linkMap.get(e.link_id) : null;
    return {
      id: e.id,
      click_id: e.click_id,
      event_type: e.event_type,
      event_value: e.event_value,
      event_currency: e.event_currency || 'USD',
      network: e.network,
      received_at: e.received_at,
      partner_name: link?.partner_name ?? null,
      market: link?.market ?? null,
    };
  });
}

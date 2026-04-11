// app/api/dashboard/live-stats/route.ts
// Real-time analytics endpoint — polled every 10-30s by LiveDashboardBar + LiveClicksFeed
// Returns: active visitors, today's page views, today's clicks, recent click feed

import { NextRequest, NextResponse } from 'next/server';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface LiveClick {
  id: string;
  page_path: string | null;
  market: string | null;
  device_type: string | null;
  clicked_at: string;
  utm_source: string | null;
}

export interface LiveStatsResponse {
  activeNow: number;
  todayPageViews: number;
  todayClicks: number;
  recentClicks: LiveClick[];
  fetchedAt: string;
}

function extractMarketFromPath(path: string | null): string | null {
  if (!path) return null;
  const match = path.match(/^\/(us|uk|ca|au)(\/|$)/);
  return match ? match[1] : 'us';
}

function extractPagePath(referrer: string | null, landingPage: string | null): string | null {
  const raw = landingPage || referrer;
  if (!raw) return null;
  try {
    // Handle both absolute URLs and relative paths
    if (raw.startsWith('http')) {
      return new URL(raw).pathname;
    }
    return raw.split('?')[0];
  } catch {
    return raw.split('?')[0];
  }
}

export async function GET(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────
  const cookie = request.cookies.get('sfp-dash-auth')?.value;
  const authHeader = request.headers.get('authorization');
  const isAuthed =
    (cookie && isValidDashboardSessionValue(cookie)) ||
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

  // Run all queries in parallel
  const [activeSessions, todayPVs, todayClicksRes, recentClicksRes] = await Promise.all([
    // Active now — unique sessions with a page view in the last 5 minutes
    supabase
      .from('page_views')
      .select('session_id', { count: 'exact', head: false })
      .gte('viewed_at', fiveMinAgo),

    // Today's total page views
    supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', todayStart),

    // Today's affiliate clicks
    supabase
      .from('link_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', todayStart),

    // Recent clicks feed — last 20 clicks
    supabase
      .from('link_clicks')
      .select('id, landing_page, referrer, device_type, clicked_at, utm_source')
      .order('clicked_at', { ascending: false })
      .limit(20),
  ]);

  // Deduplicate session IDs for "active now" count
  const activeSessionIds = new Set(
    (activeSessions.data || []).map((r: { session_id: string }) => r.session_id).filter(Boolean)
  );

  const recentClicks: LiveClick[] = (recentClicksRes.data || []).map((c) => {
    const pagePath = extractPagePath(c.referrer, c.landing_page);
    return {
      id: c.id,
      page_path: pagePath,
      market: extractMarketFromPath(pagePath),
      device_type: c.device_type,
      clicked_at: c.clicked_at,
      utm_source: c.utm_source,
    };
  });

  const response: LiveStatsResponse = {
    activeNow: activeSessionIds.size,
    todayPageViews: todayPVs.count ?? 0,
    todayClicks: todayClicksRes.count ?? 0,
    recentClicks,
    fetchedAt: now.toISOString(),
  };

  return NextResponse.json(response, {
    headers: {
      // No CDN caching — this data must always be fresh
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

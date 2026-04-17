'use server';
import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import type { TimeRange } from '@/lib/actions/dashboard';
import type { Market } from '@/types';

export interface MoneyLeakStats {
  totalScans: number;
  totalEmailsCaptured: number;
  emailConversionRate: number; // 0..1
  totalRecommendationClicks: number;
  recommendationCtr: number; // 0..1 vs email-captured scans
  avgAnnualLeak: number;
  severityBreakdown: Record<string, number>;
  topLeakCategories: Array<{ category: string; count: number }>;
  byMarket: Array<{ market: Market; scans: number; emails: number }>;
  scansByDay: Array<{ date: string; scans: number; emails: number }>;
}

const RANGE_HOURS: Record<TimeRange, number | null> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
  all: null,
};

export async function getMoneyLeakStats(
  range: TimeRange = '7d',
): Promise<{ success: boolean; data?: MoneyLeakStats; error?: string }> {
  try {
    const supabase = createServiceClient();
    const hours = RANGE_HOURS[range];
    const since = hours !== null ? new Date(Date.now() - hours * 3600 * 1000).toISOString() : null;

    let query = supabase
      .from('leak_scanner_results')
      .select(
        'market, email, total_annual_leak, overall_severity, top_leaks, user_clicked_recommendation, created_at',
      );
    if (since) query = query.gte('created_at', since);

    const { data, error } = await query;
    if (error) {
      logger.error('getMoneyLeakStats query failed', { error: error.message });
      return { success: false, error: error.message };
    }

    const rows = data ?? [];
    const totalScans = rows.length;
    const withEmail = rows.filter((r) => r.email);
    const totalEmailsCaptured = withEmail.length;
    const totalRecommendationClicks = rows.filter((r) => r.user_clicked_recommendation).length;

    const avgAnnualLeak =
      totalScans > 0
        ? rows.reduce((sum, r) => sum + Number(r.total_annual_leak ?? 0), 0) / totalScans
        : 0;

    const severityBreakdown: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const r of rows) {
      const s = String(r.overall_severity ?? 'low');
      severityBreakdown[s] = (severityBreakdown[s] ?? 0) + 1;
    }

    const categoryCounts: Record<string, number> = {};
    for (const r of rows) {
      const arr = Array.isArray(r.top_leaks) ? r.top_leaks : [];
      for (const cat of arr) {
        const key = String(cat);
        categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
      }
    }
    const topLeakCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const byMarketMap: Record<Market, { scans: number; emails: number }> = {
      us: { scans: 0, emails: 0 },
      uk: { scans: 0, emails: 0 },
      ca: { scans: 0, emails: 0 },
      au: { scans: 0, emails: 0 },
    };
    for (const r of rows) {
      const m = (r.market as Market) ?? 'us';
      if (byMarketMap[m]) {
        byMarketMap[m].scans += 1;
        if (r.email) byMarketMap[m].emails += 1;
      }
    }
    const byMarket = (Object.keys(byMarketMap) as Market[]).map((m) => ({
      market: m,
      scans: byMarketMap[m].scans,
      emails: byMarketMap[m].emails,
    }));

    const dayMap: Record<string, { scans: number; emails: number }> = {};
    for (const r of rows) {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      if (!dayMap[d]) dayMap[d] = { scans: 0, emails: 0 };
      dayMap[d].scans += 1;
      if (r.email) dayMap[d].emails += 1;
    }
    const scansByDay = Object.entries(dayMap)
      .map(([date, v]) => ({ date, scans: v.scans, emails: v.emails }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    return {
      success: true,
      data: {
        totalScans,
        totalEmailsCaptured,
        emailConversionRate: totalScans > 0 ? totalEmailsCaptured / totalScans : 0,
        totalRecommendationClicks,
        recommendationCtr:
          totalEmailsCaptured > 0 ? totalRecommendationClicks / totalEmailsCaptured : 0,
        avgAnnualLeak,
        severityBreakdown,
        topLeakCategories,
        byMarket,
        scansByDay,
      },
    };
  } catch (err) {
    logger.error('getMoneyLeakStats failed', err);
    return { success: false, error: 'Internal error' };
  }
}

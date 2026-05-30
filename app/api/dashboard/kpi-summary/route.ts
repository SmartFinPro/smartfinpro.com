// app/api/dashboard/kpi-summary/route.ts
import { NextResponse } from 'next/server';
import { getProfitAndLoss } from '@/lib/actions/revenue';
import { getDashboardStats } from '@/lib/actions/dashboard';

// Auth: /api/dashboard/* is centrally gated by proxy.ts — no inline check here.

export interface KpiSummary {
  revenueUsd: number;
  netUsd: number;
  clicks: number;
  conversions: number;
  conversionRatePct: number;
  apiCostUsd: number;
}

const ZEROS: KpiSummary = {
  revenueUsd: 0,
  netUsd: 0,
  clicks: 0,
  conversions: 0,
  conversionRatePct: 0,
  apiCostUsd: 0,
};

export async function GET() {
  try {
    // Fire both data sources in parallel — last 30 days.
    const [pnl, stats] = await Promise.all([
      getProfitAndLoss(30),
      getDashboardStats('30d'),
    ]);

    // Clicks within the 30d range.
    const clicks = stats.totalClicksInRange ?? 0;
    // Approved conversions are the platform-relevant figure (drives revenue).
    const conversions = stats.funnelData?.approvedConversions ?? 0;
    // conversionRate is a string ("0.00") in DashboardStats — coerce safely.
    const conversionRatePct = Number.parseFloat(stats.conversionRate ?? '0') || 0;

    const summary: KpiSummary = {
      revenueUsd: pnl.grossRevenueUsd ?? 0,
      netUsd: pnl.netUsd ?? 0,
      clicks,
      conversions,
      conversionRatePct,
      apiCostUsd: pnl.apiCostUsd ?? 0,
    };

    return NextResponse.json(summary);
  } catch {
    // Graceful zeros on any error — header must never break the dashboard.
    return NextResponse.json(ZEROS);
  }
}

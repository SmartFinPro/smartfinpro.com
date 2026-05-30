// lib/actions/system-integrity.ts
'use server';
import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import { getAllContent } from '@/lib/mdx';

// ============================================================
// F-08: Real System Integrity data.
// Replaces the previously hardcoded "100% health" fake values
// with figures derived from live sources:
//   - getAllContent()        → real page counts (total + per market)
//   - cron_logs (24h)        → cron success rate + last run
//   - web_vitals (7d)        → share of "good" RUM samples
//   - compliance_audit_runs  → latest disclosure/compliance audit
// Each source degrades gracefully (Promise.allSettled) so a single
// failing query never blanks the whole widget. Fields that cannot be
// measured from data (e.g. build-time type errors) are intentionally
// NOT fabricated.
// ============================================================

export interface MarketStatus {
  code: string;
  flag: string;
  name: string;
  pages: number;
  /** Received real-user telemetry in the last 24h (web_vitals). */
  receivingTraffic: boolean;
}

export interface SystemIntegrityData {
  /** 0-100 composite of the signals that were actually available, or null. */
  healthScore: number | null;
  totalPages: number;
  markets: MarketStatus[];
  cron: {
    windowHours: number;
    totalRuns: number;
    successRuns: number;
    failedJobs: string[];
    successRate: number | null; // 0-100
    lastRunAt: string | null;
  } | null;
  vitals: {
    windowDays: number;
    samples: number;
    goodRate: number | null; // 0-100
    poorRate: number | null; // 0-100
  } | null;
  compliance: {
    ranAt: string | null;
    totalLinks: number;
    compliant: number;
    attention: number;
    critical: number;
  } | null;
  computedAt: string;
}

const MARKET_META: Record<string, { flag: string; name: string }> = {
  us: { flag: '🇺🇸', name: 'United States' },
  uk: { flag: '🇬🇧', name: 'United Kingdom' },
  ca: { flag: '🇨🇦', name: 'Canada' },
  au: { flag: '🇦🇺', name: 'Australia' },
};

export async function getSystemIntegrity(): Promise<
  { success: true; data: SystemIntegrityData } | { success: false; error: string }
> {
  try {
    const supabase = createServiceClient();
    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [contentRes, cronRes, vitalsRes, complianceRes, trafficRes] =
      await Promise.allSettled([
        getAllContent(),
        supabase
          .from('cron_logs')
          .select('job_name, status, executed_at')
          .gte('executed_at', since24h),
        supabase.from('web_vitals').select('rating').gte('recorded_at', since7d),
        supabase
          .from('compliance_audit_runs')
          .select('ran_at, total_links, compliant_count, attention_count, critical_count')
          .order('ran_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('web_vitals').select('market').gte('recorded_at', since24h),
      ]);

    // ── Pages per market (real) ──────────────────────────────
    const pageCounts: Record<string, number> = { us: 0, uk: 0, ca: 0, au: 0 };
    let totalPages = 0;
    if (contentRes.status === 'fulfilled') {
      for (const item of contentRes.value) {
        const m = item.meta.market;
        if (m && m in pageCounts) pageCounts[m] += 1;
        totalPages += 1;
      }
    }

    // ── Markets receiving real-user telemetry in last 24h ────
    const trafficMarkets = new Set<string>();
    if (trafficRes.status === 'fulfilled' && !trafficRes.value.error) {
      const rows = (trafficRes.value.data ?? []) as Array<{ market: string | null }>;
      for (const row of rows) {
        if (row.market) trafficMarkets.add(row.market);
      }
    }

    const markets: MarketStatus[] = (['us', 'uk', 'ca', 'au'] as const).map((code) => ({
      code: code.toUpperCase(),
      flag: MARKET_META[code].flag,
      name: MARKET_META[code].name,
      pages: pageCounts[code],
      receivingTraffic: trafficMarkets.has(code),
    }));

    // ── Cron health (24h) ────────────────────────────────────
    let cron: SystemIntegrityData['cron'] = null;
    if (cronRes.status === 'fulfilled' && !cronRes.value.error) {
      const rows = (cronRes.value.data ?? []) as Array<{
        job_name: string;
        status: string;
        executed_at: string | null;
      }>;
      const successRuns = rows.filter(
        (r) => r.status === 'success' || r.status === 'completed',
      ).length;
      const failedJobs = Array.from(
        new Set(rows.filter((r) => r.status === 'error').map((r) => r.job_name)),
      );
      const lastRunAt =
        rows.reduce<string | null>((acc, r) => {
          if (!r.executed_at) return acc;
          return !acc || r.executed_at > acc ? r.executed_at : acc;
        }, null) ?? null;
      cron = {
        windowHours: 24,
        totalRuns: rows.length,
        successRuns,
        failedJobs,
        successRate: rows.length > 0 ? Math.round((successRuns / rows.length) * 100) : null,
        lastRunAt,
      };
    }

    // ── Web Vitals RUM (7d) ──────────────────────────────────
    let vitals: SystemIntegrityData['vitals'] = null;
    if (vitalsRes.status === 'fulfilled' && !vitalsRes.value.error) {
      const rows = (vitalsRes.value.data ?? []) as Array<{ rating: string | null }>;
      const total = rows.length;
      const good = rows.filter((r) => r.rating === 'good').length;
      const poor = rows.filter((r) => r.rating === 'poor').length;
      vitals = {
        windowDays: 7,
        samples: total,
        goodRate: total > 0 ? Math.round((good / total) * 100) : null,
        poorRate: total > 0 ? Math.round((poor / total) * 100) : null,
      };
    }

    // ── Compliance (latest audit run) ────────────────────────
    let compliance: SystemIntegrityData['compliance'] = null;
    if (complianceRes.status === 'fulfilled' && !complianceRes.value.error && complianceRes.value.data) {
      const c = complianceRes.value.data as {
        ran_at: string | null;
        total_links: number | null;
        compliant_count: number | null;
        attention_count: number | null;
        critical_count: number | null;
      };
      compliance = {
        ranAt: c.ran_at ?? null,
        totalLinks: c.total_links ?? 0,
        compliant: c.compliant_count ?? 0,
        attention: c.attention_count ?? 0,
        critical: c.critical_count ?? 0,
      };
    }

    // ── Composite health score (only over available signals) ─
    const scores: number[] = [];
    if (cron?.successRate != null) scores.push(cron.successRate);
    if (vitals?.goodRate != null) scores.push(vitals.goodRate);
    if (compliance && compliance.totalLinks > 0) {
      scores.push(Math.round((compliance.compliant / compliance.totalLinks) * 100));
    }
    const healthScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    return {
      success: true,
      data: {
        healthScore,
        totalPages,
        markets,
        cron,
        vitals,
        compliance,
        computedAt: new Date(now).toISOString(),
      },
    };
  } catch (err) {
    logger.error('getSystemIntegrity failed', err);
    return { success: false, error: 'Failed to compute system integrity' };
  }
}

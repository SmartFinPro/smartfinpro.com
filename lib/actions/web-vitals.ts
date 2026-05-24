'use server';

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';

export type WebVitalsRating = 'good' | 'needs-improvement' | 'poor';

export interface WebVitalsMetricSummary {
  name: string;
  p75: number;
  rating: WebVitalsRating;
  good: number;
  needsImprovement: number;
  poor: number;
  total: number;
  unit: string;
  target: number;
  budgetStatus: 'ok' | 'warning' | 'over' | null;
  budget: number;
}

export interface WebVitalsP75Summary {
  lcp_p75: number | null;
  inp_p75: number | null;
  cls_p75: number | null;
  sample_size: number;
  warning_metrics: number;
  poor_metrics: number;
  checked_at: string;
  last_recorded_at: string | null;
}

const TARGETS: Record<string, { good: number; poor: number; unit: string }> = {
  LCP: { good: 2500, poor: 4000, unit: 'ms' },
  INP: { good: 200, poor: 500, unit: 'ms' },
  CLS: { good: 0.1, poor: 0.25, unit: '' },
  FCP: { good: 1800, poor: 3000, unit: 'ms' },
  TTFB: { good: 800, poor: 1800, unit: 'ms' },
};

export async function getWebVitalsMetricSummaries(days = 7): Promise<WebVitalsMetricSummary[]> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const [vitalsRes, settingsRes] = await Promise.all([
    supabase
      .from('web_vitals')
      .select('name, value, rating, recorded_at')
      .gte('recorded_at', since),
    supabase
      .from('system_settings')
      .select('key, value')
      .eq('category', 'performance'),
  ]);

  const data = vitalsRes.data;
  if (!data?.length) return [];

  const settingsMap: Record<string, string> = {};
  for (const setting of settingsRes.data || []) {
    settingsMap[setting.key] = setting.value;
  }

  const budgetValues: Record<string, number> = {
    LCP: parseFloat(settingsMap.cwv_budget_lcp || '2500'),
    INP: parseFloat(settingsMap.cwv_budget_inp || '200'),
    CLS: parseFloat(settingsMap.cwv_budget_cls || '0.1'),
    FCP: 1800,
    TTFB: 800,
  };

  const byMetric: Record<string, { values: number[]; ratings: WebVitalsRating[] }> = {};

  for (const row of data) {
    if (!byMetric[row.name]) {
      byMetric[row.name] = { values: [], ratings: [] };
    }
    byMetric[row.name].values.push(row.value);
    byMetric[row.name].ratings.push(row.rating as WebVitalsRating);
  }

  return Object.entries(TARGETS).map(([name, cfg]) => {
    const metric = byMetric[name];
    const budget = budgetValues[name] ?? cfg.good;

    if (!metric) {
      return {
        name,
        unit: cfg.unit,
        target: cfg.good,
        budget,
        p75: 0,
        rating: 'good' as WebVitalsRating,
        budgetStatus: null,
        good: 0,
        needsImprovement: 0,
        poor: 0,
        total: 0,
      };
    }

    const sorted = [...metric.values].sort((a, b) => a - b);
    const p75Idx = Math.floor(sorted.length * 0.75);
    const p75 = sorted[p75Idx] ?? 0;

    const rating: WebVitalsRating =
      p75 <= cfg.good ? 'good' :
      p75 > cfg.poor ? 'poor' : 'needs-improvement';

    const good = metric.ratings.filter((r) => r === 'good').length;
    const poor = metric.ratings.filter((r) => r === 'poor').length;
    const needsImprovement = metric.ratings.filter((r) => r === 'needs-improvement').length;

    let budgetStatus: 'ok' | 'warning' | 'over' | null = null;
    if (p75 > 0 && budget > 0) {
      const ratio = p75 / budget;
      budgetStatus = ratio > 1 ? 'over' : ratio > 0.8 ? 'warning' : 'ok';
    }

    return {
      name,
      unit: cfg.unit,
      target: cfg.good,
      budget,
      p75,
      rating,
      budgetStatus,
      good,
      needsImprovement,
      poor,
      total: metric.values.length,
    };
  });
}

export async function getWebVitalsP75LastNDays(days = 7): Promise<WebVitalsP75Summary> {
  const summaries = await getWebVitalsMetricSummaries(days);
  const lcp = summaries.find((metric) => metric.name === 'LCP');
  const inp = summaries.find((metric) => metric.name === 'INP');
  const cls = summaries.find((metric) => metric.name === 'CLS');

  const sampleSize = [lcp?.total ?? 0, inp?.total ?? 0, cls?.total ?? 0].reduce((sum, count) => sum + count, 0);
  const warningMetrics = [lcp, inp, cls].filter((metric) => metric?.rating === 'needs-improvement').length;
  const poorMetrics = [lcp, inp, cls].filter((metric) => metric?.rating === 'poor').length;

  let lastRecordedAt: string | null = null;
  if (sampleSize > 0) {
    const supabase = createServiceClient();
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const { data } = await supabase
      .from('web_vitals')
      .select('recorded_at')
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    lastRecordedAt = data?.recorded_at ?? null;
  }

  return {
    lcp_p75: lcp?.total ? lcp.p75 : null,
    inp_p75: inp?.total ? inp.p75 : null,
    cls_p75: cls?.total ? cls.p75 : null,
    sample_size: sampleSize,
    warning_metrics: warningMetrics,
    poor_metrics: poorMetrics,
    checked_at: new Date().toISOString(),
    last_recorded_at: lastRecordedAt,
  };
}

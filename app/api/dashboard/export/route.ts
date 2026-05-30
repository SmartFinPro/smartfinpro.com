// app/api/dashboard/export/route.ts
import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAuditLog } from '@/lib/actions/audit-log';
import { getRevenueByPage } from '@/lib/actions/revenue';
import { toCsv, type CsvColumn } from '@/lib/utils/csv';
import { logger } from '@/lib/logging';

// Auth handled centrally by proxy.ts for /api/dashboard/*
export const dynamic = 'force-dynamic';

const DATASETS = ['conversions', 'affiliate-links', 'audit-log', 'revenue-by-page'] as const;
type Dataset = (typeof DATASETS)[number];

// Hard ceiling on exported rows to keep responses bounded.
const MAX_ROWS = 5000;

interface ExportResult {
  rows: Record<string, unknown>[];
  columns: CsvColumn[];
}

async function buildConversions(): Promise<ExportResult> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('conversions')
    .select(
      `id, link_id, click_id, commission_earned, currency, status, network_reference, converted_at,
       affiliate_links ( slug, partner_name )`,
    )
    .order('converted_at', { ascending: false })
    .limit(MAX_ROWS);

  if (error) throw new Error(error.message);

  interface Row {
    id: string;
    link_id: string | null;
    click_id: string | null;
    commission_earned: number | null;
    currency: string | null;
    status: string | null;
    network_reference: string | null;
    converted_at: string | null;
    affiliate_links: { slug: string; partner_name: string }[] | { slug: string; partner_name: string } | null;
  }

  const rows = ((data ?? []) as Row[]).map((r) => {
    const link = Array.isArray(r.affiliate_links) ? r.affiliate_links[0] : r.affiliate_links;
    return {
      id: r.id,
      converted_at: r.converted_at,
      partner_name: link?.partner_name ?? '',
      slug: link?.slug ?? '',
      commission_earned: r.commission_earned,
      currency: r.currency,
      status: r.status,
      network_reference: r.network_reference,
      link_id: r.link_id,
      click_id: r.click_id,
    };
  });

  return {
    rows,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'converted_at', label: 'Converted At' },
      { key: 'partner_name', label: 'Partner' },
      { key: 'slug', label: 'Slug' },
      { key: 'commission_earned', label: 'Commission' },
      { key: 'currency', label: 'Currency' },
      { key: 'status', label: 'Status' },
      { key: 'network_reference', label: 'Network Reference' },
      { key: 'link_id', label: 'Link ID' },
      { key: 'click_id', label: 'Click ID' },
    ],
  };
}

async function buildAffiliateLinks(): Promise<ExportResult> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('affiliate_links')
    .select(
      `id, slug, partner_name, destination_url, category, market, commission_type,
       commission_value, network, active, health_status, compliance_label, created_at`,
    )
    .order('partner_name', { ascending: true })
    .limit(MAX_ROWS);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Record<string, unknown>[];

  return {
    rows,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'slug', label: 'Slug' },
      { key: 'partner_name', label: 'Partner' },
      { key: 'destination_url', label: 'Destination URL' },
      { key: 'category', label: 'Category' },
      { key: 'market', label: 'Market' },
      { key: 'commission_type', label: 'Commission Type' },
      { key: 'commission_value', label: 'Commission Value' },
      { key: 'network', label: 'Network' },
      { key: 'active', label: 'Active' },
      { key: 'health_status', label: 'Health Status' },
      { key: 'compliance_label', label: 'Compliance Label' },
      { key: 'created_at', label: 'Created At' },
    ],
  };
}

async function buildAuditLog(): Promise<ExportResult> {
  const { entries } = await getAuditLog({ source: 'all', limit: MAX_ROWS });

  const rows = entries.map((e) => ({
    ts: e.ts,
    source: e.source,
    category: e.category,
    status: e.status,
    title: e.title,
    detail: e.detail ?? '',
    duration_ms: e.durationMs ?? '',
  }));

  return {
    rows,
    columns: [
      { key: 'ts', label: 'Timestamp' },
      { key: 'source', label: 'Source' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'title', label: 'Title' },
      { key: 'detail', label: 'Detail' },
      { key: 'duration_ms', label: 'Duration (ms)' },
    ],
  };
}

async function buildRevenueByPage(days: number): Promise<ExportResult> {
  const stats = await getRevenueByPage(days);

  const rows = stats.pages.slice(0, MAX_ROWS).map((p) => ({
    page_slug: p.pageSlug,
    total_clicks: p.totalClicks,
    total_conversions: p.totalConversions,
    approved_revenue: p.approvedRevenue,
    pending_revenue: p.pendingRevenue,
    conversion_rate: p.conversionRate,
    epc: p.epc,
    top_partner: p.topPartner,
    trend: p.trend,
    trend_change: p.trendChange,
  }));

  return {
    rows,
    columns: [
      { key: 'page_slug', label: 'Page Slug' },
      { key: 'total_clicks', label: 'Clicks' },
      { key: 'total_conversions', label: 'Conversions' },
      { key: 'approved_revenue', label: 'Approved Revenue (USD)' },
      { key: 'pending_revenue', label: 'Pending Revenue (USD)' },
      { key: 'conversion_rate', label: 'Conversion Rate' },
      { key: 'epc', label: 'EPC (USD)' },
      { key: 'top_partner', label: 'Top Partner' },
      { key: 'trend', label: 'Trend' },
      { key: 'trend_change', label: 'Trend Change' },
    ],
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dataset = searchParams.get('dataset') as Dataset | null;

  if (!dataset || !DATASETS.includes(dataset)) {
    return Response.json(
      { error: `Unknown dataset. Expected one of: ${DATASETS.join(', ')}` },
      { status: 400 },
    );
  }

  // Optional time window for time-bounded datasets.
  const daysRaw = parseInt(searchParams.get('days') ?? '', 10);
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(daysRaw, 365) : 30;

  try {
    let result: ExportResult;
    switch (dataset) {
      case 'conversions':
        result = await buildConversions();
        break;
      case 'affiliate-links':
        result = await buildAffiliateLinks();
        break;
      case 'audit-log':
        result = await buildAuditLog();
        break;
      case 'revenue-by-page':
        result = await buildRevenueByPage(days);
        break;
    }

    const csv = toCsv(result.rows, result.columns);
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `${dataset}-${date}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    logger.error('dashboard/export failed', { dataset, error: String(err) });
    return Response.json({ error: 'Export failed' }, { status: 500 });
  }
}

// app/(dashboard)/dashboard/content/hub/page.tsx — SEO Health & Content Hub
import Link from 'next/link';
import { Suspense } from 'react';
import {
  FileSearch,
  RefreshCw,
  FileText,
  Globe,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Zap,
  X,
  Link2,
  Star,
  Archive,
  Clock,
} from 'lucide-react';
import { getContentHubData } from '@/lib/actions/content-hub';
import { getCtaPartnersForPages } from '@/lib/actions/page-cta-partners';
import { getAffiliateLinksService } from '@/lib/actions/affiliate-links';
import { getContentFreshnessStats } from '@/lib/actions/content-freshness';
import { ContentHubTableBody } from '@/components/dashboard/content-hub-table-body';
import { ContentHubRefreshButton } from '@/components/dashboard/content-hub-refresh-button';
import { BacklinkImportButton } from '@/components/dashboard/backlink-import-button';
import { ContentFreshnessWidget } from '@/components/dashboard/content-freshness-widget';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';
import type { ContentHubRow, HealthStatus } from '@/lib/actions/content-hub';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── Filter types ───────────────────────────────────────────────

type SeoFilter = 'all' | 'optimal' | 'issues' | 'yellow' | 'red';
type QualityFilter = 'all' | '90plus' | 'good' | 'below80';
type StatusFilter = 'all' | 'active' | 'archived';
type CpsFilter = 'all' | 'easy' | 'medium' | 'hard' | 'missing';

const SEO_FILTER_LABELS: Record<SeoFilter, string> = {
  all: 'All Pages',
  optimal: 'SEO Optimal',
  issues: 'SEO Issues (Yellow + Red)',
  yellow: 'SEO Needs Work',
  red: 'SEO Critical',
};

const QUALITY_FILTER_LABELS: Record<QualityFilter, string> = {
  all: 'All Quality',
  '90plus': 'Quality ≥ 90 (Excellent)',
  good: 'Quality 80–89 (Good)',
  below80: 'Quality < 80 (Needs Work)',
};

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All Status',
  active: 'Active Pages',
  archived: 'Archived Pages',
};

const CPS_FILTER_LABELS: Record<CpsFilter, string> = {
  all: 'All CPS',
  easy: 'CPS ≤ 20 (Easy)',
  medium: 'CPS 21–40 (Medium)',
  hard: 'CPS > 40 (Hard)',
  missing: 'CPS Missing',
};

function filterBySeo(rows: ContentHubRow[], filter: SeoFilter): ContentHubRow[] {
  switch (filter) {
    case 'optimal':
      return rows.filter((r) => r.seoHealth.overall === 'green');
    case 'issues':
      return rows.filter((r) => r.seoHealth.overall === 'yellow' || r.seoHealth.overall === 'red');
    case 'yellow':
      return rows.filter((r) => r.seoHealth.overall === 'yellow');
    case 'red':
      return rows.filter((r) => r.seoHealth.overall === 'red');
    default:
      return rows;
  }
}

function filterByQuality(rows: ContentHubRow[], filter: QualityFilter): ContentHubRow[] {
  switch (filter) {
    case '90plus':
      return rows.filter((r) => r.contentQuality.score >= 90);
    case 'good':
      return rows.filter((r) => r.contentQuality.score >= 80 && r.contentQuality.score < 90);
    case 'below80':
      return rows.filter((r) => r.contentQuality.score < 80);
    default:
      return rows;
  }
}

function filterByStatus(rows: ContentHubRow[], filter: StatusFilter): ContentHubRow[] {
  switch (filter) {
    case 'active':
      return rows.filter((r) => r.archiveStatus !== 'archived');
    case 'archived':
      return rows.filter((r) => r.archiveStatus === 'archived');
    default:
      return rows;
  }
}

function filterByCps(rows: ContentHubRow[], filter: CpsFilter): ContentHubRow[] {
  switch (filter) {
    case 'easy':
      return rows.filter((r) => r.cpsScore !== null && r.cpsScore <= 20);
    case 'medium':
      return rows.filter((r) => r.cpsScore !== null && r.cpsScore > 20 && r.cpsScore <= 40);
    case 'hard':
      return rows.filter((r) => r.cpsScore !== null && r.cpsScore > 40);
    case 'missing':
      return rows.filter((r) => r.cpsScore === null);
    default:
      return rows;
  }
}

// ── URL builder (preserves all filter params) ────────────────────

function buildHubUrl(params: { seo?: string; quality?: string; status?: string; cps?: string }): string {
  const sp = new URLSearchParams();
  if (params.seo && params.seo !== 'all') sp.set('seo', params.seo);
  if (params.quality && params.quality !== 'all') sp.set('quality', params.quality);
  if (params.status && params.status !== 'all') sp.set('status', params.status);
  if (params.cps && params.cps !== 'all') sp.set('cps', params.cps);
  const qs = sp.toString();
  return `/dashboard/content/hub${qs ? `?${qs}` : ''}`;
}

// ── Clickable Stat Card ────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  href,
  active,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  href?: string;
  active?: boolean;
}) {
  const card = (
    <div
      className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${
        active
          ? 'border-violet-300 ring-2 ring-violet-100'
          : href
            ? 'border-slate-200 hover:border-violet-200 hover:shadow-md cursor-pointer'
            : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}

// ── Page ───────────────────────────────────────────────────────

interface ContentHubPageProps {
  searchParams: Promise<{ seo?: string; quality?: string; status?: string; cps?: string }>;
}

export default async function ContentHubPage({ searchParams }: ContentHubPageProps) {
  const params = await searchParams;
  const seoFilter = (['optimal', 'issues', 'yellow', 'red'].includes(params.seo || '')
    ? params.seo
    : 'all') as SeoFilter;
  const qualityFilter = (['90plus', 'good', 'below80'].includes(params.quality || '')
    ? params.quality
    : 'all') as QualityFilter;
  const statusFilter = (['active', 'archived'].includes(params.status || '')
    ? params.status
    : 'all') as StatusFilter;
  const cpsFilter = (['easy', 'medium', 'hard', 'missing'].includes(params.cps || '')
    ? params.cps
    : 'all') as CpsFilter;

  const hasAnyFilter = seoFilter !== 'all' || qualityFilter !== 'all' || statusFilter !== 'all' || cpsFilter !== 'all';

  // Parallel data loading
  const [{ rows: allRows, stats }, affiliateResult, freshnessStats] = await Promise.all([
    getContentHubData(false),
    getAffiliateLinksService(),
    getContentFreshnessStats(),
  ]);

  // Apply all filters (AND logic)
  let rows = filterBySeo(allRows, seoFilter);
  rows = filterByQuality(rows, qualityFilter);
  rows = filterByStatus(rows, statusFilter);
  rows = filterByCps(rows, cpsFilter);

  // Quality distribution (computed from ALL rows, not filtered)
  const q90Plus = allRows.filter((r) => r.contentQuality.score >= 90).length;
  const q80to89 = allRows.filter((r) => r.contentQuality.score >= 80 && r.contentQuality.score < 90).length;
  const qBelow80 = allRows.filter((r) => r.contentQuality.score < 80).length;

  // CPS distribution (computed from ALL rows, not filtered)
  const cpsEasy   = allRows.filter((r) => r.cpsScore !== null && r.cpsScore <= 20).length;
  const cpsMedium = allRows.filter((r) => r.cpsScore !== null && r.cpsScore > 20 && r.cpsScore <= 40).length;
  const cpsHard   = allRows.filter((r) => r.cpsScore !== null && r.cpsScore > 40).length;
  const cpsMissing = allRows.filter((r) => r.cpsScore === null).length;

  // Batch load CTA partner assignments for all visible rows
  const pageUrls = rows.map((r) => r.url);
  const partnerAssignments = await getCtaPartnersForPages(pageUrls);

  // Group available partners by market for the dropdown
  const affiliateLinks = (affiliateResult.data || []) as Array<{
    id: string;
    partner_name: string;
    slug: string;
    market: string;
    active: boolean;
  }>;

  // All active partners available cross-market (any partner can be promoted on any market page)
  const allActivePartners = affiliateLinks
    .filter((l) => l.active)
    .map((l) => ({ id: l.id, partner_name: l.partner_name, slug: l.slug }));

  // Dedupe by id (same partner may have multiple market entries)
  const seen = new Set<string>();
  const deduped = allActivePartners.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  // Every market gets the full partner list
  const allMarkets = [...new Set(allRows.map((r) => r.market)), 'GLOBAL'];
  const partnersByMarket: Record<string, { id: string; partner_name: string; slug: string }[]> = {};
  for (const m of allMarkets) {
    partnersByMarket[m] = deduped;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

  // Status distribution
  const activeCount = allRows.filter((r) => r.archiveStatus !== 'archived').length;
  const archivedCount = stats.archivedCount;

  // Build combined filter label for banner
  const filterParts: string[] = [];
  if (statusFilter !== 'all') filterParts.push(STATUS_FILTER_LABELS[statusFilter]);
  if (seoFilter !== 'all') filterParts.push(SEO_FILTER_LABELS[seoFilter]);
  if (qualityFilter !== 'all') filterParts.push(QUALITY_FILTER_LABELS[qualityFilter]);
  if (cpsFilter !== 'all') filterParts.push(CPS_FILTER_LABELS[cpsFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <FileSearch className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Content Hub</h1>
            <p className="text-sm text-slate-500">
              SEO health, content inventory &amp; indexation status across all markets
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BacklinkImportButton />
          <ContentHubRefreshButton />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
        <StatCard
          label="Total Pages"
          value={stats.totalPages}
          icon={FileText}
          iconBg="bg-violet-50 text-violet-500"
          href="/dashboard/content/hub"
          active={!hasAnyFilter}
        />
        <StatCard
          label="Avg CPS"
          value={stats.pagesWithCps > 0 ? `${stats.avgCps}/100` : '—'}
          icon={Zap}
          iconBg="bg-cyan-50 text-cyan-500"
        />
        <StatCard
          label="Backlinks"
          value={stats.totalBacklinks > 0 ? stats.totalBacklinks.toLocaleString('en-US') : '—'}
          icon={Link2}
          iconBg="bg-indigo-50 text-indigo-500"
        />
        <StatCard
          label="Avg Word Count"
          value={stats.avgWordCount.toLocaleString('en-US')}
          icon={TrendingUp}
          iconBg="bg-emerald-50 text-emerald-500"
        />
        <StatCard
          label="Avg Quality"
          value={`${stats.avgQuality}/100`}
          icon={BarChart3}
          iconBg="bg-blue-50 text-blue-500"
        />
        <StatCard
          label="SEO Optimal"
          value={stats.seoGreen}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-500"
          href={buildHubUrl({ seo: 'optimal', quality: qualityFilter, status: statusFilter, cps: cpsFilter })}
          active={seoFilter === 'optimal'}
        />
        <StatCard
          label="SEO Issues"
          value={stats.seoYellow + stats.seoRed}
          icon={AlertTriangle}
          iconBg="bg-amber-50 text-amber-500"
          href={buildHubUrl({ seo: 'issues', quality: qualityFilter, status: statusFilter, cps: cpsFilter })}
          active={seoFilter === 'issues'}
        />
        <StatCard
          label="Archived"
          value={archivedCount}
          icon={Archive}
          iconBg="bg-orange-50 text-orange-500"
          href={buildHubUrl({ seo: seoFilter, quality: qualityFilter, status: 'archived', cps: cpsFilter })}
          active={statusFilter === 'archived'}
        />
      </div>

      {/* SEO Health Breakdown */}
      <div className="flex items-center gap-6 px-4 py-3 bg-white border border-slate-200 rounded-xl">
        <span className="text-sm font-medium text-slate-600">SEO Health:</span>
        <Link
          href={buildHubUrl({ seo: 'optimal', quality: qualityFilter, status: statusFilter, cps: cpsFilter })}
          className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
            seoFilter === 'optimal' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-700 font-medium">{stats.seoGreen}</span>
          <span className="text-slate-400">optimal</span>
        </Link>
        <Link
          href={buildHubUrl({ seo: 'yellow', quality: qualityFilter, status: statusFilter, cps: cpsFilter })}
          className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
            seoFilter === 'yellow' ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-slate-700 font-medium">{stats.seoYellow}</span>
          <span className="text-slate-400">needs work</span>
        </Link>
        <Link
          href={buildHubUrl({ seo: 'red', quality: qualityFilter, status: statusFilter, cps: cpsFilter })}
          className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
            seoFilter === 'red' ? 'bg-red-50 ring-1 ring-red-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-700 font-medium">{stats.seoRed}</span>
          <span className="text-slate-400">critical</span>
        </Link>
        <span className="ml-auto text-xs text-slate-400">
          Market breakdown:{' '}
          {Object.entries(stats.marketBreakdown)
            .map(([m, c]) => `${m}: ${c}`)
            .join(' · ')}
        </span>
      </div>

      {/* Quality Breakdown */}
      <div className="flex items-center gap-6 px-4 py-3 bg-white border border-slate-200 rounded-xl">
        <span className="text-sm font-medium text-slate-600">Quality:</span>
        <Link
          href={buildHubUrl({ seo: seoFilter, quality: '90plus', status: statusFilter, cps: cpsFilter })}
          className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
            qualityFilter === '90plus' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-700 font-medium">{q90Plus}</span>
          <span className="text-slate-400">≥ 90</span>
        </Link>
        <Link
          href={buildHubUrl({ seo: seoFilter, quality: 'good', status: statusFilter, cps: cpsFilter })}
          className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
            qualityFilter === 'good' ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="text-slate-700 font-medium">{q80to89}</span>
          <span className="text-slate-400">80–89</span>
        </Link>
        <Link
          href={buildHubUrl({ seo: seoFilter, quality: 'below80', status: statusFilter, cps: cpsFilter })}
          className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
            qualityFilter === 'below80' ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-slate-700 font-medium">{qBelow80}</span>
          <span className="text-slate-400">&lt; 80</span>
        </Link>
        <span className="ml-auto text-xs text-slate-400">
          Avg: {stats.avgQuality}/100 · Target: ≥ 90
        </span>
      </div>

      {/* CPS Breakdown */}
      <div className="flex items-center gap-6 px-4 py-3 bg-white border border-slate-200 rounded-xl">
        <span className="text-sm font-medium text-slate-600 whitespace-nowrap">CPS Score:</span>
        <Link
          href={buildHubUrl({ seo: seoFilter, quality: qualityFilter, status: statusFilter, cps: 'easy' })}
          className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
            cpsFilter === 'easy' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
          }`}
          title="CPS 0–20: Low competition — easiest keywords to rank for"
        >
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-slate-700 font-medium tabular-nums">{cpsEasy}</span>
          <span className="text-slate-400">easy (≤ 20)</span>
        </Link>
        <Link
          href={buildHubUrl({ seo: seoFilter, quality: qualityFilter, status: statusFilter, cps: 'medium' })}
          className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
            cpsFilter === 'medium' ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'
          }`}
          title="CPS 21–40: Medium competition"
        >
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-slate-700 font-medium tabular-nums">{cpsMedium}</span>
          <span className="text-slate-400">medium (21–40)</span>
        </Link>
        <Link
          href={buildHubUrl({ seo: seoFilter, quality: qualityFilter, status: statusFilter, cps: 'hard' })}
          className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
            cpsFilter === 'hard' ? 'bg-red-50 ring-1 ring-red-200' : 'hover:bg-slate-50'
          }`}
          title="CPS > 40: High competition — authority sites dominate SERPs"
        >
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-slate-700 font-medium tabular-nums">{cpsHard}</span>
          <span className="text-slate-400">hard (&gt; 40)</span>
        </Link>
        {cpsMissing > 0 && (
          <Link
            href={buildHubUrl({ seo: seoFilter, quality: qualityFilter, status: statusFilter, cps: 'missing' })}
            className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
              cpsFilter === 'missing' ? 'bg-slate-100 ring-1 ring-slate-300' : 'hover:bg-slate-50'
            }`}
            title="No CPS data available (core pages, tools)"
          >
            <span className="w-3 h-3 rounded-full bg-slate-300" />
            <span className="text-slate-700 font-medium tabular-nums">{cpsMissing}</span>
            <span className="text-slate-400">no data</span>
          </Link>
        )}
        <span className="ml-auto text-xs text-slate-400">
          Avg CPS: {stats.pagesWithCps > 0 ? `${stats.avgCps}/100` : '—'} · Low score = low competition
        </span>
      </div>

      {/* Status Breakdown (only visible when archived pages exist) */}
      {archivedCount > 0 && (
        <div className="flex items-center gap-6 px-4 py-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-sm font-medium text-slate-600">Status:</span>
          <Link
            href={buildHubUrl({ seo: seoFilter, quality: qualityFilter, status: 'active', cps: cpsFilter })}
            className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
              statusFilter === 'active' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-700 font-medium">{activeCount}</span>
            <span className="text-slate-400">active</span>
          </Link>
          <Link
            href={buildHubUrl({ seo: seoFilter, quality: qualityFilter, status: 'archived', cps: cpsFilter })}
            className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
              statusFilter === 'archived' ? 'bg-orange-50 ring-1 ring-orange-200' : 'hover:bg-slate-50'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-orange-400" />
            <span className="text-slate-700 font-medium">{archivedCount}</span>
            <span className="text-slate-400">archived</span>
          </Link>
        </div>
      )}

      {/* Active Filter Banner */}
      {hasAnyFilter && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-lg">
          <span className="text-sm text-violet-700 font-medium">
            Filtered: {filterParts.join(' + ')}
          </span>
          <span className="text-sm text-violet-500">
            — showing {rows.length} of {allRows.length} pages
          </span>
          <Link
            href="/dashboard/content/hub"
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-violet-200 text-violet-600 hover:bg-violet-100 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear Filter
          </Link>
        </div>
      )}

      {/* Content Freshness */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-slate-900">Content Freshness</h3>
          <span className="text-xs text-slate-400 ml-auto">
            Updated daily by freshness-check cron
          </span>
        </div>
        <div className="p-5">
          <WidgetErrorBoundary label="Content Freshness" minHeight="h-48">
            <ContentFreshnessWidget stats={freshnessStats} />
          </WidgetErrorBoundary>
        </div>
      </div>

      {/* Table (batch bar + table rendered by client component to avoid <div> inside <table> hydration error) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <ContentHubTableBody
          rows={rows}
          siteUrl={siteUrl}
          partnerAssignments={partnerAssignments}
          partnersByMarket={partnersByMarket}
        />

        {/* Table Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {rows.length} pages{hasAnyFilter ? ` (of ${allRows.length} total)` : ''} ·{' '}
            {stats.totalWords.toLocaleString('en-US')} total words
          </span>
          <span className="text-xs text-slate-400">
            Auto-refresh every 10 min · Use &quot;Refresh Content&quot; button for immediate update
          </span>
        </div>
      </div>
    </div>
  );
}

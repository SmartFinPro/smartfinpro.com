// app/(dashboard)/dashboard/content/hub/page.tsx — SEO Health & Content Hub
import Link from 'next/link';
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
} from 'lucide-react';
import { getContentHubData } from '@/lib/actions/content-hub';
import { getCtaPartnersForPages } from '@/lib/actions/page-cta-partners';
import { getAffiliateLinksService } from '@/lib/actions/affiliate-links';
import { ContentHubTableBody } from '@/components/dashboard/content-hub-table-body';
import { ContentHubRefreshButton } from '@/components/dashboard/content-hub-refresh-button';
import { BacklinkImportButton } from '@/components/dashboard/backlink-import-button';
import type { ContentHubRow, HealthStatus } from '@/lib/actions/content-hub';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── Filter types ───────────────────────────────────────────────

type SeoFilter = 'all' | 'optimal' | 'issues' | 'yellow' | 'red';

const FILTER_LABELS: Record<SeoFilter, string> = {
  all: 'All Pages',
  optimal: 'SEO Optimal',
  issues: 'SEO Issues (Yellow + Red)',
  yellow: 'SEO Needs Work',
  red: 'SEO Critical',
};

function filterRows(rows: ContentHubRow[], filter: SeoFilter): ContentHubRow[] {
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
  searchParams: Promise<{ seo?: string }>;
}

export default async function ContentHubPage({ searchParams }: ContentHubPageProps) {
  const params = await searchParams;
  const seoFilter = (['optimal', 'issues', 'yellow', 'red'].includes(params.seo || '')
    ? params.seo
    : 'all') as SeoFilter;

  // Parallel data loading
  const [{ rows: allRows, stats }, affiliateResult] = await Promise.all([
    getContentHubData(false),
    getAffiliateLinksService(),
  ]);

  const rows = filterRows(allRows, seoFilter);

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <StatCard
          label="Total Pages"
          value={stats.totalPages}
          icon={FileText}
          iconBg="bg-violet-50 text-violet-500"
          href="/dashboard/content/hub"
          active={seoFilter === 'all'}
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
          href="/dashboard/content/hub?seo=optimal"
          active={seoFilter === 'optimal'}
        />
        <StatCard
          label="SEO Issues"
          value={stats.seoYellow + stats.seoRed}
          icon={AlertTriangle}
          iconBg="bg-amber-50 text-amber-500"
          href="/dashboard/content/hub?seo=issues"
          active={seoFilter === 'issues'}
        />
      </div>

      {/* SEO Health Breakdown */}
      <div className="flex items-center gap-6 px-4 py-3 bg-white border border-slate-200 rounded-xl">
        <span className="text-sm font-medium text-slate-600">SEO Health:</span>
        <Link
          href="/dashboard/content/hub?seo=optimal"
          className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
            seoFilter === 'optimal' ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-700 font-medium">{stats.seoGreen}</span>
          <span className="text-slate-400">optimal</span>
        </Link>
        <Link
          href="/dashboard/content/hub?seo=yellow"
          className={`inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
            seoFilter === 'yellow' ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-slate-700 font-medium">{stats.seoYellow}</span>
          <span className="text-slate-400">needs work</span>
        </Link>
        <Link
          href="/dashboard/content/hub?seo=red"
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

      {/* Active Filter Banner */}
      {seoFilter !== 'all' && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-lg">
          <span className="text-sm text-violet-700 font-medium">
            Filtered: {FILTER_LABELS[seoFilter]}
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Market
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  SEO Title
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  CTA Partner
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Words
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Quality
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  CPS
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  BL
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  SEO
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Index
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <ContentHubTableBody
              rows={rows}
              siteUrl={siteUrl}
              partnerAssignments={partnerAssignments}
              partnersByMarket={partnersByMarket}
            />
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {rows.length} pages{seoFilter !== 'all' ? ` (of ${allRows.length} total)` : ''} ·{' '}
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

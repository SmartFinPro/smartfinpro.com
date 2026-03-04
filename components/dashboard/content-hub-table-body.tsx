// components/dashboard/content-hub-table-body.tsx — Client table body for Content Hub
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ExternalLink, RefreshCw, Clock, Link2 } from 'lucide-react';
import { CtaPartnerSelect } from './cta-partner-select';
import type { ContentHubRow, HealthStatus, ContentQuality } from '@/lib/actions/content-hub';
import type { PartnerOption } from './cta-partner-select';
import type { PartnerAssignmentConfig } from '@/lib/types/page-cta';

const BacklinkDetailDialog = dynamic(
  () => import('./backlink-detail-dialog'),
  { ssr: false }
);

// ── Helper Components (duplicated from page to keep in client boundary) ──

function HealthDot({ status }: { status: HealthStatus }) {
  const colors: Record<HealthStatus, string> = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-400',
    red: 'bg-red-500',
  };
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${colors[status]}`} />;
}

function MarketBadge({ market }: { market: string }) {
  const styles: Record<string, string> = {
    US: 'bg-blue-50 text-blue-700 border-blue-200',
    UK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CA: 'bg-red-50 text-red-700 border-red-200',
    AU: 'bg-amber-50 text-amber-700 border-amber-200',
    GLOBAL: 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${styles[market] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {market}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-600">
      {category}
    </span>
  );
}

function SeoDetail({ seoHealth }: { seoHealth: ContentHubRow['seoHealth'] }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <HealthDot status={seoHealth.titleStatus} />
        <span className="text-xs text-slate-500">
          Title: {seoHealth.titleLength > 0 ? `${seoHealth.titleLength} chars` : 'missing'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <HealthDot status={seoHealth.descStatus} />
        <span className="text-xs text-slate-500">
          Desc: {seoHealth.descLength > 0 ? `${seoHealth.descLength} chars` : 'missing'}
        </span>
      </div>
    </div>
  );
}

// ── Quality Score Badge ──────────────────────────────────────────

function QualityBadge({ quality }: { quality: ContentQuality }) {
  if (quality.score === 0 && quality.breakdown === '—') {
    return <span className="text-xs text-slate-300">—</span>;
  }

  const color =
    quality.score >= 80
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : quality.score >= 50
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={`inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full border ${color}`}
        title={`Words: ${quality.wordScore} | Structure: ${quality.structureScore} | Links: ${quality.linkScore} | Components: ${quality.componentScore}`}
      >
        {quality.score}
      </span>
      <span className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap">
        {quality.breakdown}
      </span>
    </div>
  );
}

// ── CPS Score Badge ──────────────────────────────────────────────

function CpsBadge({ cps }: { cps: number | null }) {
  if (cps === null) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  const color =
    cps >= 70
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : cps >= 40
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-700 border-red-200';

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-md border tabular-nums ${color}`}
      title={`Conversion Potential Score — ${cps >= 70 ? 'High opportunity' : cps >= 40 ? 'Medium competition' : 'High competition'}`}
    >
      {cps.toFixed(1)}
    </span>
  );
}

// ── Backlink Badge ──────────────────────────────────────────────

function BacklinkBadge({
  count,
  new30d,
  onClick,
}: {
  count: number | null;
  new30d: number | null;
  onClick: () => void;
}) {
  if (count === null) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  const color =
    count >= 20
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
      : count >= 5
        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-md border tabular-nums cursor-pointer transition-colors ${color}`}
      title={`${count} active backlinks — click for details`}
    >
      <Link2 className="h-3 w-3" />
      {count}
      {new30d && new30d > 0 ? (
        <span className="text-[10px] font-normal text-emerald-600">+{new30d}</span>
      ) : null}
    </button>
  );
}

// ── Main Table Body ──────────────────────────────────────────────

interface ContentHubTableBodyProps {
  rows: ContentHubRow[];
  siteUrl: string;
  partnerAssignments: Record<string, PartnerAssignmentConfig[]>;
  partnersByMarket: Record<string, PartnerOption[]>;
}

export function ContentHubTableBody({
  rows,
  siteUrl,
  partnerAssignments,
  partnersByMarket,
}: ContentHubTableBodyProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  return (
    <>
    <tbody>
      {rows.map((row) => {
        const assignedPartners = partnerAssignments[row.url] || [];
        const available = partnersByMarket[row.market] || [];

        return (
          <tr
            key={row.url}
            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
          >
            {/* URL */}
            <td className="px-4 py-3 max-w-[280px]">
              <a
                href={`${siteUrl}${row.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-violet-600 hover:text-violet-800 font-medium truncate block"
                title={row.url}
              >
                {row.url}
                <ExternalLink className="inline-block ml-1 h-3 w-3 opacity-50" />
              </a>
              {row.type === 'mdx' && (
                <span className="text-[11px] text-slate-400 truncate block">
                  {row.filePath}
                </span>
              )}
            </td>

            {/* Market */}
            <td className="px-3 py-3">
              <MarketBadge market={row.market} />
            </td>

            {/* Category */}
            <td className="px-3 py-3">
              <CategoryBadge category={row.category} />
            </td>

            {/* SEO Title */}
            <td className="px-3 py-3 max-w-[220px]">
              <span className="text-xs text-slate-700 line-clamp-2" title={row.seoTitle}>
                {row.seoTitle || <span className="text-red-400 italic">missing</span>}
              </span>
            </td>

            {/* CTA Partner (replaces Focus KW) */}
            <td className="px-3 py-3 min-w-[160px]">
              <CtaPartnerSelect
                pageUrl={row.url}
                assignedPartners={assignedPartners}
                availablePartners={available}
              />
            </td>

            {/* Word Count */}
            <td className="px-3 py-3 text-right">
              <span className="text-xs text-slate-600 tabular-nums font-mono">
                {row.wordCount > 0 ? row.wordCount.toLocaleString('en-US') : '—'}
              </span>
            </td>

            {/* Size */}
            <td className="px-3 py-3 text-right">
              <span className="text-xs text-slate-500 tabular-nums font-mono">
                {row.sizeKB > 0 ? `${row.sizeKB} KB` : '—'}
              </span>
            </td>

            {/* Content Quality */}
            <td className="px-3 py-3 text-center">
              <QualityBadge quality={row.contentQuality} />
            </td>

            {/* CPS Score */}
            <td className="px-3 py-3 text-center">
              <CpsBadge cps={row.cpsScore} />
            </td>

            {/* BL (Backlinks) */}
            <td className="px-3 py-3 text-center">
              <BacklinkBadge
                count={row.backlinkCount}
                new30d={row.backlinkNew30d}
                onClick={() => setSelectedUrl(row.url)}
              />
            </td>

            {/* SEO Status */}
            <td className="px-3 py-3">
              <SeoDetail seoHealth={row.seoHealth} />
            </td>

            {/* Index Status */}
            <td className="px-3 py-3">
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {row.indexStatus}
              </span>
            </td>

            {/* Action */}
            <td className="px-3 py-3">
              <button
                disabled
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-400 cursor-not-allowed"
                title="Google Indexing API — coming soon"
              >
                <RefreshCw className="h-3 w-3" />
                Re-Index
              </button>
            </td>
          </tr>
        );
      })}
      {rows.length === 0 && (
        <tr>
          <td colSpan={13} className="px-4 py-12 text-center text-sm text-slate-400">
            No pages match this filter.
          </td>
        </tr>
      )}
    </tbody>
    {selectedUrl && (
      <BacklinkDetailDialog
        url={selectedUrl}
        open={!!selectedUrl}
        onOpenChange={(open: boolean) => { if (!open) setSelectedUrl(null); }}
      />
    )}
    </>
  );
}

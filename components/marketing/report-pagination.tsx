// components/marketing/report-pagination.tsx
// Numbered pagination for report listing pages (market.us style, navy blue)

import Link from 'next/link';

interface ReportPaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}

export function ReportPagination({ currentPage, totalPages, basePath }: ReportPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
  const pageHref = (p: number) => (p === 1 ? `${basePath}#reports` : `${basePath}?page=${p}#reports`);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 mt-10"
    >
      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            style={{
              width: '44px',
              height: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--sfp-slate)',
            }}
          >
            …
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            style={{
              width: '44px',
              height: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: '#fff',
              background: 'var(--sfp-navy)',
              borderRadius: '8px',
            }}
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p)}
            className="no-underline pagination-btn"
            style={{
              width: '44px',
              height: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--sfp-navy)',
              background: 'var(--sfp-sky)',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            {p}
          </Link>
        )
      )}

      {/* Next » */}
      {currentPage < totalPages && (
        <Link
          href={pageHref(currentPage + 1)}
          className="no-underline pagination-btn"
          style={{
            height: '44px',
            paddingLeft: '16px',
            paddingRight: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            color: '#fff',
            background: 'var(--sfp-navy)',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          Next »
        </Link>
      )}
    </nav>
  );
}

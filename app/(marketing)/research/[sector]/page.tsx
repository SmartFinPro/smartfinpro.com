import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { getAllResearchSectors, getResearchBySector } from '@/lib/research';

// Only sectors produced by generateStaticParams are valid; everything else 404s
// (prevents crawlable empty pages at /research/<anything>).
export const dynamicParams = false;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

interface ResearchSectorPageProps {
  params: Promise<{
    sector: string;
  }>;
}

function sectorLabel(sector: string): string {
  return sector
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateStaticParams() {
  const sectors = await getAllResearchSectors();
  return sectors.map((sector) => ({ sector }));
}

export async function generateMetadata({
  params,
}: ResearchSectorPageProps): Promise<Metadata> {
  const { sector } = await params;
  const label = sectorLabel(sector);
  const canonicalUrl = `${BASE_URL}/research/${sector}`;

  return {
    title: `${label} Research | SmartFinPro`,
    description: `SmartFinPro Research coverage for ${label.toLowerCase()}, including valuation notes, catalysts, and broker routes.`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ResearchSectorPage({
  params,
}: ResearchSectorPageProps) {
  const { sector } = await params;
  const items = await getResearchBySector(sector);
  if (items.length === 0) {
    notFound();
  }
  const label = sectorLabel(sector);

  return (
    <main className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            SmartFinPro Research
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            {label}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Original market notes designed to support the broader SmartFinPro gold
            cluster. These pages are meant to attract search demand, earn citations,
            and route qualified readers into the broker and newsletter funnel without
            breaking the site&apos;s existing authority structure.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/research/${item.meta.sector}/${item.slug}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.meta.ticker} - {item.meta.ratingLabel}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {item.meta.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.meta.description}
                  </p>
                </div>
                <FileText className="h-5 w-5 text-slate-400" />
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                <span>Updated {item.meta.modifiedDate}</span>
                <span>{item.readingTime.text}</span>
                <span>{item.meta.exchanges.join(' / ')}</span>
              </div>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                Read note
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

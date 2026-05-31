import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenText } from 'lucide-react';
import { getAllResearch, getAllResearchSectors } from '@/lib/research';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

function sectorLabel(sector: string): string {
  return sector
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const metadata: Metadata = {
  title: 'SmartFinPro Research | Market Notes and Equity Coverage',
  description:
    'Original SmartFinPro Research notes covering gold miners and adjacent market themes, built for search visibility, citations, and broker conversions.',
  alternates: {
    canonical: `${BASE_URL}/research`,
  },
};

export default async function ResearchHubPage() {
  const [items, sectors] = await Promise.all([
    getAllResearch(),
    getAllResearchSectors(),
  ]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              SmartFinPro Research
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              Market notes built for authority and conversion
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              This hub collects SmartFinPro&apos;s original research notes. The rollout
              starts with gold-miner coverage and is designed to compound topical
              authority across existing gold, trading, and Canada-focused assets.
            </p>

            <div className="mt-10 grid gap-5">
              {items.map((item) => (
                <Link
                  key={`${item.meta.sector}/${item.slug}`}
                  href={`/research/${item.meta.sector}/${item.slug}`}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {sectorLabel(item.meta.sector)} - {item.meta.ticker}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                        {item.meta.title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.meta.description}
                      </p>
                    </div>
                    <BookOpenText className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                    <span>Updated {item.meta.modifiedDate}</span>
                    <span>{item.readingTime.text}</span>
                    <span>{item.meta.ratingLabel} consensus</span>
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                    Open research note
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Research sectors
              </p>
              <div className="mt-4 space-y-3">
                {sectors.map((sector) => (
                  <Link
                    key={sector}
                    href={`/research/${sector}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                  >
                    <span>{sectorLabel(sector)}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Editorial anchors
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <Link href="/methodology" className="block text-slate-700 underline underline-offset-2">
                  Methodology
                </Link>
                <Link href="/editorial-policy" className="block text-slate-700 underline underline-offset-2">
                  Editorial policy
                </Link>
                <Link href="/integrity" className="block text-slate-700 underline underline-offset-2">
                  Integrity
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

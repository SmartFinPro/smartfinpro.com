// app/(dashboard)/dashboard/ranking/pages/page.tsx
// Page Rankings — live Google position for every indexed page,
// pulled directly from the GSC Search Analytics API on each load/refresh.

import Link from 'next/link';
import { FileSearch, Search } from 'lucide-react';
import { getPageRankings } from '@/lib/actions/page-rankings';
import { PageRankings } from '@/components/dashboard/page-rankings';
import { PageHeader } from '@/components/dashboard/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PageRankingsPage() {
  const data = await getPageRankings('28d');

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileSearch}
        title="Page Rankings"
        description="Google-Position & Keywords jeder indexierten Seite — live aus der Search Console"
        actions={
          <Link
            href="/dashboard/ranking"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:text-violet-600 hover:border-violet-200 transition-colors"
          >
            <Search className="h-4 w-4" />
            Keyword-Tracker
          </Link>
        }
      />

      <PageRankings initialData={data} />
    </div>
  );
}

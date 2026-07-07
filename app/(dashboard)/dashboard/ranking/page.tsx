import Link from 'next/link';
import { FileSearch, Search } from 'lucide-react';
import { getRankingData } from '@/lib/actions/ranking';
import { RankingDashboard } from '@/components/dashboard/ranking-dashboard';
import { PageHeader } from '@/components/dashboard/ui';
import { IndexingCard } from './indexing-card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RankingPage() {
  const data = await getRankingData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={Search}
        title="Ranking Tracker"
        description="Google-Positionen & SERP-Monitoring für alle 4 Märkte"
        actions={
          <Link
            href="/dashboard/ranking/pages"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:text-violet-600 hover:border-violet-200 transition-colors"
          >
            <FileSearch className="h-4 w-4" />
            Page Rankings
          </Link>
        }
      />

      {/* Google Indexing API — fast URL submission */}
      <IndexingCard />

      {/* Ranking Dashboard Component */}
      <RankingDashboard
        initialKeywords={data.keywords}
        initialStats={data.stats}
        initialTrend={data.trend}
        initialWinners={data.winners}
        initialLosers={data.losers}
        gscConfigured={data.gscConfigured}
        gscHasData={data.gscHasData}
        serperConfigured={data.serperConfigured}
        initialSource={data.source}
        initialLastSyncAt={data.lastSyncAt}
      />
    </div>
  );
}

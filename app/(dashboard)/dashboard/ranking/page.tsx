import { Search } from 'lucide-react';
import { getRankingData } from '@/lib/actions/ranking';
import { RankingDashboard } from '@/components/dashboard/ranking-dashboard';
import { IndexingCard } from './indexing-card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RankingPage() {
  const data = await getRankingData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Search className="h-6 w-6 text-violet-500" />
          Ranking Tracker
        </h1>
        <p className="text-slate-500 mt-1">
          Google-Positionen &amp; SERP-Monitoring f&uuml;r alle 4 M&auml;rkte
        </p>
      </div>

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
        serperConfigured={data.serperConfigured}
      />
    </div>
  );
}

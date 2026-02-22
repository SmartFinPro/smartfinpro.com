import { Radar } from 'lucide-react';
import { getCompetitorData } from '@/lib/actions/competitors';
import { CompetitorRadar } from '@/components/dashboard/competitor-radar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CompetitorRadarPage() {
  const data = await getCompetitorData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Radar className="h-6 w-6 text-violet-500" />
          Competitor Radar
        </h1>
        <p className="text-slate-500 mt-1">
          SERP Intelligence &amp; Competitor Tracking &mdash; CPS-basierte Keyword-Analyse
        </p>
      </div>

      <CompetitorRadar initialData={data} />
    </div>
  );
}

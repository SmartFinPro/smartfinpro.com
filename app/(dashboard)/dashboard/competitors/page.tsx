import { Radar } from 'lucide-react';
import { getCompetitorData } from '@/lib/actions/competitors';
import { CompetitorRadar } from '@/components/dashboard/competitor-radar';
import { PageHeader } from '@/components/dashboard/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CompetitorRadarPage() {
  const data = await getCompetitorData();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Radar}
        title="Competitor Radar"
        description="SERP Intelligence & Competitor Tracking — CPS-basierte Keyword-Analyse"
      />

      <CompetitorRadar initialData={data} />
    </div>
  );
}

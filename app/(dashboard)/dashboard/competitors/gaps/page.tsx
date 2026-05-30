import { Crosshair } from 'lucide-react';
import { getGapDashboardData } from '@/lib/actions/gap-analysis';
import { KeywordGapAnalysis } from '@/components/dashboard/keyword-gap-analysis';
import { PageHeader } from '@/components/dashboard/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KeywordGapPage() {
  const data = await getGapDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Crosshair}
        title="Keyword Gap Analysis"
        description="Competitor-vs-SmartFinPro Keyword-Vergleich — Finde fehlende Content-Opportunities"
      />

      <KeywordGapAnalysis initialData={data} />
    </div>
  );
}

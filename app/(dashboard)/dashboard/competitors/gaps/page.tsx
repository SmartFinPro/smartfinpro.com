import { Crosshair } from 'lucide-react';
import { getGapDashboardData } from '@/lib/actions/gap-analysis';
import { KeywordGapAnalysis } from '@/components/dashboard/keyword-gap-analysis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KeywordGapPage() {
  const data = await getGapDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Crosshair className="h-6 w-6 text-violet-500" />
          Keyword Gap Analysis
        </h1>
        <p className="text-slate-500 mt-1">
          Competitor-vs-SmartFinPro Keyword-Vergleich &mdash; Finde fehlende Content-Opportunities
        </p>
      </div>

      <KeywordGapAnalysis initialData={data} />
    </div>
  );
}

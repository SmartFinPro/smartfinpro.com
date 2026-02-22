import { getPendingPlans } from '@/lib/actions/daily-strategy';
import { PlanningApproval } from '@/components/dashboard/planning-approval';
import { AffiliateScanButton } from '@/components/dashboard/affiliate-scan-button';
import { Sparkles, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlanningPage() {
  const plans = await getPendingPlans();

  const cards = plans.map((p) => ({
    id: p.id,
    keyword: p.keyword,
    market: p.market,
    category: p.category,
    predictedCpa: p.predictedCpa,
    reason: p.reason,
    opportunityScore: p.opportunityScore,
    sourceSlug: p.sourceSlug,
    digestDate: p.digestDate,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Executive Approval</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">AI-curated content opportunities</p>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <AffiliateScanButton />

            {plans.length > 0 && (
              <div className="px-3 py-1.5 rounded-full flex items-center gap-2 bg-emerald-50 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {plans.length} {plans.length === 1 ? 'Chance' : 'Chancen'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Instruction hint */}
        <div className="mt-4 p-3 rounded-xl flex items-center gap-3 bg-violet-50 border border-violet-200">
          <span className="text-base">&#x1F449;</span>
          <p className="text-xs text-slate-600">
            <span className="text-emerald-600 font-semibold">Swipe rechts</span> oder klicke{' '}
            <span className="text-emerald-600">Approve</span> um die Auto-Genesis Pipeline zu starten.{' '}
            <span className="text-red-500 font-semibold">Swipe links</span> oder klicke{' '}
            <span className="text-red-500">Reject</span> um das Keyword zu archivieren.
          </p>
        </div>
      </div>

      {/* Planning Approval Cards */}
      <PlanningApproval initialPlans={cards} />
    </div>
  );
}

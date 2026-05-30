import { getPendingOptimizations, getOptimizationHistory } from '@/lib/actions/optimization-engine';
import { OptimizationChat } from '@/components/dashboard/optimization-chat';
import { AbLiveView } from '@/components/dashboard/ab-live-view';
import { Zap, Brain } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/ui';

export const dynamic = 'force-dynamic';

export default async function OptimizationCenterPage() {
  const [pending, history] = await Promise.all([
    getPendingOptimizations(),
    getOptimizationHistory(30),
  ]);

  // Filter history to only show applied/dismissed (not pending duplicates)
  const historyOnly = history.filter(
    (h) => h.status === 'applied' || h.status === 'dismissed' || h.status === 'failed'
  );

  return (
    <div className="space-y-6 flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <PageHeader
        icon={Brain}
        title="AI-Optimization Center"
        description="Periodische Performance-Analyse mit One-Click Content-Optimierungen"
        actions={
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-600 border border-cyan-200">
            <Zap className="h-3 w-3" />
            AI-Powered
          </span>
        }
      />

      {/* A/B Test Live-View */}
      <AbLiveView />

      {/* Chat Interface (fills remaining space) */}
      <div className="flex-1 min-h-0">
        <OptimizationChat
          initialTasks={pending}
          historyTasks={historyOnly}
        />
      </div>
    </div>
  );
}

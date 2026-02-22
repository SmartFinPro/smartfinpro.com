import { Rocket } from 'lucide-react';
import { getRecentRuns } from '@/lib/actions/genesis';
import { GenesisHub } from '@/components/dashboard/genesis-hub';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GenesisPage() {
  const recentRuns = await getRecentRuns(10);

  // Simplify run data for client component
  const runs = recentRuns.map((r) => ({
    id: r.id,
    keyword: r.keyword,
    market: r.market,
    category: r.category,
    status: r.status,
    slug: r.slug,
    wordCount: r.wordCount,
    imageCount: r.images?.length || 0,
    indexedAt: r.indexedAt,
    createdAt: r.createdAt,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Auto-Genesis Hub</h1>
            <p className="text-sm text-slate-500">
              Research → Generate → Media → Launch — autonomous SEO asset pipeline
            </p>
          </div>
        </div>
      </div>

      {/* Main Genesis Hub */}
      <GenesisHub recentRuns={runs} />
    </div>
  );
}

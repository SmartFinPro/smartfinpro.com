import { Rocket } from 'lucide-react';
import { getRecentRuns } from '@/lib/actions/genesis';
import { GenesisHub } from '@/components/dashboard/genesis-hub';
import { AutoGenesisScanner } from '@/components/dashboard/auto-genesis-scanner';
import { scanSeoTexteQuick } from '@/lib/auto-genesis/scanner';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAutoGenesisData() {
  // Quick filesystem scan (no DB queries, no 'use server')
  const scan = scanSeoTexteQuick();

  // Fetch recent auto-genesis logs (may fail if table doesn't exist yet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let logs: any[] = [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('auto_genesis_log')
      .select('id, brief_path, market, category, keyword, slug, status, word_count, indexed, error_message, created_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(20);
    logs = data || [];
  } catch {
    // Table may not exist yet
  }

  return {
    totalSeoTexts: scan.totalFolders,
    existingMdxCount: scan.existingMdx,
    pendingCount: scan.pending,
    logs,
  };
}

export default async function GenesisPage() {
  const [recentRuns, autoData] = await Promise.all([
    getRecentRuns(10),
    getAutoGenesisData().catch(() => ({
      totalSeoTexts: 0,
      existingMdxCount: 0,
      pendingCount: 0,
      logs: [],
    })),
  ]);

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

      {/* Auto-Genesis Scanner */}
      <AutoGenesisScanner
        initialLogs={autoData.logs}
        pendingCount={autoData.pendingCount}
        totalSeoTexts={autoData.totalSeoTexts}
        existingMdxCount={autoData.existingMdxCount}
      />

      {/* Main Genesis Hub */}
      <GenesisHub recentRuns={runs} />
    </div>
  );
}

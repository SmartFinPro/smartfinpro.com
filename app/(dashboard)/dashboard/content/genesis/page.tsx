import { Rocket, AlertTriangle } from 'lucide-react';
import { getRecentRuns, getPlaceholderAffiliateLinks } from '@/lib/actions/genesis';
import { GenesisHub } from '@/components/dashboard/genesis-hub';
import { AutoGenesisScanner } from '@/components/dashboard/auto-genesis-scanner';
import { scanSeoTexteQuick } from '@/lib/auto-genesis/scanner';
import { createServiceClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/dashboard/ui';

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
  const [recentRuns, autoData, placeholderLinks] = await Promise.all([
    getRecentRuns(10),
    getAutoGenesisData().catch(() => ({
      totalSeoTexts: 0,
      existingMdxCount: 0,
      pendingCount: 0,
      logs: [],
    })),
    getPlaceholderAffiliateLinks().catch(() => []),
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
      <PageHeader
        icon={Rocket}
        title="Auto-Genesis Hub"
        description="Research → Generate → Media → Launch — autonomous SEO asset pipeline"
      />

      {/* Placeholder Affiliate-URL Warnung — Slugs ohne echte Ziel-URL verdienen keine Provision */}
      {placeholderLinks.length > 0 && (
        <div
          className="rounded-2xl border-2 p-5"
          style={{
            borderColor: 'var(--sfp-red)',
            backgroundColor: 'color-mix(in srgb, var(--sfp-red) 6%, white)',
          }}
        >
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'color-mix(in srgb, var(--sfp-red) 14%, white)' }}
            >
              <AlertTriangle className="h-5 w-5" style={{ color: 'var(--sfp-red)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--sfp-ink)' }}>
                ⚠ Affiliate-URLs nachtragen ({placeholderLinks.length})
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                Diese Slugs zeigen noch auf eine Platzhalter-URL und verdienen{' '}
                <strong>keine Provision</strong>. Echte Partner-Ziel-URL setzen, bevor der Content
                Traffic bekommt.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'color-mix(in srgb, var(--sfp-red) 20%, white)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'color-mix(in srgb, var(--sfp-red) 9%, white)' }}>
                  <th className="text-left font-semibold px-3 py-2" style={{ color: 'var(--sfp-ink)' }}>Slug</th>
                  <th className="text-left font-semibold px-3 py-2" style={{ color: 'var(--sfp-ink)' }}>Partner</th>
                  <th className="text-left font-semibold px-3 py-2" style={{ color: 'var(--sfp-ink)' }}>Markt</th>
                  <th className="text-left font-semibold px-3 py-2" style={{ color: 'var(--sfp-ink)' }}>Kategorie</th>
                </tr>
              </thead>
              <tbody>
                {placeholderLinks.map((link) => (
                  <tr key={link.slug} className="border-t" style={{ borderColor: 'color-mix(in srgb, var(--sfp-red) 12%, white)' }}>
                    <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--sfp-ink)' }}>
                      /go/{link.slug}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--sfp-slate)' }}>
                      {link.partnerName || '—'}
                    </td>
                    <td className="px-3 py-2 uppercase" style={{ color: 'var(--sfp-slate)' }}>
                      {link.market || '—'}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--sfp-slate)' }}>
                      {link.category || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

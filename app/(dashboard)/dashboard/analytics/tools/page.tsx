// app/(dashboard)/dashboard/analytics/tools/page.tsx
// Tool Analytics (tool_v1) — QDR funnel, TTFV, mobile drop-off, volume guard,
// health grid and dated annotations for all Financial Decision Lab tools.
// Pattern: app/(dashboard)/dashboard/analytics/cockpits/page.tsx.
//
// Scope note: this is strictly the ANALYTICS dashboard tab for tool_v1
// events. /dashboard/tools/money-leak (the existing Ops page) is a
// different, untouched surface.

import { Wrench } from 'lucide-react';
import { getToolAnalytics } from '@/lib/actions/tool-analytics';
import { ToolAnalytics } from '@/components/dashboard/tool-analytics';
import { ChunkErrorBoundary } from '@/components/dashboard/chunk-error-boundary';
import { PageHeader } from '@/components/dashboard/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ToolAnalyticsPage() {
  const result = await getToolAnalytics({ days: 7 });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Tool Analytics"
        description="tool_v1 funnel (Qualified Decision Rate, TTFV, mobile drop-off) and tracking health for every Financial Decision Lab tool"
      />

      <ChunkErrorBoundary label="ToolAnalytics">
        <ToolAnalytics initialData={result.success ? result.data ?? null : null} initialError={result.error ?? null} />
      </ChunkErrorBoundary>
    </div>
  );
}

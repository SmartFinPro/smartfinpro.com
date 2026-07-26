// app/(dashboard)/dashboard/analytics/cockpits/page.tsx
// Cockpit Analytics — CRO funnel for the Best-X Comparison Cockpits
// (cockpit_v1 events in analytics_events). Pattern: analytics/heatmap.

import { Gauge } from 'lucide-react';
import { getCockpitAnalytics } from '@/lib/actions/cockpit-analytics';
import { CockpitAnalytics } from '@/components/dashboard/cockpit-analytics';
import { ChunkErrorBoundary } from '@/components/dashboard/chunk-error-boundary';
import { PageHeader } from '@/components/dashboard/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CockpitAnalyticsPage() {
  const result = await getCockpitAnalytics('7d');

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Gauge}
        title="Cockpit Analytics"
        description="Impression → Interaction → CTA funnel for all Best-X comparison cockpits (visit / review / offer)"
      />

      <ChunkErrorBoundary label="CockpitAnalytics">
        <CockpitAnalytics initialData={result.data} initialError={result.error} />
      </ChunkErrorBoundary>
    </div>
  );
}

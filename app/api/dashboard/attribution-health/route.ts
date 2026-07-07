// app/api/dashboard/attribution-health/route.ts
// Compact attribution-health summary for the Command Center card.
// Auth handled by the dashboard proxy middleware (same pattern as
// autonomous-stats).

import { getAttributionHealth } from '@/lib/actions/attribution-watchdog';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getAttributionHealth();

  if (data.error) {
    // Surface the failure — the card must show an error, not "all healthy"
    return Response.json({ error: data.error }, { status: 500 });
  }

  const bands = { healthy: 0, warning: 0, critical: 0, na: 0 };
  for (const p of data.providers) bands[p.score.band]++;

  const openIncidents = data.incidents.filter((i) =>
    ['open', 'confirmed'].includes(i.status),
  );

  const worst = data.providers
    .filter((p) => p.score.band === 'critical' || p.score.band === 'warning')
    .slice(0, 3)
    .map((p) => ({
      provider: p.snapshot.partnerName,
      network: p.snapshot.network,
      score: p.score.score,
      band: p.score.band,
    }));

  return Response.json({
    bands,
    providersTotal: data.providers.length,
    openIncidents: openIncidents.length,
    riskTotal: openIncidents.reduce((a, i) => a + (i.revenue_risk_estimate ?? 0), 0),
    worst,
    fetchedAt: data.fetchedAt,
  });
}

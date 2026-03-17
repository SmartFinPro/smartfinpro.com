export const dynamic = 'force-dynamic';

import { getFunnelStats, getOfferExpectedValues, getRecentEvents } from '@/lib/actions/funnel';
import { ConversionFunnel, OfferEVTable, RecentEventsFeed } from '@/components/dashboard/conversion-funnel';
import { getPostbackUrl } from '@/lib/actions/connectors';
import { getSyncStatus } from '@/lib/api/sync-service';

export const metadata = { title: 'Conversion Funnel — SmartFinPro Dashboard' };

export default async function FunnelPage() {
  const [funnelStats, offerEVs, recentEvents, connectors] = await Promise.all([
    getFunnelStats({ days: 30 }),
    getOfferExpectedValues({ days: 90 }),
    getRecentEvents(20),
    getSyncStatus(),
  ]);

  // Generate per-connector postback URLs
  const postbackUrls: { connector: string; url: string }[] = [];
  for (const c of connectors.filter((c) => c.is_enabled)) {
    try {
      const { url } = await getPostbackUrl(c.name);
      postbackUrls.push({ connector: c.name, url });
    } catch {
      // Skip connectors without valid config
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Conversion Funnel</h1>
        <p className="text-sm text-slate-500 mt-1">
          Full click lifecycle: Click → Registration → KYC → FTD → Approved
        </p>
      </div>

      {/* Funnel Visualization */}
      <ConversionFunnel totalClicks={funnelStats.totalClicks} stages={funnelStats.stages} />

      {/* Two-column layout: EV Table + Events */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <OfferEVTable offers={offerEVs} />
        </div>
        <div>
          <RecentEventsFeed events={recentEvents} />
        </div>
      </div>

      {/* Postback Setup — Per-Connector URLs */}
      {postbackUrls.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div
            className="h-1"
            style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}
          />
          <div className="p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-1">S2S Postback Setup</h3>
            <p className="text-xs text-slate-500 mb-4">
              Each connector has its own postback URL with a unique token. Copy the URL for your
              network and paste it into the network&apos;s postback settings. The network will
              replace <code className="text-xs bg-slate-100 px-1 rounded">{'{MACROS}'}</code> with
              actual values at fire time.
            </p>

            <div className="space-y-3">
              {postbackUrls.map(({ connector, url }) => (
                <div key={connector}>
                  <span className="text-xs font-medium text-slate-700 capitalize">{connector}</span>
                  <code className="mt-1 block text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 break-all text-slate-700 font-mono leading-relaxed">
                    {url}
                  </code>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MacroDoc macro="{SUBID}" description="Our click_id (UUID) — passed as ?subid= on outbound click" />
              <MacroDoc macro="{EVENT}" description="registration | ftd | approved | reversed | kyc_approved | ..." />
              <MacroDoc macro="{PAYOUT}" description="Commission amount (e.g., 150.00)" />
              <MacroDoc macro="{CURRENCY}" description="ISO 4217 currency code (USD, GBP, etc.)" />
              <MacroDoc macro="{TXN_ID}" description="Network's unique transaction ID (for dedup)" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroDoc({ macro, description }: { macro: string; description: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <code className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
        {macro}
      </code>
      <span className="text-slate-500">{description}</span>
    </div>
  );
}

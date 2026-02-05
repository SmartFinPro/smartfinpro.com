import { Settings, Plug, History, Webhook } from 'lucide-react';
import { getConnectorsWithStatus, fetchSyncLogs } from '@/lib/actions/connectors';
import { ConnectorList } from '@/components/dashboard/connector-list';
import { SyncLogsTable } from '@/components/dashboard/sync-logs-table';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  const [connectors, syncLogs] = await Promise.all([
    getConnectorsWithStatus(),
    fetchSyncLogs(15),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="h-6 w-6 text-slate-400" />
          Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Configure API connectors and view synchronization history
        </p>
      </div>

      {/* API Connectors */}
      <div className="dashboard-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">API Connectors</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Connect to affiliate networks for automatic commission synchronization
          </p>
        </div>
        <div className="p-6">
          <ConnectorList connectors={connectors} />
        </div>
      </div>

      {/* Webhook Information */}
      <div className="dashboard-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Webhook Endpoints</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure these URLs in your affiliate network dashboards for real-time updates
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {connectors
              .filter((c) => c.supportsWebhooks)
              .map((connector) => (
                <div
                  key={connector.name}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-800">{connector.displayName}</p>
                    <code className="text-xs text-slate-500 break-all">
                      {connector.webhook_url}
                    </code>
                  </div>
                  <div className="text-right">
                    {connector.is_enabled ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Sync History */}
      <div className="dashboard-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Sync History</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Recent synchronization activity across all connectors
          </p>
        </div>
        <div className="p-6">
          <SyncLogsTable logs={syncLogs} />
        </div>
      </div>
    </div>
  );
}

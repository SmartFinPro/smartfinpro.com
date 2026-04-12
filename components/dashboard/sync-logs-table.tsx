'use client';

import { CheckCircle, XCircle, Clock, RefreshCw, Webhook } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SyncLog } from '@/lib/actions/connectors';
import { WidgetErrorBoundary } from '@/components/dashboard/widget-error-boundary';

interface SyncLogsTableProps {
  logs: SyncLog[];
}

const syncTypeIcons = {
  manual: RefreshCw,
  scheduled: Clock,
  webhook: Webhook,
};

const syncTypeLabels = {
  manual: 'Manual',
  scheduled: 'Scheduled',
  webhook: 'Webhook',
};

export function SyncLogsTable({ logs }: SyncLogsTableProps) {
  if (!logs || logs.length === 0) {
    return (
      <WidgetErrorBoundary label="Sync Logs Table" minHeight="h-32">
        <div className="py-8 text-center text-muted-foreground">
          No sync history yet. Configure a connector and run a sync to see activity here.
        </div>
      </WidgetErrorBoundary>
    );
  }

  return (
    <WidgetErrorBoundary label="Sync Logs Table" minHeight="h-32">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Time</th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Connector</th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Records</th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Duration</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const TypeIcon = syncTypeIcons[log.sync_type as keyof typeof syncTypeIcons] || Clock;
            const startTime = new Date(log.started_at);
            const endTime = log.completed_at ? new Date(log.completed_at) : null;
            const duration = endTime
              ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
              : null;

            return (
              <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-3 px-2 whitespace-nowrap">
                  {startTime.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="py-3 px-2 font-medium capitalize">{log.connector_name}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-1.5">
                    <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{syncTypeLabels[log.sync_type as keyof typeof syncTypeLabels] || log.sync_type}</span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  {log.status === 'success' ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  ) : log.status === 'failed' ? (
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      title={log.error_message || undefined}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Running
                    </Badge>
                  )}
                </td>
                <td className="py-3 px-2 text-right">
                  {log.status === 'success' ? (
                    <span>
                      <span className="font-medium">{log.records_synced}</span>
                      {log.records_skipped > 0 && (
                        <span className="text-muted-foreground text-xs ml-1">
                          (+{log.records_skipped} skipped)
                        </span>
                      )}
                    </span>
                  ) : log.status === 'failed' ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    <span className="text-muted-foreground">...</span>
                  )}
                </td>
                <td className="py-3 px-2 text-muted-foreground">
                  {duration !== null ? (
                    duration < 60 ? (
                      `${duration}s`
                    ) : (
                      `${Math.floor(duration / 60)}m ${duration % 60}s`
                    )
                  ) : log.status === 'running' ? (
                    '...'
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </WidgetErrorBoundary>
  );
}

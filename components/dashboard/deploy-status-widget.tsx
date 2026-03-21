'use client';

import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  ExternalLink,
  GitCommit,
  User,
} from 'lucide-react';
import type { DeployStats, DeployLog } from '@/lib/actions/deploy-logs';

// ── Status Badge ───────────────────────────────────────────────

function StatusBadge({ status }: { status: DeployLog['status'] }) {
  const config = {
    success: { icon: CheckCircle2, label: 'Success', color: 'bg-emerald-50 text-emerald-700' },
    failed: { icon: XCircle, label: 'Failed', color: 'bg-red-50 text-red-700' },
    rolled_back: { icon: RotateCcw, label: 'Rolled Back', color: 'bg-amber-50 text-amber-700' },
    pending: { icon: Clock, label: 'Pending', color: 'bg-slate-50 text-slate-600' },
  };

  const c = config[status] || config.pending;
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${c.color}`}>
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}

// ── Time Ago ───────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Main Widget ────────────────────────────────────────────────

interface DeployStatusWidgetProps {
  stats: DeployStats;
}

export function DeployStatusWidget({ stats }: DeployStatusWidgetProps) {
  if (stats.totalDeploys === 0) {
    return (
      <div className="py-6 text-center text-slate-500 text-sm">
        <GitCommit className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        No deploy data yet. Deploy history will appear after the next GitHub Actions deploy.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xl font-semibold text-slate-900 tabular-nums">{stats.totalDeploys}</p>
          <p className="text-xs text-slate-500">Total Deploys</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-xl font-semibold text-emerald-700 tabular-nums">{stats.successRate}%</p>
          <p className="text-xs text-emerald-600">Success Rate</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${stats.rollbackCount > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
          <p className={`text-xl font-semibold tabular-nums ${stats.rollbackCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {stats.rollbackCount}
          </p>
          <p className="text-xs text-slate-500">Rollbacks</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xl font-semibold text-slate-900 tabular-nums">
            {stats.lastDeploy ? timeAgo(stats.lastDeploy.deployed_at) : '—'}
          </p>
          <p className="text-xs text-slate-500">Last Deploy</p>
        </div>
      </div>

      {/* Recent Deploys Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Commit</th>
              <th className="text-left py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Author</th>
              <th className="text-right py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">When</th>
              <th className="text-center py-2 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Link</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentDeploys.slice(0, 10).map((deploy) => (
              <tr key={deploy.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-2 px-3">
                  <StatusBadge status={deploy.status} />
                </td>
                <td className="py-2 px-3 max-w-[300px]">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">
                      {deploy.commit_sha.slice(0, 7)}
                    </code>
                    {deploy.commit_message && (
                      <span className="text-slate-600 truncate text-xs">
                        {deploy.commit_message.split('\n')[0].slice(0, 60)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-3">
                  {deploy.actor && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <User className="h-3 w-3" />
                      {deploy.actor}
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 text-right text-xs text-slate-400 whitespace-nowrap">
                  {timeAgo(deploy.deployed_at)}
                </td>
                <td className="py-2 px-3 text-center">
                  {deploy.run_url && (
                    <a
                      href={deploy.run_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

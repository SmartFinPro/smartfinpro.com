// components/dashboard/autonomous-actions-widget.tsx
/* eslint-disable sfp/require-widget-error-boundary */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bot,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Zap,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from 'lucide-react';

interface AutonomousStats {
  actionsLast7Days: number;
  positiveOutcomes: number;
  neutralOutcomes: number;
  negativeOutcomes: number;
  pendingInsights: number;
  systemConfidence: number;
  simulationMode: boolean;
  autoExecutorEnabled: boolean;
  topLearnings: Array<{
    learning: string;
    confidence: number;
    category: string;
  }>;
  recentActions: Array<{
    id: string;
    action_type: string;
    description: string;
    outcome: string;
    executed_at: string;
    risk_tier: number;
  }>;
}

export function AutonomousActionsWidget() {
  const [stats, setStats] = useState<AutonomousStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/autonomous-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Silently fail — widget shows empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleToggle = async () => {
    if (!stats || toggling) return;
    setToggling(true);
    try {
      const res = await fetch('/api/dashboard/autonomous-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'auto_executor_enabled',
          value: stats.autoExecutorEnabled ? 'false' : 'true',
        }),
      });
      if (res.ok) {
        setStats((prev) =>
          prev ? { ...prev, autoExecutorEnabled: !prev.autoExecutorEnabled } : prev,
        );
      }
    } catch {
      // Silently fail
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-slate-100 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded" />
            ))}
          </div>
          <div className="h-20 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 text-center">
        <Bot className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Autonomous system data unavailable</p>
        <button
          onClick={fetchStats}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  const totalOutcomes = stats.positiveOutcomes + stats.neutralOutcomes + stats.negativeOutcomes;
  const successRate = totalOutcomes > 0
    ? Math.round((stats.positiveOutcomes / totalOutcomes) * 100)
    : 0;

  const outcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-amber-600 bg-amber-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const tierLabel = (tier: number) => {
    switch (tier) {
      case 0: return 'Silent';
      case 1: return 'Notify';
      case 2: return 'Undo';
      case 3: return 'Approval';
      default: return `T${tier}`;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-[var(--sfp-navy)]" />
          <h3 className="text-sm font-semibold text-slate-900">Autonomous System</h3>
          {stats.simulationMode && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
              SIMULATION
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Kill Switch */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
            title={stats.autoExecutorEnabled ? 'Disable auto-executor' : 'Enable auto-executor'}
          >
            {stats.autoExecutorEnabled ? (
              <>
                <ToggleRight className="h-5 w-5 text-green-500" />
                <span className="text-green-600 font-medium">ON</span>
              </>
            ) : (
              <>
                <ToggleLeft className="h-5 w-5 text-slate-400" />
                <span className="text-slate-400 font-medium">OFF</span>
              </>
            )}
          </button>
          <Link
            href="/dashboard/autonomous"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4">
        <div>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Zap className="h-3 w-3" /> Actions (7d)
          </p>
          <p className="text-xl font-semibold text-slate-900 tabular-nums">
            {stats.actionsLast7Days}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Success Rate
          </p>
          <p className={`text-xl font-semibold tabular-nums ${
            successRate >= 70 ? 'text-green-600' : successRate >= 50 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {totalOutcomes > 0 ? `${successRate}%` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Brain className="h-3 w-3" /> Confidence
          </p>
          <p className="text-xl font-semibold text-slate-900 tabular-nums">
            {stats.systemConfidence > 0 ? `${Math.round(stats.systemConfidence * 100)}%` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Pending
          </p>
          <p className="text-xl font-semibold text-slate-900 tabular-nums">
            {stats.pendingInsights}
          </p>
        </div>
      </div>

      {/* Outcome Bar */}
      {totalOutcomes > 0 && (
        <div className="px-6 pb-3">
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
            {stats.positiveOutcomes > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(stats.positiveOutcomes / totalOutcomes) * 100}%` }}
              />
            )}
            {stats.neutralOutcomes > 0 && (
              <div
                className="bg-slate-300 transition-all"
                style={{ width: `${(stats.neutralOutcomes / totalOutcomes) * 100}%` }}
              />
            )}
            {stats.negativeOutcomes > 0 && (
              <div
                className="bg-red-400 transition-all"
                style={{ width: `${(stats.negativeOutcomes / totalOutcomes) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
            <span className="flex items-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5 text-green-500" /> {stats.positiveOutcomes} positive
            </span>
            <span className="flex items-center gap-0.5">
              <Minus className="h-2.5 w-2.5 text-slate-400" /> {stats.neutralOutcomes} neutral
            </span>
            <span className="flex items-center gap-0.5">
              <TrendingDown className="h-2.5 w-2.5 text-red-400" /> {stats.negativeOutcomes} negative
            </span>
          </div>
        </div>
      )}

      {/* Top Learnings */}
      {stats.topLearnings.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Top Learnings
          </p>
          <div className="space-y-1.5">
            {stats.topLearnings.slice(0, 3).map((l, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Brain className="h-3 w-3 text-[var(--sfp-navy)] mt-0.5 shrink-0" />
                <span className="text-slate-600 line-clamp-1">{l.learning}</span>
                <span className="ml-auto shrink-0 text-[10px] text-slate-400 tabular-nums">
                  {Math.round(l.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Actions */}
      {stats.recentActions.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Recent Actions
          </p>
          <div className="space-y-1.5">
            {stats.recentActions.slice(0, 5).map((action) => (
              <div key={action.id} className="flex items-center gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${outcomeColor(action.outcome)}`}>
                  {action.outcome}
                </span>
                <span className="text-slate-600 truncate flex-1">{action.description}</span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  T{action.risk_tier} · {tierLabel(action.risk_tier)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Link */}
      <div className="px-6 py-3 border-t border-slate-100">
        <Link
          href="/dashboard/autonomous"
          className="text-xs text-[var(--sfp-navy)] hover:underline flex items-center gap-1"
        >
          View all actions & learnings <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

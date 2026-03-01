'use client';

/**
 * A/B Live-View — Dashboard-Widget für ComparisonHub A/B Tests
 *
 * Zeigt Echtzeit-Performance der Profit-First vs Trust-First Varianten.
 * Integriert in /dashboard/analytics/optimize.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  Trophy,
  RotateCcw,
  Loader2,
  DollarSign,
  Heart,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import type { AbTestLiveView } from '@/lib/actions/ab-testing';

export function AbLiveView() {
  const [tests, setTests] = useState<AbTestLiveView[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    import('@/lib/actions/ab-testing')
      .then(({ getAbTestLiveData }) => getAbTestLiveData())
      .then((data) => {
        setTests(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleReset = async (hubId: string) => {
    setResetting(hubId);
    const { resetAbTest } = await import('@/lib/actions/ab-testing');
    await resetAbTest(hubId);
    fetchData();
    setResetting(null);
  };

  const activeTests = tests.filter((t) => t.status !== 'concluded');
  const concludedTests = tests.filter((t) => t.status === 'concluded');

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
            <FlaskConical className="h-4.5 w-4.5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              A/B Test Live-View
            </h3>
            <p className="text-xs text-slate-400">
              ComparisonHub: Profit-First vs Trust-First
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          title="Refresh"
        >
          <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {loading && tests.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Lade A/B-Test Daten...
        </div>
      ) : tests.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <FlaskConical className="h-8 w-8 mx-auto mb-3 text-slate-300" />
          <p>Noch keine A/B-Test-Daten vorhanden.</p>
          <p className="text-xs mt-1">
            Tests starten automatisch wenn der ComparisonHub auf Content-Seiten
            geladen wird.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {/* Active Tests */}
          {activeTests.length > 0 && (
            <div>
              <div className="px-5 py-3 bg-slate-50/50">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Aktive Tests ({activeTests.length})
                </span>
              </div>
              {activeTests.map((test) => (
                <TestRow
                  key={test.hubId}
                  test={test}
                  onReset={handleReset}
                  isResetting={resetting === test.hubId}
                />
              ))}
            </div>
          )}

          {/* Concluded Tests */}
          {concludedTests.length > 0 && (
            <div>
              <div className="px-5 py-3 bg-slate-50/50">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Abgeschlossene Tests ({concludedTests.length})
                </span>
              </div>
              {concludedTests.map((test) => (
                <TestRow
                  key={test.hubId}
                  test={test}
                  onReset={handleReset}
                  isResetting={resetting === test.hubId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Individual Test Row ─────────────────────────────────────

interface TestRowProps {
  test: AbTestLiveView;
  onReset: (hubId: string) => void;
  isResetting: boolean;
}

function TestRow({ test, onReset, isResetting }: TestRowProps) {
  const categoryLabel = test.category
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const marketLabel = test.market.toUpperCase();

  // Calculate progress toward 500 impressions min
  const progressA = Math.min(
    (test.variantA.impressions / 500) * 100,
    100,
  );
  const progressB = Math.min(
    (test.variantB.impressions / 500) * 100,
    100,
  );

  // Determine leading variant
  const crDelta = test.variantA.cr - test.variantB.cr;
  const leadingVariant: 'A' | 'B' | 'tie' =
    Math.abs(crDelta) < 0.1 ? 'tie' : crDelta > 0 ? 'A' : 'B';

  return (
    <div className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
      {/* Top: Category + Market + Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700 text-sm">
            {categoryLabel}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
            {marketLabel}
          </span>
          <StatusBadge status={test.status} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {test.totalImpressions.toLocaleString('en-US')} imp
          </span>
          <button
            onClick={() => onReset(test.hubId)}
            disabled={isResetting}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Test zurücksetzen"
          >
            {isResetting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Variant Comparison Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Variant A — Profit-First */}
        <VariantCard
          label="A: Profit-First"
          icon={<DollarSign className="h-3.5 w-3.5" />}
          impressions={test.variantA.impressions}
          clicks={test.variantA.clicks}
          cr={test.variantA.cr}
          progress={progressA}
          isLeading={leadingVariant === 'A'}
          isWinner={test.winner === 'A'}
          accentColor="emerald"
        />

        {/* Variant B — Trust-First */}
        <VariantCard
          label="B: Trust-First"
          icon={<Heart className="h-3.5 w-3.5" />}
          impressions={test.variantB.impressions}
          clicks={test.variantB.clicks}
          cr={test.variantB.cr}
          progress={progressB}
          isLeading={leadingVariant === 'B'}
          isWinner={test.winner === 'B'}
          accentColor="violet"
        />
      </div>

      {/* Winner Banner */}
      {test.winner && test.winnerLift !== null && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/50">
          <Trophy className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700">
            Variant {test.winner} gewinnt mit +{test.winnerLift.toFixed(1)}% Lift
          </span>
          {test.confidence && (
            <span className="text-xs text-emerald-500 ml-auto">
              {test.confidence}% Confidence
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Variant Card ────────────────────────────────────────────

interface VariantCardProps {
  label: string;
  icon: React.ReactNode;
  impressions: number;
  clicks: number;
  cr: number;
  progress: number;
  isLeading: boolean;
  isWinner: boolean;
  accentColor: 'emerald' | 'violet';
}

function VariantCard({
  label,
  icon,
  impressions,
  clicks,
  cr,
  progress,
  isLeading,
  isWinner,
  accentColor,
}: VariantCardProps) {
  const borderClass = isWinner
    ? 'border-emerald-300 bg-emerald-50/50'
    : isLeading
      ? accentColor === 'emerald'
        ? 'border-emerald-200/50 bg-emerald-50/30'
        : 'border-violet-200/50 bg-violet-50/30'
      : 'border-slate-200 bg-white';

  const crColor = isLeading ? 'text-emerald-600' : 'text-slate-700';

  return (
    <div className={`p-3 rounded-lg border ${borderClass} transition-colors`}>
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          {icon}
          {label}
        </div>
        {isWinner && (
          <Trophy className="h-3.5 w-3.5 text-emerald-500" />
        )}
      </div>

      {/* CR (big number) */}
      <div className={`text-2xl font-bold ${crColor} mb-1`}>
        {cr.toFixed(2)}%
      </div>

      {/* Impressions + Clicks */}
      <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
        <span>{impressions.toLocaleString('en-US')} imp</span>
        <span>{clicks.toLocaleString('en-US')} clicks</span>
      </div>

      {/* Progress bar toward 500 min */}
      {progress < 100 && (
        <div className="w-full">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                accentColor === 'emerald' ? 'bg-emerald-400' : 'bg-violet-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {Math.round(progress)}% bis min. 500 imp
          </p>
        </div>
      )}
    </div>
  );
}

// ── Status Badge ────────────────────────────────────────────

function StatusBadge({ status }: { status: 'collecting' | 'ready' | 'concluded' }) {
  const config = {
    collecting: {
      label: 'Daten sammeln',
      icon: <Clock className="h-3 w-3" />,
      className: 'bg-amber-50 text-amber-600 border-amber-200/50',
    },
    ready: {
      label: 'Auswertung bereit',
      icon: <BarChart3 className="h-3 w-3" />,
      className: 'bg-blue-50 text-blue-600 border-blue-200/50',
    },
    concluded: {
      label: 'Abgeschlossen',
      icon: <CheckCircle className="h-3 w-3" />,
      className: 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
    },
  };

  const { label, icon, className } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

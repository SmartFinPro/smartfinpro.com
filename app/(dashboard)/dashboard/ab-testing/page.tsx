// app/(dashboard)/dashboard/ab-testing/page.tsx
// A/B Testing Live Dashboard — ComparisonHub Variant Performance
// Profit-First (A) vs Trust-First (B) — Z-Test Statistical Engine

import { getAbTestLiveData, resetAbTest } from '@/lib/actions/ab-testing';
import { revalidatePath } from 'next/cache';
import {
  FlaskConical,
  TrendingUp,
  Users,
  RotateCcw,
  CheckCircle,
  Clock,
  Zap,
  ArrowUpRight,
  BarChart3,
  Trophy,
  Info,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// ── Status Badge ─────────────────────────────────────────────

function StatusBadge({ status }: { status: 'collecting' | 'ready' | 'concluded' }) {
  if (status === 'concluded') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="h-3 w-3" />
        Concluded
      </span>
    );
  }
  if (status === 'ready') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Zap className="h-3 w-3" />
        Ready
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      <Clock className="h-3 w-3" />
      Collecting
    </span>
  );
}

// ── Market Badge ─────────────────────────────────────────────

function MarketBadge({ market }: { market: string }) {
  const colors: Record<string, string> = {
    us: 'bg-blue-50 text-blue-700 border-blue-200',
    uk: 'bg-purple-50 text-purple-700 border-purple-200',
    ca: 'bg-red-50 text-red-700 border-red-200',
    au: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
        colors[market] || 'bg-slate-50 text-slate-600 border-slate-200'
      }`}
    >
      {market}
    </span>
  );
}

// ── Variant Stat Block ────────────────────────────────────────

function VariantBlock({
  label,
  sublabel,
  impressions,
  clicks,
  cr,
  isWinner,
  minImpressions = 500,
}: {
  label: string;
  sublabel: string;
  impressions: number;
  clicks: number;
  cr: number;
  isWinner: boolean;
  minImpressions?: number;
}) {
  const progress = Math.min(100, (impressions / minImpressions) * 100);

  return (
    <div
      className={`p-4 rounded-xl border ${
        isWinner
          ? 'border-emerald-200 bg-emerald-50/60'
          : 'border-slate-200 bg-slate-50/60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-slate-700">{label}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{sublabel}</p>
        </div>
        {isWinner && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
            <Trophy className="h-3 w-3 text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700">Winner</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white rounded-lg p-2 border border-slate-100">
          <p className="text-base font-bold text-slate-800 tabular-nums">
            {impressions.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Impressions</p>
        </div>
        <div className="bg-white rounded-lg p-2 border border-slate-100">
          <p className="text-base font-bold text-slate-800 tabular-nums">
            {clicks.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Clicks</p>
        </div>
        <div
          className={`rounded-lg p-2 border ${
            isWinner
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-white border-slate-100'
          }`}
        >
          <p
            className={`text-base font-bold tabular-nums ${
              isWinner ? 'text-emerald-700' : 'text-slate-800'
            }`}
          >
            {cr.toFixed(2)}%
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">CTR</p>
        </div>
      </div>

      {/* Progress bar (only when collecting) */}
      {impressions < minImpressions && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400">Threshold progress</span>
            <span className="text-[10px] font-medium text-slate-500">
              {impressions}/{minImpressions}
            </span>
          </div>
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-400 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reset Server Action ───────────────────────────────────────

async function doReset(formData: FormData) {
  'use server';
  const hubId = formData.get('hubId') as string;
  if (!hubId) return;
  await resetAbTest(hubId);
  revalidatePath('/dashboard/ab-testing');
}

// ── Page ─────────────────────────────────────────────────────

export default async function AbTestingPage() {
  const tests = await getAbTestLiveData();

  const collectingCount = tests.filter((t) => t.status === 'collecting').length;
  const readyCount = tests.filter((t) => t.status === 'ready').length;
  const concludedCount = tests.filter((t) => t.status === 'concluded').length;
  const totalImpressions = tests.reduce((sum, t) => sum + t.totalImpressions, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100 shrink-0">
          <FlaskConical className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">A/B Testing</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            ComparisonHub variant performance —{' '}
            <strong className="font-semibold text-slate-700">A: Profit-First</strong>{' '}
            (CPA sort) vs{' '}
            <strong className="font-semibold text-slate-700">B: Trust-First</strong>{' '}
            (rating sort)
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Active Tests
          </p>
          <p className="text-3xl font-bold text-slate-900">{tests.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Collecting
          </p>
          <p className="text-3xl font-bold text-slate-600">{collectingCount}</p>
        </div>
        <div
          className={`bg-white rounded-xl p-4 shadow-sm border ${
            readyCount > 0 ? 'border-amber-200' : 'border-slate-200'
          }`}
        >
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
              readyCount > 0 ? 'text-amber-500' : 'text-slate-400'
            }`}
          >
            Ready to Conclude
          </p>
          <p
            className={`text-3xl font-bold ${
              readyCount > 0 ? 'text-amber-600' : 'text-slate-600'
            }`}
          >
            {readyCount}
          </p>
        </div>
        <div
          className={`bg-white rounded-xl p-4 shadow-sm border ${
            concludedCount > 0 ? 'border-emerald-200' : 'border-slate-200'
          }`}
        >
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
              concludedCount > 0 ? 'text-emerald-500' : 'text-slate-400'
            }`}
          >
            Concluded
          </p>
          <p
            className={`text-3xl font-bold ${
              concludedCount > 0 ? 'text-emerald-600' : 'text-slate-600'
            }`}
          >
            {concludedCount}
          </p>
        </div>
      </div>

      {/* Total Impressions */}
      {totalImpressions > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Users className="h-3.5 w-3.5" />
          <span>{totalImpressions.toLocaleString()} total impressions across all hubs</span>
        </div>
      )}

      {/* Empty State */}
      {tests.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-14 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 mb-1">No tests running yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Tests start automatically when visitors view ComparisonHub pages. Come back after
            traffic has accumulated.
          </p>
        </div>
      )}

      {/* Test Cards */}
      {tests.length > 0 && (
        <div className="space-y-4">
          {tests.map((test) => (
            <div
              key={test.hubId}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
                test.status === 'concluded'
                  ? 'border-emerald-200'
                  : test.status === 'ready'
                    ? 'border-amber-200'
                    : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div
                className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
                  test.status === 'concluded'
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : test.status === 'ready'
                      ? 'bg-amber-50/50 border-amber-100'
                      : 'bg-slate-50 border-slate-100'
                }`}
              >
                {/* Hub Identity */}
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-800 capitalize">
                        {test.category}
                      </span>
                      <MarketBadge market={test.market} />
                      <StatusBadge status={test.status} />
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{test.hubId}</p>
                  </div>
                </div>

                {/* Right: Winner pill + Confidence + Reset */}
                <div className="flex items-center gap-2 flex-wrap">
                  {test.winner && test.winnerLift !== null && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Variant {test.winner} wins · +{test.winnerLift.toFixed(1)}% lift
                    </div>
                  )}
                  {!test.winner && test.confidence !== null && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <BarChart3 className="h-3.5 w-3.5" />
                      {test.confidence.toFixed(0)}% confidence
                    </div>
                  )}
                  <form action={doReset}>
                    <input type="hidden" name="hubId" value={test.hubId} />
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors"
                      title="Reset test data"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  </form>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <VariantBlock
                    label="Variant A — Profit-First"
                    sublabel="Sorted by CPA (max affiliate revenue)"
                    impressions={test.variantA.impressions}
                    clicks={test.variantA.clicks}
                    cr={test.variantA.cr}
                    isWinner={test.winner === 'A'}
                  />
                  <VariantBlock
                    label="Variant B — Trust-First"
                    sublabel="Sorted by user rating (max trust)"
                    impressions={test.variantB.impressions}
                    clicks={test.variantB.clicks}
                    cr={test.variantB.cr}
                    isWinner={test.winner === 'B'}
                  />
                </div>

                {/* Ready alert */}
                {test.status === 'ready' && test.confidence !== null && (
                  <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                    <ArrowUpRight className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Statistical significance reached at{' '}
                      <strong>{test.confidence.toFixed(0)}% confidence</strong>. Winner will be
                      declared automatically on the next click event.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            How it works
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          • Each ComparisonHub page randomly assigns visitors to Variant A (Profit-First) or B
          (Trust-First).
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          • Minimum <strong className="text-slate-500">500 impressions per variant</strong> required
          before statistical evaluation.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          • Winner declared at{' '}
          <strong className="text-slate-500">95% confidence (Z-test)</strong> — Telegram alert sent
          automatically.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          • After conclusion, the hub{' '}
          <strong className="text-slate-500">permanently locks the winning sort order</strong>.
        </p>
      </div>
    </div>
  );
}

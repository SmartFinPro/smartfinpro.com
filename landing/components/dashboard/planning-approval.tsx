'use client';

import { useState, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion';
import {
  Check,
  X,
  TrendingUp,
  DollarSign,
  Target,
  Sparkles,
  Loader2,
  Zap,
  Globe,
  BarChart3,
  ArrowRight,
  Rocket,
  ChevronRight,
  FileText,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';

// ════════════════════════════════════════════════════════════════
// EXECUTIVE APPROVAL — Swipe Card Interface
//
// Stackable card UI for planning_queue items.
// Swipe right = Approve & Execute → Auto-Genesis pipeline
// Swipe left = Reject & Archive → Learns for future planning
// ════════════════════════════════════════════════════════════════

interface PlanCard {
  id: string;
  keyword: string;
  market: string;
  category: string;
  predictedCpa: number;
  reason: string;
  opportunityScore: number;
  sourceSlug: string | null;
  digestDate: string;
}

interface ExecutionResult {
  planId: string;
  keyword: string;
  success: boolean;
  slug?: string;
  wordCount?: number;
  error?: string;
}

interface PlanningApprovalProps {
  initialPlans: PlanCard[];
}

// ── Market flag mapping ──────────────────────────────────────

const MARKET_FLAGS: Record<string, string> = {
  us: '\u{1F1FA}\u{1F1F8}',
  uk: '\u{1F1EC}\u{1F1E7}',
  ca: '\u{1F1E8}\u{1F1E6}',
  au: '\u{1F1E6}\u{1F1FA}',
};

const CATEGORY_LABELS: Record<string, string> = {
  trading: 'Trading',
  forex: 'Forex',
  'ai-tools': 'AI Tools',
  cybersecurity: 'Cybersecurity',
  'personal-finance': 'Personal Finance',
  'business-banking': 'Business Banking',
};

// ── Difficulty estimation heuristic ──────────────────────────

function estimateDifficulty(score: number): { level: string; pct: number; color: string } {
  if (score >= 80) return { level: 'Easy', pct: 25, color: '#34d399' };
  if (score >= 60) return { level: 'Medium', pct: 50, color: '#fbbf24' };
  if (score >= 40) return { level: 'Hard', pct: 70, color: '#f97316' };
  return { level: 'Very Hard', pct: 90, color: '#ef4444' };
}

function estimateROI(cpa: number): { level: string; pct: number; color: string } {
  if (cpa >= 500) return { level: 'Exceptional', pct: 95, color: '#34d399' };
  if (cpa >= 200) return { level: 'High', pct: 75, color: '#22d3ee' };
  if (cpa >= 50) return { level: 'Moderate', pct: 50, color: '#a78bfa' };
  return { level: 'Low', pct: 25, color: '#94a3b8' };
}

// ── Swipeable Card Component ────────────────────────────────

const SWIPE_THRESHOLD = 120;

function SwipeCard({
  plan,
  isTop,
  onApprove,
  onReject,
  isExecuting,
}: {
  plan: PlanCard;
  isTop: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isExecuting: boolean;
}) {
  const x = useMotionValue(0);

  // Visual feedback transforms
  const rotateZ = useTransform(x, [-200, 0, 200], [-8, 0, 8]);
  const approveOpacity = useTransform(x, [0, 80, 160], [0, 0.6, 1]);
  const rejectOpacity = useTransform(x, [-160, -80, 0], [1, 0.6, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  // Background glow on swipe
  const bgGlow = useTransform(
    x,
    [-200, -80, 0, 80, 200],
    [
      'rgba(239, 68, 68, 0.06)',
      'rgba(239, 68, 68, 0.03)',
      '#ffffff',
      'rgba(16, 185, 129, 0.03)',
      'rgba(16, 185, 129, 0.06)',
    ],
  );

  const borderGlow = useTransform(
    x,
    [-200, -80, 0, 80, 200],
    [
      'rgba(239, 68, 68, 0.3)',
      'rgba(239, 68, 68, 0.12)',
      'rgb(226, 232, 240)',
      'rgba(16, 185, 129, 0.12)',
      'rgba(16, 185, 129, 0.3)',
    ],
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (isExecuting) return;
    if (info.offset.x > SWIPE_THRESHOLD) {
      onApprove(plan.id);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onReject(plan.id);
    }
  };

  const difficulty = estimateDifficulty(plan.opportunityScore);
  const roi = estimateROI(plan.predictedCpa);

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x,
        rotateZ,
        scale,
        zIndex: isTop ? 10 : 1,
        cursor: isTop && !isExecuting ? 'grab' : 'default',
      }}
      drag={isTop && !isExecuting ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.92, opacity: 0, y: 30 }}
      animate={{
        scale: isTop ? 1 : 0.95,
        opacity: isTop ? 1 : 0.6,
        y: isTop ? 0 : 12,
      }}
      exit={{
        x: 300,
        opacity: 0,
        scale: 0.8,
        rotateZ: 15,
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <motion.div
        className="rounded-2xl border p-6 h-full flex flex-col"
        style={{
          background: bgGlow,
          borderColor: borderGlow,
        }}
      >
        {/* Swipe Indicator Overlays */}
        <motion.div
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-emerald-400 pointer-events-none"
          style={{ opacity: approveOpacity, background: 'rgba(16, 185, 129, 0.15)' }}
        >
          <Check className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Approve</span>
        </motion.div>
        <motion.div
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-red-400 pointer-events-none"
          style={{ opacity: rejectOpacity, background: 'rgba(239, 68, 68, 0.15)' }}
        >
          <X className="h-5 w-5 text-red-400" />
          <span className="text-sm font-bold text-red-400 uppercase tracking-wider">Reject</span>
        </motion.div>

        {/* Executing Overlay */}
        {isExecuting && (
          <div className="absolute inset-0 z-20 rounded-2xl bg-white/90 flex flex-col items-center justify-center gap-4"
            style={{ backdropFilter: 'blur(4px)' }}
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-300 bg-emerald-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              </div>
              <div className="absolute -inset-3 rounded-full border border-emerald-300/40 animate-ping" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-emerald-600">Auto-Genesis wird gestartet...</p>
              <p className="text-xs text-slate-500">Research &rarr; Outline &rarr; Content &rarr; MDX</p>
            </div>
          </div>
        )}

        {/* Card Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-lg">{MARKET_FLAGS[plan.market] || '\u{1F30D}'}</span>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-600"
              >
                {CATEGORY_LABELS[plan.category] || plan.category}
              </span>
              {plan.reason.startsWith('\u{1F680}') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <DollarSign className="h-2.5 w-2.5" />
                  High-CPA
                </span>
              )}
              <span className="text-[10px] text-slate-600 font-mono">
                {plan.market.toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 leading-snug pr-4">
              {plan.keyword}
            </h3>
          </div>

          {/* Opportunity Score Ring */}
          <div className="shrink-0 relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgb(241,245,249)" strokeWidth="3" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke={plan.opportunityScore >= 70 ? '#34d399' : plan.opportunityScore >= 40 ? '#fbbf24' : '#f97316'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(plan.opportunityScore / 100) * 150.8} 150.8`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-800 tabular-nums">{plan.opportunityScore}</span>
            </div>
          </div>
        </div>

        {/* Profit Badge */}
        <div
          className="rounded-xl p-4 mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Est. CPA Revenue</p>
            <p className="text-xl font-bold text-emerald-600 tabular-nums">
              ${plan.predictedCpa.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}<span className="text-xs text-emerald-500 font-medium">/mo</span>
            </p>
          </div>
          <TrendingUp className="h-5 w-5 text-emerald-500/50 shrink-0" />
        </div>

        {/* AI Reason Box */}
        <div
          className="rounded-xl p-4 mb-4 bg-violet-50 border border-violet-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">AI Insight</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
            {plan.reason}
          </p>
        </div>

        {/* Metrics Bar — Difficulty vs ROI */}
        <div className="space-y-3 mb-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Predicted Difficulty</span>
              <span className="text-[10px] font-bold" style={{ color: difficulty.color }}>{difficulty.level}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-slate-100">
              <motion.div
                className="h-full rounded-full"
                style={{ background: difficulty.color }}
                initial={{ width: 0 }}
                animate={{ width: `${difficulty.pct}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Potential ROI</span>
              <span className="text-[10px] font-bold" style={{ color: roi.color }}>{roi.level}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-slate-100">
              <motion.div
                className="h-full rounded-full"
                style={{ background: roi.color }}
                initial={{ width: 0 }}
                animate={{ width: `${roi.pct}%` }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Source slug if available */}
        {plan.sourceSlug && (
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-4">
            <FileText className="h-3 w-3" />
            <span>Source: <code className="text-slate-500">{plan.sourceSlug}</code></span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Buttons (fallback for non-swipe) */}
        {isTop && !isExecuting && (
          <div className="flex gap-3">
            <button
              onClick={() => onReject(plan.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-red-500 bg-red-50 border border-red-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Ban className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={() => onApprove(plan.id)}
              className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)',
              }}
            >
              <Rocket className="h-4 w-4" />
              Approve & Generate
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────

export function PlanningApproval({ initialPlans }: PlanningApprovalProps) {
  const [plans, setPlans] = useState<PlanCard[]>(initialPlans);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [rejectedCount, setRejectedCount] = useState(0);

  const handleApprove = useCallback(async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan || executingId) return;

    setExecutingId(planId);

    try {
      const { approveAndExecuteSingle } = await import('@/lib/actions/daily-strategy');
      const result = await approveAndExecuteSingle(planId);

      setResults((prev) => [
        ...prev,
        {
          planId,
          keyword: plan.keyword,
          success: result.success,
          slug: result.slug,
          wordCount: result.wordCount,
          error: result.error,
        },
      ]);

      if (result.success) {
        toast.success(`"${plan.keyword}" generiert! ${result.wordCount?.toLocaleString() || ''} Woerter`);
      } else {
        toast.error(`Fehlgeschlagen: ${result.error || 'Unbekannter Fehler'}`);
      }
    } catch (err) {
      toast.error('Pipeline-Fehler');
      setResults((prev) => [
        ...prev,
        { planId, keyword: plan.keyword, success: false, error: 'Unexpected error' },
      ]);
    } finally {
      setExecutingId(null);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    }
  }, [plans, executingId]);

  const handleReject = useCallback(async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan || executingId) return;

    try {
      const { rejectPlanItem } = await import('@/lib/actions/daily-strategy');
      await rejectPlanItem(planId);
      toast('Abgelehnt', { description: `"${plan.keyword}" archiviert` });
    } catch {
      toast.error('Reject fehlgeschlagen');
    }

    setRejectedCount((prev) => prev + 1);
    setPlans((prev) => prev.filter((p) => p.id !== planId));
  }, [plans, executingId]);

  const approvedCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  return (
    <div className="space-y-8">
      {/* Stats Bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50">
              <Target className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Queue</p>
              <p className="text-lg font-bold text-slate-800 tabular-nums">{plans.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
              <Check className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Approved</p>
              <p className="text-lg font-bold text-emerald-600 tabular-nums">{approvedCount}</p>
            </div>
          </div>
          {failedCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50">
                <X className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Failed</p>
                <p className="text-lg font-bold text-rose-500 tabular-nums">{failedCount}</p>
              </div>
            </div>
          )}
          {rejectedCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100">
                <Ban className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Skipped</p>
                <p className="text-lg font-bold text-slate-600 tabular-nums">{rejectedCount}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Stack */}
      {plans.length > 0 ? (
        <div className="flex justify-center">
          <div className="relative w-full max-w-lg" style={{ height: '520px' }}>
            {/* Swipe hints */}
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-1 opacity-40">
              <X className="h-5 w-5 text-red-400" />
              <span className="text-[9px] text-red-400 font-semibold uppercase tracking-wider">Reject</span>
            </div>
            <div className="absolute -right-16 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-1 opacity-40">
              <Check className="h-5 w-5 text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">Approve</span>
            </div>

            <AnimatePresence mode="popLayout">
              {plans.slice(0, 3).map((plan, index) => (
                <SwipeCard
                  key={plan.id}
                  plan={plan}
                  isTop={index === 0}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isExecuting={executingId === plan.id}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center bg-emerald-50 border border-emerald-200"
          >
            {results.length > 0 ? (
              <Check className="h-10 w-10 text-emerald-500" />
            ) : (
              <Sparkles className="h-10 w-10 text-violet-500" />
            )}
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-slate-800">
              {results.length > 0 ? 'Alle Aufgaben bearbeitet!' : 'Keine neuen Vorschlaege'}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {results.length > 0
                ? `${approvedCount} genehmigt, ${rejectedCount} abgelehnt. Der naechste Batch kommt im taeglichen Digest.`
                : 'Die Self-Planning Loop generiert neue Vorschlaege beim naechsten Daily Digest (20:00 UTC).'}
            </p>
          </div>
        </div>
      )}

      {/* Execution Results */}
      {results.length > 0 && (
        <div
          className="rounded-xl border border-slate-200 p-5 space-y-3 bg-slate-50"
        >
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
            Execution Log
          </h4>
          <div className="space-y-2">
            {results.map((result) => (
              <div
                key={result.planId}
                className={`flex items-center gap-3 p-3 rounded-lg border ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${result.success ? 'bg-emerald-100' : 'bg-rose-100'}`}
                >
                  {result.success ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-rose-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{result.keyword}</p>
                  {result.success ? (
                    <p className="text-[10px] text-slate-500">
                      <code className="text-emerald-500">{result.slug}</code>
                      {result.wordCount && ` \u00B7 ${result.wordCount.toLocaleString()} words`}
                    </p>
                  ) : (
                    <p className="text-[10px] text-rose-400">{result.error}</p>
                  )}
                </div>
                {result.success && (
                  <Globe className="h-3.5 w-3.5 text-cyan-500/50 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

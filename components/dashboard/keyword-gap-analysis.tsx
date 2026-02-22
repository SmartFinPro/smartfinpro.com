'use client';

import { useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Search,
  Loader2,
  Zap,
  Globe,
  AlertTriangle,
  FileText,
  TrendingUp,
  Target,
  Crosshair,
  ArrowDown,
  ArrowUp,
  Minus,
  Crown,
  Eye,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Gauge,
  Layers,
  FileCode,
  Sparkles,
  Rocket,
  ImageIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Market, Category } from '@/lib/i18n/config';
import { marketCategories } from '@/lib/i18n/config';
import type {
  GapDashboardData,
  GapResult,
  GapDraft,
  GapCategorySummary,
} from '@/lib/actions/gap-analysis';
import {
  analyzeKeywordGap,
  createShadowDraft,
  bridgeTheGap,
  discardDraft,
} from '@/lib/actions/gap-analysis';
import {
  generateAndPublishPage,
} from '@/lib/actions/content-generator';
import type {
  ImageRequirement,
  GeneratePageResult,
} from '@/lib/actions/content-generator';

// ── Constants ────────────────────────────────────────────────

const MARKETS: { code: Market; flag: string; name: string }[] = [
  { code: 'us', flag: '\ud83c\uddfa\ud83c\uddf8', name: 'US' },
  { code: 'uk', flag: '\ud83c\uddec\ud83c\udde7', name: 'UK' },
  { code: 'ca', flag: '\ud83c\udde8\ud83c\udde6', name: 'CA' },
  { code: 'au', flag: '\ud83c\udde6\ud83c\uddfa', name: 'AU' },
];

const GAP_TYPE_CONFIG = {
  missing: { label: 'Missing', color: 'text-rose-600', bg: 'rgba(251,113,133,0.12)', icon: AlertTriangle },
  behind: { label: 'Behind', color: 'text-amber-600', bg: 'rgba(251,191,36,0.12)', icon: ArrowDown },
  ahead: { label: 'Ahead', color: 'text-emerald-600', bg: 'rgba(52,211,153,0.12)', icon: ArrowUp },
  tied: { label: 'Tied', color: 'text-cyan-600', bg: 'rgba(34,211,238,0.12)', icon: Minus },
};

const CHART_COLORS = {
  grid: '#e2e8f0',
  text: '#64748b',
  tooltip: { bg: '#ffffff', border: '#e2e8f0', text: '#1e293b' },
};

const BAR_COLORS = ['#a78bfa', '#22d3ee', '#fbbf24', '#fb7185', '#34d399', '#f472b6'];

// ── Glass Card ───────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'violet' | 'emerald' | 'amber' | 'cyan' | 'rose';
}) {
  const colorMap = {
    violet: { text: 'text-violet-600', icon: 'text-violet-500', glow: 'rgba(139,92,246,0.08)' },
    emerald: { text: 'text-emerald-600', icon: 'text-emerald-500', glow: 'rgba(52,211,153,0.08)' },
    amber: { text: 'text-amber-600', icon: 'text-amber-500', glow: 'rgba(251,191,36,0.08)' },
    cyan: { text: 'text-cyan-600', icon: 'text-cyan-500', glow: 'rgba(34,211,238,0.08)' },
    rose: { text: 'text-rose-600', icon: 'text-rose-500', glow: 'rgba(251,113,133,0.08)' },
  };
  const c = colorMap[color];

  return (
    <div className="rounded-xl border border-slate-200 p-5" style={{ background: c.glow }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1.5 tabular-nums ${c.text}`}>{value}</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200"
        >
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}

// ── Position Badge ───────────────────────────────────────────

function PositionBadge({ position }: { position: number | null }) {
  if (position === null) {
    return (
      <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
        <Minus className="h-3 w-3" /> —
      </span>
    );
  }
  if (position === 1) {
    return (
      <span className="inline-flex items-center gap-1 text-sm tabular-nums font-bold text-amber-500">
        <Crown className="h-3.5 w-3.5" /> #1
      </span>
    );
  }
  if (position <= 3) return <span className="text-sm tabular-nums font-bold text-amber-500">#{position}</span>;
  if (position <= 10) return <span className="text-sm tabular-nums font-semibold text-emerald-600">#{position}</span>;
  return <span className="text-sm tabular-nums font-medium text-slate-500">#{position}</span>;
}

// ── Opportunity Badge ────────────────────────────────────────

function OpportunityBadge({ score }: { score: number }) {
  let color: string;
  let bgColor: string;
  if (score >= 80) {
    color = 'text-emerald-600';
    bgColor = 'rgba(52,211,153,0.12)';
  } else if (score >= 60) {
    color = 'text-amber-600';
    bgColor = 'rgba(251,191,36,0.12)';
  } else if (score >= 40) {
    color = 'text-cyan-600';
    bgColor = 'rgba(34,211,238,0.12)';
  } else {
    color = 'text-slate-500';
    bgColor = 'rgba(100,116,139,0.08)';
  }

  return (
    <span
      className={`inline-flex items-center text-xs font-bold tabular-nums px-2 py-0.5 rounded ${color}`}
      style={{ background: bgColor }}
    >
      {score.toFixed(1)}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────

interface KeywordGapAnalysisProps {
  initialData: GapDashboardData;
}

export function KeywordGapAnalysis({ initialData }: KeywordGapAnalysisProps) {
  const [results, setResults] = useState(initialData.results);
  const [categorySummary, setCategorySummary] = useState(initialData.categorySummary);
  const [drafts, setDrafts] = useState(initialData.drafts);
  const [scansRemaining, setScansRemaining] = useState(initialData.scansRemaining);

  // Analysis input
  const [domainInput, setDomainInput] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<Market>('us');
  const [scanLoading, setScanLoading] = useState(false);

  // Table sort
  const [sortField, setSortField] = useState<'opportunity' | 'cps' | 'gap' | 'theirPos' | 'ourPos'>('opportunity');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter
  const [gapTypeFilter, setGapTypeFilter] = useState<'all' | 'missing' | 'behind' | 'ahead' | 'tied'>('all');

  // Action states
  const [creatingDraft, setCreatingDraft] = useState<string | null>(null);
  const [bridging, setBridging] = useState<string | null>(null);

  // Draft panel expanded
  const [showDrafts, setShowDrafts] = useState(initialData.drafts.length > 0);

  // Generate & Publish
  const [generatingPage, setGeneratingPage] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<GeneratePageResult | null>(null);

  // ── Filter & Sort ──────────────────────────────────────

  const filtered = results.filter((r) => {
    if (gapTypeFilter !== 'all' && r.gapType !== gapTypeFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'opportunity':
        cmp = a.opportunityScore - b.opportunityScore;
        break;
      case 'cps':
        cmp = a.cpsScore - b.cpsScore;
        break;
      case 'gap':
        cmp = (a.gap ?? 999) - (b.gap ?? 999);
        break;
      case 'theirPos':
        cmp = (a.competitorPosition ?? 999) - (b.competitorPosition ?? 999);
        break;
      case 'ourPos':
        cmp = (a.ownPosition ?? 999) - (b.ownPosition ?? 999);
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  // ── Handlers ───────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (!domainInput.trim()) return;
    setScanLoading(true);
    try {
      const result = await analyzeKeywordGap(domainInput.trim(), selectedMarket);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setResults(result.results);
      setScansRemaining((prev) => Math.max(0, prev - result.scanned));

      // Rebuild category summary client-side
      const catMap = new Map<string, { total: number; missing: number; behind: number; oppSum: number }>();
      for (const r of result.results) {
        const existing = catMap.get(r.category) || { total: 0, missing: 0, behind: 0, oppSum: 0 };
        existing.total++;
        if (r.gapType === 'missing') existing.missing++;
        if (r.gapType === 'behind') existing.behind++;
        existing.oppSum += r.opportunityScore;
        catMap.set(r.category, existing);
      }
      const newSummary: GapCategorySummary[] = Array.from(catMap.entries())
        .map(([category, data]) => ({
          category,
          totalGaps: data.total,
          missingCount: data.missing,
          behindCount: data.behind,
          avgOpportunity: data.total > 0 ? Math.round((data.oppSum / data.total) * 10) / 10 : 0,
        }))
        .sort((a, b) => b.avgOpportunity - a.avgOpportunity);
      setCategorySummary(newSummary);

      toast.success(
        `Gap-Analyse abgeschlossen: ${result.scanned} Keywords gescannt, ${result.results.length} Gaps gefunden.`,
        { duration: 5000 },
      );
    } catch {
      toast.error('Gap-Analyse fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setScanLoading(false);
    }
  }, [domainInput, selectedMarket]);

  const handleCreateDraft = useCallback(async (gap: GapResult) => {
    setCreatingDraft(gap.keyword);
    try {
      const result = await createShadowDraft(gap.keyword, gap.market, gap.category, gap.competitorDomain);
      if (result.success && result.draft) {
        setDrafts((prev) => [result.draft!, ...prev]);
        setShowDrafts(true);
        toast.success(`Shadow-Draft erstellt: "${result.draft.title}"`);
      } else {
        toast.error(`Draft-Erstellung fehlgeschlagen: ${result.error}`);
      }
    } catch {
      toast.error('Draft-Erstellung fehlgeschlagen.');
    } finally {
      setCreatingDraft(null);
    }
  }, []);

  const handleBridge = useCallback(async (gap: GapResult) => {
    setBridging(gap.keyword);
    try {
      const result = await bridgeTheGap(gap.keyword, gap.market, gap.category);
      if (result.success) {
        toast.success(`Freshness Boost für "${gap.keyword}" eingeleitet.`);
      } else {
        toast.error(`Bridge fehlgeschlagen: ${result.error}`);
      }
    } catch {
      toast.error('Bridge the Gap fehlgeschlagen.');
    } finally {
      setBridging(null);
    }
  }, []);

  const handleDiscardDraft = useCallback(async (draftId: string) => {
    const result = await discardDraft(draftId);
    if (result.success) {
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      toast.success('Draft verworfen.');
    }
  }, []);

  const handleCopyMdx = useCallback(async (draft: GapDraft) => {
    if (draft.mdxSkeleton) {
      await navigator.clipboard.writeText(draft.mdxSkeleton);
      toast.success('MDX-Skeleton in Zwischenablage kopiert.');
    }
  }, []);

  const handleGenerateAndPublish = useCallback(async (gap: GapResult) => {
    setGeneratingPage(gap.keyword);
    setPublishResult(null);
    try {
      const result = await generateAndPublishPage(gap.keyword, gap.market as Market, gap.category);
      setPublishResult(result);
      if (result.success) {
        toast.success(`Seite erstellt: ${result.slug}`, { duration: 8000 });
        // Update draft list if a draft was auto-published
        setDrafts((prev) =>
          prev.map((d) =>
            d.keyword === gap.keyword && d.market === gap.market
              ? { ...d, status: 'published' as const }
              : d,
          ),
        );
      } else {
        toast.error(`Seitenerstellung fehlgeschlagen: ${result.error}`);
      }
    } catch {
      toast.error('Generate & Publish fehlgeschlagen.');
    } finally {
      setGeneratingPage(null);
    }
  }, []);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'theirPos' || field === 'ourPos');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  };

  // ── Chart data ─────────────────────────────────────────

  const chartData = categorySummary.map((c) => ({
    category: c.category.replace('personal-finance', 'Pers. Finance').replace('business-banking', 'Biz Banking').replace('ai-tools', 'AI Tools'),
    opportunity: c.avgOpportunity,
    gaps: c.totalGaps,
    missing: c.missingCount,
  }));

  // ── Stats ──────────────────────────────────────────────

  const totalGaps = results.filter((r) => r.gapType === 'missing' || r.gapType === 'behind').length;
  const avgOpportunity = results.length > 0
    ? Math.round((results.reduce((s, r) => s + r.opportunityScore, 0) / results.length) * 10) / 10
    : 0;
  const highPriorityCount = results.filter((r) => r.opportunityScore >= 70).length;
  const activeDrafts = drafts.filter((d) => d.status === 'draft').length;

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Serper Warning */}
      {!initialData.serperConfigured && (
        <div className="rounded-xl p-5 border border-amber-200" style={{ background: 'rgba(251,191,36,0.05)' }}>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-amber-200" style={{ background: 'rgba(251,191,36,0.12)' }}>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Serper.dev nicht verbunden</h3>
              <p className="text-sm text-slate-500">
                Setze <code className="text-xs text-amber-600 px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(251,191,36,0.08)' }}>SERPER_API_KEY</code> in deiner <code className="text-xs text-amber-600 px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(251,191,36,0.08)' }}>.env</code> für Gap Analysis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Input Panel */}
      <GlassCard>
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <Crosshair className="h-5 w-5 text-violet-500" />
            <div>
              <h3 className="font-semibold text-slate-800">Gap Analysis starten</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vergleiche Konkurrenz-Keywords mit deinem Content — finde fehlende und schwache Positionen
              </p>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">Daily Scans</span>
              <span
                className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded ${
                  scansRemaining > 20 ? 'text-emerald-600' : scansRemaining > 5 ? 'text-amber-600' : 'text-rose-600'
                }`}
                style={{
                  background: scansRemaining > 20
                    ? 'rgba(52,211,153,0.12)'
                    : scansRemaining > 5
                      ? 'rgba(251,191,36,0.12)'
                      : 'rgba(251,113,133,0.12)',
                }}
              >
                {scansRemaining} verbleibend
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="nerdwallet.com, investopedia.com, ..."
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all"
              />
            </div>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value as Market)}
              className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              {MARKETS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.flag} {m.code.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              onClick={handleAnalyze}
              disabled={scanLoading || !domainInput.trim() || !initialData.serperConfigured || scansRemaining <= 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}
            >
              {scanLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {scanLoading ? 'Analysiere...' : 'Analyze Gaps'}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Content Gaps" value={totalGaps} icon={Target} color="rose" />
        <StatCard label="Avg Opportunity" value={avgOpportunity > 0 ? avgOpportunity.toFixed(1) : '\u2014'} icon={Gauge} color="amber" />
        <StatCard label="High Priority" value={highPriorityCount} icon={TrendingUp} color="emerald" />
        <StatCard label="Shadow Drafts" value={activeDrafts} icon={FileCode} color="violet" />
      </div>

      {/* Category Gap Chart + Summary side by side */}
      {categorySummary.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-violet-500" />
              <p className="text-sm font-medium text-slate-700">Opportunity by Category</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} strokeOpacity={0.3} vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 10, fill: CHART_COLORS.text }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: CHART_COLORS.text }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_COLORS.tooltip.bg,
                    border: `1px solid ${CHART_COLORS.tooltip.border}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: CHART_COLORS.tooltip.text,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                  formatter={(value) => {
                    const v = typeof value === 'number' ? value : 0;
                    return [`${v.toFixed(1)}`, 'Avg Opportunity'];
                  }}
                />
                <Bar dataKey="opportunity" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Category Summary Table */}
          <GlassCard>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-500" />
              <p className="text-sm font-medium text-slate-700">Category Breakdown</p>
            </div>
            <div className="p-4 space-y-2">
              {categorySummary.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 capitalize">
                      {cat.category.replace('-', ' ')}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {cat.totalGaps} keywords &middot; {cat.missingCount} missing &middot; {cat.behindCount} behind
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <OpportunityBadge score={cat.avgOpportunity} />
                  </div>
                  {/* Opportunity bar */}
                  <div className="w-20 h-2 rounded-full overflow-hidden shrink-0" style={{ background: 'rgba(100,116,139,0.1)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, cat.avgOpportunity)}%`,
                        background:
                          cat.avgOpportunity >= 70
                            ? 'linear-gradient(90deg, #34d399, #22d3ee)'
                            : cat.avgOpportunity >= 50
                              ? 'linear-gradient(90deg, #fbbf24, #f97316)'
                              : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                      }}
                    />
                  </div>
                </div>
              ))}
              {categorySummary.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-600">
                  No gap data — run an analysis first
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Gap Results Matrix */}
      <GlassCard>
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-500" />
            <div>
              <h3 className="font-semibold text-slate-800">Keyword Gap Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {sorted.length} keywords &middot; Sorted by {sortField === 'opportunity' ? 'Opportunity Score' : sortField.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex-1" />

          {/* Gap Type Filter */}
          <div className="flex items-center gap-1">
            {(['all', 'missing', 'behind', 'ahead', 'tied'] as const).map((type) => {
              const count = type === 'all'
                ? results.length
                : results.filter((r) => r.gapType === type).length;
              const config = type !== 'all' ? GAP_TYPE_CONFIG[type] : null;

              return (
                <button
                  key={type}
                  onClick={() => setGapTypeFilter(type)}
                  className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all border ${
                    gapTypeFilter === type
                      ? config ? `${config.color} border-current/30` : 'text-violet-600 border-violet-400'
                      : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                  style={{
                    background: gapTypeFilter === type
                      ? config ? config.bg : 'rgba(139,92,246,0.06)'
                      : 'transparent',
                  }}
                >
                  {type === 'all' ? 'All' : config?.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {sorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Keyword</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Type</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 w-20" onClick={() => handleSort('opportunity')}>
                    Opp <SortIcon field="opportunity" />
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 w-16" onClick={() => handleSort('cps')}>
                    CPS <SortIcon field="cps" />
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 w-20" onClick={() => handleSort('theirPos')}>
                    Their Pos <SortIcon field="theirPos" />
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 w-20" onClick={() => handleSort('ourPos')}>
                    Our Pos <SortIcon field="ourPos" />
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 w-14" onClick={() => handleSort('gap')}>
                    Gap <SortIcon field="gap" />
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 50).map((gap) => {
                  const typeConfig = GAP_TYPE_CONFIG[gap.gapType];
                  const TypeIcon = typeConfig.icon;
                  const isCreatingDraft = creatingDraft === gap.keyword;
                  const isBridging = bridging === gap.keyword;
                  const isGenerating = generatingPage === gap.keyword;

                  return (
                    <tr
                      key={`${gap.keyword}-${gap.market}`}
                      className="transition-colors border-b border-slate-100 hover:bg-slate-50"
                      style={{
                        background: gap.opportunityScore >= 80
                          ? 'rgba(52,211,153,0.04)'
                          : gap.opportunityScore >= 60
                            ? 'rgba(251,191,36,0.03)'
                            : 'transparent',
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{gap.keyword}</p>
                          <span className="text-[10px] text-slate-500">{gap.category} &middot; {gap.competitorDomain}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${typeConfig.color}`}
                          style={{ background: typeConfig.bg }}
                        >
                          <TypeIcon className="h-2.5 w-2.5" />
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <OpportunityBadge score={gap.opportunityScore} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-xs tabular-nums text-slate-500">{gap.cpsScore.toFixed(1)}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <PositionBadge position={gap.competitorPosition} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <PositionBadge position={gap.ownPosition} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        {gap.gap !== null ? (
                          <span className={`text-xs tabular-nums font-medium ${
                            gap.gap > 0 ? 'text-rose-600' : gap.gap < 0 ? 'text-emerald-600' : 'text-slate-400'
                          }`}>
                            {gap.gap > 0 ? `+${gap.gap}` : gap.gap}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">&mdash;</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Create Shadow-Draft */}
                          {gap.gapType === 'missing' && (
                            <button
                              onClick={() => handleCreateDraft(gap)}
                              disabled={isCreatingDraft || isGenerating}
                              className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-lg border border-violet-300 text-violet-600 transition-all hover:border-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ background: 'rgba(139,92,246,0.08)' }}
                              title="Create Shadow-Draft"
                            >
                              {isCreatingDraft ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <FileText className="h-2.5 w-2.5" />}
                              Draft
                            </button>
                          )}
                          {/* Generate & Publish */}
                          {gap.gapType === 'missing' && (
                            <button
                              onClick={() => handleGenerateAndPublish(gap)}
                              disabled={isGenerating || isCreatingDraft}
                              className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-lg border border-emerald-300 text-emerald-600 transition-all hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ background: 'rgba(52,211,153,0.08)' }}
                              title="Generate & Publish — AI Content Brief → MDX → Freshness Boost"
                            >
                              {isGenerating ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Rocket className="h-2.5 w-2.5" />}
                              Publish
                            </button>
                          )}
                          {/* Bridge the Gap */}
                          {gap.gapType === 'behind' && (
                            <button
                              onClick={() => handleBridge(gap)}
                              disabled={isBridging}
                              className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-lg border border-amber-300 text-amber-600 transition-all hover:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ background: 'rgba(251,191,36,0.08)' }}
                              title="Bridge the Gap — Freshness Boost"
                            >
                              {isBridging ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Zap className="h-2.5 w-2.5" />}
                              Bridge
                            </button>
                          )}
                          {/* Ahead or Tied — no action needed */}
                          {(gap.gapType === 'ahead' || gap.gapType === 'tied') && (
                            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                              <TrendingUp className="h-2.5 w-2.5" /> OK
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Crosshair className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm text-slate-400 mb-1">No gap data yet</p>
            <p className="text-xs text-slate-600">Enter a competitor domain and click &quot;Analyze Gaps&quot;</p>
          </div>
        )}
      </GlassCard>

      {/* Shadow Drafts Panel */}
      <GlassCard>
        <button
          onClick={() => setShowDrafts(!showDrafts)}
          className="w-full px-6 py-4 border-b border-slate-200 flex items-center gap-2 text-left transition-colors hover:bg-slate-50"
        >
          <FileCode className="h-5 w-5 text-violet-500" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">
              Shadow Drafts
              {activeDrafts > 0 && (
                <span
                  className="ml-2 text-[10px] font-bold text-violet-600 px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(139,92,246,0.1)' }}
                >
                  {activeDrafts}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">MDX-Skeletons für fehlende Keywords</p>
          </div>
          {showDrafts ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {showDrafts && (
          <div className="p-4 space-y-2">
            {drafts.filter((d) => d.status === 'draft').length > 0 ? (
              drafts
                .filter((d) => d.status === 'draft')
                .map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-start gap-3 px-4 py-3 rounded-lg border border-slate-200"
                  >
                    <FileText className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{draft.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {draft.keyword} &middot; {draft.market.toUpperCase()} &middot; {draft.category}
                        {draft.competitorDomain && ` &middot; vs ${draft.competitorDomain}`}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5 font-mono truncate">{draft.slug}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <OpportunityBadge score={draft.opportunityScore} />
                      <button
                        onClick={() => handleCopyMdx(draft)}
                        className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                        title="Copy MDX to clipboard"
                      >
                        <Copy className="h-3 w-3 text-slate-400 hover:text-violet-500" />
                      </button>
                      <button
                        onClick={() => handleDiscardDraft(draft.id)}
                        className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                        title="Discard draft"
                      >
                        <Trash2 className="h-3 w-3 text-slate-400 hover:text-rose-500" />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-8 text-center">
                <FileCode className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-600">
                  No drafts yet — click &quot;Draft&quot; on missing keywords to generate MDX skeletons
                </p>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Generate & Publish Result Panel */}
      {publishResult && (
        <GlassCard>
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            {publishResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">
                {publishResult.success ? 'Seite erfolgreich erstellt' : 'Seitenerstellung fehlgeschlagen'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {publishResult.success
                  ? `${publishResult.filePath} — Freshness Boost eingeleitet`
                  : publishResult.error}
              </p>
            </div>
            <button
              onClick={() => setPublishResult(null)}
              className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
              title="Schließen"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>

          {publishResult.success && (
            <div className="p-4 space-y-4">
              {/* Generated Brief Overview */}
              {publishResult.brief && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">AI Content Brief</p>
                  </div>
                  <div
                    className="px-4 py-3 rounded-lg border border-slate-200"
                  >
                    <p className="text-sm font-medium text-slate-800 mb-1">{publishResult.brief.suggestedTitle}</p>
                    <p className="text-xs text-slate-500 mb-2">{publishResult.brief.suggestedDescription}</p>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className="text-[10px] font-medium text-violet-600 px-2 py-0.5 rounded"
                        style={{ background: 'rgba(139,92,246,0.12)' }}
                      >
                        {publishResult.brief.suggestedOutline.length} Sections
                      </span>
                      <span
                        className="text-[10px] font-medium text-cyan-600 px-2 py-0.5 rounded"
                        style={{ background: 'rgba(34,211,238,0.12)' }}
                      >
                        ~{publishResult.brief.targetWordCount} Words
                      </span>
                      <span
                        className="text-[10px] font-medium text-amber-600 px-2 py-0.5 rounded"
                        style={{ background: 'rgba(251,191,36,0.12)' }}
                      >
                        {publishResult.brief.competitorOutlines.length} Competitors analyzed
                      </span>
                    </div>
                  </div>

                  {/* Section Outline */}
                  <div className="space-y-1">
                    {publishResult.brief.suggestedOutline.map((section, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${
                          section.tag === 'h3' ? 'ml-4' : ''
                        }`}
                      >
                        <span className="text-[10px] text-slate-600 font-mono shrink-0">{section.tag}</span>
                        <span className="text-slate-700 flex-1 truncate">{section.title}</span>
                        <span className="text-[10px] text-slate-600 tabular-nums shrink-0">~{section.estimatedWords}w</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Hints */}
              {publishResult.imageHints.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-amber-500" />
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Fehlende Bilder ({publishResult.imageHints.length})
                    </p>
                  </div>
                  <div
                    className="rounded-lg border border-amber-200 p-4"
                    style={{ background: 'rgba(251,191,36,0.05)' }}
                  >
                    <p className="text-xs text-amber-700 mb-3">
                      Bitte lade folgende Bilder hoch, um die Seite zu vervollständigen:
                    </p>
                    <div className="space-y-2">
                      {publishResult.imageHints.map((img, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 px-3 py-2 rounded border border-slate-200"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-slate-800">{img.filename}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{img.purpose}</p>
                          </div>
                          <span
                            className="text-[10px] font-medium text-slate-500 px-1.5 py-0.5 rounded shrink-0"
                            style={{ background: 'rgba(100,116,139,0.06)' }}
                          >
                            {img.dimensions}
                          </span>
                        </div>
                      ))}
                    </div>
                    {publishResult.slug && (
                      <p className="text-[10px] text-slate-600 mt-3 font-mono">
                        📁 public/images/content{publishResult.slug}/
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      )}

      {/* Global Generation Loading Overlay */}
      {generatingPage && (
        <div
          className="rounded-xl border border-violet-200 p-6"
          style={{ background: 'rgba(139,92,246,0.05)' }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl border border-violet-200 flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.08)' }}>
                <Loader2 className="h-6 w-6 text-violet-600 animate-spin" />
              </div>
              <Sparkles className="h-3.5 w-3.5 text-violet-600 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Seite wird generiert...</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AI Content Brief → MDX Template → Freshness Boost für &quot;{generatingPage}&quot;
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] text-violet-600 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Competitor Headings scraped
                </span>
                <span className="text-[10px] text-slate-600">→</span>
                <span className="text-[10px] text-cyan-600 flex items-center gap-1">
                  <Rocket className="h-2.5 w-2.5" /> AI Brief wird generiert
                </span>
                <span className="text-[10px] text-slate-600">→</span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <FileCode className="h-2.5 w-2.5" /> MDX wird geschrieben
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

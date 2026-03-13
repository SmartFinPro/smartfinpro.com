'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Loader2,
  RefreshCw,
  ChevronDown,
  BarChart3,
  DollarSign,
  Eye,
  ArrowUpRight,
  Sparkles,
  Globe,
  Code2,
  Clock,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';

// ════════════════════════════════════════════════════════════════
// AI-OPTIMIZATION CENTER — Chat Interface
//
// Interactive chat-style UI showing AI optimization suggestions
// with one-click approve/dismiss and background execution.
// ════════════════════════════════════════════════════════════════

export interface OptTask {
  id: string;
  slug: string;
  market: string;
  category: string | null;
  taskType: 'underperformer' | 'efficiency_gap' | 'market_trend' | 'cta_wording' | 'general';
  observation: string;
  suggestionText: string;
  deltaCode: string | null;
  aiReasoning: string | null;
  traffic24h: number;
  emeraldCtr: number;
  violetCtr: number;
  currentCpa: number;
  potentialUplift: number;
  status: 'pending' | 'approved' | 'executing' | 'applied' | 'failed' | 'dismissed';
  intervalType: string;
  appliedAt: string | null;
  indexedAt: string | null;
  createdAt: string;
}

type IntervalType = 'weekly' | 'biweekly' | 'monthly' | 'manual';

interface OptimizationChatProps {
  initialTasks: OptTask[];
  historyTasks: OptTask[];
}

// ── Task type config ─────────────────────────────────────────

const TASK_TYPE_CONFIG: Record<string, { icon: typeof TrendingDown; label: string; color: string; bgColor: string }> = {
  underperformer: { icon: TrendingDown, label: 'Underperformer', color: '#ea580c', bgColor: '#fff7ed' },
  efficiency_gap: { icon: AlertTriangle, label: 'Efficiency Gap', color: '#d97706', bgColor: '#fffbeb' },
  market_trend: { icon: TrendingUp, label: 'Market Trend', color: '#0891b2', bgColor: '#ecfeff' },
  cta_wording: { icon: Zap, label: 'CTA Wording', color: '#7c3aed', bgColor: '#f5f3ff' },
  general: { icon: Sparkles, label: 'General', color: '#64748b', bgColor: '#f8fafc' },
};

const MARKET_FLAGS: Record<string, string> = {
  us: '\u{1F1FA}\u{1F1F8}',
  uk: '\u{1F1EC}\u{1F1E7}',
  ca: '\u{1F1E8}\u{1F1E6}',
  au: '\u{1F1E6}\u{1F1FA}',
};

// ── Chat Message Component ──────────────────────────────────

function ChatMessage({
  task,
  onApprove,
  onDismiss,
  isExecuting,
}: {
  task: OptTask;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  isExecuting: boolean;
}) {
  const [showDelta, setShowDelta] = useState(false);
  const config = TASK_TYPE_CONFIG[task.taskType] || TASK_TYPE_CONFIG.general;
  const TypeIcon = config.icon;

  const isActionable = task.status === 'pending';
  const isApplied = task.status === 'applied';
  const isDismissed = task.status === 'dismissed';
  const isFailed = task.status === 'failed';
  const isRunning = task.status === 'executing' || isExecuting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex gap-3"
    >
      {/* Bot Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 bg-violet-50 border border-violet-200"
      >
        <Bot className="h-4.5 w-4.5 text-violet-500" />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-2.5">
        {/* Header — Slug + Type Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-600 font-mono">{new Date(task.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ background: config.bgColor, color: config.color }}
          >
            <TypeIcon className="h-3 w-3" />
            {config.label}
          </span>
          {isApplied && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 bg-emerald-50">
              <Check className="h-3 w-3" /> Applied
            </span>
          )}
          {isDismissed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 bg-slate-100">
              Dismissed
            </span>
          )}
          {isFailed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-red-600 bg-red-50">
              Failed
            </span>
          )}
        </div>

        {/* Analysis Target */}
        <div
          className="rounded-xl p-4 bg-white border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs text-slate-500">Analyse abgeschlossen fuer:</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">{MARKET_FLAGS[task.market] || '\u{1F30D}'}</span>
            <code className="text-sm font-semibold text-cyan-600">{task.slug}</code>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="rounded-lg p-2 text-center bg-slate-50">
              <Eye className="h-3 w-3 text-slate-500 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-800 tabular-nums">{task.traffic24h}</p>
              <p className="text-[9px] text-slate-500">Clicks</p>
            </div>
            <div className="rounded-lg p-2 text-center bg-emerald-50">
              <BarChart3 className="h-3 w-3 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs font-bold text-emerald-600 tabular-nums">{task.emeraldCtr.toFixed(1)}%</p>
              <p className="text-[9px] text-slate-500">Emerald</p>
            </div>
            <div className="rounded-lg p-2 text-center bg-violet-50">
              <BarChart3 className="h-3 w-3 text-violet-500 mx-auto mb-1" />
              <p className="text-xs font-bold text-violet-600 tabular-nums">{task.violetCtr.toFixed(1)}%</p>
              <p className="text-[9px] text-slate-500">Violet</p>
            </div>
            <div className="rounded-lg p-2 text-center bg-cyan-50">
              <DollarSign className="h-3 w-3 text-cyan-500 mx-auto mb-1" />
              <p className="text-xs font-bold text-cyan-600 tabular-nums">${task.currentCpa}</p>
              <p className="text-[9px] text-slate-500">CPA</p>
            </div>
          </div>

          {/* Observation */}
          <div className="rounded-lg p-3 mb-3 bg-orange-50 border border-orange-200">
            <p className="text-xs text-orange-700 font-semibold mb-1">Beobachtung:</p>
            <p className="text-xs text-slate-600 leading-relaxed">{task.observation}</p>
          </div>

          {/* Suggestion */}
          <div className="rounded-lg p-3 bg-emerald-50 border border-emerald-200">
            <p className="text-xs text-emerald-600 font-semibold mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Vorschlag:
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">{task.suggestionText}</p>
          </div>

          {/* AI Reasoning (collapsible) */}
          {task.aiReasoning && (
            <details className="mt-2 group">
              <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-700 transition-colors flex items-center gap-1">
                <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                AI-Reasoning anzeigen
              </summary>
              <p className="text-[11px] text-slate-500 mt-2 pl-4 leading-relaxed italic">{task.aiReasoning}</p>
            </details>
          )}

          {/* Delta Code Preview */}
          {task.deltaCode && (
            <div className="mt-3">
              <button
                onClick={() => setShowDelta(!showDelta)}
                className="flex items-center gap-1.5 text-[10px] text-violet-600 hover:text-violet-700 transition-colors"
              >
                <Code2 className="h-3 w-3" />
                {showDelta ? 'Code-Patch verbergen' : 'Code-Patch anzeigen'}
              </button>
              <AnimatePresence>
                {showDelta && (
                  <motion.pre
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 p-3 rounded-lg text-[10px] leading-relaxed text-slate-600 font-mono overflow-x-auto bg-slate-100 border border-slate-200"
                  >
                    {task.deltaCode}
                  </motion.pre>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Uplift Badge */}
          {task.potentialUplift > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-slate-500">Geschaetzter Revenue-Uplift:</span>
              <span className="text-xs font-bold text-emerald-400">+{task.potentialUplift.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isActionable && (
          <div className="flex gap-2">
            <button
              onClick={() => onDismiss(task.id)}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Ablehnen
            </button>
            <button
              onClick={() => onApprove(task.id)}
              disabled={isRunning}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{
                background: isRunning
                  ? '#e2e8f0'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: isRunning ? 'none' : '0 0 20px rgba(16, 185, 129, 0.15)',
              }}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Wird angewendet...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Optimierung anwenden
                  <ArrowUpRight className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Applied Status */}
        {isApplied && (
          <div className="flex items-center gap-2 text-[10px]">
            <Check className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-500">Angewendet {task.appliedAt ? new Date(task.appliedAt).toLocaleString('de-DE') : ''}</span>
            {task.indexedAt && (
              <>
                <Globe className="h-3 w-3 text-cyan-400 ml-2" />
                <span className="text-cyan-500">Indexiert</span>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Chat Component ─────────────────────────────────────

export function OptimizationChat({ initialTasks, historyTasks }: OptimizationChatProps) {
  const [tasks, setTasks] = useState<OptTask[]>(initialTasks);
  const [history, setHistory] = useState<OptTask[]>(historyTasks);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interval, setInterval] = useState<IntervalType>('weekly');
  const [showHistory, setShowHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tasks.length]);

  const handleApprove = useCallback(async (taskId: string) => {
    if (executingId) return;
    setExecutingId(taskId);

    try {
      const res = await fetch('/api/dashboard/optimization-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', taskId }),
      });
      const result = await res.json();

      if (result.success) {
        toast.success(`Optimierung angewendet: ${result.slug}`);
        setTasks((prev) =>
          prev.map((t) => t.id === taskId ? { ...t, status: 'applied' as const, appliedAt: new Date().toISOString() } : t)
        );
      } else {
        toast.error(`Fehler: ${result.error}`);
        setTasks((prev) =>
          prev.map((t) => t.id === taskId ? { ...t, status: 'failed' as const } : t)
        );
      }
    } catch {
      toast.error('Ausfuehrung fehlgeschlagen');
    } finally {
      setExecutingId(null);
    }
  }, [executingId]);

  const handleDismiss = useCallback(async (taskId: string) => {
    try {
      const res = await fetch('/api/dashboard/optimization-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', taskId }),
      });
      const result = await res.json();
      if (result.success === false) throw new Error(result.error);
      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, status: 'dismissed' as const } : t)
      );
      toast('Vorschlag abgelehnt');
    } catch {
      toast.error('Ablehnung fehlgeschlagen');
    }
  }, []);

  const handleRunAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/dashboard/optimization-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', intervalType: interval }),
      });
      const result = await res.json();

      if (result.success && result.tasks.length > 0) {
        // Map the server types to our UI format
        const newTasks: OptTask[] = result.tasks.map((t: OptTask) => ({
          ...t,
          category: t.category,
        }));
        setTasks((prev) => [...newTasks, ...prev]);
        toast.success(`${result.tasksCreated} neue Vorschlaege generiert`);
      } else if (result.success) {
        toast('Keine neuen Optimierungen gefunden', { description: 'Alle Seiten performen gut!' });
      } else {
        toast.error(`Analyse fehlgeschlagen: ${result.error}`);
      }
    } catch {
      toast.error('Analyse-Engine Fehler');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, interval]);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const appliedCount = tasks.filter((t) => t.status === 'applied').length + history.filter((t) => t.status === 'applied').length;

  return (
    <div className="flex flex-col h-full">
      {/* Controls Bar */}
      <div
        className="flex items-center justify-between gap-4 p-4 rounded-xl mb-4 bg-white border border-slate-200"
      >
        <div className="flex items-center gap-4">
          {/* Interval Selector */}
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Interval:</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-200">
              {(['weekly', 'biweekly', 'monthly'] as IntervalType[]).map((iv) => (
                <button
                  key={iv}
                  onClick={() => setInterval(iv)}
                  className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                    interval === iv ? 'bg-violet-50 text-violet-600' : 'text-slate-500'
                  }`}
                >
                  {iv === 'weekly' ? '7d' : iv === 'biweekly' ? '14d' : '30d'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-slate-500">
              <span className="font-bold text-violet-400">{pendingCount}</span> ausstehend
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">
              <span className="font-bold text-emerald-400">{appliedCount}</span> angewendet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 transition-all hover:text-slate-700"
          >
            <Clock className="h-3 w-3" />
            {showHistory ? 'Aktuell' : 'Verlauf'}
          </button>

          {/* Analyze Button */}
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{
              background: isAnalyzing
                ? '#e2e8f0'
                : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              boxShadow: isAnalyzing ? 'none' : '0 0 20px rgba(139, 92, 246, 0.15)',
            }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analysiere...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Neue Analyse
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        className="flex-1 overflow-y-auto space-y-5 p-4 rounded-xl bg-slate-50 border border-slate-200"
        style={{
          minHeight: '400px',
          maxHeight: 'calc(100vh - 320px)',
        }}
      >
        {/* System Welcome Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 items-start"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-violet-50 border border-violet-200"
          >
            <Sparkles className="h-4.5 w-4.5 text-violet-500" />
          </div>
          <div
            className="rounded-xl p-3 bg-violet-50 border border-violet-200"
          >
            <p className="text-xs text-slate-600">
              <span className="font-semibold text-violet-600">AI-Optimizer bereit.</span>{' '}
              Klicke &quot;Neue Analyse&quot; um die {interval === 'weekly' ? '7-Tage' : interval === 'biweekly' ? '14-Tage' : '30-Tage'} Performance zu scannen und Optimierungen vorzuschlagen.
            </p>
          </div>
        </motion.div>

        {/* Analyzing Animation */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-3 items-start"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-violet-50 border border-violet-200">
                <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
              </div>
              <div className="rounded-xl p-3 bg-violet-50 border border-violet-200">
                <p className="text-xs text-slate-600">
                  <span className="text-violet-600 font-semibold">Analyse laeuft...</span> CTA-Clicks auswerten, Affiliate-Raten abgleichen, MDX-Inhalte scannen...
                </p>
                <div className="flex gap-1 mt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-violet-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Messages */}
        <AnimatePresence mode="popLayout">
          {(showHistory ? [...history, ...tasks] : tasks).map((task) => (
            <ChatMessage
              key={task.id}
              task={task}
              onApprove={handleApprove}
              onDismiss={handleDismiss}
              isExecuting={executingId === task.id}
            />
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {tasks.length === 0 && !isAnalyzing && !showHistory && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3 opacity-60">
            <Bot className="h-12 w-12 text-slate-400" />
            <p className="text-sm text-slate-500">Noch keine Optimierungsvorschlaege.</p>
            <p className="text-xs text-slate-500">Klicke &quot;Neue Analyse&quot; um zu starten.</p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Play,
  Loader2,
  Globe,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MARKET_RULES, getComplianceLabel, type MarketRule } from '@/lib/affiliate/compliance-labels';
import type { Market, Category } from '@/types';
import type { AuditResult, AuditDetail } from '@/lib/actions/compliance-audit';

// ── Constants ───────────────────────────────────────────────

const MARKETS: { code: Market; flag: string; name: string }[] = [
  { code: 'us', flag: '\ud83c\uddfa\ud83c\uddf8', name: 'United States' },
  { code: 'uk', flag: '\ud83c\uddec\ud83c\udde7', name: 'United Kingdom' },
  { code: 'ca', flag: '\ud83c\udde8\ud83c\udde6', name: 'Canada' },
  { code: 'au', flag: '\ud83c\udde6\ud83c\uddfa', name: 'Australia' },
];

const CATEGORIES: { code: Category; label: string }[] = [
  { code: 'trading', label: 'Trading' },
  { code: 'forex', label: 'Forex' },
  { code: 'personal-finance', label: 'Personal Finance' },
  { code: 'business-banking', label: 'Business Banking' },
  { code: 'ai-tools', label: 'AI Tools' },
  { code: 'cybersecurity', label: 'Cybersecurity' },
  { code: 'credit-repair', label: 'Credit Repair' },
  { code: 'debt-relief', label: 'Debt Relief' },
  { code: 'credit-score', label: 'Credit Score' },
  { code: 'remortgaging', label: 'Remortgaging' },
  { code: 'cost-of-living', label: 'Cost of Living' },
  { code: 'savings', label: 'Savings' },
  { code: 'superannuation', label: 'Superannuation' },
  { code: 'gold-investing', label: 'Gold Investing' },
  { code: 'tax-efficient-investing', label: 'Tax Investing' },
  { code: 'housing', label: 'Housing' },
];

// ── Helpers ─────────────────────────────────────────────────

function isDefaultLabel(label: string): boolean {
  return label.startsWith('Terms and conditions apply') || label === 'Terms Apply';
}

function getMarketRule(market: Market, category: Category): MarketRule | undefined {
  return MARKET_RULES.find((r) => r.market === market && r.category === category);
}

// ── Stat Card ───────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100 text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100 text-amber-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'bg-rose-100 text-rose-600' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', icon: 'bg-slate-100 text-slate-600' },
  };
  const c = colorMap[color];

  return (
    <div className={`dashboard-card p-5 ${c.bg} border border-slate-200 rounded-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${c.text}`}>{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ── Tooltip Cell ────────────────────────────────────────────

function MatrixCell({
  market,
  category,
  linkCount,
}: {
  market: Market;
  category: Category;
  linkCount: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const label = getComplianceLabel(market, category);
  const rule = getMarketRule(market, category);
  const isDefault = isDefaultLabel(label);

  return (
    <td
      className="relative px-3 py-3 border-b border-slate-100"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-2">
        {isDefault ? (
          <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
        )}
        <span className={`text-xs font-medium ${isDefault ? 'text-amber-600' : 'text-emerald-600'}`}>
          {isDefault ? 'Default' : 'Verified'}
        </span>
        {linkCount > 0 && (
          <span className="ml-auto text-[10px] tabular-nums text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            {linkCount}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 left-0 top-full mt-1 w-80 p-4 bg-white border border-slate-200 rounded-xl shadow-xl">
          <div className="flex items-start gap-2 mb-2">
            {isDefault ? (
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-semibold text-slate-800">
                {MARKETS.find((m) => m.code === market)?.flag}{' '}
                {market.toUpperCase()} / {CATEGORIES.find((c) => c.code === category)?.label}
              </p>
              {rule && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Regulator: {rule.regulator}
                </p>
              )}
            </div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[11px] leading-relaxed text-slate-600">{label}</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-slate-400">
              {linkCount} active {linkCount === 1 ? 'link' : 'links'}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              isDefault
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              {isDefault ? 'Uses default' : 'Category-specific'}
            </span>
          </div>
        </div>
      )}
    </td>
  );
}

// ── Audit Detail Row ────────────────────────────────────────

function AuditDetailRow({ detail }: { detail: AuditDetail }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    compliant: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-500', label: 'Compliant' },
    attention: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500', label: 'Attention' },
    critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle, iconColor: 'text-rose-500', label: 'Critical' },
  };
  const config = statusConfig[detail.status];
  const StatusIcon = config.icon;

  return (
    <div className={`border ${config.border} rounded-lg overflow-hidden transition-all ${expanded ? 'shadow-sm' : ''}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/50 transition-colors`}
      >
        <StatusIcon className={`h-4 w-4 shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-slate-800">{detail.partnerName}</span>
          <span className="text-xs text-slate-400 ml-2">/go/{detail.slug}</span>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          {MARKETS.find((m) => m.code === detail.market)?.flag} {detail.market.toUpperCase()} / {detail.category}
        </span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
          {config.label}
        </span>
        {detail.issues.length > 0 ? (
          expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <div className="w-4" />
        )}
      </button>

      {expanded && detail.issues.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-100 space-y-1.5">
          {detail.issues.map((issue, i) => {
            const severityIcon = {
              critical: <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />,
              warning: <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />,
              info: <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />,
            };
            return (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                {severityIcon[issue.severity]}
                <span>
                  <span className="font-mono text-[10px] text-slate-400 mr-1">[{issue.code}]</span>
                  {issue.message}
                </span>
              </div>
            );
          })}
          <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-400">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{detail.destinationUrl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

interface ComplianceAuditProps {
  linkDistribution: Record<Market, Record<Category, number>>;
}

export function ComplianceAudit({ linkDistribution }: ComplianceAuditProps) {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'compliant' | 'attention' | 'critical'>('all');

  const handleRunAudit = useCallback(async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/dashboard/compliance-audit', { method: 'POST' });
      const result = await res.json();
      setAuditResult(result);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Count matrix stats
  const totalCells = MARKETS.length * CATEGORIES.length;
  const verifiedCells = MARKETS.reduce((acc, m) => {
    return acc + CATEGORIES.reduce((catAcc, c) => {
      const label = getComplianceLabel(m.code, c.code);
      return catAcc + (isDefaultLabel(label) ? 0 : 1);
    }, 0);
  }, 0);

  const filteredDetails = auditResult?.details.filter((d) =>
    filterStatus === 'all' ? true : d.status === filterStatus,
  ) || [];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Compliance Cells"
          value={`${verifiedCells}/${totalCells}`}
          icon={Shield}
          color="slate"
        />
        <StatCard
          label="Verified Labels"
          value={verifiedCells}
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          label="Default Fallbacks"
          value={totalCells - verifiedCells}
          icon={ShieldAlert}
          color={totalCells - verifiedCells > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          label="Audit Issues"
          value={auditResult ? auditResult.attentionLinks + auditResult.criticalLinks : '\u2014'}
          icon={ShieldX}
          color={auditResult && (auditResult.criticalLinks > 0) ? 'rose' : 'slate'}
        />
      </div>

      {/* Compliance Matrix */}
      <div className="dashboard-card bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Globe className="h-5 w-5 text-slate-400" />
          <div>
            <h3 className="font-semibold text-slate-900">Compliance Label Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">Hover over a cell to preview the exact disclaimer text | FCA CCI (Apr 2026) + BNPL (Jul 2026) + EU AI Act checks active</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">
                  Market
                </th>
                {CATEGORIES.map((cat) => (
                  <th
                    key={cat.code}
                    className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {cat.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MARKETS.map((market) => (
                <tr key={market.code} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{market.flag}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{market.code.toUpperCase()}</p>
                        <p className="text-[10px] text-slate-400">{market.name}</p>
                      </div>
                    </div>
                  </td>
                  {CATEGORIES.map((cat) => (
                    <MatrixCell
                      key={`${market.code}-${cat.code}`}
                      market={market.code}
                      category={cat.code}
                      linkCount={linkDistribution[market.code]?.[cat.code] || 0}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Runner */}
      <div className="dashboard-card bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-slate-400" />
            <div>
              <h3 className="font-semibold text-slate-900">Global Compliance Audit</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan all registered affiliate links for compliance issues
              </p>
            </div>
          </div>
          <button
            onClick={handleRunAudit}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Global Compliance Check
              </>
            )}
          </button>
        </div>

        {/* Audit Results */}
        {auditResult && (
          <div className="p-6">
            {/* Result Summary */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-xs text-slate-400">
                Scanned {auditResult.totalLinks} links at{' '}
                {new Date(auditResult.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <div className="flex-1" />
              {(['all', 'compliant', 'attention', 'critical'] as const).map((status) => {
                const counts = {
                  all: auditResult.totalLinks,
                  compliant: auditResult.compliantLinks,
                  attention: auditResult.attentionLinks,
                  critical: auditResult.criticalLinks,
                };
                const colors = {
                  all: 'bg-slate-100 text-slate-700',
                  compliant: 'bg-emerald-50 text-emerald-700',
                  attention: 'bg-amber-50 text-amber-700',
                  critical: 'bg-rose-50 text-rose-700',
                };
                return (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                      filterStatus === status
                        ? `${colors[status]} ring-2 ring-offset-1 ring-slate-300`
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}{' '}
                    ({counts[status]})
                  </button>
                );
              })}
            </div>

            {/* Detail List */}
            {filteredDetails.length > 0 ? (
              <div className="space-y-2">
                {filteredDetails.map((detail) => (
                  <AuditDetailRow key={detail.id} detail={detail} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <ShieldCheck className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  {filterStatus === 'all'
                    ? 'No affiliate links registered yet'
                    : `No links with status "${filterStatus}"`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!auditResult && !isRunning && (
          <div className="py-16 text-center">
            <Shield className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm text-slate-500 mb-1">No audit has been run yet</p>
            <p className="text-xs text-slate-400">
              Click &quot;Run Global Compliance Check&quot; to scan all affiliate links
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

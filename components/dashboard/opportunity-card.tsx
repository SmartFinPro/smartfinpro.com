'use client';
// components/dashboard/opportunity-card.tsx
// Smart-Scan 2026 — Opportunity Card with Trust Score, Revenue Forecast & Actions

import { useState } from 'react';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Rocket,
  Star,
} from 'lucide-react';

export interface Opportunity {
  id: string;
  market: string;
  category: string;
  program_name: string;
  provider_url: string | null;
  trust_score: number | null;
  compliance_status: 'pending' | 'pass' | 'review' | 'fail';
  compliance_flags: string[];
  revenue_forecast_monthly: number | null;
  revenue_confidence: 'low' | 'medium' | 'high';
  draft_slug: string | null;
  draft_title: string | null;
  analysis_notes: string | null;
  status: 'new' | 'reviewing' | 'approved' | 'rejected' | 'published';
  discovered_at: string;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  onStatusChange?: (id: string, status: Opportunity['status']) => void;
}

const TRUST_COLOR = (score: number) => {
  if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const COMPLIANCE_CONFIG = {
  pass:    { icon: CheckCircle2, label: 'Compliant',     color: 'text-green-600 bg-green-50' },
  review:  { icon: AlertTriangle, label: 'Review',       color: 'text-amber-600 bg-amber-50' },
  fail:    { icon: XCircle,       label: 'Non-Compliant', color: 'text-red-600 bg-red-50'    },
  pending: { icon: Clock,         label: 'Pending',       color: 'text-slate-500 bg-slate-50' },
};

const CONFIDENCE_LABEL = {
  low:    '~',
  medium: '≈',
  high:   '≋',
};

const MARKET_FLAG: Record<string, string> = { us: '🇺🇸', uk: '🇬🇧', ca: '🇨🇦', au: '🇦🇺' };

export function OpportunityCard({ opportunity: opp, onStatusChange }: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const trustScore = opp.trust_score ?? 0;
  const compConfig = COMPLIANCE_CONFIG[opp.compliance_status];
  const CompIcon = compConfig.icon;

  async function updateStatus(newStatus: Opportunity['status']) {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/opportunities/${opp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onStatusChange?.(opp.id, newStatus);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Gradient accent bar */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-base">{MARKET_FLAG[opp.market] ?? '🌍'}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wide">
                {opp.category}
              </span>
              {opp.status === 'new' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">
                  New
                </span>
              )}
            </div>
            <h3 className="font-semibold text-[var(--sfp-ink)] text-base leading-tight truncate">
              {opp.program_name}
            </h3>
            {opp.provider_url && (
              <a
                href={opp.provider_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-[var(--sfp-navy)] flex items-center gap-1 mt-0.5 truncate"
              >
                {new URL(opp.provider_url).hostname}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
          </div>

          {/* Trust Score Badge */}
          <div className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 font-bold ${TRUST_COLOR(trustScore)}`}>
            <Star className="w-3.5 h-3.5 mb-0.5" />
            <span className="text-xl leading-none">{trustScore}</span>
            <span className="text-[9px] font-normal opacity-70">/ 10</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Revenue forecast */}
          <div className="rounded-xl p-3" style={{ background: 'var(--sfp-sky)' }}>
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--sfp-navy)' }} />
              <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">Revenue</span>
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--sfp-navy)' }}>
              {CONFIDENCE_LABEL[opp.revenue_confidence]}$
              {opp.revenue_forecast_monthly
                ? opp.revenue_forecast_monthly.toLocaleString('en-US', { maximumFractionDigits: 0 })
                : '—'}
              <span className="text-[9px] font-normal text-slate-500">/mo</span>
            </p>
            <p className="text-[10px] text-slate-400 capitalize">{opp.revenue_confidence} confidence</p>
          </div>

          {/* Compliance */}
          <div className={`rounded-xl p-3 ${compConfig.color}`}>
            <div className="flex items-center gap-1 mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wide font-semibold opacity-70">Compliance</span>
            </div>
            <div className="flex items-center gap-1">
              <CompIcon className="w-3.5 h-3.5" />
              <p className="text-sm font-bold">{compConfig.label}</p>
            </div>
            {opp.compliance_flags.length > 0 && (
              <p className="text-[10px] opacity-70 mt-0.5">{opp.compliance_flags.length} flag{opp.compliance_flags.length > 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Market */}
          <div className="rounded-xl p-3 bg-slate-50">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">Market</span>
            </div>
            <p className="text-sm font-bold text-slate-700 uppercase">{opp.market}</p>
            <p className="text-[10px] text-slate-400">
              {new Date(opp.discovered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </p>
          </div>
        </div>

        {/* Expandable: Notes + Flags */}
        {(opp.analysis_notes || opp.compliance_flags.length > 0) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-3"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide' : 'Show'} analysis
          </button>
        )}

        {expanded && (
          <div className="mb-4 space-y-2">
            {opp.analysis_notes && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3">
                {opp.analysis_notes}
              </p>
            )}
            {opp.compliance_flags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {opp.compliance_flags.map((flag) => (
                  <span key={flag} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 rounded-full border border-red-200">
                    {flag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {opp.status === 'new' || opp.status === 'reviewing' ? (
          <div className="flex gap-2">
            <button
              onClick={() => updateStatus('approved')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: 'var(--sfp-green)' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve
            </button>

            {opp.draft_slug && (
              <a
                href={`/dashboard/content/genesis?slug=${opp.draft_slug}&title=${encodeURIComponent(opp.draft_title ?? '')}&market=${opp.market}`}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-opacity"
                style={{ background: 'var(--sfp-gold)' }}
              >
                <Rocket className="w-3.5 h-3.5" />
                Ready-to-Post
              </a>
            )}

            <button
              onClick={() => updateStatus('rejected')}
              disabled={loading}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className={`text-center text-xs font-semibold py-2 rounded-xl ${
            opp.status === 'approved' ? 'bg-green-50 text-green-700' :
            opp.status === 'rejected' ? 'bg-red-50 text-red-600' :
            'bg-blue-50 text-blue-700'
          }`}>
            {opp.status.charAt(0).toUpperCase() + opp.status.slice(1)}
          </div>
        )}
      </div>
    </div>
  );
}

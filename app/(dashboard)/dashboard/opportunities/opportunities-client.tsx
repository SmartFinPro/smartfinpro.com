'use client';
// app/(dashboard)/dashboard/opportunities/opportunities-client.tsx
// Client component: filterable opportunity card grid + scan trigger

import { useState, useMemo } from 'react';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';
import { OpportunityCard, type Opportunity } from '@/components/dashboard/opportunity-card';

const MARKETS   = ['all', 'us', 'uk', 'ca', 'au'] as const;
const STATUSES  = ['all', 'new', 'reviewing', 'approved', 'rejected'] as const;
const CATEGORIES = ['all', 'trading', 'forex', 'ai-tools', 'cybersecurity', 'personal-finance', 'business-banking'] as const;

interface Props {
  opportunities: Opportunity[];
}

export function OpportunitiesClient({ opportunities: initial }: Props) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initial);
  const [market,   setMarket]   = useState<string>('all');
  const [status,   setStatus]   = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [minTrust, setMinTrust] = useState<number>(1);
  const [scanning, setScanning] = useState(false);
  const [scanMsg,  setScanMsg]  = useState('');

  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      if (market   !== 'all' && o.market   !== market)   return false;
      if (status   !== 'all' && o.status   !== status)   return false;
      if (category !== 'all' && o.category !== category) return false;
      if ((o.trust_score ?? 0) < minTrust)               return false;
      return true;
    });
  }, [opportunities, market, status, category, minTrust]);

  function handleStatusChange(id: string, newStatus: Opportunity['status']) {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
    );
  }

  async function triggerScan() {
    setScanning(true);
    setScanMsg('');
    try {
      const res = await fetch('/api/cron/affiliate-scout', {
        headers: { Authorization: `Bearer ${document.cookie.match(/sfp-dash-auth=([^;]+)/)?.[1] ?? ''}` },
      });
      const data = await res.json() as { saved?: number; discovered?: number; error?: string };
      if (data.error) {
        setScanMsg(`❌ ${data.error}`);
      } else {
        setScanMsg(`✅ ${data.saved ?? 0} neue Opportunities gefunden (${data.discovered ?? 0} gescannt)`);
        // Reload page data after short delay
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      setScanMsg(`❌ ${(err as Error).message}`);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />

          <FilterSelect label="Markt"      value={market}   onChange={setMarket}   options={MARKETS}    />
          <FilterSelect label="Status"     value={status}   onChange={setStatus}   options={STATUSES}   />
          <FilterSelect label="Kategorie"  value={category} onChange={setCategory} options={CATEGORIES} />

          {/* Trust Score filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Trust ≥</span>
            <input
              type="range" min={1} max={10} value={minTrust}
              onChange={(e) => setMinTrust(Number(e.target.value))}
              className="w-20 accent-[var(--sfp-navy)]"
            />
            <span className="text-xs font-bold text-slate-700 w-4">{minTrust}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-slate-400">{filtered.length} Ergebnisse</span>

            <button
              onClick={triggerScan}
              disabled={scanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-60 transition-all"
              style={{ background: 'var(--sfp-navy)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scannt…' : 'Scan jetzt'}
            </button>
          </div>
        </div>

        {scanMsg && (
          <p className="text-xs mt-2 text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{scanMsg}</p>
        )}
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium mb-2">Keine Opportunities gefunden</p>
          <p className="text-sm">
            {opportunities.length === 0
              ? 'Starte den ersten Scan mit dem Button oben.'
              : 'Passe die Filter an oder starte einen neuen Scan.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-[var(--sfp-navy)]"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === 'all' ? 'Alle' : o.charAt(0).toUpperCase() + o.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

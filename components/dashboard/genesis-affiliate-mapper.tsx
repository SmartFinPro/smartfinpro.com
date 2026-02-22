'use client';

import { useState } from 'react';
import { DollarSign, Plus, X, GripVertical, ExternalLink } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────

interface AvailablePartner {
  providerName: string;
  cpaValue: number;
  currency: string;
}

interface MappingEntry {
  partnerName: string;
  slug: string;
  cpaValue: number;
  currency: string;
  position: 'hero-cta' | 'comparison-table' | 'mid-article' | 'conclusion';
}

interface GenesisAffiliateMapperProps {
  availablePartners: AvailablePartner[];
  onMappingsChange: (mappings: MappingEntry[]) => void;
}

const CTA_POSITIONS: { id: MappingEntry['position']; label: string; description: string }[] = [
  { id: 'hero-cta', label: 'Hero CTA', description: 'Top of article — highest visibility' },
  { id: 'comparison-table', label: 'Comparison Table', description: 'Quick comparison section' },
  { id: 'mid-article', label: 'Mid-Article', description: 'After detailed reviews' },
  { id: 'conclusion', label: 'Conclusion CTA', description: 'Final verdict call-to-action' },
];

// ── Component ────────────────────────────────────────────────

export function GenesisAffiliateMapper({
  availablePartners,
  onMappingsChange,
}: GenesisAffiliateMapperProps) {
  const [mappings, setMappings] = useState<MappingEntry[]>([]);

  const addMapping = (partner: AvailablePartner, position: MappingEntry['position']) => {
    // Check if position already has a mapping
    const existing = mappings.find((m) => m.position === position);
    if (existing) return;

    const slug = partner.providerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
    const newMapping: MappingEntry = {
      partnerName: partner.providerName,
      slug,
      cpaValue: partner.cpaValue,
      currency: partner.currency,
      position,
    };

    const updated = [...mappings, newMapping];
    setMappings(updated);
    onMappingsChange(updated);
  };

  const removeMapping = (position: MappingEntry['position']) => {
    const updated = mappings.filter((m) => m.position !== position);
    setMappings(updated);
    onMappingsChange(updated);
  };

  const getMappingForPosition = (position: MappingEntry['position']) =>
    mappings.find((m) => m.position === position);

  return (
    <div className="space-y-4">
      {/* Available Partners */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Available Partners ({availablePartners.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {availablePartners.map((partner) => {
            const isAssigned = mappings.some((m) => m.partnerName === partner.providerName);
            return (
              <div
                key={partner.providerName}
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium
                  ${isAssigned
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                    : 'border-slate-200 text-slate-600 bg-white hover:border-violet-300'}
                `}
              >
                <span>{partner.providerName}</span>
                <span className="text-emerald-600 font-bold tabular-nums">
                  ${partner.cpaValue}
                </span>
                {isAssigned && <span className="text-emerald-500">✓</span>}
              </div>
            );
          })}
          {availablePartners.length === 0 && (
            <p className="text-xs text-slate-400">No affiliate rates found for this market</p>
          )}
        </div>
      </div>

      {/* CTA Position Slots */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          CTA Positions — Click to Assign
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CTA_POSITIONS.map((pos) => {
            const mapping = getMappingForPosition(pos.id);

            return (
              <div
                key={pos.id}
                className={`rounded-xl border p-4 transition-all ${
                  mapping
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">{pos.label}</span>
                  </div>
                  {mapping && (
                    <button
                      onClick={() => removeMapping(pos.id)}
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-100"
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 mb-3">{pos.description}</p>

                {mapping ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 border border-emerald-200">
                    <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">{mapping.partnerName}</span>
                    <span className="ml-auto text-xs font-bold text-emerald-600 tabular-nums">
                      ${mapping.cpaValue}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availablePartners.slice(0, 4).map((partner) => {
                      const alreadyAssigned = mappings.some((m) => m.partnerName === partner.providerName);
                      return (
                        <button
                          key={partner.providerName}
                          onClick={() => addMapping(partner, pos.id)}
                          disabled={alreadyAssigned}
                          className={`
                            w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all border border-slate-200
                            ${alreadyAssigned
                              ? 'opacity-30 cursor-not-allowed bg-white'
                              : 'hover:bg-violet-50 hover:border-violet-200 bg-white'}
                          `}
                        >
                          <Plus className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-600">{partner.providerName}</span>
                          <span className="ml-auto text-emerald-600 font-medium tabular-nums">${partner.cpaValue}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Estimate */}
      {mappings.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-4">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-xs text-slate-500">Estimated CPA per Conversion</p>
            <p className="text-lg font-bold text-emerald-600 tabular-nums">
              ${mappings.reduce((s, m) => s + m.cpaValue, 0).toFixed(2)}
              <span className="text-xs text-slate-500 font-normal ml-1">across {mappings.length} positions</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

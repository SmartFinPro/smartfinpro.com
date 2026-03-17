// components/dashboard/cta-partner-select.tsx — Multi-select dropdown with placement & display config
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import type { PartnerAssignmentConfig, Placement, DisplayType } from '@/lib/types/page-cta';
import {
  PLACEMENT_OPTIONS,
  DISPLAY_TYPE_OPTIONS,
  DEFAULT_PLACEMENTS,
  DEFAULT_DISPLAY_TYPE,
} from '@/lib/types/page-cta';

// ── Public Types ────────────────────────────────────────────────

export interface PartnerOption {
  id: string;
  partner_name: string;
  slug: string;
}

interface CtaPartnerSelectProps {
  pageUrl: string;
  assignedPartners: PartnerAssignmentConfig[];
  availablePartners: PartnerOption[];
}

// ── Config Map Helper ───────────────────────────────────────────

type ConfigMap = Record<string, { placements: Placement[]; display_type: DisplayType }>;

function buildConfigMap(partners: PartnerAssignmentConfig[]): ConfigMap {
  const map: ConfigMap = {};
  for (const p of partners) {
    map[p.id] = { placements: [...p.placements], display_type: p.display_type };
  }
  return map;
}

function configMapToArray(configs: ConfigMap): PartnerAssignmentConfig[] {
  return Object.entries(configs).map(([id, cfg]) => ({
    id,
    placements: cfg.placements,
    display_type: cfg.display_type,
  }));
}

// ── Compact Chip Label ──────────────────────────────────────────

function chipLabel(placements: Placement[], displayType: DisplayType): string {
  const pos = PLACEMENT_OPTIONS.filter((o) => placements.includes(o.value))
    .map((o) => o.label)
    .join('');
  const dt = DISPLAY_TYPE_OPTIONS.find((o) => o.value === displayType)?.label || 'E';
  return `${pos}·${dt}`;
}

// ── Inline Placement Toggles ────────────────────────────────────

function PlacementToggles({
  placements,
  onChange,
}: {
  placements: Placement[];
  onChange: (updated: Placement[]) => void;
}) {
  const toggle = (val: Placement) => {
    if (placements.includes(val)) {
      if (placements.length <= 1) return; // min 1 required
      onChange(placements.filter((p) => p !== val));
    } else {
      onChange([...placements, val].sort());
    }
  };

  return (
    <div className="flex gap-0.5">
      {PLACEMENT_OPTIONS.map((opt) => {
        const active = placements.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle(opt.value);
            }}
            title={opt.fullLabel}
            className={`w-5 h-5 text-[9px] font-bold rounded transition-colors ${
              active
                ? 'text-white shadow-sm'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
            style={active ? { backgroundColor: 'var(--sfp-navy)' } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Inline Display Type Selector ────────────────────────────────

function DisplayTypeSelect({
  value,
  onChange,
}: {
  value: DisplayType;
  onChange: (val: DisplayType) => void;
}) {
  return (
    <div className="flex rounded-md overflow-hidden border border-slate-200">
      {DISPLAY_TYPE_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(opt.value);
            }}
            title={opt.fullLabel}
            className={`px-1.5 py-0.5 text-[9px] font-semibold transition-colors ${
              active
                ? 'text-white shadow-sm'
                : 'bg-white text-slate-400 hover:bg-slate-50'
            }`}
            style={active ? { backgroundColor: 'var(--sfp-gold)' } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────

export function CtaPartnerSelect({
  pageUrl,
  assignedPartners,
  availablePartners,
}: CtaPartnerSelectProps) {
  const initialConfigs = buildConfigMap(assignedPartners);
  const [configs, setConfigs] = useState<ConfigMap>(initialConfigs);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  // ── Persist helpers ───────────────────────────────────────────

  const persistNow = useCallback(
    async (newConfigs: ConfigMap) => {
      setSaving(true);
      try {
        const partners = configMapToArray(newConfigs);
        const res = await fetch('/api/page-cta-partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageUrl, partners }),
        });
        if (!res.ok) {
          setConfigs(initialConfigs);
          console.error('[cta-partner-select] Save failed:', await res.text());
        }
      } catch (err) {
        setConfigs(initialConfigs);
        console.error('[cta-partner-select] Save error:', err);
      } finally {
        setSaving(false);
      }
    },
    [pageUrl, initialConfigs]
  );

  const persistDebounced = useCallback(
    (newConfigs: ConfigMap) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => persistNow(newConfigs), 600);
    },
    [persistNow]
  );

  // ── Actions ───────────────────────────────────────────────────

  const togglePartner = useCallback(
    (partnerId: string) => {
      const newConfigs = { ...configs };
      if (newConfigs[partnerId]) {
        delete newConfigs[partnerId];
      } else {
        newConfigs[partnerId] = {
          placements: [...DEFAULT_PLACEMENTS],
          display_type: DEFAULT_DISPLAY_TYPE,
        };
      }
      setConfigs(newConfigs);
      persistNow(newConfigs); // immediate save for add/remove
    },
    [configs, persistNow]
  );

  const updatePlacements = useCallback(
    (partnerId: string, placements: Placement[]) => {
      const newConfigs = { ...configs };
      if (!newConfigs[partnerId]) return;
      newConfigs[partnerId] = { ...newConfigs[partnerId], placements };
      setConfigs(newConfigs);
      persistDebounced(newConfigs); // debounced for rapid toggling
    },
    [configs, persistDebounced]
  );

  const updateDisplayType = useCallback(
    (partnerId: string, display_type: DisplayType) => {
      const newConfigs = { ...configs };
      if (!newConfigs[partnerId]) return;
      newConfigs[partnerId] = { ...newConfigs[partnerId], display_type };
      setConfigs(newConfigs);
      persistDebounced(newConfigs);
    },
    [configs, persistDebounced]
  );

  const removePartner = useCallback(
    (partnerId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newConfigs = { ...configs };
      delete newConfigs[partnerId];
      setConfigs(newConfigs);
      persistNow(newConfigs);
    },
    [configs, persistNow]
  );

  // ── Derived data ──────────────────────────────────────────────

  const selectedIds = Object.keys(configs);
  const selectedPartners = availablePartners.filter((p) => selectedIds.includes(p.id));

  return (
    <div ref={ref} className="relative">
      {/* Trigger — uses div (not button) so inner remove buttons are valid HTML */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
        className={`flex items-center gap-1 w-full min-w-[120px] px-2 py-1 rounded-md border text-xs transition-colors text-left cursor-pointer ${
          open
            ? 'border-violet-300 ring-1 ring-violet-200 bg-white'
            : 'border-slate-200 bg-white hover:border-slate-300'
        } ${saving ? 'opacity-60' : ''}`}
      >
        <div className="flex-1 flex flex-wrap gap-1 min-h-[20px]">
          {selectedPartners.length === 0 ? (
            <span className="text-slate-400">—</span>
          ) : (
            selectedPartners.map((p) => {
              const cfg = configs[p.id];
              return (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-medium leading-tight"
                >
                  {p.partner_name}
                  {cfg && (
                    <span className="text-violet-400 ml-0.5">
                      {chipLabel(cfg.placements, cfg.display_type)}
                    </span>
                  )}
                  <button
                    onClick={(e) => removePartner(p.id, e)}
                    className="hover:text-violet-900 ml-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {availablePartners.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">
              No partners for this market
            </div>
          ) : (
            availablePartners.map((partner) => {
              const isSelected = selectedIds.includes(partner.id);
              const cfg = configs[partner.id];

              return (
                <div
                  key={partner.id}
                  className={`border-b border-slate-50 last:border-b-0 ${
                    isSelected ? 'bg-violet-50/50' : ''
                  }`}
                >
                  {/* Partner row */}
                  <button
                    onClick={() => togglePartner(partner.id)}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors ${
                      isSelected
                        ? 'text-violet-700'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center h-3.5 w-3.5 rounded border shrink-0 ${
                        isSelected
                          ? 'bg-violet-500 border-violet-500'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <span className="truncate flex-1">{partner.partner_name}</span>
                    <span className="text-slate-400 text-[10px] shrink-0">
                      /go/{partner.slug}
                    </span>
                  </button>

                  {/* Config controls (only when selected) */}
                  {isSelected && cfg && (
                    <div className="flex items-center gap-2 px-3 pb-2 pl-8">
                      <PlacementToggles
                        placements={cfg.placements}
                        onChange={(updated) => updatePlacements(partner.id, updated)}
                      />
                      <DisplayTypeSelect
                        value={cfg.display_type}
                        onChange={(val) => updateDisplayType(partner.id, val)}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

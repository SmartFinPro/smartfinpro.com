'use client';

import { useState, useEffect, useRef } from 'react';
import { FlaskConical, Play, Trash2, Loader2, BarChart3, FileText, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { SimulationStatus } from '@/lib/actions/simulator';

export function SimulationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [status, setStatus] = useState<SimulationStatus>({
    active: false,
    clickCount: 0,
    planningCount: 0,
    optimizationCount: 0,
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  // Click-outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/dashboard/simulator');
      const result = await res.json();
      setStatus(result);
    } catch {
      // Status fetch is best-effort
    }
  }

  async function handleStart() {
    setIsRunning(true);
    toast('Simulation gestartet...', { icon: '🧪', duration: 4000 });

    try {
      const res = await fetch('/api/dashboard/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger' }),
      });
      const result = await res.json();

      if (result.success) {
        toast.success(
          `Simulation erfolgreich: ${result.clicksInserted} Clicks, ${result.spikeClicksInserted} Spike-Clicks, ${result.planningItemsInserted} Planning-Items`,
          { duration: 6000 },
        );
        // Refresh the page to show new data
        window.location.reload();
      } else {
        toast.error(`Simulation fehlgeschlagen: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error(`Fehler: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsRunning(false);
      await fetchStatus();
    }
  }

  async function handleClear() {
    setIsClearing(true);

    try {
      const res = await fetch('/api/dashboard/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      const result = await res.json();

      if (result.success) {
        const d = result.deleted;
        const total = d.ctaAnalytics + d.planningQueue + d.optimizationTasks + d.autopilotCooldowns;
        toast.success(
          `${total} Eintraege geloescht: ${d.ctaAnalytics} Clicks, ${d.planningQueue} Plans, ${d.optimizationTasks} Tasks, ${d.autopilotCooldowns} Cooldowns`,
          { duration: 6000 },
        );
        window.location.reload();
      } else {
        toast.error(`Cleanup fehlgeschlagen: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error(`Fehler: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsClearing(false);
      await fetchStatus();
    }
  }

  const isActive = status.active;
  const isBusy = isRunning || isClearing;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: isActive ? '#fffbeb' : '#fefce8',
          border: `1px solid ${isActive ? '#f59e0b' : '#fde68a'}`,
          color: '#d97706',
          boxShadow: isActive ? '0 0 12px rgba(245, 158, 11, 0.2)' : 'none',
        }}
      >
        <FlaskConical className="h-3.5 w-3.5" />
        Simulation
        {isActive && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[280px] rounded-xl bg-white border border-slate-200 shadow-lg z-50 p-4 space-y-3"
        >
          {/* Title */}
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-800">Simulation Mode</h4>
          </div>

          {/* Description */}
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Generiert realistische Test-Daten: CTA-Clicks, Spike-Alerts, Optimierungs-Tasks und Planning-Items.
          </p>

          {/* Status Indicator (when active) */}
          {isActive && (
            <div className="rounded-lg p-3 space-y-1.5 bg-amber-50 border border-amber-200">
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                Aktive Simulation
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" /> CTA Clicks
                  </span>
                  <span className="font-semibold text-slate-700 tabular-nums">
                    {status.clickCount.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Planning Items
                  </span>
                  <span className="font-semibold text-slate-700 tabular-nums">
                    {status.planningCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Optimization Tasks
                  </span>
                  <span className="font-semibold text-slate-700 tabular-nums">
                    {status.optimizationCount}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleStart}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: isBusy
                  ? '#e2e8f0'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: isBusy ? 'none' : '0 0 16px rgba(16, 185, 129, 0.2)',
                color: isBusy ? '#94a3b8' : '#ffffff',
              }}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Simulation laeuft...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Full Simulation starten
                </>
              )}
            </button>

            {isActive && (
              <button
                onClick={handleClear}
                disabled={isBusy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 text-red-500 bg-white border border-red-200 hover:bg-red-50"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Wird geloescht...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Simulation-Daten loeschen
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

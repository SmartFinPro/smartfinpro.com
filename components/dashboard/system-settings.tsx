'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Key,
  Search,
  FileJson2,
  Gauge,
  Percent,
  Timer,
  FlaskConical,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Shield,
  Zap,
  Settings2,
  Plug,
  X,
  Bell,
  Mail,
  SendHorizontal,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SystemSettings, ConnectionTestResult } from '@/lib/actions/settings';

// ── Types ────────────────────────────────────────────────────

interface SystemSettingsProps {
  initialSettings: SystemSettings;
  credentialStatus: Record<string, boolean>;
}

const MASK = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';

// ── Main Component ───────────────────────────────────────────

export function SystemSettingsPanel({ initialSettings, credentialStatus }: SystemSettingsProps) {
  const router = useRouter();

  // Form state
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Visibility toggles for password fields
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showSerperKey, setShowSerperKey] = useState(false);

  // Track which fields were changed
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  // Connection test state
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ConnectionTestResult>>({});

  // Guardian state
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);
  const [guardianStatus, setGuardianStatus] = useState<{
    lastCheck: string | null;
    results: Array<{ key: string; label: string; success: boolean; message: string; checkedAt: string }>;
  } | null>(null);

  const updateField = useCallback((key: keyof SystemSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
    // Clear test result when field changes
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const hasDirtyFields = dirty.size > 0;

  // ── Guardian Status (fetch on mount) ─────────────────────

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/dashboard/guardian');
        const status = await res.json();
        setGuardianStatus({
          lastCheck: status.lastCheck,
          results: status.results,
        });
      } catch {
        // Guardian module might not be available
      }
    })();
  }, []);

  // ── Send Test Email ──────────────────────────────────────

  async function handleSendTestEmail() {
    const email = settings.notification_email?.trim();
    if (!email) {
      toast.error('Bitte zuerst eine E-Mail-Adresse eingeben.');
      return;
    }

    setTestingEmail(true);
    setTestEmailResult(null);

    try {
      const res = await fetch('/api/dashboard/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-test', email }),
      });
      const result = await res.json();

      if (result.success) {
        setTestEmailResult({ success: true, message: `Test-E-Mail an ${email} gesendet.` });
        toast.success(`Test-E-Mail an ${email} gesendet.`);
      } else {
        setTestEmailResult({ success: false, message: result.error || 'Fehler beim Senden.' });
        toast.error(result.error || 'Fehler beim Senden.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setTestEmailResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setTestingEmail(false);
    }
  }

  // ── Test Connection ────────────────────────────────────────

  async function handleTestConnection(key: 'anthropic_api_key' | 'serper_api_key' | 'google_indexing_json') {
    setTestingKey(key);
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    try {
      // Determine the value to test: current input (if changed) or stored value
      const currentValue = dirty.has(key) ? settings[key] : undefined;

      const actionMap: Record<string, string> = {
        anthropic_api_key: 'test-anthropic',
        serper_api_key: 'test-serper',
        google_indexing_json: 'test-indexing',
      };

      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionMap[key], currentValue }),
      });
      const result: ConnectionTestResult = await res.json();

      setTestResults((prev) => ({ ...prev, [key]: result }));

      if (result.success) {
        toast.success(result.message, { duration: 4000 });
      } else {
        toast.error(result.message, { duration: 5000 });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setTestResults((prev) => ({ ...prev, [key]: { success: false, message: msg } }));
      toast.error(msg);
    } finally {
      setTestingKey(null);
    }
  }

  // ── Save ───────────────────────────────────────────────────

  async function handleSave() {
    if (!hasDirtyFields) return;

    setIsSaving(true);
    try {
      // Only send changed fields
      const updates: Partial<SystemSettings> = {};
      for (const key of dirty) {
        updates[key as keyof SystemSettings] = settings[key as keyof SystemSettings];
      }

      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', settings: updates }),
      });
      const result = await res.json();

      if (result.success) {
        toast.success('Einstellungen gespeichert', { duration: 3000 });
        setDirty(new Set());
        router.refresh();
      } else {
        toast.error(result.error || 'Fehler beim Speichern');
      }
    } catch (err) {
      toast.error(`Fehler: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Global Reset ───────────────────────────────────────────

  async function handleGlobalReset() {
    setIsResetting(true);
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const result = await res.json();

      if (result.success) {
        const total = (Object.values(result.deleted) as number[]).reduce((a, b) => a + b, 0);
        toast.success(`Global Reset abgeschlossen: ${total} Eintraege entfernt`, { duration: 5000 });
        setShowResetConfirm(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Reset fehlgeschlagen');
      }
    } catch (err) {
      toast.error(`Fehler: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsResetting(false);
    }
  }

  // ── Credential status indicator ────────────────────────────

  function CredentialBadge({ configured }: { configured: boolean }) {
    return configured ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
        <Check className="h-3 w-3" /> Konfiguriert
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
        Nicht gesetzt
      </span>
    );
  }

  // ── Test Connection Button ────────────────────────────────

  function TestConnectionButton({ settingsKey }: { settingsKey: 'anthropic_api_key' | 'serper_api_key' | 'google_indexing_json' }) {
    const isTesting = testingKey === settingsKey;
    const result = testResults[settingsKey];

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleTestConnection(settingsKey)}
          disabled={isTesting || testingKey !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Teste...
            </>
          ) : (
            <>
              <Plug className="h-3 w-3" />
              Test Connection
            </>
          )}
        </button>
        {result && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              result.success
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {result.success ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {result.success ? 'OK' : 'Fehler'}
          </span>
        )}
      </div>
    );
  }

  // ── Test Result Detail ─────────────────────────────────────

  function TestResultDetail({ settingsKey }: { settingsKey: string }) {
    const result = testResults[settingsKey];
    if (!result) return null;

    return (
      <div
        className={`mt-1.5 px-3 py-2 rounded-lg text-[11px] leading-relaxed ${
          result.success
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}
      >
        <span className="font-medium">{result.success ? '✅' : '❌'}</span>{' '}
        {result.message}
        {result.latencyMs !== undefined && (
          <span className="text-slate-400 ml-1">({result.latencyMs}ms)</span>
        )}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ═══ A) API CREDENTIALS ═══ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50">
            <Key className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">API Credentials</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verbinde AI-Services und externe APIs
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Anthropic API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-blue-400" />
                Anthropic API Key
              </label>
              <CredentialBadge configured={credentialStatus.anthropic_api_key} />
            </div>
            <div className="relative">
              <input
                type={showAnthropicKey ? 'text' : 'password'}
                value={settings.anthropic_api_key}
                onChange={(e) => updateField('anthropic_api_key', e.target.value)}
                onFocus={() => {
                  if (settings.anthropic_api_key === MASK) {
                    updateField('anthropic_api_key', '');
                  }
                }}
                placeholder="sk-ant-api03-..."
                className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 placeholder-slate-400 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Verwendet fuer AI-Optimization, Daily Strategy Digest und Genesis Content.
              </p>
              <TestConnectionButton settingsKey="anthropic_api_key" />
            </div>
            <TestResultDetail settingsKey="anthropic_api_key" />
          </div>

          {/* Serper.dev Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-blue-400" />
                Serper.dev API Key
              </label>
              <CredentialBadge configured={credentialStatus.serper_api_key} />
            </div>
            <div className="relative">
              <input
                type={showSerperKey ? 'text' : 'password'}
                value={settings.serper_api_key}
                onChange={(e) => updateField('serper_api_key', e.target.value)}
                onFocus={() => {
                  if (settings.serper_api_key === MASK) {
                    updateField('serper_api_key', '');
                  }
                }}
                placeholder="serper-api-key..."
                className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 placeholder-slate-400 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSerperKey(!showSerperKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showSerperKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Google SERP-Daten fuer die Self-Planning Loop und Keyword-Gap-Analyse.
              </p>
              <TestConnectionButton settingsKey="serper_api_key" />
            </div>
            <TestResultDetail settingsKey="serper_api_key" />
          </div>

          {/* Google Indexing JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FileJson2 className="h-3.5 w-3.5 text-blue-400" />
                Google Indexing API (Service Account JSON)
              </label>
              <CredentialBadge configured={credentialStatus.google_indexing_json} />
            </div>
            <textarea
              value={settings.google_indexing_json}
              onChange={(e) => updateField('google_indexing_json', e.target.value)}
              onFocus={() => {
                if (settings.google_indexing_json === MASK) {
                  updateField('google_indexing_json', '');
                }
              }}
              placeholder='{"type": "service_account", "client_email": "...", "private_key": "..."}'
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg text-sm border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 placeholder-slate-400 font-mono resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Service Account JSON fuer Instant Indexing nach Genesis-Publikation. Muss &quot;client_email&quot; und &quot;private_key&quot; enthalten.
              </p>
              <TestConnectionButton settingsKey="google_indexing_json" />
            </div>
            <TestResultDetail settingsKey="google_indexing_json" />
          </div>
        </div>
      </div>

      {/* ═══ B) AUTONOMY GUARDRAILS ═══ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50">
            <Shield className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Autonomy Guardrails</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Schwellenwerte fuer Auto-Pilot und AI-Entscheidungen
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Spike Threshold */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5 text-emerald-400" />
              Spike-Threshold
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={settings.spike_threshold}
                onChange={(e) => updateField('spike_threshold', e.target.value)}
                min={100}
                max={1000}
                step={50}
                className="w-32 px-3 py-2.5 rounded-lg text-sm border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all text-slate-700 tabular-nums"
              />
              <span className="text-sm text-slate-500 font-medium">%</span>
              <span className="text-xs text-slate-400">
                (Default: 300%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ab diesem Multiplikator (vs. 7-Tage-Durchschnitt) wird ein Spike erkannt und Auto-Pilot aktiviert.
            </p>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Percent className="h-3.5 w-3.5 text-emerald-400" />
              Confidence-Threshold (CTR)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={settings.confidence_threshold}
                onChange={(e) => updateField('confidence_threshold', e.target.value)}
                min={1}
                max={50}
                step={0.5}
                className="w-32 px-3 py-2.5 rounded-lg text-sm border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all text-slate-700 tabular-nums"
              />
              <span className="text-sm text-slate-500 font-medium">%</span>
              <span className="text-xs text-slate-400">
                (Default: 5%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Minimum CTR-Rate, ab der der Auto-Pilot Freshness Boosts + Deploys triggert. Darunter: nur Telegram-Alert.
            </p>
          </div>

          {/* Optimization Interval */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Timer className="h-3.5 w-3.5 text-emerald-400" />
              Optimization Interval
            </label>
            <div className="flex items-center gap-3">
              <select
                value={settings.optimization_interval}
                onChange={(e) => updateField('optimization_interval', e.target.value)}
                className="px-3 py-2.5 rounded-lg text-sm border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all text-slate-700"
              >
                <option value="7">7 Tage (Weekly)</option>
                <option value="14">14 Tage (Biweekly)</option>
                <option value="30">30 Tage (Monthly)</option>
              </select>
              <span className="text-xs text-slate-400">
                (Default: 7 Tage)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Zeitfenster fuer die periodische AI-Optimization-Analyse. Kuerzere Intervalle = haeufigere Vorschlaege.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ C) SYSTEM CONTROLS ═══ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50">
            <Settings2 className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">System Controls</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulation Mode und System-Reset
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Simulation Mode Toggle */}
          <div
            className="rounded-xl p-4 flex items-center justify-between transition-all"
            style={{
              background: settings.simulation_mode === 'true' ? '#fffbeb' : '#f8fafc',
              border: `1px solid ${settings.simulation_mode === 'true' ? '#f59e0b' : '#e2e8f0'}`,
              boxShadow: settings.simulation_mode === 'true' ? '0 0 16px rgba(245, 158, 11, 0.1)' : 'none',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: settings.simulation_mode === 'true' ? '#fef3c7' : '#f1f5f9',
                }}
              >
                <FlaskConical
                  className="h-5 w-5"
                  style={{
                    color: settings.simulation_mode === 'true' ? '#d97706' : '#94a3b8',
                  }}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Simulation Mode</p>
                <p className="text-[11px] text-slate-500">
                  {settings.simulation_mode === 'true'
                    ? 'Aktiv — Test-Daten werden im Dashboard angezeigt'
                    : 'Inaktiv — nur echte Daten werden verwendet'}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                updateField(
                  'simulation_mode',
                  settings.simulation_mode === 'true' ? 'false' : 'true',
                )
              }
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors"
              style={{
                background:
                  settings.simulation_mode === 'true'
                    ? '#f59e0b'
                    : '#cbd5e1',
              }}
            >
              <span
                className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform"
                style={{
                  transform:
                    settings.simulation_mode === 'true'
                      ? 'translateX(20px)'
                      : 'translateX(0px)',
                }}
              />
            </button>
          </div>

          {/* Global Reset */}
          <div className="rounded-xl p-4 bg-rose-50 border border-rose-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-rose-100">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Global Reset</p>
                <p className="text-[11px] text-slate-500">
                  Loescht alle Simulations-Daten, Optimization Tasks, Planning Queue und setzt Guardrails zurueck.
                </p>
              </div>
            </div>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                  boxShadow: '0 0 16px rgba(244, 63, 94, 0.15)',
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Global Reset ausfuehren
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGlobalReset}
                  disabled={isResetting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: isResetting ? '#e2e8f0' : 'linear-gradient(135deg, #f43f5e, #e11d48)',
                    color: isResetting ? '#94a3b8' : '#ffffff',
                  }}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Reset laeuft...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Wirklich zuruecksetzen?
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  disabled={isResetting}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ D) GUARDIAN NOTIFICATIONS ═══ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-50">
            <Bell className="h-4.5 w-4.5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Guardian Benachrichtigungen</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              API-Monitoring und E-Mail-Warnungen bei Ausfaellen
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Guardian Enabled Toggle */}
          <div
            className="rounded-xl p-4 flex items-center justify-between transition-all"
            style={{
              background: settings.guardian_enabled === 'true' ? '#f5f3ff' : '#f8fafc',
              border: `1px solid ${settings.guardian_enabled === 'true' ? '#8b5cf6' : '#e2e8f0'}`,
              boxShadow: settings.guardian_enabled === 'true' ? '0 0 16px rgba(139, 92, 246, 0.1)' : 'none',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: settings.guardian_enabled === 'true' ? '#ede9fe' : '#f1f5f9',
                }}
              >
                <ShieldCheck
                  className="h-5 w-5"
                  style={{
                    color: settings.guardian_enabled === 'true' ? '#7c3aed' : '#94a3b8',
                  }}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Guardian Monitoring</p>
                <p className="text-[11px] text-slate-500">
                  {settings.guardian_enabled === 'true'
                    ? 'Aktiv — API-Verbindungen werden alle 15 Min. geprueft'
                    : 'Inaktiv — keine automatischen Connectivity-Checks'}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                updateField(
                  'guardian_enabled',
                  settings.guardian_enabled === 'true' ? 'false' : 'true',
                )
              }
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors"
              style={{
                background:
                  settings.guardian_enabled === 'true'
                    ? '#8b5cf6'
                    : '#cbd5e1',
              }}
            >
              <span
                className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform"
                style={{
                  transform:
                    settings.guardian_enabled === 'true'
                      ? 'translateX(20px)'
                      : 'translateX(0px)',
                }}
              />
            </button>
          </div>

          {/* Notification Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-violet-400" />
              Notification Email
            </label>
            <input
              type="email"
              value={settings.notification_email}
              onChange={(e) => updateField('notification_email', e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-3 py-2.5 rounded-lg text-sm border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all text-slate-700 placeholder-slate-400"
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                E-Mail-Adresse fuer API-Ausfall-Warnungen. Max. 1 Alert pro Key alle 6 Stunden.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testingEmail || !settings.notification_email?.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100"
                >
                  {testingEmail ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Sende...
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="h-3 w-3" />
                      Test-E-Mail senden
                    </>
                  )}
                </button>
                {testEmailResult && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      testEmailResult.success
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}
                  >
                    {testEmailResult.success ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {testEmailResult.success ? 'Gesendet' : 'Fehler'}
                  </span>
                )}
              </div>
            </div>
            {testEmailResult && (
              <div
                className={`mt-1.5 px-3 py-2 rounded-lg text-[11px] leading-relaxed ${
                  testEmailResult.success
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <span className="font-medium">{testEmailResult.success ? '\u2705' : '\u274c'}</span>{' '}
                {testEmailResult.message}
              </div>
            )}
          </div>

          {/* Guardian Status */}
          {guardianStatus && guardianStatus.results.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Plug className="h-3.5 w-3.5 text-violet-400" />
                Letzter Guardian Check
                {guardianStatus.lastCheck && (
                  <span className="text-[10px] font-normal text-slate-400 ml-1">
                    {new Date(guardianStatus.lastCheck).toLocaleString('de-DE', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {guardianStatus.results.map((r) => (
                  <div
                    key={r.key}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium ${
                      r.success
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {r.success ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {r.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ SAVE BAR ═══ */}
      {hasDirtyFields && (
        <div className="sticky bottom-4 z-40">
          <div
            className="mx-auto max-w-2xl rounded-xl px-5 py-3.5 flex items-center justify-between bg-white border border-slate-200 shadow-lg"
            style={{
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm text-slate-600 font-medium">
                {dirty.size} {dirty.size === 1 ? 'Aenderung' : 'Aenderungen'} nicht gespeichert
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSettings(initialSettings);
                  setDirty(new Set());
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Verwerfen
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: isSaving
                    ? '#e2e8f0'
                    : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  boxShadow: isSaving ? 'none' : '0 0 16px rgba(139, 92, 246, 0.2)',
                  color: isSaving ? '#94a3b8' : '#ffffff',
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Speichern
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

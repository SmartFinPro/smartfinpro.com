'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  RotateCcw,
  Zap,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────

interface BacklinkCredentials {
  reddit_client_id: string;
  reddit_client_secret: string;
  reddit_username: string;
  reddit_password: string;
  medium_api_token: string;
  ein_presswire_api_key: string;
  backlinks_daily_limit: string;
}

interface PlatformStatus {
  reddit: boolean;
  medium: boolean;
  ein_presswire: boolean;
}

interface TestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

const MASK = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';

// ── Component ────────────────────────────────────────────────

export default function BacklinkCredentialsPanel() {
  const [credentials, setCredentials] = useState<BacklinkCredentials>({
    reddit_client_id: '',
    reddit_client_secret: '',
    reddit_username: '',
    reddit_password: '',
    medium_api_token: '',
    ein_presswire_api_key: '',
    backlinks_daily_limit: '10',
  });

  const [status, setStatus] = useState<PlatformStatus>({
    reddit: false,
    medium: false,
    ein_presswire: false,
  });

  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [loaded, setLoaded] = useState(false);

  // ── Load initial data ──────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/backlinks/credentials');
      if (!res.ok) return;
      const data = await res.json();
      setCredentials(data.credentials);
      setStatus(data.status);
      setLoaded(true);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handlers ───────────────────────────────────────────────

  const updateField = (key: keyof BacklinkCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
    setDirty(prev => new Set(prev).add(key));
  };

  const toggleVisibility = (key: string) => {
    setVisible(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Partial<BacklinkCredentials> = {};
      for (const key of dirty) {
        updates[key as keyof BacklinkCredentials] =
          credentials[key as keyof BacklinkCredentials];
      }

      const res = await fetch('/api/dashboard/backlinks/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', credentials: updates }),
      });

      const result = await res.json();
      if (result.success) {
        setDirty(new Set());
        await loadData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDirty(new Set());
    loadData();
  };

  const handleTestReddit = async () => {
    setTesting('reddit');
    try {
      const res = await fetch('/api/dashboard/backlinks/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-reddit',
          clientId: credentials.reddit_client_id,
          clientSecret: credentials.reddit_client_secret,
          username: credentials.reddit_username,
          password: credentials.reddit_password,
        }),
      });
      const result = await res.json();
      setTestResults(prev => ({ ...prev, reddit: result }));
    } finally {
      setTesting(null);
    }
  };

  const handleTestMedium = async () => {
    setTesting('medium');
    try {
      const res = await fetch('/api/dashboard/backlinks/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-medium',
          token: credentials.medium_api_token,
        }),
      });
      const result = await res.json();
      setTestResults(prev => ({ ...prev, medium: result }));
    } finally {
      setTesting(null);
    }
  };

  // ── Render Helpers ─────────────────────────────────────────

  const StatusBadge = ({ configured }: { configured: boolean }) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        configured
          ? 'bg-green-50 text-green-700'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      {configured ? (
        <><CheckCircle2 className="h-3 w-3" /> Konfiguriert</>
      ) : (
        <><XCircle className="h-3 w-3" /> Nicht konfiguriert</>
      )}
    </span>
  );

  const CredentialInput = ({
    label,
    fieldKey,
    placeholder,
  }: {
    label: string;
    fieldKey: keyof BacklinkCredentials;
    placeholder: string;
  }) => {
    const isVisible = visible.has(fieldKey);
    const value = credentials[fieldKey];
    const isMasked = value === MASK;

    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        <div className="relative">
          <input
            type={isVisible ? 'text' : 'password'}
            value={value}
            placeholder={placeholder}
            onChange={e => updateField(fieldKey, e.target.value)}
            onFocus={() => {
              if (isMasked) updateField(fieldKey, '');
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-10 text-sm outline-none transition-colors focus:border-[var(--sfp-navy)] focus:ring-2 focus:ring-[var(--sfp-navy)]/10"
          />
          <button
            type="button"
            onClick={() => toggleVisibility(fieldKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
  };

  const TestResultDisplay = ({ platform }: { platform: string }) => {
    const result = testResults[platform];
    if (!result) return null;

    return (
      <div
        className={`mt-2 rounded-lg px-3 py-2 text-xs ${
          result.success
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}
      >
        {result.success ? '✅' : '❌'} {result.message}
      </div>
    );
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Lade Konfiguration...
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Reddit ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🟠</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Reddit</h3>
              <p className="text-xs text-gray-500">OAuth2 App — apps.reddit.com</p>
            </div>
          </div>
          <StatusBadge configured={status.reddit} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <CredentialInput label="Client ID" fieldKey="reddit_client_id" placeholder="Reddit App Client ID" />
          <CredentialInput label="Client Secret" fieldKey="reddit_client_secret" placeholder="Reddit App Secret" />
          <CredentialInput label="Username" fieldKey="reddit_username" placeholder="Reddit Bot Username" />
          <CredentialInput label="Password" fieldKey="reddit_password" placeholder="Reddit Bot Password" />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleTestReddit}
            disabled={testing === 'reddit'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--sfp-sky)] px-3 py-1.5 text-xs font-medium text-[var(--sfp-navy)] hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {testing === 'reddit' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            Test Connection
          </button>
          <span className="text-[11px] text-gray-400">Account muss 30+ Tage alt + 50+ Karma haben</span>
        </div>
        <TestResultDisplay platform="reddit" />
      </div>

      {/* ── Medium ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚫</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Medium</h3>
              <p className="text-xs text-gray-500">medium.com/me/settings → Integration tokens</p>
            </div>
          </div>
          <StatusBadge configured={status.medium} />
        </div>

        <CredentialInput label="API Token" fieldKey="medium_api_token" placeholder="Medium Integration Token" />

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleTestMedium}
            disabled={testing === 'medium'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--sfp-sky)] px-3 py-1.5 text-xs font-medium text-[var(--sfp-navy)] hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {testing === 'medium' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            Test Connection
          </button>
          <span className="text-[11px] text-gray-400">Artikel erscheinen mit canonical link zu SmartFinPro</span>
        </div>
        <TestResultDisplay platform="medium" />
      </div>

      {/* ── EIN Presswire ───────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📢</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">EIN Presswire</h3>
              <p className="text-xs text-gray-500">einpresswire.com → Free Account → API Key</p>
            </div>
          </div>
          <StatusBadge configured={status.ein_presswire} />
        </div>

        <CredentialInput label="API Key" fieldKey="ein_presswire_api_key" placeholder="EIN Presswire API Key" />

        <p className="mt-2 text-[11px] text-gray-400">3 gratis Press Releases/Monat</p>
      </div>

      {/* ── Daily Limit ─────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚡</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Daily Limit</h3>
            <p className="text-xs text-gray-500">Max Posts pro Backlink-Post-Run</p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Posts pro Run</label>
          <input
            type="number"
            min={1}
            max={50}
            value={credentials.backlinks_daily_limit}
            onChange={e => updateField('backlinks_daily_limit', e.target.value)}
            className="w-32 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--sfp-navy)] focus:ring-2 focus:ring-[var(--sfp-navy)]/10"
          />
          <p className="text-[11px] text-gray-400">Standard: 10 — Empfohlen: 5-15 pro Run</p>
        </div>
      </div>

      {/* ── Sticky Save Bar ─────────────────────────────────── */}
      {dirty.size > 0 && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-lg">
          <span className="text-sm text-amber-800">
            {dirty.size} {dirty.size === 1 ? 'Aenderung' : 'Aenderungen'} nicht gespeichert
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscard}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Verwerfen
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: 'var(--sfp-navy)' }}
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

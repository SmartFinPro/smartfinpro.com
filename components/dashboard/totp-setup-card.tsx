// components/dashboard/totp-setup-card.tsx
'use client';

import { useState, useCallback } from 'react';
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  Link2,
  Terminal,
  Smartphone,
} from 'lucide-react';

// ── Types (shape returned by GET /api/dashboard/totp-setup) ──────

interface TotpConfiguredResponse {
  enabled: true;
  otpauthUri: string;
  instructions: string[];
  secret: string;
  note: string;
}

interface TotpNotConfiguredResponse {
  enabled: false;
  message: string;
  setup: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
}

type TotpResponse = TotpConfiguredResponse | TotpNotConfiguredResponse;

interface TotpSetupCardProps {
  /** Server-derived status: true if DASHBOARD_TOTP_SECRET is set. */
  configured: boolean;
}

// ── Copy button with "Kopiert!" feedback ─────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (insecure context) — silently ignore.
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
        copied
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
      }`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" /> Kopiert!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> Kopieren
        </>
      )}
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────

export function TotpSetupCard({ configured }: TotpSetupCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TotpResponse | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  async function handleReveal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/totp-setup');
      if (!res.ok) {
        setError(
          res.status === 401
            ? 'Nicht autorisiert. Bitte erneut im Dashboard anmelden.'
            : `Anfrage fehlgeschlagen (HTTP ${res.status}).`,
        );
        return;
      }
      const json = (await res.json()) as TotpResponse;
      setData(json);
      setShowSecret(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              Zwei-Faktor-Authentifizierung (2FA)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              TOTP-Schutz fuer den Dashboard-Login (Google Authenticator, Authy, 1Password)
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {configured ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Check className="h-3 w-3" /> Aktiv
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            <AlertTriangle className="h-3 w-3" /> Nicht eingerichtet
          </span>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Intro / explainer */}
        <p className="text-[13px] leading-relaxed text-slate-600">
          {configured
            ? 'Die 2FA ist aktiviert. Beim Login musst du zusaetzlich einen 6-stelligen Code aus deiner Authenticator-App eingeben. Du kannst den Einrichtungs-Schluessel unten erneut einsehen, um ein weiteres Geraet hinzuzufuegen.'
            : 'Die 2FA ist noch nicht eingerichtet. Hinterlege ein TOTP-Secret in der Server-Umgebung, um den Dashboard-Login mit einem zweiten Faktor abzusichern.'}
        </p>

        {/* Reveal button */}
        {!data && (
          <button
            type="button"
            onClick={handleReveal}
            disabled={loading}
            aria-label="2FA-Einrichtung anzeigen"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Laedt...
              </>
            ) : (
              <>
                <KeyRound className="h-3.5 w-3.5" /> Einrichtung anzeigen
              </>
            )}
          </button>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="px-3 py-2 rounded-lg text-[12px] leading-relaxed bg-red-50 text-red-700 border border-red-200"
          >
            {error}
          </div>
        )}

        {/* ── Configured: show otpauth URI + secret + instructions ── */}
        {data && data.enabled && (
          <div className="space-y-5">
            {/* otpauth URI */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-emerald-400" />
                otpauth:// URI
              </label>
              <div className="flex items-start gap-2">
                <code className="flex-1 px-3 py-2.5 rounded-lg text-[11px] leading-relaxed border border-slate-200 bg-slate-50 text-slate-700 font-mono break-all">
                  {data.otpauthUri}
                </code>
                <CopyButton value={data.otpauthUri} label="otpauth-URI kopieren" />
              </div>
              <p className="text-[11px] text-slate-400">
                Einige Apps (z. B. 1Password) erlauben den direkten Import dieser URI.
              </p>
            </div>

            {/* Base32 Secret (masked until revealed) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
                Manueller Schluessel (Base32-Secret)
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2.5 rounded-lg text-sm tracking-[0.15em] border border-slate-200 bg-slate-50 text-slate-700 font-mono break-all">
                  {showSecret ? data.secret : '•'.repeat(Math.max(data.secret.length, 16))}
                </code>
                <button
                  type="button"
                  onClick={() => setShowSecret((s) => !s)}
                  aria-label={showSecret ? 'Secret verbergen' : 'Secret anzeigen'}
                  aria-pressed={showSecret}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                >
                  {showSecret ? (
                    <>
                      <EyeOff className="h-3 w-3" /> Verbergen
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" /> Secret anzeigen
                    </>
                  )}
                </button>
                {showSecret && <CopyButton value={data.secret} label="Secret kopieren" />}
              </div>
              <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {data.note}
              </p>
            </div>

            {/* Manual step-by-step instructions */}
            <div className="rounded-xl p-4 bg-sky-50 border border-sky-200">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <Smartphone className="h-4 w-4 text-sky-500" />
                Manuelle Einrichtung in der Authenticator-App
              </p>
              <ol className="space-y-2 text-[12px] leading-relaxed text-slate-600 list-decimal list-inside marker:text-sky-500 marker:font-semibold">
                <li>
                  Authenticator-App oeffnen (Google Authenticator, Authy oder 1Password).
                </li>
                <li>
                  <span className="font-medium text-slate-700">Konto hinzufuegen</span> waehlen.
                </li>
                <li>
                  <span className="font-medium text-slate-700">
                    Manueller Schluessel / Setup-Code eingeben
                  </span>{' '}
                  auswaehlen (nicht QR-Scan).
                </li>
                <li>
                  Den oben angezeigten <span className="font-medium text-slate-700">Base32-Secret</span>{' '}
                  eingeben. Konto-Name: <code className="font-mono text-[11px]">SmartFinPro Dashboard</code>.
                </li>
                <li>
                  Typ <span className="font-medium text-slate-700">Zeitbasiert (TOTP)</span>, 6 Stellen,
                  30 Sekunden Intervall, Algorithmus SHA1.
                </li>
                <li>
                  Die App erzeugt nun alle 30 Sekunden einen 6-stelligen Code — diesen beim
                  Dashboard-Login eingeben.
                </li>
              </ol>
              <p className="text-[11px] text-slate-400 mt-3">
                Aus Datenschutzgruenden wird hier kein QR-Code generiert (kein externer Dienst). Nutze
                die manuelle Schlussel-Eingabe oder die otpauth-URI.
              </p>
            </div>
          </div>
        )}

        {/* ── Not configured: show openssl command + env instructions ── */}
        {data && !data.enabled && (
          <div className="space-y-4">
            <div
              role="status"
              className="px-3 py-2 rounded-lg text-[12px] leading-relaxed bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {data.message}
            </div>

            <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <Terminal className="h-4 w-4 text-slate-500" />
                Einrichtung auf dem Server
              </p>

              <div className="space-y-3">
                <SetupStep
                  index={1}
                  text="Base32-Secret generieren:"
                  command="openssl rand -base32 20"
                />
                <SetupStep
                  index={2}
                  text="In .env.local hinterlegen:"
                  command="DASHBOARD_TOTP_SECRET=<ergebnis>"
                />
                <SetupStep
                  index={3}
                  text="PM2 neu starten:"
                  command="pm2 restart smartfinpro --update-env"
                />
                <div className="flex gap-2.5 items-start">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center justify-center mt-0.5">
                    4
                  </span>
                  <p className="text-[12px] leading-relaxed text-slate-600">
                    Diese Seite neu laden und erneut auf{' '}
                    <span className="font-medium text-slate-700">Einrichtung anzeigen</span> klicken,
                    um die otpauth-URI und den Schluessel zu erhalten.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Setup step row with copyable command ─────────────────────────

function SetupStep({ index, text, command }: { index: number; text: string; command: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center justify-center mt-0.5">
        {index}
      </span>
      <div className="flex-1 space-y-1.5">
        <p className="text-[12px] leading-relaxed text-slate-600">{text}</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] border border-slate-200 bg-white text-slate-700 font-mono break-all">
            {command}
          </code>
          <CopyButton value={command} label={`Befehl kopieren: ${command}`} />
        </div>
      </div>
    </div>
  );
}

'use client';

// components/dashboard/attribution-health-widget.tsx
// Attribution Watchdog — per-provider health scores + silent-failure incidents.
// Data: getAttributionHealth() (server action, passed as props by the page).
// Status updates call updateIncidentStatus directly (dashboard convention).

import { Fragment, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  EyeOff,
  Link2,
  MousePointerClick,
  ShieldCheck,
} from 'lucide-react';
import {
  BAND_LABELS,
  type HealthBand,
} from '@/lib/attribution/health-score';
// Type-only import — a VALUE import from a 'use server' module crashes
// Turbopack module resolution (see CLAUDE.md Häufige Fallstricke). The
// updateIncidentStatus action is passed in as a prop by the server page.
import type {
  AttributionHealthData,
  IncidentRow,
  ProviderHealth,
} from '@/lib/actions/attribution-watchdog';

type UpdateIncidentStatusAction = (
  id: string,
  status: 'confirmed' | 'resolved' | 'ignored',
  note?: string,
) => Promise<{ success: boolean; error?: string }>;

// ── Formatting helpers ──────────────────────────────────────────────────────

// Market flags — same pattern as the Page-Rankings dashboard
const MARKET_FLAGS: Record<string, string> = { us: '🇺🇸', uk: '🇬🇧', ca: '🇨🇦', au: '🇦🇺' };

function marketFlag(market: string | null): string {
  return MARKET_FLAGS[market ?? ''] ?? '🌍';
}

/** Incident identity — providers are aggregated per partner+market+category */
function incidentIdentity(provider: string, market: string | null, category: string | null): string {
  return [provider, market ?? '', category ?? ''].join('|');
}

function formatRelativeDays(iso: string | null): string {
  if (!iso) return 'noch nie';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'heute';
  if (days === 1) return 'gestern';
  return `vor ${days} Tagen`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const BAND_STYLES: Record<HealthBand, { badge: string; dot: string }> = {
  healthy: { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  warning: { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  critical: { badge: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  na: { badge: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};

function ScoreBadge({ score, band }: { score: number | null; band: HealthBand }) {
  const s = BAND_STYLES[band];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold tabular-nums ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {score === null ? 'k. A.' : `${score}/100`}
    </span>
  );
}

function BandPill({ band }: { band: HealthBand }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${BAND_STYLES[band].badge}`}
    >
      {BAND_LABELS[band]}
    </span>
  );
}

const INCIDENT_STATUS_STYLES: Record<string, string> = {
  open: 'bg-red-50 text-red-700',
  confirmed: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  ignored: 'bg-slate-100 text-slate-500',
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  open: 'Offen',
  confirmed: 'Bestätigt',
  resolved: 'Gelöst',
  ignored: 'Ignoriert',
};

// ── Incident card ───────────────────────────────────────────────────────────

function IncidentCard({
  incident,
  provider,
  onUpdateStatus,
}: {
  incident: IncidentRow;
  provider: ProviderHealth | undefined;
  onUpdateStatus: UpdateIncidentStatusAction;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const setStatus = (status: 'confirmed' | 'resolved' | 'ignored') => {
    startTransition(async () => {
      const result = await onUpdateStatus(incident.id, status);
      if (!result.success) {
        setError(result.error ?? 'Update fehlgeschlagen');
        return;
      }
      setError(null);
      router.refresh();
    });
  };

  const isLive = incident.status === 'open' || incident.status === 'confirmed';
  const borderCls = incident.status === 'open' ? 'border-red-200' : 'border-slate-200';

  return (
    <div className={`rounded-lg border ${borderCls} bg-white p-3.5`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-800">
              {marketFlag(incident.market)} {incident.provider}
            </span>
            {incident.category && (
              <span className="text-[11px] text-slate-400">{incident.category}</span>
            )}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${INCIDENT_STATUS_STYLES[incident.status] ?? INCIDENT_STATUS_STYLES.open}`}
            >
              {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
            </span>
            <span className="text-[11px] text-slate-400">
              erkannt am {formatDate(incident.detected_at)}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">{incident.suspected_cause}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {incident.clicks_since_last_conversion} Klicks seit letzter Conversion (
            {formatRelativeDays(incident.last_conversion_at)})
            {incident.revenue_risk_estimate !== null && incident.revenue_risk_estimate > 0 && (
              <span className="font-semibold text-red-600">
                {' '}
                · Geschätztes Risiko: ~${Math.round(incident.revenue_risk_estimate)}
              </span>
            )}
            {incident.health_score !== null && ` · Score ${incident.health_score}/100`}
          </p>
          {incident.status === 'ignored' && incident.ignored_until && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Stummgeschaltet bis {formatDate(incident.ignored_until)}
            </p>
          )}
          {incident.status === 'resolved' && incident.resolution_note && (
            <p className="text-[11px] text-slate-400 mt-0.5">{incident.resolution_note}</p>
          )}
        </div>

        {isLive && (
          <div className="flex items-center gap-1.5 shrink-0">
            {incident.status === 'open' && (
              <button
                onClick={() => setStatus('confirmed')}
                disabled={isPending}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                Bestätigen
              </button>
            )}
            <button
              onClick={() => setStatus('resolved')}
              disabled={isPending}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              <Check className="h-3 w-3 inline mr-0.5" />
              Gelöst
            </button>
            <button
              onClick={() => setStatus('ignored')}
              disabled={isPending}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
            >
              <EyeOff className="h-3 w-3 inline mr-0.5" />
              Ignorieren
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-red-600 mt-2">{error}</p>}

      {isLive && (
        <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-100">
          {provider && (
            <a
              href={provider.destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-violet-600"
            >
              <ExternalLink className="h-3 w-3" />
              Affiliate-Link öffnen
            </a>
          )}
          <a
            href="/dashboard/funnel"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-violet-600"
          >
            <MousePointerClick className="h-3 w-3" />
            Klicks & Events ansehen
          </a>
          <a
            href="/dashboard/links"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-violet-600"
          >
            <Link2 className="h-3 w-3" />
            Postback-Setup
          </a>
        </div>
      )}
    </div>
  );
}

// ── Main widget ─────────────────────────────────────────────────────────────

export function AttributionHealthWidget({
  data,
  onUpdateStatus,
}: {
  data: AttributionHealthData;
  onUpdateStatus: UpdateIncidentStatusAction;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Keyed by incident identity (provider+market+category) — with several
  // network segments per identity the last one wins; the map only feeds
  // diagnostic deep links on incident cards.
  const providerMap = useMemo(
    () =>
      new Map(
        data.providers.map((p) => [
          incidentIdentity(p.snapshot.partnerName, p.snapshot.market, p.snapshot.category),
          p,
        ]),
      ),
    [data.providers],
  );

  const liveIncidents = data.incidents.filter(
    (i) => i.status === 'open' || i.status === 'confirmed',
  );
  const criticalCount = data.providers.filter((p) => p.score.band === 'critical').length;
  const unverifiedCount = data.providers.filter(
    (p) => p.score.band === 'critical' && p.snapshot.trackingStatus !== 'verified',
  ).length;
  const snoozedIncidents = data.incidents.filter(
    (i) => i.status === 'ignored' && i.ignored_until && new Date(i.ignored_until) > new Date(),
  );
  const recentResolved = data.incidents.filter((i) => i.status === 'resolved').slice(0, 3);

  // ── Error state: a broken read must never look like "all healthy" ──
  if (data.error) {
    return (
      <div
        className="rounded-xl border border-red-200 p-4 text-sm flex items-start gap-2.5"
        style={{ background: 'rgba(214,64,69,0.05)' }}
      >
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
        <div>
          <p className="font-semibold text-slate-800">
            Attribution-Daten konnten nicht geladen werden
          </p>
          <p className="text-slate-500 mt-0.5 break-all font-mono text-xs">{data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Incidents */}
      {liveIncidents.length > 0 ? (
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Offene Vorfälle ({liveIncidents.length})
          </h3>
          {liveIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              provider={providerMap.get(
                incidentIdentity(incident.provider, incident.market, incident.category),
              )}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </div>
      ) : criticalCount > 0 ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 p-3.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Keine offenen Vorfälle — aber {criticalCount} Provider im kritischen Band
            {unverifiedCount > 0 &&
              `, davon ${unverifiedCount} ohne verifiziertes Postback-Tracking`}
            . Ausfall-Vorfälle feuern bewusst erst für verifizierte Provider; vorher zeigt nur
            der Score den Zustand.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800">
            Alle Provider im erwarteten Conversion-Fenster. Kein Handlungsbedarf.
          </p>
        </div>
      )}

      {!data.revenueDataComplete && !data.error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Revenue-Daten unvollständig (conversions-Tabelle nicht lesbar) — Umsatzwerte können
            zu niedrig sein, die postback_no_revenue-Prüfung ist ausgesetzt.
          </p>
        </div>
      )}

      {snoozedIncidents.length > 0 && (
        <p className="text-[11px] text-slate-400">
          {snoozedIncidents.length} Vorfall{snoozedIncidents.length > 1 ? 'e' : ''} stummgeschaltet
          (bis Snooze-Ablauf keine neuen Alerts für denselben Typ).
        </p>
      )}

      {/* Provider health table */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          Provider Health ({data.providers.length})
        </h3>
        {data.providers.length === 0 ? (
          <p className="text-sm text-slate-500">Keine aktiven Affiliate-Provider gefunden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Provider
                  </th>
                  <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Netzwerk
                  </th>
                  <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Score
                  </th>
                  <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Letzte Conversion
                  </th>
                  <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Klicks seit Conv.
                  </th>
                  <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Fenster
                  </th>
                  <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.providers.map((p) => {
                  // Row identity = full segment (incl. network) — partnerName
                  // alone is no longer unique across markets/categories.
                  const key = [
                    p.snapshot.partnerName,
                    p.snapshot.market ?? '',
                    p.snapshot.category ?? '',
                    p.snapshot.network ?? '',
                  ].join('|');
                  const isOpen = expanded === key;
                  return (
                    <Fragment key={key}>
                      <tr
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() => setExpanded(isOpen ? null : key)}
                      >
                        <td className="px-2 py-2.5 font-medium text-slate-800">
                          <span className="inline-flex items-center gap-1">
                            {isOpen ? (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                            )}
                            <span className="mr-0.5">{marketFlag(p.snapshot.market)}</span>
                            {p.snapshot.partnerName}
                            {p.snapshot.category && (
                              <span className="text-[10px] font-normal text-slate-400">
                                · {p.snapshot.category}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-xs text-slate-500">
                          {p.snapshot.network ?? 'direkt'}
                        </td>
                        <td className="px-2 py-2.5">
                          <ScoreBadge score={p.score.score} band={p.score.band} />
                        </td>
                        <td className="px-2 py-2.5 text-right text-xs text-slate-600 whitespace-nowrap">
                          {formatRelativeDays(p.snapshot.lastEventAt)}
                        </td>
                        <td className="px-2 py-2.5 text-right text-xs tabular-nums text-slate-600">
                          {p.snapshot.clicksSinceLastEvent}
                        </td>
                        <td className="px-2 py-2.5 text-right text-xs tabular-nums text-slate-500">
                          {p.score.expectedWindowDays} T
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <BandPill band={p.score.band} />
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="grid gap-1.5 sm:grid-cols-2">
                              {p.score.components.map((c) => (
                                <div
                                  key={c.key}
                                  className="flex items-center justify-between gap-3 text-xs"
                                >
                                  <span
                                    className={c.applicable ? 'text-slate-600' : 'text-slate-400'}
                                  >
                                    {c.label}
                                    <span className="text-slate-400"> — {c.reason}</span>
                                  </span>
                                  <span
                                    className={`font-semibold tabular-nums shrink-0 ${
                                      !c.applicable
                                        ? 'text-slate-400'
                                        : c.earned === c.max
                                          ? 'text-emerald-600'
                                          : c.earned === 0
                                            ? 'text-red-500'
                                            : 'text-amber-600'
                                    }`}
                                  >
                                    {c.applicable ? `${c.earned}/${c.max}` : 'n/a'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recently resolved */}
      {recentResolved.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Zuletzt gelöst
          </h3>
          {recentResolved.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              provider={undefined}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* Footnote */}
      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="h-3 w-3" />
        Täglicher Check (06:30 UTC). Eine Zeile = Provider pro Markt/Kategorie. Score gewichtet
        nur anwendbare Komponenten — „k. A." = zu wenig Traffic für eine Bewertung.
        {data.unmatchedCtaProviders.length > 0 &&
          ` ${data.unmatchedCtaProviders.length} CTA-Provider ohne eindeutige Link-Zuordnung (kein cta_no_go-Check).`}
      </p>
    </div>
  );
}

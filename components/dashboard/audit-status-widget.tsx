// components/dashboard/audit-status-widget.tsx
// S2S Postback Dedup — Audit Status Widget
//
// Server Component — reads audit reports from filesystem at render time.
// Shows either a ZERTIFIZIERT seal or a prominent NOT-AUDITED warning.
//
// Gate logic mirrors bin/verify-audit.sh EXACTLY:
//   success === true  AND  numFailedTests === 0  AND  numPassedTests === numTotalTests
//
// All KPI values are dynamic:
//   - Integration tests: from integration-latest.json
//   - Unit tests: from unit-latest.json
//   - Prod-Guard refs: from lib/audit/constants.ts (shared with test file)
//
// Design: Light trust design — solid white bg, no glassmorphism per CLAUDE.md.
//
// Placement: Right column of System Integrity row on /dashboard.

import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FlaskConical,
  AlertTriangle,
  Download,
  Clock,
  Ban,
} from 'lucide-react';
import { readLatestAuditReport, isReportCertified } from '@/lib/audit/read-report';
import { BLOCKED_REF_COUNT } from '@/lib/audit/constants';
import { AuditVerifyButton } from './audit-verify-button';

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricTile({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: 'green' | 'navy' | 'rose';
}) {
  const accentMap = {
    green: 'bg-emerald-50 border-emerald-100',
    navy:  'bg-blue-50  border-blue-100',
    rose:  'bg-rose-50  border-rose-100',
  };
  const textMap = {
    green: 'text-emerald-700',
    navy:  'text-blue-700',
    rose:  'text-rose-700',
  };

  return (
    <div className={`rounded-lg border p-2.5 ${accentMap[accent]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={textMap[accent]}>{icon}</span>
        <span className={`text-[11px] font-semibold tabular-nums ${textMap[accent]}`}>{value}</span>
      </div>
      <p className="text-[10px] text-slate-500 leading-tight">{label}</p>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export function AuditStatusWidget() {
  const data = readLatestAuditReport();

  // ── Gate logic — IDENTICAL to bin/verify-audit.sh line 100 ────────────────
  // success === true  AND  numFailedTests === 0  AND  numPassedTests === numTotalTests
  const integCertified = isReportCertified(data.integration);
  const unitCertified = isReportCertified(data.unit);

  // Widget is green only when BOTH suites are certified
  const isAudited = integCertified && unitCertified;

  // ── Build reason string for NOT-AUDITED state ─────────────────────────────
  const reasons: string[] = [];
  if (!data.integration) {
    reasons.push('Kein Integration-Report.');
  } else if (!integCertified) {
    const r = data.integration;
    reasons.push(`Integration: ${r.numPassedTests}/${r.numTotalTests} passed, ${r.numFailedTests} failed.`);
  }
  if (!data.unit) {
    reasons.push('Kein Unit-Report.');
  } else if (!unitCertified) {
    const r = data.unit;
    reasons.push(`Unit: ${r.numPassedTests}/${r.numTotalTests} passed, ${r.numFailedTests} failed.`);
  }
  const notAuditedReason = reasons.join(' ');

  // ── NOT AUDITED state ─────────────────────────────────────────────────────
  if (!isAudited) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
            <Ban className="h-3.5 w-3.5 text-rose-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-900 leading-none">S2S Dedup Audit</p>
            <p className="text-[10px] text-rose-600 mt-0.5">Postback Dedup System</p>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 bg-rose-100 border border-rose-200 rounded-lg p-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-rose-900">SYSTEM NICHT AUDITIERT</p>
            <p className="text-[11px] text-rose-700 mt-0.5">{notAuditedReason}</p>
          </div>
        </div>

        {/* Verify button (Client Component island) */}
        <AuditVerifyButton />
      </div>
    );
  }

  // ── CERTIFIED state ─────────────────────────────────────────────────────────
  const integReport = data.integration!;
  const unitReport = data.unit!;
  const timestamp = data.integrationTimestamp;

  const formattedDate = timestamp
    ? new Intl.DateTimeFormat('de-DE', {
        day:    '2-digit',
        month:  '2-digit',
        year:   'numeric',
        hour:   '2-digit',
        minute: '2-digit',
      }).format(timestamp)
    : '—';

  const integrationLabel = `${integReport.numPassedTests}/${integReport.numTotalTests}`;
  const unitLabel = `${unitReport.numPassedTests}/${unitReport.numTotalTests}`;
  const guardLabel = `${BLOCKED_REF_COUNT} Ref${BLOCKED_REF_COUNT !== 1 ? 's' : ''}`;

  // Hard-Gate: computed from actual gate results (not hardcoded)
  const gateChecks = [integCertified, unitCertified].filter(Boolean).length;
  const gateLabel = `${gateChecks}/2`;

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
    >
      {/* Accent bar */}
      <div
        className="h-[3px]"
        style={{ background: 'linear-gradient(90deg, #1A6B3A 0%, #10b981 100%)' }}
      />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(26,107,58,0.10)' }}
            >
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--sfp-green)' }} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-none">S2S Dedup Audit</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Postback Dedup System</p>
            </div>
          </div>

          {/* ZERTIFIZIERT seal */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'var(--sfp-green)' }}
          >
            <CheckCircle2 className="h-3 w-3" />
            Zertifiziert
          </div>
        </div>

        {/* Metrics 2x2 grid — ALL values dynamic */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <MetricTile
            icon={<FlaskConical className="h-3 w-3" />}
            value={integrationLabel}
            label="Integration Tests (real DB)"
            accent="green"
          />
          <MetricTile
            icon={<CheckCircle2 className="h-3 w-3" />}
            value={unitLabel}
            label="Unit Tests (gemockt)"
            accent="green"
          />
          <MetricTile
            icon={<Lock className="h-3 w-3" />}
            value={gateLabel}
            label="Hard-Gate Checks"
            accent="navy"
          />
          <MetricTile
            icon={<Ban className="h-3 w-3" />}
            value={guardLabel}
            label="Prod-Guard blockiert"
            accent="navy"
          />
        </div>

        {/* Last run + Download */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] text-slate-500">
              Letzter Run: <span className="font-medium text-slate-700">{formattedDate}</span>
            </span>
          </div>

          <a
            href="/api/audit/report"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900"
          >
            <Download className="h-3 w-3" />
            Report
          </a>
        </div>

        {/* Verify button (Client Component island) */}
        <AuditVerifyButton />
      </div>
    </div>
  );
}

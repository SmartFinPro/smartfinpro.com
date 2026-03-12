// lib/audit/read-report.ts
// Server-side utility — reads audit reports from disk.
// Called by AuditStatusWidget (Server Component) at render time.
// NOT a Server Action — pure read utility with no mutations.
//
// Reads two report files:
//   1. integration-latest.json  — real DB constraint tests
//   2. unit-latest.json         — mocked unit test suite

import fs from 'fs';
import path from 'path';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditReport {
  success: boolean;
  numPassedTests: number;
  numFailedTests: number;
  numTotalTests: number;
  numPassedTestSuites?: number;
  numTotalTestSuites?: number;
  startTime?: number; // Unix ms
}

export interface AuditData {
  integration: AuditReport | null;
  unit: AuditReport | null;
  integrationTimestamp: Date | null;
  unitTimestamp: Date | null;
}

// ── Paths ─────────────────────────────────────────────────────────────────────

const REPORT_DIR = path.join(process.cwd(), 'audits', 'reports');
const INTEGRATION_FILE = path.join(REPORT_DIR, 'integration-latest.json');
const UNIT_FILE = path.join(REPORT_DIR, 'unit-latest.json');

// ── Helpers ───────────────────────────────────────────────────────────────────

function readReport(filePath: string): { report: AuditReport; timestamp: Date | null } | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const report: AuditReport = JSON.parse(raw);
    const timestamp = typeof report.startTime === 'number'
      ? new Date(report.startTime)
      : null;
    return { report, timestamp };
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function readLatestAuditReport(): AuditData {
  const integ = readReport(INTEGRATION_FILE);
  const unit = readReport(UNIT_FILE);

  return {
    integration: integ?.report ?? null,
    unit: unit?.report ?? null,
    integrationTimestamp: integ?.timestamp ?? null,
    unitTimestamp: unit?.timestamp ?? null,
  };
}

/**
 * Mirrors the exact gate logic from bin/verify-audit.sh (line 100):
 *   success === true  AND  numFailedTests === 0  AND  numPassedTests === numTotalTests
 */
export function isReportCertified(report: AuditReport | null): boolean {
  if (!report) return false;
  return (
    report.success === true &&
    report.numFailedTests === 0 &&
    report.numPassedTests === report.numTotalTests
  );
}

// components/marketing/trust-seal.tsx
// Compact audit trust seal for marketing/review pages.
//
// Shows a green "Verified Integrity" badge when the S2S Dedup audit is certified.
// Returns null (renders nothing) when the system is not audit-grade.
//
// Gate logic: identical to bin/verify-audit.sh and AuditStatusWidget —
//   success === true  AND  numFailedTests === 0  AND  numPassedTests === numTotalTests
//
// Design: Light trust design (white bg, emerald accents) per CLAUDE.md.
//         NO glassmorphism (no backdrop-filter, no bg-white/50).

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { readLatestAuditReport, isReportCertified } from '@/lib/audit/read-report';

/**
 * Server Component — reads audit report from filesystem at render time.
 * Safe to embed anywhere in the marketing layout; renders nothing if not certified.
 */
export default function TrustSeal() {
  const data = readLatestAuditReport();

  // Gate: both suites must pass the full 3-way check (mirrors verify-audit.sh)
  const certified = isReportCertified(data.integration) && isReportCertified(data.unit);
  if (!certified) return null;

  // Dynamic date from integration report timestamp
  const certifiedDate = data.integrationTimestamp
    ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(data.integrationTimestamp)
    : 'Verified';

  return (
    <Link href="/integrity" className="flex items-center gap-3 p-3 bg-white border border-emerald-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
      {/* Shield icon */}
      <div
        className="p-2 rounded-full flex-shrink-0"
        style={{ background: 'var(--sfp-green)' }}
      >
        <ShieldCheck className="w-5 h-5 text-white" />
      </div>

      {/* Text block */}
      <div>
        <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--sfp-green)' }}>
          Verified Integrity
        </div>
        <div className="text-xs font-semibold" style={{ color: 'var(--sfp-ink)' }}>
          Certified: {certifiedDate}
        </div>
      </div>

      {/* Divider + detail */}
      <div className="ml-4 pl-4 border-l border-emerald-100 hidden sm:block">
        <p className="text-[9px] leading-tight" style={{ color: 'var(--sfp-slate)' }}>
          S2S Dedup Active<br />
          Expert Fact-Checked
        </p>
      </div>
    </Link>
  );
}

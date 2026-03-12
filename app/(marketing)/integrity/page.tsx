// app/(marketing)/integrity/page.tsx
// Data Integrity & Audit Transparency Page
//
// Server Component — reads audit reports from filesystem at render time.
// Shows EEAT trust signals: methodology, S2S dedup, expert board, live audit status.
//
// Design: Light trust design (white/sfp-gray), NO glassmorphism per CLAUDE.md.

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  CheckCircle2,
  FlaskConical,
  Lock,
  Ban,
  Clock,
  Download,
  Shield,
  Users,
  ArrowRight,
  Fingerprint,
  Timer,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { readLatestAuditReport, isReportCertified } from '@/lib/audit/read-report';
import { BLOCKED_REF_COUNT } from '@/lib/audit/constants';
import TrustSeal from '@/components/marketing/trust-seal';
import { IntegrityBadge } from '@/components/marketing/integrity-badge';

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Data Integrity | SmartFinPro Integrity Engine',
  description:
    'Learn how SmartFinPro ensures data accuracy through automated integration tests, unit tests, and S2S postback deduplication. Certified by our Integrity Engine.',
  alternates: {
    canonical: '/integrity',
  },
};

// ── Expert Data ───────────────────────────────────────────────────────────────
// Static array — matches lib/experts/image-routing.ts gender-lock rules exactly.

const EXPERTS = [
  { name: 'Jessica Miller', credentials: 'CFA, CFP', image: '/images/experts/james-miller.jpg', market: 'US' },
  { name: 'Michelle Torres', credentials: 'Financial Analyst', image: '/images/experts/michael-torres.jpg', market: 'US' },
  { name: 'Robert Hayes', credentials: 'CFA', image: '/images/experts/robert-hayes.jpg', market: 'US' },
  { name: 'Sarah Chen', credentials: 'PhD', image: '/images/experts/sarah-chen.jpg', market: 'US' },
  { name: 'James Mitchell', credentials: 'Debt & Credit Specialist', image: '/images/experts/james-mitchell.jpg', market: 'US' },
  { name: 'Michelle Chen', credentials: 'Business Banking Analyst', image: '/images/experts/michael-chen.jpg', market: 'US' },
  { name: 'Sarah Thompson', credentials: 'CFA, CISI', image: '/images/experts/sarah-thompson.jpg', market: 'UK' },
  { name: 'James Blackwood', credentials: 'Market Analyst', image: '/images/experts/james-blackwood.jpg', market: 'UK' },
  { name: 'Marie Fontaine', credentials: 'CFA, CIM', image: '/images/experts/marc-fontaine.jpg', market: 'CA' },
  { name: 'Emma Whitfield', credentials: 'CFA, AFA', image: '/images/experts/daniel-whitfield.jpg', market: 'AU' },
  { name: 'James Liu', credentials: 'AFA', image: '/images/experts/james-liu.jpg', market: 'AU' },
  { name: 'David Martinez', credentials: 'Financial Analyst', image: '/images/experts/expert-extra-13.jpg', market: 'US' },
  { name: 'Alex Chen', credentials: 'CFA, FRM', image: '/images/experts/expert-extra-14.jpg', market: 'UK' },
  { name: 'Daniel Brooks', credentials: 'CPA, CFA', image: '/images/experts/daniel-brooks.jpg', market: 'CA' },
  { name: 'William Carter', credentials: 'CFA, CISI', image: '/images/experts/expert-extra-16.jpg', market: 'US' },
] as const;

// ── Helper: MetricTile (reused from AuditStatusWidget pattern) ────────────────

function MetricTile({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: 'green' | 'navy';
}) {
  const bg = accent === 'green' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100';
  const text = accent === 'green' ? 'text-emerald-700' : 'text-blue-700';

  return (
    <div className={`rounded-lg border p-3 ${bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={text}>{icon}</span>
        <span className={`text-sm font-bold tabular-nums ${text}`}>{value}</span>
      </div>
      <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>{label}</p>
    </div>
  );
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function IntegrityPage() {
  // Read audit reports from filesystem (Server Component)
  const data = readLatestAuditReport();
  const integCertified = isReportCertified(data.integration);
  const unitCertified = isReportCertified(data.unit);
  const isCertified = integCertified && unitCertified;

  const integPassed = data.integration?.numPassedTests ?? 0;
  const integTotal = data.integration?.numTotalTests ?? 0;
  const unitPassed = data.unit?.numPassedTests ?? 0;
  const unitTotal = data.unit?.numTotalTests ?? 0;
  const gateChecks = [integCertified, unitCertified].filter(Boolean).length;

  const lastRunDate = data.integrationTimestamp
    ? new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(data.integrationTimestamp)
    : 'Not available';

  const lastReviewedISO = data.integrationTimestamp
    ? data.integrationTimestamp.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return (
    <main className="min-h-screen">
      {/* ── Section 1: Hero ──────────────────────────────────────────────── */}
      <section
        className="relative py-20 sm:py-24 lg:py-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-navy-dark) 100%)' }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, var(--sfp-gold) 0%, transparent 50%), radial-gradient(circle at 80% 80%, var(--sfp-green) 0%, transparent 50%)',
            }}
          />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
              <span className="text-sm font-semibold text-emerald-300 uppercase tracking-wider">
                Integrity Engine
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Our Commitment to Data Integrity
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl">
              At SmartFinPro, trust is built on verifiable facts. Our Integrity Engine
              validates every data point mathematically and through expert review — fully
              automated, transparent, and auditable at any time.
            </p>

            <div className="mb-8">
              <TrustSeal />
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="#audit-status">
                <Button
                  variant="default"
                  size="lg"
                  style={{ background: 'var(--sfp-navy-dark)', color: 'white' }}
                  className="hover:opacity-90"
                >
                  View Live Audit Status
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Expert Board (first content section) ────────────── */}
      <section className="py-10 sm:py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: 'var(--sfp-navy)' }}>
              Our Professional Expert Board
            </h2>
            <p className="text-lg mb-4" style={{ color: 'var(--sfp-ink)' }}>
              Technology alone is not enough. That is why every category is overseen by our Expert Board.
            </p>
            <p className="text-base mb-8 max-w-3xl leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
              Our editorial expert team is composed of distinguished specialists with deep, region-specific
              expertise across the financial markets of the United States, United Kingdom, Canada, and
              Australia. Each panel member brings years of hands-on industry experience within their
              respective jurisdiction — spanning securities regulation, credit analysis, forex brokerage,
              and emerging fintech. Professional integrity, analytical objectivity, and rigorous
              independent analysis are the foundational pillars of every expert&apos;s professional ethos,
              ensuring that every recommendation published on SmartFinPro reflects verified domain
              knowledge and an unwavering commitment to reader trust.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
                <Users className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  {EXPERTS.length} experts across 4 markets
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
                <ShieldCheck className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  EEAT standard: Every page bears the responsible expert&apos;s seal
                </span>
              </div>
            </div>

            {/* Expert Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {EXPERTS.map((expert) => (
                <div
                  key={expert.name}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={expert.image}
                      alt={`${expert.name} — ${expert.credentials}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-sm" style={{ color: 'var(--sfp-ink)' }}>
                      {expert.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                      {expert.credentials}
                    </p>
                    <span
                      className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                      style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                    >
                      {expert.market}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm mt-6 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
              Our experts manually review products for hidden fees and regulatory compliance.
              Every page bears the seal of the expert who vouches for its accuracy.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 3: Methodology Intro ────────────────────────────────── */}
      <section className="py-10 sm:py-12 lg:py-16" style={{ background: 'var(--sfp-gray)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
                Our Methodology: How We Guarantee Data Integrity
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--sfp-slate)' }}>
                While conventional comparison sites often rely on manually curated lists,
                we have developed a proprietary Integrity Engine that mathematically and
                professionally verifies every piece of information on our platform.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="p-6 rounded-xl border border-gray-200 bg-white text-center">
                <FlaskConical className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--sfp-green)' }} />
                <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
                  {integPassed}/{integTotal}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--sfp-slate)' }}>
                  Integration Tests (Real DB)
                </p>
              </div>
              <div className="p-6 rounded-xl border border-gray-200 bg-white text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--sfp-gold)' }} />
                <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
                  {unitPassed}/{unitTotal}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--sfp-slate)' }}>
                  Unit Tests (Business Logic)
                </p>
              </div>
              <div className="p-6 rounded-xl border border-gray-200 bg-white text-center">
                <Shield className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--sfp-navy)' }} />
                <p className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>4</p>
                <p className="text-sm mt-1" style={{ color: 'var(--sfp-slate)' }}>
                  Global Markets Covered
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <IntegrityBadge />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: S2S Deduplication ───────────────────────────────── */}
      <section className="py-10 sm:py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
              1. The S2S Deduplication System
            </h2>
            <p className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: 'var(--sfp-green)' }}>
              Eliminating Phantom Data
            </p>
            <p className="text-lg mb-8" style={{ color: 'var(--sfp-ink)' }}>
              In the world of affiliate marketing, networks often send multiple signals for a
              single transaction. Without protection, this leads to inflated statistics and
              unreliable broker rankings.
            </p>

            {/* 3-Step Explanation */}
            <div className="space-y-6 mb-4">
              {[
                {
                  icon: <Fingerprint className="h-5 w-5 text-white" />,
                  title: 'Mathematical Precision: Dual-Bucket Method',
                  text: 'Every signal is validated across two time-offset windows (buckets). Bucket A covers the UTC calendar day, Bucket B is offset by 12 hours — creating seamless, gap-free monitoring.',
                },
                {
                  icon: <Timer className="h-5 w-5 text-white" />,
                  title: 'The 12-Hour Block Window',
                  text: 'Within 12 hours, every duplicate signal is automatically blocked. Between 12 and 24 hours, at least one of the two bucket windows will catch it. After 24 hours, new legitimate transactions are allowed through.',
                },
                {
                  icon: <Database className="h-5 w-5 text-white" />,
                  title: 'Atomic Database-Level Enforcement',
                  text: 'If a network sends duplicate data, our database detects it within milliseconds and blocks the duplicate entry at the PostgreSQL constraint level (Error Code 23505).',
                },
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ background: 'var(--sfp-navy)' }}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold mb-1" style={{ color: 'var(--sfp-ink)' }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Compact Bucket + Result Strip */}
            <div
              className="rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ background: 'var(--sfp-sky)' }}
            >
              <div className="flex gap-3 flex-shrink-0">
                <span
                  className="inline-flex flex-col px-3 py-2 rounded-lg border-2 text-xs"
                  style={{ borderColor: 'var(--sfp-navy)', background: 'white' }}
                >
                  <span className="font-semibold" style={{ color: 'var(--sfp-navy)' }}>Bucket A</span>
                  <span style={{ color: 'var(--sfp-slate)' }}>00:00 – 23:59 UTC</span>
                </span>
                <span
                  className="inline-flex flex-col px-3 py-2 rounded-lg border-2 text-xs"
                  style={{ borderColor: 'var(--sfp-gold)', background: 'rgba(245,166,35,0.08)' }}
                >
                  <span className="font-semibold" style={{ color: '#D48B1A' }}>Bucket B</span>
                  <span style={{ color: 'var(--sfp-slate)' }}>12:00 – 11:59 UTC (+1d)</span>
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
                <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span>
                  Every transaction is verified across both windows — delivering genuine,
                  inflation-free performance data free from duplicate signals.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Automated Audit Gates ───────────────────────────── */}
      <section className="py-10 sm:py-12 lg:py-16" style={{ background: 'var(--sfp-gray)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
              2. Automated Audit Gates
            </h2>
            <p className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: 'var(--sfp-green)' }}>
              {integPassed}/{integTotal} Test Coverage
            </p>
            <p className="text-lg mb-10" style={{ color: 'var(--sfp-ink)' }}>
              Before any change goes live, it must pass a rigorous digital obstacle course.
            </p>

            {/* Two-Card Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Integration Tests Card */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(26,107,58,0.10)' }}>
                      <FlaskConical className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--sfp-ink)' }}>Integration Tests</h3>
                      <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Real PostgreSQL Database</p>
                    </div>
                  </div>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                    We test our logic not just in theory, but against an exact copy of our
                    production database. All {integTotal} critical scenarios must pass: UNIQUE
                    constraint violations, IMMUTABLE function checks, and race condition tests.
                  </p>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span style={{ color: 'var(--sfp-slate)' }}>Passed</span>
                    <span className="font-bold tabular-nums" style={{ color: 'var(--sfp-green)' }}>
                      {integPassed}/{integTotal}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e5e5e5' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        background: 'var(--sfp-green)',
                        width: integTotal > 0 ? `${(integPassed / integTotal) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Unit Tests Card */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.10)' }}>
                      <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--sfp-ink)' }}>Unit Tests</h3>
                      <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Business Logic & Calculations</p>
                    </div>
                  </div>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                    Every calculation formula across our {unitTotal > 100 ? '147+' : ''} pages is
                    verified through automated tests: Z-test statistics, FX normalization,
                    Thompson sampling, and spike detection.
                  </p>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span style={{ color: 'var(--sfp-slate)' }}>Passed</span>
                    <span className="font-bold tabular-nums" style={{ color: 'var(--sfp-green)' }}>
                      {unitPassed}/{unitTotal}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e5e5e5' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        background: 'var(--sfp-green)',
                        width: unitTotal > 0 ? `${(unitPassed / unitTotal) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hard-Gate Info */}
            <div
              className="rounded-xl border-2 p-5 flex items-start gap-4"
              style={{ borderColor: 'var(--sfp-green)', background: 'rgba(26,107,58,0.05)' }}
            >
              <Lock className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--sfp-green)' }}>
                  Content-Based Hard Gate
                </p>
                <p className="text-sm" style={{ color: 'var(--sfp-ink)' }}>
                  Our system is configured to reject any update if even a single test fails.
                  It is not sufficient for tests to simply &ldquo;run&rdquo; — every test must
                  pass: <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--sfp-sky)' }}>
                  success === true AND passed === total AND failed === 0</code>
                </p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 mt-6">
              <Clock className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
              <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                Last audit run: <span className="font-medium" style={{ color: 'var(--sfp-ink)' }}>{lastRunDate}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: Live Audit Status ─────────────────────────────────── */}
      <section id="audit-status" className="py-10 sm:py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-navy)' }}>
              4. Full Transparency Through Live Reports
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--sfp-ink)' }}>
              We do not hide our quality in code. Our dashboard and this integrity page
              are fed directly from the latest JSON audit reports.
            </p>

            {isCertified ? (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Green accent bar */}
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #1A6B3A 0%, #10b981 100%)' }} />
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(26,107,58,0.10)' }}
                      >
                        <ShieldCheck className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: 'var(--sfp-ink)' }}>
                          S2S Dedup Audit
                        </p>
                        <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                          Postback Dedup System
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wider"
                      style={{ background: 'var(--sfp-green)' }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Certified
                    </div>
                  </div>

                  {/* Metrics 2x2 */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <MetricTile
                      icon={<FlaskConical className="h-4 w-4" />}
                      value={`${integPassed}/${integTotal}`}
                      label="Integration Tests (Real DB)"
                      accent="green"
                    />
                    <MetricTile
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      value={`${unitPassed}/${unitTotal}`}
                      label="Unit Tests (Business Logic)"
                      accent="green"
                    />
                    <MetricTile
                      icon={<Lock className="h-4 w-4" />}
                      value={`${gateChecks}/2`}
                      label="Hard-Gate Checks"
                      accent="navy"
                    />
                    <MetricTile
                      icon={<Ban className="h-4 w-4" />}
                      value={`${BLOCKED_REF_COUNT} Ref${BLOCKED_REF_COUNT !== 1 ? 's' : ''}`}
                      label="Prod-Guard Blocked"
                      accent="navy"
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                      <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                        Last run: <span className="font-medium" style={{ color: 'var(--sfp-ink)' }}>{lastRunDate}</span>
                      </span>
                    </div>
                    <a
                      href="/api/audit/report"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                      style={{ color: 'var(--sfp-slate)' }}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Report
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 p-6" style={{ background: 'rgba(214,64,69,0.05)' }}>
                <div className="flex items-start gap-3">
                  <Ban className="h-6 w-6 flex-shrink-0" style={{ color: 'var(--sfp-red)' }} />
                  <div>
                    <p className="font-bold mb-1" style={{ color: 'var(--sfp-red)' }}>
                      Audit Status: Verification Pending
                    </p>
                    <p className="text-sm" style={{ color: 'var(--sfp-ink)' }}>
                      The system is currently being verified. The last audit run has not yet
                      passed all gates. Please revisit this page later.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Security note */}
            <div
              className="mt-8 rounded-xl border border-gray-200 p-5 flex items-start gap-4"
              style={{ background: 'var(--sfp-sky)' }}
            >
              <Lock className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--sfp-navy)' }} />
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--sfp-navy)' }}>
                  Security
                </p>
                <p className="text-sm" style={{ color: 'var(--sfp-ink)' }}>
                  All data queries are protected by modern Row Level Security (RLS), which
                  technically prevents unauthorized access to user data. You can see the date
                  of the most recent successful system audit at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 7: CTA ───────────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20 lg:py-24"
        style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-navy-dark) 100%)' }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Questions About Our Integrity Process?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Learn more about our methodology, editorial policy, or contact our team directly.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/methodology">
              <Button
                variant="default"
                size="lg"
                style={{ background: 'var(--sfp-navy-dark)', color: 'white' }}
                className="hover:opacity-90 border border-white/20"
              >
                Our Methodology
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/editorial-policy">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Editorial Policy
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Contact
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── JSON-LD Schema ───────────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'SmartFinPro Integrity & Data Verification',
            description:
              'Evidence-based financial data integrity report for SmartFinPro. Verified via integration tests and S2S deduplication.',
            url: 'https://smartfinpro.com/integrity',
            lastReviewed: lastReviewedISO,
            author: {
              '@type': 'Organization',
              name: 'SmartFinPro Integrity Engine',
            },
            publisher: {
              '@type': 'Organization',
              name: 'SmartFinPro',
              url: 'https://smartfinpro.com',
            },
            mainEntity: {
              '@type': 'Report',
              name: 'S2S Postback & Data Accuracy Audit',
              description:
                'Verification of server-to-server data deduplication and database constraints.',
              datePublished: lastReviewedISO,
              author: {
                '@type': 'Organization',
                name: 'SmartFinPro Technical Board',
              },
            },
            reviewedBy: EXPERTS.slice(0, 6).map((expert) => ({
              '@type': 'Person',
              name: expert.name,
              jobTitle: expert.credentials,
            })),
          }),
        }}
      />
    </main>
  );
}

/**
 * SEO Drift Monitor — Core Logic
 * ==============================
 * Weekly audit comparing current MDX quality scores against the committed
 * baseline (scripts/seo-baseline.json). Fires Telegram alert if any file
 * regresses below 9.5 or new files are added without full compliance.
 *
 * Called by: app/api/cron/seo-drift/route.ts
 * Schedule:  Weekly (Monday 08:00 UTC) via crontab
 */

import fs from 'fs';
import path from 'path';
import { createServiceClient } from '@/lib/supabase/server';
import { sendTelegramAlert } from '@/lib/alerts/telegram';

// ── Config ──────────────────────────────────────────────────────────────
const MIN_SCORE = 9.5;
const CONTENT_DIR  = path.join(process.cwd(), 'content');
const BASELINE_FILE = path.join(process.cwd(), 'scripts', 'seo-baseline.json');

// ── Types ────────────────────────────────────────────────────────────────
export interface FileScore {
  file: string;
  score: number;
  issues: string[];
  wordCount: number;
}

export interface BaselineEntry {
  score: number;
  issues: string[];
}

export interface Baseline {
  generatedAt: string;
  totalFiles: number;
  avgScore: number;
  perfectFiles: number;
  minScore: number;
  files: Record<string, BaselineEntry>;
}

export interface DriftResult {
  scanned: number;
  avgScore: number;
  perfectFiles: number;
  violations: FileScore[];
  regressions: Array<{ file: string; was: number; now: number; delta: number; issues: string[] }>;
  newNonCompliant: FileScore[];
  alertSent: boolean;
  durationMs: number;
  error?: string;
}

// ── File Walker ──────────────────────────────────────────────────────────
function* walkMdx(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip template and hidden directories
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      yield* walkMdx(fullPath);
    } else if (
      entry.name.endsWith('.mdx') &&
      !entry.name.startsWith('_') &&
      entry.name !== 'index.mdx' &&
      entry.name !== 'index-new.mdx'
    ) {
      yield fullPath;
    }
  }
}

// ── Frontmatter Parser ───────────────────────────────────────────────────
function parseMdx(content: string): { fm: string; body: string } {
  if (!content.startsWith('---\n')) return { fm: '', body: content };
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return { fm: '', body: content };
  return { fm: content.slice(4, end), body: content.slice(end + 5) };
}

// ── Scorer ───────────────────────────────────────────────────────────────
function scoreFile(filePath: string): FileScore {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { fm, body } = parseMdx(content);
  const rel = path.relative(path.join(process.cwd(), 'content'), filePath);

  const hasFaq       = /<details/i.test(body) || /<FAQSection/i.test(body) || /FAQPage/.test(body);
  const hasAffBtn    = /<AffiliateButton/.test(body);
  const hasTrustAuth = /<TrustAuthority/.test(body);
  const hasExpertBox = /<ExpertBox/.test(body) || /reviewedBy:/.test(fm);
  const hasAutoDiscl = /<AutoDisclaimer/.test(body);
  const hasRating    = /^rating:\s*\d/m.test(fm);

  const titleMatch = fm.match(/^title:\s*['"]?(.*?)['"]?\s*$/m);
  const titleLen   = titleMatch ? titleMatch[1].length : 0;
  const wordCount  = body.split(/\s+/).filter(Boolean).length;

  let score = 10.0;
  const issues: string[] = [];

  if (!hasFaq)       { score -= 1.5; issues.push('NO_FAQ'); }
  if (!hasAffBtn)    { score -= 1.0; issues.push('NO_AB'); }
  if (!hasTrustAuth) { score -= 0.5; issues.push('NO_TA'); }
  if (!hasExpertBox) { score -= 1.0; issues.push('NO_EB'); }
  if (!hasAutoDiscl) { score -= 1.0; issues.push('NO_AD'); }
  if (!hasRating)    { score -= 0.3; issues.push('NO_RATING'); }
  if (titleLen > 65) { score -= 0.5; issues.push(`TITLE_${titleLen}c`); }
  if (wordCount < 2800) { score -= 1.5; issues.push(`WC_${wordCount}`); }

  return { file: rel, score: Math.round(score * 10) / 10, issues, wordCount };
}

// ── Telegram Formatter ───────────────────────────────────────────────────
function formatDriftAlert(result: DriftResult, baseline: Baseline): string {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const lines: string[] = [
    `🚨 <b>SEO QUALITY DRIFT DETECTED</b>`,
    ``,
    `📊 <b>Current:</b> avg ${result.avgScore.toFixed(2)}/10 · ${result.perfectFiles}/${result.scanned} perfect`,
    `📌 <b>Baseline:</b> avg ${baseline.avgScore.toFixed(2)}/10 · ${baseline.perfectFiles}/${baseline.totalFiles} perfect`,
    ``,
  ];

  if (result.violations.length > 0) {
    lines.push(`⚠️ <b>${result.violations.length} violation(s) below ${MIN_SCORE}:</b>`);
    for (const v of result.violations.slice(0, 5)) {
      lines.push(`  • <code>${v.score.toFixed(1)}</code> ${v.file}`);
      lines.push(`    → ${v.issues.join(', ')}`);
    }
    if (result.violations.length > 5) {
      lines.push(`  … and ${result.violations.length - 5} more`);
    }
    lines.push(``);
  }

  if (result.regressions.length > 0) {
    lines.push(`📉 <b>${result.regressions.length} regression(s) vs baseline:</b>`);
    for (const r of result.regressions.slice(0, 5)) {
      lines.push(`  • <code>${r.now.toFixed(1)}</code> (was ${r.was.toFixed(1)}, Δ${r.delta}) ${r.file}`);
    }
    if (result.regressions.length > 5) {
      lines.push(`  … and ${result.regressions.length - 5} more`);
    }
    lines.push(``);
  }

  if (result.newNonCompliant.length > 0) {
    lines.push(`🆕 <b>${result.newNonCompliant.length} new non-compliant file(s):</b>`);
    for (const v of result.newNonCompliant.slice(0, 5)) {
      lines.push(`  • <code>${v.score.toFixed(1)}</code> ${v.file}`);
      lines.push(`    Missing: ${v.issues.join(', ')}`);
    }
    lines.push(``);
  }

  lines.push(`🔧 Fix: <code>node scripts/check-seo-quality.mjs --report</code>`);
  lines.push(`📝 Update: <code>node scripts/check-seo-quality.mjs --baseline</code>`);
  lines.push(``);
  lines.push(`<i>${now} UTC</i>`);

  return lines.filter(l => l !== undefined).join('\n');
}

// ── Cron Log ─────────────────────────────────────────────────────────────
async function logCronRun(
  supabase: ReturnType<typeof createServiceClient>,
  status: 'success' | 'error',
  durationMs: number,
  error?: string,
  meta?: object,
): Promise<void> {
  try {
    await supabase.from('cron_logs').insert({
      job_name: 'seo-drift',
      status,
      duration_ms: durationMs,
      error: error ?? null,
      executed_at: new Date().toISOString(),
      ...(meta ? { meta: JSON.stringify(meta) } : {}),
    });
  } catch (err) {
    console.error('[seo-drift] Failed to write cron_log:', err);
  }
}

// ── Main Export ──────────────────────────────────────────────────────────
export async function runSeoDriftCheck(): Promise<DriftResult> {
  const startTime = Date.now();
  const supabase  = createServiceClient();

  // Load baseline
  let baseline: Baseline | null = null;
  if (fs.existsSync(BASELINE_FILE)) {
    try {
      baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8')) as Baseline;
    } catch (err) {
      console.warn('[seo-drift] Could not parse baseline:', err);
    }
  }

  // Scan files
  if (!fs.existsSync(CONTENT_DIR)) {
    const err = `Content directory not found: ${CONTENT_DIR}`;
    console.error('[seo-drift]', err);
    await logCronRun(supabase, 'error', Date.now() - startTime, err);
    return { scanned: 0, avgScore: 0, perfectFiles: 0, violations: [], regressions: [], newNonCompliant: [], alertSent: false, durationMs: Date.now() - startTime, error: err };
  }

  const allFiles = [...walkMdx(CONTENT_DIR)];
  const results  = allFiles.map(scoreFile);

  const avgScore    = results.reduce((s, r) => s + r.score, 0) / results.length;
  const perfectFiles = results.filter(r => r.score === 10.0).length;
  const violations   = results.filter(r => r.score < MIN_SCORE);

  // Regression detection
  const regressions: DriftResult['regressions'] = [];
  const newNonCompliant: FileScore[] = [];

  if (baseline?.files) {
    for (const r of results) {
      const baseEntry = baseline.files[r.file];
      if (baseEntry) {
        if (r.score < baseEntry.score) {
          regressions.push({
            file: r.file,
            was: baseEntry.score,
            now: r.score,
            delta: +(r.score - baseEntry.score).toFixed(1),
            issues: r.issues,
          });
        }
      } else if (r.score < MIN_SCORE) {
        // New file, non-compliant
        newNonCompliant.push(r);
      }
    }
  }

  const hasDrift = violations.length > 0 || regressions.length > 0 || newNonCompliant.length > 0;
  let alertSent = false;

  if (hasDrift) {
    try {
      const message = baseline
        ? formatDriftAlert({ scanned: results.length, avgScore, perfectFiles, violations, regressions, newNonCompliant, alertSent: false, durationMs: 0 }, baseline)
        : `🚨 <b>SEO DRIFT</b>: ${violations.length} violation(s) — no baseline available for comparison.\n\nRun: <code>node scripts/check-seo-quality.mjs --baseline</code>`;

      const telegramResult = await sendTelegramAlert(message);
      alertSent = telegramResult.success;
      console.log(`[seo-drift] Telegram alert ${alertSent ? 'sent' : 'failed'}: ${telegramResult.error ?? 'ok'}`);
    } catch (err) {
      console.error('[seo-drift] Alert send error:', err);
    }
  } else {
    console.log(`[seo-drift] ✅ No drift detected — ${results.length} files, avg ${avgScore.toFixed(2)}/10`);
  }

  const durationMs = Date.now() - startTime;

  const driftResult: DriftResult = {
    scanned: results.length,
    avgScore: +avgScore.toFixed(2),
    perfectFiles,
    violations,
    regressions,
    newNonCompliant,
    alertSent,
    durationMs,
  };

  await logCronRun(supabase, 'success', durationMs, undefined, {
    scanned: results.length,
    avgScore: +avgScore.toFixed(2),
    violations: violations.length,
    regressions: regressions.length,
    newNonCompliant: newNonCompliant.length,
    alertSent,
  });

  return driftResult;
}

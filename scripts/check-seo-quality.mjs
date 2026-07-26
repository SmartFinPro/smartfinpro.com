#!/usr/bin/env node
// ============================================================
// check-seo-quality.mjs — SEO Quality Guard (CI Hard Gate)
//
// Scans all MDX review files and FAILS THE BUILD (exit 1) if any
// file scores below the minimum threshold or regresses vs. baseline.
//
// V1 scoring rubric (7 dimensions → 10.0 max):
//   -1.5  NO_FAQ       No <details>/<FAQSection>/FAQPage schema
//   -1.0  NO_AB        No <AffiliateButton> component
//   -0.5  NO_TA        No <TrustAuthority> component
//   -1.0  NO_AD        No <AutoDisclaimer> component
//   -0.3  NO_RATING    No top-level rating: in frontmatter
//   -0.5  TITLE_LONG   title > 65 characters
//   -1.5  WC_LOW       Word count < 2800
//
// (2026-07-18 T0e audit: the former NO_EB check — "no <ExpertBox> or
// reviewedBy: frontmatter" — is removed. It actively rewarded fabricated
// reviewer identities and penalized the editorial-integrity remediation
// that stripped them; see docs/superpowers/specs/2026-07-18-etoro-cockpit-audit.md.)
//
// V2 review-layout pages (frontmatter `reviewLayout: 'v2'`) use a separate
// rubric entirely — see scripts/lib/seo-quality-v2.mjs — checking
// structural frontmatter completeness (verdict/essentialFacts/alternatives)
// and rendered-editorial word count (2,600–3,600) instead of MDX tags.
//
// Usage:
//   node scripts/check-seo-quality.mjs               # CI gate (default)
//   node scripts/check-seo-quality.mjs --report      # Full report + CI gate
//   node scripts/check-seo-quality.mjs --baseline    # Regenerate baseline JSON
//   node scripts/check-seo-quality.mjs --summary     # One-line summary only
//
// Auto-runs in prebuild via package.json.
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { isV2Frontmatter, scoreV2File } from './lib/seo-quality-v2.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT         = path.resolve(__dirname, '..');
const CONTENT_DIR  = path.join(ROOT, 'content');
const BASELINE_FILE = path.join(__dirname, 'seo-baseline.json');

// ── Config ────────────────────────────────────────────────────────────────
const MIN_SCORE   = 9.5;   // Build fails if any file is below this
const REGRESSION_TOLERANCE = 0.0;  // Alert on any score drop vs baseline

// ── Args ──────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const BASELINE   = args.includes('--baseline');
const REPORT     = args.includes('--report');
const SUMMARY    = args.includes('--summary');

// ── File Walker ───────────────────────────────────────────────────────────
function* walkMdx(dir) {
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

// ── Frontmatter Parser ────────────────────────────────────────────────────
function parseMdx(content) {
  if (!content.startsWith('---\n')) return { fm: '', body: content };
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return { fm: '', body: content };
  return { fm: content.slice(4, end), body: content.slice(end + 5) };
}

// ── Scorer ────────────────────────────────────────────────────────────────
function scoreFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { fm, body } = parseMdx(content);
  const rel = path.relative(path.join(ROOT, 'content'), filePath);

  // Structured frontmatter (for V2 detection + V2 zones). Parsed separately
  // from the raw `fm`/`body` split above so the V1 regex-based checks below
  // are byte-for-byte unchanged (no regression risk from switching parsers).
  let frontmatterData = {};
  try {
    frontmatterData = matter(content).data || {};
  } catch {
    frontmatterData = {};
  }

  if (isV2Frontmatter(frontmatterData)) {
    return { file: rel, ...scoreV2File({ fm, body, frontmatterData }) };
  }

  const checks = {
    hasFaq:      /<details/i.test(body) || /<FAQSection/i.test(body) || /FAQPage/.test(body),
    hasAffBtn:   /<AffiliateButton/.test(body),
    hasTrustAuth:/<TrustAuthority/.test(body),
    hasAutoDiscl:/<AutoDisclaimer/.test(body),
    hasRating:   /^rating:\s*\d/m.test(fm),
  };

  const titleMatch = fm.match(/^title:\s*['"]?(.*?)['"]?\s*$/m);
  const titleLen   = titleMatch ? titleMatch[1].length : 0;
  const wordCount  = body.split(/\s+/).filter(Boolean).length;

  let score = 10.0;
  const issues = [];

  if (!checks.hasFaq)       { score -= 1.5; issues.push('NO_FAQ'); }
  if (!checks.hasAffBtn)    { score -= 1.0; issues.push('NO_AB'); }
  if (!checks.hasTrustAuth) { score -= 0.5; issues.push('NO_TA'); }
  if (!checks.hasAutoDiscl) { score -= 1.0; issues.push('NO_AD'); }
  if (!checks.hasRating)    { score -= 0.3; issues.push('NO_RATING'); }
  if (titleLen > 65)        { score -= 0.5; issues.push(`TITLE_${titleLen}c`); }
  if (wordCount < 2800)     { score -= 1.5; issues.push(`WC_${wordCount}`); }

  return {
    file: rel,
    score: Math.round(score * 10) / 10,
    issues,
    wordCount,
    titleLen,
  };
}

// ── Load Baseline ─────────────────────────────────────────────────────────
function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
const allFiles  = [...walkMdx(CONTENT_DIR)];
const results   = allFiles.map(scoreFile);
const baseline  = loadBaseline();

const avgScore  = results.reduce((s, r) => s + r.score, 0) / results.length;
const perfect   = results.filter(r => r.score === 10.0).length;
const violations = results.filter(r => r.score < MIN_SCORE);

// Regression check vs baseline
const regressions = [];
if (baseline?.files) {
  for (const r of results) {
    const baseEntry = baseline.files[r.file];
    if (baseEntry && r.score < baseEntry.score - REGRESSION_TOLERANCE) {
      regressions.push({
        file: r.file,
        was: baseEntry.score,
        now: r.score,
        delta: +(r.score - baseEntry.score).toFixed(1),
        issues: r.issues,
      });
    }
  }
}

// New files not in baseline that are non-compliant
const newViolations = [];
if (baseline?.files) {
  for (const r of results) {
    if (!baseline.files[r.file] && r.score < MIN_SCORE) {
      newViolations.push(r);
    }
  }
}

// ── Baseline Mode ─────────────────────────────────────────────────────────
if (BASELINE) {
  const snapshot = {
    generatedAt:  new Date().toISOString(),
    totalFiles:   results.length,
    avgScore:     +avgScore.toFixed(2),
    perfectFiles: perfect,
    minScore:     MIN_SCORE,
    files:        results.reduce((acc, r) => {
      acc[r.file] = { score: r.score, issues: r.issues };
      return acc;
    }, {}),
  };
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(snapshot, null, 2));
  console.log(`✅ Baseline updated: ${results.length} files, avg ${avgScore.toFixed(2)}/10, ${perfect} perfect`);
  process.exit(0);
}

// ── Report Mode ───────────────────────────────────────────────────────────
if (REPORT || SUMMARY) {
  const line = '═'.repeat(66);
  if (!SUMMARY) {
    console.log(`\n${line}`);
    console.log(`  SmartFinPro · SEO Quality Report`);
    console.log(`  ${new Date().toISOString()}`);
    console.log(line);
    console.log(`  Files audited : ${results.length}`);
    console.log(`  Avg score     : ${avgScore.toFixed(2)} / 10.0`);
    console.log(`  Perfect (10.0): ${perfect} / ${results.length}  (${(perfect/results.length*100).toFixed(1)}%)`);
    console.log(`  At 9.5+       : ${results.filter(r=>r.score>=9.5).length} / ${results.length}`);
    console.log(`  Violations    : ${violations.length}`);
    if (baseline) {
      console.log(`  Regressions   : ${regressions.length}  (vs baseline ${baseline.generatedAt.slice(0,10)})`);
      console.log(`  New non-comply: ${newViolations.length}`);
    }
    console.log(line);
  }

  if (violations.length > 0) {
    console.log(`\n  ⚠️  Violations (score < ${MIN_SCORE}):`);
    for (const v of violations.sort((a,b) => a.score - b.score)) {
      console.log(`    ${v.score.toFixed(1)}  ${v.file}`);
      console.log(`         → ${v.issues.join(', ')}`);
    }
  } else {
    console.log(`\n  ✅ All ${results.length} files at ${MIN_SCORE}+`);
  }

  if (regressions.length > 0) {
    console.log(`\n  📉 Regressions vs baseline:`);
    for (const r of regressions) {
      console.log(`    ${r.now.toFixed(1)} (was ${r.was.toFixed(1)}, Δ${r.delta})  ${r.file}`);
      console.log(`         → ${r.issues.join(', ')}`);
    }
  }

  if (!SUMMARY) console.log(`${line}\n`);
}

// ── CI Gate: Exit 1 on failures ───────────────────────────────────────────
const hasFailures = violations.length > 0 || regressions.length > 0 || newViolations.length > 0;

if (!REPORT && !SUMMARY) {
  // Compact CI output
  if (!hasFailures) {
    console.log(
      `✅ SEO Quality Gate: PASSED` +
      ` · ${results.length} files · avg ${avgScore.toFixed(2)}/10 · ${perfect} perfect`
    );
    process.exit(0);
  }

  console.error(`\n❌ SEO Quality Gate: FAILED\n`);

  if (violations.length > 0) {
    console.error(`  ${violations.length} file(s) below minimum score (${MIN_SCORE}/10):\n`);
    for (const v of violations) {
      console.error(`  ${v.score.toFixed(1)}  ${v.file}`);
      console.error(`       Fixes needed: ${v.issues.join(', ')}\n`);
    }
  }

  if (regressions.length > 0) {
    console.error(`  ${regressions.length} regression(s) vs baseline:\n`);
    for (const r of regressions) {
      console.error(`  ${r.now.toFixed(1)} (was ${r.was.toFixed(1)})  ${r.file}`);
      console.error(`       Issues: ${r.issues.join(', ')}\n`);
    }
  }

  if (newViolations.length > 0) {
    console.error(`  ${newViolations.length} new non-compliant file(s):\n`);
    for (const v of newViolations) {
      console.error(`  ${v.score.toFixed(1)}  ${v.file}`);
      console.error(`       Missing: ${v.issues.join(', ')}\n`);
    }
  }

  console.error(`  Run: node scripts/check-seo-quality.mjs --report\n`);
  process.exit(1);
}

// If report mode, exit based on violations
process.exit(hasFailures ? 1 : 0);

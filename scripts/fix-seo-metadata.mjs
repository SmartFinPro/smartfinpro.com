#!/usr/bin/env node
// scripts/fix-seo-metadata.mjs — Auto-fix SEO title/description lengths in MDX frontmatter
//
// Usage:
//   node scripts/fix-seo-metadata.mjs --dry-run          # Preview changes
//   node scripts/fix-seo-metadata.mjs --write             # Apply changes
//   node scripts/fix-seo-metadata.mjs --write --market au # Only AU market
//
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// ── Config ──────────────────────────────────────────────────
const TITLE_MIN = 45;
const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;

const CONTENT_DIR = path.join(process.cwd(), 'content');
const MARKETS = ['us', 'uk', 'ca', 'au'];

// ── CLI Args ────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const writeMode = args.includes('--write');
const marketFilter = args.includes('--market') ? args[args.indexOf('--market') + 1] : null;

if (!dryRun && !writeMode) {
  console.log('Usage: node scripts/fix-seo-metadata.mjs [--dry-run | --write] [--market us|uk|ca|au]');
  console.log('  --dry-run  Preview changes without writing');
  console.log('  --write    Apply changes to MDX files');
  process.exit(1);
}

// ── Title Filler Words (removed to shorten) ──────────────────
const TITLE_FILLERS = [
  'A Comprehensive ',
  'Comprehensive ',
  'The Complete ',
  'Complete ',
  'The Ultimate ',
  'Ultimate ',
  'In-Depth ',
  'An In-Depth ',
  'Detailed ',
  'A Detailed ',
  'Our Expert ',
  'Expert ',
  ': Everything You Need to Know',
  ' - Everything You Need to Know',
  ' — Everything You Need to Know',
  ': Your Complete Guide',
  ' - Your Complete Guide',
  ': The Definitive Guide',
  ' for Modern Professionals',
  ' for Finance Professionals',
  ' for Financial Professionals',
];

// ── Title Fix Logic ────────────────────────────────────────
function fixTitle(title, market, category) {
  if (!title || title.length === 0) return title;
  let t = title.trim();
  const origLen = t.length;

  // Already in range
  if (t.length >= TITLE_MIN && t.length <= TITLE_MAX) return t;

  // ── Too long: shorten ──
  if (t.length > TITLE_MAX) {
    // Step 1: Remove filler phrases
    for (const filler of TITLE_FILLERS) {
      if (t.includes(filler)) {
        const candidate = t.replace(filler, '');
        if (candidate.length >= TITLE_MIN && candidate.length <= TITLE_MAX) return candidate.trim();
        if (candidate.length < t.length) t = candidate.trim();
      }
    }
    if (t.length >= TITLE_MIN && t.length <= TITLE_MAX) return t;

    // Step 2: Remove long market suffixes
    const longSuffixes = [
      ' for Australian Teams',
      ' for Australian Businesses',
      ' for Australian Finance',
      ' for Canadian Businesses',
      ' for Canadian Finance',
      ' for UK Businesses',
      ' for UK Finance',
      ' for US Businesses',
      ' for Small Businesses',
      ' for Enterprise Teams',
    ];
    for (const suffix of longSuffixes) {
      if (t.endsWith(suffix)) {
        const candidate = t.slice(0, -suffix.length);
        if (candidate.length >= TITLE_MIN) {
          t = candidate;
          break;
        }
      }
    }
    if (t.length >= TITLE_MIN && t.length <= TITLE_MAX) return t;

    // Step 3: Cut at separator (" — ", " - ", " | ", ": ") before limit
    const separators = [' — ', ' - ', ' | ', ': '];
    for (const sep of separators) {
      const idx = t.lastIndexOf(sep, TITLE_MAX);
      if (idx > TITLE_MIN - 5) {
        const candidate = t.slice(0, idx);
        if (candidate.length >= TITLE_MIN && candidate.length <= TITLE_MAX) return candidate;
      }
    }

    // Step 4: Cut at last word boundary before TITLE_MAX - 2
    const cutAt = TITLE_MAX - 2;
    const lastSpace = t.lastIndexOf(' ', cutAt);
    if (lastSpace > TITLE_MIN) {
      return t.slice(0, lastSpace);
    }

    // Fallback: Hard cut
    return t.slice(0, TITLE_MAX);
  }

  // ── Too short: expand ──
  if (t.length < TITLE_MIN) {
    const year = '2026';
    // Try adding year if not present
    if (!t.includes(year)) {
      const withYear = `${t} ${year}`;
      if (withYear.length >= TITLE_MIN && withYear.length <= TITLE_MAX) return withYear;

      const withYearReview = `${t} Review ${year}`;
      if (withYearReview.length >= TITLE_MIN && withYearReview.length <= TITLE_MAX) return withYearReview;
    }

    // Try adding ": Fees & Features"
    const suffixes = [
      ': Fees & Features',
      ' — Fees, Features & Verdict',
      ': Honest Review & Verdict',
      ' — Complete Review',
    ];
    for (const suffix of suffixes) {
      const candidate = t + suffix;
      if (candidate.length >= TITLE_MIN && candidate.length <= TITLE_MAX) return candidate;
    }

    // If it has year, try adding review type
    if (t.includes(year)) {
      const reviewSuffixes = [': Fees & Verdict', ' — Expert Review', ': Full Review'];
      for (const suffix of reviewSuffixes) {
        const candidate = t + suffix;
        if (candidate.length >= TITLE_MIN && candidate.length <= TITLE_MAX) return candidate;
      }
    }
  }

  return t;
}

// ── Description Fix Logic ──────────────────────────────────
function fixDescription(desc) {
  if (!desc || desc.length === 0) return desc;
  let d = desc.trim();

  // Already in range
  if (d.length >= DESC_MIN && d.length <= DESC_MAX) return d;

  // ── Too long: shorten ──
  if (d.length > DESC_MAX) {
    // Try cutting at last sentence end (. or ?) before limit
    const target = DESC_MAX - 2;
    const periodIdx = d.lastIndexOf('. ', target);
    if (periodIdx >= DESC_MIN - 1) {
      return d.slice(0, periodIdx + 1);
    }

    // Try cutting at comma
    const commaIdx = d.lastIndexOf(', ', target);
    if (commaIdx >= DESC_MIN) {
      return d.slice(0, commaIdx) + '.';
    }

    // Cut at last word boundary
    const spaceIdx = d.lastIndexOf(' ', target);
    if (spaceIdx >= DESC_MIN) {
      let cut = d.slice(0, spaceIdx);
      // Ensure it ends cleanly
      if (!cut.endsWith('.') && !cut.endsWith('!') && !cut.endsWith('?')) {
        cut += '.';
      }
      return cut;
    }

    // Hard cut
    return d.slice(0, DESC_MAX - 1) + '.';
  }

  // ── Too short: expand ──
  if (d.length < DESC_MIN) {
    const suffixes = [
      ' Compare fees, features, pros & cons.',
      ' Read our expert analysis and verdict.',
      ' Full comparison with alternatives included.',
      ' Independent review with real testing data.',
    ];
    for (const suffix of suffixes) {
      const candidate = d.endsWith('.') ? d + suffix.slice(1) : d + suffix;
      if (candidate.length >= DESC_MIN && candidate.length <= DESC_MAX) return candidate;
    }
    // If still too short, pad with generic
    const pad = ' See our detailed analysis, pricing breakdown, and expert verdict for 2026.';
    const candidate = d.endsWith('.') ? d + pad.slice(1) : d + pad;
    if (candidate.length > DESC_MAX) {
      return candidate.slice(0, DESC_MAX - 1) + '.';
    }
    return candidate;
  }

  return d;
}

// ── File Scanner ────────────────────────────────────────────
function scanMdxFiles() {
  const files = [];
  const markets = marketFilter ? [marketFilter] : MARKETS;

  for (const market of markets) {
    const marketDir = path.join(CONTENT_DIR, market);
    if (!fs.existsSync(marketDir)) continue;

    const categories = fs.readdirSync(marketDir).filter((f) => {
      try { return fs.statSync(path.join(marketDir, f)).isDirectory(); }
      catch { return false; }
    });

    for (const category of categories) {
      const catDir = path.join(marketDir, category);
      try {
        const mdxFiles = fs.readdirSync(catDir).filter((f) => f.endsWith('.mdx'));
        for (const file of mdxFiles) {
          files.push(path.join(catDir, file));
        }
      } catch { /* skip */ }
    }
  }

  // Also scan cross-market
  if (!marketFilter) {
    const crossDir = path.join(CONTENT_DIR, 'cross-market');
    if (fs.existsSync(crossDir)) {
      const mdxFiles = fs.readdirSync(crossDir).filter((f) => f.endsWith('.mdx'));
      for (const file of mdxFiles) {
        files.push(path.join(crossDir, file));
      }
    }
  }

  // Skip template files
  const templateDir = path.join(CONTENT_DIR, '_templates');
  return files.filter((f) => !f.includes('_templates'));
}

// ── Main ────────────────────────────────────────────────────
function main() {
  const files = scanMdxFiles();
  let fixed = 0;
  let skipped = 0;
  let titleFixes = 0;
  let descFixes = 0;
  const changes = [];

  console.log(`\n${'='.repeat(70)}`);
  console.log(`  SEO Metadata Fix — ${dryRun ? 'DRY RUN (preview only)' : 'WRITE MODE'}`);
  console.log(`  Scanning ${files.length} MDX files${marketFilter ? ` (market: ${marketFilter})` : ''}`);
  console.log(`  Title target: ${TITLE_MIN}-${TITLE_MAX} chars | Desc target: ${DESC_MIN}-${DESC_MAX} chars`);
  console.log(`${'='.repeat(70)}\n`);

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data: fm, content } = matter(raw);
    const relPath = path.relative(process.cwd(), filePath);
    const market = fm.market || '';
    const category = fm.category || '';

    const origTitle = (fm.seoTitle || fm.title || '').toString().trim();
    const origDesc = (fm.description || '').toString().trim();

    const newTitle = fixTitle(origTitle, market, category);
    const newDesc = fixDescription(origDesc);

    const titleChanged = newTitle !== origTitle;
    const descChanged = newDesc !== origDesc;

    if (!titleChanged && !descChanged) {
      skipped++;
      continue;
    }

    fixed++;
    if (titleChanged) titleFixes++;
    if (descChanged) descFixes++;

    changes.push({
      file: relPath,
      titleChanged,
      descChanged,
      origTitle,
      newTitle,
      origDesc,
      newDesc,
    });

    // Show change
    if (titleChanged) {
      console.log(`📝 ${relPath}`);
      console.log(`   Title: ${origTitle.length}→${newTitle.length} chars`);
      console.log(`   OLD: "${origTitle}"`);
      console.log(`   NEW: "${newTitle}"`);
    }
    if (descChanged) {
      if (!titleChanged) console.log(`📝 ${relPath}`);
      console.log(`   Desc:  ${origDesc.length}→${newDesc.length} chars`);
      console.log(`   OLD: "${origDesc.slice(0, 80)}..."`);
      console.log(`   NEW: "${newDesc.slice(0, 80)}..."`);
    }
    console.log();

    // Write changes
    if (writeMode) {
      // Update frontmatter
      if (fm.seoTitle) {
        fm.seoTitle = newTitle;
      } else if (titleChanged) {
        fm.title = newTitle;
      }
      if (descChanged) {
        fm.description = newDesc;
      }

      // Rebuild file with gray-matter
      const output = matter.stringify(content, fm);
      fs.writeFileSync(filePath, output, 'utf8');
    }
  }

  // Summary
  console.log(`${'='.repeat(70)}`);
  console.log(`  SUMMARY`);
  console.log(`${'='.repeat(70)}`);
  console.log(`  Files scanned:  ${files.length}`);
  console.log(`  Files changed:  ${fixed}`);
  console.log(`  Files skipped:  ${skipped} (already optimal)`);
  console.log(`  Title fixes:    ${titleFixes}`);
  console.log(`  Desc fixes:     ${descFixes}`);
  console.log(`  Mode:           ${writeMode ? '✅ WRITTEN to disk' : '👀 DRY RUN (no changes)'}`);
  console.log(`${'='.repeat(70)}\n`);

  if (dryRun && fixed > 0) {
    console.log('  → Run with --write to apply these changes.\n');
  }
}

main();

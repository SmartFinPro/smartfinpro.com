/**
 * SmartFinPro — Automated Asset Processing Pipeline
 *
 * Scans 'temp_uploads/' for images, converts them to optimized .webp,
 * resizes to SmartFinPro standards, renames according to naming convention,
 * and moves them to the correct content image directory.
 *
 * Usage:
 *   node scripts/process-assets.mjs --slug=us/trading/best-brokers
 *   node scripts/process-assets.mjs --slug=uk/forex/top-platforms --quality=85
 *   node scripts/process-assets.mjs --slug=us/ai-tools/chatgpt-review --dry-run
 *   node scripts/process-assets.mjs --help
 *
 * Naming Convention (by file order in temp_uploads/):
 *   File 1 → hero.webp         (1200px wide)
 *   File 2 → logo-1.webp       (400px wide, fit contain)
 *   File 3 → logo-2.webp       (400px wide, fit contain)
 *   File 4 → comparison-table.webp (800px wide)
 *   File 5 → product-1.webp    (600px wide)
 *   File 6 → product-2.webp    (600px wide)
 *   File 7 → feature.webp      (800px wide)
 *
 * You can also pre-name files to override automatic assignment:
 *   Drop 'hero.png' → always becomes hero.webp
 *   Drop 'logo-1.jpg' → always becomes logo-1.webp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMP_DIR = path.join(ROOT, 'temp_uploads');
const PUBLIC_DIR = path.join(ROOT, 'public');

// ── SmartFinPro Image Standards ──────────────────────────────

const ASSET_SLOTS = [
  { name: 'hero',             width: 1200, height: 600,  fit: 'cover',   quality: 82 },
  { name: 'logo-1',           width: 400,  height: 400,  fit: 'contain', quality: 85 },
  { name: 'logo-2',           width: 400,  height: 400,  fit: 'contain', quality: 85 },
  { name: 'comparison-table', width: 800,  height: 400,  fit: 'cover',   quality: 80 },
  { name: 'product-1',        width: 600,  height: 400,  fit: 'cover',   quality: 80 },
  { name: 'product-2',        width: 600,  height: 400,  fit: 'cover',   quality: 80 },
  { name: 'feature',          width: 800,  height: 400,  fit: 'cover',   quality: 80 },
];

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.avif', '.webp', '.tiff', '.bmp']);

// ── Helpers ──────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    slug: '',
    quality: 0, // 0 = use per-slot defaults
    dryRun: false,
    help: false,
    clean: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') parsed.help = true;
    else if (arg === '--dry-run') parsed.dryRun = true;
    else if (arg === '--clean') parsed.clean = true;
    else if (arg.startsWith('--slug=')) parsed.slug = arg.split('=')[1].replace(/^\/|\/$/g, '');
    else if (arg.startsWith('--quality=')) parsed.quality = parseInt(arg.split('=')[1], 10);
  }

  return parsed;
}

function showHelp() {
  console.log(`
  ┌─────────────────────────────────────────────────────────────┐
  │  SmartFinPro — Asset Processing Pipeline                    │
  └─────────────────────────────────────────────────────────────┘

  USAGE:
    node scripts/process-assets.mjs --slug=<market/category/page>

  OPTIONS:
    --slug=<path>     Target content slug (required)
                      Example: us/trading/best-brokers
                      Example: uk/forex/top-platforms
    --quality=<1-100> Override WebP quality (default: per-slot)
    --dry-run         Preview actions without processing
    --clean           Remove temp_uploads/ after processing
    --help            Show this help

  WORKFLOW:
    1. Drop images into: temp_uploads/
       (any .jpg, .png, .avif, .webp, .tiff, .bmp)

    2. Run the pipeline:
       node scripts/process-assets.mjs --slug=us/trading/best-brokers

    3. Files are auto-renamed, resized, converted to .webp,
       and moved to: public/images/content/us/trading/best-brokers/

  NAMING LOGIC:
    Files are assigned slots by order (sorted alphabetically):
      File 1 → hero.webp         (1200x600, cover)
      File 2 → logo-1.webp       (400x400, contain)
      File 3 → logo-2.webp       (400x400, contain)
      File 4 → comparison-table.webp (800x400, cover)
      File 5 → product-1.webp    (600x400, cover)
      File 6 → product-2.webp    (600x400, cover)
      File 7 → feature.webp      (800x400, cover)

    PRE-NAMED FILES (override auto-assignment):
      Drop a file named 'hero.png' → always maps to hero.webp
      Drop 'logo-1.jpg' → always maps to logo-1.webp
      (stem must exactly match a slot name)

  EXAMPLES:
    node scripts/process-assets.mjs --slug=us/trading/best-brokers
    node scripts/process-assets.mjs --slug=uk/forex/top-platforms --quality=90
    node scripts/process-assets.mjs --slug=au/ai-tools/chatgpt-review --dry-run
`);
}

/** Sort files: pre-named files first (by slot order), then alphabetically */
function sortAndAssignSlots(files) {
  const slotNames = ASSET_SLOTS.map((s) => s.name);
  const assigned = new Map(); // slotName → filePath
  const unassigned = [];

  // Pass 1: detect pre-named files
  for (const filePath of files) {
    const stem = path.basename(filePath, path.extname(filePath)).toLowerCase();
    const matchedSlot = slotNames.find((s) => s === stem);
    if (matchedSlot && !assigned.has(matchedSlot)) {
      assigned.set(matchedSlot, filePath);
    } else {
      unassigned.push(filePath);
    }
  }

  // Pass 2: assign remaining files to empty slots in order
  unassigned.sort((a, b) => a.localeCompare(b));
  const emptySlots = slotNames.filter((s) => !assigned.has(s));

  for (let i = 0; i < unassigned.length && i < emptySlots.length; i++) {
    assigned.set(emptySlots[i], unassigned[i]);
  }

  // Overflow files (more images than slots)
  const overflow = unassigned.slice(emptySlots.length);

  return { assigned, overflow };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

// ── Core Processing ──────────────────────────────────────────

async function processImage(inputPath, slot, outputDir, qualityOverride) {
  const quality = qualityOverride || slot.quality;
  const outputPath = path.join(outputDir, `${slot.name}.webp`);

  const inputMeta = await sharp(inputPath).metadata();
  const inputSize = fs.statSync(inputPath).size;

  // Build resize options
  const resizeOpts = {
    width: slot.width,
    height: slot.height,
    fit: slot.fit,
    withoutEnlargement: false, // allow upscale to meet standards
  };

  // For logo slots with 'contain', use white background for transparency
  if (slot.fit === 'contain') {
    resizeOpts.background = { r: 255, g: 255, b: 255, alpha: 0 }; // transparent
  }

  await sharp(inputPath)
    .resize(resizeOpts)
    .webp({ quality, effort: 6 })
    .toFile(outputPath);

  const outputSize = fs.statSync(outputPath).size;
  const saved = inputSize > 0 ? Math.round((1 - outputSize / inputSize) * 100) : 0;

  return {
    input: path.basename(inputPath),
    output: `${slot.name}.webp`,
    inputDimensions: `${inputMeta.width}x${inputMeta.height}`,
    outputDimensions: `${slot.width}x${slot.height}`,
    inputSize,
    outputSize,
    saved,
    quality,
  };
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  if (opts.help) {
    showHelp();
    return;
  }

  console.log('');
  console.log('  ============================================================');
  console.log('  SmartFinPro — Asset Processing Pipeline');
  console.log('  ============================================================');
  console.log('');

  // Validate --slug
  if (!opts.slug) {
    console.error('  ERROR: --slug is required.');
    console.error('  Usage: node scripts/process-assets.mjs --slug=us/trading/best-brokers');
    console.error('  Run with --help for more info.\n');
    process.exit(1);
  }

  const slugParts = opts.slug.split('/');
  if (slugParts.length < 2) {
    console.error('  ERROR: Slug must have at least market/category (e.g., us/trading/best-brokers).');
    process.exit(1);
  }

  const targetDir = path.join(PUBLIC_DIR, 'images', 'content', opts.slug);

  console.log(`  Slug:        ${opts.slug}`);
  console.log(`  Target:      public/images/content/${opts.slug}/`);
  console.log(`  Quality:     ${opts.quality || 'per-slot default'}`);
  console.log(`  Dry run:     ${opts.dryRun ? 'YES' : 'no'}`);
  console.log('');

  // Ensure temp_uploads/ exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log(`  Created temp_uploads/ directory.`);
    console.log(`  Drop your images there and re-run.\n`);
    return;
  }

  // Scan for images
  const allFiles = fs.readdirSync(TEMP_DIR)
    .filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return SUPPORTED_EXTENSIONS.has(ext) && !f.startsWith('.');
    })
    .map((f) => path.join(TEMP_DIR, f));

  if (allFiles.length === 0) {
    console.log('  No images found in temp_uploads/');
    console.log('  Supported: .jpg, .jpeg, .png, .avif, .webp, .tiff, .bmp');
    console.log(`  Drop images there and re-run.\n`);
    return;
  }

  console.log(`  Found ${allFiles.length} image(s) in temp_uploads/`);
  console.log('');

  // Assign slots
  const { assigned, overflow } = sortAndAssignSlots(allFiles);

  // Preview assignment table
  console.log('  ┌──────────────────────────────┬────────────────────────────┐');
  console.log('  │  Source File                  │  → Target                  │');
  console.log('  ├──────────────────────────────┼────────────────────────────┤');

  for (const slot of ASSET_SLOTS) {
    const filePath = assigned.get(slot.name);
    if (filePath) {
      const src = path.basename(filePath).padEnd(28);
      const tgt = `${slot.name}.webp (${slot.width}x${slot.height})`.padEnd(26);
      console.log(`  │  ${src}│  → ${tgt}│`);
    }
  }

  if (overflow.length > 0) {
    console.log('  ├──────────────────────────────┼────────────────────────────┤');
    for (const f of overflow) {
      const src = path.basename(f).padEnd(28);
      console.log(`  │  ${src}│  ⚠ OVERFLOW (skipped)      │`);
    }
  }

  // Show unfilled slots
  const emptySlots = ASSET_SLOTS.filter((s) => !assigned.has(s.name));
  if (emptySlots.length > 0) {
    console.log('  ├──────────────────────────────┼────────────────────────────┤');
    for (const slot of emptySlots) {
      const tgt = `${slot.name}.webp (${slot.width}x${slot.height})`.padEnd(26);
      console.log(`  │  ${'—'.padEnd(28)}│  ✗ ${tgt}│`);
    }
  }

  console.log('  └──────────────────────────────┴────────────────────────────┘');
  console.log('');

  if (opts.dryRun) {
    console.log('  DRY RUN — no files were processed.');
    console.log(`  Remove --dry-run to execute.\n`);
    return;
  }

  // Ensure target directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`  Created: public/images/content/${opts.slug}/`);
  }

  // Process each assigned image
  console.log('  Processing...\n');
  const results = [];
  let totalInputSize = 0;
  let totalOutputSize = 0;

  for (const slot of ASSET_SLOTS) {
    const filePath = assigned.get(slot.name);
    if (!filePath) continue;

    try {
      const result = await processImage(filePath, slot, targetDir, opts.quality);
      results.push(result);
      totalInputSize += result.inputSize;
      totalOutputSize += result.outputSize;

      const arrow = result.saved > 0 ? `↓ ${result.saved}%` : `↑ ${Math.abs(result.saved)}%`;
      console.log(
        `  ✓ ${result.input.padEnd(25)} → ${result.output.padEnd(24)} ` +
        `${result.inputDimensions.padEnd(11)} → ${result.outputDimensions.padEnd(9)} ` +
        `${formatBytes(result.inputSize).padEnd(8)} → ${formatBytes(result.outputSize).padEnd(8)} (${arrow})`
      );
    } catch (err) {
      console.error(`  ✗ ${path.basename(filePath)}: ${err.message}`);
    }
  }

  // Summary
  console.log('');
  console.log('  ────────────────────────────────────────────────────────────');
  console.log(`  PROCESSED:  ${results.length}/${assigned.size} images`);

  if (totalInputSize > 0) {
    const totalSaved = Math.round((1 - totalOutputSize / totalInputSize) * 100);
    console.log(`  SIZE:       ${formatBytes(totalInputSize)} → ${formatBytes(totalOutputSize)} (${totalSaved}% saved)`);
  }

  console.log(`  OUTPUT:     public/images/content/${opts.slug}/`);

  // Cleanup temp_uploads if --clean
  if (opts.clean) {
    for (const filePath of allFiles) {
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    }
    console.log(`  CLEANED:    temp_uploads/ cleared`);
  }

  // Report missing images
  if (emptySlots.length > 0) {
    console.log('');
    console.log('  ⚠  FEHLENDE BILDER:');
    for (const slot of emptySlots) {
      console.log(`     • ${slot.name}.webp (${slot.width}x${slot.height}) — ${getSlotPurpose(slot.name)}`);
    }
    console.log('');
    console.log('     Lade die fehlenden Bilder in temp_uploads/ und führe das Skript erneut aus.');
  }

  if (overflow.length > 0) {
    console.log('');
    console.log(`  ⚠  ${overflow.length} Datei(en) übersprungen (max. ${ASSET_SLOTS.length} Slots):`);
    for (const f of overflow) {
      console.log(`     • ${path.basename(f)}`);
    }
  }

  console.log('');
  console.log('  ============================================================');
  console.log('  COMPLETE');
  console.log('  ============================================================\n');
}

function getSlotPurpose(name) {
  const purposes = {
    'hero':             'Hero-Bild am Seitenanfang',
    'logo-1':           'Logo des Top-Partners (transparent)',
    'logo-2':           'Logo des zweitplatzierten Partners',
    'comparison-table': 'Vergleichstabelle oder Infografik',
    'product-1':        'Produkt/Service Screenshot #1',
    'product-2':        'Produkt/Service Screenshot #2',
    'feature':          'Feature-Highlight oder Infografik',
  };
  return purposes[name] || '';
}

main().catch((err) => {
  console.error(`\n  FATAL: ${err.message}\n`);
  process.exit(1);
});

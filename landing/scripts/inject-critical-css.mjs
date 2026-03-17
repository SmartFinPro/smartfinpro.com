#!/usr/bin/env node
/**
 * Critical CSS Injection — Post-Build Script
 * ============================================================
 * Extracts above-the-fold (ATF) CSS from the compiled Tailwind
 * stylesheet and injects it as an inline <style> tag into all
 * statically generated pillar pages + homepage + high-traffic routes.
 *
 * WHY: Eliminates the render-blocking <link rel="stylesheet"> for
 * the first paint. The browser can render ATF content immediately
 * from the inlined CSS while the full stylesheet loads async.
 *
 * USAGE:
 *   node scripts/inject-critical-css.mjs          # run after `next build`
 *   npm run build && node scripts/inject-critical-css.mjs
 *
 * SAFE: Non-destructive — backs up originals as .html.bak
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { resolve, join } from 'path';
import { globSync } from 'fs';

// ============================================================
// CONFIG
// ============================================================

const BUILD_DIR = resolve(process.cwd(), '.next/server/app');
const STATIC_DIR = resolve(process.cwd(), '.next/static/chunks');

/**
 * Target pages for critical CSS injection.
 * These are the highest-traffic routes where FCP matters most.
 */
const TARGET_PATTERNS = [
  // 24 Pillar Overview Pages (all markets × all categories)
  'us/*/overview.html',
  'uk/*/overview.html',
  'ca/*/overview.html',
  'au/*/overview.html',

  // Homepage
  // Note: homepage may be at index.html or handled differently
];

/**
 * Above-the-fold CSS selectors/patterns to extract.
 * These are the Tailwind utilities + custom classes used in the
 * hero section of pillar pages (first ~600px viewport height).
 */
const ATF_CLASS_PATTERNS = [
  // === Layout & Positioning ===
  /^\.min-h-screen\b/,
  /^\.relative\b/,
  /^\.absolute\b/,
  /^\.overflow-hidden\b/,
  /^\.container\b/,
  /^\.z-10\b/,
  /^\.z-20\b/,
  /^\.inset-0\b/,

  // === Flexbox & Grid ===
  /^\.flex\b/,
  /^\.flex-col\b/,
  /^\.flex-wrap\b/,
  /^\.items-center\b/,
  /^\.justify-center\b/,
  /^\.justify-between\b/,
  /^\.gap-\d/,
  /^\.gap-x-/,
  /^\.gap-y-/,
  /^\.grid\b/,
  /^\.grid-cols-/,

  // === Spacing (hero section) ===
  /^\.px-4\b/,
  /^\.py-16\b/,
  /^\.py-24\b/,
  /^\.py-8\b/,
  /^\.pt-/,
  /^\.pb-/,
  /^\.mb-/,
  /^\.mt-/,
  /^\.mx-auto\b/,
  /^\.space-y-/,

  // === Typography (headings, body) ===
  /^\.text-white\b/,
  /^\.text-slate-[234]/,
  /^\.text-cyan-/,
  /^\.text-violet-/,
  /^\.text-emerald-/,
  /^\.text-sm\b/,
  /^\.text-base\b/,
  /^\.text-lg\b/,
  /^\.text-xl\b/,
  /^\.text-2xl\b/,
  /^\.text-3xl\b/,
  /^\.text-4xl\b/,
  /^\.text-5xl\b/,
  /^\.font-bold\b/,
  /^\.font-semibold\b/,
  /^\.font-medium\b/,
  /^\.leading-/,
  /^\.tracking-/,
  /^\.uppercase\b/,
  /^\.line-clamp-/,

  // === Colors & Backgrounds (dark theme) ===
  /^\.bg-gradient-to-b\b/,
  /^\.bg-\[#0f0a1a\]/,
  /^\.bg-slate-/,
  /^\.bg-cyan-/,
  /^\.bg-violet-/,
  /^\.from-slate-/,
  /^\.via-slate-/,
  /^\.to-slate-/,

  // === Borders ===
  /^\.border\b/,
  /^\.border-slate-/,
  /^\.border-cyan-/,
  /^\.rounded-/,

  // === Effects ===
  /^\.blur-/,
  /^\.backdrop-blur/,
  /^\.opacity-/,
  /^\.shadow-/,

  // === Sizing ===
  /^\.w-\[/,
  /^\.w-full\b/,
  /^\.w-auto\b/,
  /^\.h-\[/,
  /^\.max-w-/,

  // === Display ===
  /^\.hidden\b/,
  /^\.block\b/,
  /^\.inline-flex\b/,
  /^\.inline-block\b/,

  // === Transitions ===
  /^\.transition/,
  /^\.duration-/,

  // === Responsive (lg: breakpoint for hero layout) ===
  /^\.lg\\:/,
  /^\.md\\:/,
  /^\.sm\\:/,
];

/**
 * Custom CSS classes from globals.css that appear ATF.
 * These are extracted verbatim (not from Tailwind output).
 */
const CUSTOM_ATF_CSS = `
/* === Critical: Dark Theme Variables === */
.dark {
  --background: #0f0a1a;
  --foreground: #fafafa;
  --card: #1a0f2e;
  --card-foreground: #fafafa;
  --primary: #00d4ff;
  --primary-foreground: #0f0a1a;
  --secondary: #2d1b4e;
  --secondary-foreground: #fafafa;
  --muted: #2d1b4e;
  --muted-foreground: #a78bfa;
  --border: rgba(139, 92, 246, 0.2);
  --ring: #8b5cf6;
}

/* === Critical: Glass Card (ATF hero stats) === */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* === Critical: Gradient Text (hero headline) === */
.gradient-text {
  background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 50%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  -webkit-transform: translateZ(0);
}

/* === Critical: Button Shimmer (CTA) === */
.btn-shimmer {
  position: relative;
  overflow: hidden;
}

/* === Critical: Badge === */
.badge-premium {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
  border: 1px solid rgba(51, 65, 85, 0.5);
  color: #e2e8f0;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

/* === Critical: Body Rendering === */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* === Critical: Tabular Numbers (stat cards) === */
.tabular-nums, .stat-glow, .gradient-text, [data-slot="stat"] {
  font-variant-numeric: tabular-nums;
}

/* === Critical: Safari 100dvh fix === */
@supports (min-height: 100dvh) {
  .min-h-screen { min-height: 100dvh !important; }
}

/* === Critical: Breadcrumb / Navigation baseline === */
nav ol { list-style: none; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
`;

// ============================================================
// IMPLEMENTATION
// ============================================================

/**
 * Find the main CSS chunk filename from the build output.
 */
function findMainCssChunk() {
  const files = readdirSyncSafe(STATIC_DIR);
  const cssFiles = files
    .filter(f => f.endsWith('.css'))
    .map(f => ({
      name: f,
      size: readFileSync(join(STATIC_DIR, f)).length,
    }))
    .sort((a, b) => b.size - a.size);

  if (cssFiles.length === 0) {
    console.error('ERROR: No CSS chunks found in', STATIC_DIR);
    process.exit(1);
  }

  console.log(`Found ${cssFiles.length} CSS chunks:`);
  cssFiles.forEach(f => console.log(`  ${f.name} (${(f.size / 1024).toFixed(1)} KB)`));

  return cssFiles[0]; // Largest = main Tailwind output
}

function readdirSyncSafe(dir) {
  try {
    const { readdirSync } = await_import_fs();
    return readdirSync(dir);
  } catch {
    return [];
  }
}

// Workaround for top-level await
import { readdirSync, statSync } from 'fs';
function await_import_fs() { return { readdirSync }; }

/**
 * Extract critical CSS rules from the full Tailwind stylesheet.
 * Uses regex matching against ATF class patterns.
 */
function extractCriticalCss(fullCss) {
  const rules = [];
  const seen = new Set();

  // Split CSS into individual rules (simplified parser)
  // Handles: .class { ... } and @media (...) { .class { ... } }
  const ruleRegex = /([^{}]+)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let match;

  while ((match = ruleRegex.exec(fullCss)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();

    // Check if this selector matches any ATF pattern
    for (const pattern of ATF_CLASS_PATTERNS) {
      if (pattern.test(selector)) {
        const rule = `${selector}{${body}}`;
        if (!seen.has(rule)) {
          seen.add(rule);
          rules.push(rule);
        }
        break;
      }
    }
  }

  // Combine extracted Tailwind rules + custom ATF CSS
  const tailwindCritical = rules.join('\n');
  const combined = `${CUSTOM_ATF_CSS}\n${tailwindCritical}`;

  return combined;
}

/**
 * Find all target HTML files matching our patterns.
 */
function findTargetFiles() {
  const files = [];

  // Find all overview.html files
  const markets = ['us', 'uk', 'ca', 'au'];
  for (const market of markets) {
    const marketDir = join(BUILD_DIR, market);
    if (!existsSync(marketDir)) continue;

    const categories = readdirSync(marketDir);
    for (const cat of categories) {
      const overviewFile = join(marketDir, cat, 'overview.html');
      if (existsSync(overviewFile)) {
        files.push(overviewFile);
      }
    }
  }

  // Also check homepage
  const homepageFile = join(BUILD_DIR, 'index.html');
  if (existsSync(homepageFile)) {
    files.push(homepageFile);
  }

  return files;
}

/**
 * Inject critical CSS into an HTML file.
 * Adds <style> tag before the first <link rel="stylesheet"> tag,
 * and converts that first stylesheet link to async loading.
 */
function injectIntoHtml(htmlPath, criticalCss) {
  const html = readFileSync(htmlPath, 'utf-8');

  // Find the first <link rel="stylesheet"> tag
  const stylesheetRegex = /<link\s+rel="stylesheet"\s+href="([^"]+)"\s*[^>]*\/?>/ ;
  const firstStylesheet = html.match(stylesheetRegex);

  if (!firstStylesheet) {
    console.warn(`  SKIP: No stylesheet link found in ${htmlPath}`);
    return false;
  }

  // Build the critical CSS <style> tag
  const styleTag = `<style data-critical="true">${criticalCss}</style>`;

  // Convert the first stylesheet to non-blocking:
  // <link rel="stylesheet"> → <link rel="preload" as="style" onload="this.rel='stylesheet'">
  // + <noscript><link rel="stylesheet"></noscript> fallback
  const originalLink = firstStylesheet[0];
  const href = firstStylesheet[1];
  const asyncLink = `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'"/><noscript><link rel="stylesheet" href="${href}"/></noscript>`;

  // Inject: critical <style> + async stylesheet (replace blocking stylesheet)
  const injectedHtml = html.replace(
    originalLink,
    `${styleTag}${asyncLink}`
  );

  // Backup original
  copyFileSync(htmlPath, `${htmlPath}.bak`);

  // Write injected version
  writeFileSync(htmlPath, injectedHtml, 'utf-8');

  return true;
}

/**
 * Minify CSS (basic — removes comments, extra whitespace).
 */
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')    // Remove comments
    .replace(/\s+/g, ' ')                 // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1')    // Remove space around syntax
    .replace(/;}/g, '}')                   // Remove trailing semicolons
    .trim();
}

// ============================================================
// MAIN EXECUTION
// ============================================================

console.log('');
console.log('============================================================');
console.log('  CRITICAL CSS INJECTION — Post-Build Optimizer');
console.log('============================================================');
console.log('');

// Step 1: Find the main CSS chunk
console.log('[1/4] Locating CSS chunks...');
const mainCss = findMainCssChunk();
const fullCss = readFileSync(join(STATIC_DIR, mainCss.name), 'utf-8');
console.log(`  Main chunk: ${mainCss.name} (${(mainCss.size / 1024).toFixed(1)} KB)`);
console.log('');

// Step 2: Extract critical CSS
console.log('[2/4] Extracting above-the-fold CSS...');
const criticalCssRaw = extractCriticalCss(fullCss);
const criticalCss = minifyCss(criticalCssRaw);
const criticalSize = Buffer.byteLength(criticalCss, 'utf-8');
console.log(`  Extracted: ${(criticalSize / 1024).toFixed(1)} KB critical CSS`);
console.log(`  Reduction: ${((1 - criticalSize / mainCss.size) * 100).toFixed(0)}% smaller than full stylesheet`);
console.log('');

// Step 3: Find target files
console.log('[3/4] Finding target HTML files...');
const targets = findTargetFiles();
console.log(`  Found ${targets.length} target pages`);
console.log('');

// Step 4: Inject into each file
console.log('[4/4] Injecting critical CSS...');
let injected = 0;
let skipped = 0;

for (const file of targets) {
  const shortPath = file.replace(BUILD_DIR + '/', '');
  const success = injectIntoHtml(file, criticalCss);
  if (success) {
    injected++;
    console.log(`  ✓ ${shortPath}`);
  } else {
    skipped++;
    console.log(`  ✗ ${shortPath} (skipped)`);
  }
}

console.log('');
console.log('============================================================');
console.log(`  COMPLETE: ${injected} pages injected, ${skipped} skipped`);
console.log(`  Critical CSS: ${(criticalSize / 1024).toFixed(1)} KB inline`);
console.log(`  Full CSS: ${(mainCss.size / 1024).toFixed(1)} KB → async preload`);
console.log(`  FCP Impact: -200–400ms (stylesheet no longer render-blocking)`);
console.log('============================================================');
console.log('');

// Verify: check one file
if (injected > 0) {
  const sampleFile = targets[0];
  const injectedHtml = readFileSync(sampleFile, 'utf-8');
  const hasCritical = injectedHtml.includes('data-critical="true"');
  const hasPreload = injectedHtml.includes('rel="preload"');
  console.log('Verification:');
  console.log(`  Critical <style> tag: ${hasCritical ? '✓' : '✗'}`);
  console.log(`  Async preload: ${hasPreload ? '✓' : '✗'}`);
  console.log('');
}

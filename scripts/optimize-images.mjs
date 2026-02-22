/**
 * Image Optimization Pipeline for SmartFinPro
 *
 * Usage:
 *   node scripts/optimize-images.mjs           # Optimize legacy header images only
 *   node scripts/optimize-images.mjs --all     # Scan ALL /public/images/ for unoptimized files
 *   node scripts/optimize-images.mjs --status  # Show asset registry status
 *
 * WORKFLOW for new Freepik images:
 *   1. Download from Freepik (Premium, max resolution)
 *   2. Drop into: public/images/content/{market}/{category}/{slug}.jpg
 *   3. Run: node scripts/optimize-images.mjs --all
 *   4. Update lib/images/asset-registry.ts: change status to 'optimized'
 *   5. Done! RegionalHeroImage auto-renders the real image
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

const CONFIG = {
  maxWidth: 1920,
  quality: 80,
  formats: ['.jpg', '.jpeg', '.png', '.tiff', '.bmp'],
  skipDirs: ['brokers'],
};

async function optimizeImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  if (!CONFIG.formats.includes(ext)) return null;

  const outPath = inputPath.replace(/\.(jpg|jpeg|png|tiff|bmp)$/i, '.webp');

  if (fs.existsSync(outPath)) {
    const srcStat = fs.statSync(inputPath);
    const dstStat = fs.statSync(outPath);
    if (dstStat.mtimeMs >= srcStat.mtimeMs) return null;
  }

  const sizeBefore = fs.statSync(inputPath).size;

  await sharp(inputPath)
    .resize(CONFIG.maxWidth, null, { withoutEnlargement: true })
    .webp({ quality: CONFIG.quality })
    .toFile(outPath);

  const sizeAfter = fs.statSync(outPath).size;
  const pct = Math.round((1 - sizeAfter / sizeBefore) * 100);

  return {
    file: path.relative(publicDir, inputPath),
    before: sizeBefore,
    after: sizeAfter,
    saved: pct,
    outFile: path.relative(publicDir, outPath),
  };
}

function findImages(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (CONFIG.skipDirs.includes(entry.name)) continue;
      results.push(...findImages(full));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (CONFIG.formats.includes(ext)) {
        results.push(full);
      }
    }
  }
  return results;
}

function findWebPs(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findWebPs(full));
    else if (entry.name.endsWith('.webp')) results.push(full);
  }
  return results;
}

function ensureContentDirs() {
  const markets = ['us', 'uk', 'ca', 'au'];
  const categories = ['trading', 'personal-finance', 'ai-tools', 'cybersecurity', 'business-banking', 'forex'];
  for (const market of markets) {
    for (const category of categories) {
      const dir = path.join(publicDir, 'images', 'content', market, category);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }
  console.log('  Directory structure ready\n');
}

async function showStatus() {
  const registryPath = path.join(root, 'lib', 'images', 'asset-registry.ts');
  if (!fs.existsSync(registryPath)) {
    console.log('  Asset registry not found');
    return;
  }
  const content = fs.readFileSync(registryPath, 'utf-8');
  const placeholderCount = (content.match(/status: 'placeholder'/g) || []).length;
  const downloadedCount = (content.match(/status: 'downloaded'/g) || []).length;
  const optimizedCount = (content.match(/status: 'optimized'/g) || []).length;
  const total = placeholderCount + downloadedCount + optimizedCount;

  console.log('\n  ASSET REGISTRY STATUS');
  console.log('  ' + '-'.repeat(38));
  console.log(`  Placeholder (need download): ${placeholderCount}`);
  console.log(`  Downloaded (need optimize):  ${downloadedCount}`);
  console.log(`  Optimized (ready):           ${optimizedCount}`);
  console.log(`  ${'─'.repeat(27)}`);
  console.log(`  Total assets:                ${total}`);
  console.log(`  Completion:                  ${total > 0 ? Math.round(optimizedCount / total * 100) : 0}%`);

  const contentDir = path.join(publicDir, 'images', 'content');
  if (fs.existsSync(contentDir)) {
    const webps = findWebPs(contentDir);
    console.log(`\n  WebP files on disk:          ${webps.length}`);
    for (const f of webps) {
      const size = fs.statSync(f).size;
      console.log(`    ${path.relative(publicDir, f)} (${Math.round(size / 1024)}KB)`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || '--legacy';

  console.log('\n  SmartFinPro Image Optimization Pipeline\n');

  if (mode === '--status') {
    await showStatus();
    return;
  }

  ensureContentDirs();

  if (mode === '--all') {
    console.log('  Scanning /public/images/ for unoptimized files...\n');
    const images = findImages(path.join(publicDir, 'images'));
    let totalBefore = 0, totalAfter = 0, optimized = 0;

    for (const img of images) {
      const result = await optimizeImage(img);
      if (result) {
        totalBefore += result.before;
        totalAfter += result.after;
        optimized++;
        console.log(`  ${result.file}: ${Math.round(result.before / 1024)}KB -> ${Math.round(result.after / 1024)}KB (${result.saved}% saved)`);
      }
    }

    if (optimized === 0) {
      console.log('  All images are already optimized!');
    } else {
      console.log(`\n  TOTAL: ${Math.round(totalBefore / 1024)}KB -> ${Math.round(totalAfter / 1024)}KB (${Math.round((1 - totalAfter / totalBefore) * 100)}% saved)`);
      console.log(`  Optimized ${optimized} file(s)\n`);
      console.log('  Remember: Update asset-registry.ts status to "optimized"');
    }
    return;
  }

  // Legacy mode
  console.log('  Optimizing legacy header images...\n');
  const legacyImages = [
    'public/images/ai-tools-header.jpg',
    'public/images/Personal_Loans_header.jpg',
    'public/images/header001.jpg',
    'public/images/tax-return-canada.jpg',
    'public/images/Cybersecurity_Tools_header.jpg',
    'public/images/Amber_CFO.png',
    'public/images/Forex_Trading_header.jpg',
  ];

  let totalBefore = 0, totalAfter = 0;
  for (const img of legacyImages) {
    const full = path.join(root, img);
    if (!fs.existsSync(full)) { console.log(`  SKIP: ${img}`); continue; }
    const result = await optimizeImage(full);
    if (result) {
      totalBefore += result.before;
      totalAfter += result.after;
      console.log(`  ${img}: ${Math.round(result.before / 1024)}KB -> ${Math.round(result.after / 1024)}KB (${result.saved}% saved)`);
    } else {
      console.log(`  ${img}: already optimized`);
    }
  }

  if (totalBefore > 0) {
    console.log(`\n  TOTAL: ${Math.round(totalBefore / 1024)}KB -> ${Math.round(totalAfter / 1024)}KB (${Math.round((1 - totalAfter / totalBefore) * 100)}% saved)`);
  }

  const ogPath = path.join(root, 'public/og-image.png');
  if (!fs.existsSync(ogPath)) {
    await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 15, g: 10, b: 26, alpha: 1 } } })
      .composite([{ input: Buffer.from(`<svg width="1200" height="630"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0f0a1a"/><stop offset="50%" style="stop-color:#1a1030"/><stop offset="100%" style="stop-color:#0f0a1a"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><text x="600" y="260" text-anchor="middle" font-family="Arial" font-size="64" font-weight="bold" fill="white">SmartFinPro</text><text x="600" y="330" text-anchor="middle" font-family="Arial" font-size="28" fill="#94a3b8">AI-Powered Financial Intelligence</text></svg>`), top: 0, left: 0 }])
      .png().toFile(ogPath);
    console.log('\n  Created og-image.png');
  }

  const faviconPath = path.join(root, 'public/favicon.ico');
  if (!fs.existsSync(faviconPath)) {
    await sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 15, g: 10, b: 26, alpha: 1 } } })
      .composite([{ input: Buffer.from(`<svg width="32" height="32"><rect width="32" height="32" rx="6" fill="#0f0a1a"/><text x="16" y="23" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="#22d3ee">S</text></svg>`), top: 0, left: 0 }])
      .png().toFile(faviconPath);
    console.log('  Created favicon.ico');
  }
}

main().catch(console.error);

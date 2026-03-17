#!/usr/bin/env node
/**
 * SmartFinPro — Batch Image Download & Processing Pipeline
 *
 * Downloads editorial photos from Pexels CDN, resizes to spec,
 * converts to optimised WebP, and writes to the correct public/images path.
 *
 * Usage:
 *   node scripts/batch-image-pipeline.mjs
 *   node scripts/batch-image-pipeline.mjs --dry-run
 *   node scripts/batch-image-pipeline.mjs --id=22,23,24    (specific queue IDs)
 *
 * Rules:
 *  - Pillar heroes → public/images/content/{market}/{category}/hero.webp (1200×600)
 *  - Review images → public/images/content/{market}/{category}/{slug}.webp (1200×600)
 *  - Source: Pexels CDN (free commercial license, no attribution required)
 *  - Quality: 82 (matches existing process-assets defaults for hero slot)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_IMAGES = path.join(ROOT, 'public', 'images', 'content');
const TEMP = path.join(ROOT, 'temp_uploads', '_batch');

// ── Image spec ───────────────────────────────────────────────
const HERO_W = 1200;
const HERO_H = 600;
const QUALITY = 82;

// ── Pexels CDN helper ─────────────────────────────────────────
function pexelsUrl(photoId) {
  // High-res source from Pexels CDN (no API key needed for CDN)
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?cs=tinysrgb&w=1920&fit=crop`;
}

// ── Queue — all 44 pending items (ID 1 + 18 already done, SKIP) ──
const QUEUE = [
  // ─── PILLAR PAGES (output: {market}/{category}/hero.webp) ───
  { id: 2,  type: 'pillar', market: 'us', category: 'personal-finance', slug: 'index',     photoId: '32641817', alt: 'Collection of premium credit and debit cards for personal finance comparison' },
  { id: 3,  type: 'pillar', market: 'us', category: 'ai-tools',         slug: 'index',     photoId: '7552366',  alt: 'Professional using laptop on white desk — AI-powered productivity workspace' },
  { id: 4,  type: 'pillar', market: 'us', category: 'cybersecurity',    slug: 'index',     photoId: '7698826',  alt: 'Enterprise cybersecurity team reviewing threat analysis in bright modern office' },
  { id: 5,  type: 'pillar', market: 'us', category: 'business-banking', slug: 'index',     photoId: '6771900',  alt: 'Professional reviewing business banking dashboard on smartphone' },
  { id: 6,  type: 'pillar', market: 'uk', category: 'trading',          slug: 'index',     photoId: '31650949', alt: 'Modern trading desk with multiple screens displaying financial charts and market data' },
  { id: 7,  type: 'pillar', market: 'uk', category: 'personal-finance', slug: 'index',     photoId: '7621381',  alt: 'Credit cards and smartphone on white wall — UK personal finance and savings comparison' },
  { id: 8,  type: 'pillar', market: 'uk', category: 'ai-tools',         slug: 'index',     photoId: '3184160',  alt: 'Business professional using laptop — UK AI productivity tools comparison' },
  { id: 9,  type: 'pillar', market: 'uk', category: 'cybersecurity',    slug: 'index',     photoId: '990423',   alt: 'Modern enterprise office with desktop computers — UK cybersecurity platforms' },
  { id: 10, type: 'pillar', market: 'uk', category: 'business-banking', slug: 'index',     photoId: '31450274', alt: 'Person holding smartphone with modern fintech banking app interface' },
  { id: 11, type: 'pillar', market: 'ca', category: 'forex',            slug: 'index',     photoId: '6770609',  alt: 'Laptop displaying stock market and forex trading data — Canadian platforms' },
  { id: 12, type: 'pillar', market: 'ca', category: 'personal-finance', slug: 'index',     photoId: '4549416',  alt: 'Person holding smartphone on white background — Canadian personal finance apps' },
  { id: 13, type: 'pillar', market: 'ca', category: 'ai-tools',         slug: 'index',     photoId: '8534180',  alt: 'Clean laptop on white desk — Canadian AI business software comparison' },
  { id: 14, type: 'pillar', market: 'ca', category: 'cybersecurity',    slug: 'index',     photoId: '8001023',  alt: 'Computer monitor on white surface — Canadian business cybersecurity solutions' },
  { id: 15, type: 'pillar', market: 'ca', category: 'business-banking', slug: 'index',     photoId: '5717809',  alt: 'Stock market charts on phone and laptop — Canadian business banking platforms' },
  { id: 16, type: 'pillar', market: 'au', category: 'trading',          slug: 'index',     photoId: '31738798', alt: 'Digital trading workspace with financial charts on tablet and screens — ASX platforms' },
  { id: 17, type: 'pillar', market: 'au', category: 'forex',            slug: 'index',     photoId: '8062287',  alt: 'Business professionals reviewing financial analysis on laptop — Australian forex trading' },
  { id: 19, type: 'pillar', market: 'au', category: 'ai-tools',         slug: 'index',     photoId: '7439136',  alt: 'Professional using laptop in bright office — Australian AI tools for business' },
  { id: 20, type: 'pillar', market: 'au', category: 'cybersecurity',    slug: 'index',     photoId: '3184357',  alt: 'Team working in front of computers — Australian enterprise cybersecurity platforms' },
  { id: 21, type: 'pillar', market: 'au', category: 'business-banking', slug: 'index',     photoId: '8472483',  alt: 'Laptop on white table — Australian business banking and fintech platforms' },

  // ─── REVIEW PAGES (output: {market}/{category}/{slug}.webp) ───
  { id: 22, type: 'review', market: 'us', category: 'trading',          slug: 'etoro-review',                    photoId: '6801649',  alt: 'Professional trader analysing stock market data on laptop — eToro platform review' },
  { id: 23, type: 'review', market: 'us', category: 'trading',          slug: 'td-ameritrade-review',             photoId: '7567535',  alt: 'Financial analyst using laptop to review trading charts — TD Ameritrade thinkorswim' },
  { id: 24, type: 'review', market: 'us', category: 'trading',          slug: 'interactive-brokers-review',       photoId: '7567606',  alt: 'Professional analyst at multi-screen workstation reviewing trading data — Interactive Brokers' },
  { id: 25, type: 'review', market: 'us', category: 'personal-finance', slug: 'amex-gold-card-review',            photoId: '9122014',  alt: 'Contactless payment with premium gold credit card — American Express Gold Card review' },
  { id: 26, type: 'review', market: 'us', category: 'personal-finance', slug: 'chase-sapphire-preferred-review',  photoId: '32641817', alt: 'Collection of premium travel credit cards — Chase Sapphire Preferred review' },
  { id: 27, type: 'review', market: 'us', category: 'personal-finance', slug: 'chase-sapphire-reserve-review',    photoId: '8937443',  alt: 'Premium credit cards on clean desk with professional setup — Chase Sapphire Reserve review' },
  { id: 28, type: 'review', market: 'us', category: 'personal-finance', slug: 'sofi-personal-loans-review',       photoId: '4549416',  alt: 'Person holding smartphone to apply for personal loan — SoFi personal loans review' },
  { id: 29, type: 'review', market: 'us', category: 'personal-finance', slug: 'credit-cards-comparison',          photoId: '7621381',  alt: 'Multiple credit cards and smartphone on white wall — best credit cards comparison 2026' },
  { id: 31, type: 'review', market: 'uk', category: 'trading',          slug: 'etoro-review',                    photoId: '6770610',  alt: 'Multiple financial graphs on laptop screen — eToro UK social trading platform review' },
  { id: 32, type: 'review', market: 'uk', category: 'trading',          slug: 'hargreaves-lansdown-review',        photoId: '7567535',  alt: 'Investment platform dashboard on laptop — Hargreaves Lansdown review for UK investors' },
  { id: 33, type: 'review', market: 'uk', category: 'trading',          slug: 'ig-markets-review',                photoId: '25589797', alt: 'Financial results and stock market data on screen — IG Markets CFD trading review' },
  { id: 34, type: 'review', market: 'uk', category: 'trading',          slug: 'plus500-review',                   photoId: '5717809',  alt: 'Stock market charts on phone and laptop — Plus500 trading app review for UK' },
  { id: 35, type: 'review', market: 'uk', category: 'personal-finance', slug: 'vanguard-isa-review',              photoId: '8472483',  alt: 'Laptop on white desk for investment portfolio management — Vanguard ISA review UK' },
  { id: 36, type: 'review', market: 'uk', category: 'personal-finance', slug: 'hargreaves-lansdown-isa-review',   photoId: '7439136',  alt: 'Person using laptop to manage stocks and shares ISA — Hargreaves Lansdown ISA review' },
  { id: 37, type: 'review', market: 'uk', category: 'personal-finance', slug: 'trading-212-isa-review',           photoId: '31450274', alt: 'Person holding phone with commission-free investment app — Trading 212 ISA review UK' },
  { id: 38, type: 'review', market: 'ca', category: 'forex',            slug: 'questrade-review',                 photoId: '6801649',  alt: 'Professional using laptop to trade forex — Questrade Canadian forex platform review' },
  { id: 39, type: 'review', market: 'ca', category: 'forex',            slug: 'oanda-review',                     photoId: '31738798', alt: 'Digital trading workspace with currency data on screens — OANDA forex review Canada' },
  { id: 40, type: 'review', market: 'ca', category: 'personal-finance', slug: 'wealthsimple-review',              photoId: '6771900',  alt: 'Person reviewing investment portfolio on smartphone — Wealthsimple review Canada 2026' },
  { id: 41, type: 'review', market: 'ca', category: 'personal-finance', slug: 'wealthsimple-vs-questrade',        photoId: '8062287',  alt: 'Business professional comparing investment platforms on laptop — Wealthsimple vs Questrade' },
  { id: 42, type: 'review', market: 'au', category: 'forex',            slug: 'pepperstone-review',               photoId: '31650949', alt: 'Trading desk with financial charts and technology — Pepperstone forex review Australia' },
  { id: 43, type: 'review', market: 'au', category: 'forex',            slug: 'ic-markets-review',                photoId: '7567606',  alt: 'Professional ECN trader at multi-screen workstation — IC Markets review Australia' },
  { id: 44, type: 'review', market: 'au', category: 'personal-finance', slug: 'commbank-home-loan-review',        photoId: '8292830',  alt: 'Mortgage broker discussing home loan options with client in bright professional office' },
  { id: 45, type: 'review', market: 'au', category: 'personal-finance', slug: 'athena-home-loans-review',         photoId: '8292854',  alt: 'Client and advisor in agreement reviewing home loan contract — Athena Home Loans review' },
  { id: 46, type: 'review', market: 'au', category: 'personal-finance', slug: 'ubank-home-loan-review',           photoId: '8293744',  alt: 'Real estate agent and client discussing mortgage options — ubank home loan review Australia' },
];

// ── Helpers ──────────────────────────────────────────────────

function getOutputPath(item) {
  if (item.type === 'pillar') {
    return path.join(PUBLIC_IMAGES, item.market, item.category, 'hero.webp');
  } else {
    return path.join(PUBLIC_IMAGES, item.market, item.category, `${item.slug}.webp`);
  }
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const tmpFile = destPath + '.tmp';
    const file = fs.createWriteStream(tmpFile);

    const request = (targetUrl, redirectCount = 0) => {
      if (redirectCount > 5) return reject(new Error('Too many redirects'));
      https.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SmartFinPro/1.0)',
          'Accept': 'image/jpeg,image/*,*/*',
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location, redirectCount + 1);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          fs.renameSync(tmpFile, destPath);
          resolve(destPath);
        });
      }).on('error', (err) => {
        fs.unlink(tmpFile, () => {});
        reject(err);
      });
    };
    request(url);
  });
}

async function processImage(srcPath, destPath) {
  await sharp(srcPath)
    .resize(HERO_W, HERO_H, { fit: 'cover', position: 'centre' })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(destPath);
}

function formatBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(2)}MB`;
}

// ── Parse args ───────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const filterIds = args.find(a => a.startsWith('--id='))?.split('=')[1]?.split(',').map(Number);

const queue = filterIds ? QUEUE.filter(q => filterIds.includes(q.id)) : QUEUE;

// ── Main ─────────────────────────────────────────────────────
const results = { done: [], skipped: [], failed: [] };

console.log('');
console.log('  ═══════════════════════════════════════════════════════════');
console.log('  SmartFinPro — Batch Image Pipeline');
console.log(`  Items: ${queue.length} | Mode: ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);
console.log('  ═══════════════════════════════════════════════════════════');
console.log('');

fs.mkdirSync(TEMP, { recursive: true });

for (const item of queue) {
  const outputPath = getOutputPath(item);
  const relOut = path.relative(ROOT, outputPath);
  const tmpJpeg = path.join(TEMP, `${item.id}.jpeg`);

  process.stdout.write(`  [${String(item.id).padStart(2)}] ${relOut.padEnd(65)}`);

  if (DRY_RUN) {
    console.log('→ DRY-RUN ✓');
    results.done.push({ id: item.id, path: relOut, note: 'dry-run' });
    continue;
  }

  try {
    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Download from Pexels CDN
    const url = pexelsUrl(item.photoId);
    await downloadImage(url, tmpJpeg);
    const rawSize = fs.statSync(tmpJpeg).size;

    // Convert + resize to WebP
    await processImage(tmpJpeg, outputPath);
    const outSize = fs.statSync(outputPath).size;

    // Cleanup temp
    fs.unlinkSync(tmpJpeg);

    console.log(`→ ✓  ${formatBytes(rawSize)} → ${formatBytes(outSize)}`);
    results.done.push({ id: item.id, path: relOut, raw: rawSize, out: outSize });

  } catch (err) {
    // Cleanup temp on error
    try { fs.unlinkSync(tmpJpeg); } catch { /* ignore */ }
    console.log(`→ ✗  ${err.message}`);
    results.failed.push({ id: item.id, path: relOut, error: err.message });
  }
}

// ── Summary ──────────────────────────────────────────────────
console.log('');
console.log('  ───────────────────────────────────────────────────────────');
console.log(`  ✓ DONE:    ${results.done.length}`);
console.log(`  ✗ FAILED:  ${results.failed.length}`);
if (results.failed.length > 0) {
  for (const f of results.failed) {
    console.log(`     • [${f.id}] ${f.path} — ${f.error}`);
  }
}
console.log('');
console.log('  Next step:');
console.log('  node scripts/update-asset-registry.mjs   (mark processed items as "optimized")');
console.log('  ═══════════════════════════════════════════════════════════');
console.log('');

// Write result JSON for Phase 4
const reportPath = path.join(ROOT, 'asset-pipeline-report.json');
fs.writeFileSync(reportPath, JSON.stringify({ done: results.done, failed: results.failed, timestamp: new Date().toISOString() }, null, 2));

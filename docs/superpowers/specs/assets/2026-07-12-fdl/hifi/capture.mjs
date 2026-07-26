// FDL High-Fi Screenshot-Capture — Pixel-Abnahme-Grundlage (Spec-Review-Vorgabe):
// Desktop: 1280×720 First-Viewport + Full-Page · Mobile: 390×844 + Full-Page.
// Aufruf aus dem Repo-Root:  node docs/superpowers/specs/assets/2026-07-12-fdl/hifi/capture.mjs
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('@playwright/test')); }

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'screenshots');
mkdirSync(outDir, { recursive: true });

const SCREENS = [
  { id: 'hub', file: 'hifi-hub.html' },
  { id: 'money-leak', file: 'hifi-money-leak.html' },
  { id: 'wealth-horizon', file: 'hifi-wealth-horizon.html' },
  { id: 'wealth-horizon-extreme', file: 'hifi-wealth-horizon.html?extreme=1', viewportOnly: true },
  { id: 'broker-journey', file: 'hifi-broker-journey.html' },
  { id: 'home-lab', file: 'hifi-home-lab.html' },
];

const browser = await chromium.launch();
const errors = [];

async function shoot(screen, width, height, tag) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => errors.push(`${screen.id} ${tag} pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${screen.id} ${tag} console: ${m.text()}`); });
  await page.goto('file://' + join(here, screen.file.split('?')[0]) + (screen.file.includes('?') ? '?' + screen.file.split('?')[1] : ''));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(outDir, `${screen.id}-${width}x${height}.png`) });
  if (!screen.viewportOnly) {
    await page.screenshot({ path: join(outDir, `${screen.id}-${width}-full.png`), fullPage: true });
  }
  await page.close();
}

for (const s of SCREENS) {
  await shoot(s, 1280, 720, 'desktop');
  await shoot(s, 390, 844, 'mobile');
  console.log('✓', s.id);
}

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO JS ERRORS in allen Screens');
await browser.close();
process.exit(errors.length ? 1 : 0);

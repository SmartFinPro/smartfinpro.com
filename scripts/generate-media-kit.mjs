#!/usr/bin/env node
// ============================================================
// generate-media-kit.mjs — Render the SmartFinPro partner media
// kit from a static HTML template to PDF via Playwright.
//
// Source of truth: scripts/media-kit.html
// Output: public/sfp-mk-2026-x9k.pdf (hidden path, blocked in
// robots.txt — see app/robots.ts). Not linked from the site nav.
//
// Usage:
//   node scripts/generate-media-kit.mjs
// ============================================================

import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_PATH = path.join(__dirname, 'media-kit.html');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'sfp-mk-2026-x9k.pdf');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`file://${HTML_PATH}`);
  await page.pdf({
    path: OUTPUT_PATH,
    width: '8.5in',
    height: '11in',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  await browser.close();
  console.log(`Media kit written to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Media kit generation failed:', err);
  process.exit(1);
});

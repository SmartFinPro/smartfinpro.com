// scripts/gen-firewall-placeholders.mjs
// Generates dark (#09090b) placeholder WebP files for the firewall landing page
// image slots. Each file has the exact final export dimensions so layout is
// pixel-correct now — later you just OVERWRITE the file with the real render,
// no code change needed. Run: node scripts/gen-firewall-placeholders.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'firewall');

const SLOTS = [
  { file: '01-hero.webp', w: 1400, h: 1400, accent: '#22d3ee', label: 'SLOT 1 · HERO VISUAL' },
  { file: '02-fullbleed.webp', w: 2560, h: 1100, accent: '#22d3ee', label: 'SLOT 2 · FULL-BLEED BAND' },
  { file: '03-card-ad-spend.webp', w: 1200, h: 900, accent: '#22d3ee', label: 'SLOT 3A · CARD · AD SPEND' },
  { file: '03-card-core-infra.webp', w: 1200, h: 900, accent: '#34d399', label: 'SLOT 3B · CARD · CORE INFRA' },
  { file: '03-card-team-saas.webp', w: 1200, h: 900, accent: '#fbbf24', label: 'SLOT 3C · CARD · TEAM SAAS' },
  { file: '04-device.webp', w: 1600, h: 1000, accent: '#22d3ee', label: 'SLOT 4 · DEVICE MOCKUP' },
  { file: '05-hardware-key.webp', w: 1400, h: 934, accent: '#22d3ee', label: 'SLOT 5 · HARDWARE KEY' },
  { file: '06-cta.webp', w: 1200, h: 900, accent: '#34d399', label: 'SLOT 6 · CTA VISUAL' },
];

function svgFor({ w, h, accent, label }) {
  const m = Math.round(Math.min(w, h) * 0.045);
  const fs = Math.round(Math.min(w, h) * 0.046);
  const fs2 = Math.round(Math.min(w, h) * 0.034);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#09090b"/>
  <rect x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}" rx="28" fill="none"
        stroke="${accent}" stroke-opacity="0.22" stroke-width="2.5" stroke-dasharray="16 13"/>
  <text x="50%" y="47%" fill="#52525b" font-family="Helvetica, Arial, sans-serif" font-size="${fs}"
        font-weight="700" letter-spacing="2" text-anchor="middle">${label}</text>
  <text x="50%" y="${47 + 7}%" fill="#3f3f46" font-family="Helvetica, Arial, sans-serif" font-size="${fs2}"
        text-anchor="middle">${w} × ${h}</text>
</svg>`;
}

await mkdir(OUT_DIR, { recursive: true });

for (const slot of SLOTS) {
  const out = join(OUT_DIR, slot.file);
  await sharp(Buffer.from(svgFor(slot))).webp({ quality: 82 }).toFile(out);
  console.log(`✓ ${slot.file}  ${slot.w}×${slot.h}`);
}

console.log(`\nDone — ${SLOTS.length} placeholders written to public/images/firewall/`);

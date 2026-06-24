// scripts/convert-firewall-images.mjs
// Converts your PNG renders into the exact .webp files the firewall landing page
// expects. Workflow:
//   1. Drop your PNGs into public/images/firewall/ named EXACTLY:
//        01-hero.png  02-fullbleed.png  03-card-ad-spend.png
//        03-card-core-infra.png  03-card-team-saas.png
//        04-device.png  05-hardware-key.png  06-cta.png
//   2. Run: node scripts/convert-firewall-images.mjs
//   3. Each <name>.png becomes <name>.webp (the .png is left in place — you can delete it).
import sharp from 'sharp';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'firewall');

const NAMES = [
  '01-hero',
  '02-fullbleed',
  '03-card-ad-spend',
  '03-card-core-infra',
  '03-card-team-saas',
  '04-device',
  '05-hardware-key',
  '06-cta',
];

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

let converted = 0;
let missing = 0;

for (const name of NAMES) {
  const png = join(DIR, `${name}.png`);
  const webp = join(DIR, `${name}.webp`);

  if (!(await exists(png))) {
    console.log(`–  ${name}.png  (nicht gefunden, übersprungen)`);
    missing++;
    continue;
  }

  const meta = await sharp(png).metadata();
  await sharp(png).webp({ quality: 82 }).toFile(webp);
  console.log(`✓  ${name}.png → ${name}.webp  (${meta.width}×${meta.height})`);
  converted++;
}

console.log(`\nFertig — ${converted} konvertiert, ${missing} fehlten.`);
if (missing > 0) {
  console.log('Tipp: benenne deine PNGs exakt wie oben und lege sie in public/images/firewall/ ab.');
}

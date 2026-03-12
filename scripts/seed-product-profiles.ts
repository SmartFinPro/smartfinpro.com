// scripts/seed-product-profiles.ts
// Bootstrap product_profiles from MDX frontmatter.
// Usage: npx tsx scripts/seed-product-profiles.ts
//
// Reads all MDX files, parses pricing strings, estimates fit/risk from
// rating + pros/cons counts, and upserts into product_profiles.
//
// Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY env vars.

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────

const CONTENT_DIR = path.join(process.cwd(), 'content');
const MARKETS = ['us', 'uk', 'ca', 'au'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Price Parser ──────────────────────────────────────────────────────

function parsePriceFromString(pricing: string | undefined): number {
  if (!pricing) return 0;
  const match = pricing.match(/[\$£€](\d+(?:\.\d{2})?)/);
  return match ? parseFloat(match[1]) : 0;
}

// ── Fit/Risk Estimators ───────────────────────────────────────────────

function estimateFit(rating: number) {
  const base = Math.min(rating / 5, 1);
  return {
    fit_beginner: +(base * 0.85).toFixed(2),
    fit_advanced: +(base * 0.65).toFixed(2),
    fit_teams: +(base * 0.60).toFixed(2),
    fit_solo: +(base * 0.80).toFixed(2),
    fit_low_cost: 0.50,
    fit_feature_rich: +(base * 0.75).toFixed(2),
    fit_compliance: +(base * 0.50).toFixed(2),
  };
}

function estimateRisk(prosCount: number, consCount: number, rating: number) {
  const conRatio = consCount / Math.max(prosCount + consCount, 1);
  const ratingPenalty = Math.max(0, (5 - rating) / 5);
  const baseRisk = (conRatio * 0.5 + ratingPenalty * 0.5) * 0.4;
  return {
    compliance_gap: +Math.min(baseRisk + 0.05, 0.50).toFixed(2),
    lockin_risk: +Math.min(baseRisk + 0.10, 0.50).toFixed(2),
    support_risk: +Math.min(baseRisk, 0.30).toFixed(2),
    outage_risk: 0.05,
    policy_risk: +Math.min(baseRisk + 0.05, 0.30).toFixed(2),
  };
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  let total = 0;
  let upserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const market of MARKETS) {
    const marketDir = path.join(CONTENT_DIR, market);
    if (!fs.existsSync(marketDir)) continue;

    const categories = fs.readdirSync(marketDir).filter((d) =>
      fs.statSync(path.join(marketDir, d)).isDirectory(),
    );

    for (const category of categories) {
      const catDir = path.join(marketDir, category);
      const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.mdx'));

      for (const file of files) {
        total++;
        const slug = file.replace('.mdx', '');
        if (slug === 'index') { skipped++; continue; }

        try {
          const raw = fs.readFileSync(path.join(catDir, file), 'utf-8');
          const { data: fm } = matter(raw);

          // Only seed review pages (those with a rating)
          const rating = fm.rating ?? (fm.schema?.rating as number | undefined) ?? 0;
          if (!rating) { skipped++; continue; }

          const pricing = fm.pricing as string | undefined;
          const price = parsePriceFromString(pricing);
          const pros = (fm.pros as string[]) ?? [];
          const cons = (fm.cons as string[]) ?? [];

          const fit = estimateFit(rating);
          const risk = estimateRisk(pros.length, cons.length, rating);

          const row = {
            slug,
            market,
            category,
            base_price_monthly: price,
            seat_price_monthly: +(price * 0.2).toFixed(2),
            free_seats: 1,
            usage_overage_monthly: 0,
            addon_cost_monthly: 0,
            onboarding_hours: price > 100 ? 8 : price > 30 ? 4 : 2,
            ...fit,
            ...risk,
            expected_hours_saved: price > 100 ? 20 : price > 30 ? 10 : 5,
          };

          const { error } = await supabase
            .from('product_profiles')
            .upsert(row, { onConflict: 'slug,market' });

          if (error) {
            console.error(`  [ERR] ${market}/${category}/${slug}: ${error.message}`);
            errors++;
          } else {
            console.log(`  [OK]  ${market}/${category}/${slug} — $${price}/mo, rating ${rating}`);
            upserted++;
          }
        } catch (err) {
          console.error(`  [ERR] ${market}/${category}/${slug}: ${(err as Error).message}`);
          errors++;
        }
      }
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`  Total MDX files: ${total}`);
  console.log(`  Upserted:        ${upserted}`);
  console.log(`  Skipped:         ${skipped} (no rating / index pages)`);
  console.log(`  Errors:          ${errors}`);
  console.log('─────────────────────────────────────────\n');

  process.exit(errors > 0 ? 1 : 0);
}

main();

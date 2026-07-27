import { createClient } from '@supabase/supabase-js';
import { buildResearchView } from '@/lib/research/adapter';
import { getTopicConfig } from '@/lib/comparison/topics/index';
import type { ProductForComparison } from '@/lib/comparison/types';
import { scoreLabel } from '@/lib/reviews/score-label';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });
const { data, error } = await supabase.from('product_attributes').select('*')
  .eq('market','us').eq('category','trading').eq('topic','trading-platforms');
if (error) { console.error(error.message); process.exit(1); }

const products = (data ?? []).map((r:any) => ({
  slug: r.slug, displayName: r.display_name ?? r.slug, score: Number(r.score),
  subScores: r.sub_scores ?? {}, researchStatus: r.research_status,
  methodologyVersion: r.methodology_version, dataVerifiedAt: r.data_verified_at,
  confidence: r.confidence, confidenceReason: r.attributes?.confidence_reason ?? null,
  fieldSources: r.research_sources ?? null, isTopPick: !!r.is_top_pick,
  reviewSlug: r.review_slug ?? null, market: r.market, category: r.category,
})) as unknown as ProductForComparison[];

const cfg = getTopicConfig('trading' as any, 'trading-platforms', 'us' as any);
const requiredKeys = cfg ? cfg.specColumns.map(c => c.key) : [];
const view = buildResearchView(products, requiredKeys);

console.log('THE BUILT ADAPTER (buildResearchView) — run on LIVE prod data');
console.log('Required Tier-1 keys:', requiredKeys.join(', '), '\n');
console.log('rank | status       | score        | label      | reviewHref                         | slug');
console.log('-----+--------------+--------------+------------+------------------------------------+--------------');
for (const p of view) {
  const rank = p.rank ? '#'+p.rank : ' —';
  const score = p.displayScore != null ? p.displayScore.toFixed(1) : '(hidden)';
  const label = p.displayScore != null ? scoreLabel(p.displayScore) : '—';
  const href = p.reviewHref ?? '(no review → Compare)';
  console.log(`${String(rank).padEnd(4)} | ${p.research.status.padEnd(12)} | ${score.padEnd(12)} | ${label.padEnd(10)} | ${href.padEnd(34)} | ${p.product.slug}`);
}
console.log(`\n${view.filter(p=>p.research.status==='audited').length} audited (ranked) · ${view.filter(p=>p.research.status==='provisional').length} provisional (no rank) · ${view.length} total`);

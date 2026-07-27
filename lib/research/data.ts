// lib/research/data.ts
// Server-only fetch wrapper for the Research Library. Loads a topic's Cockpit
// rows (the single data source — product_attributes via getCockpitData) and
// builds the deterministic research view. Kept separate from adapter.ts so the
// pure ranking/degradation logic stays fixture-testable without server imports.

import 'server-only';
import type { Market, Category } from '@/lib/i18n/config';
import { getCockpitData } from '@/lib/comparison/loader';
import { getTopicConfig } from '@/lib/comparison/topics/index';
import { buildResearchView, type ResearchProduct } from './adapter';

export async function getResearchView(
  market: Market,
  category: Category,
  topic: string,
): Promise<ResearchProduct[]> {
  const config = getTopicConfig(category, topic, market);
  if (!config) return [];
  const products = await getCockpitData(market, category, topic);
  return buildResearchView(
    products,
    config.specColumns.map((c) => c.key),
  );
}

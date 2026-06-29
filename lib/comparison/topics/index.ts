// lib/comparison/topics/index.ts
// Topic-config registry. New "Best X" page = add one entry here + a seed migration.

import type { TopicConfig } from './types';
import { roboAdvisorsConfig } from './robo-advisors';

const REGISTRY: Record<string, TopicConfig> = {
  'personal-finance/robo-advisors': roboAdvisorsConfig,
};

export function getTopicConfig(category: string, topic: string): TopicConfig | null {
  return REGISTRY[`${category}/${topic}`] ?? null;
}

export function getAllTopicConfigs(): TopicConfig[] {
  return Object.values(REGISTRY);
}

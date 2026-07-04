// lib/comparison/topics/index.ts
// Topic-config registry. New "Best X" page = add one entry here + a seed migration.

import type { TopicConfig } from './types';
import { roboAdvisorsConfig } from './robo-advisors';
import { businessBankAccountsConfig } from './business-bank-accounts';
import { debtReliefCompaniesConfig } from './debt-relief-companies';
import { tradingPlatformsConfig } from './trading-platforms';
import { forexBrokersConfig } from './forex-brokers';
import { creditRepairCompaniesConfig } from './credit-repair-companies';
import { creditMonitoringConfig } from './credit-monitoring';
import { aiToolsFinanceConfig } from './ai-tools-finance';
import { cybersecuritySmbConfig } from './cybersecurity-smb';

const REGISTRY: Record<string, TopicConfig> = {
  'personal-finance/robo-advisors': roboAdvisorsConfig,
  'business-banking/business-bank-accounts': businessBankAccountsConfig,
  'debt-relief/companies': debtReliefCompaniesConfig,
  'trading/trading-platforms': tradingPlatformsConfig,
  'forex/forex-brokers': forexBrokersConfig,
  'credit-repair/companies': creditRepairCompaniesConfig,
  'personal-finance/credit-monitoring': creditMonitoringConfig,
  'ai-tools/ai-tools-finance': aiToolsFinanceConfig,
  'cybersecurity/cybersecurity-smb': cybersecuritySmbConfig,
};

export function getTopicConfig(category: string, topic: string): TopicConfig | null {
  return REGISTRY[`${category}/${topic}`] ?? null;
}

export function getAllTopicConfigs(): TopicConfig[] {
  return Object.values(REGISTRY);
}

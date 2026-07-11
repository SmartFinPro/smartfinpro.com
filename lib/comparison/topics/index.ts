// lib/comparison/topics/index.ts
// Topic-config registry. New "Best X" page = add one entry here + a seed migration.
//
// Keys come in two shapes:
//   'category/topic'          — US editorial configs (USD, US regulators, US picks)
//   'market:category/topic'   — market-specific configs (uk:/ca:/au: prefix)
// getTopicConfig resolves the market-prefixed key first; the unprefixed key is
// a fallback ONLY for the US market. UK/CA/AU must never receive a US config
// (wrong currency/regulators/verdict picks — SEO addendum §14 stop condition).

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
import { goldInvestingConfig } from './gold-investing';
import { highYieldSavingsConfig } from './high-yield-savings';
import { creditCardCompaniesConfig } from './credit-card-companies';
import { auRoboAdvisorsConfig } from './au/robo-advisors';
import { auBusinessBankAccountsConfig } from './au/business-bank-accounts';
import { auSavingsAccountsConfig } from './au/savings-accounts';
import { auForexBrokersConfig } from './au/forex-brokers';
import { auGoldInvestingConfig } from './au/gold-investing';
import { auCfdBrokersConfig } from './au/cfd-brokers';
import { auSuperFundsConfig } from './au/super-funds';
import { auAiToolsFinanceConfig } from './au/ai-tools-finance';
import { auCybersecuritySmbConfig } from './au/cybersecurity-smb';
import { caRoboAdvisorsConfig } from './ca/robo-advisors';
import { caBusinessBankAccountsConfig } from './ca/business-bank-accounts';
import { caTfsaRrspPlatformsConfig } from './ca/tfsa-rrsp-platforms';

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
  'gold-investing/platforms': goldInvestingConfig,
  'personal-finance/high-yield-savings': highYieldSavingsConfig,
  'personal-finance/credit-card-companies': creditCardCompaniesConfig,

  // ── Australia (Stage 1 — AU/CA/UK rollout, Slice AU-1) ──
  'au:personal-finance/robo-advisors': auRoboAdvisorsConfig,
  'au:business-banking/business-bank-accounts': auBusinessBankAccountsConfig,
  'au:savings/savings-accounts': auSavingsAccountsConfig,

  // ── Australia (Stage 1 — AU/CA/UK rollout, Slice AU-2) ──
  'au:forex/forex-brokers': auForexBrokersConfig,
  'au:gold-investing/platforms': auGoldInvestingConfig,
  'au:trading/cfd-brokers': auCfdBrokersConfig,

  // ── Australia (Stage 1 — AU/CA/UK rollout, Slice AU-3) ──
  'au:superannuation/super-funds': auSuperFundsConfig,
  'au:ai-tools/ai-tools-finance': auAiToolsFinanceConfig,
  'au:cybersecurity/cybersecurity-smb': auCybersecuritySmbConfig,

  // ── Canada (Stage 2 — AU/CA/UK rollout, Slice CA-1) ──
  'ca:personal-finance/robo-advisors': caRoboAdvisorsConfig,
  'ca:business-banking/business-bank-accounts': caBusinessBankAccountsConfig,
  'ca:tax-efficient-investing/tfsa-rrsp-platforms': caTfsaRrspPlatformsConfig,
};

export function getTopicConfig(category: string, topic: string, market?: string): TopicConfig | null {
  if (market) {
    const marketSpecific = REGISTRY[`${market}:${category}/${topic}`];
    if (marketSpecific) return marketSpecific;
    // Unprefixed configs are US editorial content — never serve them to
    // another market. A missing market config means "not launched there yet"
    // (route 404s / tile stays coming_soon), not "reuse the US page".
    if (market !== 'us') return null;
  }
  return REGISTRY[`${category}/${topic}`] ?? null;
}

export function getAllTopicConfigs(): TopicConfig[] {
  return Object.values(REGISTRY);
}

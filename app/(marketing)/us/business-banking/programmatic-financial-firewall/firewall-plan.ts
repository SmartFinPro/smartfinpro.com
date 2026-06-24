// app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-plan.ts
// Pure recommendation engine for the Firewall Configurator. No React/Next imports → unit-testable.
// All limits are SmartFinPro RECOMMENDED operating limits, not Mercury product limits.

export type FounderLocation = 'us' | 'uk' | 'ca' | 'au' | 'other';
export type MonthlySpend = 'under-5k' | '5k-25k' | '25k-plus';
export type StackItem = 'ads' | 'hosting' | 'saas' | 'payroll' | 'contractors';
export type TeamAccess = 'solo' | '2-5' | '6-plus';

export interface FirewallConfigInput {
  location: FounderLocation;
  monthlySpend: MonthlySpend;
  stack: StackItem[];
  teamAccess: TeamAccess;
}

export type NodeAccent = 'cyan' | 'emerald' | 'amber' | 'sky' | 'violet';

export interface PlanNode {
  key: StackItem;
  label: string;
  vendors: string;
  monthlyLimit: number;
  accent: NodeAccent;
}

export interface FirewallPlan {
  nodes: PlanNode[];
  hardening: string[];
  headline: string;
  subline: string;
  international: boolean;
  totalBudget: number;
  cta: { label: string; href: string };
}

interface NodeConfig {
  label: string;
  vendors: string;
  weight: number;
  accent: NodeAccent;
}

/** Display order for nodes (independent of stack-selection order). */
const NODE_ORDER: StackItem[] = ['ads', 'hosting', 'payroll', 'saas', 'contractors'];

const NODE_CONFIG: Record<StackItem, NodeConfig> = {
  ads: { label: 'Ad Spend', vendors: 'Google Ads · Meta · TikTok · LinkedIn', weight: 0.5, accent: 'cyan' },
  hosting: { label: 'Core Infrastructure', vendors: 'Vercel · AWS · Supabase · OpenAI', weight: 0.22, accent: 'emerald' },
  payroll: { label: 'Payroll & Reserves', vendors: 'Gusto · Deel · Rippling', weight: 0.13, accent: 'sky' },
  saas: { label: 'Team SaaS', vendors: 'Slack · Notion · Workspace · Loom', weight: 0.1, accent: 'amber' },
  contractors: { label: 'Contractor Payouts', vendors: 'Deel · Wise · Upwork', weight: 0.05, accent: 'violet' },
};

const BUDGET_BY_SPEND: Record<MonthlySpend, number> = { 'under-5k': 4000, '5k-25k': 15000, '25k-plus': 40000 };
const SPEND_LABEL: Record<MonthlySpend, string> = { 'under-5k': '<$5k', '5k-25k': '$5k–$25k', '25k-plus': '$25k+' };
const TEAM_LABEL: Record<TeamAccess, string> = { solo: 'solo', '2-5': '2–5', '6-plus': '6+' };

const HARDENING_BY_TEAM: Record<TeamAccess, string[]> = {
  solo: [
    'Put one FIDO2/WebAuthn hardware key (plus a backup key) on the owner login and remove SMS 2FA.',
    'Monitor balances and transactions from the Mercury CLI instead of leaving browser sessions open.',
  ],
  '2-5': [
    'Issue a per-seat FIDO2/WebAuthn hardware key for everyone who can touch money; remove SMS 2FA.',
    'Require a receipt on every card and assign an owner; give each role only the cards it needs.',
  ],
  '6-plus': [
    'Issue a per-seat FIDO2/WebAuthn hardware key for everyone who can touch money; remove SMS 2FA.',
    'Require a receipt on every card and assign an owner; give each role only the cards it needs.',
    'Add an approval workflow for new vendors and limit increases, plus a quarterly seat audit.',
    'Use a separate read-only API token for ops/monitoring so dashboards never hold write access.',
  ],
};

const INTERNATIONAL_HARDENING =
  'US LLC operated from abroad: FIDO2 is mandatory (cross-border SIM-swap risk). Monitor via the Mercury API/CLI instead of browser sessions, and keep one US-reachable recovery method.';

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function buildFirewallPlan(input: FirewallConfigInput): FirewallPlan {
  const international = input.location !== 'us';
  const totalBudget = BUDGET_BY_SPEND[input.monthlySpend];

  const selected = NODE_ORDER.filter((key) => input.stack.includes(key));
  const weightSum = selected.reduce((sum, key) => sum + NODE_CONFIG[key].weight, 0) || 1;

  const nodes: PlanNode[] = selected.map((key) => {
    const cfg = NODE_CONFIG[key];
    return {
      key,
      label: cfg.label,
      vendors: cfg.vendors,
      monthlyLimit: roundTo(totalBudget * (cfg.weight / weightSum), 100),
      accent: cfg.accent,
    };
  });

  const hardening = [...HARDENING_BY_TEAM[input.teamAccess]];
  if (international) hardening.push(INTERNATIONAL_HARDENING);

  return {
    nodes,
    hardening,
    headline: `A ${nodes.length}-node cash-flow firewall`,
    subline: `${international ? 'International' : 'US'} founder · ${TEAM_LABEL[input.teamAccess]} team · ${SPEND_LABEL[input.monthlySpend]}/mo · US LLC`,
    international,
    totalBudget,
    cta: { label: 'Launch Mercury and build this card map', href: '/go/mercury' },
  };
}

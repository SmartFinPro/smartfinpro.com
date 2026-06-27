// lib/comparison/matcher.ts
// Transparent, rule-based "Find my match" scorer (v1 — no LLM). The user
// answers a short questionnaire; each answered criterion adds a weighted,
// explainable contribution per provider. Returns the top 3 with reasons.
// Pure — no React / no server imports. Claude-based matching is an additive
// Phase 2 (see app/api/comparison/match).

import type { ProductForComparison, MatcherAnswers } from './types';

export interface MatcherOption {
  value: string;
  label: string;
}

export interface MatcherQuestion {
  id: string;
  label: string;
  options: MatcherOption[];
}

/** Display data only — kept serializable. Scoring lives in `matchProducts`. */
export const MATCHER_QUESTIONS: MatcherQuestion[] = [
  {
    id: 'entity',
    label: "What's your business structure?",
    options: [
      { value: 'llc', label: 'LLC' },
      { value: 's-corp', label: 'S-Corp' },
      { value: 'c-corp', label: 'C-Corp' },
      { value: 'sole-prop', label: 'Sole proprietor' },
    ],
  },
  {
    id: 'cash',
    label: 'Do you need to deposit cash?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'intl',
    label: 'Do you send international wires?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'team',
    label: 'Need multiple users or sub-accounts?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'books',
    label: 'Want built-in bookkeeping or tax tools?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'fees',
    label: 'Monthly fee tolerance?',
    options: [
      { value: 'zero', label: 'Must be $0' },
      { value: 'ok', label: 'OK to pay for features' },
    ],
  },
  {
    id: 'integ',
    label: 'Need Stripe, Shopify or accounting integrations?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'credit',
    label: 'Need lending or a credit line?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
];

export const MATCHER_DISCLAIMER =
  'This is general information based on your answers and our independent research — not personalised financial advice. Verify current terms with the provider before opening an account.';

const WEIGHTS: Record<string, number> = {
  entity: 10,
  cash: 14,
  intl: 12,
  team: 10,
  books: 8,
  fees: 10,
  integ: 8,
  credit: 10,
};

export interface MatchResult {
  product: ProductForComparison;
  fitScore: number; // 0-100
  reasons: string[];
}

interface Scored {
  raw: number;
  max: number;
  reasons: string[];
}

function scoreOne(p: ProductForComparison, answers: MatcherAnswers): Scored {
  let raw = 0;
  let max = 0;
  const reasons: string[] = [];
  const award = (qid: string, matched: boolean, reason?: string) => {
    const w = WEIGHTS[qid] ?? 8;
    max += w;
    if (matched) {
      raw += w;
      if (reason) reasons.push(reason);
    }
  };

  for (const [qid, ans] of Object.entries(answers)) {
    if (!ans) continue;
    switch (qid) {
      case 'entity':
        award('entity', p.entityTypes.includes(ans), `Supports ${ans.toUpperCase()}`);
        break;
      case 'cash':
        if (ans === 'yes') award('cash', p.supportsCashDeposits, 'Accepts cash deposits');
        else award('cash', true);
        break;
      case 'intl':
        if (ans === 'yes') award('intl', p.supportsIntlWires, 'Sends international wires');
        else award('intl', true);
        break;
      case 'team':
        if (ans === 'yes') award('team', p.hasSubAccounts, 'Sub-accounts & roles');
        else award('team', true);
        break;
      case 'books':
        if (ans === 'yes') award('books', p.hasBookkeeping, 'Built-in bookkeeping / tax tools');
        else award('books', true);
        break;
      case 'fees':
        if (ans === 'zero') award('fees', p.monthlyFee === 0, 'No monthly fee');
        else award('fees', true);
        break;
      case 'integ':
        if (ans === 'yes') {
          const hasInteg = p.integrations.length > 0;
          award('integ', hasInteg, hasInteg ? `Integrations: ${p.integrations.slice(0, 3).join(', ')}` : undefined);
        } else {
          award('integ', true);
        }
        break;
      case 'credit':
        if (ans === 'yes') award('credit', p.hasLending, 'Lending / credit line');
        else award('credit', true);
        break;
      default:
        break;
    }
  }

  // Editorial score as a minor tiebreaker so equal-fit ties favour quality.
  raw += p.score;
  max += 10;

  return { raw, max, reasons };
}

/**
 * Return the top 3 providers ranked by transparent fit score. Deterministic.
 * With no answers, falls back to the highest editorial scores.
 */
export function matchProducts(
  answers: MatcherAnswers,
  products: ProductForComparison[],
): MatchResult[] {
  const answered = Object.values(answers).filter(Boolean).length > 0;

  const results: MatchResult[] = products.map((product) => {
    if (!answered) {
      return {
        product,
        fitScore: Math.round((product.score / 10) * 100),
        reasons: [`Strong overall score (${product.score.toFixed(1)}/10)`],
      };
    }
    const { raw, max, reasons } = scoreOne(product, answers);
    const fitScore = max > 0 ? Math.round((raw / max) * 100) : 0;
    const finalReasons =
      reasons.length > 0 ? reasons.slice(0, 3) : [`Strong overall score (${product.score.toFixed(1)}/10)`];
    return { product, fitScore, reasons: finalReasons };
  });

  return results
    .sort((a, b) => b.fitScore - a.fitScore || b.product.score - a.product.score)
    .slice(0, 3);
}

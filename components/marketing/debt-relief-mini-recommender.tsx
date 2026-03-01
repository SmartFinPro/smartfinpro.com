'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type DebtBand = 'under-10000' | '10000-30000' | 'over-30000';
type CreditBand = '700-plus' | '580-699' | 'under-580';

interface DebtReliefMiniRecommenderProps {
  affiliateUrl: string;
}

type Recommendation = {
  title: string;
  reason: string;
  sectionAnchor: string;
  ctaLabel: string;
};

function resolveRecommendation(debt: DebtBand, credit: CreditBand): Recommendation {
  if (credit === '700-plus' && debt === 'under-10000') {
    return {
      title: 'Start with Balance Transfer',
      reason: 'Highest chance for 0% intro APR and fastest payoff window.',
      sectionAnchor: '#balance-transfer',
      ctaLabel: 'View Balance Transfer Section',
    };
  }

  if (credit === '700-plus' || credit === '580-699') {
    return {
      title: 'Start with Consolidation Loan',
      reason: 'Strong balance of payment predictability and credit protection.',
      sectionAnchor: '#debt-consolidation',
      ctaLabel: 'View Consolidation Section',
    };
  }

  if (debt === 'over-30000') {
    return {
      title: 'Start with Debt Settlement Review',
      reason: 'For high debt and low credit, settlement may reduce total principal most.',
      sectionAnchor: '#debt-settlement',
      ctaLabel: 'View Settlement Section',
    };
  }

  return {
    title: 'Start with Debt Management Plan (DMP)',
    reason: 'Most stable option when credit access is limited.',
    sectionAnchor: '#debt-management',
    ctaLabel: 'View DMP Section',
  };
}

export function DebtReliefMiniRecommender({ affiliateUrl }: DebtReliefMiniRecommenderProps) {
  const [debtBand, setDebtBand] = useState<DebtBand>('10000-30000');
  const [creditBand, setCreditBand] = useState<CreditBand>('580-699');

  const recommendation = useMemo(
    () => resolveRecommendation(debtBand, creditBand),
    [debtBand, creditBand]
  );

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--sfp-navy)' }}>
        60-Second Recommendation
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <label className="text-sm">
          <span className="block mb-1 font-medium" style={{ color: 'var(--sfp-ink)' }}>Debt amount</span>
          <select
            value={debtBand}
            onChange={(e) => setDebtBand(e.target.value as DebtBand)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="under-10000">Under $10,000</option>
            <option value="10000-30000">$10,000 – $30,000</option>
            <option value="over-30000">Over $30,000</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="block mb-1 font-medium" style={{ color: 'var(--sfp-ink)' }}>Credit score</span>
          <select
            value={creditBand}
            onChange={(e) => setCreditBand(e.target.value as CreditBand)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="700-plus">700+</option>
            <option value="580-699">580 – 699</option>
            <option value="under-580">Under 580</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl p-3 mb-3" style={{ background: 'var(--sfp-sky)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>{recommendation.title}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>{recommendation.reason}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={recommendation.sectionAnchor}
          className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold no-underline hover:no-underline"
          style={{ background: 'var(--sfp-navy)', color: '#fff', textDecoration: 'none' }}
        >
          {recommendation.ctaLabel}
        </Link>
        <Link
          href={affiliateUrl}
          target="_blank"
          rel="noopener sponsored"
          className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold no-underline hover:no-underline"
          style={{ background: 'var(--sfp-gold)', color: '#fff', textDecoration: 'none' }}
        >
          Get Free Debt Analysis
        </Link>
      </div>
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'rgba(27,79,140,0.2)', borderTopColor: 'var(--sfp-navy)' }} />
      <p className="text-sm text-slate-500">Loading calculator...</p>
    </div>
  </div>
);

export const DynamicBrokerFinderQuiz = dynamic(
  () => import('@/components/tools/broker-finder-quiz').then(m => ({ default: m.BrokerFinderQuiz })),
  { ssr: false, loading: LoadingSpinner }
);

export const DynamicBrokerComparison = dynamic(
  () => import('@/components/tools/broker-comparison').then(m => ({ default: m.BrokerComparison })),
  { ssr: false, loading: LoadingSpinner }
);

export const DynamicTradingCostCalculator = dynamic(
  () => import('@/components/tools/trading-cost-calculator').then(m => ({ default: m.TradingCostCalculator })),
  { ssr: false, loading: LoadingSpinner }
);

export const DynamicWealthsimpleCalculator = dynamic(
  () => import('@/components/tools/wealthsimple-calculator').then(m => ({ default: m.WealthsimpleCalculator })),
  { ssr: false, loading: LoadingSpinner }
);

export const DynamicAIROICalculator = dynamic(
  () => import('@/components/tools/ai-roi-calculator').then(m => ({ default: m.AIROICalculator })),
  { ssr: false, loading: LoadingSpinner }
);

export const DynamicLoanCalculator = dynamic(
  () => import('@/components/tools/loan-calculator').then(m => ({ default: m.LoanCalculator })),
  { ssr: false, loading: LoadingSpinner }
);

export const DynamicISATaxSavingsCalculator = dynamic(
  () => import('@/components/tools/isa-tax-savings-calculator').then(m => ({ default: m.ISATaxSavingsCalculator })),
  { ssr: false, loading: LoadingSpinner }
);

export const DynamicAUMortgageCalculator = dynamic(
  () => import('@/components/tools/au-mortgage-calculator').then(m => ({ default: m.AUMortgageCalculator })),
  { ssr: false, loading: LoadingSpinner }
);

export const DynamicCreditCardRewardsCalculator = dynamic(
  () => import('@/components/tools/credit-card-rewards-calculator').then(m => ({ default: m.CreditCardRewardsCalculator })),
  { ssr: false, loading: LoadingSpinner }
);

export const DynamicTfsaRrspCalculator = dynamic(
  () => import('@/components/tools/tfsa-rrsp-calculator').then(m => ({ default: m.TfsaRrspCalculator })),
  { ssr: false, loading: LoadingSpinner }
);

export const DynamicCAMortgageAffordabilityCalculator = dynamic(
  () => import('@/components/tools/ca-mortgage-affordability-calculator').then(m => ({ default: m.CAMortgageAffordabilityCalculator })),
  { ssr: false, loading: LoadingSpinner }
);

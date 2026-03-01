'use client';

import { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  PiggyBank,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const cadFormat = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

const PROVIDER_OPTIONS = [
  { label: 'Big 5 Bank Mutual Fund (2.35%)', fee: 2.35 },
  { label: 'Bank Advisor (1.5%)', fee: 1.5 },
  { label: 'Robo-Advisor (0.5%)', fee: 0.5 },
  { label: 'DIY ETF Portfolio (0.20%)', fee: 0.2 },
];

const WEALTHSIMPLE_TIERS = [
  { name: 'Self-Directed', mgmtFee: 0.0, mer: 0.2, minBalance: 0 },
  { name: 'Managed Core', mgmtFee: 0.5, mer: 0.2, minBalance: 0 },
  { name: 'Managed Premium', mgmtFee: 0.4, mer: 0.2, minBalance: 100000 },
];

const HORIZONS = [10, 20, 30] as const;
const ANNUAL_RETURN = 7;

interface ProjectionResult {
  years: number;
  currentProviderFinal: number;
  wealthsimpleFinal: number;
  savings: number;
  currentFeesPaid: number;
  wsFeesPaid: number;
  totalContributions: number;
  currentGrowth: number;
  wsGrowth: number;
}

function computeFutureValue(
  pv: number,
  monthlyContribution: number,
  annualReturn: number,
  annualFee: number,
  years: number
) {
  const months = years * 12;
  const monthlyRate = (annualReturn - annualFee) / 100 / 12;

  if (monthlyRate === 0) {
    return pv + monthlyContribution * months;
  }

  const compoundFactor = Math.pow(1 + monthlyRate, months);
  const fvLumpSum = pv * compoundFactor;
  const fvAnnuity = monthlyContribution * ((compoundFactor - 1) / monthlyRate);

  return fvLumpSum + fvAnnuity;
}

function computeFeesPaid(
  pv: number,
  monthlyContribution: number,
  annualReturn: number,
  annualFee: number,
  years: number
) {
  const noFeeFV = computeFutureValue(pv, monthlyContribution, annualReturn, 0, years);
  const withFeeFV = computeFutureValue(pv, monthlyContribution, annualReturn, annualFee, years);
  return noFeeFV - withFeeFV;
}

export function WealthsimpleCalculator() {
  const [portfolioValue, setPortfolioValue] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [selectedProviderIndex, setSelectedProviderIndex] = useState(0);
  const [selectedWsTierIndex, setSelectedWsTierIndex] = useState(0);

  const currentProvider = PROVIDER_OPTIONS[selectedProviderIndex];
  const wsTier = WEALTHSIMPLE_TIERS[selectedWsTierIndex];
  const wsTotalFee = wsTier.mgmtFee + wsTier.mer;

  const projections: ProjectionResult[] = useMemo(() => {
    return HORIZONS.map((years) => {
      const totalContributions = monthlyContribution * years * 12;

      const currentProviderFinal = computeFutureValue(
        portfolioValue,
        monthlyContribution,
        ANNUAL_RETURN,
        currentProvider.fee,
        years
      );

      const wealthsimpleFinal = computeFutureValue(
        portfolioValue,
        monthlyContribution,
        ANNUAL_RETURN,
        wsTotalFee,
        years
      );

      const currentFeesPaid = computeFeesPaid(
        portfolioValue,
        monthlyContribution,
        ANNUAL_RETURN,
        currentProvider.fee,
        years
      );

      const wsFeesPaid = computeFeesPaid(
        portfolioValue,
        monthlyContribution,
        ANNUAL_RETURN,
        wsTotalFee,
        years
      );

      const currentGrowth = currentProviderFinal - portfolioValue - totalContributions;
      const wsGrowth = wealthsimpleFinal - portfolioValue - totalContributions;

      return {
        years,
        currentProviderFinal,
        wealthsimpleFinal,
        savings: wealthsimpleFinal - currentProviderFinal,
        currentFeesPaid,
        wsFeesPaid,
        totalContributions,
        currentGrowth,
        wsGrowth,
      };
    });
  }, [portfolioValue, monthlyContribution, currentProvider.fee, wsTotalFee]);

  const maxFinalValue = Math.max(
    ...projections.map((p) => Math.max(p.currentProviderFinal, p.wealthsimpleFinal))
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
              <Calculator className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
              Your Portfolio
            </h3>

            {/* Portfolio Value */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Current Portfolio Value
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26, 107, 58, 0.08)', color: 'var(--sfp-green)' }}
                >
                  {cadFormat.format(portfolioValue)}
                </span>
              </div>
              <Slider
                value={[portfolioValue]}
                onValueChange={(value) => setPortfolioValue(value[0])}
                min={1000}
                max={2000000}
                step={1000}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>C$1,000</span>
                <span>C$1,000,000</span>
                <span>C$2,000,000</span>
              </div>
            </div>

            {/* Monthly Contribution */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Monthly Contribution
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26, 107, 58, 0.08)', color: 'var(--sfp-green)' }}
                >
                  {cadFormat.format(monthlyContribution)}
                </span>
              </div>
              <Slider
                value={[monthlyContribution]}
                onValueChange={(value) => setMonthlyContribution(value[0])}
                min={0}
                max={5000}
                step={50}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>C$0</span>
                <span>C$2,500</span>
                <span>C$5,000</span>
              </div>
            </div>

            {/* Current Provider */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--sfp-ink)' }}>
                Current Provider Fee
              </label>
              <select
                value={selectedProviderIndex}
                onChange={(e) => setSelectedProviderIndex(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                style={{ color: 'var(--sfp-ink)' }}
              >
                {PROVIDER_OPTIONS.map((opt, i) => (
                  <option key={i} value={i}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Wealthsimple Tier */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--sfp-ink)' }}>
                Wealthsimple Plan
              </label>
              <div className="space-y-2">
                {WEALTHSIMPLE_TIERS.map((tier, i) => (
                  <button
                    key={tier.name}
                    onClick={() => setSelectedWsTierIndex(i)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      selectedWsTierIndex === i
                        ? 'border-2 bg-white shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    style={
                      selectedWsTierIndex === i
                        ? { borderColor: 'var(--sfp-green)' }
                        : undefined
                    }
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--sfp-ink)' }}
                      >
                        {tier.name}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--sfp-green)' }}>
                        {(tier.mgmtFee + tier.mer).toFixed(1)}% total
                      </span>
                    </div>
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                      {tier.mgmtFee}% management + {tier.mer}% MER
                      {tier.minBalance > 0 && ` (C$${(tier.minBalance / 1000).toFixed(0)}K+ balance)`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assumptions Note */}
          <div className="rounded-xl p-4 border border-gray-200 bg-white shadow-sm">
            <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
              <strong style={{ color: 'var(--sfp-ink)' }}>Assumptions:</strong> {ANNUAL_RETURN}% annual
              return before fees. Returns compounded monthly. Fees deducted from returns. Past
              performance does not guarantee future results.
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-3 space-y-6">
          {/* Savings Cards */}
          <div className="grid grid-cols-3 gap-4">
            {projections.map((p) => (
              <div
                key={p.years}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 text-center"
              >
                <div className="text-xs mb-1" style={{ color: 'var(--sfp-slate)' }}>{p.years}-Year Savings</div>
                <div
                  className="text-xl md:text-2xl font-bold"
                  style={{ color: p.savings > 0 ? 'var(--sfp-green)' : 'var(--sfp-slate)' }}
                >
                  {p.savings > 0 ? '+' : ''}
                  {cadFormat.format(Math.round(p.savings))}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                  vs {currentProvider.label.split('(')[0].trim()}
                </div>
              </div>
            ))}
          </div>

          {/* Hero Savings */}
          <div className="rounded-2xl p-6 text-white" style={{ background: 'var(--sfp-green)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium opacity-90">
                30-Year Potential Savings
              </span>
            </div>
            <div className="text-4xl md:text-5xl font-bold mb-2">
              {cadFormat.format(Math.round(projections[2].savings))}
            </div>
            <p className="text-sm opacity-90">
              By switching from {currentProvider.label.split('(')[0].trim()} to Wealthsimple{' '}
              {wsTier.name}
            </p>
          </div>

          {/* Comparison Bar Chart */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <h4 className="text-sm font-semibold mb-5" style={{ color: 'var(--sfp-ink)' }}>
              Portfolio Value Comparison
            </h4>
            <div className="space-y-6">
              {projections.map((p) => {
                const currentPct = (p.currentProviderFinal / maxFinalValue) * 100;
                const wsPct = (p.wealthsimpleFinal / maxFinalValue) * 100;

                return (
                  <div key={p.years}>
                    <div className="text-xs mb-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>
                      {p.years} Years
                    </div>

                    {/* Current Provider Bar */}
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-xs w-24 shrink-0 truncate" style={{ color: 'var(--sfp-slate)' }}>
                        {currentProvider.label.split('(')[0].trim()}
                      </span>
                      <div className="flex-1 h-6 rounded-full overflow-hidden bg-gray-100">
                        <div
                          className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                          style={{
                            width: `${Math.max(currentPct, 5)}%`,
                            background: 'rgba(214, 64, 69, 0.7)',
                          }}
                        >
                          <span className="text-xs font-medium text-white whitespace-nowrap">
                            {cadFormat.format(Math.round(p.currentProviderFinal))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Wealthsimple Bar */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-24 shrink-0" style={{ color: 'var(--sfp-slate)' }}>
                        Wealthsimple
                      </span>
                      <div className="flex-1 h-6 rounded-full overflow-hidden bg-gray-100">
                        <div
                          className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                          style={{
                            width: `${Math.max(wsPct, 5)}%`,
                            background: 'rgba(26, 107, 58, 0.7)',
                          }}
                        >
                          <span className="text-xs font-medium text-white whitespace-nowrap">
                            {cadFormat.format(Math.round(p.wealthsimpleFinal))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: 'rgba(214, 64, 69, 0.7)' }}
                />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                  {currentProvider.label.split('(')[0].trim()} ({currentProvider.fee}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: 'rgba(26, 107, 58, 0.7)' }}
                />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                  Wealthsimple {wsTier.name} ({wsTotalFee.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--sfp-ink)' }}>Detailed Breakdown</h4>
            <div className="space-y-4">
              {projections.map((p) => (
                <div
                  key={p.years}
                  className="rounded-xl border border-gray-200 p-4"
                  style={{ background: 'var(--sfp-gray)' }}
                >
                  <div className="text-xs font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>
                    {p.years}-Year Projection
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Current Provider Column */}
                    <div>
                      <div className="text-xs font-medium mb-2" style={{ color: 'var(--sfp-red)' }}>
                        {currentProvider.label.split('(')[0].trim()}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Starting</span>
                          <span className="text-xs" style={{ color: 'var(--sfp-ink)' }}>
                            {cadFormat.format(portfolioValue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Contributions</span>
                          <span className="text-xs" style={{ color: 'var(--sfp-ink)' }}>
                            {cadFormat.format(p.totalContributions)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Growth</span>
                          <span className="text-xs" style={{ color: 'var(--sfp-green)' }}>
                            +{cadFormat.format(Math.round(p.currentGrowth))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Fees Paid</span>
                          <span className="text-xs" style={{ color: 'var(--sfp-red)' }}>
                            -{cadFormat.format(Math.round(p.currentFeesPaid))}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 pt-1.5 flex justify-between">
                          <span className="text-xs font-medium" style={{ color: 'var(--sfp-ink)' }}>Final Value</span>
                          <span className="text-xs font-bold" style={{ color: 'var(--sfp-ink)' }}>
                            {cadFormat.format(Math.round(p.currentProviderFinal))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Wealthsimple Column */}
                    <div>
                      <div className="text-xs font-medium mb-2" style={{ color: 'var(--sfp-green)' }}>
                        Wealthsimple {wsTier.name}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Starting</span>
                          <span className="text-xs" style={{ color: 'var(--sfp-ink)' }}>
                            {cadFormat.format(portfolioValue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Contributions</span>
                          <span className="text-xs" style={{ color: 'var(--sfp-ink)' }}>
                            {cadFormat.format(p.totalContributions)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Growth</span>
                          <span className="text-xs" style={{ color: 'var(--sfp-green)' }}>
                            +{cadFormat.format(Math.round(p.wsGrowth))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Fees Paid</span>
                          <span className="text-xs" style={{ color: 'var(--sfp-red)' }}>
                            -{cadFormat.format(Math.round(p.wsFeesPaid))}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 pt-1.5 flex justify-between">
                          <span className="text-xs font-medium" style={{ color: 'var(--sfp-ink)' }}>Final Value</span>
                          <span className="text-xs font-bold" style={{ color: 'var(--sfp-green)' }}>
                            {cadFormat.format(Math.round(p.wealthsimpleFinal))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Savings callout */}
                  {p.savings > 0 && (
                    <div
                      className="mt-3 rounded-lg p-2 text-center"
                      style={{ background: 'rgba(26, 107, 58, 0.06)' }}
                    >
                      <span className="text-xs font-semibold" style={{ color: 'var(--sfp-green)' }}>
                        You save {cadFormat.format(Math.round(p.savings))} over {p.years} years
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>
              Start saving on investment fees today
            </h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Open a Wealthsimple account in minutes. No minimum balance required. Get up to
              C$25,000 managed free for the first year.
            </p>
            <Button asChild className="w-full text-white" style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}>
              <a href="/go/wealthsimple" target="_blank" rel="noopener noreferrer">
                Start Investing with Wealthsimple
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Free to sign up. No obligation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

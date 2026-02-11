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
          <div
            className="rounded-2xl border border-slate-700/40 p-6"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-400" />
              Your Portfolio
            </h3>

            {/* Portfolio Value */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  Current Portfolio Value
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
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
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>C$1,000</span>
                <span>C$1,000,000</span>
                <span>C$2,000,000</span>
              </div>
            </div>

            {/* Monthly Contribution */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-slate-500" />
                  Monthly Contribution
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
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
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>C$0</span>
                <span>C$2,500</span>
                <span>C$5,000</span>
              </div>
            </div>

            {/* Current Provider */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Current Provider Fee
              </label>
              <select
                value={selectedProviderIndex}
                onChange={(e) => setSelectedProviderIndex(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700/50 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {PROVIDER_OPTIONS.map((opt, i) => (
                  <option key={i} value={i} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Wealthsimple Tier */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Wealthsimple Plan
              </label>
              <div className="space-y-2">
                {WEALTHSIMPLE_TIERS.map((tier, i) => (
                  <button
                    key={tier.name}
                    onClick={() => setSelectedWsTierIndex(i)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      selectedWsTierIndex === i
                        ? 'border-emerald-400 bg-emerald-400/10'
                        : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                    style={
                      selectedWsTierIndex !== i
                        ? { background: 'rgba(255,255,255,0.02)' }
                        : undefined
                    }
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-sm font-medium ${
                          selectedWsTierIndex === i ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {tier.name}
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold">
                        {(tier.mgmtFee + tier.mer).toFixed(1)}% total
                      </span>
                    </div>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      {tier.mgmtFee}% management + {tier.mer}% MER
                      {tier.minBalance > 0 && ` (C$${(tier.minBalance / 1000).toFixed(0)}K+ balance)`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assumptions Note */}
          <div
            className="rounded-xl p-4 border border-slate-700/30"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <p className="text-xs text-slate-500">
              <strong className="text-slate-400">Assumptions:</strong> {ANNUAL_RETURN}% annual
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
                className="rounded-2xl border border-slate-700/40 p-4 text-center"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="text-xs text-slate-500 mb-1">{p.years}-Year Savings</div>
                <div
                  className={`text-xl md:text-2xl font-bold ${
                    p.savings > 0 ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {p.savings > 0 ? '+' : ''}
                  {cadFormat.format(Math.round(p.savings))}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  vs {currentProvider.label.split('(')[0].trim()}
                </div>
              </div>
            ))}
          </div>

          {/* Hero Savings */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium text-emerald-100">
                30-Year Potential Savings
              </span>
            </div>
            <div className="text-4xl md:text-5xl font-bold mb-2">
              {cadFormat.format(Math.round(projections[2].savings))}
            </div>
            <p className="text-sm text-emerald-100">
              By switching from {currentProvider.label.split('(')[0].trim()} to Wealthsimple{' '}
              {wsTier.name}
            </p>
          </div>

          {/* Comparison Bar Chart */}
          <div
            className="rounded-2xl border border-slate-700/40 p-6"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <h4 className="text-sm font-semibold text-white mb-5">
              Portfolio Value Comparison
            </h4>
            <div className="space-y-6">
              {projections.map((p) => {
                const currentPct = (p.currentProviderFinal / maxFinalValue) * 100;
                const wsPct = (p.wealthsimpleFinal / maxFinalValue) * 100;

                return (
                  <div key={p.years}>
                    <div className="text-xs text-slate-400 mb-2 font-medium">
                      {p.years} Years
                    </div>

                    {/* Current Provider Bar */}
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-xs text-slate-500 w-24 shrink-0 truncate">
                        {currentProvider.label.split('(')[0].trim()}
                      </span>
                      <div className="flex-1 h-6 rounded-full overflow-hidden bg-slate-800/50">
                        <div
                          className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                          style={{
                            width: `${Math.max(currentPct, 5)}%`,
                            background: 'rgba(244,63,94,0.6)',
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
                      <span className="text-xs text-slate-500 w-24 shrink-0">
                        Wealthsimple
                      </span>
                      <div className="flex-1 h-6 rounded-full overflow-hidden bg-slate-800/50">
                        <div
                          className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                          style={{
                            width: `${Math.max(wsPct, 5)}%`,
                            background: 'rgba(16,185,129,0.6)',
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
            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-slate-700/30">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: 'rgba(244,63,94,0.6)' }}
                />
                <span className="text-xs text-slate-400">
                  {currentProvider.label.split('(')[0].trim()} ({currentProvider.fee}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.6)' }}
                />
                <span className="text-xs text-slate-400">
                  Wealthsimple {wsTier.name} ({wsTotalFee.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div
            className="rounded-2xl border border-slate-700/40 p-6"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <h4 className="text-sm font-semibold text-white mb-4">Detailed Breakdown</h4>
            <div className="space-y-4">
              {projections.map((p) => (
                <div
                  key={p.years}
                  className="rounded-xl border border-slate-800/30 p-4"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <div className="text-xs font-semibold text-slate-300 mb-3">
                    {p.years}-Year Projection
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Current Provider Column */}
                    <div>
                      <div className="text-xs text-rose-400 font-medium mb-2">
                        {currentProvider.label.split('(')[0].trim()}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Starting</span>
                          <span className="text-xs text-slate-400">
                            {cadFormat.format(portfolioValue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Contributions</span>
                          <span className="text-xs text-slate-400">
                            {cadFormat.format(p.totalContributions)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Growth</span>
                          <span className="text-xs text-emerald-400/70">
                            +{cadFormat.format(Math.round(p.currentGrowth))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Fees Paid</span>
                          <span className="text-xs text-rose-400">
                            -{cadFormat.format(Math.round(p.currentFeesPaid))}
                          </span>
                        </div>
                        <div className="border-t border-slate-700/30 pt-1.5 flex justify-between">
                          <span className="text-xs font-medium text-slate-300">Final Value</span>
                          <span className="text-xs font-bold text-white">
                            {cadFormat.format(Math.round(p.currentProviderFinal))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Wealthsimple Column */}
                    <div>
                      <div className="text-xs text-emerald-400 font-medium mb-2">
                        Wealthsimple {wsTier.name}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Starting</span>
                          <span className="text-xs text-slate-400">
                            {cadFormat.format(portfolioValue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Contributions</span>
                          <span className="text-xs text-slate-400">
                            {cadFormat.format(p.totalContributions)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Growth</span>
                          <span className="text-xs text-emerald-400">
                            +{cadFormat.format(Math.round(p.wsGrowth))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-500">Fees Paid</span>
                          <span className="text-xs text-rose-400">
                            -{cadFormat.format(Math.round(p.wsFeesPaid))}
                          </span>
                        </div>
                        <div className="border-t border-slate-700/30 pt-1.5 flex justify-between">
                          <span className="text-xs font-medium text-slate-300">Final Value</span>
                          <span className="text-xs font-bold text-emerald-400">
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
                      style={{ background: 'rgba(16,185,129,0.1)' }}
                    >
                      <span className="text-xs text-emerald-400 font-semibold">
                        You save {cadFormat.format(Math.round(p.savings))} over {p.years} years
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div
            className="rounded-2xl border border-slate-700/40 p-6"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <h4 className="font-semibold text-white mb-2">
              Start saving on investment fees today
            </h4>
            <p className="text-sm text-slate-400 mb-4">
              Open a Wealthsimple account in minutes. No minimum balance required. Get up to
              C$25,000 managed free for the first year.
            </p>
            <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600">
              <a href="/go/wealthsimple" target="_blank" rel="noopener noreferrer">
                Start Investing with Wealthsimple
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-slate-500 text-center mt-3">
              Free to sign up. No obligation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

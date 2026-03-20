'use client';

import { useState, useMemo } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  Percent,
  Calendar,
  TrendingUp,
  TrendingDown,
  Award,
  ArrowRight,
  AlertCircle,
  BarChart3,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface GoldROIResults {
  investmentAmount: number;
  goldPricePerOz: number;
  ouncesOfGold: number;
  annualReturnRate: number;
  projectedValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalProfit: number;
  cgtApplied: boolean;
  cgtDiscount: number;
  afterTaxProfit: number;
  asxComparison: number;
  bondsComparison: number;
  cashComparison: number;
}

interface ComparisonData {
  asset: string;
  label: string;
  color: string;
  finalValue: number;
}

const formatAUD = (value: number) =>
  `A$${value.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatAUDDecimal = (value: number) =>
  `A$${value.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function GoldROICalculator() {
  const [investmentAmount, setInvestmentAmount] = useState(50000);
  const [holdingPeriodYears, setHoldingPeriodYears] = useState(10);
  const [expectedReturnRate, setExpectedReturnRate] = useState(5);
  const goldPricePerOz = 3500; // Hardcoded AUD price per troy ounce

  const results: GoldROIResults = useMemo(() => {
    const ouncesOfGold = investmentAmount / goldPricePerOz;
    const projectedValue = investmentAmount * Math.pow(1 + expectedReturnRate / 100, holdingPeriodYears);
    const totalReturn = projectedValue - investmentAmount;
    const totalReturnPercent = (totalReturn / investmentAmount) * 100;

    // CGT: 50% discount if held > 12 months
    let cgtApplied = false;
    let cgtDiscount = 0;
    let afterTaxProfit = totalReturn;

    if (holdingPeriodYears > 1) {
      cgtApplied = true;
      // Assuming 37% top tax rate + Medicare levy (typical), then 50% CGT discount
      const standardTaxRate = 0.37 + 0.02; // 37% + 2% Medicare
      const discountedGain = totalReturn * 0.5; // 50% discount
      const cgt = discountedGain * standardTaxRate;
      cgtDiscount = cgt;
      afterTaxProfit = totalReturn - cgt;
    }

    // Calculate comparison assets at same holding period
    const asxComparison = investmentAmount * Math.pow(1 + 0.07 / 100, holdingPeriodYears);
    const bondsComparison = investmentAmount * Math.pow(1 + 0.04 / 100, holdingPeriodYears);
    const cashComparison = investmentAmount * Math.pow(1 + 0.02 / 100, holdingPeriodYears);

    return {
      investmentAmount,
      goldPricePerOz,
      ouncesOfGold: Math.round(ouncesOfGold * 100) / 100,
      annualReturnRate: expectedReturnRate,
      projectedValue: Math.round(projectedValue * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      totalProfit: Math.round(totalReturn * 100) / 100,
      cgtApplied,
      cgtDiscount: Math.round(cgtDiscount * 100) / 100,
      afterTaxProfit: Math.round(afterTaxProfit * 100) / 100,
      asxComparison: Math.round(asxComparison * 100) / 100,
      bondsComparison: Math.round(bondsComparison * 100) / 100,
      cashComparison: Math.round(cashComparison * 100) / 100,
    };
  }, [investmentAmount, holdingPeriodYears, expectedReturnRate]);

  const comparisonData: ComparisonData[] = useMemo(() => [
    { asset: 'gold', label: 'Gold', color: 'var(--sfp-gold)', finalValue: results.projectedValue },
    { asset: 'asx', label: 'ASX 200 (7% avg)', color: 'var(--sfp-navy)', finalValue: results.asxComparison },
    { asset: 'bonds', label: 'Bonds (4% avg)', color: 'var(--sfp-sky)', finalValue: results.bondsComparison },
    { asset: 'cash', label: 'Cash (2% avg)', color: 'var(--sfp-gray)', finalValue: results.cashComparison },
  ], [results]);

  const maxValue = Math.max(...comparisonData.map(d => d.finalValue));
  const goldOutperforms = results.projectedValue > results.asxComparison;

  const performanceColor = goldOutperforms ? 'var(--sfp-green)' : 'var(--sfp-red)';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-navy)' }}>
              <Calculator className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
              Gold Investment Details
            </h3>

            {/* Investment Amount */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Investment Amount (AUD)
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {formatAUD(investmentAmount)}
                </span>
              </div>
              <Slider
                value={[investmentAmount]}
                onValueChange={(value) => setInvestmentAmount(value[0])}
                min={1000}
                max={500000}
                step={1000}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>A$1,000</span>
                <span>A$250,000</span>
                <span>A$500,000</span>
              </div>
            </div>

            {/* Holding Period */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <Calendar className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Holding Period
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {holdingPeriodYears} year{holdingPeriodYears !== 1 ? 's' : ''}
                </span>
              </div>
              <Slider
                value={[holdingPeriodYears]}
                onValueChange={(value) => setHoldingPeriodYears(value[0])}
                min={1}
                max={30}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>1 year</span>
                <span>15 years</span>
                <span>30 years</span>
              </div>
            </div>

            {/* Expected Annual Return */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <Percent className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Expected Annual Return
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {expectedReturnRate}%
                </span>
              </div>
              <div className="flex gap-2">
                {[
                  { label: 'Conservative (3%)', value: 3 },
                  { label: 'Moderate (5%)', value: 5 },
                  { label: 'Aggressive (7%)', value: 7 },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setExpectedReturnRate(option.value)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                      expectedReturnRate === option.value
                        ? 'border-transparent text-white'
                        : 'border-gray-200 text-slate-600 hover:border-slate-300'
                    }`}
                    style={{
                      background:
                        expectedReturnRate === option.value
                          ? 'var(--sfp-navy)'
                          : 'var(--sfp-gray)',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Gold Price */}
            <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--sfp-gray)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Current Gold Price (approx)</span>
                <span className="font-semibold" style={{ color: 'var(--sfp-gold)' }}>
                  {formatAUD(goldPricePerOz)}/oz
                </span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--sfp-slate)' }}>
                Based on typical Australian spot gold price. Actual prices vary daily.
              </p>
            </div>
          </div>

          {/* Tax Disclaimer */}
          <div className="rounded-xl p-4 border-l-4" style={{ borderColor: 'var(--sfp-gold)', background: 'var(--sfp-sky)' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Capital Gains Tax (CGT) Note
            </h4>
            <p className="text-xs mb-2" style={{ color: 'var(--sfp-ink)' }}>
              Australia provides a 50% CGT discount for assets held longer than 12 months. This calculator applies
              a 37% marginal tax rate + 2% Medicare levy to discounted gains.
            </p>
            <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
              Your actual tax may vary based on personal income, other income sources, and state taxes. Consult an
              accountant for personalised advice.
            </p>
          </div>

          {/* Trust Section */}
          <div className="rounded-xl p-4 border" style={{ background: '#f0fdf4', borderColor: 'var(--sfp-green)' }}>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-green)' }}>
              <Award className="h-4 w-4" />
              Why Gold?
            </h4>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--sfp-ink)' }}>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--sfp-green)', fontWeight: 'bold' }}>✓</span>
                <span>Inflation hedge — gold typically rises with inflation</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--sfp-green)', fontWeight: 'bold' }}>✓</span>
                <span>Portfolio diversification — low correlation with shares</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--sfp-green)', fontWeight: 'bold' }}>✓</span>
                <span>Safe-haven asset — holds value during market volatility</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Projected Value Highlight */}
          <LazyMotion features={domAnimation}>
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-6 text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">Projected Value</span>
              </div>
              <div className="text-5xl font-bold mb-2">
                {formatAUD(results.projectedValue)}
              </div>
              <p className="text-sm opacity-90">
                After {holdingPeriodYears} year{holdingPeriodYears !== 1 ? 's' : ''} at {expectedReturnRate}% annual return
              </p>
            </m.div>
          </LazyMotion>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Gold Ounces</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-navy)' }}>
                {results.ouncesOfGold.toFixed(2)} oz
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>Troy ounces purchased</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Total Return</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-green)' }}>
                {results.totalReturnPercent.toFixed(1)}%
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>Over {holdingPeriodYears} years</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Total Profit</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {formatAUD(results.totalProfit)}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" style={{ color: 'var(--sfp-red)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>After CGT (50% discount)</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {formatAUD(results.afterTaxProfit)}
              </div>
              {results.cgtApplied && (
                <p className="text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                  Discount: {formatAUD(results.cgtDiscount)}
                </p>
              )}
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-medium mb-4" style={{ color: 'var(--sfp-ink)' }}>
              Growth Comparison ({holdingPeriodYears}-Year Horizon)
            </h4>
            <div className="space-y-3">
              {comparisonData.map((item) => {
                const percentage = (item.finalValue / maxValue) * 100;
                const outperforms = item.asset === 'gold' && goldOutperforms;

                return (
                  <div key={item.asset}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                        {item.label}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{
                          color: item.color,
                          background: outperforms ? 'rgba(26, 107, 58, 0.1)' : 'transparent',
                          padding: outperforms ? '0.25rem 0.75rem' : '0',
                          borderRadius: outperforms ? '0.25rem' : '0',
                        }}
                      >
                        {formatAUD(item.finalValue)}
                        {outperforms && ' ✓'}
                      </span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden bg-gray-100">
                      <div
                        style={{
                          width: `${percentage}%`,
                          background: item.color,
                          height: '100%',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {goldOutperforms ? (
              <div
                className="mt-4 p-3 rounded-lg flex items-start gap-2"
                style={{ background: 'rgba(26, 107, 58, 0.1)', borderLeft: '3px solid var(--sfp-green)' }}
              >
                <Zap className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-ink)' }}>
                  <strong style={{ color: 'var(--sfp-green)' }}>Gold outperforms</strong> the ASX 200 average
                  under your assumptions. Actual results depend on real-world gold price movements.
                </span>
              </div>
            ) : (
              <div
                className="mt-4 p-3 rounded-lg flex items-start gap-2"
                style={{ background: 'rgba(245, 166, 35, 0.1)', borderLeft: '3px solid var(--sfp-gold)' }}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-ink)' }}>
                  <strong style={{ color: 'var(--sfp-gold)' }}>ASX 200 outperforms</strong> gold under your assumptions.
                  Diversification reduces risk across both assets.
                </span>
              </div>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--sfp-ink)' }}>
              Profit Breakdown
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--sfp-slate)' }}>Initial Investment</span>
                <span className="font-medium" style={{ color: 'var(--sfp-navy)' }}>
                  {formatAUD(results.investmentAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--sfp-slate)' }}>Gross Profit</span>
                <span className="font-medium" style={{ color: 'var(--sfp-green)' }}>
                  +{formatAUD(results.totalProfit)}
                </span>
              </div>
              {results.cgtApplied && (
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--sfp-slate)' }}>CGT (50% discount applied)</span>
                  <span className="font-medium" style={{ color: 'var(--sfp-red)' }}>
                    -{formatAUD(results.cgtDiscount)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  {results.cgtApplied ? 'Net Profit (After Tax)' : 'Total Profit'}
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  {formatAUD(results.afterTaxProfit)}
                </span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-4 h-3 rounded-full overflow-hidden flex bg-gray-100">
              <div
                style={{
                  width: `${(results.investmentAmount / results.projectedValue) * 100}%`,
                  background: 'var(--sfp-navy)',
                }}
              />
              {results.cgtApplied ? (
                <>
                  <div
                    style={{
                      width: `${(results.afterTaxProfit / results.projectedValue) * 100}%`,
                      background: 'var(--sfp-green)',
                    }}
                  />
                  <div
                    style={{
                      width: `${(results.cgtDiscount / results.projectedValue) * 100}%`,
                      background: 'var(--sfp-red)',
                    }}
                  />
                </>
              ) : (
                <div
                  style={{
                    width: `${(results.totalProfit / results.projectedValue) * 100}%`,
                    background: 'var(--sfp-green)',
                  }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
              <span>Investment ({Math.round((results.investmentAmount / results.projectedValue) * 100)}%)</span>
              {results.cgtApplied ? (
                <>
                  <span>Profit ({Math.round((results.afterTaxProfit / results.projectedValue) * 100)}%)</span>
                  <span>Tax ({Math.round((results.cgtDiscount / results.projectedValue) * 100)}%)</span>
                </>
              ) : (
                <span>Profit ({Math.round((results.totalProfit / results.projectedValue) * 100)}%)</span>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Ready to Invest in Gold?
            </h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Explore Australian gold investment options through Perth Mint, PMVS, or bullion dealers. Compare storage
              costs and insurance before you buy.
            </p>
            <Button
              asChild
              variant="gold"
              className="w-full"
            >
              <a href="/go/perth-mint" target="_blank" rel="noopener noreferrer">
                Explore Gold Investment Options
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Not financial advice. Gold prices are volatile. Consult a licensed financial adviser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

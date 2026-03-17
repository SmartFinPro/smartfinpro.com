'use client';

import { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  Percent,
  TrendingUp,
  Shield,
  ArrowRight,
  AlertTriangle,
  PiggyBank,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface TaxSavingsResult {
  isaValue: number;
  giaValue: number;
  taxSaved: number;
  cgtPaid: number;
  dividendTaxPaid: number;
  totalTaxDrag: number;
}

const TAX_BANDS = [
  { name: 'Basic Rate (20%)', cgtRate: 0.18, dividendRate: 0.0875 },
  { name: 'Higher Rate (40%)', cgtRate: 0.24, dividendRate: 0.3375 },
  { name: 'Additional Rate (45%)', cgtRate: 0.24, dividendRate: 0.3935 },
];

const formatGBP = (value: number) =>
  `£${value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export function ISATaxSavingsCalculator() {
  const [annualInvestment, setAnnualInvestment] = useState(10000);
  const [growthRate, setGrowthRate] = useState(7);
  const [dividendYield, setDividendYield] = useState(2);
  const [selectedBandIndex, setSelectedBandIndex] = useState(1);
  const [timeHorizon, setTimeHorizon] = useState<5 | 10 | 20>(10);

  const selectedBand = TAX_BANDS[selectedBandIndex];

  const results: Record<5 | 10 | 20, TaxSavingsResult> = useMemo(() => {
    const horizons: (5 | 10 | 20)[] = [5, 10, 20];
    const res = {} as Record<5 | 10 | 20, TaxSavingsResult>;

    for (const years of horizons) {
      const capitalGrowthRate = (growthRate - dividendYield) / 100;
      const divYield = dividendYield / 100;
      const cgtAllowance = 3000;
      const dividendAllowance = 500;

      let isaBalance = 0;
      let giaBalance = 0;
      let giaCostBase = 0;
      let totalCgtPaid = 0;
      let totalDivTaxPaid = 0;

      for (let year = 1; year <= years; year++) {
        // Add annual contribution
        isaBalance += annualInvestment;
        giaBalance += annualInvestment;
        giaCostBase += annualInvestment;

        // Capital growth
        isaBalance *= 1 + capitalGrowthRate;
        giaBalance *= 1 + capitalGrowthRate;

        // Dividends — ISA: fully reinvested, GIA: taxed then reinvested
        const isaDividends = isaBalance * divYield;
        isaBalance += isaDividends;

        const giaDividends = giaBalance * divYield;
        const taxableDividends = Math.max(0, giaDividends - dividendAllowance);
        const dividendTax = taxableDividends * selectedBand.dividendRate;
        totalDivTaxPaid += dividendTax;
        giaBalance += giaDividends - dividendTax;
      }

      // CGT on GIA disposal (simplified — full disposal at end)
      const giaGain = Math.max(0, giaBalance - giaCostBase);
      const taxableGain = Math.max(0, giaGain - cgtAllowance);
      const cgt = taxableGain * selectedBand.cgtRate;
      totalCgtPaid += cgt;
      const giaAfterTax = giaBalance - cgt;

      res[years] = {
        isaValue: Math.round(isaBalance),
        giaValue: Math.round(giaAfterTax),
        taxSaved: Math.round(isaBalance - giaAfterTax),
        cgtPaid: Math.round(cgt),
        dividendTaxPaid: Math.round(totalDivTaxPaid),
        totalTaxDrag: Math.round(isaBalance - giaAfterTax),
      };
    }

    return res;
  }, [annualInvestment, growthRate, dividendYield, selectedBandIndex]);

  const activeResult = results[timeHorizon];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div
            className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
              <Shield className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              ISA Tax Shield Calculator
            </h3>

            {/* Tax Band Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>
                Your Tax Band
              </label>
              <div className="space-y-2">
                {TAX_BANDS.map((band, idx) => (
                  <button
                    key={band.name}
                    onClick={() => setSelectedBandIndex(idx)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      selectedBandIndex === idx
                        ? 'border-gray-200 bg-white shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={
                      selectedBandIndex === idx
                        ? { borderColor: 'var(--sfp-navy)' }
                        : undefined
                    }
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: selectedBandIndex === idx ? 'var(--sfp-navy)' : 'var(--sfp-slate)' }}
                    >
                      {band.name}
                    </span>
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                      CGT: {(band.cgtRate * 100).toFixed(0)}% | Dividend:{' '}
                      {(band.dividendRate * 100).toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Annual Investment */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Annual ISA Contribution
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}
                >
                  {formatGBP(annualInvestment)}
                </span>
              </div>
              <Slider
                value={[annualInvestment]}
                onValueChange={(value) => setAnnualInvestment(value[0])}
                min={1000}
                max={20000}
                step={500}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>£1,000</span>
                <span>£10,000</span>
                <span>£20,000</span>
              </div>
            </div>

            {/* Expected Growth */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Expected Annual Growth
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}
                >
                  {growthRate}%
                </span>
              </div>
              <Slider
                value={[growthRate]}
                onValueChange={(value) => setGrowthRate(value[0])}
                min={3}
                max={12}
                step={0.5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>3%</span>
                <span>7%</span>
                <span>12%</span>
              </div>
            </div>

            {/* Dividend Yield */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Percent className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Average Dividend Yield
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}
                >
                  {dividendYield}%
                </span>
              </div>
              <Slider
                value={[dividendYield]}
                onValueChange={(value) => setDividendYield(value[0])}
                min={0}
                max={5}
                step={0.25}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>0%</span>
                <span>2.5%</span>
                <span>5%</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                UK equity average ~3.5% | Global growth funds ~1.5%
              </p>
            </div>
          </div>

          {/* FCA Disclaimer */}
          <div
            className="rounded-xl p-4 border border-gray-200"
            style={{ background: 'rgba(245,158,11,0.05)' }}
          >
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                <strong style={{ color: 'var(--sfp-gold)' }}>Capital at risk.</strong> The value of
                investments can go down as well as up. You may get back less than you invest. Tax
                treatment depends on your individual circumstances and may be subject to change.
                This calculator provides estimates only — consult a financial adviser for personal
                advice.
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Time Horizon Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {([5, 10, 20] as const).map((years) => (
              <button
                key={years}
                onClick={() => setTimeHorizon(years)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  timeHorizon === years
                    ? 'border-gray-200 bg-white shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={
                  timeHorizon === years
                    ? { borderColor: 'var(--sfp-navy)' }
                    : undefined
                }
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: timeHorizon === years ? 'var(--sfp-navy)' : 'var(--sfp-slate)' }}
                >
                  {years} Years
                </span>
              </button>
            ))}
          </div>

          {/* Tax Saved Highlight */}
          <div className="rounded-2xl p-6 text-white" style={{ background: 'var(--sfp-navy)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium opacity-90">
                ISA Tax Shield — {timeHorizon} Years
              </span>
            </div>
            <div className="text-5xl font-bold mb-2">{formatGBP(activeResult.taxSaved)}</div>
            <p className="text-sm opacity-90">
              Total tax saved by investing inside an ISA vs a General Investment Account
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>ISA Portfolio Value</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-green)' }}>
                {formatGBP(activeResult.isaValue)}
              </div>
              <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>100% tax-free</span>
            </div>

            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>GIA Value (After Tax)</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-slate)' }}>
                {formatGBP(activeResult.giaValue)}
              </div>
              <span className="text-xs" style={{ color: 'var(--sfp-red)' }}>
                -{formatGBP(activeResult.totalTaxDrag)} tax drag
              </span>
            </div>

            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4" style={{ color: 'var(--sfp-red)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>CGT Payable (GIA)</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-red)' }}>
                {formatGBP(activeResult.cgtPaid)}
              </div>
            </div>

            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" style={{ color: 'var(--sfp-red)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Dividend Tax (GIA)</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-red)' }}>
                {formatGBP(activeResult.dividendTaxPaid)}
              </div>
            </div>
          </div>

          {/* Comparison Summary */}
          <div
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
          >
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>
              ISA vs General Investment Account — {timeHorizon} Year Comparison
            </h4>
            <div className="space-y-3">
              {([5, 10, 20] as const).map((years) => (
                <div key={years} className="flex items-center gap-3">
                  <span className="text-xs w-16" style={{ color: 'var(--sfp-slate)' }}>{years} years</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden flex relative bg-gray-100">
                    <div
                      className="h-full"
                      style={{
                        width: `${(results[years].isaValue / (results[years].isaValue + results[years].totalTaxDrag)) * 100}%`,
                        background: 'var(--sfp-green)',
                      }}
                    />
                    <div
                      className="h-full"
                      style={{
                        width: `${(results[years].totalTaxDrag / (results[years].isaValue + results[years].totalTaxDrag)) * 100}%`,
                        background: 'rgba(214,64,69,0.4)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium w-20 text-right" style={{ color: 'var(--sfp-green)' }}>
                    +{formatGBP(results[years].taxSaved)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--sfp-slate)' }}>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--sfp-green)' }} /> ISA (tax-free)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(214,64,69,0.4)' }} /> Tax drag (GIA)
              </span>
            </div>
          </div>

          {/* CTA */}
          <div
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-6"
          >
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>
              Maximise your tax-free allowance
            </h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Compare the UK&apos;s top Stocks &amp; Shares ISA providers. Find the right platform
              for your investment goals.
            </p>
            <Button asChild className="w-full text-white hover:opacity-90" style={{ background: 'var(--sfp-gold)' }}>
              <a href="/uk/personal-finance">
                Compare ISA Providers
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Capital at risk. Tax treatment depends on individual circumstances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

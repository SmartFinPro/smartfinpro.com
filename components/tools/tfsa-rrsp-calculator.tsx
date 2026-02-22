'use client';

import { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  Percent,
  TrendingUp,
  PiggyBank,
  Home,
  ArrowRight,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface CalculationResults {
  tfsaRoom: number;
  rrspRoom: number;
  rrspTaxSavings: number;
  fhsaRoom: number;
  fhsaEligible: boolean;
  recommendation: string;
}

interface ChartDataPoint {
  year: number;
  tfsa: number;
  rrsp: number;
  fhsa: number;
}

const formatCAD = (value: number) =>
  `$${value.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// TFSA lifetime limit: $88,000 (cumulative since 2009)
const TFSA_LIFETIME_LIMIT = 88000;

// RRSP annual limit: 18% of previous year income, max $31,560 (2024)
const RRSP_MAX_ANNUAL = 31560;
const RRSP_PERCENTAGE = 0.18;

// FHSA: $8,000 per year, max $40,000 lifetime
const FHSA_ANNUAL_LIMIT = 8000;
const FHSA_LIFETIME_LIMIT = 40000;

// Tax brackets (Canadian federal + provincial average)
const getTaxRate = (income: number): number => {
  if (income < 55867) return 0.25;
  if (income < 111733) return 0.30;
  if (income < 173205) return 0.35;
  return 0.43;
};

export function TfsaRrspCalculator() {
  const [age, setAge] = useState(35);
  const [annualIncome, setAnnualIncome] = useState(75000);
  const [tfsaContributed, setTfsaContributed] = useState(30000);
  const [rrspContributed, setRrspContributed] = useState(45000);
  const [investmentReturn, setInvestmentReturn] = useState(6);
  const [showChart, setShowChart] = useState(false);

  const results: CalculationResults = useMemo(() => {
    // TFSA Room Calculation
    const tfsaRoom = Math.max(0, TFSA_LIFETIME_LIMIT - tfsaContributed);

    // RRSP Room Calculation
    const rrspAnnualRoom = Math.min(annualIncome * RRSP_PERCENTAGE, RRSP_MAX_ANNUAL);
    const rrspRoom = Math.max(0, rrspAnnualRoom - rrspContributed);

    // Tax savings from RRSP contribution
    const taxRate = getTaxRate(annualIncome);
    const rrspTaxSavings = Math.round(rrspRoom * taxRate);

    // FHSA Eligibility (age 18-71, first-time home buyer)
    const fhsaEligible = age >= 18 && age <= 71;
    const fhsaRoom = fhsaEligible ? FHSA_ANNUAL_LIMIT : 0;

    // Recommendation logic
    let recommendation = '';
    if (tfsaRoom > 0) {
      recommendation = 'Priority: Max out TFSA first for emergency fund flexibility. ';
    }
    if (rrspTaxSavings > 500) {
      recommendation += `Then RRSP for ${formatCAD(rrspTaxSavings)} tax savings. `;
    }
    if (fhsaEligible && fhsaRoom > 0) {
      recommendation += 'Consider FHSA if you\'re a first-time home buyer.';
    }
    if (!recommendation) {
      recommendation = 'All accounts maxed out. Consider non-registered investments.';
    }

    return {
      tfsaRoom,
      rrspRoom,
      rrspTaxSavings,
      fhsaRoom,
      fhsaEligible,
      recommendation,
    };
  }, [age, annualIncome, tfsaContributed, rrspContributed]);

  // Generate 30-year projection
  const chartData: ChartDataPoint[] = useMemo(() => {
    const data: ChartDataPoint[] = [];
    const annualRate = investmentReturn / 100;
    const retirementAge = 65;

    for (let year = 0; year <= 30; year++) {
      const currentAge = age + year;

      if (currentAge <= retirementAge) {
        // TFSA growth (can contribute annually)
        let tfsaBalance = tfsaContributed;
        for (let y = 0; y < year; y++) {
          tfsaBalance = tfsaBalance * (1 + annualRate) + Math.min(7000, results.tfsaRoom / 10);
        }

        // RRSP growth
        let rrspBalance = rrspContributed;
        for (let y = 0; y < year; y++) {
          const annualContrib = Math.min(results.rrspRoom, RRSP_MAX_ANNUAL);
          rrspBalance = rrspBalance * (1 + annualRate) + annualContrib;
        }

        // FHSA growth (if eligible)
        let fhsaBalance = 0;
        if (results.fhsaEligible) {
          for (let y = 0; y < year; y++) {
            fhsaBalance = fhsaBalance * (1 + annualRate) + FHSA_ANNUAL_LIMIT;
            if (fhsaBalance > FHSA_LIFETIME_LIMIT) {
              fhsaBalance = FHSA_LIFETIME_LIMIT;
              break;
            }
          }
        }

        data.push({
          year,
          tfsa: Math.round(tfsaBalance),
          rrsp: Math.round(rrspBalance),
          fhsa: Math.round(fhsaBalance),
        });
      }
    }

    return data;
  }, [age, tfsaContributed, rrspContributed, results.fhsaEligible, investmentReturn]);

  const finalProjection = chartData[chartData.length - 1] || { year: 0, tfsa: 0, rrsp: 0, fhsa: 0 };
  const totalProjected = finalProjection.tfsa + finalProjection.rrsp + finalProjection.fhsa;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Main Input Card */}
          <div className="rounded-2xl border border-slate-200 p-6 bg-white card-light">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Calculator className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              Your Situation
            </h3>

            {/* Age */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <span>Age</span>
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {age} years
                </span>
              </div>
              <Slider
                value={[age]}
                onValueChange={(value) => setAge(value[0])}
                min={18}
                max={71}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>18</span>
                <span>45</span>
                <span>71</span>
              </div>
            </div>

            {/* Annual Income */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                  Annual Income (CAD)
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {formatCAD(annualIncome)}
                </span>
              </div>
              <Slider
                value={[annualIncome]}
                onValueChange={(value) => setAnnualIncome(value[0])}
                min={30000}
                max={250000}
                step={5000}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>$30K</span>
                <span>$75K</span>
                <span>$250K</span>
              </div>
            </div>

            {/* TFSA Contributed */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                  TFSA Contributions So Far
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {formatCAD(tfsaContributed)}
                </span>
              </div>
              <Slider
                value={[tfsaContributed]}
                onValueChange={(value) => setTfsaContributed(value[0])}
                min={0}
                max={TFSA_LIFETIME_LIMIT}
                step={5000}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>$0</span>
                <span>$44K</span>
                <span>$88K</span>
              </div>
            </div>

            {/* RRSP Contributed */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                  RRSP Contributions So Far
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {formatCAD(rrspContributed)}
                </span>
              </div>
              <Slider
                value={[rrspContributed]}
                onValueChange={(value) => setRrspContributed(value[0])}
                min={0}
                max={250000}
                step={5000}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>$0</span>
                <span>$75K</span>
                <span>$250K</span>
              </div>
            </div>

            {/* Expected Investment Return */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Percent className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                  Expected Annual Return
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {investmentReturn}%
                </span>
              </div>
              <Slider
                value={[investmentReturn]}
                onValueChange={(value) => setInvestmentReturn(value[0])}
                min={2}
                max={10}
                step={0.5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>2%</span>
                <span>6%</span>
                <span>10%</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Conservative: 4% | Balanced: 6% | Aggressive: 8%
              </p>
            </div>
          </div>

          {/* CRA Disclaimer */}
          <div
            className="rounded-xl p-4 border-l-4"
            style={{
              borderLeftColor: 'var(--sfp-red)',
              backgroundColor: 'var(--sfp-sky)',
            }}
          >
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-red)' }} />
              <div className="text-xs text-slate-700">
                <strong style={{ color: 'var(--sfp-red)' }}>Disclaimer:</strong> This calculator provides
                estimates based on 2024 CRA limits and tax brackets. Actual contribution room may differ based
                on your Notice of Assessment. Consult a tax professional for personalized advice.
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Contribution Room Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* TFSA Room */}
            <div className="rounded-xl border border-slate-200 p-5 bg-white card-light hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-xs font-semibold text-slate-600 uppercase">TFSA Room</span>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--sfp-green)' }}>
                {formatCAD(results.tfsaRoom)}
              </div>
              <p className="text-xs text-slate-600">
                of {formatCAD(TFSA_LIFETIME_LIMIT)} lifetime
              </p>
            </div>

            {/* RRSP Room */}
            <div className="rounded-xl border border-slate-200 p-5 bg-white card-light hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs font-semibold text-slate-600 uppercase">RRSP Room</span>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--sfp-navy)' }}>
                {formatCAD(results.rrspRoom)}
              </div>
              <p className="text-xs text-slate-600">
                18% of income, max {formatCAD(RRSP_MAX_ANNUAL)}
              </p>
            </div>

            {/* RRSP Tax Savings */}
            <div className="rounded-xl border border-slate-200 p-5 bg-white card-light hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-xs font-semibold text-slate-600 uppercase">Tax Savings</span>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--sfp-gold)' }}>
                {formatCAD(results.rrspTaxSavings)}
              </div>
              <p className="text-xs text-slate-600">
                from maxing out RRSP
              </p>
            </div>

            {/* FHSA Room */}
            <div className="rounded-xl border border-slate-200 p-5 bg-white card-light hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-5 w-5" style={{ color: results.fhsaEligible ? 'var(--sfp-green)' : '#999' }} />
                <span className="text-xs font-semibold text-slate-600 uppercase">FHSA Room</span>
              </div>
              <div
                className="text-3xl font-bold mb-1"
                style={{ color: results.fhsaEligible ? 'var(--sfp-green)' : '#999' }}
              >
                {results.fhsaEligible ? formatCAD(results.fhsaRoom) : 'N/A'}
              </div>
              <p className="text-xs text-slate-600">
                {results.fhsaEligible ? '$8K per year, max $40K' : 'Age 18-71 required'}
              </p>
            </div>
          </div>

          {/* Recommendation Box */}
          <div
            className="rounded-xl border-2 p-5"
            style={{
              borderColor: 'var(--sfp-gold)',
              backgroundColor: 'var(--sfp-sky)',
            }}
          >
            <h4 className="font-semibold text-slate-900 mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Recommended Strategy
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {results.recommendation}
            </p>
          </div>

          {/* 30-Year Projection */}
          <div className="rounded-xl border border-slate-200 p-5 bg-white card-light">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              <h4 className="font-semibold text-slate-900">30-Year Projection</h4>
            </div>

            {/* Simple Bar Chart */}
            <div className="space-y-4">
              {/* TFSA Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">TFSA</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--sfp-green)' }}>
                    {formatCAD(finalProjection.tfsa)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(finalProjection.tfsa / totalProjected) * 100 || 10}%`,
                      backgroundColor: 'var(--sfp-green)',
                    }}
                  />
                </div>
              </div>

              {/* RRSP Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">RRSP</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--sfp-navy)' }}>
                    {formatCAD(finalProjection.rrsp)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(finalProjection.rrsp / totalProjected) * 100 || 10}%`,
                      backgroundColor: 'var(--sfp-navy)',
                    }}
                  />
                </div>
              </div>

              {/* FHSA Bar */}
              {results.fhsaEligible && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">FHSA</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--sfp-gold)' }}>
                      {formatCAD(finalProjection.fhsa)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(finalProjection.fhsa / totalProjected) * 100 || 10}%`,
                        backgroundColor: 'var(--sfp-gold)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Total Portfolio</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--sfp-navy)' }}>
                    {formatCAD(totalProjected)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  at age {Math.min(age + 30, 95)} with {investmentReturn}% annual return
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="rounded-xl border border-slate-200 p-6 bg-white card-light">
            <h4 className="font-semibold text-slate-900 mb-2">
              Start Tax-Efficient Investing
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              Open a TFSA, RRSP, or FHSA account with Canada's leading investment platforms.
            </p>
            <Button asChild className="w-full hover:shadow-lg transition-shadow">
              <a href="/go/wealthsimple" style={{ backgroundColor: 'var(--sfp-gold)' }}>
                Compare TFSA/RRSP Accounts
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-slate-600 text-center mt-3">
              No account setup fees. Tax-efficient investing platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

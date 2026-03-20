// components/tools/superannuation-calculator.tsx
'use client';

import { useState, useMemo } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  PiggyBank,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface SuperannuationResults {
  finalBalance: number;
  totalContributions: number;
  investmentGrowth: number;
  employerContributions: number;
  employeeContributions: number;
  additionalContributions: number;
  taxBenefit: number;
  annualReturnEstimate: number;
}

interface SuperannuationYear {
  year: number;
  age: number;
  balance: number;
  employerContribution: number;
  employeeContribution: number;
  additionalContribution: number;
  investmentGrowth: number;
}

const PRESERVATION_AGE = 60;
const RETIREMENT_AGE = 67;
const ASSUMED_ANNUAL_RETURN = 0.07; // 7% conservative estimate
const TAX_BENEFIT_RATE = 0.15; // 15% concessional tax rate
const TAX_RATE_WITHOUT_SACRIFICE = 0.45; // 45% top tax rate (including Medicare levy)

export function SuperannuationCalculator() {
  const [currentAge, setCurrentAge] = useState(35);
  const [currentBalance, setCurrentBalance] = useState(150000);
  const [annualSalary, setAnnualSalary] = useState(90000);
  const [contributionRate, setContributionRate] = useState(11.5);
  const [additionalMonthly, setAdditionalMonthly] = useState(0);

  const results: SuperannuationResults = useMemo(() => {
    let balance = currentBalance;
    let totalEmployerContributions = 0;
    let totalEmployeeContributions = 0;
    let totalAdditionalContributions = 0;
    let totalInvestmentGrowth = 0;

    // Project from current age to retirement age
    for (let i = 0; i < RETIREMENT_AGE - currentAge; i++) {
      // Employer contribution (SG = superannuation guarantee)
      const employerContribution = (annualSalary * contributionRate) / 100;
      totalEmployerContributions += employerContribution;

      // Additional contributions (monthly * 12)
      const additionalContribution = additionalMonthly * 12;
      totalAdditionalContributions += additionalContribution;

      // Investment growth on current balance
      const investmentGrowth = balance * ASSUMED_ANNUAL_RETURN;
      totalInvestmentGrowth += investmentGrowth;

      // Update balance
      balance +=
        employerContribution +
        additionalContribution +
        investmentGrowth;

      // Salary increase assumption (2% per year)
      // Note: not modelled as we're using constant salary for simplicity
    }

    // Calculate tax benefit from salary sacrifice
    // If you contribute via salary sacrifice, you pay 15% tax instead of 45%
    const taxBenefit = totalAdditionalContributions * (TAX_RATE_WITHOUT_SACRIFICE - TAX_BENEFIT_RATE);

    // Employee contributions would be from post-tax salary (not modelled separately here)
    // as most superannuation is via employer contribution

    return {
      finalBalance: Math.round(balance * 100) / 100,
      totalContributions: Math.round((totalEmployerContributions + totalAdditionalContributions) * 100) / 100,
      investmentGrowth: Math.round(totalInvestmentGrowth * 100) / 100,
      employerContributions: Math.round(totalEmployerContributions * 100) / 100,
      additionalContributions: Math.round(totalAdditionalContributions * 100) / 100,
      employeeContributions: 0,
      taxBenefit: Math.round(taxBenefit * 100) / 100,
      annualReturnEstimate: ASSUMED_ANNUAL_RETURN * 100,
    };
  }, [currentAge, currentBalance, annualSalary, contributionRate, additionalMonthly]);

  const yearlyProjection: SuperannuationYear[] = useMemo(() => {
    const projection: SuperannuationYear[] = [];
    let balance = currentBalance;

    for (let i = 0; i <= RETIREMENT_AGE - currentAge; i++) {
      const age = currentAge + i;
      const employerContribution = (annualSalary * contributionRate) / 100;
      const additionalContribution = additionalMonthly * 12;
      const investmentGrowth = balance * ASSUMED_ANNUAL_RETURN;

      balance +=
        employerContribution +
        additionalContribution +
        investmentGrowth;

      projection.push({
        year: i,
        age,
        balance: Math.round(balance * 100) / 100,
        employerContribution,
        employeeContribution: 0,
        additionalContribution,
        investmentGrowth: Math.round(investmentGrowth * 100) / 100,
      });
    }

    return projection;
  }, [currentAge, currentBalance, annualSalary, contributionRate, additionalMonthly]);

  // Color-coded status based on final balance
  const balanceStatus = useMemo(() => {
    const finalBal = results.finalBalance;
    if (finalBal > 500000) {
      return { color: 'var(--sfp-green)', label: 'Comfortable Retirement' };
    } else if (finalBal > 200000) {
      return { color: 'var(--sfp-gold)', label: 'Moderate Retirement' };
    } else {
      return { color: 'var(--sfp-red)', label: 'Below Target' };
    }
  }, [results.finalBalance]);

  const yearsToPreservation = Math.max(0, PRESERVATION_AGE - currentAge);
  const yearsToRetirement = RETIREMENT_AGE - currentAge;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3
              className="text-lg font-semibold mb-6 flex items-center gap-2"
              style={{ color: 'var(--sfp-navy)' }}
            >
              <PiggyBank className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
              Superannuation Details
            </h3>

            {/* Current Age */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: 'var(--sfp-ink)' }}
                >
                  <Calendar className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Current Age
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {currentAge} years
                </span>
              </div>
              <Slider
                value={[currentAge]}
                onValueChange={(value) => setCurrentAge(value[0])}
                min={18}
                max={67}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>18</span>
                <span>42 (Mid-career)</span>
                <span>67</span>
              </div>
            </div>

            {/* Current Super Balance */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: 'var(--sfp-ink)' }}
                >
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Current Superannuation Balance
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  A${currentBalance.toLocaleString('en-AU')}
                </span>
              </div>
              <Slider
                value={[currentBalance]}
                onValueChange={(value) => setCurrentBalance(value[0])}
                min={0}
                max={1000000}
                step={10000}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>A$0</span>
                <span>A$500,000</span>
                <span>A$1,000,000</span>
              </div>
            </div>

            {/* Annual Salary */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: 'var(--sfp-ink)' }}
                >
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Annual Salary (Gross)
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  A${annualSalary.toLocaleString('en-AU')}
                </span>
              </div>
              <Slider
                value={[annualSalary]}
                onValueChange={(value) => setAnnualSalary(value[0])}
                min={20000}
                max={250000}
                step={5000}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>A$20,000</span>
                <span>A$135,000</span>
                <span>A$250,000</span>
              </div>
            </div>

            {/* Contribution Rate */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: 'var(--sfp-ink)' }}
                >
                  <Percent className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Contribution Rate
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {contributionRate}%
                </span>
              </div>
              <Slider
                value={[contributionRate]}
                onValueChange={(value) => setContributionRate(value[0])}
                min={9.5}
                max={15}
                step={0.5}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>9.5% (SG)</span>
                <span>11.5% (Current)</span>
                <span>15%</span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--sfp-slate)' }}>
                SG (Superannuation Guarantee) is 11.5% from July 2024, increasing to 12% by 2025.
              </p>
            </div>

            {/* Additional Monthly Contributions */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: 'var(--sfp-ink)' }}
                >
                  <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Additional Monthly Contribution
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  A${additionalMonthly.toLocaleString('en-AU')}
                </span>
              </div>
              <Slider
                value={[additionalMonthly]}
                onValueChange={(value) => setAdditionalMonthly(value[0])}
                min={0}
                max={5000}
                step={100}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>A$0</span>
                <span>A$2,500</span>
                <span>A$5,000</span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--sfp-slate)' }}>
                Salary sacrifice contributions can reduce your taxable income. Annual concessional
                contribution limit: A$27,500 (2024-25).
              </p>
            </div>
          </div>

          {/* Super Tips */}
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
          >
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Superannuation Tips
            </h4>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--sfp-ink)' }}>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span>
                  Salary sacrifice to reduce taxable income and boost retirement savings
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span>
                  Reach preservation age (60) to access your super
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span>
                  Review your investment strategy regularly for optimal growth
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Final Balance Highlight */}
          <LazyMotion features={domAnimation}>
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-6 text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-medium">Balance at Age {RETIREMENT_AGE}</span>
              </div>
              <div className="text-5xl font-bold mb-2">
                A${results.finalBalance.toLocaleString('en-AU')}
              </div>
              <p className="text-sm opacity-90">
                Status: <span style={{ color: balanceStatus.color }}>{balanceStatus.label}</span>
              </p>
            </m.div>
          </LazyMotion>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Employer Contributions</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-navy)' }}>
                A${results.employerContributions.toLocaleString('en-AU')}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Your Contributions</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-gold)' }}>
                A${results.additionalContributions.toLocaleString('en-AU')}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Investment Growth</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-green)' }}>
                A${results.investmentGrowth.toLocaleString('en-AU')}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Tax Benefit</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-green)' }}>
                A${results.taxBenefit.toLocaleString('en-AU')}
              </div>
            </div>
          </div>

          {/* Preservation Age Alert */}
          {yearsToPreservation > 0 && (
            <LazyMotion features={domAnimation}>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border-l-4 bg-white p-4 shadow-sm"
                style={{ borderLeftColor: 'var(--sfp-gold)' }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
                  <div>
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--sfp-navy)' }}>
                      Preservation Age
                    </h4>
                    <p className="text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                      You can access your super in {yearsToPreservation} year{yearsToPreservation !== 1 ? 's' : ''} at age {PRESERVATION_AGE}
                      (preservation age). Before then, your super remains locked away.
                    </p>
                  </div>
                </div>
              </m.div>
            </LazyMotion>
          )}

          {/* Contribution Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--sfp-ink)' }}>
              Balance Breakdown at Age {RETIREMENT_AGE}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--sfp-slate)' }}>Starting Balance</span>
                <span className="font-medium" style={{ color: 'var(--sfp-navy)' }}>
                  A${currentBalance.toLocaleString('en-AU')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--sfp-slate)' }}>Contributions (Total)</span>
                <span className="font-medium" style={{ color: 'var(--sfp-gold)' }}>
                  +A${results.totalContributions.toLocaleString('en-AU')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--sfp-slate)' }}>Investment Growth</span>
                <span className="font-medium" style={{ color: 'var(--sfp-green)' }}>
                  +A${results.investmentGrowth.toLocaleString('en-AU')}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>Final Balance</span>
                <span className="text-sm font-bold" style={{ color: balanceStatus.color }}>
                  A${results.finalBalance.toLocaleString('en-AU')}
                </span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-4 h-3 rounded-full overflow-hidden flex bg-gray-100">
              <div
                style={{
                  width: `${(currentBalance / results.finalBalance) * 100}%`,
                  background: 'var(--sfp-navy)',
                }}
              />
              <div
                style={{
                  width: `${(results.totalContributions / results.finalBalance) * 100}%`,
                  background: 'var(--sfp-gold)',
                }}
              />
              <div
                style={{
                  width: `${(results.investmentGrowth / results.finalBalance) * 100}%`,
                  background: 'var(--sfp-green)',
                }}
              />
            </div>
            <div className="flex justify-between gap-2 text-xs mt-2 flex-wrap" style={{ color: 'var(--sfp-slate)' }}>
              <span>
                Start ({Math.round((currentBalance / results.finalBalance) * 100)}%)
              </span>
              <span>
                Contributions ({Math.round((results.totalContributions / results.finalBalance) * 100)}%)
              </span>
              <span>
                Growth ({Math.round((results.investmentGrowth / results.finalBalance) * 100)}%)
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Optimise Your Superannuation
            </h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Review your super fund's performance and find ways to maximise growth through
              better investment strategy and salary sacrifice.
            </p>
            <Button asChild variant="gold" className="w-full">
              <a href="/go/australiansuper" target="_blank" rel="noopener noreferrer">
                Explore Australian Super
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Find the right super fund for your needs
            </p>
          </div>
        </div>
      </div>

      {/* Yearly Projection Table */}
      <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sfp-navy)' }}>
          Year-by-Year Projection
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>
                  Age
                </th>
                <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>
                  Super Balance
                </th>
                <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>
                  Employer Contrib
                </th>
                <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>
                  Your Contrib
                </th>
                <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>
                  Growth
                </th>
              </tr>
            </thead>
            <tbody>
              {yearlyProjection
                .filter((_, idx) => idx % 5 === 0 || idx === yearlyProjection.length - 1) // Show every 5 years + final
                .map((row) => (
                  <tr key={row.age} className="border-b border-gray-100">
                    <td className="py-2 px-2" style={{ color: 'var(--sfp-ink)' }}>
                      {row.age}
                    </td>
                    <td className="py-2 px-2 text-right font-medium" style={{ color: 'var(--sfp-navy)' }}>
                      A${row.balance.toLocaleString('en-AU')}
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-slate)' }}>
                      A${row.employerContribution.toLocaleString('en-AU', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-gold)' }}>
                      A${row.additionalContribution.toLocaleString('en-AU', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-green)' }}>
                      A${row.investmentGrowth.toLocaleString('en-AU', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-4" style={{ color: 'var(--sfp-slate)' }}>
          Assumptions: 7% annual investment return, no salary growth, current contribution rates. Actual results may vary.
          This is not financial advice. Consult a financial adviser before making decisions.
        </p>
      </m.div>
      </LazyMotion>
    </div>
  );
}

// components/tools/remortgage-calculator.tsx
'use client';

import { useState, useMemo } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import {
  Calculator,
  Percent,
  Calendar,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Home,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface RemortgageResults {
  currentMonthlyPayment: number;
  newMonthlyPayment: number;
  monthlySavings: number;
  annualSavings: number;
  totalSavings: number;
  breakEvenMonths: number;
  breakEvenDate: string;
  newPayoffDate: string;
}

export function RemortgageCalculator() {
  const [outstandingBalance, setOutstandingBalance] = useState(200000);
  const [currentRate, setCurrentRate] = useState(5.5);
  const [newRate, setNewRate] = useState(3.75);
  const [remainingTerm, setRemainingTerm] = useState(240); // 20 years in months
  const [remortgageFees, setRemortgageFees] = useState(2000);

  const results: RemortgageResults = useMemo(() => {
    // Current mortgage calculation
    const currentMonthlyRate = currentRate / 100 / 12;
    const currentMonthlyPayment =
      (outstandingBalance *
        (currentMonthlyRate * Math.pow(1 + currentMonthlyRate, remainingTerm))) /
      (Math.pow(1 + currentMonthlyRate, remainingTerm) - 1);

    // New mortgage calculation
    const newMonthlyRate = newRate / 100 / 12;
    const newMonthlyPayment =
      (outstandingBalance *
        (newMonthlyRate * Math.pow(1 + newMonthlyRate, remainingTerm))) /
      (Math.pow(1 + newMonthlyRate, remainingTerm) - 1);

    const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
    const annualSavings = monthlySavings * 12;
    const totalSavings = monthlySavings * remainingTerm - remortgageFees;

    // Break-even calculation (months to recover fees)
    const breakEvenMonths = Math.ceil(remortgageFees / monthlySavings);
    const breakEvenDate = new Date();
    breakEvenDate.setMonth(breakEvenDate.getMonth() + breakEvenMonths);

    const newPayoffDate = new Date();
    newPayoffDate.setMonth(newPayoffDate.getMonth() + remainingTerm);

    return {
      currentMonthlyPayment: Math.round(currentMonthlyPayment * 100) / 100,
      newMonthlyPayment: Math.round(newMonthlyPayment * 100) / 100,
      monthlySavings: Math.round(monthlySavings * 100) / 100,
      annualSavings: Math.round(annualSavings * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      breakEvenMonths,
      breakEvenDate: breakEvenDate.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      }),
      newPayoffDate: newPayoffDate.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      }),
    };
  }, [outstandingBalance, currentRate, newRate, remainingTerm, remortgageFees]);

  const remainingYears = Math.floor(remainingTerm / 12);
  const remainingMonths = remainingTerm % 12;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-navy)' }}>
              <Calculator className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
              Mortgage Details
            </h3>

            {/* Outstanding Balance */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <Home className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Outstanding Balance
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  £{outstandingBalance.toLocaleString('en-GB')}
                </span>
              </div>
              <Slider
                value={[outstandingBalance]}
                onValueChange={(value) => setOutstandingBalance(value[0])}
                min={50000}
                max={1000000}
                step={5000}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>£50K</span>
                <span>£500K</span>
                <span>£1M</span>
              </div>
            </div>

            {/* Current Interest Rate */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <Percent className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Current Interest Rate
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {currentRate}%
                </span>
              </div>
              <Slider
                value={[currentRate]}
                onValueChange={(value) => setCurrentRate(value[0])}
                min={2}
                max={8}
                step={0.05}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>2%</span>
                <span>5%</span>
                <span>8%</span>
              </div>
            </div>

            {/* New Interest Rate */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                  New Interest Rate
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: '#dcfce7', color: 'var(--sfp-green)' }}
                >
                  {newRate}%
                </span>
              </div>
              <Slider
                value={[newRate]}
                onValueChange={(value) => setNewRate(value[0])}
                min={1.5}
                max={7}
                step={0.05}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>1.5%</span>
                <span>4%</span>
                <span>7%</span>
              </div>
            </div>

            {/* Remaining Term */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <Calendar className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Remaining Term
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {remainingYears}y {remainingMonths}m
                </span>
              </div>
              <Slider
                value={[remainingTerm]}
                onValueChange={(value) => setRemainingTerm(value[0])}
                min={12}
                max={360}
                step={12}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>1 year</span>
                <span>15 years</span>
                <span>30 years</span>
              </div>
            </div>

            {/* Remortgage Fees */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Remortgage Fees
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  £{remortgageFees.toLocaleString('en-GB')}
                </span>
              </div>
              <Slider
                value={[remortgageFees]}
                onValueChange={(value) => setRemortgageFees(value[0])}
                min={0}
                max={5000}
                step={100}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>£0</span>
                <span>£2,500</span>
                <span>£5,000</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
          >
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              When to Remortgage
            </h4>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--sfp-ink)' }}>
              <li>✓ Your fixed rate is ending soon</li>
              <li>✓ You can secure a rate 0.5%+ lower</li>
              <li>✓ You want to switch from SVR to fixed</li>
              <li>✓ You need to borrow more (equity release)</li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Monthly Savings Highlight */}
          <LazyMotion features={domAnimation}>
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-6 text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--sfp-green) 0%, var(--sfp-navy) 100%)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5" />
                <span className="text-sm font-medium">Monthly Savings</span>
              </div>
              <div className="text-5xl font-bold mb-2">
                £{results.monthlySavings.toLocaleString('en-GB')}
              </div>
              <p className="text-sm opacity-90">
                £{results.annualSavings.toLocaleString('en-GB')} per year
              </p>
            </m.div>
          </LazyMotion>

          {/* Comparison Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs mb-2" style={{ color: 'var(--sfp-slate)' }}>Current Payment</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-red)' }}>
                £{results.currentMonthlyPayment.toLocaleString('en-GB')}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                at {currentRate}% APR
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs mb-2" style={{ color: 'var(--sfp-slate)' }}>New Payment</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-green)' }}>
                £{results.newMonthlyPayment.toLocaleString('en-GB')}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                at {newRate}% APR
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs mb-2" style={{ color: 'var(--sfp-slate)' }}>Break-Even Point</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-navy)' }}>
                {results.breakEvenMonths} mo
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                {results.breakEvenDate}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs mb-2" style={{ color: 'var(--sfp-slate)' }}>Total Savings</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-green)' }}>
                £{Math.abs(results.totalSavings).toLocaleString('en-GB')}
              </div>
              <div className="text-xs mt-1" style={{ color: results.totalSavings > 0 ? 'var(--sfp-green)' : 'var(--sfp-red)' }}>
                {results.totalSavings > 0 ? 'Net savings' : 'Including fees'}
              </div>
            </div>
          </div>

          {/* Savings Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--sfp-ink)' }}>
              5-Year Savings Projection
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--sfp-slate)' }}>Monthly savings</span>
                <span className="font-medium" style={{ color: 'var(--sfp-green)' }}>
                  £{results.monthlySavings.toLocaleString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--sfp-slate)' }}>Annual savings</span>
                <span className="font-medium" style={{ color: 'var(--sfp-green)' }}>
                  £{results.annualSavings.toLocaleString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--sfp-slate)' }}>5-year savings</span>
                <span className="font-medium" style={{ color: 'var(--sfp-green)' }}>
                  £{(results.annualSavings * 5).toLocaleString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--sfp-slate)' }}>Remortgage fees</span>
                <span className="font-medium" style={{ color: 'var(--sfp-red)' }}>
                  -£{remortgageFees.toLocaleString('en-GB')}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  Net 5-year benefit
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--sfp-green)' }}>
                  £{((results.annualSavings * 5) - remortgageFees).toLocaleString('en-GB')}
                </span>
              </div>
            </div>

            {/* Visual breakdown */}
            <div className="mt-4 h-3 rounded-full overflow-hidden bg-gray-100">
              <div
                style={{
                  width: `${Math.min(100, (results.breakEvenMonths / 60) * 100)}%`,
                  background: 'var(--sfp-red)',
                }}
              />
              <div
                style={{
                  width: `${Math.max(0, 100 - (results.breakEvenMonths / 60) * 100)}%`,
                  background: 'var(--sfp-green)',
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
              <span>Paying back fees</span>
              <span>Saving money</span>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Compare Remortgage Rates
            </h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Get personalised remortgage quotes from UK's top lenders. Free service, no obligation.
            </p>
            <Button
              asChild
              variant="gold"
              className="w-full"
            >
              <a href="/go/habito" target="_blank" rel="noopener noreferrer">
                Compare Remortgage Deals
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              FCA authorised. Whole-of-market. Free advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

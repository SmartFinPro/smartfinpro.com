// components/tools/debt-payoff-calculator.tsx
'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  Percent,
  Calendar,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface DebtPayoffResults {
  monthsToPayoff: number;
  totalInterest: number;
  totalPaid: number;
  payoffDate: string;
  monthlySavings: number;
  interestSavings: number;
}

interface PaymentScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  percentPaid: number;
}

export function DebtPayoffCalculator() {
  const [debtBalance, setDebtBalance] = useState(10000);
  const [interestRate, setInterestRate] = useState(18.99);
  const [monthlyPayment, setMonthlyPayment] = useState(300);
  const [showSchedule, setShowSchedule] = useState(false);

  const minPayment = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    return Math.ceil((debtBalance * monthlyRate) + 10);
  }, [debtBalance, interestRate]);

  const results: DebtPayoffResults = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    let balance = debtBalance;
    let months = 0;
    let totalInterest = 0;
    const maxMonths = 360; // 30 years max

    // Calculate payoff
    while (balance > 0 && months < maxMonths) {
      const interest = balance * monthlyRate;
      const principal = Math.min(monthlyPayment - interest, balance);

      if (principal <= 0) break; // Payment too small

      totalInterest += interest;
      balance -= principal;
      months++;
    }

    const totalPaid = debtBalance + totalInterest;
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);

    // Calculate comparison with minimum payment (2% of balance)
    const minMonthlyPayment = Math.max(minPayment, 50);
    let minBalance = debtBalance;
    let minMonths = 0;
    let minTotalInterest = 0;

    while (minBalance > 0 && minMonths < maxMonths) {
      const interest = minBalance * monthlyRate;
      const principal = Math.min(minMonthlyPayment - interest, minBalance);

      if (principal <= 0) break;

      minTotalInterest += interest;
      minBalance -= principal;
      minMonths++;
    }

    return {
      monthsToPayoff: months,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      payoffDate: payoffDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      monthlySavings: minMonths - months,
      interestSavings: Math.round((minTotalInterest - totalInterest) * 100) / 100,
    };
  }, [debtBalance, interestRate, monthlyPayment, minPayment]);

  const paymentSchedule: PaymentScheduleRow[] = useMemo(() => {
    const schedule: PaymentScheduleRow[] = [];
    const monthlyRate = interestRate / 100 / 12;
    let balance = debtBalance;
    let month = 1;

    while (balance > 0 && month <= results.monthsToPayoff) {
      const interest = balance * monthlyRate;
      const principal = Math.min(monthlyPayment - interest, balance);
      balance = Math.max(0, balance - principal);
      const percentPaid = ((debtBalance - balance) / debtBalance) * 100;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        percentPaid: Math.round(percentPaid * 10) / 10,
      });

      month++;
    }

    return schedule;
  }, [debtBalance, interestRate, monthlyPayment, results.monthsToPayoff]);

  const years = Math.floor(results.monthsToPayoff / 12);
  const months = results.monthsToPayoff % 12;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-navy)' }}>
              <Calculator className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
              Debt Details
            </h3>

            {/* Debt Balance */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Total Debt Balance
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  ${debtBalance.toLocaleString('en-US')}
                </span>
              </div>
              <Slider
                value={[debtBalance]}
                onValueChange={(value) => setDebtBalance(value[0])}
                min={1000}
                max={100000}
                step={500}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>$1,000</span>
                <span>$50,000</span>
                <span>$100,000</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <Percent className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Interest Rate (APR)
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  {interestRate}%
                </span>
              </div>
              <Slider
                value={[interestRate]}
                onValueChange={(value) => setInterestRate(value[0])}
                min={5.99}
                max={35.99}
                step={0.25}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>5.99%</span>
                <span>20%</span>
                <span>35.99%</span>
              </div>
            </div>

            {/* Monthly Payment */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
                  <Calendar className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Monthly Payment
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}
                >
                  ${monthlyPayment.toLocaleString('en-US')}
                </span>
              </div>
              <Slider
                value={[monthlyPayment]}
                onValueChange={(value) => setMonthlyPayment(value[0])}
                min={minPayment}
                max={Math.min(debtBalance, 5000)}
                step={10}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>Min: ${minPayment}</span>
                <span>Max: ${Math.min(debtBalance, 5000).toLocaleString()}</span>
              </div>
              {monthlyPayment < minPayment + 50 && (
                <div className="mt-2 flex items-start gap-2 text-xs" style={{ color: 'var(--sfp-red)' }}>
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Payment is close to minimum. Consider increasing to save on interest.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'var(--sfp-sky)', borderColor: 'var(--sfp-navy)' }}
          >
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Debt Payoff Tips
            </h4>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--sfp-ink)' }}>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span>Pay more than the minimum to reduce interest costs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span>Consider debt consolidation for lower interest rates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <span>Use the avalanche method: highest interest rate first</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Payoff Timeline Highlight */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl p-6 text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--sfp-navy) 0%, var(--sfp-gold) 100%)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">Time to Debt Freedom</span>
            </div>
            <div className="text-5xl font-bold mb-2">
              {years > 0 && `${years}y `}
              {months > 0 && `${months}m`}
            </div>
            <p className="text-sm opacity-90">
              Debt-free by {results.payoffDate}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4" style={{ color: 'var(--sfp-red)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Total Interest</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-red)' }}>
                ${results.totalInterest.toLocaleString('en-US')}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Total Paid</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                ${results.totalPaid.toLocaleString('en-US')}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Months Saved</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-green)' }}>
                {results.monthlySavings > 0 ? results.monthlySavings : '—'}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Interest Saved</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-green)' }}>
                {results.interestSavings > 0 ? `$${results.interestSavings.toLocaleString()}` : '—'}
              </div>
            </div>
          </div>

          {/* Progress Visualization */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--sfp-ink)' }}>
              Payment Breakdown
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--sfp-slate)' }}>Principal</span>
                <span className="font-medium" style={{ color: 'var(--sfp-navy)' }}>
                  ${debtBalance.toLocaleString('en-US')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--sfp-slate)' }}>Interest</span>
                <span className="font-medium" style={{ color: 'var(--sfp-red)' }}>
                  +${results.totalInterest.toLocaleString('en-US')}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>Total</span>
                <span className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  ${results.totalPaid.toLocaleString('en-US')}
                </span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-4 h-3 rounded-full overflow-hidden flex bg-gray-100">
              <div
                style={{
                  width: `${(debtBalance / results.totalPaid) * 100}%`,
                  background: 'var(--sfp-navy)',
                }}
              />
              <div
                style={{
                  width: `${(results.totalInterest / results.totalPaid) * 100}%`,
                  background: 'var(--sfp-red)',
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
              <span>Principal ({Math.round((debtBalance / results.totalPaid) * 100)}%)</span>
              <span>Interest ({Math.round((results.totalInterest / results.totalPaid) * 100)}%)</span>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-navy)' }}>
              Lower Your Interest Rate
            </h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Consolidate debt at a lower rate and pay off faster. Check your rate in 2 minutes with no credit impact.
            </p>
            <Button
              asChild
              variant="gold"
              className="w-full"
            >
              <a href="/go/national-debt-relief" target="_blank" rel="noopener noreferrer">
                Get Free Debt Relief Quote
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Free consultation. No obligation.
            </p>
          </div>

          {/* Schedule Toggle */}
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="w-full text-sm font-medium flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--sfp-navy)' }}
          >
            <Calculator className="h-4 w-4" />
            {showSchedule ? 'Hide' : 'Show'} Payment Schedule
          </button>
        </div>
      </div>

      {/* Payment Schedule Table */}
      {showSchedule && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sfp-navy)' }}>
            Payment Schedule
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>Month</th>
                  <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>Payment</th>
                  <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>Principal</th>
                  <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>Interest</th>
                  <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>Balance</th>
                  <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--sfp-slate)' }}>% Paid</th>
                </tr>
              </thead>
              <tbody>
                {paymentSchedule.slice(0, 12).map((row) => (
                  <tr key={row.month} className="border-b border-gray-100">
                    <td className="py-2 px-2" style={{ color: 'var(--sfp-slate)' }}>{row.month}</td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-ink)' }}>
                      ${row.payment.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-navy)' }}>
                      ${row.principal.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-red)' }}>
                      ${row.interest.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right font-medium" style={{ color: 'var(--sfp-ink)' }}>
                      ${row.balance.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-green)' }}>
                      {row.percentPaid.toFixed(1)}%
                    </td>
                  </tr>
                ))}
                {results.monthsToPayoff > 12 && (
                  <tr>
                    <td colSpan={6} className="py-3 text-center text-xs" style={{ color: 'var(--sfp-slate)' }}>
                      ... {results.monthsToPayoff - 12} more months to payoff ...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

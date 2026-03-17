'use client';

import { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  Percent,
  Calendar,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface LoanResults {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  effectiveRate: number;
  payoffDate: string;
}

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

const LOAN_TYPES = [
  { name: 'Personal Loan', minRate: 6.99, maxRate: 35.99, defaultRate: 12 },
  { name: 'Debt Consolidation', minRate: 5.99, maxRate: 29.99, defaultRate: 10 },
  { name: 'Home Improvement', minRate: 6.49, maxRate: 24.99, defaultRate: 9 },
  { name: 'Emergency Loan', minRate: 8.99, maxRate: 35.99, defaultRate: 18 },
];

export function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState(15000);
  const [interestRate, setInterestRate] = useState(12);
  const [loanTerm, setLoanTerm] = useState(36);
  const [selectedType, setSelectedType] = useState(LOAN_TYPES[0]);
  const [showAmortization, setShowAmortization] = useState(false);

  const results: LoanResults = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm;

    const monthlyPayment = monthlyRate > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments;

    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - loanAmount;

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + loanTerm);
    const payoffDateStr = payoffDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      effectiveRate: interestRate,
      payoffDate: payoffDateStr,
    };
  }, [loanAmount, interestRate, loanTerm]);

  const amortizationSchedule: AmortizationRow[] = useMemo(() => {
    const schedule: AmortizationRow[] = [];
    const monthlyRate = interestRate / 100 / 12;
    let balance = loanAmount;

    for (let month = 1; month <= loanTerm; month++) {
      const interest = balance * monthlyRate;
      const principal = results.monthlyPayment - interest;
      balance = Math.max(0, balance - principal);

      schedule.push({
        month,
        payment: results.monthlyPayment,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      });
    }

    return schedule;
  }, [loanAmount, interestRate, loanTerm, results.monthlyPayment]);

  const handleTypeChange = (type: typeof LOAN_TYPES[0]) => {
    setSelectedType(type);
    setInterestRate(type.defaultRate);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
              <Calculator className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              Loan Details
            </h3>

            {/* Loan Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>
                Loan Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LOAN_TYPES.map((type) => (
                  <button
                    key={type.name}
                    onClick={() => handleTypeChange(type)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedType.name === type.name
                        ? 'border-gray-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={selectedType.name === type.name ? { borderColor: 'var(--sfp-navy)', background: 'rgba(27,79,140,0.1)' } : { background: 'white' }}
                  >
                    <span className="text-sm font-medium" style={{ color: selectedType.name === type.name ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}>{type.name}</span>
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                      {type.minRate}% - {type.maxRate}% APR
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Amount */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Loan Amount
                </label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}>
                  ${loanAmount.toLocaleString('en-US')}
                </span>
              </div>
              <Slider
                value={[loanAmount]}
                onValueChange={(value) => setLoanAmount(value[0])}
                min={1000}
                max={100000}
                step={500}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>$1,000</span>
                <span>$50,000</span>
                <span>$100,000</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Percent className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Interest Rate (APR)
                </label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}>
                  {interestRate}%
                </span>
              </div>
              <Slider
                value={[interestRate]}
                onValueChange={(value) => setInterestRate(value[0])}
                min={selectedType.minRate}
                max={selectedType.maxRate}
                step={0.25}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>{selectedType.minRate}%</span>
                <span>{((selectedType.maxRate + selectedType.minRate) / 2).toFixed(1)}%</span>
                <span>{selectedType.maxRate}%</span>
              </div>
            </div>

            {/* Loan Term */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Calendar className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Loan Term
                </label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}>
                  {loanTerm} months ({Math.floor(loanTerm / 12)}y {loanTerm % 12}m)
                </span>
              </div>
              <Slider
                value={[loanTerm]}
                onValueChange={(value) => setLoanTerm(value[0])}
                min={12}
                max={84}
                step={6}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>12 mo</span>
                <span>48 mo</span>
                <span>84 mo</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl p-4 border border-amber-200" style={{ background: 'rgba(245,158,11,0.05)' }}>
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                <strong style={{ color: 'var(--sfp-gold)' }}>Loan Disclaimer:</strong> This calculator provides estimates only.
                Actual rates, terms, and approval depend on your credit profile and the lender.
                SmartFinPro is not a lender. Representative APR ranges from {selectedType.minRate}% to {selectedType.maxRate}%.
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Monthly Payment Highlight */}
          <div className="rounded-2xl p-6 text-white" style={{ background: 'var(--sfp-navy)' }}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="text-sm font-medium text-white/80">Monthly Payment</span>
            </div>
            <div className="text-5xl font-bold mb-2">
              ${results.monthlyPayment.toLocaleString('en-US')}
            </div>
            <p className="text-sm text-white/80">
              Paid off by {results.payoffDate}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Total Repayment</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                ${results.totalPayment.toLocaleString('en-US')}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4" style={{ color: 'var(--sfp-red)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Total Interest</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-red)' }}>
                ${results.totalInterest.toLocaleString('en-US')}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>APR</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {interestRate}%
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Loan Term</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {loanTerm} mo
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>Cost Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Principal</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  ${loanAmount.toLocaleString('en-US')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Interest</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-red)' }}>
                  +${results.totalInterest.toLocaleString('en-US')}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>Total</span>
                <span className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  ${results.totalPayment.toLocaleString('en-US')}
                </span>
              </div>
            </div>

            {/* Visual breakdown */}
            <div className="mt-4 h-3 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(loanAmount / results.totalPayment) * 100}%`, background: 'var(--sfp-navy)' }}
              />
              <div
                style={{ width: `${(results.totalInterest / results.totalPayment) * 100}%`, background: 'var(--sfp-red)' }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
              <span>Principal ({Math.round((loanAmount / results.totalPayment) * 100)}%)</span>
              <span>Interest ({Math.round((results.totalInterest / results.totalPayment) * 100)}%)</span>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>
              Compare rates from 23+ lenders
            </h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Check your rate in minutes without affecting your credit score.
              97% of applicants receive at least one offer.
            </p>
            <Button asChild className="w-full text-white hover:opacity-90" style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}>
              <a href="/go/lending-tree" target="_blank" rel="noopener noreferrer">
                Compare Personal Loan Rates
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Free to use. No obligation to accept.
            </p>
          </div>

          {/* Amortization Toggle */}
          <button
            onClick={() => setShowAmortization(!showAmortization)}
            className="w-full text-sm font-medium flex items-center justify-center gap-2 hover:opacity-80"
            style={{ color: 'var(--sfp-navy)' }}
          >
            <Info className="h-4 w-4" />
            {showAmortization ? 'Hide' : 'Show'} Amortization Schedule
          </button>
        </div>
      </div>

      {/* Amortization Schedule */}
      {showAmortization && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sfp-ink)' }}>
            Amortization Schedule
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
                </tr>
              </thead>
              <tbody>
                {amortizationSchedule.slice(0, 12).map((row) => (
                  <tr key={row.month} className="border-b border-gray-100">
                    <td className="py-2 px-2" style={{ color: 'var(--sfp-slate)' }}>{row.month}</td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-ink)' }}>${row.payment.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-navy)' }}>${row.principal.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-red)' }}>${row.interest.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-ink)' }}>${row.balance.toFixed(2)}</td>
                  </tr>
                ))}
                {loanTerm > 12 && (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-xs" style={{ color: 'var(--sfp-slate)' }}>
                      ... {loanTerm - 12} more months ...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

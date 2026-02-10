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
          <div className="rounded-2xl border border-slate-700/40 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-violet-400" />
              Loan Details
            </h3>

            {/* Loan Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Loan Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LOAN_TYPES.map((type) => (
                  <button
                    key={type.name}
                    onClick={() => handleTypeChange(type)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedType.name === type.name
                        ? 'border-violet-400 bg-violet-400/10'
                        : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                    style={selectedType.name !== type.name ? { background: 'rgba(255,255,255,0.02)' } : undefined}
                  >
                    <span className={`text-sm font-medium ${selectedType.name === type.name ? 'text-white' : 'text-slate-300'}`}>{type.name}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      {type.minRate}% - {type.maxRate}% APR
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Amount */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  Loan Amount
                </label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
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
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Percent className="h-4 w-4 text-slate-500" />
                  Interest Rate (APR)
                </label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
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
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  Loan Term
                </label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
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
          <div className="rounded-xl p-4 border border-amber-500/20" style={{ background: 'rgba(245,158,11,0.05)' }}>
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-500">
                <strong className="text-amber-400">Loan Disclaimer:</strong> This calculator provides estimates only.
                Actual rates, terms, and approval depend on your credit profile and the lender.
                SmartFinPro is not a lender. Representative APR ranges from {selectedType.minRate}% to {selectedType.maxRate}%.
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Monthly Payment Highlight */}
          <div className="bg-gradient-to-br from-violet-500 to-teal-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="text-sm font-medium text-violet-100">Monthly Payment</span>
            </div>
            <div className="text-5xl font-bold mb-2">
              ${results.monthlyPayment.toLocaleString('en-US')}
            </div>
            <p className="text-sm text-violet-100">
              Paid off by {results.payoffDate}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-700/40 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-cyan-400" />
                <span className="text-xs text-slate-500">Total Repayment</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${results.totalPayment.toLocaleString('en-US')}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/40 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-xs text-slate-500">Total Interest</span>
              </div>
              <div className="text-2xl font-bold text-red-400">
                ${results.totalInterest.toLocaleString('en-US')}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/40 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-violet-400" />
                <span className="text-xs text-slate-500">APR</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {interestRate}%
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/40 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-slate-500">Loan Term</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loanTerm} mo
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="rounded-xl border border-slate-700/40 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h4 className="text-sm font-medium text-slate-300 mb-3">Cost Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Principal</span>
                <span className="text-sm font-medium text-white">
                  ${loanAmount.toLocaleString('en-US')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Interest</span>
                <span className="text-sm font-medium text-red-400">
                  +${results.totalInterest.toLocaleString('en-US')}
                </span>
              </div>
              <div className="border-t border-slate-700/40 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">Total</span>
                <span className="text-sm font-bold text-white">
                  ${results.totalPayment.toLocaleString('en-US')}
                </span>
              </div>
            </div>

            {/* Visual breakdown */}
            <div className="mt-4 h-3 rounded-full overflow-hidden flex">
              <div
                className="bg-violet-500"
                style={{ width: `${(loanAmount / results.totalPayment) * 100}%` }}
              />
              <div
                className="bg-red-400"
                style={{ width: `${(results.totalInterest / results.totalPayment) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Principal ({Math.round((loanAmount / results.totalPayment) * 100)}%)</span>
              <span>Interest ({Math.round((results.totalInterest / results.totalPayment) * 100)}%)</span>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-slate-700/40 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h4 className="font-semibold text-white mb-2">
              Compare rates from 23+ lenders
            </h4>
            <p className="text-sm text-slate-400 mb-4">
              Check your rate in minutes without affecting your credit score.
              97% of applicants receive at least one offer.
            </p>
            <Button asChild className="w-full bg-violet-500 hover:bg-emerald-600">
              <a href="/go/lending-tree" target="_blank" rel="noopener noreferrer">
                Compare Personal Loan Rates
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-slate-500 text-center mt-3">
              Free to use. No obligation to accept.
            </p>
          </div>

          {/* Amortization Toggle */}
          <button
            onClick={() => setShowAmortization(!showAmortization)}
            className="w-full text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center justify-center gap-2"
          >
            <Info className="h-4 w-4" />
            {showAmortization ? 'Hide' : 'Show'} Amortization Schedule
          </button>
        </div>
      </div>

      {/* Amortization Schedule */}
      {showAmortization && (
        <div className="mt-8 rounded-2xl border border-slate-700/40 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 className="text-lg font-semibold text-white mb-4">
            Amortization Schedule
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/40">
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Month</th>
                  <th className="text-right py-3 px-2 text-slate-500 font-medium">Payment</th>
                  <th className="text-right py-3 px-2 text-slate-500 font-medium">Principal</th>
                  <th className="text-right py-3 px-2 text-slate-500 font-medium">Interest</th>
                  <th className="text-right py-3 px-2 text-slate-500 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {amortizationSchedule.slice(0, 12).map((row) => (
                  <tr key={row.month} className="border-b border-slate-800/30">
                    <td className="py-2 px-2 text-slate-400">{row.month}</td>
                    <td className="py-2 px-2 text-right text-white">${row.payment.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-violet-400">${row.principal.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-red-400">${row.interest.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-white">${row.balance.toFixed(2)}</td>
                  </tr>
                ))}
                {loanTerm > 12 && (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-slate-600 text-xs">
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

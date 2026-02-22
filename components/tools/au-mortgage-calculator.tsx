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
  Home,
  Building2,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface MortgageResults {
  loanAmount: number;
  lvr: number;
  lmiRequired: boolean;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  offsetSavingMonthly: number;
  offsetSavingTotal: number;
  payoffDate: string;
}

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

const formatAUD = (value: number) =>
  `A$${value.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatAUDDecimal = (value: number) =>
  `A$${value.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function AUMortgageCalculator() {
  const [propertyPrice, setPropertyPrice] = useState(750000);
  const [deposit, setDeposit] = useState(150000);
  const [interestRate, setInterestRate] = useState(6.09);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [offsetBalance, setOffsetBalance] = useState(0);
  const [repaymentType, setRepaymentType] = useState<'pi' | 'io'>('pi');
  const [showAmortization, setShowAmortization] = useState(false);

  const maxDeposit = Math.floor(propertyPrice * 0.5);

  const results: MortgageResults = useMemo(() => {
    const loanAmount = propertyPrice - deposit;
    const lvr = propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0;
    const lmiRequired = lvr > 80;
    const numPayments = loanTermYears * 12;
    const monthlyRate = interestRate / 100 / 12;

    let monthlyPayment: number;
    if (repaymentType === 'io') {
      monthlyPayment = loanAmount * monthlyRate;
    } else {
      monthlyPayment =
        monthlyRate > 0
          ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
            (Math.pow(1 + monthlyRate, numPayments) - 1)
          : loanAmount / numPayments;
    }

    const totalPayment =
      repaymentType === 'io'
        ? monthlyPayment * numPayments + loanAmount
        : monthlyPayment * numPayments;
    const totalInterest = totalPayment - loanAmount;

    const offsetSavingMonthly = offsetBalance * monthlyRate;
    const offsetSavingTotal = offsetSavingMonthly * numPayments;

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + numPayments);
    const payoffDateStr = payoffDate.toLocaleDateString('en-AU', {
      month: 'long',
      year: 'numeric',
    });

    return {
      loanAmount,
      lvr: Math.round(lvr * 10) / 10,
      lmiRequired,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      offsetSavingMonthly: Math.round(offsetSavingMonthly * 100) / 100,
      offsetSavingTotal: Math.round(offsetSavingTotal * 100) / 100,
      payoffDate: payoffDateStr,
    };
  }, [propertyPrice, deposit, interestRate, loanTermYears, offsetBalance, repaymentType]);

  const amortizationSchedule: AmortizationRow[] = useMemo(() => {
    if (repaymentType === 'io') return [];
    const schedule: AmortizationRow[] = [];
    const monthlyRate = interestRate / 100 / 12;
    let balance = results.loanAmount;

    for (let month = 1; month <= loanTermYears * 12; month++) {
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
  }, [results.loanAmount, interestRate, loanTermYears, results.monthlyPayment, repaymentType]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div
            className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
              <Home className="h-5 w-5" style={{ color: 'var(--sfp-green)' }} />
              Mortgage Details
            </h3>

            {/* Repayment Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>
                Repayment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRepaymentType('pi')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    repaymentType === 'pi'
                      ? 'border-gray-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={
                    repaymentType === 'pi'
                      ? { borderColor: 'var(--sfp-green)', background: 'rgba(26,107,58,0.1)' }
                      : undefined
                  }
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: repaymentType === 'pi' ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}
                  >
                    Principal & Interest
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                    Pay off your loan over time
                  </span>
                </button>
                <button
                  onClick={() => setRepaymentType('io')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    repaymentType === 'io'
                      ? 'border-gray-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={
                    repaymentType === 'io'
                      ? { borderColor: 'var(--sfp-green)', background: 'rgba(26,107,58,0.1)' }
                      : undefined
                  }
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: repaymentType === 'io' ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}
                  >
                    Interest Only
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                    Lower repayments, no equity
                  </span>
                </button>
              </div>
            </div>

            {/* Property Price */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Home className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Property Price
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}
                >
                  {formatAUD(propertyPrice)}
                </span>
              </div>
              <Slider
                value={[propertyPrice]}
                onValueChange={(value) => {
                  setPropertyPrice(value[0]);
                  if (deposit > value[0] * 0.5) {
                    setDeposit(Math.floor(value[0] * 0.2));
                  }
                }}
                min={200000}
                max={3000000}
                step={10000}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>A$200k</span>
                <span>A$1.5M</span>
                <span>A$3M</span>
              </div>
            </div>

            {/* Deposit */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Deposit
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}
                >
                  {formatAUD(deposit)} ({((deposit / propertyPrice) * 100).toFixed(0)}%)
                </span>
              </div>
              <Slider
                value={[deposit]}
                onValueChange={(value) => setDeposit(value[0])}
                min={0}
                max={maxDeposit}
                step={5000}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>A$0</span>
                <span>{formatAUD(Math.floor(maxDeposit / 2))}</span>
                <span>{formatAUD(maxDeposit)}</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Percent className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Interest Rate (p.a.)
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}
                >
                  {interestRate.toFixed(2)}%
                </span>
              </div>
              <Slider
                value={[interestRate]}
                onValueChange={(value) => setInterestRate(value[0])}
                min={4}
                max={10}
                step={0.05}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>4.00%</span>
                <span>7.00%</span>
                <span>10.00%</span>
              </div>
            </div>

            {/* Loan Term */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Calendar className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Loan Term
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}
                >
                  {loanTermYears} years
                </span>
              </div>
              <Slider
                value={[loanTermYears]}
                onValueChange={(value) => setLoanTermYears(value[0])}
                min={15}
                max={30}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>15 yrs</span>
                <span>20 yrs</span>
                <span>25 yrs</span>
                <span>30 yrs</span>
              </div>
            </div>

            {/* Offset Balance */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Shield className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Offset Account Balance
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}
                >
                  {formatAUD(offsetBalance)}
                </span>
              </div>
              <Slider
                value={[offsetBalance]}
                onValueChange={(value) => setOffsetBalance(value[0])}
                min={0}
                max={200000}
                step={5000}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>A$0</span>
                <span>A$100k</span>
                <span>A$200k</span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--sfp-slate)' }}>
                Offset reduces the balance your interest is calculated on
              </p>
            </div>
          </div>

          {/* LVR Warning */}
          {results.lmiRequired && (
            <div
              className="rounded-xl p-4 border border-red-500/20"
              style={{ background: 'rgba(239,68,68,0.05)' }}
            >
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-red)' }} />
                <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                  <strong style={{ color: 'var(--sfp-red)' }}>
                    LVR {results.lvr.toFixed(1)}% — Lenders Mortgage Insurance (LMI) Required:
                  </strong>{' '}
                  With a loan-to-value ratio above 80%, you will likely need to pay LMI. This can
                  add A$5,000–A$40,000+ to your borrowing costs depending on loan size and LVR.
                  Consider increasing your deposit to at least{' '}
                  {formatAUD(Math.ceil(propertyPrice * 0.2))} to avoid LMI.
                </div>
              </div>
            </div>
          )}

          {/* General Disclaimer */}
          <div
            className="rounded-xl p-4 border border-amber-500/20"
            style={{ background: 'rgba(245,158,11,0.05)' }}
          >
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                <strong className="text-amber-600">Important:</strong> This calculator provides
                estimates only. Actual rates, fees, and approval depend on your financial situation
                and the lender. SmartFinPro does not provide personal financial advice. Always
                confirm rates directly with your chosen lender.
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Monthly Payment Highlight */}
          <div className="rounded-2xl p-6 text-white" style={{ background: 'var(--sfp-green)' }}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="text-sm font-medium text-white/80">
                {repaymentType === 'pi' ? 'Monthly Repayment (P&I)' : 'Monthly Repayment (IO)'}
              </span>
            </div>
            <div className="text-5xl font-bold mb-2">
              {formatAUDDecimal(results.monthlyPayment)}
            </div>
            <p className="text-sm text-white/80">
              {repaymentType === 'pi'
                ? `Loan paid off by ${results.payoffDate}`
                : `Interest only — principal of ${formatAUD(results.loanAmount)} remains`}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Loan Amount</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {formatAUD(results.loanAmount)}
              </div>
            </div>

            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Building2
                  className="h-4 w-4"
                  style={{ color: results.lmiRequired ? '#d97706' : 'var(--sfp-green)' }}
                />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>LVR</span>
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: results.lmiRequired ? '#d97706' : 'var(--sfp-green)' }}
              >
                {results.lvr.toFixed(1)}%
              </div>
              {results.lmiRequired && (
                <span className="text-xs text-amber-600">LMI likely required</span>
              )}
            </div>

            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4" style={{ color: 'var(--sfp-red)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Total Interest</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-red)' }}>
                {formatAUD(results.totalInterest)}
              </div>
            </div>

            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Total Repayment</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {formatAUD(results.totalPayment)}
              </div>
            </div>
          </div>

          {/* Offset Savings */}
          {offsetBalance > 0 && (
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(26,107,58,0.1)', borderLeft: '4px solid var(--sfp-green)' }}
            >
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-green)' }}>
                <Shield className="h-4 w-4" />
                Offset Account Savings
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs block" style={{ color: 'var(--sfp-slate)' }}>Monthly Saving</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--sfp-green)' }}>
                    {formatAUDDecimal(results.offsetSavingMonthly)}
                  </span>
                </div>
                <div>
                  <span className="text-xs block" style={{ color: 'var(--sfp-slate)' }}>
                    Total Saving ({loanTermYears} yrs)
                  </span>
                  <span className="text-lg font-bold" style={{ color: 'var(--sfp-green)' }}>
                    {formatAUD(results.offsetSavingTotal)}
                  </span>
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--sfp-slate)' }}>
                Based on {formatAUD(offsetBalance)} maintained in offset for the full loan term
              </p>
            </div>
          )}

          {/* Stamp Duty Info */}
          <div
            className="rounded-xl border border-blue-500/20 p-4"
            style={{ background: 'rgba(59,130,246,0.05)' }}
          >
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                <strong className="text-blue-600">Stamp Duty / Transfer Duty</strong>
                <p className="mt-1">
                  Stamp duty varies significantly by state for a {formatAUD(propertyPrice)} property:
                </p>
                <ul className="mt-1 space-y-0.5">
                  <li>
                    • <strong style={{ color: 'var(--sfp-ink)' }}>NSW:</strong> Check{' '}
                    <span className="text-blue-600">revenue.nsw.gov.au</span>
                  </li>
                  <li>
                    • <strong style={{ color: 'var(--sfp-ink)' }}>VIC:</strong> Check{' '}
                    <span className="text-blue-600">sro.vic.gov.au</span>
                  </li>
                  <li>
                    • <strong style={{ color: 'var(--sfp-ink)' }}>QLD:</strong> Check{' '}
                    <span className="text-blue-600">qld.gov.au/housing</span>
                  </li>
                </ul>
                <p className="mt-1">
                  First home buyers may qualify for exemptions or concessions in most states.
                </p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
          >
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--sfp-ink)' }}>Cost Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Loan Principal</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  {formatAUD(results.loanAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Total Interest</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-red)' }}>
                  +{formatAUD(results.totalInterest)}
                </span>
              </div>
              {offsetBalance > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Offset Saving</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--sfp-green)' }}>
                    -{formatAUD(results.offsetSavingTotal)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>Total Cost</span>
                <span className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  {formatAUD(results.totalPayment)}
                </span>
              </div>
            </div>

            {/* Visual breakdown */}
            <div className="mt-4 h-3 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${(results.loanAmount / results.totalPayment) * 100}%`,
                  background: 'var(--sfp-green)',
                }}
              />
              <div
                style={{
                  width: `${(results.totalInterest / results.totalPayment) * 100}%`,
                  background: 'var(--sfp-red)',
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
              <span>
                Principal ({Math.round((results.loanAmount / results.totalPayment) * 100)}%)
              </span>
              <span>
                Interest ({Math.round((results.totalInterest / results.totalPayment) * 100)}%)
              </span>
            </div>
          </div>

          {/* CTA */}
          <div
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-6"
          >
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>Compare rates from 25+ AU lenders</h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Find the best home loan rate for your situation. Compare big four banks and digital
              lenders side by side.
            </p>
            <Button asChild className="w-full hover:opacity-90" style={{ background: 'var(--sfp-gold)' }}>
              <a href="/au/personal-finance">
                Compare Home Loan Rates
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Free to use. No obligation. No credit score impact.
            </p>
          </div>

          {/* Amortization Toggle */}
          {repaymentType === 'pi' && (
            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="w-full text-sm font-medium flex items-center justify-center gap-2 hover:opacity-80"
              style={{ color: 'var(--sfp-navy)' }}
            >
              <Calculator className="h-4 w-4" />
              {showAmortization ? 'Hide' : 'Show'} Amortisation Schedule
            </button>
          )}
        </div>
      </div>

      {/* Amortization Schedule */}
      {showAmortization && repaymentType === 'pi' && amortizationSchedule.length > 0 && (
        <div
          className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sfp-ink)' }}>Amortisation Schedule</h3>
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
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-ink)' }}>
                      {formatAUDDecimal(row.payment)}
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-green)' }}>
                      {formatAUDDecimal(row.principal)}
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-red)' }}>
                      {formatAUDDecimal(row.interest)}
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--sfp-ink)' }}>
                      {formatAUDDecimal(row.balance)}
                    </td>
                  </tr>
                ))}
                {loanTermYears * 12 > 12 && (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-xs" style={{ color: 'var(--sfp-slate)' }}>
                      ... {loanTermYears * 12 - 12} more months ...
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

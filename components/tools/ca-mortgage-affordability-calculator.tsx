'use client';

import { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  Home,
  Percent,
  Shield,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Flame,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AffordabilityResults {
  maxHomePrice: number;
  monthlyMortgagePayment: number;
  monthlyPropertyTax: number;
  monthlyHeating: number;
  monthlyTotalHousing: number;
  gdsRatio: number;
  tdsRatio: number;
  stressTestRate: number;
  cmhcInsurance: number;
  cmhcRequired: boolean;
  downPaymentPercent: number;
  totalMortgage: number;
  isAffordable: boolean;
}

const formatCAD = (value: number) =>
  `C$${value.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatCADDecimal = (value: number) =>
  `C$${value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function calculateMonthlyPayment(principal: number, annualRate: number, amortizationYears: number): number {
  if (principal <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = amortizationYears * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
}

function getCMHCInsuranceRate(downPaymentPercent: number): number {
  if (downPaymentPercent >= 20) return 0;
  if (downPaymentPercent >= 15) return 2.80;
  if (downPaymentPercent >= 10) return 3.10;
  return 4.00;
}

function getGDSColor(ratio: number): string {
  if (ratio <= 32) return 'var(--sfp-green)';
  if (ratio <= 39) return '#d97706';
  return 'var(--sfp-red)';
}

function getGDSBg(ratio: number): string {
  if (ratio <= 32) return 'rgba(26,107,58,0.1)';
  if (ratio <= 39) return 'rgba(245,158,11,0.1)';
  return 'rgba(214,64,69,0.1)';
}

function getTDSColor(ratio: number): string {
  if (ratio <= 38) return 'var(--sfp-green)';
  if (ratio <= 44) return '#d97706';
  return 'var(--sfp-red)';
}

function getTDSBg(ratio: number): string {
  if (ratio <= 38) return 'rgba(26,107,58,0.1)';
  if (ratio <= 44) return 'rgba(245,158,11,0.1)';
  return 'rgba(214,64,69,0.1)';
}

function getGDSLabel(ratio: number): string {
  if (ratio <= 32) return 'Comfortable';
  if (ratio <= 39) return 'At Limit';
  return 'Over Limit';
}

function getTDSLabel(ratio: number): string {
  if (ratio <= 38) return 'Comfortable';
  if (ratio <= 44) return 'At Limit';
  return 'Over Limit';
}

export function CAMortgageAffordabilityCalculator() {
  const [annualIncome, setAnnualIncome] = useState(85000);
  const [monthlyDebt, setMonthlyDebt] = useState(500);
  const [downPayment, setDownPayment] = useState(50000);
  const [interestRate, setInterestRate] = useState(5.49);
  const [amortization, setAmortization] = useState<25 | 30>(25);
  const [propertyTax, setPropertyTax] = useState(4000);
  const [heatingCost, setHeatingCost] = useState(150);

  const results: AffordabilityResults = useMemo(() => {
    const grossMonthlyIncome = annualIncome / 12;
    const monthlyPropertyTax = propertyTax / 12;
    const monthlyHeating = heatingCost;

    // OSFI B-20 stress test: higher of contract rate + 2% or 5.25%
    const stressTestRate = Math.max(interestRate + 2, 5.25);

    // Calculate max affordable price using GDS and TDS constraints
    // GDS: (Mortgage + PropTax + Heating) / GrossMonthlyIncome <= 39%
    // TDS: (Mortgage + PropTax + Heating + OtherDebt) / GrossMonthlyIncome <= 44%

    const maxGDSHousing = grossMonthlyIncome * 0.39;
    const maxTDSHousing = grossMonthlyIncome * 0.44 - monthlyDebt;

    // The binding constraint is the lower of the two
    const maxMonthlyMortgage = Math.max(0, Math.min(maxGDSHousing, maxTDSHousing) - monthlyPropertyTax - monthlyHeating);

    // Back-calculate max mortgage principal from max monthly payment at stress test rate
    const stressMonthlyRate = stressTestRate / 100 / 12;
    const numPayments = amortization * 12;
    let maxMortgagePrincipal: number;
    if (stressMonthlyRate === 0) {
      maxMortgagePrincipal = maxMonthlyMortgage * numPayments;
    } else {
      maxMortgagePrincipal = maxMonthlyMortgage *
        (Math.pow(1 + stressMonthlyRate, numPayments) - 1) /
        (stressMonthlyRate * Math.pow(1 + stressMonthlyRate, numPayments));
    }

    // Now figure out max home price including CMHC insurance
    // If down payment < 20% of home price, CMHC insurance is added to mortgage
    // We need to solve: homePrice = downPayment + mortgagePrincipal
    // But if CMHC applies: totalMortgage = (homePrice - downPayment) * (1 + cmhcRate/100)
    // And totalMortgage must be <= maxMortgagePrincipal

    // Iterative approach to find max home price considering CMHC
    let maxHomePrice = maxMortgagePrincipal + downPayment;
    for (let i = 0; i < 10; i++) {
      const dp = downPayment;
      const dpPercent = maxHomePrice > 0 ? (dp / maxHomePrice) * 100 : 0;
      const cmhcRate = getCMHCInsuranceRate(dpPercent);
      const loanBeforeInsurance = maxHomePrice - dp;
      const totalMortgageNeeded = loanBeforeInsurance * (1 + cmhcRate / 100);
      if (totalMortgageNeeded <= maxMortgagePrincipal) break;
      // Reduce home price
      maxHomePrice = dp + maxMortgagePrincipal / (1 + cmhcRate / 100);
    }

    maxHomePrice = Math.max(0, Math.floor(maxHomePrice));

    // Calculate actual values at the max home price
    const dpPercent = maxHomePrice > 0 ? (downPayment / maxHomePrice) * 100 : 0;
    const cmhcRate = getCMHCInsuranceRate(dpPercent);
    const cmhcRequired = dpPercent < 20;
    const loanBeforeInsurance = Math.max(0, maxHomePrice - downPayment);
    const cmhcInsurance = Math.round(loanBeforeInsurance * (cmhcRate / 100));
    const totalMortgage = loanBeforeInsurance + cmhcInsurance;

    // Monthly payment at contract rate (what you actually pay)
    const actualMonthlyPayment = calculateMonthlyPayment(totalMortgage, interestRate, amortization);
    const monthlyTotalHousing = actualMonthlyPayment + monthlyPropertyTax + monthlyHeating;

    // GDS and TDS at contract rate
    const gdsRatio = grossMonthlyIncome > 0
      ? ((actualMonthlyPayment + monthlyPropertyTax + monthlyHeating) / grossMonthlyIncome) * 100
      : 0;
    const tdsRatio = grossMonthlyIncome > 0
      ? ((actualMonthlyPayment + monthlyPropertyTax + monthlyHeating + monthlyDebt) / grossMonthlyIncome) * 100
      : 0;

    const isAffordable = gdsRatio <= 39 && tdsRatio <= 44;

    return {
      maxHomePrice,
      monthlyMortgagePayment: Math.round(actualMonthlyPayment * 100) / 100,
      monthlyPropertyTax: Math.round(monthlyPropertyTax * 100) / 100,
      monthlyHeating,
      monthlyTotalHousing: Math.round(monthlyTotalHousing * 100) / 100,
      gdsRatio: Math.round(gdsRatio * 10) / 10,
      tdsRatio: Math.round(tdsRatio * 10) / 10,
      stressTestRate: Math.round(stressTestRate * 100) / 100,
      cmhcInsurance,
      cmhcRequired,
      downPaymentPercent: Math.round(dpPercent * 10) / 10,
      totalMortgage: Math.round(totalMortgage),
      isAffordable,
    };
  }, [annualIncome, monthlyDebt, downPayment, interestRate, amortization, propertyTax, heatingCost]);

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
              Your Financial Details
            </h3>

            {/* Annual Household Income */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Annual Household Income
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}
                >
                  {formatCAD(annualIncome)}
                </span>
              </div>
              <Slider
                value={[annualIncome]}
                onValueChange={(value) => setAnnualIncome(value[0])}
                min={30000}
                max={500000}
                step={5000}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>C$30k</span>
                <span>C$250k</span>
                <span>C$500k</span>
              </div>
            </div>

            {/* Monthly Debt Payments */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <CreditCard className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Monthly Debt Payments
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}
                >
                  {formatCAD(monthlyDebt)}/mo
                </span>
              </div>
              <Slider
                value={[monthlyDebt]}
                onValueChange={(value) => setMonthlyDebt(value[0])}
                min={0}
                max={5000}
                step={50}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>C$0</span>
                <span>C$2,500</span>
                <span>C$5,000</span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--sfp-slate)' }}>
                Car loans, student loans, credit card minimum payments
              </p>
            </div>

            {/* Down Payment */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Home className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Down Payment Available
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}
                >
                  {formatCAD(downPayment)}
                </span>
              </div>
              <Slider
                value={[downPayment]}
                onValueChange={(value) => setDownPayment(value[0])}
                min={5000}
                max={500000}
                step={5000}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>C$5k</span>
                <span>C$250k</span>
                <span>C$500k</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Percent className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Mortgage Interest Rate
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
                min={2}
                max={10}
                step={0.01}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>2.00%</span>
                <span>6.00%</span>
                <span>10.00%</span>
              </div>
            </div>

            {/* Amortization Period */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>
                Amortization Period
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAmortization(25)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    amortization === 25
                      ? 'border-gray-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={
                    amortization === 25
                      ? { borderColor: 'var(--sfp-green)', background: 'rgba(26,107,58,0.1)' }
                      : undefined
                  }
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: amortization === 25 ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}
                  >
                    25 Years
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                    Standard amortization
                  </span>
                </button>
                <button
                  onClick={() => setAmortization(30)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    amortization === 30
                      ? 'border-gray-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={
                    amortization === 30
                      ? { borderColor: 'var(--sfp-green)', background: 'rgba(26,107,58,0.1)' }
                      : undefined
                  }
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: amortization === 30 ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}
                  >
                    30 Years
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                    Lower payments, more interest
                  </span>
                </button>
              </div>
            </div>

            {/* Property Tax */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Calculator className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Annual Property Tax
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}
                >
                  {formatCAD(propertyTax)}/yr
                </span>
              </div>
              <Slider
                value={[propertyTax]}
                onValueChange={(value) => setPropertyTax(value[0])}
                min={1000}
                max={15000}
                step={500}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>C$1k</span>
                <span>C$8k</span>
                <span>C$15k</span>
              </div>
            </div>

            {/* Heating Costs */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Flame className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Monthly Heating Costs
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}
                >
                  {formatCAD(heatingCost)}/mo
                </span>
              </div>
              <Slider
                value={[heatingCost]}
                onValueChange={(value) => setHeatingCost(value[0])}
                min={50}
                max={500}
                step={25}
                className="py-2"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>C$50</span>
                <span>C$275</span>
                <span>C$500</span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--sfp-slate)' }}>
                Required by lenders for GDS calculation in Canada
              </p>
            </div>
          </div>

          {/* CMHC Warning */}
          {results.cmhcRequired && (
            <div
              className="rounded-xl p-4 border border-amber-500/20"
              style={{ background: 'rgba(245,158,11,0.05)' }}
            >
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                  <strong className="text-amber-600">
                    CMHC Mortgage Insurance Required ({results.downPaymentPercent.toFixed(1)}% down)
                  </strong>{' '}
                  With a down payment below 20%, CMHC mortgage default insurance of{' '}
                  <strong className="text-amber-600">{formatCAD(results.cmhcInsurance)}</strong>{' '}
                  will be added to your mortgage. This is a one-time premium spread over your
                  amortization period. To avoid CMHC insurance, you would need a down payment of at
                  least {formatCAD(Math.ceil(results.maxHomePrice * 0.2))}.
                </div>
              </div>
            </div>
          )}

          {/* Stress Test Info */}
          <div
            className="rounded-xl p-4 border border-blue-500/20"
            style={{ background: 'rgba(59,130,246,0.05)' }}
          >
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                <strong className="text-blue-600">
                  OSFI B-20 Stress Test Applied: {results.stressTestRate.toFixed(2)}%
                </strong>{' '}
                Canadian lenders must qualify you at the higher of your contract rate + 2%
                ({(interestRate + 2).toFixed(2)}%) or 5.25%. Your maximum affordable price is
                calculated using this stress test rate, but your actual payments are at your contract
                rate of {interestRate.toFixed(2)}%.
              </div>
            </div>
          </div>

          {/* General Disclaimer */}
          <div
            className="rounded-xl p-4 border border-amber-500/20"
            style={{ background: 'rgba(245,158,11,0.05)' }}
          >
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                <strong className="text-amber-600">Important:</strong> This calculator provides
                estimates only. Actual mortgage approval depends on your credit score, employment
                history, property type, and lender policies. SmartFinPro does not provide personal
                financial advice. Always confirm figures directly with your chosen lender or mortgage
                broker.
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Max Affordable Price Highlight */}
          <div
            className="rounded-2xl p-6 text-white"
            style={{ background: results.isAffordable ? 'var(--sfp-green)' : 'var(--sfp-red)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Home className="h-5 w-5" />
              <span className="text-sm font-medium text-white/80">
                Maximum Affordable Home Price
              </span>
            </div>
            <div className="text-5xl font-bold mb-2">
              {formatCAD(results.maxHomePrice)}
            </div>
            <p className="text-sm text-white/80">
              Based on {formatCAD(annualIncome)} income with {formatCAD(downPayment)} down
            </p>
          </div>

          {/* GDS & TDS Gauges */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>GDS Ratio</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: getGDSColor(results.gdsRatio) }}>
                {results.gdsRatio.toFixed(1)}%
              </div>
              <div className="mt-2">
                <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (results.gdsRatio / 45) * 100)}%`,
                      background: results.gdsRatio <= 32 ? 'var(--sfp-green)' : results.gdsRatio <= 39 ? 'var(--sfp-gold)' : 'var(--sfp-red)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--sfp-slate)' }}>
                  <span>0%</span>
                  <span>32%</span>
                  <span>39%</span>
                </div>
              </div>
              <span
                className="inline-block text-xs font-medium mt-2 px-2 py-0.5 rounded-full"
                style={{ background: getGDSBg(results.gdsRatio), color: getGDSColor(results.gdsRatio) }}
              >
                {getGDSLabel(results.gdsRatio)}
              </span>
            </div>

            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>TDS Ratio</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: getTDSColor(results.tdsRatio) }}>
                {results.tdsRatio.toFixed(1)}%
              </div>
              <div className="mt-2">
                <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (results.tdsRatio / 50) * 100)}%`,
                      background: results.tdsRatio <= 38 ? 'var(--sfp-green)' : results.tdsRatio <= 44 ? 'var(--sfp-gold)' : 'var(--sfp-red)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--sfp-slate)' }}>
                  <span>0%</span>
                  <span>38%</span>
                  <span>44%</span>
                </div>
              </div>
              <span
                className="inline-block text-xs font-medium mt-2 px-2 py-0.5 rounded-full"
                style={{ background: getTDSBg(results.tdsRatio), color: getTDSColor(results.tdsRatio) }}
              >
                {getTDSLabel(results.tdsRatio)}
              </span>
            </div>
          </div>

          {/* Monthly Payment Breakdown */}
          <div
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
          >
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
              <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
              Monthly Payment Breakdown
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Mortgage Payment</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  {formatCADDecimal(results.monthlyMortgagePayment)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Property Tax</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  {formatCADDecimal(results.monthlyPropertyTax)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Heating</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  {formatCADDecimal(results.monthlyHeating)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>Total Monthly Housing</span>
                <span className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  {formatCADDecimal(results.monthlyTotalHousing)}
                </span>
              </div>
            </div>

            {/* Visual breakdown */}
            <div className="mt-4 h-3 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${results.monthlyTotalHousing > 0 ? (results.monthlyMortgagePayment / results.monthlyTotalHousing) * 100 : 0}%`,
                  background: 'var(--sfp-green)',
                }}
              />
              <div
                style={{
                  width: `${results.monthlyTotalHousing > 0 ? (results.monthlyPropertyTax / results.monthlyTotalHousing) * 100 : 0}%`,
                  background: 'var(--sfp-navy)',
                }}
              />
              <div
                className="bg-amber-500"
                style={{
                  width: `${results.monthlyTotalHousing > 0 ? (results.monthlyHeating / results.monthlyTotalHousing) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
              <span>Mortgage</span>
              <span>Tax</span>
              <span>Heating</span>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Stress Test Rate</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {results.stressTestRate.toFixed(2)}%
              </div>
              <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                Qualifying rate (OSFI B-20)
              </span>
            </div>

            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Percent
                  className="h-4 w-4"
                  style={{ color: results.cmhcRequired ? '#d97706' : 'var(--sfp-green)' }}
                />
                <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>CMHC Insurance</span>
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: results.cmhcRequired ? '#d97706' : 'var(--sfp-green)' }}
              >
                {results.cmhcRequired ? formatCAD(results.cmhcInsurance) : 'C$0'}
              </div>
              <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                {results.cmhcRequired
                  ? `Added to mortgage (${results.downPaymentPercent.toFixed(1)}% down)`
                  : 'Not required (20%+ down)'}
              </span>
            </div>
          </div>

          {/* Total Mortgage */}
          <div
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
          >
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--sfp-ink)' }}>Mortgage Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Home Price</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>
                  {formatCAD(results.maxHomePrice)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Down Payment</span>
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-green)' }}>
                  -{formatCAD(downPayment)} ({results.downPaymentPercent.toFixed(1)}%)
                </span>
              </div>
              {results.cmhcRequired && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>CMHC Insurance</span>
                  <span className="text-sm font-medium text-amber-600">
                    +{formatCAD(results.cmhcInsurance)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>Total Mortgage</span>
                <span className="text-sm font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  {formatCAD(results.totalMortgage)}
                </span>
              </div>
            </div>
          </div>

          {/* First-Time Buyer Incentives */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(26,107,58,0.1)', borderLeft: '4px solid var(--sfp-green)' }}
          >
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--sfp-green)' }}>
              <CheckCircle className="h-4 w-4" />
              First-Time Home Buyer Incentives
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>FHSA (First Home Savings Account)</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                    Contribute up to C$8,000/year (C$40,000 lifetime) with tax deductions on
                    contributions and tax-free withdrawals for your first home purchase.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>HBP (Home Buyers&apos; Plan)</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                    Withdraw up to C$60,000 from your RRSP tax-free to buy your first home. Must be
                    repaid within 15 years.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>First-Time Home Buyer Tax Credit</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>
                    Claim C$10,000 non-refundable tax credit (worth up to C$1,500 in tax savings) in the
                    year you purchase your first home.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-6"
          >
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>Compare Canadian Mortgage Rates</h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Find the best mortgage rate for your situation. Compare rates from Canada&apos;s top
              lenders and brokers side by side.
            </p>
            <Button asChild className="w-full hover:opacity-90" style={{ background: 'var(--sfp-gold)' }}>
              <a href="/ca/personal-finance">
                Compare Mortgage Rates
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Free to use. No obligation. No credit score impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

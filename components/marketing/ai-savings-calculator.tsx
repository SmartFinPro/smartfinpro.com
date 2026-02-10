'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Calculator,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Zap,
  BarChart3,
} from 'lucide-react';
import { useCalculatorTracking, useVisibilityTracking } from '@/lib/hooks/use-component-tracking';

interface AISavingsCalculatorProps {
  affiliateUrl?: string;
  productName?: string;
  market?: 'us' | 'uk' | 'ca' | 'au';
  variant?: 'default' | 'compact';
}

const currencyConfig = {
  us: { symbol: '$', locale: 'en-US', name: 'USD' },
  uk: { symbol: '£', locale: 'en-GB', name: 'GBP' },
  ca: { symbol: 'C$', locale: 'en-CA', name: 'CAD' },
  au: { symbol: 'A$', locale: 'en-AU', name: 'AUD' },
};

// Exchange rate multipliers (approximate, for display)
const rateMultipliers = {
  us: 1,
  uk: 0.79,
  ca: 1.36,
  au: 1.53,
};

/**
 * AI Savings Calculator
 * Interactive ROI calculator showing potential time and cost savings from AI tools
 */
export function AISavingsCalculator({
  affiliateUrl = '/go/jasper-ai',
  productName = 'Jasper AI',
  market = 'us',
  variant = 'default',
}: AISavingsCalculatorProps) {
  const [teamSize, setTeamSize] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(75);
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [isVisible, setIsVisible] = useState(false);

  const currency = currencyConfig[market];
  const rate = rateMultipliers[market];

  // Tracking hooks
  const { trackOpen, trackSliderChange, trackResultView, trackCTAClick } = useCalculatorTracking('ai_savings');
  const visibilityRef = useVisibilityTracking('ai_savings_calculator');
  const hasTrackedOpen = useRef(false);

  // Animate on mount and track view
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      if (!hasTrackedOpen.current) {
        hasTrackedOpen.current = true;
        trackOpen();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [trackOpen]);

  // Calculate savings
  const calculations = useMemo(() => {
    const efficiencyGain = 0.40; // 40% time savings (conservative estimate)
    const weeklyTimeSaved = weeklyHours * efficiencyGain * teamSize;
    const monthlyTimeSaved = weeklyTimeSaved * 4.33;
    const yearlyTimeSaved = weeklyTimeSaved * 52;

    const adjustedRate = hourlyRate * rate;
    const monthlyCostSavings = monthlyTimeSaved * adjustedRate;
    const yearlyCostSavings = yearlyTimeSaved * adjustedRate;

    // Tool cost estimate (Jasper Team plan)
    const monthlyToolCost = 49 * rate * teamSize;
    const yearlyToolCost = monthlyToolCost * 12;

    const netMonthlySavings = monthlyCostSavings - monthlyToolCost;
    const netYearlySavings = yearlyCostSavings - yearlyToolCost;

    const roi = yearlyToolCost > 0 ? ((yearlyCostSavings - yearlyToolCost) / yearlyToolCost) * 100 : 0;
    const productivityGain = efficiencyGain * 100;

    return {
      weeklyTimeSaved: Math.round(weeklyTimeSaved),
      monthlyTimeSaved: Math.round(monthlyTimeSaved),
      yearlyTimeSaved: Math.round(yearlyTimeSaved),
      monthlyCostSavings: Math.round(monthlyCostSavings),
      yearlyCostSavings: Math.round(yearlyCostSavings),
      monthlyToolCost: Math.round(monthlyToolCost),
      yearlyToolCost: Math.round(yearlyToolCost),
      netMonthlySavings: Math.round(netMonthlySavings),
      netYearlySavings: Math.round(netYearlySavings),
      roi: Math.round(roi),
      productivityGain,
    };
  }, [teamSize, hourlyRate, weeklyHours, rate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.name,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Track result view when calculations change significantly
  useEffect(() => {
    if (isVisible && calculations.netYearlySavings > 0) {
      trackResultView({
        netYearlySavings: calculations.netYearlySavings,
        roi: calculations.roi,
        teamSize,
        hourlyRate,
        weeklyHours,
      });
    }
  }, [calculations.netYearlySavings, calculations.roi, isVisible, teamSize, hourlyRate, weeklyHours, trackResultView]);

  return (
    <div
      ref={visibilityRef}
      className={`relative my-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/30">
          <Calculator className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">AI ROI Calculator</h3>
          <p className="text-sm text-slate-400">Calculate your potential savings with AI tools</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border-emerald-500/20">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Input Section */}
          <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-700/50">
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
              Your Team Details
            </h4>

            {/* Team Size */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                <Users className="h-4 w-4 text-emerald-400" />
                Team Size
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={teamSize}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setTeamSize(value);
                    trackSliderChange('team_size', value);
                  }}
                  className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30"
                />
                <div className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center text-white font-bold">
                  {teamSize}
                </div>
              </div>
            </div>

            {/* Hourly Rate */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                <DollarSign className="h-4 w-4 text-blue-400" />
                Average Hourly Rate ({currency.symbol})
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="25"
                  max="250"
                  step="5"
                  value={hourlyRate}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setHourlyRate(value);
                    trackSliderChange('hourly_rate', value);
                  }}
                  className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/30"
                />
                <div className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center text-white font-bold">
                  {currency.symbol}{hourlyRate}
                </div>
              </div>
            </div>

            {/* Weekly Hours */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                <Clock className="h-4 w-4 text-violet-400" />
                Hours Spent on Manual Tasks (per person/week)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={weeklyHours}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setWeeklyHours(value);
                    trackSliderChange('weekly_hours', value);
                  }}
                  className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-violet-500/30"
                />
                <div className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center text-white font-bold">
                  {weeklyHours}h
                </div>
              </div>
            </div>

            {/* Assumptions Note */}
            <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-400">Calculation basis:</strong> 40% efficiency gain based on
                average results from finance teams using AI writing tools. Actual results may vary based on
                use case and implementation.
              </p>
            </div>
          </div>

          {/* Results Section */}
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px]" />

            <div className="relative z-10">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Your Potential Savings
              </h4>

              {/* Main Savings Display */}
              <div className="mb-8">
                <div className="text-5xl md:text-6xl font-bold gradient-text mb-2">
                  {formatCurrency(calculations.netYearlySavings)}
                </div>
                <p className="text-slate-400 text-sm">Annual Net Savings</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">ROI</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{calculations.roi}%</div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-blue-400 font-medium">Productivity</span>
                  </div>
                  <div className="text-2xl font-bold text-white">+{calculations.productivityGain}%</div>
                </div>

                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-violet-400" />
                    <span className="text-xs text-violet-400 font-medium">Hours Saved</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{calculations.yearlyTimeSaved}h/yr</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">Monthly</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(calculations.netMonthlySavings)}</div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                asChild
                size="lg"
                className="w-full btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25 gap-2 h-14 text-base"
                onClick={() => trackCTAClick(`start_saving_${productName}`)}
              >
                <Link href={affiliateUrl} target="_blank" rel="noopener sponsored">
                  Start Saving with {productName}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>

              <p className="text-center text-xs text-slate-500 mt-3">
                7-day free trial • No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline version for sidebars
 */
export function AISavingsCalculatorCompact({
  affiliateUrl = '/go/jasper-ai',
  productName = 'Jasper AI',
  market = 'us',
}: Omit<AISavingsCalculatorProps, 'variant'>) {
  const currency = currencyConfig[market];

  // Fixed quick calculation for 5-person team
  const quickSavings = 45000 * rateMultipliers[market];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.name,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="glass-card rounded-xl p-5 my-6">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-semibold text-white">Quick ROI Estimate</span>
      </div>
      <div className="text-3xl font-bold gradient-text mb-1">
        {formatCurrency(quickSavings)}+
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Typical annual savings for a 5-person team
      </p>
      <Button
        asChild
        size="sm"
        className="w-full btn-shimmer bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg shadow-emerald-500/25 gap-1.5"
      >
        <Link href={affiliateUrl} target="_blank" rel="noopener sponsored">
          Calculate Your Savings
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

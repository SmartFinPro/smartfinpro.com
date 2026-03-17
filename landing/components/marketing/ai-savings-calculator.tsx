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
  uk: { symbol: '\u00a3', locale: 'en-GB', name: 'GBP' },
  ca: { symbol: 'C$', locale: 'en-CA', name: 'CAD' },
  au: { symbol: 'A$', locale: 'en-AU', name: 'AUD' },
};

const rateMultipliers = {
  us: 1,
  uk: 0.79,
  ca: 1.36,
  au: 1.53,
};

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

  const { trackOpen, trackSliderChange, trackResultView, trackCTAClick } = useCalculatorTracking('ai_savings');
  const visibilityRef = useVisibilityTracking('ai_savings_calculator');
  const hasTrackedOpen = useRef(false);

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

  const calculations = useMemo(() => {
    const efficiencyGain = 0.40;
    const weeklyTimeSaved = weeklyHours * efficiencyGain * teamSize;
    const monthlyTimeSaved = weeklyTimeSaved * 4.33;
    const yearlyTimeSaved = weeklyTimeSaved * 52;

    const adjustedRate = hourlyRate * rate;
    const monthlyCostSavings = monthlyTimeSaved * adjustedRate;
    const yearlyCostSavings = yearlyTimeSaved * adjustedRate;

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
        <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-gray-200" style={{ background: 'var(--sfp-sky)' }}>
          <Calculator className="h-6 w-6" style={{ color: 'var(--sfp-navy)' }} />
        </div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--sfp-ink)' }}>AI ROI Calculator</h3>
          <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Calculate your potential savings with AI tools</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Input Section */}
          <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-gray-200">
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-6" style={{ color: 'var(--sfp-slate)' }}>
              Your Team Details
            </h4>

            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--sfp-slate)' }}>
                <Users className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
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
                  className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  {teamSize}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--sfp-slate)' }}>
                <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
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
                  className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
                <div className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  {currency.symbol}{hourlyRate}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--sfp-slate)' }}>
                <Clock className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
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
                  className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-amber-500"
                />
                <div className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold" style={{ color: 'var(--sfp-ink)' }}>
                  {weeklyHours}h
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl border border-gray-200" style={{ background: 'var(--sfp-gray)' }}>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                <strong style={{ color: 'var(--sfp-ink)' }}>Calculation basis:</strong> 40% efficiency gain based on
                average results from finance teams using AI writing tools. Actual results may vary based on
                use case and implementation.
              </p>
            </div>
          </div>

          {/* Results Section */}
          <div className="p-6 md:p-8 relative overflow-hidden" style={{ background: 'var(--sfp-sky)' }}>
            <div className="relative z-10">
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                Your Potential Savings
              </h4>

              <div className="mb-8">
                <div className="text-5xl md:text-6xl font-bold mb-2" style={{ color: 'var(--sfp-navy)' }}>
                  {formatCurrency(calculations.netYearlySavings)}
                </div>
                <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Annual Net Savings</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl border bg-white" style={{ borderColor: 'rgba(26,107,58,0.2)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--sfp-green)' }}>ROI</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>{calculations.roi}%</div>
                </div>

                <div className="p-4 rounded-xl border bg-white" style={{ borderColor: 'rgba(27,79,140,0.2)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4" style={{ color: 'var(--sfp-navy)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--sfp-navy)' }}>Productivity</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>+{calculations.productivityGain}%</div>
                </div>

                <div className="p-4 rounded-xl border bg-white" style={{ borderColor: 'rgba(245,166,35,0.2)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--sfp-gold)' }}>Hours Saved</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>{calculations.yearlyTimeSaved}h/yr</div>
                </div>

                <div className="p-4 rounded-xl border bg-white border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--sfp-slate)' }}>Monthly</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--sfp-ink)' }}>{formatCurrency(calculations.netMonthlySavings)}</div>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="w-full gap-2 h-14 text-base border-0 shadow-lg text-white"
                onClick={() => trackCTAClick(`start_saving_${productName}`)}
                style={{ background: 'var(--sfp-gold)' }}
              >
                <Link href={affiliateUrl} target="_blank" rel="noopener sponsored">
                  Start Saving with {productName}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>

              <p className="text-center text-xs mt-3" style={{ color: 'var(--sfp-slate)' }}>
                7-day free trial - No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AISavingsCalculatorCompact({
  affiliateUrl = '/go/jasper-ai',
  productName = 'Jasper AI',
  market = 'us',
}: Omit<AISavingsCalculatorProps, 'variant'>) {
  const currency = currencyConfig[market];
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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 my-6">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--sfp-ink)' }}>Quick ROI Estimate</span>
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color: 'var(--sfp-navy)' }}>
        {formatCurrency(quickSavings)}+
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--sfp-slate)' }}>
        Typical annual savings for a 5-person team
      </p>
      <Button
        asChild
        size="sm"
        className="w-full gap-1.5 border-0 shadow-lg text-white"
        style={{ background: 'var(--sfp-gold)' }}
      >
        <Link href={affiliateUrl} target="_blank" rel="noopener sponsored">
          Calculate Your Savings
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

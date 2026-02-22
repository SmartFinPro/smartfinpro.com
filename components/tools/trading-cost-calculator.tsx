'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  DollarSign,
  BarChart3,
  Clock,
  AlertTriangle,
  Award,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

/* ─── Types ─── */
type BrokerSlug = 'etoro' | 'capital-com' | 'ibkr' | 'investing' | 'revolut';
type InstrumentType = 'stocks' | 'forex' | 'crypto' | 'indices';
type HoldingPeriod = 'daytrade' | 'swing' | 'position' | 'longterm';

interface CostBreakdown {
  spread: number;
  commission: number;
  overnight: number;
  total: number;
}

interface BrokerCostResult {
  slug: BrokerSlug;
  name: string;
  monthlyCost: CostBreakdown;
  yearlyCost: CostBreakdown;
  isDataPlatform: boolean;
}

/* ─── Cost Data ─── */
const brokerCosts: Record<BrokerSlug, Record<InstrumentType, { spread: number; commission: number; overnight: number }>> = {
  etoro: {
    stocks: { spread: 0.15, commission: 0, overnight: 0.024 },
    forex: { spread: 1.0, commission: 0, overnight: 0.008 },
    crypto: { spread: 1.0, commission: 0, overnight: 0.015 },
    indices: { spread: 0.75, commission: 0, overnight: 0.012 },
  },
  'capital-com': {
    stocks: { spread: 0.06, commission: 0, overnight: 0.022 },
    forex: { spread: 0.6, commission: 0, overnight: 0.007 },
    crypto: { spread: 0.5, commission: 0, overnight: 0.014 },
    indices: { spread: 0.4, commission: 0, overnight: 0.01 },
  },
  ibkr: {
    stocks: { spread: 0.02, commission: 1.0, overnight: 0.015 },
    forex: { spread: 0.2, commission: 2.0, overnight: 0.004 },
    crypto: { spread: 0.18, commission: 0, overnight: 0.01 },
    indices: { spread: 0.5, commission: 1.0, overnight: 0.008 },
  },
  investing: {
    stocks: { spread: 0, commission: 0, overnight: 0 },
    forex: { spread: 0, commission: 0, overnight: 0 },
    crypto: { spread: 0, commission: 0, overnight: 0 },
    indices: { spread: 0, commission: 0, overnight: 0 },
  },
  revolut: {
    stocks: { spread: 0.05, commission: 0, overnight: 0.02 },
    forex: { spread: 0.8, commission: 0, overnight: 0.009 },
    crypto: { spread: 1.5, commission: 0, overnight: 0.018 },
    indices: { spread: 0.6, commission: 0, overnight: 0.011 },
  },
};

const brokerNames: Record<BrokerSlug, string> = {
  etoro: 'eToro',
  'capital-com': 'Capital.com',
  ibkr: 'IBKR',
  investing: 'Investing.com',
  revolut: 'Revolut',
};

const holdingDays: Record<HoldingPeriod, number> = {
  daytrade: 0,
  swing: 3,
  position: 14,
  longterm: 30,
};

const instrumentLabels: { id: InstrumentType; label: string; sub: string }[] = [
  { id: 'stocks', label: 'Stocks & ETFs', sub: 'AAPL, TSLA, SPY' },
  { id: 'forex', label: 'Forex', sub: 'EUR/USD, GBP/USD' },
  { id: 'crypto', label: 'Crypto', sub: 'BTC, ETH, SOL' },
  { id: 'indices', label: 'Indices', sub: 'S&P 500, NASDAQ' },
];

const holdingLabels: { id: HoldingPeriod; label: string; sub: string }[] = [
  { id: 'daytrade', label: 'Day Trade', sub: '< 1 day' },
  { id: 'swing', label: 'Swing', sub: '1–5 days' },
  { id: 'position', label: 'Position', sub: '1–4 weeks' },
  { id: 'longterm', label: 'Long Term', sub: '1+ month' },
];

/* ─── Animated Number ─── */
function AnimatedNumber({ value, prefix = '$', decimals = 0 }: { value: number; prefix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const startTime = performance.now();
    const duration = 400;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (value - start) * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
      else prevRef.current = value;
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <>{prefix}{display.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

/* ─── Main Component ─── */
export function TradingCostCalculator() {
  const [amount, setAmount] = useState(5000);
  const [tradesPerMonth, setTradesPerMonth] = useState(10);
  const [instrument, setInstrument] = useState<InstrumentType>('stocks');
  const [holding, setHolding] = useState<HoldingPeriod>('swing');
  const [leverage, setLeverage] = useState(1);
  const [showYearly, setShowYearly] = useState(true);

  /* ─── Calculate costs ─── */
  const results: BrokerCostResult[] = useMemo(() => {
    const slugs: BrokerSlug[] = ['etoro', 'capital-com', 'ibkr', 'investing', 'revolut'];
    const days = holdingDays[holding];

    return slugs.map((slug) => {
      const costs = brokerCosts[slug][instrument];
      const isDataPlatform = slug === 'investing';

      const spreadCost = (amount * (costs.spread / 100)) * tradesPerMonth;
      const commissionCost = costs.commission * tradesPerMonth;
      const overnightCost = amount * leverage * (costs.overnight / 100 / 365) * days * tradesPerMonth;

      const monthlyTotal = spreadCost + commissionCost + overnightCost;

      return {
        slug,
        name: brokerNames[slug],
        isDataPlatform,
        monthlyCost: { spread: spreadCost, commission: commissionCost, overnight: overnightCost, total: monthlyTotal },
        yearlyCost: { spread: spreadCost * 12, commission: commissionCost * 12, overnight: overnightCost * 12, total: monthlyTotal * 12 },
      };
    }).sort((a, b) => {
      if (a.isDataPlatform && !b.isDataPlatform) return 1;
      if (!a.isDataPlatform && b.isDataPlatform) return -1;
      return a.monthlyCost.total - b.monthlyCost.total;
    });
  }, [amount, tradesPerMonth, instrument, holding, leverage]);

  const cheapest = results.find((r) => !r.isDataPlatform)!;
  const tradingBrokers = results.filter((r) => !r.isDataPlatform);
  const mostExpensive = tradingBrokers[tradingBrokers.length - 1];
  const maxCost = mostExpensive ? (showYearly ? mostExpensive.yearlyCost.total : mostExpensive.monthlyCost.total) : 1;
  const savings = mostExpensive
    ? (showYearly ? mostExpensive.yearlyCost.total - cheapest.yearlyCost.total : mostExpensive.monthlyCost.total - cheapest.monthlyCost.total)
    : 0;
  const avgCost = tradingBrokers.reduce((sum, r) => sum + (showYearly ? r.yearlyCost.total : r.monthlyCost.total), 0) / tradingBrokers.length;
  const savingsVsAvg = avgCost - (showYearly ? cheapest.yearlyCost.total : cheapest.monthlyCost.total);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* ─── Input Panel ─── */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
              <BarChart3 className="h-5 w-5" style={{ color: 'var(--sfp-navy)' }} />
              Configure Your Scenario
            </h3>

            {/* Instrument Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>Instrument</label>
              <div className="grid grid-cols-2 gap-2">
                {instrumentLabels.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setInstrument(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      instrument === item.id
                        ? 'border-gray-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={instrument === item.id ? { borderColor: 'var(--sfp-navy)', background: 'rgba(27,79,140,0.1)' } : { background: 'white' }}
                  >
                    <span className={`text-sm font-medium`} style={{ color: instrument === item.id ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}>{item.label}</span>
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trade Amount */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>Trade Amount</label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
                  ${amount.toLocaleString('en-US')}
                </span>
              </div>
              <Slider value={[amount]} onValueChange={(v) => setAmount(v[0])} min={100} max={100000} step={100} className="py-2" />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>$100</span>
                <span>$50k</span>
                <span>$100k</span>
              </div>
            </div>

            {/* Trades per Month */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>Trades / Month</label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-navy)' }}>
                  {tradesPerMonth} trades
                </span>
              </div>
              <Slider value={[tradesPerMonth]} onValueChange={(v) => setTradesPerMonth(v[0])} min={1} max={100} step={1} className="py-2" />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>1</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Leverage */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>Leverage</label>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(27,79,140,0.1)', color: 'var(--sfp-navy)' }}>
                  {leverage}x
                </span>
              </div>
              <Slider value={[leverage]} onValueChange={(v) => setLeverage(v[0])} min={1} max={30} step={1} className="py-2" />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
                <span>1x</span>
                <span>15x</span>
                <span>30x</span>
              </div>
            </div>

            {/* Holding Period */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>Holding Period</label>
              <div className="grid grid-cols-2 gap-2">
                {holdingLabels.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setHolding(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      holding === item.id
                        ? 'border-gray-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={holding === item.id ? { borderColor: 'var(--sfp-navy)', background: 'rgba(27,79,140,0.1)' } : { background: 'white' }}
                  >
                    <span className={`text-sm font-medium`} style={{ color: holding === item.id ? 'var(--sfp-ink)' : 'var(--sfp-slate)' }}>{item.label}</span>
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--sfp-slate)' }}>{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl p-4 border border-amber-500/20" style={{ background: 'rgba(245,158,11,0.05)' }}>
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                <strong style={{ color: 'var(--sfp-gold)' }}>Risk Warning:</strong> Trading involves risk of loss. Costs shown are estimates based on typical market conditions.
                Always verify current fees on the broker&apos;s website.
              </div>
            </div>
          </div>
        </div>

        {/* ─── Results Panel ─── */}
        <div className="space-y-6">
          {/* Savings Highlight */}
          <div className="rounded-2xl p-6 text-white" style={{ background: 'var(--sfp-green)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium text-white/90">Savings with {cheapest.name}</span>
              </div>
              {/* Toggle */}
              <div className="flex items-center bg-white/20 rounded-full p-1">
                <button
                  onClick={() => setShowYearly(false)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!showYearly ? 'bg-white text-slate-900' : 'text-white/60'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setShowYearly(true)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${showYearly ? 'bg-white text-slate-900' : 'text-white/60'}`}
                >
                  Yearly
                </button>
              </div>
            </div>
            <div className="text-5xl font-bold mb-2">
              <AnimatedNumber value={savingsVsAvg} />
              <span className="text-lg font-normal text-white/90">/{showYearly ? 'year' : 'month'}</span>
            </div>
            <p className="text-sm text-white/90">
              vs. average broker cost
            </p>
          </div>

          {/* Broker Comparison Bars */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <h4 className="text-sm font-medium mb-4" style={{ color: 'var(--sfp-slate)' }}>Cost Comparison</h4>
            <div className="space-y-3">
              {results.map((broker, i) => {
                const cost = showYearly ? broker.yearlyCost.total : broker.monthlyCost.total;
                const barWidth = broker.isDataPlatform ? 0 : maxCost > 0 ? (cost / maxCost) * 100 : 0;
                const isCheapest = i === 0 && !broker.isDataPlatform;

                return (
                  <div key={broker.slug}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <Image
                          src={`/images/brokers/${broker.slug}.svg`}
                          alt={broker.name}
                          width={100}
                          height={26}
                          className="h-6 w-auto shrink-0"
                        />
                        {isCheapest && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0" style={{ background: 'rgba(26,107,58,0.1)', color: 'var(--sfp-green)' }}>
                            <Award className="h-2.5 w-2.5" />
                            Best Value
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold tabular-nums shrink-0 ml-3" style={{ color: broker.isDataPlatform ? 'var(--sfp-slate)' : isCheapest ? 'var(--sfp-green)' : 'var(--sfp-ink)' }}>
                        {broker.isDataPlatform ? (
                          <span className="flex items-center gap-1 text-xs">
                            <Info className="h-3 w-3" />
                            Data Only
                          </span>
                        ) : (
                          <>${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                        )}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.max(barWidth, broker.isDataPlatform ? 0 : 2)}%`,
                          background: isCheapest
                            ? 'var(--sfp-green)'
                            : broker.isDataPlatform
                              ? 'transparent'
                              : 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost Breakdown for cheapest */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--sfp-slate)' }}>Cost Breakdown — {cheapest.name}</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--sfp-navy)' }} />
                  <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Spread</span>
                </div>
                <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
                  ${(showYearly ? cheapest.yearlyCost.spread : cheapest.monthlyCost.spread).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--sfp-gold)' }} />
                  <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Commission</span>
                </div>
                <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
                  ${(showYearly ? cheapest.yearlyCost.commission : cheapest.monthlyCost.commission).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Overnight</span>
                </div>
                <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
                  ${(showYearly ? cheapest.yearlyCost.overnight : cheapest.monthlyCost.overnight).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>Total</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--sfp-ink)' }}>
                  ${(showYearly ? cheapest.yearlyCost.total : cheapest.monthlyCost.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Stacked bar */}
            {(() => {
              const c = showYearly ? cheapest.yearlyCost : cheapest.monthlyCost;
              const total = c.total || 1;
              return (
                <div className="mt-4 h-3 rounded-full overflow-hidden flex">
                  <div className="transition-all duration-500" style={{ width: `${(c.spread / total) * 100}%`, background: 'var(--sfp-navy)' }} />
                  <div className="transition-all duration-500" style={{ width: `${(c.commission / total) * 100}%`, background: 'var(--sfp-gold)' }} />
                  <div className="bg-amber-400 transition-all duration-500" style={{ width: `${(c.overnight / total) * 100}%` }} />
                </div>
              );
            })()}
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--sfp-slate)' }}>
              {(() => {
                const c = showYearly ? cheapest.yearlyCost : cheapest.monthlyCost;
                const total = c.total || 1;
                return (
                  <>
                    <span>Spread ({Math.round((c.spread / total) * 100)}%)</span>
                    <span>Commission ({Math.round((c.commission / total) * 100)}%)</span>
                    <span>Overnight ({Math.round((c.overnight / total) * 100)}%)</span>
                  </>
                );
              })()}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h4 className="font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>
              Start trading with {cheapest.name}
            </h4>
            <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
              Save up to <span className="font-semibold" style={{ color: 'var(--sfp-green)' }}>${savings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/{showYearly ? 'year' : 'month'}</span> compared to the most expensive broker.
            </p>
            <Button asChild className="w-full hover:opacity-90" style={{ background: 'var(--sfp-gold)' }}>
              <a href={`/go/${cheapest.slug}`} target="_blank" rel="noopener noreferrer">
                Open Account Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Free to open. No minimum deposit required.
            </p>
          </div>

          {/* Methodology Note */}
          <p className="text-xs text-center" style={{ color: 'var(--sfp-slate)' }}>
            * Costs are estimates based on typical market conditions. Actual fees may vary.
          </p>
        </div>
      </div>
    </div>
  );
}

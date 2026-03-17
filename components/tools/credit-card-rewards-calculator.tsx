'use client';

import { useState, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  ShoppingCart,
  Plane,
  UtensilsCrossed,
  Trophy,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface CardConfig {
  name: string;
  shortName: string;
  annualFee: number;
  multipliers: { dining: number; groceries: number; travel: number; other: number };
  pointValue: number;
  annualCredits: number;
  welcomeBonus: number;
  affiliateSlug: string;
  color: string;
  bgColor: string;
}

const CARDS: CardConfig[] = [
  {
    name: 'Amex Gold',
    shortName: 'Amex Gold',
    annualFee: 250,
    multipliers: { dining: 4, groceries: 4, travel: 3, other: 1 },
    pointValue: 0.02,
    annualCredits: 240,
    welcomeBonus: 600,
    affiliateSlug: 'amex-gold',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.15)',
  },
  {
    name: 'Chase Sapphire Preferred',
    shortName: 'Chase Sapphire',
    annualFee: 95,
    multipliers: { dining: 3, groceries: 1, travel: 2, other: 1 },
    pointValue: 0.02,
    annualCredits: 0,
    welcomeBonus: 750,
    affiliateSlug: 'chase-sapphire-preferred',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.15)',
  },
  {
    name: 'No Annual Fee Card',
    shortName: 'No Fee Card',
    annualFee: 0,
    multipliers: { dining: 1.5, groceries: 1.5, travel: 1.5, other: 1.5 },
    pointValue: 0.01,
    annualCredits: 0,
    welcomeBonus: 200,
    affiliateSlug: '',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.15)',
  },
];

const formatUSD = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

interface CardResult {
  card: CardConfig;
  pointsByCategory: { dining: number; groceries: number; travel: number; other: number };
  totalPoints: number;
  totalPointsValue: number;
  netAnnualValue: number;
  firstYearValue: number;
}

export function CreditCardRewardsCalculator() {
  const [diningSpend, setDiningSpend] = useState(500);
  const [grocerySpend, setGrocerySpend] = useState(400);
  const [travelSpend, setTravelSpend] = useState(300);
  const [otherSpend, setOtherSpend] = useState(1000);

  const results: CardResult[] = useMemo(() => {
    return CARDS.map((card) => {
      const diningPoints = diningSpend * card.multipliers.dining * 12;
      const groceryPoints = grocerySpend * card.multipliers.groceries * 12;
      const travelPoints = travelSpend * card.multipliers.travel * 12;
      const otherPoints = otherSpend * card.multipliers.other * 12;

      const totalPoints = diningPoints + groceryPoints + travelPoints + otherPoints;
      const totalPointsValue = totalPoints * card.pointValue;
      const netAnnualValue = totalPointsValue + card.annualCredits - card.annualFee;
      const firstYearValue = netAnnualValue + card.welcomeBonus;

      return {
        card,
        pointsByCategory: {
          dining: diningPoints,
          groceries: groceryPoints,
          travel: travelPoints,
          other: otherPoints,
        },
        totalPoints,
        totalPointsValue,
        netAnnualValue,
        firstYearValue,
      };
    });
  }, [diningSpend, grocerySpend, travelSpend, otherSpend]);

  const winner = results.reduce((best, r) =>
    r.netAnnualValue > best.netAnnualValue ? r : best
  );

  const maxFirstYear = Math.max(...results.map((r) => r.firstYearValue));
  const maxOngoing = Math.max(...results.map((r) => r.netAnnualValue));
  const barMax = Math.max(maxFirstYear, maxOngoing, 1);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div
            className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--sfp-ink)' }}>
              <CreditCard className="h-5 w-5" style={{ color: 'var(--sfp-gold)' }} />
              Monthly Spending
            </h3>

            {/* Dining Spend */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <UtensilsCrossed className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Dining &amp; Restaurants
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                >
                  {formatUSD(diningSpend)}/mo
                </span>
              </div>
              <Slider
                value={[diningSpend]}
                onValueChange={(value) => setDiningSpend(value[0])}
                min={0}
                max={2000}
                step={50}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>$0</span>
                <span>$1,000</span>
                <span>$2,000</span>
              </div>
            </div>

            {/* Grocery Spend */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <ShoppingCart className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Groceries
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                >
                  {formatUSD(grocerySpend)}/mo
                </span>
              </div>
              <Slider
                value={[grocerySpend]}
                onValueChange={(value) => setGrocerySpend(value[0])}
                min={0}
                max={2000}
                step={50}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>$0</span>
                <span>$1,000</span>
                <span>$2,000</span>
              </div>
            </div>

            {/* Travel Spend */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <Plane className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Travel
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                >
                  {formatUSD(travelSpend)}/mo
                </span>
              </div>
              <Slider
                value={[travelSpend]}
                onValueChange={(value) => setTravelSpend(value[0])}
                min={0}
                max={3000}
                step={100}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>$0</span>
                <span>$1,500</span>
                <span>$3,000</span>
              </div>
            </div>

            {/* Other Spend */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--sfp-slate)' }}>
                  <DollarSign className="h-4 w-4" style={{ color: 'var(--sfp-slate)' }} />
                  Everything Else
                </label>
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                >
                  {formatUSD(otherSpend)}/mo
                </span>
              </div>
              <Slider
                value={[otherSpend]}
                onValueChange={(value) => setOtherSpend(value[0])}
                min={0}
                max={5000}
                step={100}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>$0</span>
                <span>$2,500</span>
                <span>$5,000</span>
              </div>
            </div>
          </div>

          {/* Total Monthly Spend */}
          <div
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sfp-slate)' }}>Total Monthly Spend</span>
              <span className="text-lg font-bold" style={{ color: 'var(--sfp-ink)' }}>
                {formatUSD(diningSpend + grocerySpend + travelSpend + otherSpend)}/mo
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>Annual Spend</span>
              <span className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>
                {formatUSD((diningSpend + grocerySpend + travelSpend + otherSpend) * 12)}/yr
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <div
            className="rounded-xl p-4 border border-gray-200"
            style={{ background: 'rgba(245,158,11,0.05)' }}
          >
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
              <div className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                <strong style={{ color: 'var(--sfp-gold)' }}>For illustration only.</strong> Actual rewards
                values depend on redemption method. Point valuations are estimates based on common
                transfer partner redemptions. Welcome bonuses require meeting minimum spend
                thresholds. Card terms and benefits subject to change.
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Winner Badge */}
          <div
            className="rounded-2xl p-6 text-white"
            style={{
              background: `linear-gradient(135deg, ${winner.card.color}dd, ${winner.card.color}88)`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5" />
              <span className="text-sm font-medium opacity-90">
                Best Card for Your Spending
              </span>
            </div>
            <div className="text-3xl md:text-4xl font-bold mb-1">{winner.card.name}</div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-2xl font-bold">{formatUSD(winner.netAnnualValue)}</span>
              <span className="text-sm opacity-80">net value / year</span>
            </div>
            <p className="text-sm opacity-80">
              First-year value with welcome bonus: {formatUSD(winner.firstYearValue)}
            </p>
          </div>

          {/* Bar Chart Comparison */}
          <div
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-6"
          >
            <h4 className="text-sm font-medium mb-5" style={{ color: 'var(--sfp-slate)' }}>
              Annual Value Comparison
            </h4>
            <div className="space-y-5">
              {results.map((r) => (
                <div key={r.card.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>{r.card.shortName}</span>
                    <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
                      {r.card.annualFee > 0 ? `${formatUSD(r.card.annualFee)}/yr fee` : 'No fee'}
                    </span>
                  </div>
                  {/* First Year Bar */}
                  <div className="mb-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] w-14" style={{ color: 'var(--sfp-slate)' }}>1st Year</span>
                      <div className="flex-1 h-5 rounded-full overflow-hidden bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(0, (r.firstYearValue / barMax) * 100)}%`,
                            background: r.card.color,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-semibold w-16 text-right"
                        style={{ color: r.card.color }}
                      >
                        {formatUSD(r.firstYearValue)}
                      </span>
                    </div>
                  </div>
                  {/* Ongoing Bar */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] w-14" style={{ color: 'var(--sfp-slate)' }}>Ongoing</span>
                      <div className="flex-1 h-5 rounded-full overflow-hidden bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(0, (r.netAnnualValue / barMax) * 100)}%`,
                            background: r.card.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-semibold w-16 text-right"
                        style={{ color: r.card.color }}
                      >
                        {formatUSD(r.netAnnualValue)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 text-[10px] mt-4 pt-3 border-t border-gray-200" style={{ color: 'var(--sfp-slate)' }}>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full opacity-70" style={{ background: '#94a3b8' }} /> First Year (incl. welcome bonus)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: '#94a3b8' }} /> Ongoing Annual Value
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div
            className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-sm font-medium" style={{ color: 'var(--sfp-slate)' }}>Detailed Breakdown</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium p-3" style={{ color: 'var(--sfp-slate)' }} />
                    {results.map((r) => (
                      <th
                        key={r.card.name}
                        className="text-center text-xs font-semibold p-3"
                        style={{ color: r.card.color }}
                      >
                        {r.card.shortName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>Dining Points</td>
                    {results.map((r) => (
                      <td key={r.card.name} className="p-3 text-center text-xs" style={{ color: 'var(--sfp-slate)' }}>
                        {r.pointsByCategory.dining.toLocaleString('en-US')}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>Grocery Points</td>
                    {results.map((r) => (
                      <td key={r.card.name} className="p-3 text-center text-xs" style={{ color: 'var(--sfp-slate)' }}>
                        {r.pointsByCategory.groceries.toLocaleString('en-US')}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>Travel Points</td>
                    {results.map((r) => (
                      <td key={r.card.name} className="p-3 text-center text-xs" style={{ color: 'var(--sfp-slate)' }}>
                        {r.pointsByCategory.travel.toLocaleString('en-US')}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>Other Points</td>
                    {results.map((r) => (
                      <td key={r.card.name} className="p-3 text-center text-xs" style={{ color: 'var(--sfp-slate)' }}>
                        {r.pointsByCategory.other.toLocaleString('en-US')}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 text-xs font-medium" style={{ color: 'var(--sfp-slate)' }}>Total Points</td>
                    {results.map((r) => (
                      <td key={r.card.name} className="p-3 text-center text-xs font-medium" style={{ color: 'var(--sfp-ink)' }}>
                        {r.totalPoints.toLocaleString('en-US')}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>Points Value</td>
                    {results.map((r) => (
                      <td key={r.card.name} className="p-3 text-center text-xs" style={{ color: 'var(--sfp-green)' }}>
                        {formatUSD(r.totalPointsValue)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>Annual Credits</td>
                    {results.map((r) => (
                      <td key={r.card.name} className="p-3 text-center text-xs" style={{ color: 'var(--sfp-green)' }}>
                        {r.card.annualCredits > 0 ? `+${formatUSD(r.card.annualCredits)}` : '--'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>Annual Fee</td>
                    {results.map((r) => (
                      <td key={r.card.name} className="p-3 text-center text-xs" style={{ color: 'var(--sfp-red)' }}>
                        {r.card.annualFee > 0 ? `-${formatUSD(r.card.annualFee)}` : '$0'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 text-xs font-medium" style={{ color: 'var(--sfp-slate)' }}>Net Annual Value</td>
                    {results.map((r) => (
                      <td
                        key={r.card.name}
                        className="p-3 text-center text-sm font-bold"
                        style={{ color: r.card.color }}
                      >
                        {formatUSD(r.netAnnualValue)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-xs" style={{ color: 'var(--sfp-slate)' }}>Welcome Bonus</td>
                    {results.map((r) => (
                      <td key={r.card.name} className="p-3 text-center text-xs" style={{ color: 'var(--sfp-navy)' }}>
                        +{formatUSD(r.card.welcomeBonus)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Affiliate CTA */}
          {winner.card.affiliateSlug && (
            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" style={{ color: 'var(--sfp-gold)' }} />
                <h4 className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                  Ready to earn {formatUSD(winner.firstYearValue)} in your first year?
                </h4>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
                Based on your spending, the {winner.card.name} is the best fit. Apply through our
                link to access the current welcome bonus offer.
              </p>
              <Button asChild className="w-full text-white font-semibold hover:opacity-90" style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}>
                <a href={`/go/${winner.card.affiliateSlug}`}>
                  Apply for {winner.card.name}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <p className="text-xs text-center mt-3" style={{ color: 'var(--sfp-slate)' }}>
                Terms apply. We may earn a commission if you apply through our links.
              </p>
            </div>
          )}

          {/* If no-fee card wins, show general CTA */}
          {!winner.card.affiliateSlug && (
            <div
              className="rounded-xl border border-gray-200 bg-white shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--sfp-green)' }} />
                <h4 className="font-semibold" style={{ color: 'var(--sfp-ink)' }}>
                  A no-fee card works best for your spending
                </h4>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--sfp-slate)' }}>
                At your current spending levels, a flat-rate cashback card with no annual fee
                provides the best net value. Try adjusting your dining or grocery spending to see
                when a premium card makes sense.
              </p>
              <Button asChild className="w-full text-white hover:opacity-90" style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}>
                <a href="/personal-finance">
                  Compare Credit Cards
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

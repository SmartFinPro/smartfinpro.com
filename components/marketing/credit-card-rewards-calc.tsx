'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  DollarSign,
  Plane,
  UtensilsCrossed,
  ShoppingBag,
  TrendingUp,
  Award,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface CardData {
  id: string;
  name: string;
  shortName: string;
  annualFee: number;
  welcomeBonus: number;
  welcomeBonusSpendReq: number;
  welcomeBonusMonths: number;
  diningMultiplier: number;
  travelMultiplier: number; // direct flights/hotels (non-portal)
  groceryMultiplier: number;
  transitMultiplier: number; // transit, parking, gas
  otherMultiplier: number;
  pointValue: number; // cents per point (conservative baseline)
  credits: { name: string; value: number }[];
  affiliateUrl: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  travelNote?: string; // optional tooltip about portal vs direct rates
}

// ============================================================
// Card Data
// ============================================================

// ============================================================
// 2026 Card Data (verified Feb 2026)
//
// Travel multipliers use DIRECT booking rates (non-portal).
// Portal rates (CSP 5x, CSR 8x) are noted but not used in
// the base calculation to avoid overestimating. The info note
// below the calculator mentions portal bonuses separately.
//
// Point values use conservative floor estimates:
//   - Amex MR: 1.0cpp (transfer avg ~1.5cpp, but 1.0 is baseline)
//   - Chase UR via CSP portal: 1.25cpp (guaranteed floor)
//   - Chase UR via CSR portal: 1.5cpp (guaranteed floor)
//
// Sources: chase.com, americanexpress.com, NerdWallet, TPG
// ============================================================

const cards: CardData[] = [
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    shortName: 'Amex Gold',
    annualFee: 325,
    welcomeBonus: 60000,
    welcomeBonusSpendReq: 6000,
    welcomeBonusMonths: 6,
    diningMultiplier: 4,       // 4x restaurants worldwide (cap: $50k/yr)
    travelMultiplier: 3,       // 3x flights booked direct w/ airlines
    groceryMultiplier: 4,      // 4x US supermarkets (cap: $25k/yr)
    transitMultiplier: 1,      // 1x transit/parking/gas
    otherMultiplier: 1,        // 1x everything else
    pointValue: 1.0,           // MR baseline; transfers can yield 1.5-2.0cpp
    credits: [
      { name: 'Dining Credit', value: 120 },
      { name: 'Uber Cash', value: 120 },
    ],
    affiliateUrl: '/go/amex-gold',
    accentColor: '#B8860B',
    gradientFrom: '#B8860B',
    gradientTo: '#8B6914',
    travelNote: '3x on flights booked direct. 2x on AmexTravel.com hotels.',
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    shortName: 'Chase Preferred',
    annualFee: 95,
    welcomeBonus: 60000,
    welcomeBonusSpendReq: 4000,
    welcomeBonusMonths: 3,
    diningMultiplier: 3,       // 3x dining, delivery, takeout
    travelMultiplier: 2,       // 2x other travel (non-portal)
    groceryMultiplier: 3,      // 3x online grocery delivery
    transitMultiplier: 2,      // 2x other travel incl. transit
    otherMultiplier: 1,        // 1x everything else
    pointValue: 1.25,          // 1.25cpp via Chase Travel portal (guaranteed floor)
    credits: [
      { name: 'Hotel Credit', value: 50 },
    ],
    affiliateUrl: '/go/chase-sapphire-preferred',
    accentColor: '#003087',
    gradientFrom: '#003087',
    gradientTo: '#001d54',
    travelNote: '5x via Chase Travel portal. 2x on other travel purchases.',
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    shortName: 'Chase Reserve',
    annualFee: 550,
    welcomeBonus: 60000,
    welcomeBonusSpendReq: 4000,
    welcomeBonusMonths: 3,
    diningMultiplier: 3,       // 3x dining
    travelMultiplier: 4,       // 4x direct flights & hotels
    groceryMultiplier: 1,      // 1x groceries
    transitMultiplier: 1,      // 1x transit/parking (down from 3x in old card)
    otherMultiplier: 1,        // 1x everything else
    pointValue: 1.5,           // 1.5cpp via Chase Travel portal (guaranteed floor)
    credits: [
      { name: 'Travel Credit', value: 300 },
    ],
    affiliateUrl: '/go/chase-sapphire-reserve',
    accentColor: '#1a1a2e',
    gradientFrom: '#2d2d5e',
    gradientTo: '#1a1a2e',
    travelNote: '8x via Chase Travel portal. 4x on direct airline & hotel bookings.',
  },
];

// ============================================================
// Spending Category Input
// ============================================================

interface SpendingInputProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
}

function SpendingInput({ label, icon, value, onChange }: SpendingInputProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border border-slate-700/50 transition-all hover:border-violet-500/30"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <label className="block text-xs text-slate-400 font-medium mb-1">{label}</label>
        <div className="relative">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
          <input
            type="number"
            min={0}
            max={50000}
            step={50}
            value={value || ''}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full bg-transparent text-white text-sm font-medium pl-4 pr-2 py-1 rounded border-0 outline-none focus:ring-1 focus:ring-violet-500/40"
            placeholder="0"
          />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600 text-xs">/mo</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Card Result Card
// ============================================================

interface CardResultProps {
  card: CardData;
  spending: { dining: number; travel: number; groceries: number; transit: number; other: number };
  rank: number;
  isWinner: boolean;
}

function CardResult({ card, spending, rank, isWinner }: CardResultProps) {
  const annualSpend = useMemo(() => {
    return {
      dining: spending.dining * 12,
      travel: spending.travel * 12,
      groceries: spending.groceries * 12,
      transit: spending.transit * 12,
      other: spending.other * 12,
    };
  }, [spending]);

  const points = useMemo(() => {
    return (
      annualSpend.dining * card.diningMultiplier +
      annualSpend.travel * card.travelMultiplier +
      annualSpend.groceries * card.groceryMultiplier +
      annualSpend.transit * card.transitMultiplier +
      annualSpend.other * card.otherMultiplier
    );
  }, [annualSpend, card]);

  const pointsValue = (points * card.pointValue) / 100;
  const creditsTotal = card.credits.reduce((sum, c) => sum + c.value, 0);
  const totalValue = pointsValue + creditsTotal;
  const netValue = totalValue - card.annualFee;

  // Fire tracking event
  const handleApply = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/track',
        JSON.stringify({
          type: 'event',
          data: {
            eventName: 'calculator_apply_click',
            eventCategory: 'credit-card-calculator',
            eventAction: 'click',
            eventLabel: card.id,
            pagePath: typeof window !== 'undefined' ? window.location.pathname : '',
          },
        })
      );
    }
  }, [card.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="relative rounded-2xl overflow-hidden border transition-all"
      style={{
        borderColor: isWinner ? 'rgba(139, 92, 246, 0.4)' : 'rgba(100, 116, 139, 0.2)',
        background: isWinner
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(15, 10, 26, 0.95))'
          : 'linear-gradient(135deg, rgba(15, 10, 26, 0.8), rgba(26, 15, 46, 0.4))',
        boxShadow: isWinner
          ? '0 8px 32px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
          : 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {isWinner && (
        <div
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, #8b5cf6, transparent)' }}
        />
      )}

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {isWinner && (
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(245, 158, 11, 0.15))' }}
              >
                <Award className="h-4 w-4 text-yellow-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{card.shortName}</h3>
                {isWinner && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full text-yellow-300 border border-yellow-500/30" style={{ background: 'rgba(250, 204, 21, 0.1)' }}>
                    Best Match
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">${card.annualFee}/yr annual fee</p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-2xl font-bold ${netValue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netValue >= 0 ? '+' : '-'}${Math.abs(Math.round(netValue))}
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Net Annual Value</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Points earned</span>
            <span className="text-slate-300 font-medium">{points.toLocaleString()} pts</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Points value ({card.pointValue}cpp)</span>
            <span className="text-slate-300 font-medium">${Math.round(pointsValue).toLocaleString()}</span>
          </div>
          {card.credits.map((credit) => (
            <div key={credit.name} className="flex justify-between text-sm">
              <span className="text-slate-400">{credit.name}</span>
              <span className="text-emerald-400 font-medium">+${credit.value}</span>
            </div>
          ))}
          <div className="h-px w-full my-1" style={{ background: 'rgba(100, 116, 139, 0.2)' }} />
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Annual fee</span>
            <span className="text-red-400 font-medium">-${card.annualFee}</span>
          </div>
        </div>

        {/* CTA */}
        <a
          href={card.affiliateUrl}
          target="_blank"
          rel="noopener sponsored"
          onClick={handleApply}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
          style={{
            background: isWinner
              ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
              : 'rgba(255,255,255,0.06)',
            color: isWinner ? '#fff' : '#94a3b8',
          }}
        >
          {isWinner ? 'Apply Now' : 'Learn More'}
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Calculator Component
// ============================================================

export function CreditCardRewardsCalc() {
  const [spending, setSpending] = useState({
    dining: 500,
    travel: 300,
    groceries: 400,
    transit: 150,
    other: 500,
  });

  const updateSpending = useCallback((key: keyof typeof spending, value: number) => {
    setSpending((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Calculate and rank cards
  const rankedCards = useMemo(() => {
    return cards
      .map((card) => {
        const annual = {
          dining: spending.dining * 12,
          travel: spending.travel * 12,
          groceries: spending.groceries * 12,
          transit: spending.transit * 12,
          other: spending.other * 12,
        };

        const points =
          annual.dining * card.diningMultiplier +
          annual.travel * card.travelMultiplier +
          annual.groceries * card.groceryMultiplier +
          annual.transit * card.transitMultiplier +
          annual.other * card.otherMultiplier;

        const pointsValue = (points * card.pointValue) / 100;
        const creditsTotal = card.credits.reduce((sum, c) => sum + c.value, 0);
        const netValue = pointsValue + creditsTotal - card.annualFee;

        return { card, netValue };
      })
      .sort((a, b) => b.netValue - a.netValue);
  }, [spending]);

  const totalMonthly = spending.dining + spending.travel + spending.groceries + spending.transit + spending.other;

  return (
    <div className="relative not-prose">
      {/* Background glow */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.08), transparent 70%)' }}
      />

      <div
        className="relative rounded-2xl overflow-hidden border border-violet-500/20"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 10, 26, 0.95), rgba(26, 15, 46, 0.6), rgba(15, 10, 26, 0.95))',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.3), 0 0 60px rgba(139, 92, 246, 0.06)',
        }}
      >
        {/* Top accent */}
        <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, #8b5cf6, transparent)' }} />

        {/* Header */}
        <div className="px-6 sm:px-8 pt-7 pb-5">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.15))' }}
            >
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Credit Card Rewards Calculator</h2>
              <p className="text-xs text-slate-500">Enter your monthly spending to find your best card</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 sm:mx-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)' }} />

        {/* Content */}
        <div className="px-6 sm:px-8 py-6">
          {/* Spending Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <SpendingInput
              label="Dining & Restaurants"
              icon={<UtensilsCrossed className="h-5 w-5 text-violet-400" />}
              value={spending.dining}
              onChange={(v) => updateSpending('dining', v)}
            />
            <SpendingInput
              label="Travel & Flights"
              icon={<Plane className="h-5 w-5 text-cyan-400" />}
              value={spending.travel}
              onChange={(v) => updateSpending('travel', v)}
            />
            <SpendingInput
              label="Groceries"
              icon={<ShoppingBag className="h-5 w-5 text-emerald-400" />}
              value={spending.groceries}
              onChange={(v) => updateSpending('groceries', v)}
            />
            <SpendingInput
              label="Transit & Gas"
              icon={<TrendingUp className="h-5 w-5 text-amber-400" />}
              value={spending.transit}
              onChange={(v) => updateSpending('transit', v)}
            />
            <SpendingInput
              label="Everything Else"
              icon={<DollarSign className="h-5 w-5 text-slate-400" />}
              value={spending.other}
              onChange={(v) => updateSpending('other', v)}
            />
            <div
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700/50"
              style={{ background: 'rgba(139, 92, 246, 0.03)' }}
            >
              <CreditCard className="h-5 w-5 text-violet-400" />
              <div>
                <p className="text-xs text-slate-500">Total Monthly</p>
                <p className="text-lg font-bold text-white">${totalMonthly.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 mb-6 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(6, 182, 212, 0.05)' }}>
            <Info className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1">
              <p>
                Travel rewards use <strong className="text-slate-300">direct booking rates</strong> (not portal). Chase Travel portal boosts: CSP 5x, CSR 8x. Welcome bonuses ($600-$1,500+) not included.
              </p>
              <p>
                Point values: Amex MR at 1.0cpp baseline (transfers can yield 1.5-2.0cpp). Chase UR at portal redemption floor (CSP 1.25cpp, CSR 1.5cpp).
              </p>
            </div>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            <motion.div
              key={JSON.stringify(spending)}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {rankedCards.map(({ card }, index) => (
                <CardResult
                  key={card.id}
                  card={card}
                  spending={spending}
                  rank={index}
                  isWinner={index === 0}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Disclaimer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-800/50">
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Affiliate Disclosure: SmartFinPro may receive compensation when you apply through our links. Point values are estimates based on average redemption rates. Actual value may vary by redemption method. Welcome bonus requirements and values subject to change. See card issuer sites for current terms.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CreditCardRewardsCalc;

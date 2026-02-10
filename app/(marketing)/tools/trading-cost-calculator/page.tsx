import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Lightbulb, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { TradingCostCalculator } from '@/components/tools/trading-cost-calculator';

export const metadata: Metadata = {
  title: 'Trading Cost Calculator - Compare Broker Fees | SmartFinPro',
  description: 'Free trading cost calculator. Compare spreads, commissions, and overnight fees across top brokers. See exactly how much you could save.',
  openGraph: {
    title: 'Trading Cost Calculator - Compare Broker Fees',
    description: 'Compare real trading costs across eToro, Capital.com, IBKR, and more. Free calculator.',
  },
};

export default function TradingCostCalculatorPage() {
  return (
    <div className="min-h-screen bg-[#0f0a1a]">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tools
        </Link>
      </div>

      {/* Hero */}
      <section className="relative py-8 md:py-12 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
              <BarChart3 className="h-4 w-4" />
              Free Calculator
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trading Cost Calculator
            </h1>
            <p className="text-lg text-slate-400">
              Compare real trading costs across top brokers. Adjust your trade size,
              frequency, and instruments to see exactly how much you could save.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <TradingCostCalculator />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.15)' }}>
                <Lightbulb className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Understanding Trading Costs
                </h2>
                <p className="text-slate-400">
                  Trading costs can significantly impact your returns over time. Our calculator
                  breaks down the three main cost components to help you make an informed decision.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(6,182,212,0.15)' }}>
                  <DollarSign className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Spreads</h3>
                <p className="text-sm text-slate-400">
                  The difference between buy and sell price. This is the primary cost for most retail traders.
                </p>
              </div>
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <TrendingUp className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Commissions</h3>
                <p className="text-sm text-slate-400">
                  Fixed fees per trade. Some brokers offer zero commissions but compensate with wider spreads.
                </p>
              </div>
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Overnight Fees</h3>
                <p className="text-sm text-slate-400">
                  Swap fees for holding positions overnight. These add up significantly for longer-term positions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calculator, Lightbulb, Shield, TrendingUp } from 'lucide-react';
import { WealthsimpleCalculator } from '@/components/tools/wealthsimple-calculator';

export const metadata: Metadata = {
  title: 'Wealthsimple Fee Calculator — How Much Could You Save? | SmartFinPro',
  description:
    'Calculate how much you could save by switching from traditional bank mutual funds to Wealthsimple. Compare fee drag over 10, 20, and 30 years with our free calculator.',
  openGraph: {
    title: 'Wealthsimple Fee Calculator — How Much Could You Save?',
    description:
      'Free calculator to estimate investment fee savings with Wealthsimple vs traditional banks.',
  },
};

export default function WealthsimpleCalculatorPage() {
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

      {/* Hero Section */}
      <section className="relative py-8 md:py-12 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
            >
              <Calculator className="h-4 w-4" />
              Free Calculator
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Wealthsimple Fee Savings Calculator
            </h1>
            <p className="text-lg text-slate-400">
              See how much investment fees are really costing you. Compare your current
              provider against Wealthsimple&apos;s low-fee plans and discover your potential
              savings over 10, 20, and 30 years.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <WealthsimpleCalculator />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.15)' }}
              >
                <Lightbulb className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Understanding Investment Fee Drag
                </h2>
                <p className="text-slate-400">
                  Investment fees compound against you over time, just like returns compound in
                  your favour. Even a small difference in annual fees can result in tens of
                  thousands of dollars lost over a long investment horizon. This is known as
                  &quot;fee drag&quot; and it&apos;s one of the biggest factors within your
                  control when investing.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div
                className="rounded-xl p-6 border border-slate-800/50"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  How Investment Fees Work
                </h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>
                    <strong className="text-slate-300">MER (Management Expense Ratio):</strong>{' '}
                    Annual fee charged by the fund, deducted from returns
                  </li>
                  <li>
                    <strong className="text-slate-300">Management Fee:</strong> Fee charged by
                    the platform for portfolio management
                  </li>
                  <li>
                    <strong className="text-slate-300">Fee Drag:</strong> The compounding
                    effect of fees reducing your long-term returns
                  </li>
                  <li>
                    <strong className="text-slate-300">Total Cost:</strong> MER + management
                    fee = your true annual cost of investing
                  </li>
                </ul>
              </div>
              <div
                className="rounded-xl p-6 border border-slate-800/50"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-emerald-400" />
                  The Wealthsimple Advantage
                </h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>
                    <strong className="text-slate-300">Self-Directed:</strong> 0% management
                    fee — only pay ETF MERs (~0.20%)
                  </li>
                  <li>
                    <strong className="text-slate-300">Managed Core:</strong> 0.5% management
                    fee with automated portfolio rebalancing
                  </li>
                  <li>
                    <strong className="text-slate-300">Managed Premium:</strong> 0.4%
                    management fee for balances over C$100K
                  </li>
                  <li>
                    <strong className="text-slate-300">No minimums:</strong> Start investing
                    with any amount, no account minimum required
                  </li>
                </ul>
              </div>
            </div>

            <div
              className="rounded-xl p-6 border border-emerald-500/20"
              style={{ background: 'rgba(16,185,129,0.08)' }}
            >
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-emerald-400 mb-1">
                    Your Privacy Matters
                  </h3>
                  <p className="text-sm text-slate-400">
                    This calculator runs entirely in your browser. No personal information is
                    collected, stored, or transmitted. Your financial data stays on your
                    device.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

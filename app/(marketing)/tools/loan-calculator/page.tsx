import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calculator, Lightbulb, Shield } from 'lucide-react';
import { LoanCalculator } from '@/components/tools/loan-calculator';

export const metadata: Metadata = {
  title: 'Loan Calculator - Calculate Monthly Payments & Interest | SmartFinPro',
  description: 'Free loan calculator with amortization schedule. Calculate monthly payments, total interest, and payoff date for personal loans, debt consolidation, and more.',
  openGraph: {
    title: 'Loan Calculator - Calculate Monthly Payments & Interest',
    description: 'Free calculator to estimate loan payments and see full amortization schedule.',
  },
};

export default function LoanCalculatorPage() {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
              <Calculator className="h-4 w-4" />
              Free Calculator
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Loan Calculator
            </h1>
            <p className="text-lg text-slate-400">
              Calculate your monthly payments, total interest, and see a detailed
              amortization schedule for any loan amount.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <LoanCalculator />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <Lightbulb className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Understanding Loan Calculations
                </h2>
                <p className="text-slate-400">
                  Our calculator uses the standard amortization formula to compute your monthly payments.
                  This gives you an accurate estimate of what you'll pay each month and over the life of the loan.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="font-semibold text-white mb-3">Loan Types Supported</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Personal loans (6.99% - 35.99% APR)</li>
                  <li>Debt consolidation (5.99% - 29.99% APR)</li>
                  <li>Home improvement (6.49% - 24.99% APR)</li>
                  <li>Emergency loans (8.99% - 35.99% APR)</li>
                </ul>
              </div>
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="font-semibold text-white mb-3">What You&apos;ll See</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Monthly payment amount</li>
                  <li>Total interest paid</li>
                  <li>Full amortization schedule</li>
                  <li>Payoff date estimate</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl p-6 border border-emerald-500/20" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-emerald-400 mb-1">Your Privacy Matters</h3>
                  <p className="text-sm text-slate-400">
                    This calculator runs entirely in your browser. No personal information is collected,
                    stored, or transmitted. Your financial data stays on your device.
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

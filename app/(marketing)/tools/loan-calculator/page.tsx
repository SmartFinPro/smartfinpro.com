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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tools
        </Link>
      </div>

      {/* Hero Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Calculator className="h-4 w-4" />
              Free Calculator
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Loan Calculator
            </h1>
            <p className="text-lg text-slate-600">
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
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Lightbulb className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  Understanding Loan Calculations
                </h2>
                <p className="text-slate-600">
                  Our calculator uses the standard amortization formula to compute your monthly payments.
                  This gives you an accurate estimate of what you'll pay each month and over the life of the loan.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">Loan Types Supported</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Personal loans (6.99% - 35.99% APR)</li>
                  <li>• Debt consolidation (5.99% - 29.99% APR)</li>
                  <li>• Home improvement (6.49% - 24.99% APR)</li>
                  <li>• Emergency loans (8.99% - 35.99% APR)</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">What You'll See</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Monthly payment amount</li>
                  <li>• Total interest paid</li>
                  <li>• Full amortization schedule</li>
                  <li>• Payoff date estimate</li>
                </ul>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-emerald-800 mb-1">Your Privacy Matters</h3>
                  <p className="text-sm text-emerald-700">
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

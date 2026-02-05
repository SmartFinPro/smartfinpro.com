import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Scale, Lightbulb, Shield } from 'lucide-react';
import { BrokerComparison } from '@/components/tools/broker-comparison';

export const metadata: Metadata = {
  title: 'Broker Comparison Tool - Compare Forex & CFD Brokers | SmartFinPro',
  description: 'Compare forex and CFD brokers side by side. Filter by regulation, features, minimum deposit, and spreads to find the best broker for your trading needs.',
  openGraph: {
    title: 'Broker Comparison Tool - Compare Forex & CFD Brokers',
    description: 'Free tool to compare trading brokers by features, regulation, and costs.',
  },
};

export default function BrokerComparisonPage() {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-6">
              <Scale className="h-4 w-4" />
              Comparison Tool
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Broker Comparison
            </h1>
            <p className="text-lg text-slate-600">
              Compare top forex and CFD brokers side by side. Filter by your
              market, features, and find the best broker for your needs.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Tool */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <BrokerComparison />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Lightbulb className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  How We Compare Brokers
                </h2>
                <p className="text-slate-600">
                  We evaluate brokers based on regulation, trading costs, platform features,
                  and user experience. Our comparisons are updated regularly to reflect
                  current offerings.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">What We Consider</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Regulatory status and licenses</li>
                  <li>• Spreads and trading costs</li>
                  <li>• Available trading platforms</li>
                  <li>• Minimum deposit requirements</li>
                  <li>• Additional features (copy trading, etc.)</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-2">Regulation Bodies</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• ASIC (Australia)</li>
                  <li>• FCA (United Kingdom)</li>
                  <li>• CySEC (Cyprus/EU)</li>
                  <li>• CIMA (Cayman Islands)</li>
                  <li>• FSA (Seychelles)</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">Important Notice</h3>
                  <p className="text-sm text-blue-700">
                    Trading CFDs and forex involves significant risk. Only trade with money you can
                    afford to lose. This comparison is for informational purposes only and does not
                    constitute financial advice. Always do your own research before choosing a broker.
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

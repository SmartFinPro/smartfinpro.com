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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
              <Scale className="h-4 w-4" />
              Comparison Tool
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Broker Comparison
            </h1>
            <p className="text-lg text-slate-400">
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
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
                <Lightbulb className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  How We Compare Brokers
                </h2>
                <p className="text-slate-400">
                  We evaluate brokers based on regulation, trading costs, platform features,
                  and user experience. Our comparisons are updated regularly to reflect
                  current offerings.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="font-semibold text-white mb-3">What We Consider</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Regulatory status and licenses</li>
                  <li>Spreads and trading costs</li>
                  <li>Available trading platforms</li>
                  <li>Minimum deposit requirements</li>
                  <li>Additional features (copy trading, etc.)</li>
                </ul>
              </div>
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="font-semibold text-white mb-3">Regulation Bodies</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>ASIC (Australia)</li>
                  <li>FCA (United Kingdom)</li>
                  <li>CySEC (Cyprus/EU)</li>
                  <li>CIMA (Cayman Islands)</li>
                  <li>FSA (Seychelles)</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl p-6 border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.08)' }}>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-400 mb-1">Important Notice</h3>
                  <p className="text-sm text-slate-400">
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

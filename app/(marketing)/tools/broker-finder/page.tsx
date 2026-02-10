import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Target, Lightbulb, Shield, Zap, Users } from 'lucide-react';
import { BrokerFinderQuiz } from '@/components/tools/broker-finder-quiz';

export const metadata: Metadata = {
  title: 'Broker Finder Quiz - Find Your Perfect Trading Platform | SmartFinPro',
  description: 'Answer 5 quick questions and get personalized broker recommendations with match scores. Compare eToro, Capital.com, IBKR, and more.',
  openGraph: {
    title: 'Broker Finder Quiz - Find Your Perfect Trading Platform',
    description: 'Personalized broker recommendations in under a minute. Free quiz, no sign-up required.',
  },
};

export default function BrokerFinderPage() {
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
              <Target className="h-4 w-4" />
              5 Questions, 60 Seconds
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Find Your Perfect Broker
            </h1>
            <p className="text-lg text-slate-400">
              Answer 5 quick questions about your trading style and goals.
              We&apos;ll match you with the best platform from our tested selection.
            </p>
          </div>
        </div>
      </section>

      {/* Quiz */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <BrokerFinderQuiz />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(6,182,212,0.15)' }}>
                <Lightbulb className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  How Our Matching Works
                </h2>
                <p className="text-slate-400">
                  Our algorithm scores each broker across 5 dimensions based on your answers,
                  then ranks them by overall fit. All brokers are independently reviewed by our team.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(6,182,212,0.15)' }}>
                  <Shield className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">All Regulated</h3>
                <p className="text-sm text-slate-400">
                  Every broker in our selection is regulated by tier-1 authorities (FCA, SEC, ASIC, CIRO).
                </p>
              </div>
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <Zap className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Independently Tested</h3>
                <p className="text-sm text-slate-400">
                  Our team opens live accounts and tests each platform before recommending it.
                </p>
              </div>
              <div className="rounded-xl p-6 border border-slate-800/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <Users className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Personalized Results</h3>
                <p className="text-sm text-slate-400">
                  Results are tailored to your experience, goals, budget, and preferred instruments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

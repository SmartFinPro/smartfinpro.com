import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Lightbulb, AlertTriangle, Shield } from 'lucide-react';
import { DynamicCreditCardRewardsCalculator } from '@/components/tools/dynamic-calculators';
import { ToolRelatedReviews } from '@/components/marketing/tool-related-reviews';

export const metadata: Metadata = {
  title: 'Credit Card Rewards Calculator 2026: Find Your Best Card | SmartFinPro',
  description:
    'Free credit card rewards calculator. Compare Amex Gold, Chase Sapphire Preferred, and cashback cards side by side. See which card earns the most based on your spending habits.',
  openGraph: {
    title: 'Credit Card Rewards Calculator — Find Your Best Rewards Card',
    description:
      'Compare credit card rewards based on your actual spending. See first-year bonuses, ongoing value, and the best card for your wallet.',
  },
};

export default function CreditCardRewardsCalculatorPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sfp-gray)' }}>
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--sfp-slate)' }}
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
              style={{ background: 'var(--sfp-sky)', color: 'var(--sfp-gold)' }}
            >
              <CreditCard className="h-4 w-4" />
              US Credit Cards
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--sfp-ink)' }}>
              Credit Card Rewards Calculator
            </h1>
            <p className="text-lg" style={{ color: 'var(--sfp-slate)' }}>
              Find the best credit card for your spending habits. Compare the Amex Gold, Chase
              Sapphire Preferred, and flat-rate cashback cards side by side to see which one puts
              the most money back in your pocket.
            </p>
            <p className="text-sm mt-3" style={{ color: 'var(--sfp-slate)' }}>
              Adjust your monthly spending to see real-time results with first-year bonuses and
              ongoing annual value
            </p>
          </div>
        </div>
      </section>

      {/* Affiliate Disclosure */}
      <div className="container mx-auto mb-8 px-4 py-2.5 rounded-lg border border-gray-200 text-xs bg-white shadow-sm" style={{ color: 'var(--sfp-slate)' }}>
        <strong style={{ color: 'var(--sfp-ink)' }}>Disclosure:</strong> SmartFinPro may earn a commission when you sign up through links on this page. This does not affect our tool results or editorial independence.{' '}
        <Link href="/affiliate-disclosure" className="hover:underline" style={{ color: 'var(--sfp-navy)' }}>Learn more</Link>
      </div>

      {/* Calculator */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <DynamicCreditCardRewardsCalculator />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--sfp-sky)' }}
              >
                <Lightbulb className="h-6 w-6" style={{ color: 'var(--sfp-gold)' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>
                  How Credit Card Rewards Work
                </h2>
                <p style={{ color: 'var(--sfp-slate)' }}>
                  Credit cards earn points or cashback on every purchase, with bonus multipliers in
                  categories like dining, groceries, and travel. Premium cards charge annual fees but
                  offer higher earn rates and perks that can far outweigh the cost for the right
                  spender.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>Points vs. Cashback</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Points (MR/UR):</strong> Transferable to
                    airline and hotel partners for potentially higher value (2+ cents per point)
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Cashback:</strong> Simple 1-1.5% back with no
                    effort required and no transfer partner complexity
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Welcome Bonuses:</strong> Large one-time point
                    bonuses that can be worth hundreds of dollars in the first year
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Annual Credits:</strong> Some premium cards
                    offer dining, travel, or streaming credits that offset the annual fee
                  </li>
                </ul>
              </div>
              <div className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--sfp-ink)' }}>Choosing the Right Card</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>High Dining/Groceries:</strong> Amex Gold
                    shines with 4x earning in both categories plus $240 in annual credits
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Travel Focus:</strong> Chase Sapphire Preferred
                    offers strong travel multipliers with a lower annual fee
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Low Spend:</strong> A no-fee flat-rate cashback
                    card avoids annual fees that eat into rewards at lower spending levels
                  </li>
                  <li>
                    <strong style={{ color: 'var(--sfp-ink)' }}>Net Value:</strong> Always calculate net
                    value (rewards - fees) not just total points earned
                  </li>
                </ul>
              </div>
            </div>

            {/* Disclaimer */}
            <div
              className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm mb-6"
              style={{ borderLeftWidth: '4px', borderLeftColor: 'var(--sfp-gold)' }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-gold)' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-gold)' }}>Important Information</h3>
                  <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    This calculator provides estimates for comparison purposes only. Actual rewards
                    values depend on how you redeem points. Point valuations assume optimal
                    transfer partner redemptions and may vary. Welcome bonus amounts and annual fee
                    amounts are subject to change. Always review the latest card terms on the
                    issuer&apos;s website before applying. We may receive compensation when you apply
                    through our links.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div
              className="rounded-xl p-6 border border-gray-200 bg-white shadow-sm"
              style={{ borderLeftWidth: '4px', borderLeftColor: 'var(--sfp-green)' }}
            >
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--sfp-green)' }} />
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--sfp-green)' }}>Your Privacy Matters</h3>
                  <p className="text-sm" style={{ color: 'var(--sfp-slate)' }}>
                    This calculator runs entirely in your browser. No personal or financial
                    information is collected, stored, or transmitted. Your data stays on your device.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related US Credit Card Reviews */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <ToolRelatedReviews
            title="Credit Card Reviews"
            subtitle="Read our expert reviews of the cards featured in this calculator."
            reviews={[
              { name: 'Amex Gold Card Review', href: '/personal-finance/amex-gold-card-review', rating: 4.8, badge: 'Best Rewards' },
              { name: 'Chase Sapphire Preferred', href: '/personal-finance/chase-sapphire-preferred-review', rating: 4.7, badge: 'Best Travel' },
              { name: 'Chase Sapphire Reserve', href: '/personal-finance/chase-sapphire-reserve-review', rating: 4.6 },
              { name: 'Credit Card Comparison', href: '/personal-finance/credit-cards-comparison', badge: '2026 Rankings' },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

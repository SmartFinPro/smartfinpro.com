'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Market, marketConfig, markets, marketCategories, categoryConfig } from '@/lib/i18n/config';
import { Globe } from 'lucide-react';

interface FooterProps {
  market?: Market;
}

const brokerReviews = [
  { name: 'eToro Review', slug: 'etoro' },
  { name: 'Capital.com Review', slug: 'capital-com' },
  { name: 'IBKR Review', slug: 'ibkr' },
  { name: 'Investing.com Review', slug: 'investing' },
  { name: 'Revolut Review', slug: 'revolut' },
];

const toolLinks = [
  { name: 'Broker Finder Quiz', href: '/tools/broker-finder' },
  { name: 'Trading Cost Calculator', href: '/tools/trading-cost-calculator' },
  { name: 'Fee Savings Calculator', href: '/tools/wealthsimple-calculator' },
  { name: 'AI ROI Calculator', href: '/tools/ai-roi-calculator' },
  { name: 'Loan Calculator', href: '/tools/loan-calculator' },
  { name: 'Broker Comparison', href: '/tools/broker-comparison' },
];

const resourceLinks = [
  { name: 'TradingView Platform', href: '/trading-platforms/tradingview' },
  { name: 'AI Finance Workflow', href: '/downloads/ai-finance-workflow' },
  { name: 'All Tools', href: '/tools' },
];

const socialLinks = [
  { name: 'LinkedIn', href: 'https://linkedin.com/company/smartfinpro' },
  { name: 'YouTube', href: 'https://youtube.com/@smartfinpro' },
  { name: 'Instagram', href: 'https://instagram.com/smartfinpro' },
  { name: 'X', href: 'https://twitter.com/smartfinpro' },
  { name: 'Facebook', href: 'https://facebook.com/smartfinpro' },
];

// Detect market from pathname
function detectMarket(pathname: string): Market {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && markets.includes(firstSegment as Market)) {
    return firstSegment as Market;
  }
  return 'us';
}

export function Footer({ market: marketProp }: FooterProps) {
  const pathname = usePathname();
  const market = marketProp || detectMarket(pathname);
  const prefix = market === 'us' ? '' : `/${market}`;
  const availableCategories = marketCategories[market] || marketCategories.us;

  return (
    <footer className="bg-[#0f0a1a]">
      {/* Newsletter Section */}
      <div className="border-b border-violet-500/20">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-lg">
              <h3 className="text-lg font-bold text-white mb-2">Join our newsletter</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Distributed monthly, it includes product news, new applications,
                case studies, events, and discounts. Unsubscribe anytime.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-3 bg-transparent border border-slate-700 rounded text-white placeholder-slate-500 text-sm min-w-[280px] focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <button className="px-6 py-3 border border-cyan-400 text-cyan-400 rounded text-sm font-medium hover:bg-cyan-400 hover:text-slate-900 transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-slate-500 sm:max-w-[200px]">
                By subscribing you agree to our{' '}
                <Link href="/privacy" className="text-cyan-400 underline hover:text-cyan-300">
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="border-b border-slate-800/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-5">
            {/* Categories (market-aware) */}
            <div>
              <h4 className="font-semibold text-slate-200 text-sm mb-5">Categories</h4>
              <ul className="space-y-3">
                {availableCategories.map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`${prefix}/${cat}`}
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {categoryConfig[cat].name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Market Overviews (market-aware) */}
            <div>
              <h4 className="font-semibold text-slate-200 text-sm mb-5">Overviews</h4>
              <ul className="space-y-3">
                {availableCategories.map((cat) => (
                  <li key={`overview-${cat}`}>
                    <Link
                      href={`${prefix}/${cat}/overview`}
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {categoryConfig[cat].name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reviews (market-aware) */}
            <div>
              <h4 className="font-semibold text-slate-200 text-sm mb-5">Reviews</h4>
              <ul className="space-y-3">
                {brokerReviews.map((review) => (
                  <li key={review.slug}>
                    <Link
                      href={`${prefix}/reviews/${review.slug}`}
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {review.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tools */}
            <div>
              <h4 className="font-semibold text-slate-200 text-sm mb-5">Tools</h4>
              <ul className="space-y-3">
                {toolLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-slate-200 text-sm mb-5">Resources</h4>
              <ul className="space-y-3">
                {resourceLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-slate-200 text-sm mb-5">Social</h4>
              <ul className="space-y-3">
                {socialLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Logo */}
          <Link href={prefix || '/'} className="text-xl font-bold text-white">
            Smart<span className="text-cyan-400">Fin</span>Pro
          </Link>

          {/* Bottom Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Globe className="h-4 w-4" />
              <span>{marketConfig[market].name}</span>
            </div>
            <Link
              href="/privacy"
              className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-sm text-slate-600">
              &copy; {new Date().getFullYear()} SmartFinPro. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

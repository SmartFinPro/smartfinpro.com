'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Market, marketConfig, markets } from '@/lib/i18n/config';

interface FooterProps {
  market?: Market;
}

const footerLinks = {
  categories: {
    title: 'Categories',
    links: [
      { name: 'AI Tools', href: '/ai-tools' },
      { name: 'Cybersecurity', href: '/cybersecurity' },
      { name: 'Personal Finance', href: '/personal-finance' },
      { name: 'Trading', href: '/trading' },
      { name: 'Business Banking', href: '/business-banking' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { name: 'Blog', href: '/resources' },
      { name: 'Tools', href: '/tools' },
      { name: 'Calculators', href: '/tools/calculators' },
      { name: 'Comparisons', href: '/compare' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Careers', href: '/careers' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Affiliate Disclosure', href: '/affiliate-disclosure' },
      { name: 'Disclaimer', href: '/disclaimer' },
      { name: 'Cookie Policy', href: '/cookies' },
    ],
  },
};

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

  return (
    <footer className="border-t border-slate-800/50 bg-slate-950">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href={prefix || '/'} className="text-xl font-bold text-white">
              Smart<span className="text-emerald-400">Fin</span>Pro
            </Link>
            <p className="mt-4 text-sm text-slate-400 max-w-xs leading-relaxed">
              SmartFinPro helps finance professionals make smarter decisions
              with AI-powered tools and trusted reviews.
            </p>
            {/* Market Badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              {Object.entries(marketConfig).map(([key, config]) => (
                <Link
                  key={key}
                  href={key === 'us' ? '/' : `/${key}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:border-emerald-500/50 hover:text-slate-300 transition-colors"
                >
                  <span>{config.flag}</span>
                  <span>{key.toUpperCase()}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="font-semibold text-sm text-slate-200">{section.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={`${prefix}${link.href}`}
                      className="text-sm text-slate-500 hover:text-emerald-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Affiliate Disclosure */}
        <div className="mt-12 rounded-xl bg-slate-900/50 border border-slate-800/50 p-5">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Affiliate Disclosure:</strong> SmartFinPro may earn a
            commission when you click links and make a purchase. This does not
            affect our editorial independence. Learn more in our{' '}
            <Link href="/affiliate-disclosure" className="text-emerald-400 hover:underline">
              Affiliate Disclosure
            </Link>
            .
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-800/50 pt-8 md:flex-row">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} SmartFinPro. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="https://twitter.com/smartfinpro"
              className="text-slate-600 hover:text-emerald-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">Twitter</span>
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </Link>
            <Link
              href="https://linkedin.com/company/smartfinpro"
              className="text-slate-600 hover:text-emerald-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">LinkedIn</span>
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </Link>
            <Link
              href="https://youtube.com/@smartfinpro"
              className="text-slate-600 hover:text-emerald-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">YouTube</span>
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

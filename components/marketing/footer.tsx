// components/marketing/footer.tsx
// ============================================================
// GlobalTrustFooter — E-E-A-T Trust Footer with Silo Isolation
// Reads all links from config/navigation.ts (Single Source of Truth)
// ============================================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import type { Market } from '@/lib/i18n/config';
import { marketConfig } from '@/lib/i18n/config';
import {
  detectMarketFromPath,
  getMarketPrefix,
  getAllSiloCategoryLinks,
  getSiloToolLinks,
  trustLinks,
  hubLinks,
  socialLinks,
  marketSiloConfig,
} from '@/config/navigation';

interface FooterProps {
  market?: Market;
}

export function Footer({ market: marketProp }: FooterProps) {
  const pathname = usePathname();
  const market = marketProp || detectMarketFromPath(pathname);
  const prefix = getMarketPrefix(market);
  const siloCategoryLinks = getAllSiloCategoryLinks(market);
  const siloToolLinks = getSiloToolLinks(market);
  const featuredLinks = marketSiloConfig[market]?.featured || [];

  return (
    <footer style={{ background: 'var(--sfp-ink)' }}>
      {/* ── Newsletter Section ─────────────────────────────────── */}
      <div className="border-b border-white/15">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-lg">
              <h3 className="text-lg font-bold text-white mb-2">Join our newsletter</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Expert insights on personal finance, trading, and AI tools.
                Delivered monthly. Unsubscribe anytime.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-3 bg-white/10 border border-white/30 rounded text-white placeholder-white/50 text-sm min-w-[280px] focus:outline-none focus:border-white/60 transition-colors"
                />
                <button
                  className="px-6 py-3 rounded text-sm font-bold text-white uppercase tracking-wide transition-colors whitespace-nowrap"
                  style={{ background: 'var(--sfp-gold)' }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--sfp-gold-dark)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'var(--sfp-gold)')}
                >
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-white/50 sm:max-w-[200px]">
                By subscribing you agree to our{' '}
                <Link href="/privacy" className="underline hover:text-white/90" style={{ color: 'var(--sfp-gold)' }}>
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ──────────────────────────────────── */}
      <div className="border-b border-white/15">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">

            {/* Column 1: Trust & Legal (E-E-A-T) */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-5">Trust & Legal</h4>
              <ul className="space-y-3">
                {trustLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: '#AAAAAA' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#AAAAAA')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Dynamic Categories (silo-isolated) */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-5">
                {marketConfig[market].name} Categories
              </h4>
              <ul className="space-y-3">
                {siloCategoryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: '#AAAAAA' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#AAAAAA')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Featured (market-specific) */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-5">Featured</h4>
              <ul className="space-y-3">
                {featuredLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: '#AAAAAA' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#AAAAAA')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {/* Cross-market hubs */}
                {hubLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: '#AAAAAA' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#AAAAAA')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Tools */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-5">Tools</h4>
              <ul className="space-y-3">
                {siloToolLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: '#AAAAAA' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#AAAAAA')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 5: Social */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-5">Social</h4>
              <ul className="space-y-3">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-colors"
                      style={{ color: '#AAAAAA' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#AAAAAA')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ────────────────────────────────────────── */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Logo */}
          <Link href={prefix || '/'} className="text-xl font-bold text-white">
            Smart<span style={{ color: 'var(--sfp-gold)' }}>Fin</span>Pro
          </Link>

          {/* Bottom Links + Copyright */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-sm" style={{ color: '#AAAAAA' }}>
              <Globe className="h-4 w-4" />
              <span>{marketConfig[market].name}</span>
            </div>
            <Link href="/privacy" className="text-sm transition-colors" style={{ color: '#AAAAAA' }}>
              Privacy
            </Link>
            <Link href="/terms" className="text-sm transition-colors" style={{ color: '#AAAAAA' }}>
              Terms
            </Link>
            <Link href="/affiliate-disclosure" className="text-sm transition-colors" style={{ color: '#AAAAAA' }}>
              Disclosure
            </Link>
            <Link href="/imprint" className="text-sm transition-colors" style={{ color: '#AAAAAA' }}>
              Imprint
            </Link>
            <span className="text-sm text-white/40" suppressHydrationWarning>
              &copy; {new Date().getFullYear()} SmartFinPro. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

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
    <footer style={{ background: 'var(--sfp-gray)', borderTop: '1px solid var(--border)' }}>
      {/* ── Newsletter Section ─────────────────────────────────── */}
      <div className="border-b border-[#E2E8F0]">
        <div className="mx-auto max-w-[1200px] px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-lg">
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--sfp-ink)' }}>Join our newsletter</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
                Expert insights on personal finance, trading, and AI tools.
                Delivered monthly. Unsubscribe anytime.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-3 bg-white border border-[#E2E8F0] rounded text-sm min-w-[280px] focus:outline-none focus:border-[var(--sfp-navy)] transition-colors"
                  style={{ color: 'var(--sfp-ink)' }}
                />
                <button
                  className="px-6 py-3 rounded text-sm font-bold text-white uppercase tracking-wide transition-colors whitespace-nowrap"
                  style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--sfp-gold-dark)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'var(--sfp-gold)')}
                >
                  Subscribe
                </button>
              </div>
              <p className="text-xs sm:max-w-[200px]" style={{ color: 'var(--sfp-slate)' }}>
                By subscribing you agree to our{' '}
                <Link href="/privacy" className="underline" style={{ color: 'var(--sfp-navy)' }}>
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ──────────────────────────────────── */}
      <div className="border-b border-[#E2E8F0]">
        <div className="mx-auto max-w-[1200px] px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">

            {/* Column 1: Trust & Legal (E-E-A-T) */}
            <div>
              <h4 className="font-semibold text-sm mb-5" style={{ color: 'var(--sfp-ink)' }}>Trust & Legal</h4>
              <ul className="space-y-3">
                {trustLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: 'var(--sfp-slate)' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sfp-ink)')}
                      onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sfp-slate)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Dynamic Categories (silo-isolated) */}
            <div>
              <h4 className="font-semibold text-sm mb-5" style={{ color: 'var(--sfp-ink)' }}>
                {marketConfig[market].name} Categories
              </h4>
              <ul className="space-y-3">
                {siloCategoryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: 'var(--sfp-slate)' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sfp-ink)')}
                      onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sfp-slate)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Featured (market-specific) */}
            <div>
              <h4 className="font-semibold text-sm mb-5" style={{ color: 'var(--sfp-ink)' }}>Featured</h4>
              <ul className="space-y-3">
                {featuredLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: 'var(--sfp-slate)' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sfp-ink)')}
                      onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sfp-slate)')}
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
                      style={{ color: 'var(--sfp-slate)' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sfp-ink)')}
                      onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sfp-slate)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Tools */}
            <div>
              <h4 className="font-semibold text-sm mb-5" style={{ color: 'var(--sfp-ink)' }}>Tools</h4>
              <ul className="space-y-3">
                {siloToolLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: 'var(--sfp-slate)' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sfp-ink)')}
                      onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sfp-slate)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 5: Social */}
            <div>
              <h4 className="font-semibold text-sm mb-5" style={{ color: 'var(--sfp-ink)' }}>Social</h4>
              <ul className="space-y-3">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-colors"
                      style={{ color: 'var(--sfp-slate)' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sfp-ink)')}
                      onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sfp-slate)')}
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
      <div className="mx-auto max-w-[1200px] px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Logo */}
          <Link href={prefix || '/'} className="flex items-center gap-2">
            <span className="flex items-center justify-center w-[22px] h-[22px] rounded-[5px] flex-shrink-0" style={{ background: 'var(--sfp-navy)' }}>
              <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" width="13" height="13">
                <rect x="6.5" y="1" width="5" height="16" rx="1.5" fill="#FFC942"/>
                <rect x="1" y="6.5" width="16" height="5" rx="1.5" fill="#FFC942"/>
              </svg>
            </span>
            <span className="text-base font-bold tracking-[-0.4px]" style={{ color: 'var(--sfp-ink)' }}>
              Smart<span style={{ color: 'var(--sfp-navy)' }}>Fin</span>Pro
            </span>
          </Link>

          {/* Bottom Links + Copyright */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--sfp-slate)' }}>
              <Globe className="h-4 w-4" />
              <span>{marketConfig[market].name}</span>
            </div>
            <Link href="/privacy" className="text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sfp-ink)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sfp-slate)')}>
              Privacy
            </Link>
            <Link href="/terms" className="text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sfp-ink)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sfp-slate)')}>
              Terms
            </Link>
            <Link href="/affiliate-disclosure" className="text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sfp-ink)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sfp-slate)')}>
              Disclosure
            </Link>
            <Link href="/imprint" className="text-sm transition-colors" style={{ color: 'var(--sfp-slate)' }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--sfp-ink)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sfp-slate)')}>
              Imprint
            </Link>
            <span className="text-sm" style={{ color: 'var(--sfp-slate)' }} suppressHydrationWarning>
              &copy; {new Date().getFullYear()} SmartFinPro.com — All rights reserved. Unauthorized reproduction, copying or distribution of content, reviews or data is strictly prohibited.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Header from '@/components/marketing/header';
import { Footer } from '@/components/marketing/footer';
import ExitIntentPopup from '@/components/marketing/exit-intent-popup';
import CookieConsentBanner from '@/components/marketing/cookie-consent';
import GeoSuggestBanner from '@/components/marketing/geo-suggest-banner';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip navigation link — WCAG 2.4.1: lets keyboard users bypass the header nav */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[9999] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ background: 'var(--sfp-navy)', color: '#ffffff', textDecoration: 'none' }}
      >
        Skip to main content
      </a>
      {/* Header and Footer auto-detect market from URL */}
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      <ExitIntentPopup />
      <CookieConsentBanner />
      <GeoSuggestBanner /> {/* geo-v2 */}
    </div>
  );
}

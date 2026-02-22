import { Header } from '@/components/marketing/header';
import { Footer } from '@/components/marketing/footer';
import { ExitIntentPopup } from '@/components/marketing/exit-intent-popup';
import { CookieConsentBanner } from '@/components/marketing/cookie-consent';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header and Footer auto-detect market from URL */}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ExitIntentPopup />
      <CookieConsentBanner />
    </div>
  );
}

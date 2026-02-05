import { notFound } from 'next/navigation';
import { isValidMarket } from '@/lib/i18n/config';

interface MarketLayoutProps {
  children: React.ReactNode;
  params: Promise<{ market: string }>;
}

// This layout validates the market param but does NOT add Header/Footer
// Header/Footer are handled by the parent (marketing)/layout.tsx
export default async function MarketLayout({
  children,
  params,
}: MarketLayoutProps) {
  const { market } = await params;

  // Validate market parameter
  if (!isValidMarket(market)) {
    notFound();
  }

  // Just pass children through - no wrapper needed
  // The parent marketing layout handles Header/Footer
  return <>{children}</>;
}

export function generateStaticParams() {
  // Generate all markets including US (middleware rewrites /category to /us/category)
  return [{ market: 'us' }, { market: 'uk' }, { market: 'ca' }, { market: 'au' }];
}

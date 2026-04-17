import type { Metadata } from 'next';
import { MoneyLeakScannerPage } from '@/components/tools/money-leak-scanner/MoneyLeakScannerPage';

const CANONICAL = 'https://smartfinpro.com/uk/tools/money-leak-scanner';

export const metadata: Metadata = {
  title: 'Money Leak Scanner UK — Find Hidden Household Overspend | SmartFinPro',
  description:
    'Free 60-second scan that shows how much money is leaking from your UK household each year across banking fees, subscriptions, credit-card interest, insurance, fund fees and FX.',
  alternates: {
    canonical: CANONICAL,
    languages: {
      'en-US': 'https://smartfinpro.com/tools/money-leak-scanner',
      'en-GB': CANONICAL,
      'en-CA': 'https://smartfinpro.com/ca/tools/money-leak-scanner',
      'en-AU': 'https://smartfinpro.com/au/tools/money-leak-scanner',
      'x-default': 'https://smartfinpro.com/tools/money-leak-scanner',
    },
  },
  openGraph: {
    title: 'Money Leak Scanner UK — Find Hidden Household Overspend',
    description:
      'Free 60-second scan revealing how much your UK household is overpaying annually across 6 categories.',
    url: CANONICAL,
    type: 'website',
  },
};

export default function Page() {
  return <MoneyLeakScannerPage market="uk" canonicalUrl={CANONICAL} />;
}

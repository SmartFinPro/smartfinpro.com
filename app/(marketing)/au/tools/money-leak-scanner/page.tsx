import type { Metadata } from 'next';
import { MoneyLeakScannerPage } from '@/components/tools/money-leak-scanner/MoneyLeakScannerPage';

const CANONICAL = 'https://smartfinpro.com/au/tools/money-leak-scanner';

export const metadata: Metadata = {
  title: 'Money Leak Scanner Australia — Find Hidden Household Overspend | SmartFinPro',
  description:
    'Free 60-second scan that shows how much money is leaking from your Australian household each year across banking fees, subscriptions, credit-card interest, insurance, super fees and FX.',
  alternates: {
    canonical: CANONICAL,
    languages: {
      'en-US': 'https://smartfinpro.com/tools/money-leak-scanner',
      'en-GB': 'https://smartfinpro.com/uk/tools/money-leak-scanner',
      'en-CA': 'https://smartfinpro.com/ca/tools/money-leak-scanner',
      'en-AU': CANONICAL,
      'x-default': 'https://smartfinpro.com/tools/money-leak-scanner',
    },
  },
  openGraph: {
    title: 'Money Leak Scanner Australia — Find Hidden Household Overspend',
    description:
      'Free 60-second scan revealing how much your Australian household is overpaying annually across 6 categories.',
    url: CANONICAL,
    type: 'website',
  },
};

export default function Page() {
  return <MoneyLeakScannerPage market="au" canonicalUrl={CANONICAL} />;
}

import type { Metadata } from 'next';
import { MoneyLeakScannerPage } from '@/components/tools/money-leak-scanner/MoneyLeakScannerPage';

const CANONICAL = 'https://smartfinpro.com/tools/money-leak-scanner';

export const metadata: Metadata = {
  title: 'Money Leak Scanner — Find Hidden Household Overspend | SmartFinPro',
  description:
    'Free 60-second scan that shows how much money is leaking from your household each year across banking fees, subscriptions, credit-card interest, insurance, investment fees and FX.',
  alternates: {
    canonical: CANONICAL,
    languages: {
      'en-US': CANONICAL,
      'en-GB': 'https://smartfinpro.com/uk/tools/money-leak-scanner',
      'en-CA': 'https://smartfinpro.com/ca/tools/money-leak-scanner',
      'en-AU': 'https://smartfinpro.com/au/tools/money-leak-scanner',
      'x-default': CANONICAL,
    },
  },
  openGraph: {
    title: 'Money Leak Scanner — Find Hidden Household Overspend',
    description:
      'Free 60-second scan revealing how much your household is overpaying annually across 6 categories.',
    url: CANONICAL,
    type: 'website',
  },
};

export default function Page() {
  return <MoneyLeakScannerPage market="us" canonicalUrl={CANONICAL} />;
}

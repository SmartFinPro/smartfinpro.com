import type { Metadata } from 'next';
import { MoneyLeakScannerPage } from '@/components/tools/money-leak-scanner/MoneyLeakScannerPage';

const CANONICAL = 'https://smartfinpro.com/ca/tools/money-leak-scanner';

export const metadata: Metadata = {
  title: 'Money Leak Scanner Canada — Find Hidden Household Overspend | SmartFinPro',
  description:
    'Free 60-second scan that shows how much money is leaking from your Canadian household each year across banking fees, subscriptions, credit-card interest, insurance, MER drag and FX.',
  alternates: {
    canonical: CANONICAL,
    languages: {
      'en-US': 'https://smartfinpro.com/tools/money-leak-scanner',
      'en-GB': 'https://smartfinpro.com/uk/tools/money-leak-scanner',
      'en-CA': CANONICAL,
      'en-AU': 'https://smartfinpro.com/au/tools/money-leak-scanner',
      'x-default': 'https://smartfinpro.com/tools/money-leak-scanner',
    },
  },
  openGraph: {
    title: 'Money Leak Scanner Canada — Find Hidden Household Overspend',
    description:
      'Free 60-second scan revealing how much your Canadian household is overpaying annually across 6 categories.',
    url: CANONICAL,
    type: 'website',
  },
};

export default function Page() {
  return <MoneyLeakScannerPage market="ca" canonicalUrl={CANONICAL} />;
}

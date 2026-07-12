import { MoneyLeakScannerPage } from '@/components/tools/money-leak-scanner/MoneyLeakScannerPage';
import { buildToolMetadata } from '@/lib/tools/registry/metadata';

const CANONICAL = 'https://smartfinpro.com/au/tools/money-leak-scanner';

export const metadata = buildToolMetadata('money-leak-scanner', 'au');

export default function Page() {
  return <MoneyLeakScannerPage market="au" canonicalUrl={CANONICAL} />;
}

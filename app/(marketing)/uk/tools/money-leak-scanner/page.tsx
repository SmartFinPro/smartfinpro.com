import { MoneyLeakScannerPage } from '@/components/tools/money-leak-scanner/MoneyLeakScannerPage';
import { buildToolMetadata } from '@/lib/tools/registry/metadata';

const CANONICAL = 'https://smartfinpro.com/uk/tools/money-leak-scanner';

export const metadata = buildToolMetadata('money-leak-scanner', 'uk');

export default function Page() {
  return <MoneyLeakScannerPage market="uk" canonicalUrl={CANONICAL} />;
}

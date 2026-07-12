import { MoneyLeakScannerPage } from '@/components/tools/money-leak-scanner/MoneyLeakScannerPage';
import { buildToolMetadata } from '@/lib/tools/registry/metadata';

const CANONICAL = 'https://smartfinpro.com/ca/tools/money-leak-scanner';

export const metadata = buildToolMetadata('money-leak-scanner', 'ca');

export default function Page() {
  return <MoneyLeakScannerPage market="ca" canonicalUrl={CANONICAL} />;
}

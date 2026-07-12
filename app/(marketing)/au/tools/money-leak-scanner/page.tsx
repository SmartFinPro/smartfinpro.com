import { MoneyLeakScannerPage } from '@/components/tools/money-leak-scanner/MoneyLeakScannerPage';
import { buildToolMetadata } from '@/lib/tools/registry/metadata';
import { ToolJsonLd } from '@/components/tools/shell/tool-json-ld';

const CANONICAL = 'https://smartfinpro.com/au/tools/money-leak-scanner';

export const metadata = buildToolMetadata('money-leak-scanner', 'au');

export default function Page() {
  return (
    <>
      <ToolJsonLd toolId="money-leak-scanner" market="au" />
      <MoneyLeakScannerPage market="au" canonicalUrl={CANONICAL} />
    </>
  );
}

import { MoneyLeakScannerPage } from '@/components/tools/money-leak-scanner/MoneyLeakScannerPage';
import { buildToolMetadata } from '@/lib/tools/registry/metadata';
import { ToolJsonLd } from '@/components/tools/shell/tool-json-ld';

const CANONICAL = 'https://smartfinpro.com/uk/tools/money-leak-scanner';

export const metadata = buildToolMetadata('money-leak-scanner', 'uk');

export default function Page() {
  return (
    <>
      <ToolJsonLd toolId="money-leak-scanner" market="uk" />
      <MoneyLeakScannerPage market="uk" canonicalUrl={CANONICAL} />
    </>
  );
}

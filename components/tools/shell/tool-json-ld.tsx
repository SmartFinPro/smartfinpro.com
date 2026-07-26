// components/tools/shell/tool-json-ld.tsx
// Vorzieh-Komponente (FDL 0.7) — shell/ wird ab Phase 2/5 zum Shell-Architektur-Verzeichnis.
import { getTool, getVariant, getHubPathForMarket } from '@/lib/tools/registry';
import type { ToolId, ToolMarket } from '@/lib/tools/registry';
import { WebApplicationSchema } from '@/components/seo/web-application-schema';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';
import { FAQSchema } from '@/components/seo/faq-schema';
import type { FAQ } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';

interface ToolJsonLdProps {
  toolId: ToolId;
  market: ToolMarket;
  /**
   * FAQ Q&A pairs — MUST mirror the already-visible FAQ markup on the page,
   * never fabricated data. Omit entirely when the page has no visible FAQ
   * section (FAQPage schema is emitted only when this is provided).
   */
  faq?: FAQ[];
}

/**
 * Combined JSON-LD for tool/calculator pages: WebApplication + BreadcrumbList,
 * plus FAQPage only when `faq` is passed (SPEC rule — schema mirrors visible
 * content, never more).
 */
export function ToolJsonLd({ toolId, market, faq }: ToolJsonLdProps) {
  const tool = getTool(toolId);
  const variant = getVariant(toolId, market);
  if (!tool || !variant) return null;

  const url = `${BASE_URL}${variant.path}`;
  const homeUrl = market === 'us' ? BASE_URL : `${BASE_URL}/${market}`;
  const hubUrl = `${BASE_URL}${getHubPathForMarket(market)}`;

  return (
    <>
      <WebApplicationSchema
        name={variant.h1 || tool.name}
        url={url}
        description={variant.metaDescription}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: homeUrl },
          { name: 'Tools', url: hubUrl },
          { name: variant.h1 || tool.name, url },
        ]}
      />
      {faq && faq.length > 0 && <FAQSchema faqs={faq} />}
    </>
  );
}

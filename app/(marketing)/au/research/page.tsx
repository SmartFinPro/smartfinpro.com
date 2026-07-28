// app/(marketing)/au/research/page.tsx
// Australia Research hub — thin route wrapper (unified-research-discovery-
// pr2-hubs plan, Task 2). Delegates all rendering to the shared server
// ResearchHubPage (components/research/ResearchHubPage.tsx); this file only
// supplies the literal market and its metadata (lib/research/hub-copy.ts).
//
// A literal market directory, not the [market]/[category] dynamic segment —
// same shape as the existing app/(marketing)/au/tools and
// app/(marketing)/au/superannuation routes, which shadow the dynamic segment
// the same way (isValidCategory('research') is false, so the dynamic route
// would otherwise 404 here).

import { ResearchHubPage } from '@/components/research/ResearchHubPage';
import { metadataForResearchMarket } from '@/lib/research/hub-copy';

export const generateMetadata = () => metadataForResearchMarket('au');

export default function AuResearchPage() {
  return <ResearchHubPage market="au" />;
}

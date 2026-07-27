// app/(marketing)/research/page.tsx
// US Research hub — thin route wrapper (unified-research-discovery-pr2-hubs
// plan, Task 2). All rendering lives in the shared server ResearchHubPage
// (components/research/ResearchHubPage.tsx); this file only supplies the
// literal market and its metadata (lib/research/hub-copy.ts).
//
// This is a literal top-level route (like /methodology, /trading-platforms),
// NOT the [market]/[category] dynamic segment — the Research hub is a
// discovery LAYER over the existing Cockpit/Review system, not a duplicate
// of it. `/us/research` does not exist yet; it will 308 here once the
// Task 7 redirect lands in next.config.ts.

import { ResearchHubPage } from '@/components/research/ResearchHubPage';
import { metadataForResearchMarket } from '@/lib/research/hub-copy';

export const generateMetadata = () => metadataForResearchMarket('us');

export default function ResearchPage() {
  return <ResearchHubPage market="us" />;
}

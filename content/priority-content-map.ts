/**
 * Priority Content Map - Top 5 High-Volume Articles
 *
 * Based on keyword research from concept document.
 * These articles should be optimized for Featured Snippets (Google Answer Boxes).
 *
 * Optimization Checklist per Article:
 * - [ ] Add DefinitionBox component for "What is X?" queries
 * - [ ] Add KeyTakeaways at the top
 * - [ ] Add NumberedList for "Best X" rankings
 * - [ ] Add FAQ schema with 8+ questions
 * - [ ] Ensure content is 3,500+ words
 * - [ ] Add StatBox with relevant data points
 */

export interface PriorityContent {
  slug: string;
  market: string;
  category: string;
  title: string;
  targetKeywords: string[];
  estimatedSearchVolume: number;
  difficulty: 'low' | 'medium' | 'high';
  snippetOpportunity: string;
  optimizationStatus: 'pending' | 'in-progress' | 'optimized';
  snippetComponents: string[];
}

export const priorityContentMap: PriorityContent[] = [
  // ============================================================
  // #1: Best Personal Loans (Highest Revenue Potential)
  // ============================================================
  {
    slug: 'index',
    market: 'us',
    category: 'personal-finance',
    title: 'Best Personal Loans 2026: Complete Guide',
    targetKeywords: [
      'best personal loans',
      'personal loans online',
      'how to get a personal loan',
      'personal loan rates',
      'personal loan calculator',
    ],
    estimatedSearchVolume: 165000,
    difficulty: 'high',
    snippetOpportunity: 'List snippet for "best personal loans" + Definition for "what is a personal loan"',
    optimizationStatus: 'pending',
    snippetComponents: [
      'DefinitionBox - What is a personal loan?',
      'NumberedList - Top 10 Personal Loans 2026',
      'StatBox - Average APR, approval rates',
      'QuickAnswer - How to qualify for a personal loan',
      'ComparisonSnippet - Secured vs Unsecured loans',
    ],
  },

  // ============================================================
  // #2: Best AI Tools for Finance (High Growth Niche)
  // ============================================================
  {
    slug: 'index',
    market: 'us',
    category: 'ai-tools',
    title: 'Best AI Tools for Finance Professionals 2026',
    targetKeywords: [
      'ai tools for finance',
      'ai for accountants',
      'ai tools for financial analysis',
      'best ai for bookkeeping',
      'ai automation finance',
    ],
    estimatedSearchVolume: 74000,
    difficulty: 'medium',
    snippetOpportunity: 'List snippet for "best ai tools for finance" + Definition for "AI in finance"',
    optimizationStatus: 'pending',
    snippetComponents: [
      'DefinitionBox - What are AI finance tools?',
      'NumberedList - Top 10 AI Tools for Finance 2026',
      'StatBox - Time saved, accuracy improvement stats',
      'QuickAnswer - How AI is transforming finance',
      'KeyTakeaways - Summary for busy professionals',
    ],
  },

  // ============================================================
  // #3: Jasper AI Review (High-Converting SaaS)
  // ============================================================
  {
    slug: 'jasper-ai-review',
    market: 'us',
    category: 'ai-tools',
    title: 'Jasper AI Review 2026: Is It Worth $49/Month?',
    targetKeywords: [
      'jasper ai review',
      'jasper ai worth it',
      'jasper ai pricing',
      'jasper ai vs chatgpt',
      'jasper ai for business',
    ],
    estimatedSearchVolume: 49500,
    difficulty: 'medium',
    snippetOpportunity: 'Review snippet + Pros/Cons table + Pricing comparison',
    optimizationStatus: 'pending',
    snippetComponents: [
      'ProsConsSnippet - Jasper AI Pros and Cons',
      'QuickAnswer - Is Jasper AI worth it?',
      'StatBox - Pricing tiers, user stats',
      'ComparisonSnippet - Jasper vs Copy.ai vs ChatGPT',
      'NumberedList - Top 5 Jasper AI Use Cases',
    ],
  },

  // ============================================================
  // #4: Best Business VPN (B2B Cybersecurity)
  // ============================================================
  {
    slug: 'index',
    market: 'us',
    category: 'cybersecurity',
    title: 'Best Business VPN 2026: Enterprise Security Guide',
    targetKeywords: [
      'best business vpn',
      'corporate vpn',
      'enterprise vpn solutions',
      'vpn for remote teams',
      'business vpn comparison',
    ],
    estimatedSearchVolume: 40500,
    difficulty: 'medium',
    snippetOpportunity: 'List snippet for "best business vpn" + Security stats',
    optimizationStatus: 'pending',
    snippetComponents: [
      'DefinitionBox - What is a business VPN?',
      'NumberedList - Top 8 Business VPNs 2026',
      'StatBox - Security breach stats, cost savings',
      'QuickAnswer - Why do businesses need VPNs?',
      'ComparisonSnippet - Cloud VPN vs Traditional VPN',
    ],
  },

  // ============================================================
  // #5: UK Trading Platforms (High-Value International)
  // ============================================================
  {
    slug: 'index',
    market: 'uk',
    category: 'trading',
    title: 'Best Trading Platforms UK 2026: Complete Comparison',
    targetKeywords: [
      'best trading platform uk',
      'uk stock trading apps',
      'trading platforms comparison uk',
      'best broker uk',
      'investing apps uk',
    ],
    estimatedSearchVolume: 33100,
    difficulty: 'high',
    snippetOpportunity: 'List snippet for UK trading platforms + FCA regulation info',
    optimizationStatus: 'pending',
    snippetComponents: [
      'DefinitionBox - How to choose a UK trading platform',
      'NumberedList - Top 10 UK Trading Platforms 2026',
      'StatBox - FCA stats, average fees comparison',
      'QuickAnswer - Are trading apps safe in the UK?',
      'KeyTakeaways - Summary for UK investors',
    ],
  },
];

/**
 * Get priority content by market
 */
export function getPriorityContentByMarket(market: string): PriorityContent[] {
  return priorityContentMap.filter((content) => content.market === market);
}

/**
 * Get all pending optimization tasks
 */
export function getPendingOptimizations(): PriorityContent[] {
  return priorityContentMap.filter((content) => content.optimizationStatus !== 'optimized');
}

/**
 * Total estimated monthly search volume
 */
export function getTotalSearchVolume(): number {
  return priorityContentMap.reduce((sum, content) => sum + content.estimatedSearchVolume, 0);
}

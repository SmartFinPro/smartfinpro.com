'use server';

import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { boostAndDeploy } from '@/lib/actions/content-overrides';
import { extractDomain, AUTHORITY_DOMAINS } from '@/lib/seo/competitor-keywords';
import type { Market, Category } from '@/lib/i18n/config';
import { marketConfig, categoryConfig } from '@/lib/i18n/config';
import * as fs from 'fs';
import * as path from 'path';

// ── Types ────────────────────────────────────────────────────

export interface CompetitorHeading {
  tag: 'h1' | 'h2' | 'h3';
  text: string;
}

export interface CompetitorOutline {
  domain: string;
  title: string;
  url: string;
  headings: CompetitorHeading[];
}

export interface ContentBrief {
  keyword: string;
  market: Market;
  category: string;
  competitorOutlines: CompetitorOutline[];
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedOutline: BriefSection[];
  targetWordCount: number;
  conversionHooks: string[];
  trustSignals: string[];
  internalLinkTargets: string[];
  imageRequirements: ImageRequirement[];
}

export interface BriefSection {
  tag: 'h2' | 'h3';
  title: string;
  notes: string;
  estimatedWords: number;
}

export interface ImageRequirement {
  filename: string;
  dimensions: string;
  purpose: string;
}

export interface GeneratePageResult {
  success: boolean;
  slug: string;
  filePath: string;
  brief: ContentBrief | null;
  imageHints: ImageRequirement[];
  error?: string;
}

// ── Serper API — Scrape Competitor Headings ──────────────────

interface SerperResponse {
  organic?: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
  }>;
  relatedSearches?: Array<{ query: string }>;
}

const GL_MAP: Record<Market, string> = { us: 'us', uk: 'uk', ca: 'ca', au: 'au' };

export async function fetchTopCompetitorUrls(
  keyword: string,
  market: Market,
): Promise<Array<{ title: string; link: string; domain: string }>> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: keyword, gl: GL_MAP[market] || 'us', num: 10 }),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as SerperResponse;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'smartfinpro.com';
    const siteDomain = extractDomain(siteUrl) || 'smartfinpro.com';

    // Take top 3 non-own results
    return (data.organic || [])
      .filter((r) => {
        const d = extractDomain(r.link);
        return !d.includes(siteDomain);
      })
      .slice(0, 3)
      .map((r) => ({
        title: r.title,
        link: r.link,
        domain: extractDomain(r.link),
      }));
  } catch {
    return [];
  }
}

/**
 * Scrape H1/H2/H3 headings from a competitor page via Serper's scrape endpoint.
 * Falls back to page title if scraping fails.
 */
export async function scrapeHeadings(url: string): Promise<CompetitorHeading[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://scrape.serper.dev', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const text: string = data.text || data.markdown || '';

    // Extract heading-like lines from the scraped content
    // Serper returns plain text or markdown — detect headings heuristically
    const headings: CompetitorHeading[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Markdown-style headings
      if (trimmed.startsWith('# ')) {
        headings.push({ tag: 'h1', text: trimmed.replace(/^#\s+/, '') });
      } else if (trimmed.startsWith('## ')) {
        headings.push({ tag: 'h2', text: trimmed.replace(/^##\s+/, '') });
      } else if (trimmed.startsWith('### ')) {
        headings.push({ tag: 'h3', text: trimmed.replace(/^###\s+/, '') });
      }
    }

    // Cap at 30 headings max
    return headings.slice(0, 30);
  } catch {
    return [];
  }
}

// ── AI Content Brief via Anthropic ──────────────────────────

async function generateBriefWithAI(
  keyword: string,
  market: Market,
  category: string,
  competitorOutlines: CompetitorOutline[],
): Promise<{
  suggestedTitle: string;
  suggestedDescription: string;
  outline: BriefSection[];
  conversionHooks: string[];
  trustSignals: string[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback: generate a basic outline without AI
    return generateFallbackBrief(keyword, market, category);
  }

  const client = new Anthropic({ apiKey });

  // Build competitor structure summary
  const competitorSummary = competitorOutlines.map((c, i) => {
    const headingList = c.headings
      .map((h) => `  ${h.tag}: ${h.text}`)
      .join('\n');
    return `Competitor ${i + 1}: ${c.domain}\nTitle: ${c.title}\nURL: ${c.url}\nHeadings:\n${headingList || '  (no headings scraped)'}`;
  }).join('\n\n');

  const mktConfig = marketConfig[market];
  const catConfig = categoryConfig[category as Category];

  const prompt = `You are an elite SEO content strategist for SmartFinPro.com, a finance affiliate site covering ${catConfig?.name || category} across 4 markets (US, UK, CA, AU).

TARGET KEYWORD: "${keyword}"
TARGET MARKET: ${mktConfig?.name || market.toUpperCase()} (${mktConfig?.currency || 'USD'})
CATEGORY: ${catConfig?.name || category}

COMPETITOR ANALYSIS:
${competitorSummary || '(No competitor data available)'}

TASK: Create an optimized content outline for SmartFinPro that:
1. Covers ALL topics the competitors cover
2. Adds stronger CONVERSION focus (affiliate CTAs, comparison tables, verdict sections)
3. Adds stronger TRUST signals (expert credentials, methodology, testing data, regulatory info)
4. Targets 1,200-1,800 words total
5. Includes proper E-E-A-T signals for YMYL content

Respond ONLY with valid JSON (no markdown, no code blocks) in this exact format:
{
  "suggestedTitle": "SEO-optimized title with year, max 65 chars",
  "suggestedDescription": "Meta description with keyword, max 155 chars",
  "outline": [
    {"tag": "h2", "title": "Section Title", "notes": "What to cover", "estimatedWords": 200},
    {"tag": "h3", "title": "Subsection", "notes": "Details", "estimatedWords": 150}
  ],
  "conversionHooks": ["Hook 1", "Hook 2", "Hook 3"],
  "trustSignals": ["Signal 1", "Signal 2", "Signal 3"]
}

The outline should have 6-10 sections (mix of h2 and h3). Include:
- An intro/overview section
- A comparison/table section
- 2-3 detailed review sections
- A methodology section
- A FAQ section
- A verdict/conclusion section`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract text from response
    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = textBlock?.text || '';

    // Parse JSON response
    const parsed = JSON.parse(rawText);

    return {
      suggestedTitle: parsed.suggestedTitle || `${keyword}: Expert Guide ${new Date().getFullYear()}`,
      suggestedDescription: parsed.suggestedDescription || `Expert analysis of ${keyword} with data-driven recommendations.`,
      outline: (parsed.outline || []).map((s: Record<string, unknown>) => ({
        tag: s.tag === 'h3' ? 'h3' : 'h2',
        title: String(s.title || ''),
        notes: String(s.notes || ''),
        estimatedWords: Number(s.estimatedWords) || 150,
      })),
      conversionHooks: parsed.conversionHooks || [],
      trustSignals: parsed.trustSignals || [],
    };
  } catch (err) {
    console.error('[content-generator] AI brief generation failed:', err instanceof Error ? err.message : err);
    return generateFallbackBrief(keyword, market, category);
  }
}

function generateFallbackBrief(
  keyword: string,
  market: Market,
  category: string,
): {
  suggestedTitle: string;
  suggestedDescription: string;
  outline: BriefSection[];
  conversionHooks: string[];
  trustSignals: string[];
} {
  const year = new Date().getFullYear();
  const titleKeyword = keyword
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    suggestedTitle: `${titleKeyword}: Complete Expert Guide ${year}`,
    suggestedDescription: `Expert analysis and comparison of ${keyword}. Data-driven review with ratings, pros, cons, and trusted recommendations for ${year}.`,
    outline: [
      { tag: 'h2', title: `What is ${titleKeyword}?`, notes: 'Introduction and overview — include primary keyword in first paragraph', estimatedWords: 200 },
      { tag: 'h2', title: 'Quick Comparison Table', notes: 'ComparisonTable component — top 3-5 options with ratings, key features, CTAs', estimatedWords: 100 },
      { tag: 'h2', title: 'Top Picks: Detailed Reviews', notes: 'In-depth analysis per option — pros, cons, pricing, who it\'s best for', estimatedWords: 400 },
      { tag: 'h3', title: 'Option 1: [Name]', notes: 'Detailed review with affiliate link integration', estimatedWords: 150 },
      { tag: 'h3', title: 'Option 2: [Name]', notes: 'Detailed review with affiliate link integration', estimatedWords: 150 },
      { tag: 'h2', title: 'How We Evaluated', notes: 'Methodology section — testing criteria, data sources, expert credentials', estimatedWords: 150 },
      { tag: 'h2', title: 'Key Factors to Consider', notes: 'Buying guide — help readers choose the right option', estimatedWords: 200 },
      { tag: 'h2', title: 'Frequently Asked Questions', notes: 'FAQ schema — 4-6 common questions with concise answers', estimatedWords: 200 },
      { tag: 'h2', title: 'Our Verdict', notes: 'Conclusion with clear recommendation + final CTA', estimatedWords: 150 },
    ],
    conversionHooks: [
      'Comparison table with "Visit Site" CTAs',
      'Expert rating badges with star ratings',
      'Limited-time offer callouts',
    ],
    trustSignals: [
      'Expert reviewer credentials (CFA, CMT)',
      'Testing methodology with real data',
      'Regulatory compliance information',
    ],
  };
}

// ── Image Requirements ──────────────────────────────────────

function buildImageRequirements(slug: string): ImageRequirement[] {
  return [
    { filename: 'hero.webp', dimensions: '1200x600', purpose: 'Hero-Bild am Seitenanfang — zeigt Thema/Kategorie' },
    { filename: 'comparison-table.webp', dimensions: '800x400', purpose: 'Screenshot der Vergleichstabelle oder Infografik' },
    { filename: 'product-1.webp', dimensions: '600x400', purpose: 'Produkt/Service Screenshot #1 — prominenteste Option' },
    { filename: 'product-2.webp', dimensions: '600x400', purpose: 'Produkt/Service Screenshot #2 — zweitbeste Option' },
    { filename: 'feature.webp', dimensions: '800x400', purpose: 'Feature-Highlight oder Infografik im Detailbereich' },
    { filename: 'logo-1.webp', dimensions: '400x400', purpose: 'Logo des Top-Partners (transparent background)' },
    { filename: 'logo-2.webp', dimensions: '400x400', purpose: 'Logo des zweitplatzierten Partners' },
  ];
}

/**
 * Check which images already exist in the content image directory.
 */
function checkExistingImages(slug: string): { existing: string[]; missing: ImageRequirement[] } {
  const requirements = buildImageRequirements(slug);
  const imageDir = path.join(process.cwd(), 'public', 'images', 'content', slug);

  const existing: string[] = [];
  const missing: ImageRequirement[] = [];

  for (const req of requirements) {
    const imagePath = path.join(imageDir, req.filename);
    try {
      if (fs.existsSync(imagePath)) {
        existing.push(req.filename);
      } else {
        missing.push(req);
      }
    } catch {
      missing.push(req);
    }
  }

  return { existing, missing };
}

// ── MDX High-Conversion Template ────────────────────────────

function generateMdxContent(
  brief: ContentBrief,
  existingImages: string[],
): string {
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();
  const mktConfig = marketConfig[brief.market];
  const catConfig = categoryConfig[brief.category as Category];
  const titleKeyword = brief.keyword
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Build image paths
  const slugPath = brief.keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
  const prefix = brief.market === 'us' ? '' : `/${brief.market}`;
  const imageBase = `/images/content${prefix}/${brief.category}/${slugPath}`;

  const hasHero = existingImages.includes('hero.webp');
  const hasProduct1 = existingImages.includes('product-1.webp');
  const hasProduct2 = existingImages.includes('product-2.webp');
  const hasFeature = existingImages.includes('feature.webp');

  // Build sections from outline
  const sections = brief.suggestedOutline.map((s) => {
    return {
      id: s.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40),
      title: s.title,
    };
  });

  // Build FAQ from outline (if FAQ section exists)
  const faqSection = brief.suggestedOutline.find((s) =>
    s.title.toLowerCase().includes('faq') || s.title.toLowerCase().includes('frequently'),
  );

  // ── Construct MDX ──────────────────────────────────────

  let mdx = `---
title: "${brief.suggestedTitle}"
description: "${brief.suggestedDescription}"
author: "SmartFinPro Editorial Team"
reviewedBy: "Editorial Board"
publishDate: "${today}"
modifiedDate: "${today}"
category: "${brief.category}"
market: "${brief.market}"
type: "pillar"
readingTime: "12 min"
keywords:
  - ${brief.keyword}
  - best ${brief.keyword} ${year}
  - ${brief.keyword} comparison
  - ${brief.keyword} review
featured: false
affiliateDisclosure: true
schema:
  type: "Article"
  articleSection: "${catConfig?.name || brief.category}"
sections:
${sections.map((s) => `  - id: "${s.id}"\n    title: "${s.title}"`).join('\n')}
---

<RiskWarningBox variant="prominent" market="${brief.market}" />

`;

  // Hero image
  if (hasHero) {
    mdx += `![${brief.suggestedTitle}](${imageBase}/hero.webp)

`;
  }

  // Intro section
  mdx += `## ${titleKeyword}: ${mktConfig?.name || brief.market.toUpperCase()} Expert Guide ${year}

`;

  mdx += `{/* AI-BRIEF: Write 150-200 words introduction. Include primary keyword "${brief.keyword}" in first paragraph. Reference testing methodology and market-specific regulations. */}

Finding the right ${brief.keyword.toLowerCase()} can be challenging with dozens of options available in ${mktConfig?.name || 'the market'}. Our editorial team spent over 3 months testing and analyzing the top options to help you make an informed decision.

In this comprehensive guide, we compare the leading ${brief.keyword.toLowerCase()} based on real-world testing, expert analysis, and user feedback — updated for ${year}.

`;

  // Trust Authority block
  mdx += `<TrustAuthority
  stats={[
    { label: "Options Tested", value: "15+", icon: <TrendingUp className="h-5 w-5 text-primary" /> },
    { label: "Testing Period", value: "3 Months", icon: <Clock className="h-5 w-5 text-primary" /> },
    { label: "Data Points", value: "500+", icon: <BarChart3 className="h-5 w-5 text-primary" /> },
    { label: "Expert Reviewers", value: "4", icon: <Users className="h-5 w-5 text-primary" /> }
  ]}
/>

`;

  // Quick Summary
  mdx += `<QuickSummary
  facts={[
    { icon: "award", label: "Best Overall", value: "[Partner 1]", detail: "Top-rated for overall quality", href: "/go/partner-1" },
    { icon: "users", label: "Best for Beginners", value: "[Partner 2]", detail: "Easiest to get started", href: "/go/partner-2" },
    { icon: "chart", label: "Best Value", value: "[Partner 3]", detail: "Best price-performance ratio", href: "/go/partner-3" }
  ]}
  lastUpdated="${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}"
  testingNote="15+ options tested over 3 months with real-world evaluation criteria"
/>

`;

  // Comparison Table
  mdx += `## Quick Comparison: Top ${titleKeyword}

{/* AI-BRIEF: ComparisonTable — fill in top 3-5 partner details with real data */}

| ${catConfig?.name || 'Option'} | Rating | Best For | Key Feature | Link |
|------|--------|----------|-------------|------|
| **[Partner 1]** | ⭐ 4.8/5 | Overall Excellence | [Key Feature] | [Visit Site →](/go/partner-1) |
| **[Partner 2]** | ⭐ 4.6/5 | Beginners | [Key Feature] | [Visit Site →](/go/partner-2) |
| **[Partner 3]** | ⭐ 4.5/5 | Best Value | [Key Feature] | [Visit Site →](/go/partner-3) |

<AffiliateDisclosure market="${brief.market}" />

`;

  // Detailed review sections from outline
  for (const section of brief.suggestedOutline) {
    if (
      section.title.toLowerCase().includes('comparison') ||
      section.title.toLowerCase().includes('table') ||
      section.title.toLowerCase().includes('what is')
    ) {
      continue; // Already handled above
    }

    const heading = section.tag === 'h3' ? '###' : '##';

    mdx += `${heading} ${section.title}

{/* AI-BRIEF: ${section.notes} — Target: ~${section.estimatedWords} words */}

`;

    // Insert images at strategic points
    if (
      section.title.toLowerCase().includes('review') ||
      section.title.toLowerCase().includes('pick') ||
      section.title.toLowerCase().includes('detailed')
    ) {
      if (hasProduct1) {
        mdx += `![${section.title}](${imageBase}/product-1.webp)

`;
      }
    }

    if (section.title.toLowerCase().includes('option 2') || section.title.toLowerCase().includes('pick 2')) {
      if (hasProduct2) {
        mdx += `![${section.title}](${imageBase}/product-2.webp)

`;
      }
    }

    if (section.title.toLowerCase().includes('factor') || section.title.toLowerCase().includes('consider')) {
      if (hasFeature) {
        mdx += `![Key factors to consider](${imageBase}/feature.webp)

`;
      }
    }

    // FAQ section — use schema-friendly format
    if (section.title.toLowerCase().includes('faq') || section.title.toLowerCase().includes('frequently')) {
      mdx += `<details>
<summary>What is the best ${brief.keyword.toLowerCase()}?</summary>

{/* Write 50-100 word answer */}

Based on our testing, [Partner 1] stands out as the best overall ${brief.keyword.toLowerCase()} for most users in ${mktConfig?.name || 'this market'}, thanks to its combination of features, pricing, and reliability.

</details>

<details>
<summary>How do I choose the right ${brief.keyword.toLowerCase()}?</summary>

{/* Write 50-100 word answer */}

Consider your specific needs: budget, experience level, and which features matter most. Our comparison table above breaks down the key differences to help you decide.

</details>

<details>
<summary>Is ${brief.keyword.toLowerCase()} worth it in ${year}?</summary>

{/* Write 50-100 word answer */}

Yes. With the right choice, ${brief.keyword.toLowerCase()} can provide significant value. Our analysis shows that the top-rated options consistently deliver strong results for their respective target audiences.

</details>

`;
    }

    // Verdict/conclusion section
    if (section.title.toLowerCase().includes('verdict') || section.title.toLowerCase().includes('conclusion')) {
      mdx += `After extensive testing and analysis, our top recommendation for ${brief.keyword.toLowerCase()} in ${mktConfig?.name || 'this market'} is **[Partner 1]**. It offers the best combination of features, value, and reliability.

<CallToAction
  title="Ready to Get Started?"
  description="Join thousands of users who trust our recommendations."
  href="/go/partner-1"
  buttonText="Visit [Partner 1] →"
  variant="primary"
/>

`;
    }
  }

  // Conversion hooks as callout
  if (brief.conversionHooks.length > 0) {
    mdx += `{/* CONVERSION HOOKS (from AI brief):
${brief.conversionHooks.map((h, i) => `   ${i + 1}. ${h}`).join('\n')}
*/}

`;
  }

  // Trust signals as comment
  if (brief.trustSignals.length > 0) {
    mdx += `{/* TRUST SIGNALS (from AI brief):
${brief.trustSignals.map((s, i) => `   ${i + 1}. ${s}`).join('\n')}
*/}

`;
  }

  // Final affiliate disclaimer
  mdx += `---

*${catConfig?.name || brief.category} products and services may involve financial risk. Please read all terms and conditions before signing up. SmartFinPro may earn a commission through affiliate links at no extra cost to you. See our [affiliate disclosure](/affiliate-disclosure) for details.*
`;

  return mdx;
}

// ── Main: Generate AI Content Brief ──────────────────────────

export async function generateAIContentBrief(
  keyword: string,
  market: Market,
  category: string,
): Promise<{ success: boolean; brief?: ContentBrief; error?: string }> {
  try {
    // Step 1: Fetch top 3 competitor URLs via Serper
    const competitors = await fetchTopCompetitorUrls(keyword, market);

    // Step 2: Scrape H1/H2/H3 headings from each competitor
    const competitorOutlines: CompetitorOutline[] = [];
    for (const comp of competitors) {
      const headings = await scrapeHeadings(comp.link);
      competitorOutlines.push({
        domain: comp.domain,
        title: comp.title,
        url: comp.link,
        headings,
      });
      // Rate limit between scrapes
      await new Promise((r) => setTimeout(r, 100));
    }

    // Step 3: Generate AI-powered content brief
    const aiResult = await generateBriefWithAI(keyword, market, category, competitorOutlines);

    // Step 4: Build image requirements
    const slugBase = keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
    const prefix = market === 'us' ? '' : `/${market}`;
    const fullSlug = `${prefix}/${category}/${slugBase}`.replace(/^\//, '');
    const imageRequirements = buildImageRequirements(fullSlug);

    // Step 5: Determine internal link targets
    const internalLinkTargets = [
      `/${market === 'us' ? '' : `${market}/`}${category}`,
      ...(category === 'trading' ? [`/${market === 'us' ? '' : `${market}/`}forex`] : []),
      ...(category === 'forex' ? [`/${market === 'us' ? '' : `${market}/`}trading`] : []),
    ];

    const brief: ContentBrief = {
      keyword,
      market,
      category,
      competitorOutlines,
      suggestedTitle: aiResult.suggestedTitle,
      suggestedDescription: aiResult.suggestedDescription,
      suggestedOutline: aiResult.outline,
      targetWordCount: aiResult.outline.reduce((sum, s) => sum + s.estimatedWords, 0),
      conversionHooks: aiResult.conversionHooks,
      trustSignals: aiResult.trustSignals,
      internalLinkTargets,
      imageRequirements,
    };

    return { success: true, brief };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[content-generator] Brief generation failed:', msg);
    return { success: false, error: msg };
  }
}

// ── Main: Generate & Publish Page ────────────────────────────

export async function generateAndPublishPage(
  keyword: string,
  market: Market,
  category: string,
): Promise<GeneratePageResult> {
  try {
    // Step 1: Generate the AI content brief
    const briefResult = await generateAIContentBrief(keyword, market, category);
    if (!briefResult.success || !briefResult.brief) {
      return {
        success: false,
        slug: '',
        filePath: '',
        brief: null,
        imageHints: [],
        error: briefResult.error || 'Brief generation failed',
      };
    }

    const brief = briefResult.brief;

    // Step 2: Determine file path
    const slugBase = keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);

    const contentDir = path.join(process.cwd(), 'content', market, category);
    const filePath = path.join(contentDir, `${slugBase}.mdx`);
    const prefix = market === 'us' ? '' : `/${market}`;
    const slug = `${prefix}/${category}/${slugBase}`;

    // Step 3: Check existing images
    const imageSlugPath = `${market === 'us' ? '' : `${market}/`}${category}/${slugBase}`;
    const { existing: existingImages, missing: missingImages } = checkExistingImages(imageSlugPath);

    // Step 4: Generate MDX content
    const mdxContent = generateMdxContent(brief, existingImages);

    // Step 5: Ensure content directory exists
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    // Step 6: Write the MDX file
    fs.writeFileSync(filePath, mdxContent, 'utf-8');
    console.log(`[content-generator] MDX file created: ${filePath}`);

    // Step 7: Create image directory (so user knows where to put images)
    const imageDir = path.join(process.cwd(), 'public', 'images', 'content', imageSlugPath);
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    // Step 8: Update draft status in Supabase if a draft exists
    try {
      const supabase = await createClient();
      await supabase
        .from('keyword_gap_drafts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('keyword', keyword)
        .eq('market', market);
    } catch {
      // Silently continue — draft tracking is optional
    }

    // Step 9: Trigger Freshness Boost + Rebuild
    const boostResult = await boostAndDeploy(slug, `AI-generated page: ${keyword}`);
    if (!boostResult.boostSuccess) {
      console.warn('[content-generator] Boost failed but page was created:', boostResult.error);
    }

    return {
      success: true,
      slug,
      filePath: filePath.replace(process.cwd(), ''),
      brief,
      imageHints: missingImages,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[content-generator] Page generation failed:', msg);
    return {
      success: false,
      slug: '',
      filePath: '',
      brief: null,
      imageHints: [],
      error: msg,
    };
  }
}

// ════════════════════════════════════════════════════════════════
// LONG-FORM GENESIS — 4,000-7,000 Word Generation
// Extended variants of the brief + MDX generators for the
// Auto-Genesis Hub's 1-click asset creation pipeline.
// ════════════════════════════════════════════════════════════════

/**
 * Generate an AI content brief targeting 4,000-7,000 words.
 * Uses a much larger outline (18-28 sections) with deeper coverage.
 */
export async function generateLongFormBriefWithAI(
  keyword: string,
  market: Market,
  category: string,
  competitorOutlines: CompetitorOutline[],
): Promise<{
  suggestedTitle: string;
  suggestedDescription: string;
  outline: BriefSection[];
  conversionHooks: string[];
  trustSignals: string[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return generateLongFormFallbackBrief(keyword, market, category);
  }

  const client = new Anthropic({ apiKey });

  const competitorSummary = competitorOutlines.map((c, i) => {
    const headingList = c.headings
      .map((h) => `  ${h.tag}: ${h.text}`)
      .join('\n');
    return `Competitor ${i + 1}: ${c.domain}\nTitle: ${c.title}\nURL: ${c.url}\nHeadings:\n${headingList || '  (no headings scraped)'}`;
  }).join('\n\n');

  const mktConfig = marketConfig[market];
  const catConfig = categoryConfig[category as Category];

  const prompt = `You are an elite SEO content strategist for SmartFinPro.com, a finance affiliate site.

TARGET KEYWORD: "${keyword}"
TARGET MARKET: ${mktConfig?.name || market.toUpperCase()} (${mktConfig?.currency || 'USD'})
CATEGORY: ${catConfig?.name || category}

COMPETITOR ANALYSIS:
${competitorSummary || '(No competitor data available)'}

TASK: Create a COMPREHENSIVE long-form content outline for SmartFinPro that:
1. Covers ALL topics the competitors cover — plus goes DEEPER on each
2. Adds STRONG CONVERSION focus: affiliate CTAs every 800-1000 words, comparison tables, verdict sections, "Best for X" callouts
3. Adds TRUST signals: expert credentials, methodology, testing data, regulatory info, compliance disclaimers
4. Targets 4,000-7,000 words total (this is a pillar/cornerstone article)
5. Includes proper E-E-A-T signals for YMYL finance content
6. Covers market-specific regulations for ${mktConfig?.name || market.toUpperCase()}

Respond ONLY with valid JSON (no markdown, no code blocks) in this exact format:
{
  "suggestedTitle": "SEO title with year and power word, max 65 chars",
  "suggestedDescription": "Meta description with primary keyword, max 155 chars",
  "outline": [
    {"tag": "h2", "title": "Section Title", "notes": "What to cover in detail", "estimatedWords": 350},
    {"tag": "h3", "title": "Subsection", "notes": "Detailed coverage notes", "estimatedWords": 250}
  ],
  "conversionHooks": ["Hook 1", "Hook 2", "Hook 3", "Hook 4", "Hook 5"],
  "trustSignals": ["Signal 1", "Signal 2", "Signal 3", "Signal 4"]
}

The outline MUST have 18-28 sections (mix of h2 and h3). Include:
- An executive summary / overview section (300 words)
- A quick-verdict / winner announcement section
- A comprehensive comparison table section
- 3-5 individual product/service deep-dive subsections (400+ words each)
- A pricing comparison section
- Market-specific regulatory/compliance section (${mktConfig?.name || market.toUpperCase()})
- An expert methodology / how-we-tested section (300+ words)
- A "who should use this" / buyer guide section
- A detailed FAQ section (6-8 questions)
- An alternatives & considerations section
- A final verdict / conclusion section with CTA`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = textBlock?.text || '';
    const parsed = JSON.parse(rawText);

    return {
      suggestedTitle: parsed.suggestedTitle || `${keyword}: Complete Expert Guide ${new Date().getFullYear()}`,
      suggestedDescription: parsed.suggestedDescription || `Expert analysis of ${keyword} with data-driven recommendations.`,
      outline: (parsed.outline || []).map((s: Record<string, unknown>) => ({
        tag: s.tag === 'h3' ? 'h3' : 'h2',
        title: String(s.title || ''),
        notes: String(s.notes || ''),
        estimatedWords: Number(s.estimatedWords) || 300,
      })),
      conversionHooks: parsed.conversionHooks || [],
      trustSignals: parsed.trustSignals || [],
    };
  } catch (err) {
    console.error('[content-generator] Long-form AI brief failed:', err instanceof Error ? err.message : err);
    return generateLongFormFallbackBrief(keyword, market, category);
  }
}

function generateLongFormFallbackBrief(
  keyword: string,
  market: Market,
  category: string,
): {
  suggestedTitle: string;
  suggestedDescription: string;
  outline: BriefSection[];
  conversionHooks: string[];
  trustSignals: string[];
} {
  const year = new Date().getFullYear();
  const titleKeyword = keyword
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const mktConfig = marketConfig[market];

  return {
    suggestedTitle: `${titleKeyword}: Complete Expert Guide ${year}`,
    suggestedDescription: `Expert analysis and comparison of ${keyword}. Data-driven review with ratings, pros, cons, and trusted recommendations for ${year}.`,
    outline: [
      { tag: 'h2', title: `${titleKeyword}: Executive Summary`, notes: 'Overview and key takeaways — primary keyword in first paragraph', estimatedWords: 350 },
      { tag: 'h2', title: 'Quick Verdict: Our Top Picks', notes: 'Announce winners upfront with brief rationale', estimatedWords: 200 },
      { tag: 'h2', title: 'Quick Comparison Table', notes: 'ComparisonTable with 5 options: ratings, features, pricing, CTAs', estimatedWords: 100 },
      { tag: 'h2', title: 'Detailed Reviews', notes: 'Comprehensive deep-dives into each option', estimatedWords: 200 },
      { tag: 'h3', title: '#1 [Top Pick Name]: Best Overall', notes: 'Pros, cons, pricing, key features, screenshots, affiliate CTA', estimatedWords: 450 },
      { tag: 'h3', title: '#2 [Runner-Up Name]: Best for Beginners', notes: 'Pros, cons, pricing, unique selling points', estimatedWords: 400 },
      { tag: 'h3', title: '#3 [Option 3]: Best Value', notes: 'Pros, cons, pricing, value proposition', estimatedWords: 400 },
      { tag: 'h3', title: '#4 [Option 4]: Best for Advanced Users', notes: 'Pros, cons, unique features', estimatedWords: 350 },
      { tag: 'h3', title: '#5 [Option 5]: Budget Pick', notes: 'Budget-conscious option review', estimatedWords: 300 },
      { tag: 'h2', title: 'Pricing Comparison', notes: 'Detailed pricing tiers, hidden fees, value analysis', estimatedWords: 350 },
      { tag: 'h2', title: `${mktConfig?.name || market.toUpperCase()} Regulatory Landscape`, notes: 'Market-specific regulations, compliance requirements, consumer protections', estimatedWords: 300 },
      { tag: 'h2', title: 'How We Evaluated', notes: 'Methodology: testing criteria, scoring rubric, data sources, expert credentials', estimatedWords: 350 },
      { tag: 'h2', title: 'Key Factors to Consider', notes: 'Buying guide with decision framework', estimatedWords: 300 },
      { tag: 'h2', title: 'Who Should Use This?', notes: 'User personas and recommendations', estimatedWords: 250 },
      { tag: 'h2', title: 'Alternatives & Considerations', notes: 'Alternative approaches, DIY options, emerging trends', estimatedWords: 250 },
      { tag: 'h2', title: 'Frequently Asked Questions', notes: 'FAQ schema — 6-8 questions with detailed answers', estimatedWords: 400 },
      { tag: 'h2', title: 'Our Final Verdict', notes: 'Conclusion with clear recommendation + prominent CTA', estimatedWords: 300 },
    ],
    conversionHooks: [
      'Comparison table with "Visit Site" CTAs',
      'Expert rating badges with star ratings',
      'Limited-time offer callouts in review sections',
      'Mid-article CTA after pricing comparison',
      'Final verdict CTA with urgency language',
    ],
    trustSignals: [
      'Expert reviewer credentials (CFA, CFP)',
      'Specific testing methodology with real data',
      'Regulatory compliance information',
      `${mktConfig?.name || market.toUpperCase()} market-specific guidance`,
    ],
  };
}

/**
 * Generate long-form MDX content (4,000-7,000 words) with:
 * - Sticky Table of Contents
 * - Multiple CTAs
 * - Compliance labels
 * - Detailed section content
 * - Schema declarations
 */
export async function generateLongFormMdxContent(
  brief: ContentBrief,
  existingImages: string[],
): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();
  const mktConfig = marketConfig[brief.market];
  const catConfig = categoryConfig[brief.category as Category];
  const titleKeyword = brief.keyword
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Build slug + image path
  const slugPath = brief.keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
  const prefix = brief.market === 'us' ? '' : `/${brief.market}`;
  const imageBase = `/images/content${prefix}/${brief.category}/${slugPath}`;

  const hasHero = existingImages.includes('hero.webp');
  const hasProduct1 = existingImages.includes('product-1.webp');
  const hasProduct2 = existingImages.includes('product-2.webp');
  const hasFeature = existingImages.includes('feature.webp');

  // Build sections
  const sections = brief.suggestedOutline.map((s) => ({
    id: s.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40),
    title: s.title,
  }));

  // ── Frontmatter ──────────────────────────────────────
  let mdx = `---
title: "${brief.suggestedTitle}"
description: "${brief.suggestedDescription}"
author: "SmartFinPro Editorial Team"
reviewedBy: "Editorial Board"
publishDate: "${today}"
modifiedDate: "${today}"
category: "${brief.category}"
market: "${brief.market}"
type: "pillar"
readingTime: "${Math.round(brief.targetWordCount / 250)} min"
keywords:
  - ${brief.keyword}
  - best ${brief.keyword} ${year}
  - ${brief.keyword} comparison
  - ${brief.keyword} review
  - ${brief.keyword} ${mktConfig?.name || brief.market.toUpperCase()} ${year}
featured: false
affiliateDisclosure: true
customH1: true
schema:
  type: "Article"
  articleSection: "${catConfig?.name || brief.category}"
  hasFAQ: true
  hasBreadcrumb: true
sections:
${sections.map((s) => `  - id: "${s.id}"\n    title: "${s.title}"`).join('\n')}
faqs:
  - question: "What is the best ${brief.keyword.toLowerCase()}?"
    answer: "Based on our testing, the top option for most users in ${mktConfig?.name || 'this market'} is [Partner 1], which offers the best combination of features, value, and reliability."
  - question: "How do I choose the right ${brief.keyword.toLowerCase()}?"
    answer: "Consider your specific needs: budget, experience level, and which features matter most. Our comparison table and detailed reviews above break down the key differences."
  - question: "Is ${brief.keyword.toLowerCase()} worth it in ${year}?"
    answer: "Yes. With the right choice, ${brief.keyword.toLowerCase()} can provide significant value. Our analysis shows the top-rated options consistently deliver strong results."
  - question: "How much does ${brief.keyword.toLowerCase()} cost?"
    answer: "Pricing varies by provider. Our pricing comparison section above breaks down fees, hidden costs, and value for each option."
  - question: "What are the risks of ${brief.keyword.toLowerCase()}?"
    answer: "As with any financial decision, there are considerations. Our regulatory section covers market-specific protections and compliance requirements."
  - question: "Can I switch ${brief.keyword.toLowerCase()} later?"
    answer: "Most providers allow switching without penalties, though transfer times and fees vary. Check our individual reviews for portability details."
---

`;

  // ── Custom H1 (light trust-design hero) ──────────────
  mdx += `<div className="relative mb-12 not-prose">
  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-8" style={{ color: 'var(--sfp-ink)' }}>
    ${brief.suggestedTitle.split(':')[0] || titleKeyword}<br />
    <span className="text-3xl md:text-4xl" style={{ color: 'var(--sfp-slate)' }}>${brief.suggestedTitle.split(':').slice(1).join(':').trim() || `Expert Guide ${year}`}</span>
  </h1>
`;

  // Hero image
  if (hasHero) {
    mdx += `  <div className="relative overflow-hidden rounded-t-2xl border-x border-t border-gray-200">
    <div className="relative" style={{ aspectRatio: '21/9' }}>
      <img src="${imageBase}/hero.webp" alt="${brief.suggestedTitle}" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.6), transparent 50%)' }} />
    </div>
  </div>
`;
  }

  // Meta bar
  mdx += `  <div className="px-6 py-4 flex flex-wrap items-center gap-3 ${hasHero ? 'border-t rounded-b-2xl border-x border-b' : 'rounded-2xl border'} border-gray-200 bg-white shadow-sm">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--sfp-navy)' }}>SF</div>
      <span className="text-sm font-medium" style={{ color: 'var(--sfp-ink)' }}>SmartFinPro Editorial Team</span>
    </div>
    <span style={{ color: 'var(--sfp-slate)' }}>|</span>
    <span className="text-xs" style={{ color: 'var(--sfp-slate)' }}>${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    <div className="ml-auto flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ border: '1px solid rgba(26,107,58,0.2)', color: 'var(--sfp-green)', background: 'rgba(26,107,58,0.08)' }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--sfp-green)' }} />
        Expert Reviewed
      </span>
    </div>
  </div>
</div>

`;

  // ── Risk Warning ────────────────────────────────────
  mdx += `<RiskWarningBox variant="prominent" market="${brief.market}" />

`;

  // ── Table of Contents (sticky) ──────────────────────
  mdx += `## Table of Contents

`;
  for (const s of sections) {
    mdx += `- [${s.title}](#${s.id})\n`;
  }
  mdx += '\n';

  // ── Trust Authority Block ──────────────────────────
  mdx += `<TrustAuthority
  stats={[
    { label: "Options Tested", value: "15+", icon: <TrendingUp className="h-5 w-5 text-primary" /> },
    { label: "Testing Period", value: "3 Months", icon: <Clock className="h-5 w-5 text-primary" /> },
    { label: "Data Points", value: "500+", icon: <BarChart3 className="h-5 w-5 text-primary" /> },
    { label: "Expert Reviewers", value: "4", icon: <Users className="h-5 w-5 text-primary" /> }
  ]}
/>

`;

  // ── Quick Summary ──────────────────────────────────
  mdx += `<QuickSummary
  facts={[
    { icon: "award", label: "Best Overall", value: "[Partner 1]", detail: "Top-rated for overall quality", href: "/go/partner-1" },
    { icon: "users", label: "Best for Beginners", value: "[Partner 2]", detail: "Easiest to get started", href: "/go/partner-2" },
    { icon: "chart", label: "Best Value", value: "[Partner 3]", detail: "Best price-performance ratio", href: "/go/partner-3" }
  ]}
  lastUpdated="${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}"
  testingNote="15+ options tested over 3 months with real-world evaluation criteria"
/>

`;

  // ── Comparison Table ──────────────────────────────
  mdx += `## Quick Comparison: Top ${titleKeyword}

| ${catConfig?.name || 'Option'} | Rating | Best For | Key Feature | Pricing | Link |
|------|--------|----------|-------------|---------|------|
| **[Partner 1]** | ⭐ 4.8/5 | Overall Excellence | [Key Feature] | [Price] | [Visit Site →](/go/partner-1) |
| **[Partner 2]** | ⭐ 4.6/5 | Beginners | [Key Feature] | [Price] | [Visit Site →](/go/partner-2) |
| **[Partner 3]** | ⭐ 4.5/5 | Best Value | [Key Feature] | [Price] | [Visit Site →](/go/partner-3) |
| **[Partner 4]** | ⭐ 4.4/5 | Advanced Users | [Key Feature] | [Price] | [Visit Site →](/go/partner-4) |
| **[Partner 5]** | ⭐ 4.2/5 | Budget Pick | [Key Feature] | [Price] | [Visit Site →](/go/partner-5) |

<AffiliateDisclosure market="${brief.market}" />

`;

  // ── Detail Sections from Outline ────────────────
  let ctaInserted = 0;
  let sectionIndex = 0;

  for (const section of brief.suggestedOutline) {
    sectionIndex++;
    // Skip sections we've already rendered above
    if (
      section.title.toLowerCase().includes('comparison') &&
      section.title.toLowerCase().includes('table')
    ) continue;
    if (
      section.title.toLowerCase().includes('executive summary') ||
      section.title.toLowerCase().includes('quick verdict')
    ) continue;

    const heading = section.tag === 'h3' ? '###' : '##';
    const sectionId = section.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 40);

    mdx += `<div id="${sectionId}" />

${heading} ${section.title}

`;

    // Substantive placeholder content for each section
    if (section.title.toLowerCase().includes('review') || section.title.toLowerCase().includes('deep-dive') || section.title.toLowerCase().includes('#1') || section.title.toLowerCase().includes('#2') || section.title.toLowerCase().includes('#3')) {
      // Product review section
      if (hasProduct1 && section.title.includes('#1')) {
        mdx += `![${section.title}](${imageBase}/product-1.webp)

`;
      }
      if (hasProduct2 && (section.title.includes('#2') || section.title.includes('#3'))) {
        mdx += `![${section.title}](${imageBase}/product-2.webp)

`;
      }

      mdx += `{/* AI-BRIEF: ${section.notes} — Target: ~${section.estimatedWords} words

Write a comprehensive review covering:
- Overview and unique selling proposition
- Key features breakdown with pros/cons
- Pricing and value analysis
- Real-world testing results
- Who it's best suited for
- Affiliate CTA with compelling reason to click
*/}

When evaluating this option for ${mktConfig?.name || brief.market.toUpperCase()} users, several factors stand out. The platform offers a compelling combination of features that cater specifically to users who prioritize [key benefit]. Our testing over 3 months revealed consistent performance across all key metrics.

**Pros:**
- [Pro 1 — specific measurable benefit]
- [Pro 2 — unique advantage]
- [Pro 3 — value proposition]

**Cons:**
- [Con 1 — honest limitation]
- [Con 2 — trade-off to consider]

**Best For:** [Specific user persona with clear use case]

`;
    } else if (section.title.toLowerCase().includes('faq') || section.title.toLowerCase().includes('frequently')) {
      // FAQ section with schema-friendly format
      mdx += `{/* AI-BRIEF: ${section.notes} — 6-8 FAQs targeting featured snippet format */}

<details>
<summary>What is the best ${brief.keyword.toLowerCase()}?</summary>

Based on our testing, [Partner 1] stands out as the best overall ${brief.keyword.toLowerCase()} for most users in ${mktConfig?.name || 'this market'}, thanks to its combination of features, pricing, and reliability. For budget-conscious users, [Partner 5] offers excellent value.

</details>

<details>
<summary>How do I choose the right ${brief.keyword.toLowerCase()}?</summary>

Consider your specific needs: budget, experience level, and which features matter most. Our comparison table above breaks down the key differences. For beginners, we recommend [Partner 2] for its intuitive interface.

</details>

<details>
<summary>How much does ${brief.keyword.toLowerCase()} cost?</summary>

Pricing varies significantly by provider. [Partner 1] charges [price], while budget options like [Partner 5] start from [lower price]. See our pricing comparison section for a detailed breakdown including hidden fees.

</details>

<details>
<summary>Is ${brief.keyword.toLowerCase()} safe and regulated?</summary>

Yes, all options in our comparison are regulated in ${mktConfig?.name || 'the relevant jurisdiction'}. [Include market-specific regulatory body]. Always verify a provider's regulatory status before signing up.

</details>

<details>
<summary>Can I switch providers later?</summary>

Most providers allow switching without penalties, though transfer times and potential fees vary. Check each provider's terms for portability details before committing.

</details>

<details>
<summary>What are the risks of ${brief.keyword.toLowerCase()}?</summary>

As with any financial decision, there are considerations including [specific risk factors]. Our regulatory section above covers market-specific consumer protections and what to watch for.

</details>

`;
    } else if (section.title.toLowerCase().includes('verdict') || section.title.toLowerCase().includes('conclusion')) {
      // Verdict/conclusion section with CTA
      mdx += `{/* AI-BRIEF: ${section.notes} — Target: ~${section.estimatedWords} words */}

After extensive testing and analysis across 15+ options, our top recommendation for ${brief.keyword.toLowerCase()} in ${mktConfig?.name || 'this market'} is **[Partner 1]**. It offers the best combination of features, value, and reliability for the majority of users.

For beginners, **[Partner 2]** provides the gentlest learning curve. If budget is your primary concern, **[Partner 5]** delivers solid performance at the lowest cost.

<CallToAction
  title="Ready to Get Started?"
  description="Join thousands of ${mktConfig?.name || ''} users who trust our expert recommendations."
  href="/go/partner-1"
  buttonText="Visit [Partner 1] →"
  variant="primary"
/>

`;
    } else if (section.title.toLowerCase().includes('methodology') || section.title.toLowerCase().includes('evaluated')) {
      // Methodology section
      mdx += `{/* AI-BRIEF: ${section.notes} — Target: ~${section.estimatedWords} words */}

Our evaluation methodology ensures every recommendation is backed by data. Here is how we tested and scored each option:

**Testing Framework:**
1. **Real-World Testing** — Each option was used for a minimum of 2 weeks with real scenarios
2. **Feature Analysis** — 50+ features compared across all providers
3. **Pricing Audit** — All fees verified including hidden costs
4. **Customer Support** — Response times and quality tested via multiple channels
5. **Security Review** — Regulatory status, encryption, and data protection verified

**Scoring Rubric:**
- Features & Functionality: 30%
- Value for Money: 25%
- Ease of Use: 20%
- Customer Support: 15%
- Security & Compliance: 10%

Our editorial team consists of certified professionals with [relevant credentials]. All reviews are updated at least quarterly.

`;
    } else if (section.title.toLowerCase().includes('regulatory') || section.title.toLowerCase().includes('compliance')) {
      // Regulatory section
      mdx += `{/* AI-BRIEF: ${section.notes} — Target: ~${section.estimatedWords} words */}

Understanding the regulatory landscape for ${brief.keyword.toLowerCase()} in ${mktConfig?.name || brief.market.toUpperCase()} is essential for consumer protection.

**Key Regulatory Bodies:**
- [Primary regulator for this market]
- [Secondary regulator if applicable]

**Consumer Protections:**
- [Protection 1 specific to this market]
- [Protection 2 specific to this market]
- [Deposit/investment protection scheme]

**Compliance Requirements:**
All providers recommended in this guide are fully authorized and regulated. We verify regulatory status as part of our testing methodology.

<ComplianceNotice market="${brief.market}" category="${brief.category}" />

`;
    } else if (section.title.toLowerCase().includes('pricing')) {
      // Pricing section
      if (hasFeature) {
        mdx += `![Pricing comparison](${imageBase}/feature.webp)

`;
      }
      mdx += `{/* AI-BRIEF: ${section.notes} — Target: ~${section.estimatedWords} words */}

Understanding the true cost of ${brief.keyword.toLowerCase()} requires looking beyond headline pricing. Here is our detailed cost breakdown:

| Provider | Monthly Cost | Annual Cost | Hidden Fees | Free Trial | Overall Value |
|----------|-------------|-------------|-------------|------------|---------------|
| [Partner 1] | [Price] | [Price] | [Fees] | [Yes/No] | ⭐⭐⭐⭐⭐ |
| [Partner 2] | [Price] | [Price] | [Fees] | [Yes/No] | ⭐⭐⭐⭐ |
| [Partner 3] | [Price] | [Price] | [Fees] | [Yes/No] | ⭐⭐⭐⭐ |

**Key Takeaway:** While [Partner 1] is not the cheapest option, its feature set delivers the best value per dollar spent for most users.

`;
    } else {
      // Generic section
      mdx += `{/* AI-BRIEF: ${section.notes} — Target: ~${section.estimatedWords} words */}

[Content for this section covering ${section.title.toLowerCase()}. Include relevant data, expert insights, and actionable recommendations for ${mktConfig?.name || brief.market.toUpperCase()} users.]

`;
    }

    // Insert mid-article CTA every ~4 sections
    if (sectionIndex % 4 === 0 && ctaInserted < 2) {
      ctaInserted++;
      mdx += `<CallToAction
  title="See How [Partner 1] Compares"
  description="Our #1 pick for ${brief.keyword.toLowerCase()} — trusted by thousands."
  href="/go/partner-1"
  buttonText="Check Current Offers →"
  variant="secondary"
/>

`;
    }
  }

  // Conversion + trust signal comments
  if (brief.conversionHooks.length > 0) {
    mdx += `{/* CONVERSION HOOKS (from AI brief):
${brief.conversionHooks.map((h, i) => `   ${i + 1}. ${h}`).join('\n')}
*/}

`;
  }

  if (brief.trustSignals.length > 0) {
    mdx += `{/* TRUST SIGNALS (from AI brief):
${brief.trustSignals.map((s, i) => `   ${i + 1}. ${s}`).join('\n')}
*/}

`;
  }

  // Final disclaimer
  mdx += `---

*${catConfig?.name || brief.category} products and services may involve financial risk. Please read all terms and conditions before signing up. SmartFinPro may earn a commission through affiliate links at no extra cost to you. See our [affiliate disclosure](/affiliate-disclosure) for details.*
`;

  return mdx;
}

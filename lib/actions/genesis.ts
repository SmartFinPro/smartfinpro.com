'use server';

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging';

import { createServiceClient } from '@/lib/supabase/server';
import {
  fetchTopCompetitorUrls,
  scrapeHeadings,
  generateLongFormBriefWithAI,
  generateLongFormMdxContent,
  type CompetitorOutline,
  type ContentBrief,
  type ImageRequirement,
} from '@/lib/actions/content-generator';

const GL_MAP: Record<string, string> = { us: 'us', uk: 'uk', ca: 'ca', au: 'au' };
import { boostAndDeploy } from '@/lib/actions/content-overrides';
import { registerAffiliateSlug, getComplianceLabel } from '@/lib/affiliate/link-registry';
import { extractDomain } from '@/lib/seo/competitor-keywords';
import { marketConfig, categoryConfig, marketCategories } from '@/lib/i18n/config';
import type { Market, Category } from '@/lib/i18n/config';
import * as fs from 'fs';
import * as path from 'path';

// ════════════════════════════════════════════════════════════════
// AUTO-GENESIS HUB — Server Actions
//
// Orchestrates the 4-step content creation pipeline:
// Step 1: magicFind        → Competitor & keyword research + CPA
// Step 2: generateLongForm → AI-powered 4,000-7,000 word MDX
// Step 3: processImages    → Sharp WebP + AI alt-text
// Step 4: distributeAndIndex → Affiliate mapping + deploy + index
// ════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export interface KeywordSuggestion {
  keyword: string;
  market: Market;
  category: string;
  competitorOutlines: CompetitorOutline[];
  competitorCount: number;
  estimatedCpaRevenue: number;
  topProviderCpa: number;
  topProviderName: string;
  gapType: 'missing' | 'behind' | 'weak';
  opportunityScore: number;
}

export interface ResearchResult {
  suggestions: KeywordSuggestion[];
  query: string;
  market: Market;
  category: string;
  scannedAt: string;
  runId: string;
}

export interface GenerationProgress {
  step: 'idle' | 'research' | 'outline' | 'content' | 'schema' | 'writing' | 'done' | 'error';
  progress: number;
  message: string;
}

export interface ImageUpload {
  filename: string;
  originalName: string;
  altText: string;
  width: number;
  height: number;
  sizeKb: number;
  position: 'hero' | 'mid-scroll' | 'comparison' | 'deep-content';
}

export interface AffiliateMappingEntry {
  partnerName: string;
  slug: string;
  cpaValue: number;
  currency: string;
  position: 'hero-cta' | 'comparison-table' | 'mid-article' | 'conclusion';
}

export interface GenesisRunState {
  id: string;
  keyword: string;
  market: Market;
  category: string;
  status: 'research' | 'generating' | 'media' | 'publishing' | 'completed' | 'failed';
  researchData: ResearchResult | null;
  brief: ContentBrief | null;
  mdxFilePath: string | null;
  slug: string | null;
  wordCount: number | null;
  images: ImageUpload[];
  affiliateMappings: AffiliateMappingEntry[];
  generationProgress: GenerationProgress;
  indexedAt: string | null;
  createdAt: string;
}

export interface CreateReviewFromTemplateInput {
  market: Market;
  category: string;
  title: string;
  bodyContent: string;
  slug?: string;
  reviewedBy?: string;
  affiliateUrl?: string;
  author?: string;
  autoPartner?: boolean;
  force?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---[\s\S]*?---\s*/m, '');
}

// ── Step 1: Magic Find ───────────────────────────────────────

export async function magicFind(
  query: string,
  market: Market,
  category: string,
): Promise<{ success: boolean; data: ResearchResult | null; error: string | null }> {
  try {
    const supabase = createServiceClient();

    // 1. Fetch top competitors via Serper
    const competitors = await fetchTopCompetitorUrls(query, market);

    // 2. Scrape headings from each competitor
    const competitorOutlines: CompetitorOutline[] = [];
    for (const comp of competitors) {
      const headings = await scrapeHeadings(comp.link);
      competitorOutlines.push({
        domain: comp.domain,
        title: comp.title,
        url: comp.link,
        headings,
      });
      await new Promise((r) => setTimeout(r, 100)); // Rate limit
    }

    // 3. Get related keywords via Serper
    const apiKey = process.env.SERPER_API_KEY;
    let relatedKeywords: string[] = [];
    if (apiKey) {
      try {
        const res = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: query, gl: GL_MAP[market] || 'us', num: 10 }),
        });
        if (res.ok) {
          const data = await res.json();
          relatedKeywords = (data.relatedSearches || [])
            .slice(0, 5)
            .map((r: { query: string }) => r.query);
        }
      } catch { /* ignore */ }
    }

    // 4. Query affiliate_rates for CPA data
    const { data: rates } = await supabase
      .from('affiliate_rates')
      .select('provider_name, cpa_value, currency, avg_conversion_rate')
      .eq('active', true)
      .or(`market.eq.${market},market.is.null`);

    const topRate = (rates || []).sort((a, b) => b.cpa_value - a.cpa_value)[0];
    const topCpa = topRate?.cpa_value || 0;
    const topProvider = topRate?.provider_name || 'Unknown';
    const avgConvRate = topRate?.avg_conversion_rate || 0.03;

    // 5. Build 3 keyword suggestions
    const keywords = [query, ...relatedKeywords.slice(0, 2)];
    const suggestions: KeywordSuggestion[] = keywords.map((kw, i) => {
      // Heuristic: opportunity score based on competitor depth
      const avgHeadings = competitorOutlines.reduce((s, c) => s + c.headings.length, 0) / Math.max(competitorOutlines.length, 1);
      const competitorDepthScore = avgHeadings < 10 ? 90 : avgHeadings < 20 ? 70 : 50;
      const opportunityScore = Math.min(100, competitorDepthScore + (i === 0 ? 10 : 0));

      // CPA revenue estimate (conservative: CPS-based traffic × conversion × CPA)
      const estMonthlyTraffic = Math.round(opportunityScore * 8); // ~640-800 est. monthly visits
      const estimatedCpaRevenue = Math.round(topCpa * avgConvRate * estMonthlyTraffic * 100) / 100;

      return {
        keyword: kw,
        market,
        category,
        competitorOutlines: i === 0 ? competitorOutlines : [],
        competitorCount: competitorOutlines.length,
        estimatedCpaRevenue,
        topProviderCpa: topCpa,
        topProviderName: topProvider,
        gapType: (avgHeadings < 10 ? 'missing' : avgHeadings < 20 ? 'weak' : 'behind') as KeywordSuggestion['gapType'],
        opportunityScore,
      };
    });

    // 6. Create pipeline run
    const { data: run, error: runError } = await supabase
      .from('genesis_pipeline_runs')
      .insert({
        keyword: query,
        market,
        category,
        status: 'research',
        research_data: { suggestions, query, market, category, scannedAt: new Date().toISOString() },
      })
      .select('id')
      .single();

    if (runError) {
      logger.error('[genesis] Pipeline run creation failed:', runError.message);
    }

    const result: ResearchResult = {
      suggestions,
      query,
      market,
      category,
      scannedAt: new Date().toISOString(),
      runId: run?.id || '',
    };

    return { success: true, data: result, error: null };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[genesis] magicFind failed:', msg);
    return { success: false, data: null, error: msg };
  }
}

// ── Step 2: Generate Long-Form Asset ─────────────────────────

export async function generateLongFormAsset(
  runId: string,
  keyword: string,
  market: Market,
  category: string,
  researchBrief?: string,
): Promise<{ success: boolean; slug: string; filePath: string; wordCount: number; error?: string }> {
  const supabase = createServiceClient();

  const updateProgress = async (progress: GenerationProgress) => {
    await supabase
      .from('genesis_pipeline_runs')
      .update({ generation_progress: progress, updated_at: new Date().toISOString() })
      .eq('id', runId);
  };

  try {
    // Mark as generating
    await supabase
      .from('genesis_pipeline_runs')
      .update({ status: 'generating', selected_keyword: keyword })
      .eq('id', runId);

    // Auto-detect research brief from disk if none provided via UI
    let finalResearchBrief = researchBrief;
    if (!finalResearchBrief) {
      const slugBase = keyword
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60);
      const researchDir = path.join(process.cwd(), 'content', 'research', market, category);
      for (const ext of ['.md', '.txt']) {
        const candidate = path.join(researchDir, `${slugBase}${ext}`);
        if (fs.existsSync(candidate)) {
          finalResearchBrief = fs.readFileSync(candidate, 'utf-8');
          logger.info(`[genesis] Auto-loaded research brief: ${candidate}`);
          break;
        }
      }
    }

    // Step 2a: Competitor research
    await updateProgress({ step: 'research', progress: 10, message: 'Analyzing competitor landscape...' });
    const competitors = await fetchTopCompetitorUrls(keyword, market);

    const competitorOutlines: CompetitorOutline[] = [];
    for (const comp of competitors) {
      const headings = await scrapeHeadings(comp.link);
      competitorOutlines.push({
        domain: comp.domain,
        title: comp.title,
        url: comp.link,
        headings,
      });
      await new Promise((r) => setTimeout(r, 100));
    }

    // Step 2b: Generate AI brief
    await updateProgress({ step: 'outline', progress: 30, message: 'Building content outline with AI...' });
    const aiResult = await generateLongFormBriefWithAI(keyword, market, category, competitorOutlines, finalResearchBrief);

    // Step 2c: Build the brief
    await updateProgress({ step: 'content', progress: 55, message: 'Generating 4,000-7,000 word article...' });
    const slugBase = keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);

    const catConfig = categoryConfig[category as Category];
    const mktPrefix = `/${market}`;
    const fullSlug = `${mktPrefix}/${category}/${slugBase}`;

    // Build image requirements
    const imageReqs: ImageRequirement[] = [
      { filename: 'hero.webp', dimensions: '1200x600', purpose: 'Hero image' },
      { filename: 'product-1.webp', dimensions: '600x400', purpose: 'Top pick screenshot' },
      { filename: 'product-2.webp', dimensions: '600x400', purpose: 'Runner-up screenshot' },
      { filename: 'feature.webp', dimensions: '800x400', purpose: 'Feature highlight' },
    ];

    const internalLinkTargets = [
      `/${market}/${category}`,
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
      imageRequirements: imageReqs,
    };

    // Step 2d: Generate MDX
    const mdxProgressMsg = finalResearchBrief
      ? 'Generating AI-enriched MDX with research data...'
      : 'Generating MDX with Schema.org markup...';
    await updateProgress({ step: 'schema', progress: 70, message: mdxProgressMsg });
    const mdxContent = await generateLongFormMdxContent(brief, [], finalResearchBrief);

    // Step 2e: Write file
    await updateProgress({ step: 'writing', progress: 85, message: 'Writing MDX file to disk...' });
    const contentDir = path.join(process.cwd(), 'content', market, category);
    const filePath = path.join(contentDir, `${slugBase}.mdx`);

    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }
    fs.writeFileSync(filePath, mdxContent, 'utf-8');

    // Create image directory
    const imageDir = path.join(
      process.cwd(), 'public', 'images', 'content',
      market,
      category, slugBase,
    );
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    // Count words
    const wordCount = mdxContent
      .replace(/---[\s\S]*?---/, '') // Remove frontmatter
      .replace(/<[^>]+>/g, '') // Remove JSX tags
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // Remove comments
      .split(/\s+/)
      .filter(Boolean).length;

    // Step 2f: Update pipeline run
    await updateProgress({ step: 'done', progress: 100, message: `Done! ${wordCount.toLocaleString('en-US')} words generated.` });

    await supabase
      .from('genesis_pipeline_runs')
      .update({
        status: 'media',
        brief,
        mdx_file_path: filePath.replace(process.cwd(), ''),
        slug: fullSlug,
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    logger.info(`[genesis] Long-form MDX created: ${filePath} (${wordCount} words)`);

    return {
      success: true,
      slug: fullSlug,
      filePath: filePath.replace(process.cwd(), ''),
      wordCount,
    };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[genesis] generateLongFormAsset failed:', msg);
    await updateProgress({ step: 'error', progress: 0, message: `Error: ${msg}` });
    await supabase
      .from('genesis_pipeline_runs')
      .update({ status: 'failed' })
      .eq('id', runId);
    return { success: false, slug: '', filePath: '', wordCount: 0, error: msg };
  }
}

// ── Step 3: Process & Insert Images ──────────────────────────

export async function processAndInsertImages(
  runId: string,
  imageData: Array<{ filename: string; altText: string; width: number; height: number; sizeKb: number; position: ImageUpload['position'] }>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  try {
    // Load pipeline run
    const { data: run } = await supabase
      .from('genesis_pipeline_runs')
      .select('slug, mdx_file_path, market, category')
      .eq('id', runId)
      .single();

    if (!run?.mdx_file_path) {
      return { success: false, error: 'Pipeline run not found or MDX not generated yet' };
    }

    const images: ImageUpload[] = imageData.map((img) => ({
      ...img,
      originalName: img.filename,
    }));

    // Read MDX file and insert image references at strategic positions
    const mdxPath = path.join(process.cwd(), run.mdx_file_path);
    if (fs.existsSync(mdxPath)) {
      let mdx = fs.readFileSync(mdxPath, 'utf-8');
      const market = run.market as Market;
      const slugBase = run.slug?.split('/').pop() || '';
      const prefix = `/${market}`;
      const imageBase = `/images/content${prefix}/${run.category}/${slugBase}`;

      // Insert images at their designated positions
      for (const img of images) {
        const imgMarkdown = `![${img.altText}](${imageBase}/${img.filename})\n\n`;

        if (img.position === 'hero') {
          // Insert after the custom H1 block
          const heroInsertPoint = mdx.indexOf('</div>\n\n<RiskWarningBox');
          if (heroInsertPoint > 0) {
            // Replace the hero image placeholder if exists, or insert before RiskWarning
            if (!mdx.includes(`${imageBase}/hero.webp`)) {
              mdx = mdx.slice(0, heroInsertPoint) + '</div>\n\n' + imgMarkdown + mdx.slice(heroInsertPoint + 8);
            }
          }
        } else if (img.position === 'comparison') {
          // Insert after the comparison table section
          const compIdx = mdx.indexOf('<AffiliateDisclosure');
          if (compIdx > 0) {
            const insertAt = mdx.indexOf('\n', compIdx + 20);
            if (insertAt > 0) {
              mdx = mdx.slice(0, insertAt + 1) + '\n' + imgMarkdown + mdx.slice(insertAt + 1);
            }
          }
        } else if (img.position === 'mid-scroll' || img.position === 'deep-content') {
          // Insert at ~55% or ~75% through the content
          const contentLines = mdx.split('\n');
          const targetLine = Math.floor(contentLines.length * (img.position === 'mid-scroll' ? 0.55 : 0.75));
          // Find nearest heading to insert after
          for (let i = targetLine; i >= targetLine - 20; i--) {
            if (i >= 0 && contentLines[i]?.startsWith('##')) {
              contentLines.splice(i + 2, 0, imgMarkdown);
              break;
            }
          }
          mdx = contentLines.join('\n');
        }
      }

      fs.writeFileSync(mdxPath, mdx, 'utf-8');
    }

    // Update pipeline run
    await supabase
      .from('genesis_pipeline_runs')
      .update({
        images,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    return { success: true };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[genesis] processAndInsertImages failed:', msg);
    return { success: false, error: msg };
  }
}

// ── Google Indexing — requestInstantIndexing ─────────────────
//
// Uses the googleapis library with Service Account JSON auth.
// Calls urlNotifications.publish with type URL_UPDATED.
// Env: GOOGLE_INDEXING_JSON — raw JSON string of the service account key.
// ─────────────────────────────────────────────────────────────

export interface IndexingResult {
  success: boolean;
  url: string;
  notifyTime: string | null;
  responseTimeMs: number;
  error?: string;
}

export async function requestInstantIndexing(
  url: string,
): Promise<IndexingResult> {
  const startTime = Date.now();

  try {
    const serviceAccountJson = process.env.GOOGLE_INDEXING_JSON;
    if (!serviceAccountJson) {
      return {
        success: false,
        url,
        notifyTime: null,
        responseTimeMs: Date.now() - startTime,
        error: 'GOOGLE_INDEXING_JSON not configured. Add your Service Account JSON to .env.',
      };
    }

    // Parse the service account credentials
    let credentials: { client_email: string; private_key: string };
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch {
      // Also try base64 decoding for backward compatibility
      try {
        const decoded = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
        credentials = JSON.parse(decoded);
      } catch {
        return {
          success: false,
          url,
          notifyTime: null,
          responseTimeMs: Date.now() - startTime,
          error: 'Invalid GOOGLE_INDEXING_JSON format — must be JSON or base64-encoded JSON.',
        };
      }
    }

    // Authenticate via googleapis library
    const { google } = await import('googleapis');
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({ version: 'v3', auth });

    // Publish URL_UPDATED notification
    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type: 'URL_UPDATED',
      },
    });

    const notifyTime = response.data?.urlNotificationMetadata?.latestUpdate?.notifyTime || null;
    const elapsed = Date.now() - startTime;

    logger.info(`[indexing] Successfully submitted: ${url} (${elapsed}ms)`, response.data);

    return {
      success: true,
      url,
      notifyTime,
      responseTimeMs: elapsed,
    };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[indexing] requestInstantIndexing failed:', msg);
    return {
      success: false,
      url,
      notifyTime: null,
      responseTimeMs: Date.now() - startTime,
      error: msg,
    };
  }
}

// ── Step 4: Distribute & Index ───────────────────────────────

export async function distributeAndIndex(
  runId: string,
  affiliateMappings: AffiliateMappingEntry[],
): Promise<{ success: boolean; deployed: boolean; indexed: boolean; indexingResult: IndexingResult | null; error?: string }> {
  const supabase = createServiceClient();

  try {
    // Load pipeline run
    const { data: run } = await supabase
      .from('genesis_pipeline_runs')
      .select('slug, mdx_file_path, market, category, keyword')
      .eq('id', runId)
      .single();

    if (!run?.mdx_file_path || !run?.slug) {
      return { success: false, deployed: false, indexed: false, indexingResult: null, error: 'Pipeline run not found' };
    }

    // Update status
    await supabase
      .from('genesis_pipeline_runs')
      .update({ status: 'publishing' })
      .eq('id', runId);

    const market = run.market as Market;
    const category = run.category as Category;

    // 1. Register affiliate links
    for (const mapping of affiliateMappings) {
      if (mapping.slug) {
        await registerAffiliateSlug(
          mapping.slug,
          mapping.partnerName,
          `https://placeholder.com/${mapping.slug}`, // User must update destination URL
          market,
          category,
        );
      }
    }

    // 2. Replace placeholders in MDX with actual partner names
    const mdxPath = path.join(process.cwd(), run.mdx_file_path);
    if (fs.existsSync(mdxPath)) {
      let mdx = fs.readFileSync(mdxPath, 'utf-8');
      affiliateMappings.forEach((mapping, i) => {
        const placeholder = `[Partner ${i + 1}]`;
        mdx = mdx.replaceAll(placeholder, mapping.partnerName);
        const slugPlaceholder = `/go/partner-${i + 1}`;
        mdx = mdx.replaceAll(slugPlaceholder, `/go/${mapping.slug}`);
      });
      fs.writeFileSync(mdxPath, mdx, 'utf-8');
    }

    // 3. Trigger freshness boost + deploy (ensures page rebuild before indexing)
    let deployed = false;
    try {
      const boostResult = await boostAndDeploy(run.slug, `Genesis Hub: ${run.keyword}`);
      deployed = boostResult.boostSuccess;
    } catch (err) {
      Sentry.captureException(err);
      logger.warn('[genesis] Boost failed:', err);
    }

    // 4. Google Indexing API via googleapis — only after deploy completes
    let indexed = false;
    let indexingResult: IndexingResult | null = null;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
    const fullUrl = `${siteUrl}${run.slug}`;

    try {
      indexingResult = await requestInstantIndexing(fullUrl);
      indexed = indexingResult.success;
    } catch {
      logger.warn('[genesis] Google Indexing API call failed — skipping');
    }

    // 5. Update pipeline run as completed
    await supabase
      .from('genesis_pipeline_runs')
      .update({
        status: 'completed',
        affiliate_mappings: affiliateMappings,
        indexed_at: indexed ? new Date().toISOString() : null,
        deployed_at: deployed ? new Date().toISOString() : null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    return { success: true, deployed, indexed, indexingResult };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[genesis] distributeAndIndex failed:', msg);
    await supabase
      .from('genesis_pipeline_runs')
      .update({ status: 'failed' })
      .eq('id', runId);
    return { success: false, deployed: false, indexed: false, indexingResult: null, error: msg };
  }
}

// ── Standalone Instant Index (for re-indexing existing content) ──

export async function instantIndexByRunId(
  runId: string,
): Promise<IndexingResult> {
  const supabase = createServiceClient();

  const { data: run } = await supabase
    .from('genesis_pipeline_runs')
    .select('slug')
    .eq('id', runId)
    .single();

  if (!run?.slug) {
    return { success: false, url: '', notifyTime: null, responseTimeMs: 0, error: 'Run not found' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
  const fullUrl = `${siteUrl}${run.slug}`;

  const result = await requestInstantIndexing(fullUrl);

  // Update indexed_at timestamp on success
  if (result.success) {
    await supabase
      .from('genesis_pipeline_runs')
      .update({ indexed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', runId);
  }

  return result;
}

// ── Utility: Get Progress ────────────────────────────────────

export async function getGenesisRunProgress(
  runId: string,
): Promise<{ progress: GenerationProgress; status: string } | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('genesis_pipeline_runs')
    .select('generation_progress, status')
    .eq('id', runId)
    .single();

  if (!data) return null;
  return {
    progress: (data.generation_progress as GenerationProgress) || { step: 'idle', progress: 0, message: '' },
    status: data.status,
  };
}

// ── Utility: Get Recent Runs ─────────────────────────────────

export async function getRecentRuns(limit: number = 10): Promise<GenesisRunState[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('genesis_pipeline_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    keyword: row.keyword,
    market: row.market as Market,
    category: row.category,
    status: row.status,
    researchData: row.research_data as ResearchResult | null,
    brief: row.brief as ContentBrief | null,
    mdxFilePath: row.mdx_file_path,
    slug: row.slug,
    wordCount: row.word_count,
    images: (row.images as ImageUpload[]) || [],
    affiliateMappings: (row.affiliate_mappings as AffiliateMappingEntry[]) || [],
    generationProgress: (row.generation_progress as GenerationProgress) || { step: 'idle', progress: 0, message: '' },
    indexedAt: row.indexed_at || null,
    createdAt: row.created_at,
  }));
}

// ── Utility: Get Affiliate Rates for Market ──────────────────

export async function getAffiliateRatesForMarket(
  market: Market,
): Promise<Array<{ providerName: string; cpaValue: number; currency: string }>> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('affiliate_rates')
    .select('provider_name, cpa_value, currency')
    .eq('active', true)
    .or(`market.eq.${market},market.is.null`)
    .order('cpa_value', { ascending: false });

  return (data || []).map((r) => ({
    providerName: r.provider_name,
    cpaValue: r.cpa_value,
    currency: r.currency,
  }));
}

// ── Utility: Top Partners for ComparisonHub ─────────────────

export interface HubPartner {
  providerName: string;
  cpaValue: number;
  currency: string;
  rating: number;
  tagline: string;
  affiliateUrl: string;
  reviewSlug: string | null;
  benefits: string[];
  slug: string; // affiliate slug e.g. "etoro"
  // Smart Conversion Engine fields
  winnerBadge: string | null;
  winnerBadgeType: 'editorial' | 'auto' | null;
  isFeatured: boolean;
  featuredHeadline: string | null;
  featuredOffer: string | null;
  clickCount30d: number;
}

/**
 * Fetch top partners for a category + market.
 *
 * sortBy controls the ordering:
 *   'cpa'    → commission_value DESC (Profit-First, A/B Variant A)
 *   'rating' → user rating DESC      (Trust-First, A/B Variant B)
 *
 * Primary source: `affiliate_links` (has `category` column for accurate filtering).
 * Cross-references MDX content for real ratings, pros, and review links.
 */
export async function getTopPartnersForHub(
  market: Market,
  category: string,
  limit: number = 5,
  sortBy: 'cpa' | 'rating' = 'cpa',
): Promise<HubPartner[]> {
  const supabase = createServiceClient();

  // 0. Parallel fetch: partner_metadata + click counts (non-blocking)
  const [metadataResult, clickCountsResult] = await Promise.allSettled([
    supabase
      .from('partner_metadata')
      .select('provider_name, winner_badge, winner_badge_type, is_featured, featured_headline, featured_offer, featured_expires_at')
      .eq('category', category)
      .or(`market.eq.${market},market.is.null`),
    supabase.rpc('get_provider_click_counts', {
      p_category: category,
      p_market: market,
      p_days_back: 30,
    }),
  ]);

  // Build lookup maps (graceful degradation if tables don't exist yet)
  const metadataMap = new Map<string, {
    winnerBadge: string | null;
    winnerBadgeType: 'editorial' | 'auto' | null;
    isFeatured: boolean;
    featuredHeadline: string | null;
    featuredOffer: string | null;
  }>();

  if (metadataResult.status === 'fulfilled' && metadataResult.value.data) {
    for (const m of metadataResult.value.data) {
      // Check if featured offer has expired
      const isExpired = m.featured_expires_at && new Date(m.featured_expires_at) < new Date();
      metadataMap.set(m.provider_name, {
        winnerBadge: m.winner_badge,
        winnerBadgeType: m.winner_badge_type as 'editorial' | 'auto' | null,
        isFeatured: m.is_featured && !isExpired,
        featuredHeadline: !isExpired ? m.featured_headline : null,
        featuredOffer: !isExpired ? m.featured_offer : null,
      });
    }
  }

  const clickCountMap = new Map<string, number>();
  if (clickCountsResult.status === 'fulfilled' && clickCountsResult.value.data) {
    for (const c of clickCountsResult.value.data as { provider_name: string; click_count: number }[]) {
      clickCountMap.set(c.provider_name, c.click_count);
    }
  }

  // 1. Query affiliate_links — the canonical source with category + market
  const { data: links } = await supabase
    .from('affiliate_links')
    .select('slug, partner_name, destination_url, category, market, commission_value, commission_currency, active')
    .eq('active', true)
    .eq('category', category)
    .eq('market', market)
    .order('commission_value', { ascending: false })
    .limit(limit * 2); // Fetch extra to allow filtering

  // Fallback: also try global links (market = null) if not enough
  let allLinks = links || [];
  if (allLinks.length < limit) {
    const { data: globalLinks } = await supabase
      .from('affiliate_links')
      .select('slug, partner_name, destination_url, category, market, commission_value, commission_currency, active')
      .eq('active', true)
      .eq('category', category)
      .is('market', null)
      .order('commission_value', { ascending: false })
      .limit(limit);

    if (globalLinks) {
      // Merge, deduplicate by partner_name
      const seenNames = new Set(allLinks.map((l) => l.partner_name));
      for (const gl of globalLinks) {
        if (!seenNames.has(gl.partner_name)) {
          allLinks.push(gl);
          seenNames.add(gl.partner_name);
        }
      }
    }
  }

  if (allLinks.length === 0) {
    // Ultimate fallback: query affiliate_rates (legacy path — no category column).
    // Use partner_metadata as category filter: only include providers that have
    // metadata for this category (prevents cross-category pollution).
    const categoryProviders = new Set(metadataMap.keys());

    const { data: rates } = await supabase
      .from('affiliate_rates')
      .select('provider_name, cpa_value, currency')
      .eq('active', true)
      .or(`market.eq.${market},market.is.null`)
      .order('cpa_value', { ascending: false })
      .limit(limit * 3); // Fetch extra to allow filtering

    if (!rates || rates.length === 0) return [];

    // Filter by category using partner_metadata, then limit
    const filteredRates = categoryProviders.size > 0
      ? rates.filter((r) => categoryProviders.has(r.provider_name)).slice(0, limit)
      : rates.slice(0, limit);

    if (filteredRates.length === 0) {
      // No category-matched providers — fall back to unfiltered
      return rates.slice(0, limit).map((r, i) => {
        const slug = r.provider_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return {
          providerName: r.provider_name,
          cpaValue: r.cpa_value,
          currency: r.currency,
          rating: 4.5 - i * 0.2,
          tagline: `Leading ${category.replace(/-/g, ' ')} platform`,
          affiliateUrl: `/go/${slug}`,
          reviewSlug: null,
          benefits: [],
          slug,
          winnerBadge: null,
          winnerBadgeType: null,
          isFeatured: false,
          featuredHeadline: null,
          featuredOffer: null,
          clickCount30d: clickCountMap.get(r.provider_name) ?? 0,
        };
      });
    }

    const fallbackPartners = filteredRates.map((r, i) => {
      const slug = r.provider_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const meta = metadataMap.get(r.provider_name);
      return {
        providerName: r.provider_name,
        cpaValue: r.cpa_value,
        currency: r.currency,
        rating: 4.5 - i * 0.2,
        tagline: `Leading ${category.replace(/-/g, ' ')} platform`,
        affiliateUrl: `/go/${slug}`,
        reviewSlug: null,
        benefits: [],
        slug,
        winnerBadge: meta?.winnerBadge ?? null,
        winnerBadgeType: meta?.winnerBadgeType ?? null,
        isFeatured: meta?.isFeatured ?? false,
        featuredHeadline: meta?.featuredHeadline ?? null,
        featuredOffer: meta?.featuredOffer ?? null,
        clickCount30d: clickCountMap.get(r.provider_name) ?? 0,
      };
    });

    // Featured partner always at position 0
    const featIdx = fallbackPartners.findIndex((p) => p.isFeatured);
    if (featIdx > 0) {
      const [feat] = fallbackPartners.splice(featIdx, 1);
      fallbackPartners.unshift(feat);
    }

    return fallbackPartners;
  }

  // 2. Cross-reference with MDX content for real ratings, pros, and review links
  let categorySlugMap = new Map<string, string>();
  let getContentBySlug: ((m: Market, c: Category, s: string) => Promise<any>) | null = null;
  try {
    const mdxModule = await import('@/lib/mdx');
    getContentBySlug = mdxModule.getContentBySlug;
    const allSlugs = await mdxModule.getAllContentSlugs();
    for (const s of allSlugs) {
      if (s.market === market && s.category === category) {
        categorySlugMap.set(s.slug.toLowerCase(), s.slug);
      }
    }
  } catch {
    // MDX module unavailable — continue without review cross-references
  }

  const prefix = `/${market}`;
  const partners: HubPartner[] = [];

  for (const link of allLinks) {
    if (partners.length >= limit) break;

    if (!link.partner_name) continue; // skip malformed records
    const providerSlug = link.partner_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Find matching review MDX slug
    const matchedSlug =
      categorySlugMap.get(`${providerSlug}-review`) ||
      categorySlugMap.get(`best-${providerSlug}-review-2026`) ||
      categorySlugMap.get(`${providerSlug}-review-2026`) ||
      categorySlugMap.get(`${link.slug}-review`) ||
      null;

    // Try to load MDX meta for real rating + pros
    let realRating = 4.5 - partners.length * 0.15;
    let benefits: string[] = [];
    let tagline = `Leading ${category.replace(/-/g, ' ')} platform`;

    if (matchedSlug && getContentBySlug) {
      try {
        const content = await getContentBySlug(
          market as Market,
          category as Category,
          matchedSlug,
        );
        if (content?.meta) {
          if (content.meta.rating) realRating = content.meta.rating;
          if (content.meta.pros?.length) benefits = content.meta.pros.slice(0, 3);
          if (content.meta.bestFor) tagline = content.meta.bestFor;
          else if (content.meta.description) {
            tagline = content.meta.description.length > 80
              ? content.meta.description.substring(0, 77) + '...'
              : content.meta.description;
          }
        }
      } catch {
        // MDX read failed — use defaults
      }
    }

    const meta = metadataMap.get(link.partner_name);
    partners.push({
      providerName: link.partner_name,
      cpaValue: link.commission_value || 0,
      currency: link.commission_currency || 'USD',
      rating: realRating,
      tagline,
      affiliateUrl: `/go/${link.slug}`,
      reviewSlug: matchedSlug ? `${prefix}/${category}/${matchedSlug}` : null,
      benefits,
      slug: link.slug,
      winnerBadge: meta?.winnerBadge ?? null,
      winnerBadgeType: meta?.winnerBadgeType ?? null,
      isFeatured: meta?.isFeatured ?? false,
      featuredHeadline: meta?.featuredHeadline ?? null,
      featuredOffer: meta?.featuredOffer ?? null,
      clickCount30d: clickCountMap.get(link.partner_name) ?? 0,
    });
  }

  // Re-sort by requested field (A/B variant support)
  if (sortBy === 'rating') {
    partners.sort((a, b) => b.rating - a.rating);
  }
  // 'cpa' is already the default DB sort — no re-sort needed

  // Featured partner always at position 0
  const featuredIdx = partners.findIndex((p) => p.isFeatured);
  if (featuredIdx > 0) {
    const [featured] = partners.splice(featuredIdx, 1);
    partners.unshift(featured);
  }

  return partners;
}

// ── Create Review from Master Template ──────────────────────

export async function createReviewFromTemplate(
  input: CreateReviewFromTemplateInput,
): Promise<{ success: boolean; filePath?: string; slug?: string; pageUrl?: string; affiliateUrl?: string; partnerName?: string; error?: string }> {
  try {
    const market = input.market;
    const category = input.category;
    const title = input.title?.trim();
    const bodyContent = input.bodyContent?.trim();

    if (!title) return { success: false, error: 'Title is required' };
    if (!bodyContent) return { success: false, error: 'Body content is required' };

    const allowedCategories = marketCategories[market] || [];
    if (!allowedCategories.includes(category as Category)) {
      return { success: false, error: `Category '${category}' is not valid for market '${market}'` };
    }

    const resolvedSlug = (input.slug?.trim() || slugify(title)).slice(0, 90);
    if (!resolvedSlug) return { success: false, error: 'Unable to generate slug from title' };

    const templatePath = path.join(process.cwd(), 'content', '_templates', 'expert-review-master.mdx');
    if (!fs.existsSync(templatePath)) {
      return { success: false, error: 'Master template not found: content/_templates/expert-review-master.mdx' };
    }

    const targetDir = path.join(process.cwd(), 'content', market, category);
    const targetPath = path.join(targetDir, `${resolvedSlug}.mdx`);

    if (fs.existsSync(targetPath) && !input.force) {
      return { success: false, error: `File already exists: /content/${market}/${category}/${resolvedSlug}.mdx` };
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const template = fs.readFileSync(templatePath, 'utf-8');
    const today = new Date().toISOString().slice(0, 10);
    const reviewedBy = input.reviewedBy?.trim() || '[EXPERT NAME], [ROLE + CREDENTIALS]';
    const shouldAutoPartner = input.autoPartner !== false;
    let affiliateUrl = input.affiliateUrl?.trim() || '';
    let partnerName = '[Primary Partner Name]';
    let partnerTagline = '[Positioning line]';
    let bestForBadge = '[Best for ...]';

    if (shouldAutoPartner && (!affiliateUrl || affiliateUrl.includes('[partner-slug]'))) {
      const supabase = createServiceClient();

      // Strict source of truth: CTA partners managed in dashboard/affiliate_links by market+category.
      let partnerRow:
        | { partner_name: string; slug: string; commission_value: number | null }
        | null = null;

      const marketResult = await supabase
        .from('affiliate_links')
        .select('partner_name, slug, commission_value')
        .eq('active', true)
        .eq('market', market)
        .eq('category', category)
        .order('commission_value', { ascending: false })
        .limit(1)
        .maybeSingle();

      partnerRow = marketResult.data;

      // Fallback only to global entries WITH same category.
      if (!partnerRow) {
        const globalResult = await supabase
          .from('affiliate_links')
          .select('partner_name, slug, commission_value')
          .eq('active', true)
          .is('market', null)
          .eq('category', category)
          .order('commission_value', { ascending: false })
          .limit(1)
          .maybeSingle();
        partnerRow = globalResult.data;
      }

      if (!partnerRow) {
        return {
          success: false,
          error: `No CTA partner configured for market='${market}' and category='${category}' in affiliate_links.`,
        };
      }

      affiliateUrl = `/go/${partnerRow.slug}`;
      partnerName = partnerRow.partner_name || partnerName;
      bestForBadge = `Best for ${category.replace(/-/g, ' ')}`;

      if (partnerRow.commission_value && partnerRow.commission_value > 0) {
        partnerTagline = `Top ${category.replace(/-/g, ' ')} partner (CPA $${partnerRow.commission_value})`;
      } else {
        partnerTagline = `Top ${category.replace(/-/g, ' ')} partner`;
      }
    }

    if (!affiliateUrl) {
      affiliateUrl = '/go/[partner-slug]';
    }
    const author = input.author?.trim() || 'SmartFinPro Finance Team';

    const replacements: Array<[string, string]> = [
      ['[PRIMARY KEYWORD] [YEAR]: Complete Expert Review', title],
      ['[CATEGORY-SLUG]', category],
      ['[us|uk|ca|au]', market],
      ['[EXPERT NAME], [ROLE + CREDENTIALS]', reviewedBy],
      ['/go/[partner-slug]', affiliateUrl],
      ['[Primary Partner Name]', partnerName],
      ['[Positioning line]', partnerTagline],
      ['[Best for ...]', bestForBadge],
      ['author: "SmartFinPro Finance Team"', `author: "${author}"`],
      ['publishDate: "2026-02-24"', `publishDate: "${today}"`],
      ['modifiedDate: "2026-02-24"', `modifiedDate: "${today}"`],
    ];

    let output = template;
    for (const [from, to] of replacements) {
      output = output.replace(new RegExp(escapeRegExp(from), 'g'), to);
    }

    const normalizedBody = stripFrontmatter(bodyContent).trim();
    output = output.replace(/## Executive Summary[\s\S]*$/m, `${normalizedBody}\n`);

    fs.writeFileSync(targetPath, output, 'utf-8');

    return {
      success: true,
      filePath: `/content/${market}/${category}/${resolvedSlug}.mdx`,
      slug: resolvedSlug,
      pageUrl: `/${market}/${category}/${resolvedSlug}`,
      affiliateUrl,
      partnerName,
    };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[genesis] createReviewFromTemplate failed:', msg);
    return { success: false, error: msg };
  }
}

// ── Preview: Auto CTA Partner for Template Creator ──────────

export async function getAutoTemplatePartnerPreview(
  market: Market,
  category: string,
): Promise<{ success: boolean; partnerName?: string; affiliateUrl?: string; source?: 'market' | 'global'; error?: string }> {
  try {
    const supabase = createServiceClient();

    const marketResult = await supabase
      .from('affiliate_links')
      .select('partner_name, slug')
      .eq('active', true)
      .eq('market', market)
      .eq('category', category)
      .order('commission_value', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (marketResult.data) {
      return {
        success: true,
        partnerName: marketResult.data.partner_name,
        affiliateUrl: `/go/${marketResult.data.slug}`,
        source: 'market',
      };
    }

    const globalResult = await supabase
      .from('affiliate_links')
      .select('partner_name, slug')
      .eq('active', true)
      .is('market', null)
      .eq('category', category)
      .order('commission_value', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (globalResult.data) {
      return {
        success: true,
        partnerName: globalResult.data.partner_name,
        affiliateUrl: `/go/${globalResult.data.slug}`,
        source: 'global',
      };
    }

    return { success: false, error: `No CTA partner configured for ${market}/${category}` };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[genesis] getAutoTemplatePartnerPreview failed:', msg);
    return { success: false, error: msg };
  }
}

// ── Delete Genesis Run ──────────────────────────────────────

export async function deleteGenesisRun(
  runId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    // 1. Fetch run details for file paths
    const { data: run, error: fetchError } = await supabase
      .from('genesis_pipeline_runs')
      .select('slug, market, category, mdx_file_path')
      .eq('id', runId)
      .single();

    if (fetchError || !run) {
      return { success: false, error: 'Run not found' };
    }

    // 2. Delete MDX file
    if (run.mdx_file_path) {
      const mdxPath = path.join(process.cwd(), run.mdx_file_path);
      if (fs.existsSync(mdxPath)) {
        fs.unlinkSync(mdxPath);
      }
    }

    // 3. Delete image folder
    if (run.slug) {
      const prefix = run.market;
      const imgDir = path.join(
        process.cwd(),
        'public',
        'images',
        'content',
        prefix,
        run.category,
        run.slug,
      );
      if (fs.existsSync(imgDir)) {
        fs.rmSync(imgDir, { recursive: true, force: true });
      }
    }

    // 4. Delete DB record
    const { error: deleteError } = await supabase
      .from('genesis_pipeline_runs')
      .delete()
      .eq('id', runId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[Genesis] Delete error:', err);
    return { success: false, error: 'Failed to delete run' };
  }
}

// ── Get Run Detail (for edit modal) ─────────────────────────

export async function getRunDetail(
  runId: string,
): Promise<{ success: boolean; run?: GenesisRunState; mdxContent?: string; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('genesis_pipeline_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Run not found' };
    }

    const run: GenesisRunState = {
      id: data.id,
      keyword: data.keyword,
      market: data.market as Market,
      category: data.category,
      status: data.status,
      researchData: data.research_data as ResearchResult | null,
      brief: data.brief as ContentBrief | null,
      mdxFilePath: data.mdx_file_path,
      slug: data.slug,
      wordCount: data.word_count,
      images: (data.images as ImageUpload[]) || [],
      affiliateMappings: (data.affiliate_mappings as AffiliateMappingEntry[]) || [],
      generationProgress: (data.generation_progress as GenerationProgress) || { step: 'idle', progress: 0, message: '' },
      indexedAt: data.indexed_at || null,
      createdAt: data.created_at,
    };

    // Read MDX content from file
    let mdxContent = '';
    if (data.mdx_file_path) {
      const mdxPath = path.join(process.cwd(), data.mdx_file_path);
      if (fs.existsSync(mdxPath)) {
        mdxContent = fs.readFileSync(mdxPath, 'utf-8');
      }
    }

    return { success: true, run, mdxContent };
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[Genesis] Get run detail error:', err);
    return { success: false, error: 'Failed to load run' };
  }
}

// ── Update Genesis Content ──────────────────────────────────

export async function updateGenesisContent(
  runId: string,
  mdxContent: string,
): Promise<{ success: boolean; wordCount?: number; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { data: run, error: fetchError } = await supabase
      .from('genesis_pipeline_runs')
      .select('mdx_file_path')
      .eq('id', runId)
      .single();

    if (fetchError || !run?.mdx_file_path) {
      return { success: false, error: 'Run not found' };
    }

    // Write updated MDX
    const mdxPath = path.join(process.cwd(), run.mdx_file_path);
    fs.writeFileSync(mdxPath, mdxContent, 'utf-8');

    // Recount words (strip frontmatter + MDX tags)
    const bodyText = mdxContent
      .replace(/^---[\s\S]*?---/, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    // Update DB
    await supabase
      .from('genesis_pipeline_runs')
      .update({
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    return { success: true, wordCount };
  } catch (err) {
    Sentry.captureException(err);
    logger.error('[Genesis] Update content error:', err);
    return { success: false, error: 'Failed to update content' };
  }
}

'use server';

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging';

import { createServiceClient } from '@/lib/supabase/server';
import { getContentBySlug } from '@/lib/mdx/index';
import type { Market, Category } from '@/lib/i18n/config';
import { createClaudeMessage } from '@/lib/claude/client';

// ════════════════════════════════════════════════════════════════
// AI-OPTIMIZATION ENGINE
//
// Periodic analysis engine that compares cta_analytics with
// affiliate_rates and MDX content to find optimization opportunities.
//
// Task Types:
//   underperformer  — High traffic, low emerald CTR
//   efficiency_gap  — High violet CTR, low emerald CTR
//   market_trend    — New top CPA rates available
//   cta_wording     — CTA text improvement suggestion
//   general         — Catch-all for other optimizations
// ════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export interface OptimizationTask {
  id: string;
  slug: string;
  market: string;
  category: string | null;
  taskType: 'underperformer' | 'efficiency_gap' | 'market_trend' | 'cta_wording' | 'general';
  observation: string;
  suggestionText: string;
  deltaCode: string | null;
  aiReasoning: string | null;
  traffic24h: number;
  emeraldCtr: number;
  violetCtr: number;
  currentCpa: number;
  potentialUplift: number;
  status: 'pending' | 'approved' | 'executing' | 'applied' | 'failed' | 'dismissed';
  intervalType: string;
  appliedAt: string | null;
  indexedAt: string | null;
  createdAt: string;
}

export type IntervalType = 'weekly' | 'biweekly' | 'monthly' | 'manual';

interface SlugPerformance {
  slug: string;
  market: Market;
  category: string;
  totalClicks: number;
  emeraldClicks: number;
  violetClicks: number;
  emeraldCtr: number;
  violetCtr: number;
  estimatedPageViews: number;
}

// ── Analyze Pages & Generate Optimization Tasks ──────────────

/**
 * Run the full optimization analysis pipeline.
 *
 * 1. Gathers CTA analytics data for the configured interval
 * 2. Cross-references with affiliate_rates for CPA opportunities
 * 3. Identifies underperformers, efficiency gaps, and market trends
 * 4. Uses Anthropic Claude to generate concrete MDX suggestions
 * 5. Stores tasks in optimization_tasks table
 */
export async function runOptimizationAnalysis(
  intervalType: IntervalType = 'weekly',
): Promise<{
  success: boolean;
  tasksCreated: number;
  tasks: OptimizationTask[];
  error?: string;
}> {
  const supabase = createServiceClient();

  try {
    // Determine time window based on interval
    const daysBack = intervalType === 'weekly' ? 7 : intervalType === 'biweekly' ? 14 : 30;
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch CTA analytics for the period
    const { data: clicks } = await supabase
      .from('cta_analytics')
      .select('slug, market, variant, provider')
      .gte('clicked_at', since);

    if (!clicks || clicks.length === 0) {
      return { success: true, tasksCreated: 0, tasks: [], error: 'No click data for period' };
    }

    // 2. Aggregate by slug
    const slugMap = new Map<string, SlugPerformance>();

    for (const click of clicks) {
      const key = `${click.market}:${click.slug}`;
      const existing = slugMap.get(key) || {
        slug: click.slug,
        market: (click.market as Market) || 'us',
        category: extractCategory(click.slug),
        totalClicks: 0,
        emeraldClicks: 0,
        violetClicks: 0,
        emeraldCtr: 0,
        violetCtr: 0,
        estimatedPageViews: 0,
      };

      existing.totalClicks += 1;
      if (click.variant === 'emerald-shimmer') existing.emeraldClicks += 1;
      if (click.variant === 'violet-shimmer' || click.variant === 'violet') existing.violetClicks += 1;

      slugMap.set(key, existing);
    }

    // Calculate CTRs (estimated page views = total clicks * multiplier)
    for (const [, perf] of slugMap) {
      perf.estimatedPageViews = Math.max(perf.totalClicks * 8, 50);
      perf.emeraldCtr = perf.estimatedPageViews > 0
        ? (perf.emeraldClicks / perf.estimatedPageViews) * 100
        : 0;
      perf.violetCtr = perf.estimatedPageViews > 0
        ? (perf.violetClicks / perf.estimatedPageViews) * 100
        : 0;
    }

    // 3. Fetch affiliate rates for trend detection
    const { data: rates } = await supabase
      .from('affiliate_rates')
      .select('provider_name, cpa_value, avg_conversion_rate, market')
      .eq('active', true)
      .order('cpa_value', { ascending: false });

    // 4. Identify optimization opportunities
    const opportunities: Array<{
      type: 'underperformer' | 'efficiency_gap' | 'market_trend';
      perf: SlugPerformance;
      details: string;
      cpa: number;
    }> = [];

    for (const [, perf] of slugMap) {
      // Skip pages with very few clicks
      if (perf.totalClicks < 3) continue;

      // UNDERPERFORMER: High traffic, low emerald CTR (<2%)
      if (perf.totalClicks >= 10 && perf.emeraldCtr < 2.0) {
        opportunities.push({
          type: 'underperformer',
          perf,
          details: `${perf.totalClicks} clicks but only ${perf.emeraldCtr.toFixed(1)}% emerald CTR`,
          cpa: getBestCpa(rates || [], perf.market) || 0,
        });
      }

      // EFFICIENCY GAP: High violet CTR (>3%), but low emerald CTR (<2%)
      if (perf.violetCtr > 3.0 && perf.emeraldCtr < 2.0) {
        opportunities.push({
          type: 'efficiency_gap',
          perf,
          details: `${perf.violetCtr.toFixed(1)}% violet (info) CTR but only ${perf.emeraldCtr.toFixed(1)}% emerald (action) CTR`,
          cpa: getBestCpa(rates || [], perf.market) || 0,
        });
      }
    }

    // MARKET TREND: Top CPA rates that might not be prominently featured
    const topRates = (rates || []).slice(0, 3);
    for (const rate of topRates) {
      const market = (rate.market as Market) || 'us';
      // Find pages in this market that don't mention this provider
      for (const [, perf] of slugMap) {
        if (perf.market === market && perf.totalClicks >= 5) {
          opportunities.push({
            type: 'market_trend',
            perf,
            details: `Top CPA provider "${rate.provider_name}" ($${rate.cpa_value}) available — consider promoting`,
            cpa: rate.cpa_value,
          });
          break; // One per provider
        }
      }
    }

    // 5. Sort by impact potential and take top 5
    const topOpportunities = opportunities
      .sort((a, b) => {
        // Score: (traffic × cpa) + type priority
        const scoreA = a.perf.totalClicks * a.cpa + (a.type === 'underperformer' ? 100 : a.type === 'efficiency_gap' ? 80 : 50);
        const scoreB = b.perf.totalClicks * b.cpa + (b.type === 'underperformer' ? 100 : b.type === 'efficiency_gap' ? 80 : 50);
        return scoreB - scoreA;
      })
      .slice(0, 5);

    // 6. Use AI to generate specific suggestions
    const tasks: OptimizationTask[] = [];

    for (const opp of topOpportunities) {
      const task = await generateOptimizationSuggestion(opp, intervalType);
      if (task) {
        // Save to DB
        const { data: inserted, error } = await supabase
          .from('optimization_tasks')
          .insert({
            slug: opp.perf.slug,
            market: opp.perf.market,
            category: opp.perf.category,
            task_type: opp.type,
            observation: opp.details,
            suggestion_text: task.suggestionText,
            delta_code: task.deltaCode,
            ai_reasoning: task.aiReasoning,
            traffic_24h: opp.perf.totalClicks,
            emerald_ctr: opp.perf.emeraldCtr,
            violet_ctr: opp.perf.violetCtr,
            current_cpa: opp.cpa,
            potential_uplift: task.potentialUplift,
            status: 'pending',
            interval_type: intervalType,
          })
          .select('*')
          .single();

        if (!error && inserted) {
          tasks.push(mapTaskRow(inserted));
        }
      }
    }

    logger.info(`[optimizer] runOptimizationAnalysis: ${tasks.length} tasks created`);
    return { success: true, tasksCreated: tasks.length, tasks };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[optimizer] runOptimizationAnalysis failed:', msg);
    return { success: false, tasksCreated: 0, tasks: [], error: msg };
  }
}

// ── AI Suggestion Generator ──────────────────────────────────

async function generateOptimizationSuggestion(
  opp: {
    type: 'underperformer' | 'efficiency_gap' | 'market_trend';
    perf: SlugPerformance;
    details: string;
    cpa: number;
  },
  intervalType: IntervalType,
): Promise<{
  suggestionText: string;
  deltaCode: string | null;
  aiReasoning: string;
  potentialUplift: number;
} | null> {
  // Try to read the actual MDX content
  const slugParts = opp.perf.slug.split('/').filter(Boolean);
  let mdxContent: string | null = null;
  let pageTitle: string | null = null;

  try {
    const possibleMarkets = ['us', 'uk', 'ca', 'au'];
    let actualSlug: string;
    let actualCategory: string;
    let actualMarket: Market;

    if (slugParts.length >= 3 && possibleMarkets.includes(slugParts[0])) {
      actualMarket = slugParts[0] as Market;
      actualCategory = slugParts[1];
      actualSlug = slugParts.slice(2).join('/');
    } else if (slugParts.length >= 2) {
      actualMarket = opp.perf.market;
      actualCategory = slugParts[0];
      actualSlug = slugParts.slice(1).join('/');
    } else {
      actualMarket = opp.perf.market;
      actualCategory = opp.perf.category;
      actualSlug = slugParts[0] || '';
    }

    const content = await getContentBySlug(
      actualMarket,
      actualCategory as Category,
      actualSlug,
    );

    if (content) {
      // Take first 2000 chars of MDX for context (avoid token limits)
      mdxContent = content.content.slice(0, 2000);
      pageTitle = content.meta.title;
    }
  } catch {
    // MDX read failed — proceed without content context
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicKey) {
    try {
      const prompt = buildOptimizationPrompt(opp, mdxContent, pageTitle);

      const response = await createClaudeMessage({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: `You are SmartFinPro's Conversion Rate Optimization specialist.
Analyze the page performance data and generate a specific, actionable optimization suggestion.
Respond in valid JSON ONLY (no markdown, no code blocks).

JSON format:
{
  "suggestionText": "concise suggestion in German (1-2 sentences)",
  "deltaCode": "specific MDX code change if applicable, or null",
  "aiReasoning": "brief reasoning in German (2-3 sentences)",
  "potentialUplift": 5.0
}

Rules:
- suggestionText: German, concrete, actionable
- deltaCode: actual MDX snippet to insert/replace, or null if not applicable
- potentialUplift: estimated % revenue increase (conservative, 1-20)
- Focus on CTA placement, wording, urgency elements, and partner prominence`,
        messages: [{ role: 'user', content: prompt }],
      }, { apiKey: anthropicKey, operation: 'optimizer_suggestion' });

      const aiText = response.content[0].type === 'text' ? response.content[0].text : '';
      let parsed: { suggestionText: string; deltaCode: string | null; aiReasoning: string; potentialUplift: number };

      try {
        parsed = JSON.parse(aiText);
      } catch {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI response was not valid JSON');
        }
      }

      return parsed;
    } catch (err) {
      Sentry.captureException(err);
      logger.error('[optimizer] AI suggestion failed:', err);
    }
  }

  // Fallback: rule-based suggestion
  return generateRuleBasedSuggestion(opp);
}

function buildOptimizationPrompt(
  opp: { type: string; perf: SlugPerformance; details: string; cpa: number },
  mdxContent: string | null,
  pageTitle: string | null,
): string {
  const lines = [
    `## OPTIMIZATION ANALYSIS`,
    ``,
    `**Page:** ${opp.perf.slug}`,
    `**Title:** ${pageTitle || 'Unknown'}`,
    `**Market:** ${opp.perf.market.toUpperCase()}`,
    `**Category:** ${opp.perf.category}`,
    ``,
    `**Performance (period):**`,
    `- Total CTA Clicks: ${opp.perf.totalClicks}`,
    `- Emerald (Action) CTR: ${opp.perf.emeraldCtr.toFixed(2)}%`,
    `- Violet (Info) CTR: ${opp.perf.violetCtr.toFixed(2)}%`,
    `- Estimated Page Views: ${opp.perf.estimatedPageViews}`,
    `- Best CPA Rate: $${opp.cpa}`,
    ``,
    `**Issue Type:** ${opp.type}`,
    `**Observation:** ${opp.details}`,
  ];

  if (mdxContent) {
    lines.push(
      ``,
      `**Current MDX Content (first 2000 chars):**`,
      `\`\`\`mdx`,
      mdxContent,
      `\`\`\``,
    );
  }

  return lines.join('\n');
}

function generateRuleBasedSuggestion(
  opp: { type: string; perf: SlugPerformance; details: string; cpa: number },
): { suggestionText: string; deltaCode: string | null; aiReasoning: string; potentialUplift: number } {
  switch (opp.type) {
    case 'underperformer':
      return {
        suggestionText: `CTA-Optimierung fuer ${opp.perf.slug}: Button-Text zu "Jetzt kostenlos starten" aendern und oberhalb des Folds platzieren.`,
        deltaCode: null,
        aiReasoning: `Seite hat ${opp.perf.totalClicks} Klicks aber nur ${opp.perf.emeraldCtr.toFixed(1)}% Emerald-CTR. Eine prominentere CTA-Platzierung mit dringenderem Wording kann die Conversion deutlich steigern.`,
        potentialUplift: Math.min(15, Math.max(3, 20 - opp.perf.emeraldCtr * 5)),
      };
    case 'efficiency_gap':
      return {
        suggestionText: `Dringlichkeits-Absatz vor dem CTA einfuegen: "Limitiertes Angebot" Block mit Zeitdruck-Element.`,
        deltaCode: `<div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">\n  <p className="text-sm font-semibold text-amber-400">⚡ Begrenztes Angebot — Nur noch kurze Zeit verfuegbar</p>\n</div>`,
        aiReasoning: `Hohe Violet-CTR (${opp.perf.violetCtr.toFixed(1)}%) zeigt Interesse, aber niedrige Emerald-CTR (${opp.perf.emeraldCtr.toFixed(1)}%) deutet auf fehlendes Dringlichkeitsgefuehl. Ein Urgency-Element kann die Luecke schliessen.`,
        potentialUplift: Math.min(12, Math.max(3, (opp.perf.violetCtr - opp.perf.emeraldCtr) * 2)),
      };
    case 'market_trend':
    default:
      return {
        suggestionText: `Top-CPA Partner ($${opp.cpa}) prominenter in der Vergleichstabelle platzieren — Winner-Badge hinzufuegen.`,
        deltaCode: null,
        aiReasoning: `Neuer Top-CPA Rate verfuegbar ($${opp.cpa}). Durch prominentere Platzierung in der Vergleichstabelle kann der Revenue pro Klick gesteigert werden.`,
        potentialUplift: Math.min(10, Math.max(2, opp.cpa / 20)),
      };
  }
}

// ── Execute a Single Optimization ────────────────────────────

/**
 * Execute an approved optimization task.
 *
 * 1. Read the current MDX file
 * 2. Use AI to rewrite the specific section
 * 3. Update the MDX file on disk
 * 4. Update lastUpdated date
 * 5. Trigger rebuild via boostAndDeploy
 * 6. Send Google Indexing ping
 */
export async function executePageOptimization(
  taskId: string,
): Promise<{
  success: boolean;
  slug?: string;
  error?: string;
}> {
  const supabase = createServiceClient();

  try {
    // Load the task
    const { data: task } = await supabase
      .from('optimization_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.status !== 'pending' && task.status !== 'approved') {
      return { success: false, slug: task.slug, error: `Task already ${task.status}` };
    }

    // Mark as executing
    await supabase
      .from('optimization_tasks')
      .update({ status: 'executing', updated_at: new Date().toISOString() })
      .eq('id', taskId);

    // Parse slug to get market/category/page
    const slugParts = task.slug.split('/').filter(Boolean);
    const possibleMarkets = ['us', 'uk', 'ca', 'au'];
    let actualMarket: Market = task.market as Market;
    let actualCategory: string = task.category || '';
    let actualSlug: string;

    if (slugParts.length >= 3 && possibleMarkets.includes(slugParts[0])) {
      actualMarket = slugParts[0] as Market;
      actualCategory = slugParts[1];
      actualSlug = slugParts.slice(2).join('/');
    } else if (slugParts.length >= 2) {
      actualCategory = slugParts[0];
      actualSlug = slugParts.slice(1).join('/');
    } else {
      actualSlug = slugParts[0] || '';
    }

    // Read current MDX content
    const content = await getContentBySlug(
      actualMarket,
      actualCategory as Category,
      actualSlug,
    );

    if (!content) {
      await supabase.from('optimization_tasks').update({ status: 'failed' }).eq('id', taskId);
      return { success: false, slug: task.slug, error: 'MDX file not found' };
    }

    // Generate the optimized version using AI
    let newContent: string;

    if (task.delta_code) {
      // We have a specific delta — use AI to intelligently merge it
      newContent = await mergeOptimizationDelta(
        content.content,
        content.meta,
        task.delta_code,
        task.suggestion_text,
        task.observation,
      );
    } else {
      // No delta — use AI to rewrite based on suggestion
      newContent = await rewriteWithSuggestion(
        content.content,
        content.meta,
        task.suggestion_text,
        task.observation,
        task.task_type,
      );
    }

    // Write updated MDX file
    const fs = await import('fs');
    const path = await import('path');
    const contentDir = path.join(process.cwd(), 'content');
    const filePath = path.join(contentDir, actualMarket, actualCategory, `${actualSlug}.mdx`);

    // Update the modifiedDate in frontmatter
    const today = new Date().toISOString().split('T')[0];
    const updatedContent = newContent.replace(
      /modifiedDate:\s*['"]?[\d-]+['"]?/,
      `modifiedDate: '${today}'`,
    );

    fs.writeFileSync(filePath, updatedContent, 'utf-8');

    // Trigger rebuild via boostAndDeploy
    try {
      const { boostAndDeploy } = await import('@/lib/actions/content-overrides');
      const prefix = `/${actualMarket}`;
      const fullSlug = `${prefix}/${actualCategory}/${actualSlug}`;
      await boostAndDeploy(fullSlug, `AI Optimization: ${task.task_type}`);
    } catch {
      // Boost failed — non-critical
    }

    // Google Indexing ping
    let indexedAt: string | null = null;
    try {
      const { requestInstantIndexing } = await import('@/lib/actions/genesis');
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfinpro.com';
      const prefix = `/${actualMarket}`;
      const fullUrl = `${siteUrl}${prefix}/${actualCategory}/${actualSlug}`;
      const indexResult = await requestInstantIndexing(fullUrl);
      if (indexResult.success) {
        indexedAt = new Date().toISOString();
      }
    } catch {
      // Indexing failed — non-critical
    }

    // Mark as applied
    await supabase
      .from('optimization_tasks')
      .update({
        status: 'applied',
        applied_at: new Date().toISOString(),
        indexed_at: indexedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    return { success: true, slug: task.slug };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await supabase.from('optimization_tasks').update({ status: 'failed' }).eq('id', taskId);
    logger.error('[optimizer] executePageOptimization failed:', msg);
    return { success: false, error: msg };
  }
}

// ── AI Content Rewrite Functions ─────────────────────────────

async function mergeOptimizationDelta(
  currentMdx: string,
  _meta: unknown,
  deltaCode: string,
  suggestion: string,
  observation: string,
): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    // Fallback: append delta before the first CTA section
    return insertDeltaBeforeCta(currentMdx, deltaCode);
  }

  try {
    const response = await createClaudeMessage({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: `You are an MDX content optimizer. You will receive the current MDX content of a financial review/comparison page, an observation about its performance, a suggestion, and a delta code snippet to integrate.

Your task: Integrate the delta code into the MDX content at the most appropriate location. Keep all existing content intact. Only add or modify the specific area related to the suggestion.

CRITICAL: Return ONLY the complete updated MDX file content. No explanations, no markdown code blocks. Just the raw MDX.`,
      messages: [{
        role: 'user',
        content: `## CURRENT MDX:\n${currentMdx}\n\n## OBSERVATION:\n${observation}\n\n## SUGGESTION:\n${suggestion}\n\n## DELTA CODE TO INSERT:\n${deltaCode}`,
      }],
    }, { apiKey: anthropicKey, operation: 'optimizer_merge_delta' });

    return response.content[0].type === 'text' ? response.content[0].text : currentMdx;
  } catch {
    return insertDeltaBeforeCta(currentMdx, deltaCode);
  }
}

async function rewriteWithSuggestion(
  currentMdx: string,
  _meta: unknown,
  suggestion: string,
  observation: string,
  taskType: string,
): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return currentMdx;

  try {
    const response = await createClaudeMessage({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      system: `You are an MDX content optimizer for SmartFinPro, a finance affiliate SEO site.

You will receive the current MDX content and an optimization suggestion. Apply the suggestion by modifying ONLY the relevant sections. Keep the frontmatter, structure, and tone intact.

Rules:
- Keep all frontmatter YAML exactly as-is (only update modifiedDate if present)
- Only modify sections directly related to the suggestion
- Maintain the existing MDX component syntax
- Keep affiliate links and partner references intact
- For CTA changes: use the existing CTA component patterns
- For urgency additions: use inline styled divs with the site's dark theme colors

CRITICAL: Return ONLY the complete updated MDX file. No explanations, no markdown code blocks.`,
      messages: [{
        role: 'user',
        content: `## OPTIMIZATION TYPE: ${taskType}\n## OBSERVATION: ${observation}\n## SUGGESTION: ${suggestion}\n\n## CURRENT MDX:\n${currentMdx}`,
      }],
    }, { apiKey: anthropicKey, operation: 'optimizer_rewrite' });

    return response.content[0].type === 'text' ? response.content[0].text : currentMdx;
  } catch {
    return currentMdx;
  }
}

function insertDeltaBeforeCta(mdx: string, delta: string): string {
  // Find the first CTA-like pattern and insert before it
  const ctaPatterns = [
    /(<CtaButton|<AffiliateButton|<ComparisonTable)/,
    /(## (?:Our |Top |Best ))/,
    /(## (?:Verdict|Fazit|Conclusion))/,
  ];

  for (const pattern of ctaPatterns) {
    const match = mdx.match(pattern);
    if (match && match.index !== undefined) {
      return mdx.slice(0, match.index) + delta + '\n\n' + mdx.slice(match.index);
    }
  }

  // Fallback: insert before the last section
  const lastH2 = mdx.lastIndexOf('\n## ');
  if (lastH2 > 0) {
    return mdx.slice(0, lastH2) + '\n\n' + delta + mdx.slice(lastH2);
  }

  return mdx + '\n\n' + delta;
}

// ── Dismiss a Task ───────────────────────────────────────────

export async function dismissOptimizationTask(
  taskId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase
      .from('optimization_tasks')
      .update({
        status: 'dismissed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .in('status', ['pending', 'approved']);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── Get Pending Tasks ────────────────────────────────────────

export async function getPendingOptimizations(): Promise<OptimizationTask[]> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('optimization_tasks')
    .select('*')
    .in('status', ['pending', 'approved', 'executing'])
    .order('created_at', { ascending: false })
    .limit(20);

  return (data || []).map(mapTaskRow);
}

// ── Get Task History ─────────────────────────────────────────

export async function getOptimizationHistory(
  limit: number = 20,
): Promise<OptimizationTask[]> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('optimization_tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map(mapTaskRow);
}

// ── Get Pending Count (for sidebar badge) ────────────────────

export async function getOptimizationCount(): Promise<number> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from('optimization_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return count || 0;
}

// ── Helper: Extract category from slug ───────────────────────

function extractCategory(slug: string): string {
  const parts = slug.split('/').filter(Boolean);
  const possibleMarkets = ['us', 'uk', 'ca', 'au'];
  if (parts.length >= 2 && possibleMarkets.includes(parts[0])) {
    return parts[1];
  }
  return parts[0] || 'general';
}

// ── Helper: Get best CPA for market ──────────────────────────

function getBestCpa(
  rates: Array<{ cpa_value: number; market: string | null }>,
  market: Market,
): number {
  const marketRates = rates.filter((r) => r.market === market || r.market === null);
  return marketRates[0]?.cpa_value || 0;
}

// ── Helper: Map DB row ───────────────────────────────────────

function mapTaskRow(row: Record<string, unknown>): OptimizationTask {
  return {
    id: row.id as string,
    slug: row.slug as string,
    market: (row.market as string) || 'us',
    category: (row.category as string) || null,
    taskType: row.task_type as OptimizationTask['taskType'],
    observation: row.observation as string,
    suggestionText: row.suggestion_text as string,
    deltaCode: (row.delta_code as string) || null,
    aiReasoning: (row.ai_reasoning as string) || null,
    traffic24h: Number(row.traffic_24h) || 0,
    emeraldCtr: Number(row.emerald_ctr) || 0,
    violetCtr: Number(row.violet_ctr) || 0,
    currentCpa: Number(row.current_cpa) || 0,
    potentialUplift: Number(row.potential_uplift) || 0,
    status: row.status as OptimizationTask['status'],
    intervalType: (row.interval_type as string) || 'weekly',
    appliedAt: (row.applied_at as string) || null,
    indexedAt: (row.indexed_at as string) || null,
    createdAt: row.created_at as string,
  };
}

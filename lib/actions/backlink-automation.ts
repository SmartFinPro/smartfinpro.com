// lib/actions/backlink-automation.ts
// Core server-side logic for automated backlink discovery, content generation, and posting
'use server';

import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';
import { createClaudeMessage } from '@/lib/claude/client';
import { sendTelegramAlert } from '@/lib/alerts/telegram';
import { marketCompliancePrompts } from '@/lib/claude/market-compliance-prompts';
import {
  scoreOpportunity,
  detectPlatform,
  buildBacklinkSearchQueries,
  extractDomainFromUrl,
  PLATFORM_DA,
} from '@/lib/backlinks/opportunity-scorer';
import { postRedditComment, isRedditConfigured, getRedditThreadInfo } from '@/lib/backlinks/reddit-client';
import { publishMediumArticle, isMediumConfigured, getMediumTags } from '@/lib/backlinks/medium-client';
import { submitEINPresswire, generatePRTitle } from '@/lib/backlinks/prlog-client';
import type { Market } from '@/lib/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://smartfinpro.com';
const SERPER_KEY = process.env.SERPER_API_KEY;

// ── Types ────────────────────────────────────────────────────────────────────

export interface BacklinkOpportunity {
  id: string;
  platform: string;
  source_url: string;
  title: string | null;
  snippet: string | null;
  target_keyword: string;
  target_url: string;
  market: string;
  category: string | null;
  opportunity_score: number;
  status: string;
  generated_content: string | null;
  anchor_text: string | null;
  posted_at: string | null;
  placement_url: string | null;
  created_at: string;
}

export interface BacklinkCampaign {
  id: string;
  name: string;
  market: string | null;
  category: string | null;
  target_keywords: string[];
  target_urls: string[];
  platforms: string[];
  daily_limit: number;
  min_opportunity_score: number;
  is_active: boolean;
}

export interface BacklinkPlacement {
  id: string;
  platform: string;
  source_url: string;
  target_url: string;
  anchor_text: string | null;
  is_dofollow: boolean;
  domain_authority: number | null;
  market: string | null;
  status: string;
  discovered_at: string;
  last_verified_at: string | null;
}

// ── Serper helper (reuses pattern from competitors.ts) ───────────────────────

async function fetchSerpForBacklinks(query: string, market: Market): Promise<Array<{
  title: string;
  link: string;
  snippet: string;
}>> {
  if (!SERPER_KEY) return [];

  const GL_MAP: Record<Market, string> = { us: 'us', uk: 'uk', ca: 'ca', au: 'au' };

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl: GL_MAP[market], num: 10 }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return (data.organic ?? []).map((item: { title: string; link: string; snippet: string }) => ({
      title: item.title ?? '',
      link: item.link ?? '',
      snippet: item.snippet ?? '',
    }));
  } catch {
    return [];
  }
}

// ── Main Functions ───────────────────────────────────────────────────────────

/**
 * Scan for backlink opportunities for a given keyword and market
 * Uses Serper.dev to find relevant threads on Reddit, Quora, forums
 * Saves results to backlink_opportunities table
 */
export async function scanBacklinkOpportunities(
  market: Market,
  keyword: string,
  targetUrl: string,
  category?: string,
): Promise<{ found: number; saved: number }> {
  const supabase = createServiceClient();
  const queries = buildBacklinkSearchQueries(keyword);

  const allResults: Array<{ title: string; link: string; snippet: string }> = [];

  // Run all queries in parallel
  const results = await Promise.all(
    queries.map(q => fetchSerpForBacklinks(q, market))
  );
  results.forEach(r => allResults.push(...r));

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allResults.filter(r => {
    if (seen.has(r.link)) return false;
    seen.add(r.link);
    return true;
  });

  let saved = 0;

  for (const result of unique) {
    const platform = detectPlatform(result.link);
    if (!platform) continue; // Skip non-target platforms

    const score = scoreOpportunity({
      platform,
      title: result.title,
      snippet: result.snippet,
      url: result.link,
      keyword,
    });

    // Only save opportunities with score > 30
    if (score < 30) continue;

    const { error } = await supabase
      .from('backlink_opportunities')
      .upsert({
        platform,
        source_url: result.link,
        title: result.title,
        snippet: result.snippet,
        target_keyword: keyword,
        target_url: targetUrl,
        market,
        category: category ?? null,
        opportunity_score: score,
        status: 'pending',
      }, {
        onConflict: 'source_url',
        ignoreDuplicates: true, // Don't overwrite if already posted
      });

    if (!error) saved++;
  }

  return { found: unique.length, saved };
}

/**
 * Generate Claude-powered content for a backlink opportunity
 * Creates genuinely helpful content with a natural backlink
 */
export async function generateBacklinkContent(opportunity: BacklinkOpportunity): Promise<{
  content: string;
  anchorText: string;
} | null> {
  const complianceBlock = marketCompliancePrompts[opportunity.market as keyof typeof marketCompliancePrompts] ?? '';

  const targetPath = opportunity.target_url.startsWith('http')
    ? opportunity.target_url
    : `${SITE_URL}${opportunity.target_url}`;

  const systemPrompt = `You are a helpful financial expert contributing to online communities.
Your goal is to write genuinely useful, informative responses that help people make better financial decisions.

CONTENT RULES:
- Write in English, conversational but professional tone
- Be genuinely helpful — answer the actual question thoroughly
- Include exactly ONE natural reference to a relevant resource at the end
- Format for the platform: ${opportunity.platform === 'reddit' ? 'Reddit Markdown' : 'Plain text with HTML links for Medium'}
- Length: ${opportunity.platform === 'medium' ? '350-450 words' : '180-280 words'}
- Do NOT be promotional or salesy
- Do NOT start with "As a financial expert..." or similar
- The link must feel natural, not forced: e.g. "For a more detailed breakdown, this comparison covers..."

COMPLIANCE:
${complianceBlock}

ANCHOR TEXT OPTIONS (choose the most natural for context):
- Branded: "SmartFinPro"
- Partial match: "${opportunity.target_keyword}"
- Generic: "this in-depth comparison" / "this review" / "this resource"

IMPORTANT: End the response with the link in this exact format:
[LINK: ${targetPath}]
[ANCHOR: {the anchor text you chose}]`;

  const userPrompt = `Platform: ${opportunity.platform}
Thread/Question Title: "${opportunity.title ?? opportunity.target_keyword}"
Context: "${opportunity.snippet ?? ''}"
Keyword to address: "${opportunity.target_keyword}"
Market: ${opportunity.market.toUpperCase()}

Write a helpful, genuinely useful response for this thread that naturally mentions the resource.`;

  try {
    const message = await createClaudeMessage(
      {
        model: 'claude-haiku-4-5-20251001', // Fast + cheap for bulk generation
        max_tokens: 600,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      },
      { operation: 'backlink-content-generation' }
    );

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract link and anchor from the formatted output
    const linkMatch = raw.match(/\[LINK:\s*(https?:\/\/[^\]]+)\]/);
    const anchorMatch = raw.match(/\[ANCHOR:\s*([^\]]+)\]/);

    // Clean content (remove the [LINK:] and [ANCHOR:] markers)
    let content = raw
      .replace(/\[LINK:[^\]]+\]/g, '')
      .replace(/\[ANCHOR:[^\]]+\]/g, '')
      .trim();

    const anchorText = anchorMatch?.[1]?.trim() ?? 'SmartFinPro';
    const finalUrl = linkMatch?.[1]?.trim() ?? targetPath;

    // Format the link naturally into the content
    if (opportunity.platform === 'reddit') {
      content += `\n\n*For a detailed comparison, check out [${anchorText}](${finalUrl}) — covers ${opportunity.target_keyword} across multiple providers.*`;
    } else if (opportunity.platform === 'medium') {
      content += `\n\n<p>For a comprehensive comparison, <a href="${finalUrl}">${anchorText}</a> provides an in-depth analysis of ${opportunity.target_keyword}.</p>`;
    } else {
      content += `\n\nMore details: ${anchorText} — ${finalUrl}`;
    }

    return { content, anchorText };

  } catch (error) {
    console.error('[backlink-automation] Content generation failed:', error);
    return null;
  }
}

/**
 * Post generated content to the appropriate platform
 * Handles Reddit, Medium, and returns manual queue for others
 */
export async function postBacklinkOpportunity(
  opportunity: BacklinkOpportunity,
): Promise<{ success: boolean; placementUrl?: string; error?: string }> {
  const supabase = createServiceClient();

  // Generate content first
  const generated = await generateBacklinkContent(opportunity);
  if (!generated) {
    await supabase
      .from('backlink_opportunities')
      .update({ status: 'failed', error_message: 'Content generation failed' })
      .eq('id', opportunity.id);
    return { success: false, error: 'Content generation failed' };
  }

  // Save generated content to DB
  await supabase
    .from('backlink_opportunities')
    .update({
      generated_content: generated.content,
      anchor_text: generated.anchorText,
    })
    .eq('id', opportunity.id);

  let result: { success: boolean; url?: string; error?: string } = { success: false };

  // ── Route to correct platform ──────────────────────────────────────────
  if (opportunity.platform === 'reddit' && await isRedditConfigured()) {
    // Extra check: verify thread isn't too busy or already has our link
    const threadInfo = await getRedditThreadInfo(opportunity.source_url);
    if (threadInfo && threadInfo.commentCount > 50) {
      // High comment count = low visibility, skip
      await supabase.from('backlink_opportunities').update({ status: 'skipped' }).eq('id', opportunity.id);
      return { success: false, error: 'Thread too busy (>50 comments), skipped' };
    }

    const postResult = await postRedditComment(opportunity.source_url, generated.content);
    if (postResult.success) {
      result = { success: true, url: postResult.permalink };
    } else {
      result = { success: false, error: postResult.error };
    }

  } else if (opportunity.platform === 'medium' && await isMediumConfigured()) {
    const targetPath = opportunity.target_url.startsWith('http')
      ? opportunity.target_url
      : `${SITE_URL}${opportunity.target_url}`;

    const publishResult = await publishMediumArticle({
      title: `${opportunity.target_keyword.charAt(0).toUpperCase() + opportunity.target_keyword.slice(1)} — An Expert Guide`,
      htmlContent: `<p>${generated.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
      canonicalUrl: targetPath,
      tags: getMediumTags(opportunity.market, opportunity.category ?? '', opportunity.target_keyword),
    });

    if (publishResult.success) {
      result = { success: true, url: publishResult.url };
    } else {
      result = { success: false, error: publishResult.error };
    }

  } else if (opportunity.platform === 'quora' || opportunity.platform === 'forum') {
    // Quora + forums → move to manual_review queue (no public API)
    await supabase
      .from('backlink_opportunities')
      .update({ status: 'manual_review' })
      .eq('id', opportunity.id);
    return { success: false, error: 'Platform requires manual posting — moved to review queue' };

  } else {
    // Platform not configured → manual review
    await supabase
      .from('backlink_opportunities')
      .update({ status: 'manual_review' })
      .eq('id', opportunity.id);
    return { success: false, error: `Platform ${opportunity.platform} not configured for auto-posting` };
  }

  // ── Update DB after posting ────────────────────────────────────────────
  if (result.success && result.url) {
    const now = new Date().toISOString();
    await supabase
      .from('backlink_opportunities')
      .update({
        status: 'posted',
        posted_at: now,
        placement_url: result.url,
      })
      .eq('id', opportunity.id);

    // Create tracking entry in backlink_placements
    const domain = extractDomainFromUrl(opportunity.source_url);
    await supabase.from('backlink_placements').upsert({
      opportunity_id: opportunity.id,
      platform: opportunity.platform,
      source_url: result.url, // The actual comment/article URL
      target_url: opportunity.target_url.startsWith('http')
        ? opportunity.target_url
        : `${SITE_URL}${opportunity.target_url}`,
      anchor_text: generated.anchorText,
      is_dofollow: opportunity.platform !== 'medium', // Medium uses canonical, not dofollow
      domain_authority: PLATFORM_DA[domain] ?? null,
      market: opportunity.market,
      category: opportunity.category,
      status: 'live',
      last_verified_at: now,
    }, { onConflict: 'source_url,target_url' });

    return { success: true, placementUrl: result.url };
  }

  // Posting failed
  await supabase
    .from('backlink_opportunities')
    .update({ status: 'failed', error_message: result.error ?? 'Unknown error' })
    .eq('id', opportunity.id);

  return { success: false, error: result.error };
}

// ── Cron Job Entry Points ────────────────────────────────────────────────────

/**
 * Main scout job — discovers new opportunities across all active campaigns
 */
export async function runBacklinkScout(): Promise<{
  scanned: number;
  found: number;
  saved: number;
}> {
  const supabase = createServiceClient();

  // Load active campaigns
  const { data: campaigns } = await supabase
    .from('backlink_campaigns')
    .select('*')
    .eq('is_active', true);

  if (!campaigns?.length) {
    return { scanned: 0, found: 0, saved: 0 };
  }

  let totalScanned = 0;
  let totalFound = 0;
  let totalSaved = 0;

  for (const campaign of campaigns) {
    const market = (campaign.market ?? 'us') as Market;

    for (let i = 0; i < campaign.target_keywords.length; i++) {
      const keyword = campaign.target_keywords[i];
      const targetUrl = campaign.target_urls[i] ?? campaign.target_urls[0] ?? '/';

      const result = await scanBacklinkOpportunities(market, keyword, targetUrl, campaign.category);
      totalScanned++;
      totalFound += result.found;
      totalSaved += result.saved;

      // Rate limit: 200ms between keywords to respect Serper limits
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Telegram notification
  if (totalSaved > 0) {
    await sendTelegramAlert(
      `🔍 <b>Backlink Scout</b>\n` +
      `Keywords gescannt: ${totalScanned}\n` +
      `Opportunities gefunden: ${totalFound}\n` +
      `Neue in Queue: ${totalSaved}`
    );
  }

  return { scanned: totalScanned, found: totalFound, saved: totalSaved };
}

/**
 * Post job — processes pending opportunities and posts content
 * Respects per-campaign daily limits
 */
export async function runBacklinkPost(): Promise<{
  processed: number;
  posted: number;
  failed: number;
  queued: number;
}> {
  const supabase = createServiceClient();
  const dailyLimit = parseInt(process.env.BACKLINKS_DAILY_LIMIT ?? '10', 10);

  // Get best pending opportunities (sorted by score desc)
  const { data: opportunities } = await supabase
    .from('backlink_opportunities')
    .select('*')
    .eq('status', 'pending')
    .gte('opportunity_score', 60)
    .order('opportunity_score', { ascending: false })
    .limit(dailyLimit);

  if (!opportunities?.length) {
    return { processed: 0, posted: 0, failed: 0, queued: 0 };
  }

  let posted = 0;
  let failed = 0;
  let queued = 0;

  for (const opp of opportunities as BacklinkOpportunity[]) {
    const result = await postBacklinkOpportunity(opp);

    if (result.success) {
      posted++;
    } else if (result.error?.includes('manual_review') || result.error?.includes('manual posting')) {
      queued++;
    } else {
      failed++;
    }

    // 2 second delay between posts to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  // Telegram summary
  await sendTelegramAlert(
    `✅ <b>Backlink Post Run</b>\n` +
    `Verarbeitet: ${opportunities.length}\n` +
    `Gepostet: ${posted} ✓\n` +
    `Manual Queue: ${queued} 📋\n` +
    `Fehlgeschlagen: ${failed} ✗`
  );

  return {
    processed: opportunities.length,
    posted,
    failed,
    queued,
  };
}

/**
 * Verify job — checks if existing placements are still live
 */
export async function runBacklinkVerify(): Promise<{
  checked: number;
  live: number;
  lost: number;
}> {
  const supabase = createServiceClient();

  const { data: placements } = await supabase
    .from('backlink_placements')
    .select('*')
    .eq('status', 'live')
    .order('last_verified_at', { ascending: true })
    .limit(50); // Verify oldest 50 first

  if (!placements?.length) {
    return { checked: 0, live: 0, lost: 0 };
  }

  let live = 0;
  let lost = 0;

  for (const placement of placements as BacklinkPlacement[]) {
    try {
      const response = await fetch(placement.source_url, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartFinPro/1.0)' },
        signal: AbortSignal.timeout(8000),
      });

      const pageText = await response.text();
      const siteUrl = new URL(SITE_URL).hostname;
      const isStillLive = pageText.includes(siteUrl) || pageText.includes('smartfinpro');

      if (isStillLive) {
        live++;
        await supabase
          .from('backlink_placements')
          .update({ last_verified_at: new Date().toISOString() })
          .eq('id', placement.id);
      } else {
        lost++;
        await supabase
          .from('backlink_placements')
          .update({ status: 'lost', last_verified_at: new Date().toISOString() })
          .eq('id', placement.id);
      }
    } catch {
      // Network error — mark as unverified, not lost
      await supabase
        .from('backlink_placements')
        .update({ status: 'unverified', last_verified_at: new Date().toISOString() })
        .eq('id', placement.id);
    }

    // Small delay between checks
    await new Promise(r => setTimeout(r, 300));
  }

  await sendTelegramAlert(
    `📊 <b>Backlink Verify Report</b>\n` +
    `Geprüft: ${placements.length}\n` +
    `Live: ${live} ✅\n` +
    `Lost: ${lost} ❌\n\n` +
    `Gesamt-Live-Backlinks: ${live}`
  );

  return { checked: placements.length, live, lost };
}

// ── Dashboard Data ───────────────────────────────────────────────────────────

export async function getBacklinkDashboardData(): Promise<{
  stats: {
    totalLive: number;
    totalLost: number;
    avgDa: number;
    newThisWeek: number;
    manualQueue: number;
  };
  placements: BacklinkPlacement[];
  opportunities: BacklinkOpportunity[];
  campaigns: BacklinkCampaign[];
}> {
  const supabase = createServiceClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [placementsRes, pendingRes, campaignsRes] = await Promise.all([
    supabase
      .from('backlink_placements')
      .select('*')
      .order('discovered_at', { ascending: false })
      .limit(100),
    supabase
      .from('backlink_opportunities')
      .select('*')
      .in('status', ['pending', 'manual_review'])
      .order('opportunity_score', { ascending: false })
      .limit(50),
    supabase
      .from('backlink_campaigns')
      .select('*')
      .order('is_active', { ascending: false }),
  ]);

  const placements = (placementsRes.data ?? []) as BacklinkPlacement[];
  const live = placements.filter(p => p.status === 'live');
  const lost = placements.filter(p => p.status === 'lost');
  const newThisWeek = placements.filter(p => p.discovered_at >= weekAgo).length;
  const avgDa = live.length > 0
    ? Math.round(live.reduce((sum, p) => sum + (p.domain_authority ?? 0), 0) / live.length)
    : 0;

  const manualQueue = (pendingRes.data ?? []).filter(o => o.status === 'manual_review').length;

  return {
    stats: {
      totalLive: live.length,
      totalLost: lost.length,
      avgDa,
      newThisWeek,
      manualQueue,
    },
    placements,
    opportunities: (pendingRes.data ?? []) as BacklinkOpportunity[],
    campaigns: (campaignsRes.data ?? []) as BacklinkCampaign[],
  };
}

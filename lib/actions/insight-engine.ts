// lib/actions/insight-engine.ts
'use server';
import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import { withRetry } from '@/lib/utils/retry';
import { createClaudeMessage } from '@/lib/claude/client';
import { sendAutonomousNotification } from '@/lib/actions/autonomous-notify';
import { computeContentHealthScores } from '@/lib/actions/content-health';

// ── Types ──────────────────────────────────────────────────────────────────

interface InsightRow {
  dedupe_key: string;
  insight_type: string;
  slug: string | null;
  market: string | null;
  category: string | null;
  title: string;
  detail: Record<string, unknown>;
  recommended_action: string | null;
  risk_tier: number;
  expected_revenue_impact: number;
  confidence: number;
}

export interface InsightEngineResult {
  success: boolean;
  auditId: string | null;
  healthScored: number;
  insightsGenerated: number;
  aiSynthesis: boolean;
  errors: string[];
  modules: {
    contentHealth: { scored: number };
    contentDecay: { found: number };
    competitorOpportunity: { found: number };
    abWinner: { found: number };
    revenueAnomaly: { found: number };
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getISOWeek(): string {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7,
  );
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ── Cron Run Audit ─────────────────────────────────────────────────────────

async function startAudit(supabase: ReturnType<typeof createServiceClient>, jobName: string) {
  const { data } = await supabase
    .from('cron_run_audit')
    .insert({ job_name: jobName, status: 'running' })
    .select('id')
    .single();
  return data?.id ?? null;
}

async function finishAudit(
  supabase: ReturnType<typeof createServiceClient>,
  auditId: string | null,
  status: 'success' | 'error' | 'timeout',
  startTime: number,
  processedCount: number,
  errorMessage?: string,
  metadata?: Record<string, unknown>,
) {
  if (!auditId) return;
  await supabase
    .from('cron_run_audit')
    .update({
      status,
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      processed_count: processedCount,
      error_message: errorMessage ?? null,
      metadata: metadata ?? {},
    })
    .eq('id', auditId);
}

// ── Module 1: Content Health Scoring ───────────────────────────────────────

async function runContentHealthScoring() {
  logger.info('[insight-engine] Module 1: Content Health Scoring');
  const result = await computeContentHealthScores();
  return { scored: result.pagesScored, errors: result.errors };
}

// ── Module 2: Content Decay Detection ──────────────────────────────────────

async function runContentDecayDetection(supabase: ReturnType<typeof createServiceClient>) {
  logger.info('[insight-engine] Module 2: Content Decay Detection');
  const week = getISOWeek();
  const insights: InsightRow[] = [];

  // Find pages with significant health decline AND meaningful revenue
  const { data: decaying, error } = await supabase
    .from('content_health_scores')
    .select('slug, market, category, health_score, health_delta, monthly_revenue, ranking_score, freshness_score')
    .lt('health_delta', -0.15)
    .gt('monthly_revenue', 50)
    .order('monthly_revenue', { ascending: false })
    .limit(20);

  if (error) {
    logger.error('[insight-engine] Content decay query failed', { error: error.message });
    return { found: 0, insights: [], errors: [error.message] };
  }

  for (const page of decaying ?? []) {
    const revenueImpact = Number(page.monthly_revenue) * Math.abs(Number(page.health_delta));
    const isHighRevenue = Number(page.monthly_revenue) > 200;
    const riskTier = isHighRevenue ? 2 : 1;

    insights.push({
      dedupe_key: `content_decay:${page.market}:${page.slug}:${week}`,
      insight_type: 'content_decay',
      slug: page.slug,
      market: page.market,
      category: page.category,
      title: `Content decay: ${page.slug} (${page.market}) — health ${Number(page.health_delta).toFixed(2)}`,
      detail: {
        health_score: Number(page.health_score),
        health_delta: Number(page.health_delta),
        monthly_revenue: Number(page.monthly_revenue),
        ranking_score: Number(page.ranking_score),
        freshness_score: Number(page.freshness_score),
      },
      recommended_action: riskTier === 1 ? 'boost_content' : 'apply_optimization',
      risk_tier: riskTier,
      expected_revenue_impact: Math.round(revenueImpact * 100) / 100,
      confidence: 0.7,
    });
  }

  return { found: insights.length, insights, errors: [] };
}

// ── Module 3: Competitor Opportunity Detection ─────────────────────────────

async function runCompetitorOpportunityDetection(
  supabase: ReturnType<typeof createServiceClient>,
) {
  logger.info('[insight-engine] Module 3: Competitor Opportunity Detection');
  const week = getISOWeek();
  const insights: InsightRow[] = [];

  // Find competitor drops that we can capitalize on
  const { data: alerts, error } = await supabase
    .from('competitor_alerts')
    .select('keyword, market, category, competitor_domain, previous_position, current_position, cps_score, own_position, slug_to_boost')
    .in('alert_type', ['competitor_drop', 'authority_exit'])
    .eq('dismissed', false)
    .eq('boost_triggered', false)
    .order('cps_score', { ascending: false })
    .limit(15);

  if (error) {
    logger.error('[insight-engine] Competitor alerts query failed', { error: error.message });
    return { found: 0, insights: [], errors: [error.message] };
  }

  for (const alert of alerts ?? []) {
    const hasContent = !!alert.slug_to_boost;
    const cps = Number(alert.cps_score) || 0;
    // Estimate revenue impact based on CPS and position opportunity
    const revenueImpact = cps * (hasContent ? 15 : 8); // Rough CPS→$ conversion

    if (hasContent) {
      insights.push({
        dedupe_key: `competitor_opportunity:${alert.market}:${alert.keyword}:${week}`,
        insight_type: 'competitor_opportunity',
        slug: alert.slug_to_boost,
        market: alert.market,
        category: alert.category,
        title: `Competitor drop: ${alert.competitor_domain} fell on "${alert.keyword}" (${alert.market})`,
        detail: {
          keyword: alert.keyword,
          competitor: alert.competitor_domain,
          competitor_prev_pos: alert.previous_position,
          competitor_curr_pos: alert.current_position,
          cps_score: cps,
          own_position: alert.own_position,
        },
        recommended_action: 'boost_content',
        risk_tier: 1,
        expected_revenue_impact: Math.round(revenueImpact * 100) / 100,
        confidence: 0.65,
      });
    } else {
      // No content for this keyword → content gap
      insights.push({
        dedupe_key: `content_gap:${alert.market}:${alert.keyword}:${week}`,
        insight_type: 'content_gap',
        slug: null,
        market: alert.market,
        category: alert.category,
        title: `Content gap: No page for "${alert.keyword}" (${alert.market}) — competitor dropped`,
        detail: {
          keyword: alert.keyword,
          competitor: alert.competitor_domain,
          cps_score: cps,
        },
        recommended_action: 'queue_genesis',
        risk_tier: 2,
        expected_revenue_impact: Math.round(revenueImpact * 100) / 100,
        confidence: 0.5,
      });
    }
  }

  return { found: insights.length, insights, errors: [] };
}

// ── Module 4: A/B Test Winner Auto-Detection ───────────────────────────────

async function runAbWinnerDetection(supabase: ReturnType<typeof createServiceClient>) {
  logger.info('[insight-engine] Module 4: A/B Test Winner Detection');
  const week = getISOWeek();
  const insights: InsightRow[] = [];

  // Get all active A/B tests (not yet declared winner)
  const { data: tests, error } = await supabase
    .from('ab_test_stats')
    .select('hub_id, variant, impressions, clicks, winner_declared')
    .eq('winner_declared', false);

  if (error) {
    logger.error('[insight-engine] A/B stats query failed', { error: error.message });
    return { found: 0, insights: [], errors: [error.message] };
  }

  // Group by hub_id to compare variants
  const hubMap = new Map<string, { A?: typeof tests[0]; B?: typeof tests[0] }>();
  for (const row of tests ?? []) {
    const hub = hubMap.get(row.hub_id) ?? {};
    if (row.variant === 'A') hub.A = row;
    else if (row.variant === 'B') hub.B = row;
    hubMap.set(row.hub_id, hub);
  }

  for (const [hubId, { A, B }] of hubMap) {
    if (!A || !B) continue;
    const aImpressions = A.impressions ?? 0;
    const bImpressions = B.impressions ?? 0;
    const totalImpressions = aImpressions + bImpressions;

    // Minimum: 500 total impressions
    if (totalImpressions < 500) continue;

    const aClicks = A.clicks ?? 0;
    const bClicks = B.clicks ?? 0;
    const aCr = aImpressions > 0 ? aClicks / aImpressions : 0;
    const bCr = bImpressions > 0 ? bClicks / bImpressions : 0;

    // Z-test for proportions
    const pooledCr = (aClicks + bClicks) / totalImpressions;
    if (pooledCr <= 0 || pooledCr >= 1) continue;

    const se = Math.sqrt(pooledCr * (1 - pooledCr) * (1 / aImpressions + 1 / bImpressions));
    if (se <= 0) continue;

    const zScore = Math.abs(aCr - bCr) / se;
    const confidence = zScore >= 2.576 ? 0.99 : zScore >= 1.96 ? 0.95 : zScore >= 1.645 ? 0.90 : 0;

    // Only flag if >95% confidence
    if (confidence < 0.95) continue;

    const winner = aCr > bCr ? 'A' : 'B';
    const winnerCr = winner === 'A' ? aCr : bCr;
    const loserCr = winner === 'A' ? bCr : aCr;
    const lift = loserCr > 0 ? ((winnerCr - loserCr) / loserCr) * 100 : 0;

    // Parse hub_id format: category__market
    const [category, market] = hubId.split('__');

    insights.push({
      dedupe_key: `ab_winner:${hubId}:${week}`,
      insight_type: 'ab_winner',
      slug: null,
      market: market ?? null,
      category: category ?? null,
      title: `A/B winner: ${hubId} — Variant ${winner} wins (+${lift.toFixed(1)}% lift, ${(confidence * 100).toFixed(0)}% confidence)`,
      detail: {
        hub_id: hubId,
        winner,
        variant_a_cr: Math.round(aCr * 10000) / 10000,
        variant_b_cr: Math.round(bCr * 10000) / 10000,
        variant_a_impressions: aImpressions,
        variant_b_impressions: bImpressions,
        lift_percent: Math.round(lift * 10) / 10,
        z_score: Math.round(zScore * 100) / 100,
        confidence,
        total_impressions: totalImpressions,
      },
      recommended_action: 'deploy_ab_winner',
      risk_tier: 1,
      expected_revenue_impact: Math.round(lift * 2), // Rough: 1% lift ≈ $2/mo
      confidence: Math.round(confidence * 1000) / 1000,
    });
  }

  return { found: insights.length, insights, errors: [] };
}

// ── Module 5: Revenue Anomaly Detection ────────────────────────────────────

async function runRevenueAnomalyDetection(
  supabase: ReturnType<typeof createServiceClient>,
) {
  logger.info('[insight-engine] Module 5: Revenue Anomaly Detection');
  const week = getISOWeek();
  const insights: InsightRow[] = [];

  // Get link performance: last 7 days vs previous 28 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();

  // Recent conversions (last 7 days)
  const { data: recentConversions, error: recentErr } = await supabase
    .from('conversions')
    .select('link_id, commission_earned')
    .eq('status', 'approved')
    .gte('converted_at', sevenDaysAgo);

  // Historical conversions (8-35 days ago = 4 weeks before the recent period)
  const { data: historicalConversions, error: histErr } = await supabase
    .from('conversions')
    .select('link_id, commission_earned')
    .eq('status', 'approved')
    .gte('converted_at', thirtyFiveDaysAgo)
    .lt('converted_at', sevenDaysAgo);

  if (recentErr || histErr) {
    const msg = recentErr?.message ?? histErr?.message ?? 'Unknown error';
    logger.error('[insight-engine] Revenue anomaly query failed', { error: msg });
    return { found: 0, insights: [], errors: [msg] };
  }

  // Aggregate by link_id
  const recentByLink = new Map<string, number>();
  for (const c of recentConversions ?? []) {
    if (!c.link_id) continue;
    recentByLink.set(c.link_id, (recentByLink.get(c.link_id) ?? 0) + (c.commission_earned ?? 0));
  }

  const historicalByLink = new Map<string, number>();
  for (const c of historicalConversions ?? []) {
    if (!c.link_id) continue;
    historicalByLink.set(c.link_id, (historicalByLink.get(c.link_id) ?? 0) + (c.commission_earned ?? 0));
  }

  // Get affiliate link details for context
  const allLinkIds = new Set([...recentByLink.keys(), ...historicalByLink.keys()]);
  const { data: linkDetails } = await supabase
    .from('affiliate_links')
    .select('id, slug, partner_name, market, category')
    .in('id', [...allLinkIds]);

  const linkMap = new Map<string, typeof linkDetails extends (infer T)[] | null ? T : never>();
  for (const l of linkDetails ?? []) {
    linkMap.set(l.id, l);
  }

  // Compare: weekly avg from 4-week history vs this week
  for (const linkId of allLinkIds) {
    const recent = recentByLink.get(linkId) ?? 0;
    const historical = historicalByLink.get(linkId) ?? 0;
    const weeklyAvg = historical / 4; // 4 weeks of history

    if (weeklyAvg < 10) continue; // Skip low-revenue links (noise)

    const changePercent = weeklyAvg > 0 ? ((recent - weeklyAvg) / weeklyAvg) * 100 : 0;
    const link = linkMap.get(linkId);

    // Revenue drop >30%
    if (changePercent < -30) {
      insights.push({
        dedupe_key: `revenue_anomaly:drop:${linkId}:${week}`,
        insight_type: 'revenue_anomaly',
        slug: link?.slug ? `/go/${link.slug}/` : null,
        market: link?.market ?? null,
        category: link?.category ?? null,
        title: `Revenue drop: ${link?.partner_name ?? linkId} down ${Math.abs(Math.round(changePercent))}% this week`,
        detail: {
          link_id: linkId,
          partner_name: link?.partner_name,
          recent_7d_revenue: Math.round(recent * 100) / 100,
          weekly_avg_revenue: Math.round(weeklyAvg * 100) / 100,
          change_percent: Math.round(changePercent * 10) / 10,
        },
        recommended_action: 'activate_link', // Check if link is healthy, possibly switch
        risk_tier: 2,
        expected_revenue_impact: Math.round(Math.abs(recent - weeklyAvg) * 100) / 100,
        confidence: 0.6,
      });
    }

    // Revenue spike >50%
    if (changePercent > 50 && recent > 20) {
      insights.push({
        dedupe_key: `revenue_opportunity:spike:${linkId}:${week}`,
        insight_type: 'revenue_opportunity',
        slug: link?.slug ? `/go/${link.slug}/` : null,
        market: link?.market ?? null,
        category: link?.category ?? null,
        title: `Revenue spike: ${link?.partner_name ?? linkId} up ${Math.round(changePercent)}% this week`,
        detail: {
          link_id: linkId,
          partner_name: link?.partner_name,
          recent_7d_revenue: Math.round(recent * 100) / 100,
          weekly_avg_revenue: Math.round(weeklyAvg * 100) / 100,
          change_percent: Math.round(changePercent * 10) / 10,
        },
        recommended_action: 'boost_content', // Capitalize on momentum
        risk_tier: 1,
        expected_revenue_impact: Math.round((recent - weeklyAvg) * 100) / 100,
        confidence: 0.7,
      });
    }
  }

  return { found: insights.length, insights, errors: [] };
}

// ── Claude AI Synthesis (with deterministic fallback) ──────────────────────

async function runClaudeSynthesis(
  insights: InsightRow[],
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ success: boolean; synthesis: string | null }> {
  if (insights.length === 0) {
    return { success: true, synthesis: null };
  }

  // Load existing learnings for context
  const { data: learnings } = await supabase
    .from('learnings')
    .select('category, learning, confidence')
    .gt('confidence', 0.6)
    .order('confidence', { ascending: false })
    .limit(10);

  const top10 = insights
    .sort((a, b) => (b.expected_revenue_impact * b.confidence) - (a.expected_revenue_impact * a.confidence))
    .slice(0, 10);

  const prompt = `You are SmartFinPro's autonomous revenue optimization system. Analyze these insights and provide prioritized recommendations.

## Top ${top10.length} Insights (sorted by priority score)

${top10.map((i, idx) => `${idx + 1}. [${i.insight_type}] ${i.title}
   Revenue impact: $${i.expected_revenue_impact}/mo | Confidence: ${(i.confidence * 100).toFixed(0)}% | Tier: ${i.risk_tier}
   ${i.recommended_action ? `Recommended: ${i.recommended_action}` : ''}`).join('\n\n')}

${learnings && learnings.length > 0 ? `
## System Learnings (from previous actions)

${learnings.map((l) => `- [${l.category}] ${l.learning} (${(Number(l.confidence) * 100).toFixed(0)}% confidence)`).join('\n')}
` : ''}

## Task

1. Identify cross-patterns (e.g., content decay + competitor opportunity = double urgency)
2. Prioritize the top 5 most impactful actions to take THIS WEEK
3. Flag any insights that contradict learnings
4. Suggest creative approaches based on the data patterns

Respond in a concise format with actionable bullet points. Keep it under 500 words.`;

  try {
    const response = await withRetry(
      () =>
        createClaudeMessage(
          {
            model: 'claude-sonnet-4-6',
            max_tokens: 800,
            messages: [{ role: 'user', content: prompt }],
          },
          { timeoutMs: 20_000, operation: 'insight-engine-synthesis' },
        ),
      { maxAttempts: 2, backoffMs: [2000, 4000] },
    );

    const textBlock = response.content.find((b) => b.type === 'text');
    return { success: true, synthesis: textBlock?.text ?? null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Claude error';
    logger.warn('[insight-engine] Claude synthesis failed — using deterministic fallback', {
      error: msg,
    });
    return { success: false, synthesis: null };
  }
}

// ── Main: Run Insight Engine ───────────────────────────────────────────────

export async function runInsightEngine(): Promise<InsightEngineResult> {
  const startTime = Date.now();
  const supabase = createServiceClient();
  const auditId = await startAudit(supabase, 'insight-engine');
  const allErrors: string[] = [];
  const allInsights: InsightRow[] = [];

  try {
    // Check if enabled
    const { data: enabledSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'insight_engine_enabled')
      .single();

    if (enabledSetting?.value !== 'true') {
      logger.info('[insight-engine] Disabled via system_settings');
      await finishAudit(supabase, auditId, 'success', startTime, 0, undefined, {
        skipped: true,
        reason: 'disabled',
      });
      return {
        success: true,
        auditId,
        healthScored: 0,
        insightsGenerated: 0,
        aiSynthesis: false,
        errors: [],
        modules: {
          contentHealth: { scored: 0 },
          contentDecay: { found: 0 },
          competitorOpportunity: { found: 0 },
          abWinner: { found: 0 },
          revenueAnomaly: { found: 0 },
        },
      };
    }

    // ── Run all 5 modules ──
    // Module 1: Content Health (must run first, others depend on it)
    const healthResult = await runContentHealthScoring();
    allErrors.push(...healthResult.errors);

    // Modules 2-5 can run in parallel (they read from content_health_scores)
    const [decayResult, competitorResult, abResult, revenueResult] = await Promise.all([
      runContentDecayDetection(supabase),
      runCompetitorOpportunityDetection(supabase),
      runAbWinnerDetection(supabase),
      runRevenueAnomalyDetection(supabase),
    ]);

    allErrors.push(...decayResult.errors, ...competitorResult.errors, ...abResult.errors, ...revenueResult.errors);
    allInsights.push(
      ...decayResult.insights,
      ...competitorResult.insights,
      ...abResult.insights,
      ...revenueResult.insights,
    );

    // ── Persist insights (idempotent via dedupe_key) ──
    let insightsInserted = 0;
    if (allInsights.length > 0) {
      for (const insight of allInsights) {
        const { error: insertErr } = await supabase.from('insights').upsert(
          {
            dedupe_key: insight.dedupe_key,
            insight_type: insight.insight_type,
            slug: insight.slug,
            market: insight.market,
            category: insight.category,
            title: insight.title,
            detail: insight.detail,
            recommended_action: insight.recommended_action,
            risk_tier: insight.risk_tier,
            expected_revenue_impact: insight.expected_revenue_impact,
            confidence: insight.confidence,
            status: 'pending',
          },
          { onConflict: 'dedupe_key', ignoreDuplicates: true },
        );

        if (insertErr) {
          // Duplicate key = expected (idempotent), skip
          if (!insertErr.message.includes('duplicate') && !insertErr.message.includes('unique')) {
            allErrors.push(`Insight insert failed: ${insertErr.message}`);
          }
        } else {
          insightsInserted++;
        }
      }
    }

    // ── Claude AI Synthesis ──
    const synthesis = await runClaudeSynthesis(allInsights, supabase);
    const aiSynthesisSucceeded = synthesis.success;

    // ── Send Email Summary ──
    const summaryLines = [
      '📊 <b>Insight Engine — Weekly Report</b>',
      '',
      `🏥 Content Health: ${healthResult.scored} pages scored`,
      `📉 Content Decay: ${decayResult.found} pages declining`,
      `🎯 Competitor Opportunities: ${competitorResult.found} detected`,
      `🏆 A/B Winners: ${abResult.found} ready to deploy`,
      `💰 Revenue Anomalies: ${revenueResult.found} flagged`,
      '',
      `📝 Total Insights: ${insightsInserted} new (${allInsights.length} total)`,
      `🤖 AI Synthesis: ${aiSynthesisSucceeded ? '✅' : '⚠️ Fallback (deterministic)'}`,
    ];

    if (synthesis.synthesis) {
      summaryLines.push('', '🧠 <b>AI Analysis:</b>', synthesis.synthesis.slice(0, 500));
    }

    if (!aiSynthesisSucceeded) {
      summaryLines.push(
        '',
        '⚠️ Claude API unavailable — insights prioritized by revenue_impact × confidence',
      );
    }

    const topInsight = allInsights.sort(
      (a, b) => b.expected_revenue_impact * b.confidence - a.expected_revenue_impact * a.confidence,
    )[0];
    if (topInsight) {
      summaryLines.push(
        '',
        `🔝 Top insight: ${topInsight.title}`,
        `   Est. impact: $${topInsight.expected_revenue_impact}/mo`,
      );
    }

    summaryLines.push('', `⏱ Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    await sendAutonomousNotification('Insight Engine Weekly Report', summaryLines.join('\n'));

    // ── Finalize audit ──
    const moduleResults = {
      contentHealth: { scored: healthResult.scored },
      contentDecay: { found: decayResult.found },
      competitorOpportunity: { found: competitorResult.found },
      abWinner: { found: abResult.found },
      revenueAnomaly: { found: revenueResult.found },
    };

    await finishAudit(supabase, auditId, allErrors.length > 0 ? 'error' : 'success', startTime, insightsInserted, allErrors.length > 0 ? allErrors.join('; ') : undefined, {
      modules: moduleResults,
      ai_synthesis: aiSynthesisSucceeded,
    });

    logger.info('[insight-engine] Completed', {
      insightsGenerated: insightsInserted,
      healthScored: healthResult.scored,
      aiSynthesis: aiSynthesisSucceeded,
      durationMs: Date.now() - startTime,
    });

    return {
      success: true,
      auditId,
      healthScored: healthResult.scored,
      insightsGenerated: insightsInserted,
      aiSynthesis: aiSynthesisSucceeded,
      errors: allErrors,
      modules: moduleResults,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[insight-engine] Fatal error', { error: msg });
    allErrors.push(msg);

    await finishAudit(supabase, auditId, 'error', startTime, 0, msg);

    await sendAutonomousNotification(
      'Insight Engine FAILED',
      `Error: ${msg}\nDuration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    );

    return {
      success: false,
      auditId,
      healthScored: 0,
      insightsGenerated: 0,
      aiSynthesis: false,
      errors: allErrors,
      modules: {
        contentHealth: { scored: 0 },
        contentDecay: { found: 0 },
        competitorOpportunity: { found: 0 },
        abWinner: { found: 0 },
        revenueAnomaly: { found: 0 },
      },
    };
  }
}

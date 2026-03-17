'use server';

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging';

import { createServiceClient } from '@/lib/supabase/server';
import { QuizStats } from '@/components/dashboard/quiz-analytics';
import { TimeRange } from './dashboard';

function getTimeRangeStart(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
  }
}

export async function getQuizAnalytics(range: TimeRange = '7d'): Promise<QuizStats> {
  const supabase = createServiceClient();
  const rangeStart = getTimeRangeStart(range);

  // Default empty stats
  const emptyStats: QuizStats = {
    totalStarts: 0,
    totalCompletions: 0,
    totalCtaClicks: 0,
    completionRate: 0,
    ctaClickRate: 0,
    topRecommendations: [],
    answerDistribution: {
      region: {},
      volume: {},
      focus: {},
    },
  };

  try {
    // Build base query
    let eventsQuery = supabase
      .from('analytics_events')
      .select('event_name, event_label, properties, occurred_at')
      .in('event_name', ['quiz_started', 'quiz_completed', 'quiz_cta_click', 'quiz_answer'])
      .order('occurred_at', { ascending: false })
      .limit(10000); // Cap to prevent full-table scans on large datasets

    if (rangeStart) {
      eventsQuery = eventsQuery.gte('occurred_at', rangeStart.toISOString());
    }

    const { data: events, error } = await eventsQuery;

    if (error) {
      // Table doesn't exist yet — return empty stats silently
      if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('schema cache') || error.message?.includes('relation')) {
        return emptyStats;
      }
      logger.error('Error fetching quiz analytics:', error);
      return emptyStats;
    }

    if (!events || events.length === 0) {
      return emptyStats;
    }

    // Process events
    let totalStarts = 0;
    let totalCompletions = 0;
    let totalCtaClicks = 0;
    const recommendations = new Map<string, { count: number; clicks: number }>();
    const answerDistribution = {
      region: {} as Record<string, number>,
      volume: {} as Record<string, number>,
      focus: {} as Record<string, number>,
    };

    events.forEach((event) => {
      const props = (event.properties || {}) as Record<string, unknown>;

      switch (event.event_name) {
        case 'quiz_started':
          totalStarts++;
          break;

        case 'quiz_completed':
          totalCompletions++;
          // Track recommendation
          const recommendedProduct = props.recommendedProduct as string;
          if (recommendedProduct) {
            const current = recommendations.get(recommendedProduct) || { count: 0, clicks: 0 };
            current.count++;
            recommendations.set(recommendedProduct, current);
          }
          break;

        case 'quiz_cta_click':
          totalCtaClicks++;
          // Track click for the product
          const clickedProduct = props.recommendedProduct as string;
          if (clickedProduct) {
            const current = recommendations.get(clickedProduct) || { count: 0, clicks: 0 };
            current.clicks++;
            recommendations.set(clickedProduct, current);
          }
          break;

        case 'quiz_answer':
          // Track answer distribution
          const questionId = props.questionId as string;
          const answerId = props.answerId as string;
          if (questionId && answerId) {
            if (questionId === 'region') {
              answerDistribution.region[answerId] = (answerDistribution.region[answerId] || 0) + 1;
            } else if (questionId === 'volume') {
              answerDistribution.volume[answerId] = (answerDistribution.volume[answerId] || 0) + 1;
            } else if (questionId === 'focus') {
              answerDistribution.focus[answerId] = (answerDistribution.focus[answerId] || 0) + 1;
            }
          }
          break;
      }
    });

    // Build top recommendations
    const topRecommendations = Array.from(recommendations.entries())
      .map(([product, data]) => ({
        product,
        count: data.count,
        clickRate: data.count > 0 ? (data.clicks / data.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate rates
    const completionRate = totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0;
    const ctaClickRate = totalCompletions > 0 ? (totalCtaClicks / totalCompletions) * 100 : 0;

    return {
      totalStarts,
      totalCompletions,
      totalCtaClicks,
      completionRate,
      ctaClickRate,
      topRecommendations,
      answerDistribution,
    };
  } catch (error) {
    Sentry.captureException(error);
    logger.error('Error in getQuizAnalytics:', error);
    return emptyStats;
  }
}

/**
 * Get high-intent events (quiz CTA clicks) for linking to conversions
 */
export async function getHighIntentEvents(range: TimeRange = '7d') {
  const supabase = createServiceClient();
  const rangeStart = getTimeRangeStart(range);

  let query = supabase
    .from('analytics_events')
    .select('*')
    .eq('event_name', 'quiz_cta_click')
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (rangeStart) {
    query = query.gte('occurred_at', rangeStart.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    // Table doesn't exist yet — return empty silently
    if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('schema cache') || error.message?.includes('relation')) {
      return [];
    }
    logger.error('Error fetching high-intent events:', error);
    return [];
  }

  return (data || []).map((event) => {
    const props = (event.properties || {}) as Record<string, unknown>;
    return {
      id: event.id,
      sessionId: event.session_id,
      occurredAt: event.occurred_at,
      product: props.recommendedProduct as string,
      affiliateUrl: props.affiliateUrl as string,
      answers: props.answers as Record<string, string>,
      isHighIntent: true,
    };
  });
}

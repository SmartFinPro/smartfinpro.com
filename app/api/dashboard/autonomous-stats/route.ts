// app/api/dashboard/autonomous-stats/route.ts
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Auth handled by dashboard layout (middleware)
  // Same pattern as gap-analysis, content-generator, etc.

  const supabase = createServiceClient();

  // All queries in parallel
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    actionsResult,
    outcomesResult,
    pendingResult,
    learningsResult,
    settingsResult,
    recentResult,
  ] = await Promise.all([
    // Actions in last 7 days
    supabase
      .from('autonomous_actions')
      .select('id', { count: 'exact', head: true })
      .gte('executed_at', sevenDaysAgo),

    // Outcome breakdown (all time)
    supabase
      .from('autonomous_actions')
      .select('outcome')
      .neq('outcome', 'pending'),

    // Pending insights
    supabase
      .from('insights')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString()),

    // Top learnings
    supabase
      .from('learnings')
      .select('learning, confidence, category')
      .gte('confidence', 0.6)
      .order('confidence', { ascending: false })
      .limit(5),

    // System settings
    supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['auto_executor_enabled', 'simulation_mode']),

    // Recent actions
    supabase
      .from('autonomous_actions')
      .select('id, action_type, description, outcome, executed_at, risk_tier')
      .order('executed_at', { ascending: false })
      .limit(10),
  ]);

  // Parse outcomes
  let positive = 0, neutral = 0, negative = 0;
  for (const row of outcomesResult.data ?? []) {
    if (row.outcome === 'positive') positive++;
    else if (row.outcome === 'negative') negative++;
    else neutral++;
  }

  // System confidence: weighted average of all learnings
  const allLearnings = learningsResult.data ?? [];
  const systemConfidence = allLearnings.length > 0
    ? allLearnings.reduce((sum: number, l: { confidence: number }) => sum + l.confidence, 0) / allLearnings.length
    : 0;

  // Settings
  const settingsMap = new Map<string, string>();
  for (const row of settingsResult.data ?? []) {
    settingsMap.set(row.key, row.value);
  }

  return Response.json({
    actionsLast7Days: actionsResult.count ?? 0,
    positiveOutcomes: positive,
    neutralOutcomes: neutral,
    negativeOutcomes: negative,
    pendingInsights: pendingResult.count ?? 0,
    systemConfidence,
    simulationMode: settingsMap.get('simulation_mode') === 'true',
    autoExecutorEnabled: settingsMap.get('auto_executor_enabled') === 'true',
    topLearnings: allLearnings.slice(0, 3),
    recentActions: recentResult.data ?? [],
  });
}

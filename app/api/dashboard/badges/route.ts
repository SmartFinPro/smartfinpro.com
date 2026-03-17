import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const badges: Record<string, number> = { planning: 0, optimize: 0 };

  try {
    const supabase = createServiceClient();
    const [planRes, optRes] = await Promise.all([
      supabase
        .from('planning_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'planned'),
      supabase
        .from('optimization_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    badges.planning = planRes.count ?? 0;
    badges.optimize = optRes.count ?? 0;
  } catch {
    // Non-critical — return zeros
  }

  return NextResponse.json(badges);
}

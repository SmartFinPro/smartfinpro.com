import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { compareSecret } from '@/lib/security/timing-safe';

// Dashboard-session gate (same model as protected /api/dashboard/* + archive-page).
// Dev-bypass only outside production (cannot be flipped on in prod).
function isAuthed(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production' && process.env.DASHBOARD_AUTH_DISABLED === 'true') {
    return true;
  }
  const dashSecret = process.env.DASHBOARD_SECRET;
  if (!dashSecret) return false;
  const cookie = request.cookies.get('sfp-dash-auth')?.value;
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return isValidDashboardSessionValue(cookie, dashSecret) || compareSecret(bearer, dashSecret);
}

export async function GET(request: NextRequest) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: logs, error } = await supabase
    .from('auto_genesis_log')
    .select('id, brief_path, market, category, keyword, slug, status, word_count, indexed, error_message, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ logs: [], error: error.message });
  }

  return NextResponse.json({ logs: logs || [] });
}

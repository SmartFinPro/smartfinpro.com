import { NextRequest, NextResponse } from 'next/server';
import { compareSecret } from '@/lib/security/timing-safe';
import { isValidDashboardSessionValue } from '@/lib/auth/dashboard-session';
import { getWebVitalsP75LastNDays } from '@/lib/actions/web-vitals';

function isAuthorized(request: NextRequest): boolean {
  const dashSecret = process.env.DASHBOARD_SECRET;
  const authCookie = request.cookies.get('sfp-dash-auth')?.value;
  const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  return (
    isValidDashboardSessionValue(authCookie, dashSecret) ||
    compareSecret(bearerToken, dashSecret)
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await getWebVitalsP75LastNDays(7);
  const status =
    data.sample_size === 0
      ? 'never-run'
      : data.poor_metrics > 0
        ? 'down'
        : data.warning_metrics > 0
          ? 'degraded'
          : 'operational';

  return NextResponse.json({
    ...data,
    status,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getBacklinkCredentials,
  getBacklinkCredentialStatus,
  updateBacklinkCredentials,
  testRedditConnection,
  testMediumConnection,
} from '@/lib/actions/settings';

/**
 * Dashboard Backlink Credentials API
 *
 * GET  — Returns masked credentials + status badges
 * POST — Actions: update, test-reddit, test-medium
 */

export async function GET() {
  try {
    const [credentials, status] = await Promise.all([
      getBacklinkCredentials(),
      getBacklinkCredentialStatus(),
    ]);

    return NextResponse.json({ credentials, status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update': {
        const result = await updateBacklinkCredentials(body.credentials ?? {});
        return NextResponse.json(result);
      }

      case 'test-reddit': {
        const result = await testRedditConnection({
          clientId: body.clientId ?? '',
          clientSecret: body.clientSecret ?? '',
          username: body.username ?? '',
          password: body.password ?? '',
        });
        return NextResponse.json(result);
      }

      case 'test-medium': {
        const result = await testMediumConnection(body.token);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

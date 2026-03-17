// app/api/dashboard/connectors/route.ts
// Proxy: client components → connectors server actions
// Used by: connector-list.tsx
// Fixes: 'use client' cannot import from '@/lib/actions/connectors'

import { NextRequest, NextResponse } from 'next/server';
import {
  configureConnector,
  toggleConnector,
  triggerManualSync,
  deleteConnectorConfig,
} from '@/lib/actions/connectors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: action' },
        { status: 400 },
      );
    }

    if (action === 'configure') {
      const { connectorName, config } = body as {
        connectorName: string;
        config: {
          api_key: string;
          api_secret?: string;
          publisher_id?: string;
          webhook_secret?: string;
        };
      };
      if (!connectorName || !config) {
        return NextResponse.json(
          { success: false, error: 'Missing connectorName or config' },
          { status: 400 },
        );
      }
      const result = await configureConnector(connectorName, config);
      return NextResponse.json(result);
    }

    if (action === 'toggle') {
      const { connectorName, enabled } = body as {
        connectorName: string;
        enabled: boolean;
      };
      if (!connectorName || typeof enabled !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Missing connectorName or enabled' },
          { status: 400 },
        );
      }
      const result = await toggleConnector(connectorName, enabled);
      return NextResponse.json(result);
    }

    if (action === 'sync') {
      const { connectorName } = body as { connectorName: string };
      if (!connectorName) {
        return NextResponse.json(
          { success: false, error: 'Missing connectorName' },
          { status: 400 },
        );
      }
      const result = await triggerManualSync(connectorName);
      return NextResponse.json(result);
    }

    if (action === 'delete') {
      const { connectorName } = body as { connectorName: string };
      if (!connectorName) {
        return NextResponse.json(
          { success: false, error: 'Missing connectorName' },
          { status: 400 },
        );
      }
      const result = await deleteConnectorConfig(connectorName);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

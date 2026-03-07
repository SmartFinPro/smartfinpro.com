'use server';

import 'server-only';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { getConnector, getAvailableConnectors } from '@/lib/api/connectors';
import { syncConnector, getRecentSyncLogs } from '@/lib/api/sync-service';

export interface ConnectorInfo {
  name: string;
  displayName: string;
  description: string;
  supportsWebhooks: boolean;
  is_enabled: boolean;
  is_configured: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  error_message?: string | null;
  records_synced?: number;
  webhook_url: string;
}

export interface SyncLog {
  id: string;
  connector_name: string;
  sync_type: string;
  status: string;
  records_synced: number;
  records_skipped: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

/**
 * Get all connectors with their status
 */
export async function getConnectorsWithStatus(): Promise<ConnectorInfo[]> {
  const supabase = createServiceClient();
  const availableConnectors = getAvailableConnectors();

  // Fetch both in parallel (independent queries)
  const [{ data: dbConnectors }, { data: recentLogs }] = await Promise.all([
    supabase.from('api_connectors').select('*'),
    supabase
      .from('sync_logs')
      .select('connector_name, status, error_message, records_synced')
      .order('started_at', { ascending: false })
      .limit(50),
  ]);

  // Create map of latest log per connector
  interface SyncLog {
    connector_name: string;
    status: string;
    error_message: string | null;
    records_synced: number;
  }
  const latestLogMap = new Map<string, { status: string; error_message: string | null; records_synced: number }>();
  (recentLogs || []).forEach((log: SyncLog) => {
    if (!latestLogMap.has(log.connector_name)) {
      latestLogMap.set(log.connector_name, {
        status: log.status,
        error_message: log.error_message,
        records_synced: log.records_synced,
      });
    }
  });

  interface DbConnector {
    name: string;
    is_enabled: boolean;
    api_key_encrypted?: string;
    api_secret_encrypted?: string;
    config?: { publisher_id?: string };
    last_sync_at?: string;
    last_sync_status?: string;
    error_message?: string;
  }
  const dbMap = new Map((dbConnectors || []).map((c: DbConnector) => [c.name, c]));

  // Get base URL for webhook URLs
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://smartfinpro.com';

  return availableConnectors.map((connector) => {
    const dbConfig = dbMap.get(connector.name);
    const latestLog = latestLogMap.get(connector.name);

    // Check if configured - some connectors need publisher_id instead of api_secret
    const isConfigured = dbConfig?.api_key_encrypted && (
      dbConfig?.api_secret_encrypted ||
      dbConfig?.config?.publisher_id
    );

    return {
      name: connector.name,
      displayName: connector.displayName,
      description: connector.description,
      supportsWebhooks: connector.supportsWebhooks,
      is_enabled: dbConfig?.is_enabled || false,
      is_configured: !!isConfigured,
      last_sync_at: dbConfig?.last_sync_at || null,
      last_sync_status: dbConfig?.last_sync_status || null,
      error_message: latestLog?.status === 'failed' ? latestLog.error_message : null,
      records_synced: latestLog?.status === 'success' ? latestLog.records_synced : undefined,
      webhook_url: `${baseUrl}/api/webhooks/conversions?connector=${connector.name}`,
    };
  });
}

/**
 * Get recent sync logs
 */
export async function fetchSyncLogs(limit = 20): Promise<SyncLog[]> {
  const logs = await getRecentSyncLogs(limit);
  return logs as SyncLog[];
}

/**
 * Configure a connector
 */
export async function configureConnector(
  connectorName: string,
  config: {
    api_key: string;
    api_secret?: string;
    publisher_id?: string;
    webhook_secret?: string;
    additional_config?: Record<string, unknown>;
  }
): Promise<{ success: boolean; message: string }> {
  const supabase = createServiceClient();

  // Validate connector exists
  const connector = getConnector(connectorName);
  if (!connector) {
    return { success: false, message: `Unknown connector: ${connectorName}` };
  }

  // Build initialization config
  const initConfig: Record<string, unknown> = {
    api_key: config.api_key,
  };

  if (config.api_secret) {
    initConfig.api_secret = config.api_secret;
  }

  if (config.publisher_id) {
    initConfig.publisher_id = config.publisher_id;
  }

  // Test the connection with provided credentials
  try {
    await connector.initialize(initConfig);

    const testResult = await connector.testConnection();
    if (!testResult.success) {
      return { success: false, message: `Connection test failed: ${testResult.message}` };
    }
  } catch (error) {
    return {
      success: false,
      message: `Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }

  // Build additional config object
  const additionalConfig: Record<string, unknown> = {
    ...config.additional_config,
  };

  if (config.publisher_id) {
    additionalConfig.publisher_id = config.publisher_id;
  }

  // Save configuration
  // NOTE: In production, encrypt api_key and api_secret before storing
  const { error } = await supabase
    .from('api_connectors')
    .upsert({
      name: connectorName,
      connector_type: connectorName,
      api_key_encrypted: config.api_key, // TODO: Encrypt in production
      api_secret_encrypted: config.api_secret || null, // TODO: Encrypt in production
      webhook_secret: config.webhook_secret || null,
      config: additionalConfig,
      is_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq('name', connectorName);

  if (error) {
    return { success: false, message: `Database error: ${error.message}` };
  }

  revalidatePath('/dashboard/settings');
  return { success: true, message: 'Connector configured successfully' };
}

/**
 * Enable or disable a connector
 */
export async function toggleConnector(
  connectorName: string,
  enabled: boolean
): Promise<{ success: boolean; message: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('api_connectors')
    .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('name', connectorName);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/dashboard/settings');
  return {
    success: true,
    message: enabled ? 'Connector enabled' : 'Connector disabled',
  };
}

/**
 * Manually trigger a sync
 */
export async function triggerManualSync(
  connectorName: string
): Promise<{ success: boolean; message: string; records_synced?: number }> {
  try {
    const result = await syncConnector(connectorName, 'manual');

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/revenue');
    revalidatePath('/dashboard');

    if (result.success) {
      return {
        success: true,
        message: `Sync completed: ${result.records_synced} records imported`,
        records_synced: result.records_synced,
      };
    } else {
      return {
        success: false,
        message: result.errors.join(', ') || 'Sync failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Sync failed',
    };
  }
}

/**
 * Delete a connector configuration
 */
export async function deleteConnectorConfig(
  connectorName: string
): Promise<{ success: boolean; message: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('api_connectors')
    .update({
      api_key_encrypted: null,
      api_secret_encrypted: null,
      webhook_secret: null,
      is_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('name', connectorName);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/dashboard/settings');
  return { success: true, message: 'Configuration deleted' };
}

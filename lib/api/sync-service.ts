/**
 * Conversion Sync Service
 *
 * Handles the synchronization of conversions from affiliate networks.
 * Matches incoming conversions with our click data using SubID (click_id).
 */

import { createServiceClient } from '@/lib/supabase/server';
import { getConnector, type ConversionData, type SyncResult } from './connectors';

interface SyncLogEntry {
  id?: string;
  connector_name: string;
  sync_type: 'manual' | 'scheduled' | 'webhook';
  status: 'running' | 'success' | 'failed';
  records_synced: number;
  records_skipped: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Start a sync log entry
 */
async function startSyncLog(
  connectorName: string,
  syncType: 'manual' | 'scheduled' | 'webhook'
): Promise<string> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('sync_logs')
    .insert({
      connector_name: connectorName,
      sync_type: syncType,
      status: 'running',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Complete a sync log entry
 */
async function completeSyncLog(
  logId: string,
  result: Omit<SyncLogEntry, 'connector_name' | 'sync_type' | 'id'>
): Promise<void> {
  const supabase = createServiceClient();

  await supabase
    .from('sync_logs')
    .update({
      status: result.status,
      records_synced: result.records_synced,
      records_skipped: result.records_skipped,
      error_message: result.error_message,
      completed_at: new Date().toISOString(),
      metadata: result.metadata,
    })
    .eq('id', logId);

  // Update connector's last sync status
  await supabase
    .from('api_connectors')
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: result.status,
    })
    .eq('name', result.metadata?.connector_name);
}

/**
 * Match a conversion to a click using SubID
 */
async function matchConversionToClick(
  conversion: ConversionData
): Promise<{ link_id: string; click_id: string } | null> {
  const supabase = createServiceClient();

  // Try to match by click_id first (our primary SubID)
  if (conversion.click_id) {
    const { data: click } = await supabase
      .from('link_clicks')
      .select('link_id, click_id')
      .eq('click_id', conversion.click_id)
      .single();

    if (click) {
      return { link_id: click.link_id, click_id: click.click_id };
    }
  }

  // Try sub_id as fallback
  if (conversion.sub_id) {
    const { data: click } = await supabase
      .from('link_clicks')
      .select('link_id, click_id')
      .eq('click_id', conversion.sub_id)
      .single();

    if (click) {
      return { link_id: click.link_id, click_id: click.click_id };
    }
  }

  return null;
}

/**
 * Check if a conversion already exists (for deduplication)
 */
async function conversionExists(externalId: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { count } = await supabase
    .from('conversions')
    .select('*', { count: 'exact', head: true })
    .eq('network_reference', externalId);

  return (count || 0) > 0;
}

/**
 * Save a conversion to the database
 */
async function saveConversion(
  conversion: ConversionData,
  linkId: string | null
): Promise<void> {
  const supabase = createServiceClient();

  await supabase.from('conversions').insert({
    link_id: linkId,
    converted_at: conversion.converted_at.toISOString(),
    commission_earned: conversion.amount,
    currency: conversion.currency,
    network_reference: conversion.external_id,
    status: conversion.status,
  });
}

/**
 * Sync conversions from a specific connector
 */
export async function syncConnector(
  connectorName: string,
  syncType: 'manual' | 'scheduled' | 'webhook' = 'manual'
): Promise<SyncResult> {
  const supabase = createServiceClient();
  const result: SyncResult = {
    success: false,
    records_synced: 0,
    records_skipped: 0,
    errors: [],
  };

  // Get connector configuration from database
  const { data: connectorConfig, error: configError } = await supabase
    .from('api_connectors')
    .select('*')
    .eq('name', connectorName)
    .single();

  if (configError || !connectorConfig) {
    result.errors.push(`Connector "${connectorName}" not found`);
    return result;
  }

  if (!connectorConfig.is_enabled) {
    result.errors.push(`Connector "${connectorName}" is not enabled`);
    return result;
  }

  // Initialize connector
  const connector = getConnector(connectorName);
  if (!connector) {
    result.errors.push(`Connector type "${connectorName}" not implemented`);
    return result;
  }

  // Start sync log
  let logId: string;
  try {
    logId = await startSyncLog(connectorName, syncType);
  } catch (error) {
    result.errors.push(`Failed to create sync log: ${error}`);
    return result;
  }

  try {
    // Initialize connector with config
    await connector.initialize({
      api_key: connectorConfig.api_key_encrypted, // In production, decrypt this
      api_secret: connectorConfig.api_secret_encrypted,
      webhook_secret: connectorConfig.webhook_secret,
      ...(connectorConfig.config as Record<string, unknown>),
    });

    // Test connection
    const testResult = await connector.testConnection();
    if (!testResult.success) {
      throw new Error(testResult.message);
    }

    // Determine since date (last successful sync or 30 days ago)
    const sinceDate = connectorConfig.last_sync_at
      ? new Date(connectorConfig.last_sync_at)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch and process conversions
    let hasMore = true;
    let cursor: string | undefined;

    while (hasMore) {
      const fetchResult = await connector.fetchConversions(sinceDate, cursor);

      for (const conversion of fetchResult.conversions) {
        // Check for duplicates
        if (await conversionExists(conversion.external_id)) {
          result.records_skipped++;
          continue;
        }

        // Match to our click data
        const match = await matchConversionToClick(conversion);

        // Save conversion (even if no match, for manual assignment later)
        await saveConversion(conversion, match?.link_id || null);
        result.records_synced++;
      }

      hasMore = fetchResult.has_more;
      cursor = fetchResult.next_cursor;
      result.last_cursor = cursor;
    }

    result.success = true;

    // Complete sync log
    await completeSyncLog(logId, {
      status: 'success',
      records_synced: result.records_synced,
      records_skipped: result.records_skipped,
      metadata: { connector_name: connectorName },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);

    // Complete sync log with error
    await completeSyncLog(logId, {
      status: 'failed',
      records_synced: result.records_synced,
      records_skipped: result.records_skipped,
      error_message: errorMessage,
      metadata: { connector_name: connectorName },
    });
  }

  return result;
}

/**
 * Process incoming webhook data
 */
export async function processWebhook(
  connectorName: string,
  payload: unknown,
  signature?: string
): Promise<SyncResult> {
  const supabase = createServiceClient();
  const result: SyncResult = {
    success: false,
    records_synced: 0,
    records_skipped: 0,
    errors: [],
  };

  // Get connector configuration
  const { data: connectorConfig } = await supabase
    .from('api_connectors')
    .select('*')
    .eq('name', connectorName)
    .single();

  if (!connectorConfig?.is_enabled) {
    result.errors.push('Connector not enabled');
    return result;
  }

  const connector = getConnector(connectorName);
  if (!connector || !connector.processWebhook) {
    result.errors.push('Connector does not support webhooks');
    return result;
  }

  // Initialize and verify signature
  await connector.initialize({
    api_key: connectorConfig.api_key_encrypted,
    api_secret: connectorConfig.api_secret_encrypted,
    webhook_secret: connectorConfig.webhook_secret,
    ...(connectorConfig.config as Record<string, unknown>),
  });

  // Verify webhook signature if provided
  if (signature && connector.verifyWebhookSignature) {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    if (!connector.verifyWebhookSignature(payloadString, signature)) {
      result.errors.push('Invalid webhook signature');
      return result;
    }
  }

  // Start sync log
  const logId = await startSyncLog(connectorName, 'webhook');

  try {
    // Process webhook payload
    const conversions = await connector.processWebhook(payload, signature);

    for (const conversion of conversions) {
      if (await conversionExists(conversion.external_id)) {
        result.records_skipped++;
        continue;
      }

      const match = await matchConversionToClick(conversion);
      await saveConversion(conversion, match?.link_id || null);
      result.records_synced++;
    }

    result.success = true;

    await completeSyncLog(logId, {
      status: 'success',
      records_synced: result.records_synced,
      records_skipped: result.records_skipped,
      metadata: { connector_name: connectorName },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);

    await completeSyncLog(logId, {
      status: 'failed',
      records_synced: 0,
      records_skipped: 0,
      error_message: errorMessage,
      metadata: { connector_name: connectorName },
    });
  }

  return result;
}

/**
 * Get sync status for all connectors
 */
export async function getSyncStatus(): Promise<
  Array<{
    name: string;
    connector_type: string;
    is_enabled: boolean;
    last_sync_at: string | null;
    last_sync_status: string | null;
    config: Record<string, unknown>;
  }>
> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('api_connectors')
    .select('name, connector_type, is_enabled, last_sync_at, last_sync_status, config')
    .order('name');

  return data || [];
}

/**
 * Get recent sync logs
 */
export async function getRecentSyncLogs(limit = 20): Promise<SyncLogEntry[]> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('sync_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  return (data || []) as SyncLogEntry[];
}

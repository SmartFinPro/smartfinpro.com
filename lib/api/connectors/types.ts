/**
 * Affiliate API Connector Types
 *
 * This module defines the interfaces and types for affiliate network connectors.
 * Each connector implements the AffiliateConnector interface to provide a
 * standardized way to sync conversion data from different networks.
 */

export interface ConversionData {
  // External reference from the affiliate network
  external_id: string;

  // Our click_id (SubID) that we sent to the network
  click_id?: string;

  // Alternative identifiers
  sub_id?: string;
  partner_key?: string;

  // Commission details
  amount: number;
  currency: string;

  // Conversion timestamp
  converted_at: Date;

  // Status from the network
  status: 'pending' | 'approved' | 'rejected';

  // Customer/order details (for deduplication)
  customer_key?: string;
  order_id?: string;

  // Raw data from the API for debugging
  raw_data?: Record<string, unknown>;
}

export interface SyncResult {
  success: boolean;
  records_synced: number;
  records_skipped: number;
  errors: string[];
  last_cursor?: string;
}

export interface ConnectorConfig {
  api_key?: string;
  api_secret?: string;
  webhook_secret?: string;
  base_url?: string;
  partner_key?: string;
  [key: string]: unknown;
}

export interface ConnectorStatus {
  is_configured: boolean;
  is_enabled: boolean;
  last_sync_at: Date | null;
  last_sync_status: 'success' | 'failed' | null;
  error_message?: string;
}

/**
 * Base interface for all affiliate network connectors
 */
export interface AffiliateConnector {
  /**
   * Unique name of the connector
   */
  readonly name: string;

  /**
   * Display name for the UI
   */
  readonly displayName: string;

  /**
   * Description of the connector
   */
  readonly description: string;

  /**
   * Whether this connector supports webhooks
   */
  readonly supportsWebhooks: boolean;

  /**
   * Initialize the connector with configuration
   */
  initialize(config: ConnectorConfig): Promise<void>;

  /**
   * Test the API connection
   */
  testConnection(): Promise<{ success: boolean; message: string }>;

  /**
   * Fetch conversions from the network
   * @param since Only fetch conversions after this date
   * @param cursor Pagination cursor for large result sets
   */
  fetchConversions(since?: Date, cursor?: string): Promise<{
    conversions: ConversionData[];
    next_cursor?: string;
    has_more: boolean;
  }>;

  /**
   * Process a webhook payload
   */
  processWebhook?(payload: unknown, signature?: string): Promise<ConversionData[]>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature?(payload: string, signature: string): boolean;
}

/**
 * Connector registry type
 */
export type ConnectorRegistry = Map<string, new () => AffiliateConnector>;

/**
 * PartnerStack Connector
 *
 * Connects to the PartnerStack API to fetch conversion/commission data.
 * Used by Jasper AI and other SaaS companies using PartnerStack for their affiliate program.
 *
 * API Documentation: https://docs.partnerstack.com/reference/api-overview
 */

import crypto from 'crypto';
import type {
  AffiliateConnector,
  ConnectorConfig,
  ConversionData,
} from './types';

interface PartnerStackTransaction {
  key: string;
  amount: number;
  currency: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  customer_key?: string;
  partner_key?: string;
  action?: {
    key: string;
    type: string;
  };
  metadata?: {
    sub_id?: string;
    click_id?: string;
    [key: string]: unknown;
  };
}

interface PartnerStackResponse {
  data: PartnerStackTransaction[];
  has_more: boolean;
  next_cursor?: string;
}

export class PartnerStackConnector implements AffiliateConnector {
  readonly name = 'partnerstack';
  readonly displayName = 'PartnerStack';
  readonly description = 'Connect to PartnerStack-powered affiliate programs (Jasper AI, etc.)';
  readonly supportsWebhooks = true;

  private apiKey: string = '';
  private apiSecret: string = '';
  private baseUrl: string = 'https://api.partnerstack.com/api/v2';
  private partnerKey?: string;

  async initialize(config: ConnectorConfig): Promise<void> {
    if (!config.api_key) {
      throw new Error('PartnerStack API key is required');
    }
    if (!config.api_secret) {
      throw new Error('PartnerStack API secret is required');
    }

    this.apiKey = config.api_key;
    this.apiSecret = config.api_secret;
    this.partnerKey = config.partner_key as string | undefined;

    if (config.base_url) {
      this.baseUrl = config.base_url as string;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest('/partnerships', { limit: '1' });

      if (response.ok) {
        return { success: true, message: 'Successfully connected to PartnerStack API' };
      }

      const error = await response.text();
      return { success: false, message: `API error: ${error}` };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async fetchConversions(
    since?: Date,
    cursor?: string
  ): Promise<{
    conversions: ConversionData[];
    next_cursor?: string;
    has_more: boolean;
  }> {
    const params: Record<string, string> = {
      limit: '100',
      expand: 'action,customer',
    };

    if (since) {
      params.min_created = since.toISOString();
    }

    if (cursor) {
      params.starting_after = cursor;
    }

    if (this.partnerKey) {
      params.partner_key = this.partnerKey;
    }

    const response = await this.makeRequest('/transactions', params);

    if (!response.ok) {
      throw new Error(`PartnerStack API error: ${response.status} ${response.statusText}`);
    }

    const data: PartnerStackResponse = await response.json();

    const conversions: ConversionData[] = data.data.map((tx) => ({
      external_id: tx.key,
      click_id: tx.metadata?.click_id || tx.metadata?.sub_id,
      sub_id: tx.metadata?.sub_id,
      partner_key: tx.partner_key,
      amount: tx.amount / 100, // PartnerStack uses cents
      currency: tx.currency.toUpperCase(),
      converted_at: new Date(tx.created_at),
      status: this.mapStatus(tx.status),
      customer_key: tx.customer_key,
      raw_data: tx as unknown as Record<string, unknown>,
    }));

    return {
      conversions,
      next_cursor: data.next_cursor,
      has_more: data.has_more,
    };
  }

  processWebhook(payload: unknown): Promise<ConversionData[]> {
    // PartnerStack webhook payload structure
    const event = payload as {
      event: string;
      data: PartnerStackTransaction;
    };

    if (!event.event || !event.data) {
      throw new Error('Invalid webhook payload');
    }

    // Only process transaction events
    if (!event.event.startsWith('transaction.')) {
      return Promise.resolve([]);
    }

    const tx = event.data;
    const conversion: ConversionData = {
      external_id: tx.key,
      click_id: tx.metadata?.click_id || tx.metadata?.sub_id,
      sub_id: tx.metadata?.sub_id,
      partner_key: tx.partner_key,
      amount: tx.amount / 100,
      currency: tx.currency.toUpperCase(),
      converted_at: new Date(tx.created_at),
      status: this.mapStatus(tx.status),
      customer_key: tx.customer_key,
      raw_data: tx as unknown as Record<string, unknown>,
    };

    return Promise.resolve([conversion]);
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // PartnerStack uses HMAC-SHA256 for webhook signatures
    // The signature is in the X-Partnerstack-Signature header
    if (!this.apiSecret) {
      console.warn('No webhook secret configured, skipping signature verification');
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  private mapStatus(status: string): 'pending' | 'approved' | 'rejected' {
    switch (status) {
      case 'approved':
      case 'paid':
        return 'approved';
      case 'rejected':
        return 'rejected';
      default:
        return 'pending';
    }
  }

  private async makeRequest(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<Response> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    // PartnerStack uses Basic Auth with API key and secret
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

    return fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * FinanceAds Connector
 *
 * Connects to the FinanceAds API to fetch conversion/commission data.
 * FinanceAds specializes in finance verticals (trading, forex, banking).
 *
 * API Documentation: https://www.financeads.net/api-documentation
 */

import crypto from 'crypto';
import type {
  AffiliateConnector,
  ConnectorConfig,
  ConversionData,
} from './types';

interface FinanceAdsTransaction {
  id: string;
  programId: string;
  programName: string;
  subId: string;
  subId2?: string;
  clickDate: string;
  conversionDate: string;
  status: 'open' | 'approved' | 'rejected' | 'paid';
  commission: number;
  currency: string;
  transactionValue?: number;
  country?: string;
  product?: string;
}

interface FinanceAdsResponse {
  success: boolean;
  data: {
    transactions: FinanceAdsTransaction[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export class FinanceAdsConnector implements AffiliateConnector {
  readonly name = 'financeads';
  readonly displayName = 'FinanceAds';
  readonly description = 'Finance-focused affiliate network for trading, forex, and banking offers';
  readonly supportsWebhooks = true;

  private apiKey: string = '';
  private publisherId: string = '';
  private baseUrl: string = 'https://api.financeads.net/v1';
  private webhookSecret: string = '';

  async initialize(config: ConnectorConfig): Promise<void> {
    if (!config.api_key) {
      throw new Error('FinanceAds API key is required');
    }
    if (!config.publisher_id) {
      throw new Error('FinanceAds Publisher ID is required');
    }

    this.apiKey = config.api_key;
    this.publisherId = config.publisher_id as string;
    this.webhookSecret = (config.webhook_secret as string) || '';

    if (config.base_url) {
      this.baseUrl = config.base_url as string;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest('/account/info');

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Connected as Publisher: ${data.data?.name || this.publisherId}`,
        };
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
      per_page: '100',
    };

    // Parse cursor as page number
    const page = cursor ? parseInt(cursor, 10) : 1;
    params.page = page.toString();

    if (since) {
      params.date_from = since.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    // Default to last 30 days if no since date
    if (!since) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      params.date_from = thirtyDaysAgo.toISOString().split('T')[0];
    }

    params.date_to = new Date().toISOString().split('T')[0];

    const response = await this.makeRequest('/transactions', params);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FinanceAds API error: ${response.status} - ${errorText}`);
    }

    const data: FinanceAdsResponse = await response.json();

    if (!data.success) {
      throw new Error(`FinanceAds API error: ${data.error || 'Unknown error'}`);
    }

    const conversions: ConversionData[] = data.data.transactions.map((tx) => ({
      external_id: tx.id,
      click_id: tx.subId, // SubID contains our click_id
      sub_id: tx.subId,
      amount: tx.commission,
      currency: tx.currency.toUpperCase(),
      converted_at: new Date(tx.conversionDate),
      status: this.mapStatus(tx.status),
      order_id: tx.id,
      raw_data: tx as unknown as Record<string, unknown>,
    }));

    const hasMore = page < data.data.pagination.totalPages;

    return {
      conversions,
      next_cursor: hasMore ? (page + 1).toString() : undefined,
      has_more: hasMore,
    };
  }

  async processWebhook(payload: unknown): Promise<ConversionData[]> {
    // FinanceAds webhook payload structure
    const event = payload as {
      type: string;
      transaction: FinanceAdsTransaction;
    };

    if (!event.type || !event.transaction) {
      throw new Error('Invalid webhook payload');
    }

    // Only process transaction events
    if (!event.type.includes('transaction')) {
      return [];
    }

    const tx = event.transaction;
    const conversion: ConversionData = {
      external_id: tx.id,
      click_id: tx.subId,
      sub_id: tx.subId,
      amount: tx.commission,
      currency: tx.currency.toUpperCase(),
      converted_at: new Date(tx.conversionDate),
      status: this.mapStatus(tx.status),
      order_id: tx.id,
      raw_data: tx as unknown as Record<string, unknown>,
    };

    return [conversion];
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('No webhook secret configured, skipping signature verification');
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
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

    return fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        'X-Publisher-ID': this.publisherId,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }
}

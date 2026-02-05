/**
 * Awin Connector
 *
 * Connects to the Awin Publisher API to fetch conversion/commission data.
 * Awin is one of the largest global affiliate networks.
 *
 * API Documentation: https://wiki.awin.com/index.php/Publisher_API
 */

import type {
  AffiliateConnector,
  ConnectorConfig,
  ConversionData,
} from './types';

interface AwinTransaction {
  id: number;
  advertiserId: number;
  advertiserName: string;
  publisherId: number;
  commissionStatus: 'pending' | 'approved' | 'declined' | 'bonus';
  commissionAmount: {
    amount: number;
    currency: string;
  };
  saleAmount: {
    amount: number;
    currency: string;
  };
  clickDate: string;
  transactionDate: string;
  validationDate?: string;
  clickRef?: string; // Contains our SubID/click_id
  orderRef?: string;
  customParameters?: Array<{
    key: string;
    value: string;
  }>;
  transactionParts?: Array<{
    commissionGroupId: number;
    commissionGroupName: string;
    amount: number;
    commissionAmount: number;
  }>;
}

interface AwinResponse {
  transactions?: AwinTransaction[];
  pagination?: {
    page: number;
    pages: number;
    pageSize: number;
    totalRecords: number;
  };
  error?: string;
}

export class AwinConnector implements AffiliateConnector {
  readonly name = 'awin';
  readonly displayName = 'Awin';
  readonly description = 'Global affiliate network with thousands of advertisers';
  readonly supportsWebhooks = false; // Awin uses server-to-server postback instead

  private apiToken: string = '';
  private publisherId: string = '';
  private baseUrl: string = 'https://api.awin.com';

  async initialize(config: ConnectorConfig): Promise<void> {
    if (!config.api_key) {
      throw new Error('Awin API token is required');
    }
    if (!config.publisher_id) {
      throw new Error('Awin Publisher ID is required');
    }

    this.apiToken = config.api_key;
    this.publisherId = config.publisher_id as string;

    if (config.base_url) {
      this.baseUrl = config.base_url as string;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test by fetching account info
      const response = await this.makeRequest(`/publishers/${this.publisherId}/accounts`);

      if (response.ok) {
        return {
          success: true,
          message: `Connected to Awin Publisher ID: ${this.publisherId}`,
        };
      }

      if (response.status === 401) {
        return { success: false, message: 'Invalid API token' };
      }

      if (response.status === 403) {
        return { success: false, message: 'Access denied - check Publisher ID' };
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
    // Parse cursor as page number (1-based)
    const page = cursor ? parseInt(cursor, 10) : 1;

    // Awin requires date range
    const endDate = new Date();
    const startDate = since || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

    const params: Record<string, string> = {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      page: page.toString(),
      pageSize: '100',
      timezone: 'UTC',
    };

    const response = await this.makeRequest(
      `/publishers/${this.publisherId}/transactions/`,
      params
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Awin API error: ${response.status} - ${errorText}`);
    }

    const data: AwinResponse = await response.json();

    if (data.error) {
      throw new Error(`Awin API error: ${data.error}`);
    }

    const transactions = data.transactions || [];
    const conversions: ConversionData[] = transactions.map((tx) => ({
      external_id: tx.id.toString(),
      click_id: tx.clickRef || this.extractClickId(tx.customParameters),
      sub_id: tx.clickRef,
      amount: tx.commissionAmount.amount,
      currency: tx.commissionAmount.currency.toUpperCase(),
      converted_at: new Date(tx.transactionDate),
      status: this.mapStatus(tx.commissionStatus),
      order_id: tx.orderRef,
      raw_data: tx as unknown as Record<string, unknown>,
    }));

    const pagination = data.pagination;
    const hasMore = pagination ? page < pagination.pages : false;

    return {
      conversions,
      next_cursor: hasMore ? (page + 1).toString() : undefined,
      has_more: hasMore,
    };
  }

  // Awin doesn't use webhooks - uses postback URLs instead
  // Postback is configured in Awin dashboard
  async processWebhook(payload: unknown): Promise<ConversionData[]> {
    // Awin postback format (query params converted to object)
    const postback = payload as {
      transactionId?: string;
      commission?: string;
      currency?: string;
      status?: string;
      clickRef?: string;
      orderRef?: string;
      transactionDate?: string;
    };

    if (!postback.transactionId) {
      throw new Error('Invalid postback payload - missing transactionId');
    }

    const conversion: ConversionData = {
      external_id: postback.transactionId,
      click_id: postback.clickRef,
      sub_id: postback.clickRef,
      amount: parseFloat(postback.commission || '0'),
      currency: (postback.currency || 'USD').toUpperCase(),
      converted_at: postback.transactionDate
        ? new Date(postback.transactionDate)
        : new Date(),
      status: this.mapStatus(postback.status || 'pending'),
      order_id: postback.orderRef,
      raw_data: postback as unknown as Record<string, unknown>,
    };

    return [conversion];
  }

  private mapStatus(status: string): 'pending' | 'approved' | 'rejected' {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'bonus':
        return 'approved';
      case 'declined':
        return 'rejected';
      default:
        return 'pending';
    }
  }

  private formatDate(date: Date): string {
    // Awin expects YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  }

  private extractClickId(
    customParams?: Array<{ key: string; value: string }>
  ): string | undefined {
    if (!customParams) return undefined;
    const clickParam = customParams.find(
      (p) => p.key === 'click_id' || p.key === 'subid' || p.key === 'ref'
    );
    return clickParam?.value;
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
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }
}

/**
 * Commission Junction (CJ) Connector
 *
 * Pulls conversions from CJ's Commission Detail API (GraphQL) instead of
 * relying on CJ-side S2S postbacks (which CJ does not expose self-serve).
 *
 * We append our click_id to outbound CJ links as `sid` (see lib/affiliate/tracker.ts),
 * and CJ returns it on each commission as the `sid` field — so we match
 * commission → click → link via sid = click_id, then feed it through the same
 * proven pipeline (sync-service.saveConversion → conversions + conversion_events).
 *
 * API: POST https://commissions.api.cj.com/query   (Bearer Personal Access Token)
 * Docs: https://developers.cj.com/graphql/reference/Commission%20Detail
 */

import type {
  AffiliateConnector,
  ConnectorConfig,
  ConversionData,
} from './types';

interface CjCommissionRecord {
  commissionId: string;
  sid: string | null;
  actionStatus: string | null;
  actionType: string | null;
  eventDate: string | null;
  postingDate: string | null;
  orderId: string | null;
  currency: string | null;
  pubCommissionAmountUsd: number | string | null;
  advertiserName: string | null;
}

interface CjGraphQLResponse {
  data?: {
    publisherCommissions?: {
      count: number;
      payloadComplete: boolean;
      records: CjCommissionRecord[];
    };
  };
  errors?: Array<{ message: string }>;
}

export class CjConnector implements AffiliateConnector {
  readonly name = 'cj';
  readonly displayName = 'Commission Junction';
  readonly description = 'CJ Affiliate — pulls commissions via the Commission Detail GraphQL API';
  readonly supportsWebhooks = false; // CJ publisher S2S postbacks are not self-serve; we pull.

  private apiToken = '';
  private publisherId = '';
  private endpoint = 'https://commissions.api.cj.com/query';

  async initialize(config: ConnectorConfig): Promise<void> {
    // Token lives in env (CJ_API_TOKEN via GitHub Secrets → .env.local), never in the DB.
    this.apiToken = (config.api_key as string) || process.env.CJ_API_TOKEN || '';
    this.publisherId =
      (config.publisher_id as string) || process.env.CJ_PUBLISHER_ID || '7906274';

    if (!this.apiToken) {
      throw new Error('CJ_API_TOKEN is required (set as env/GitHub Secret)');
    }
    if (config.base_url) {
      this.endpoint = config.base_url as string;
    }
  }

  /** ISO-8601 with trailing Z and no milliseconds (CJ format). */
  private fmt(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  private async runQuery(query: string): Promise<CjGraphQLResponse> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error(`CJ API auth failed (${res.status}) — check CJ_API_TOKEN`);
    }
    if (!res.ok) {
      throw new Error(`CJ API error: ${res.status} ${await res.text()}`);
    }

    const json = (await res.json()) as CjGraphQLResponse;
    if (json.errors?.length) {
      throw new Error(`CJ GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`);
    }
    return json;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date();
      const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const query = `{ publisherCommissions(forPublishers: ["${this.publisherId}"], sinceEventDate: "${this.fmt(since)}", beforeEventDate: "${this.fmt(now)}") { count } }`;
      const json = await this.runQuery(query);
      const count = json.data?.publisherCommissions?.count ?? 0;
      return { success: true, message: `Connected to CJ publisher ${this.publisherId} (${count} commissions in last 24h)` };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async fetchConversions(
    since?: Date,
  ): Promise<{ conversions: ConversionData[]; next_cursor?: string; has_more: boolean }> {
    const now = new Date();
    // CJ caps the window; default to 31 days back if no cursor/since.
    const start = since || new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

    const query = `{
      publisherCommissions(forPublishers: ["${this.publisherId}"], sinceEventDate: "${this.fmt(start)}", beforeEventDate: "${this.fmt(now)}") {
        count
        payloadComplete
        records {
          commissionId
          sid
          actionStatus
          actionType
          eventDate
          postingDate
          orderId
          currency
          pubCommissionAmountUsd
          advertiserName
        }
      }
    }`;

    const json = await this.runQuery(query);
    const payload = json.data?.publisherCommissions;
    const records = payload?.records ?? [];

    const conversions: ConversionData[] = records.map((r) =>
      CjConnector.toConversion(r),
    );

    // Low volume → single page. If CJ truncated (payloadComplete=false), we still
    // return what we got; the next scheduled run (advancing `since`) catches the rest.
    return { conversions, has_more: false };
  }

  /** Map a CJ commission record to our normalized ConversionData. */
  static toConversion(r: CjCommissionRecord): ConversionData {
    const amount = Number(r.pubCommissionAmountUsd ?? 0) || 0;
    return {
      external_id: r.commissionId,
      click_id: r.sid || undefined,
      sub_id: r.sid || undefined,
      amount, // USD (pubCommissionAmountUsd) → avoids FX conversion drift
      currency: 'USD',
      converted_at: r.eventDate ? new Date(r.eventDate) : new Date(),
      status: CjConnector.mapStatus(r.actionStatus, amount),
      order_id: r.orderId || undefined,
      raw_data: r as unknown as Record<string, unknown>,
    };
  }

  /** Map CJ actionStatus → our pending/approved/rejected. */
  static mapStatus(actionStatus: string | null, amount: number): 'pending' | 'approved' | 'rejected' {
    const s = (actionStatus || '').toLowerCase();
    if (amount < 0 || s === 'corrected') return 'rejected'; // reversals / corrections
    if (s === 'closed' || s === 'locked') return 'approved'; // validated / finalized
    return 'pending'; // new, extended, etc.
  }
}

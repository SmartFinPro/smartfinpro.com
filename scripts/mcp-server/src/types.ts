// Shared types across tools. Schema-aligned with live DB columns
// (probed 2026-04-20 via information_schema.columns).

export interface AffiliateLink {
  id: string;
  slug: string;
  partner_name: string;
  destination_url: string;
  category: string | null;
  market: string | null;
  commission_type: string | null;
  commission_value: number | null;
  active: boolean | null;
  created_at: string | null;
  health_status: string | null;
  last_health_check: string | null;
}

export interface OrphanSlug {
  slug: string;
  ref_count: number;
  example_files: string[];
}

export interface RevenueByMarket {
  market: string;
  revenue: number;
  clicks: number;
}

export interface TopProduct {
  partner_name: string;
  revenue: number;
  conversions: number;
}

export interface FunnelStage {
  event_type: string;
  count: number;
  rate_vs_prev_stage: number;
}

export interface ContentHealthPage {
  slug: string;
  market: string;
  category: string | null;
  health_score: number | null;
  monthly_revenue: number | null;
  monthly_clicks: number | null;
  epc: number | null;
  computed_at: string | null;
}

export interface SchemaDriftEntry {
  table: string;
  column: string;
  declared_in_schema_sql: boolean;
  exists_in_live_db: boolean;
  issue: 'missing_in_db' | 'missing_in_schema_sql' | 'type_mismatch';
  schema_sql_type?: string;
  live_db_type?: string;
}

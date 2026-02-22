// ============================================================
// SmartFinPro Database Types
// Auto-generated from Supabase schema
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================
// Database Schema Types
// ============================================================

export interface Database {
  public: {
    Tables: {
      affiliate_links: {
        Row: {
          id: string;
          slug: string;
          partner_name: string;
          destination_url: string;
          category: Category | null;
          market: Market | null;
          commission_type: CommissionType | null;
          commission_value: number | null;
          commission_currency: string;
          cookie_days: number;
          network: string | null;
          network_link_id: string | null;
          description: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['affiliate_links']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['affiliate_links']['Row']>;
      };

      link_clicks: {
        Row: {
          id: string;
          link_id: string | null;
          session_id: string | null;
          clicked_at: string;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          country_code: string;
          region: string | null;
          city: string | null;
          device_type: DeviceType | null;
          browser: string | null;
          os: string | null;
          referrer: string | null;
          referrer_domain: string | null;
          landing_page: string | null;
          user_agent: string | null;
          ip_hash: string | null;
          page_slug: string | null;
          button_id: string | null;
        };
        Insert: Partial<Database['public']['Tables']['link_clicks']['Row']>;
        Update: Partial<Database['public']['Tables']['link_clicks']['Row']>;
      };

      conversions: {
        Row: {
          id: string;
          link_id: string | null;
          click_id: string | null;
          converted_at: string;
          commission_earned: number;
          currency: string;
          network: string | null;
          network_reference: string | null;
          network_status: string | null;
          status: ConversionStatus;
          approved_at: string | null;
          product_name: string | null;
          transaction_value: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['conversions']['Row']> & {
          commission_earned: number;
        };
        Update: Partial<Database['public']['Tables']['conversions']['Row']>;
      };

      subscribers: {
        Row: {
          id: string;
          email: string;
          lead_magnet: string | null;
          source: string | null;
          market: Market;
          status: SubscriberStatus;
          subscribed_at: string;
          confirmed_at: string | null;
          unsubscribed_at: string | null;
          preferences: Json;
          tags: string[];
          ip_address: string | null;
          user_agent: string | null;
          referrer: string | null;
          email_provider_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['subscribers']['Row']> & {
          email: string;
        };
        Update: Partial<Database['public']['Tables']['subscribers']['Row']>;
      };

      leads: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          company: string | null;
          phone: string | null;
          source: string;
          source_url: string | null;
          campaign: string | null;
          market: Market;
          interest_category: string | null;
          budget_range: string | null;
          timeline: string | null;
          status: LeadStatus;
          score: number;
          notes: string | null;
          custom_fields: Json;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          ip_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['leads']['Row']> & {
          email: string;
          source: string;
        };
        Update: Partial<Database['public']['Tables']['leads']['Row']>;
      };

      page_views: {
        Row: {
          id: string;
          session_id: string;
          page_path: string;
          page_title: string | null;
          market: string | null;
          category: string | null;
          article_slug: string | null;
          viewed_at: string;
          time_on_page: number | null;
          scroll_depth: number | null;
          referrer: string | null;
          referrer_domain: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          device_type: string | null;
          browser: string | null;
          os: string | null;
          screen_width: number | null;
          screen_height: number | null;
          country_code: string | null;
          region: string | null;
          city: string | null;
          user_agent: string | null;
          ip_hash: string | null;
        };
        Insert: Partial<Database['public']['Tables']['page_views']['Row']> & {
          session_id: string;
          page_path: string;
        };
        Update: Partial<Database['public']['Tables']['page_views']['Row']>;
      };

      analytics_events: {
        Row: {
          id: string;
          session_id: string;
          event_name: string;
          event_category: string | null;
          event_action: string | null;
          event_label: string | null;
          event_value: number | null;
          page_path: string | null;
          element_id: string | null;
          element_class: string | null;
          element_text: string | null;
          properties: Json;
          occurred_at: string;
          device_type: string | null;
          country_code: string | null;
        };
        Insert: Partial<Database['public']['Tables']['analytics_events']['Row']> & {
          session_id: string;
          event_name: string;
        };
        Update: Partial<Database['public']['Tables']['analytics_events']['Row']>;
      };

      admin_users: {
        Row: {
          id: string;
          email: string;
          role: AdminRole;
          permissions: Json;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: AdminRole;
          permissions?: Json;
        };
        Update: Partial<Database['public']['Tables']['admin_users']['Row']>;
      };

      settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
        };
        Update: Partial<Database['public']['Tables']['settings']['Row']>;
      };

      api_sync_logs: {
        Row: {
          id: string;
          network: string;
          sync_type: string;
          status: SyncStatus;
          records_processed: number;
          records_created: number;
          records_updated: number;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
          metadata: Json;
        };
        Insert: {
          network: string;
          sync_type: string;
          status: SyncStatus;
        };
        Update: Partial<Database['public']['Tables']['api_sync_logs']['Row']>;
      };

      cta_analytics: {
        Row: {
          id: string;
          clicked_at: string;
          slug: string;
          market: Market;
          provider: string;
          variant: CtaVariant;
          session_id: string | null;
          device_type: DeviceType | null;
          ip_hash: string | null;
        };
        Insert: Partial<Database['public']['Tables']['cta_analytics']['Row']> & {
          slug: string;
          provider: string;
          variant: CtaVariant;
        };
        Update: Partial<Database['public']['Tables']['cta_analytics']['Row']>;
      };

      experts: {
        Row: {
          id: string;
          market_slug: Market;
          category: Category | null;
          name: string;
          role: string;
          bio: string | null;
          image_url: string | null;
          credentials: string[];
          linkedin_url: string | null;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['experts']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['experts']['Row']>;
      };

      partner_metadata: {
        Row: {
          id: string;
          provider_name: string;
          market: Market | null;
          category: Category;
          winner_badge: string | null;
          winner_badge_type: 'editorial' | 'auto' | null;
          is_featured: boolean;
          featured_headline: string | null;
          featured_offer: string | null;
          featured_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['partner_metadata']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['partner_metadata']['Row']>;
      };
    };

    Views: {
      daily_click_stats: {
        Row: {
          date: string;
          link_id: string;
          clicks: number;
          unique_sessions: number;
          unique_countries: number;
          mobile_clicks: number;
          desktop_clicks: number;
        };
      };
      monthly_revenue: {
        Row: {
          month: string;
          total_revenue: number;
          total_conversions: number;
          approved_conversions: number;
          pending_conversions: number;
          currency: string;
        };
      };
      link_performance: {
        Row: {
          id: string;
          slug: string;
          partner_name: string;
          category: string;
          market: string;
          commission_type: string;
          commission_value: number;
          total_clicks: number;
          unique_clicks: number;
          total_conversions: number;
          approved_revenue: number;
          total_revenue: number;
          conversion_rate: number;
          last_click: string;
          last_conversion: string;
        };
      };
      geographic_stats: {
        Row: {
          country_code: string;
          total_clicks: number;
          unique_sessions: number;
          first_click: string;
          last_click: string;
        };
      };
    };

    Functions: {
      get_dashboard_stats: {
        Args: { days_back?: number };
        Returns: Json;
      };
      get_provider_click_counts: {
        Args: { p_category: string; p_market?: string; p_days_back?: number };
        Returns: { provider_name: string; click_count: number }[];
      };
    };

    Enums: Record<string, never>;
  };
}

// Enum Types
export type Category = 'ai-tools' | 'cybersecurity' | 'trading' | 'forex' | 'personal-finance' | 'business-banking' | 'credit-repair' | 'debt-relief' | 'credit-score' | 'remortgaging' | 'cost-of-living' | 'savings' | 'superannuation' | 'gold-investing' | 'tax-efficient-investing' | 'housing';
export type Market = 'us' | 'uk' | 'ca' | 'au';
export type CommissionType = 'cpa' | 'recurring' | 'hybrid' | 'revenue-share';
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';
export type ConversionStatus = 'pending' | 'approved' | 'rejected' | 'reversed';
export type SubscriberStatus = 'pending' | 'confirmed' | 'unsubscribed' | 'bounced' | 'complained';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type AdminRole = 'admin' | 'editor' | 'viewer';
export type SyncStatus = 'started' | 'completed' | 'failed';
export type CtaVariant = 'emerald-shimmer' | 'violet-pill' | 'primary' | 'secondary';

// Helper Types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];

// Convenience aliases
export type AffiliateLink = Tables<'affiliate_links'>;
export type LinkClick = Tables<'link_clicks'>;
export type Conversion = Tables<'conversions'>;
export type Subscriber = Tables<'subscribers'>;
export type Lead = Tables<'leads'>;
export type PageView = Tables<'page_views'>;
export type AnalyticsEvent = Tables<'analytics_events'>;
export type AdminUser = Tables<'admin_users'>;
export type Setting = Tables<'settings'>;
export type ApiSyncLog = Tables<'api_sync_logs'>;
export type CtaAnalytics = Tables<'cta_analytics'>;
export type Expert = Tables<'experts'>;
export type PartnerMetadata = Tables<'partner_metadata'>;

// Dashboard stats type
export interface DashboardStats {
  total_clicks: number;
  unique_sessions: number;
  total_conversions: number;
  total_revenue: number;
  pending_revenue: number;
  new_subscribers: number;
  conversion_rate: number;
  active_links: number;
}

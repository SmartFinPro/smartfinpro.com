// lib/types/backlink.ts — TypeScript interfaces for backlink data

export interface Backlink {
  id: string;
  target_url: string;
  source_url: string;
  source_domain: string;
  anchor_text: string;
  link_type: 'external' | 'internal';
  rel_attributes: string;
  first_seen_at: string;
  last_seen_at: string;
  is_lost: boolean;
  import_source: 'gsc_csv' | 'internal_scan' | 'manual';
  import_batch_id: string | null;
}

export interface BacklinkCounts {
  active: number;
  new30d: number;
}

export interface BacklinkImportResult {
  success: boolean;
  imported: number;
  updated: number;
  lost: number;
  errors: string[];
}

/** Column mapping for CSV import — maps CSV header names to our fields */
export interface BacklinkCsvMapping {
  target_url: string;    // CSV column name for target page
  source_url: string;    // CSV column name for linking page URL
  source_domain: string; // CSV column name for linking site domain
  anchor_text?: string;  // CSV column name for anchor text (optional)
}

/** Known GSC CSV column names (EN + DE) */
export const GSC_COLUMN_NAMES: Record<string, keyof BacklinkCsvMapping> = {
  // English
  'Target page': 'target_url',
  'target page': 'target_url',
  'Linking pages': 'source_url',
  'linking pages': 'source_url',
  'Linking sites': 'source_domain',
  'linking sites': 'source_domain',
  'Anchor text': 'anchor_text',
  'anchor text': 'anchor_text',
  // German
  'Zielseite': 'target_url',
  'zielseite': 'target_url',
  'Verlinkende Seiten': 'source_url',
  'verlinkende seiten': 'source_url',
  'Verlinkende Websites': 'source_domain',
  'verlinkende websites': 'source_domain',
  'Ankertext': 'anchor_text',
  'ankertext': 'anchor_text',
};

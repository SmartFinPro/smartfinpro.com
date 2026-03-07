// lib/types/page-cta.ts — Shared types & constants for CTA partner placement system
// NO 'use server' directive — safe to import from both server actions and 'use client' components

// ── Placement (WHERE on page) ───────────────────────────────────

export type Placement = 1 | 2 | 3;

export const PLACEMENT_OPTIONS = [
  { value: 1 as Placement, label: 'O', fullLabel: 'Oben → Sticky Nav Bar (beim Scrollen sichtbar)' },
  { value: 2 as Placement, label: 'M', fullLabel: 'Mitte (nach MDX Content)' },
  { value: 3 as Placement, label: 'U', fullLabel: 'Unten (nach FAQ Section)' },
] as const;

// ── Display Type (HOW it renders) ───────────────────────────────

export type DisplayType = 'table' | 'mini_quiz' | 'single';

export const DISPLAY_TYPE_OPTIONS = [
  { value: 'table' as DisplayType, label: 'Tab', fullLabel: 'Tabellenübersicht' },
  { value: 'mini_quiz' as DisplayType, label: 'MQ', fullLabel: 'MiniQuiz' },
  { value: 'single' as DisplayType, label: 'E', fullLabel: 'Einzelanzeige' },
] as const;

// ── Partner Assignment Config ───────────────────────────────────

export interface PartnerAssignmentConfig {
  id: string;                 // affiliate_link_id (UUID)
  placements: Placement[];    // [1], [1,3], [1,2,3], etc.
  display_type: DisplayType;  // 'table' | 'mini_quiz' | 'single'
}

// ── Enriched Partner (joined with affiliate_links for frontend) ─

export interface EnrichedCtaPartner {
  affiliate_link_id: string;
  placements: Placement[];
  display_type: DisplayType;
  position: number;
  partner_name: string;
  slug: string;             // for /go/[slug] URL
  category: string;
  market: string;
}

// ── Defaults ────────────────────────────────────────────────────

export const DEFAULT_PLACEMENTS: Placement[] = [1, 2, 3];
export const DEFAULT_DISPLAY_TYPE: DisplayType = 'single';

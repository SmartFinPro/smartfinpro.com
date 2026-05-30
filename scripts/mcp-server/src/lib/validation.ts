// Zod schemas + allowlists matching live DB CHECK constraints.
//
// SOURCE OF TRUTH: supabase/schema.sql:16-30
// Do NOT pull categories from lib/i18n/config.ts — that has 16 site categories
// but the DB CHECK constraint is only 9 values. Mismatch would cause DB errors.

import { z } from 'zod';

// ── DB-CHECK matched enums ────────────────────────────────────────────────

export const MARKETS = ['us', 'uk', 'ca', 'au'] as const;
export const MarketSchema = z.enum(MARKETS);
export type Market = (typeof MARKETS)[number];

export const CATEGORIES = [
  'ai-tools',
  'cybersecurity',
  'trading',
  'forex',
  'personal-finance',
  'business-banking',
  'credit-repair',
  'credit-score',
  'gold-investing',
] as const;
export const CategorySchema = z.enum(CATEGORIES);
export type Category = (typeof CATEGORIES)[number];

export const COMMISSION_TYPES = ['cpa', 'recurring', 'hybrid', 'revenue-share'] as const;
export const CommissionTypeSchema = z.enum(COMMISSION_TYPES);
export type CommissionType = (typeof COMMISSION_TYPES)[number];

// ── Destination host allowlist ─────────────────────────────────────────────
//
// Subset of ALLOWED_HOSTS in app/(marketing)/go/[slug]/route.ts:47.
// Copied, not imported, to decouple build lifecycles. Kept in sync manually;
// add new partner hosts here AND in the route.ts allowlist before activating.

export const ALLOWED_DESTINATION_HOSTS = new Set<string>([
  // Banking / business
  'wise.com', 'www.wise.com',
  'mercury.com', 'www.mercury.com',
  'relayfi.com', 'www.relayfi.com',
  'relay.com', 'www.relay.com',
  'revolut.com', 'www.revolut.com',
  'tide.co', 'www.tide.co',
  'starlingbank.com', 'www.starlingbank.com',
  'novo.co', 'www.novo.co',

  // Trading / forex
  'interactivebrokers.com', 'www.interactivebrokers.com',
  'ibkr.com', 'www.ibkr.com',
  'ig.com', 'www.ig.com',
  'plus500.com', 'www.plus500.com',
  'oanda.com', 'www.oanda.com',
  'icmarkets.com', 'www.icmarkets.com',
  'cmcmarkets.com', 'www.cmcmarkets.com',
  'pepperstone.com', 'www.pepperstone.com',
  'capital.com', 'www.capital.com',
  'etoro.com', 'www.etoro.com', 'go.etoro.com', 'partners.etoro.com',
  'trading212.com', 'www.trading212.com',
  'tdameritrade.com', 'www.tdameritrade.com',

  // Personal finance
  'sofi.com', 'www.sofi.com',
  'wealthfront.com', 'www.wealthfront.com',
  'wealthsimple.com', 'www.wealthsimple.com',
  'questrade.com', 'www.questrade.com',
  'nutmeg.com', 'www.nutmeg.com',
  'vanguardinvestor.co.uk', 'www.vanguardinvestor.co.uk',
  'hl.co.uk', 'www.hl.co.uk', 'hargreaveslandsdwon.co.uk', 'www.hargreaveslansdwon.co.uk',
  'ajbell.co.uk', 'www.ajbell.co.uk',
  'fidelity.co.uk', 'www.fidelity.co.uk',
  'marcus.co.uk', 'www.marcus.co.uk',
  'zopa.com', 'www.zopa.com',

  // Cybersecurity / AI
  'nordvpn.com', 'www.nordvpn.com',
  'crowdstrike.com', 'www.crowdstrike.com',
  'perimeter81.com', 'www.perimeter81.com',
  'proofpoint.com', 'www.proofpoint.com',
  '1password.com', 'www.1password.com',

  // Credit / debt
  'nationaldebtrelief.com', 'www.nationaldebtrelief.com',
  'lexingtonlaw.com', 'www.lexingtonlaw.com',
  'thecreditpeople.com', 'www.thecreditpeople.com',

  // Networks (for tracking URLs)
  'awin1.com', 'www.awin1.com',
  'commission-junction.com',
  'jdoqocy.com', 'www.jdoqocy.com',
  'dpbolvw.net', 'www.dpbolvw.net',
  'tkqlhce.com', 'www.tkqlhce.com',
  'impact.com', 'www.impact.com',
  'shareasale.com', 'www.shareasale.com',
  'partnerize.com', 'www.partnerize.com',
  'tradedoubler.com', 'www.tradedoubler.com',
  'financeads.net', 'www.financeads.net',

  // Other
  'habito.com', 'www.habito.com',
  'perthmint.com', 'www.perthmint.com',
]);

/**
 * Validates a destination URL against the host allowlist.
 * Returns parsed URL + error (one of: null, 'invalid_url', 'non_https', 'host_not_allowed').
 */
export function validateDestinationUrl(raw: string): {
  url: URL | null;
  error: null | 'invalid_url' | 'non_https' | 'host_not_allowed';
} {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { url: null, error: 'invalid_url' };
  }
  if (url.protocol !== 'https:') {
    return { url, error: 'non_https' };
  }
  if (!ALLOWED_DESTINATION_HOSTS.has(url.hostname)) {
    return { url, error: 'host_not_allowed' };
  }
  return { url, error: null };
}

// ── Tool input schemas ─────────────────────────────────────────────────────

export const GetOrphanSlugsInput = z.object({}).strict();

export const ListAffiliateLinksInput = z
  .object({
    market: MarketSchema.optional(),
    category: CategorySchema.optional(),
    active: z.boolean().optional(),
    limit: z.number().int().min(1).max(500).default(100),
    offset: z.number().int().min(0).default(0),
  })
  .strict();

export const GetRevenueStatsInput = z
  .object({
    days: z.number().int().min(1).max(365).default(30),
    market: MarketSchema.optional(),
    partner_name: z.string().min(1).max(255).optional(),
  })
  .strict();

export const GetConversionFunnelInput = z
  .object({
    slug: z.string().min(1).max(100).optional(),
    market: MarketSchema.optional(),
    partner_name: z.string().min(1).max(255).optional(),
    days: z.number().int().min(1).max(365).default(30),
  })
  .strict();

export const GetContentHealthInput = z
  .object({
    market: MarketSchema.optional(),
    category: z.string().min(1).max(50).optional(),
    min_score: z.number().min(0).max(1).optional(),
    max_score: z.number().min(0).max(1).optional(),
    limit: z.number().int().min(1).max(500).default(50),
  })
  .strict();

export const DetectSchemaDriftInput = z
  .object({
    tables: z.array(z.string()).optional(),
  })
  .strict();

export const ActivateAffiliateSlugInput = z
  .object({
    slug: z.string().regex(/^[a-z][a-z0-9-]{2,60}$/, {
      message: 'slug must be lowercase, start with a letter, 3-61 chars, only a-z/0-9/dash',
    }),
    partner_name: z.string().min(2).max(100),
    destination_url: z.string().url().startsWith('https://'),
    market: MarketSchema,
    category: CategorySchema,
    commission_type: CommissionTypeSchema.default('cpa'),
    commission_value: z.number().min(0).max(5000).default(0),
    force: z.boolean().default(false),
  })
  .strict();

// ── Helper to convert Zod errors into VALIDATION: prefix ───────────────────

export function formatZodError(err: z.ZodError): string {
  const first = err.issues[0];
  const path = first.path.length ? first.path.join('.') : '(root)';
  return `VALIDATION: ${path}: ${first.message}`;
}

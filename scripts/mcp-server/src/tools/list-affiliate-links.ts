// Tool: list_affiliate_links (read-only)
// Filter affiliate_links rows by market, category, active status.
//
// Input  (Zod): ListAffiliateLinksInput
// Output: { links: AffiliateLink[], total: number, filters_applied: object }

import { getServiceClient } from '../lib/supabase.js';
import { withAudit } from '../lib/audit.js';
import { ListAffiliateLinksInput, formatZodError } from '../lib/validation.js';
import type { AffiliateLink } from '../types.js';

export const TOOL_NAME = 'list_affiliate_links';

export const TOOL_DESCRIPTION =
  'List rows from the affiliate_links table with optional filters (market, category, active). ' +
  'Returns a paged result. Read-only.';

export const TOOL_INPUT_SCHEMA = ListAffiliateLinksInput;

interface Result {
  links: AffiliateLink[];
  total: number;
  filters_applied: {
    market?: string;
    category?: string;
    active?: boolean;
    limit: number;
    offset: number;
  };
}

export const handle = withAudit(
  TOOL_NAME,
  async (rawArgs: unknown): Promise<Result> => {
    const parsed = ListAffiliateLinksInput.safeParse(rawArgs);
    if (!parsed.success) throw new Error(formatZodError(parsed.error));
    const args = parsed.data;

    const supabase = getServiceClient();
    let q = supabase
      .from('affiliate_links')
      .select(
        'id, slug, partner_name, destination_url, category, market, ' +
          'commission_type, commission_value, active, created_at, ' +
          'health_status, last_health_check',
        { count: 'exact' },
      )
      .order('slug', { ascending: true })
      .range(args.offset, args.offset + args.limit - 1);

    if (args.market) q = q.eq('market', args.market);
    if (args.category) q = q.eq('category', args.category);
    if (typeof args.active === 'boolean') q = q.eq('active', args.active);

    const { data, error, count } = await q;
    if (error) throw new Error(`supabase: ${error.message}`);

    return {
      links: (data ?? []) as unknown as AffiliateLink[],
      total: count ?? 0,
      filters_applied: {
        ...(args.market && { market: args.market }),
        ...(args.category && { category: args.category }),
        ...(typeof args.active === 'boolean' && { active: args.active }),
        limit: args.limit,
        offset: args.offset,
      },
    };
  },
);

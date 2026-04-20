// Tool: activate_affiliate_slug (WRITE — ask-gated via .claude/settings.local.json)
//
// Upsert a row in affiliate_links. Idempotent via ON CONFLICT DO UPDATE
// (Supabase upsert). Host-change-guard: if slug exists with a different
// host, returns a warning and requires force=true on the second call.

import { getServiceClient } from '../lib/supabase.js';
import { withAudit } from '../lib/audit.js';
import {
  ActivateAffiliateSlugInput,
  formatZodError,
  validateDestinationUrl,
} from '../lib/validation.js';
import type { AffiliateLink } from '../types.js';

export const TOOL_NAME = 'activate_affiliate_slug';

export const TOOL_DESCRIPTION =
  'Upsert an affiliate_links row (INSERT ON CONFLICT DO UPDATE). Idempotent. ' +
  'Requires market/category from DB-CHECK allowlist and destination_url host in a ' +
  'hardcoded allowlist. If slug exists with a different host, returns host_change warning; ' +
  'pass force=true on second call to override. Write-only tool; configure ' +
  '.claude/settings.local.json to gate each call with an ask-prompt.';

export const TOOL_INPUT_SCHEMA = ActivateAffiliateSlugInput;

type Result =
  | {
      success: true;
      row: AffiliateLink;
      was_new: boolean;
      warning?: undefined;
    }
  | {
      success: false;
      warning: 'host_change_requires_force';
      current_host: string;
      new_host: string;
      requires_explicit_force: true;
    };

export const handle = withAudit(
  TOOL_NAME,
  async (rawArgs: unknown): Promise<Result> => {
    const parsed = ActivateAffiliateSlugInput.safeParse(rawArgs);
    if (!parsed.success) throw new Error(formatZodError(parsed.error));
    const args = parsed.data;

    // Destination URL validation (beyond Zod — host allowlist)
    const urlCheck = validateDestinationUrl(args.destination_url);
    if (urlCheck.error === 'invalid_url') {
      throw new Error(`VALIDATION: destination_url: not a valid URL`);
    }
    if (urlCheck.error === 'non_https') {
      throw new Error(`VALIDATION: destination_url: must use https://`);
    }
    if (urlCheck.error === 'host_not_allowed' || !urlCheck.url) {
      throw new Error(
        `VALIDATION: destination_url: host "${urlCheck.url?.hostname ?? ''}" not in ALLOWED_DESTINATION_HOSTS. ` +
          'Add the host to validation.ts AND app/(marketing)/go/[slug]/route.ts ALLOWED_HOSTS, then retry.',
      );
    }
    const newHost = urlCheck.url.hostname;

    const supabase = getServiceClient();

    // ── Host-change-guard ───────────────────────────────────────────────
    const { data: existing, error: existErr } = await supabase
      .from('affiliate_links')
      .select('id, slug, destination_url')
      .eq('slug', args.slug)
      .maybeSingle();
    if (existErr) throw new Error(`supabase select: ${existErr.message}`);

    let wasNew = true;
    if (existing) {
      wasNew = false;
      try {
        const currentHost = new URL((existing as { destination_url: string }).destination_url).hostname;
        if (currentHost !== newHost && !args.force) {
          return {
            success: false,
            warning: 'host_change_requires_force',
            current_host: currentHost,
            new_host: newHost,
            requires_explicit_force: true,
          };
        }
      } catch {
        // If current URL is malformed, treat as host-change to force review
        if (!args.force) {
          return {
            success: false,
            warning: 'host_change_requires_force',
            current_host: '(unparseable)',
            new_host: newHost,
            requires_explicit_force: true,
          };
        }
      }
    }

    // ── Upsert ──────────────────────────────────────────────────────────
    const { data: upserted, error: upErr } = await supabase
      .from('affiliate_links')
      .upsert(
        {
          slug: args.slug,
          partner_name: args.partner_name,
          destination_url: args.destination_url,
          market: args.market,
          category: args.category,
          commission_type: args.commission_type,
          commission_value: args.commission_value,
          active: true,
        },
        { onConflict: 'slug' },
      )
      .select(
        'id, slug, partner_name, destination_url, category, market, ' +
          'commission_type, commission_value, active, created_at, ' +
          'health_status, last_health_check',
      )
      .single();

    if (upErr) throw new Error(`supabase upsert: ${upErr.message}`);

    return {
      success: true,
      row: upserted as unknown as AffiliateLink,
      was_new: wasNew,
    };
  },
);

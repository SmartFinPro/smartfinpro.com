// app/api/autonomous/undo/route.ts
import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import { sendAutonomousNotification } from '@/lib/actions/autonomous-notify';

export const dynamic = 'force-dynamic';

/**
 * Undo API — POST-only, SHA-256 hashed one-time token
 *
 * Security:
 *   - POST (not GET — state changes must not be idempotent via GET)
 *   - Token hashed with SHA-256 (never stored as plaintext)
 *   - One-time use: undone_at IS NULL check
 *   - Expiry: undo_expires_at must be in the future
 *   - Replay protection: undo_token_hash is UNIQUE
 *
 * Body: { "token": "raw-undo-token-uuid" }
 */
export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    const body = await request.json();
    const token = body?.token;

    if (!token || typeof token !== 'string') {
      return Response.json(
        { ok: false, error: 'Token required' },
        { status: 400 },
      );
    }

    // Hash the token for lookup
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const supabase = createServiceClient();
    const claimedAt = new Date().toISOString();

    // ── ATOMIC CLAIM: race-safe one-time token consumption ──
    // Conditional UPDATE wins exactly once per token. Concurrent requests
    // with the same token cannot both observe `undone_at IS NULL`.
    const { data: action, error: claimErr } = await supabase
      .from('autonomous_actions')
      .update({ undone_at: claimedAt })
      .eq('undo_token_hash', tokenHash)
      .is('undone_at', null)
      .gt('undo_expires_at', claimedAt)
      .select()
      .single();

    if (claimErr || !action) {
      logger.warn('[undo] Invalid token attempt (race-safe claim failed)', {
        tokenPrefix: tokenHash.substring(0, 8),
        error: claimErr?.message,
      });
      return Response.json(
        { ok: false, error: 'Invalid, expired, or already used token' },
        { status: 404 },
      );
    }

    // ── Apply rollback (token is already claimed — at-most-once semantics) ──
    const rollbackResult = await applyRollback(action, supabase);

    if (!rollbackResult.success) {
      logger.error('[undo] Rollback failed AFTER token consumption', {
        actionId: action.id,
        error: rollbackResult.error,
      });
      // Token is consumed but rollback failed. Mark outcome as error so
      // ops can manually resolve. Do NOT re-open the token — that would
      // allow double-rollback on retry.
      await supabase
        .from('autonomous_actions')
        .update({
          outcome: 'negative',
          outcome_metrics: {
            undone: true,
            undo_reason: 'manual_undo',
            rollback_result: `FAILED: ${rollbackResult.error}`,
            undone_at: claimedAt,
            requires_manual_intervention: true,
          },
          measured_at: claimedAt,
        })
        .eq('id', action.id);
      return Response.json(
        { ok: false, error: `Rollback failed: ${rollbackResult.error}` },
        { status: 500 },
      );
    }

    // ── Finalize outcome metadata (token already consumed by atomic claim) ──
    const { error: updateErr } = await supabase
      .from('autonomous_actions')
      .update({
        outcome: 'negative', // Mark as negative since it needed to be undone
        outcome_metrics: {
          undone: true,
          undo_reason: 'manual_undo',
          rollback_result: rollbackResult.detail,
          undone_at: claimedAt,
        },
        measured_at: claimedAt,
      })
      .eq('id', action.id);

    if (updateErr) {
      logger.error('[undo] Failed to finalize outcome metadata', { error: updateErr.message });
    }

    // Dismiss the linked insight
    if (action.insight_id) {
      await supabase
        .from('insights')
        .update({
          status: 'dismissed',
          execution_result: {
            undone: true,
            undone_at: new Date().toISOString(),
          },
        })
        .eq('id', action.insight_id);
    }

    // ── Notify via Email ──
    await sendAutonomousNotification(
      'Action Undone',
      `Action: ${action.description}\n` +
      `Type: ${action.action_type}\n` +
      `Slug: ${action.slug ?? 'n/a'}\n` +
      `Duration: ${((Date.now() - start) / 1000).toFixed(1)}s`,
    );

    logger.info('[undo] Action reversed', {
      actionId: action.id,
      actionType: action.action_type,
      slug: action.slug,
    });

    return Response.json({
      ok: true,
      message: 'Action reversed successfully',
      action_id: action.id,
      action_type: action.action_type,
      slug: action.slug,
      duration_ms: Date.now() - start,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[undo] Fatal error', { error: msg });
    return Response.json(
      { ok: false, error: msg },
      { status: 500 },
    );
  }
}

// ── Rollback Handlers ──────────────────────────────────────────────────────

interface RollbackResult {
  success: boolean;
  detail: string;
  error?: string;
}

async function applyRollback(
  action: Record<string, unknown>,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<RollbackResult> {
  const actionType = action.action_type as string;
  const rollbackPayload = action.rollback_payload as Record<string, unknown> | null;
  const slug = action.slug as string | null;

  if (!rollbackPayload) {
    return { success: true, detail: 'No rollback payload — nothing to revert' };
  }

  try {
    switch (actionType) {
      case 'boost_content':
      case 'update_facts': {
        // Remove the freshness boost by deleting the content_override
        if (slug) {
          const { error } = await supabase
            .from('content_overrides')
            .delete()
            .eq('slug', slug);

          if (error) {
            return { success: false, detail: '', error: error.message };
          }
          return { success: true, detail: `Removed boost for ${slug}` };
        }
        return { success: true, detail: 'No slug to revert' };
      }

      case 'deploy_ab_winner': {
        const hubId = rollbackPayload.hub_id as string;
        if (!hubId) return { success: true, detail: 'No hub_id to revert' };

        // Remove winner declaration
        await supabase
          .from('ab_test_winners')
          .delete()
          .eq('hub_id', hubId);

        // Reset winner_declared flag
        await supabase
          .from('ab_test_stats')
          .update({ winner_declared: false, winner_declared_at: null })
          .eq('hub_id', hubId);

        return { success: true, detail: `Reset A/B test winner for ${hubId}` };
      }

      case 'activate_link': {
        const linkId = rollbackPayload.link_id as string;
        const previousState = rollbackPayload.previous_active as boolean;
        if (!linkId) return { success: true, detail: 'No link_id to revert' };

        await supabase
          .from('affiliate_links')
          .update({ is_active: previousState ?? false })
          .eq('id', linkId);

        return { success: true, detail: `Reverted link ${linkId} to active=${previousState ?? false}` };
      }

      case 'deactivate_link': {
        const linkId = rollbackPayload.link_id as string;
        const previousState = rollbackPayload.previous_active as boolean;
        if (!linkId) return { success: true, detail: 'No link_id to revert' };

        await supabase
          .from('affiliate_links')
          .update({ is_active: previousState ?? true })
          .eq('id', linkId);

        return { success: true, detail: `Reverted link ${linkId} to active=${previousState ?? true}` };
      }

      case 'apply_optimization': {
        // DB-override based — delete the override
        const overrideId = rollbackPayload.override_id as string;
        if (overrideId) {
          await supabase
            .from('content_overrides')
            .delete()
            .eq('id', overrideId);
          return { success: true, detail: `Removed optimization override ${overrideId}` };
        }
        // Fallback: remove by slug
        if (slug) {
          await supabase
            .from('content_overrides')
            .delete()
            .eq('slug', slug);
          return { success: true, detail: `Removed override for ${slug}` };
        }
        return { success: true, detail: 'No override to revert' };
      }

      case 'queue_genesis': {
        const keyword = rollbackPayload.keyword as string;
        const market = rollbackPayload.market as string;
        if (!keyword) return { success: true, detail: 'No keyword to dequeue' };

        await supabase
          .from('planning_queue')
          .delete()
          .eq('keyword', keyword)
          .eq('market', market ?? 'us')
          .eq('status', 'planned'); // Only delete if still planned

        return { success: true, detail: `Removed "${keyword}" from genesis queue` };
      }

      default:
        return { success: true, detail: `No rollback handler for ${actionType}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    return { success: false, detail: '', error: msg };
  }
}

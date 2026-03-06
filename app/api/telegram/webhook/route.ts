import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { answerCallbackQuery, editTelegramMessage } from '@/lib/alerts/telegram';
import { executeStrategyOption, approvePlanAndExecute } from '@/lib/actions/daily-strategy';
import type { StrategyOption } from '@/lib/actions/daily-strategy';

export const runtime = 'nodejs';
export const maxDuration = 120; // Increased for sequential plan execution

/**
 * POST /api/telegram/webhook
 *
 * Telegram Bot Webhook — handles inline keyboard button presses
 * from the AI-Strategist Daily Digest.
 *
 * Supported callback_data formats:
 *   "strategy:opt_a_<timestamp>"  — Execute strategy option A or B
 *   "approve:<date>_<timestamp>"  — Approve & execute all planned content
 *
 * Setup:
 *   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *     -H "Content-Type: application/json" \
 *     -d '{"url": "https://smartfinpro.com/api/telegram/webhook?secret=<CRON_SECRET>"}'
 *
 * Security: Validates via ?secret= query parameter matching CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Handle callback_query (inline keyboard button press)
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const callbackData = callbackQuery.data as string;
      const callbackId = callbackQuery.id as string;
      const messageId = callbackQuery.message?.message_id as number;
      const originalText = callbackQuery.message?.text as string || '';

      // ── Strategy Option (A/B) ───────────────────────────────
      if (callbackData.startsWith('strategy:')) {
        const optionId = callbackData.replace('strategy:', '');
        const isOptionA = optionId.startsWith('opt_a_');

        // Try to find the option data from the stored digest
        const option = await resolveOptionFromMessage(optionId, originalText, isOptionA);

        if (option) {
          // Execute the strategy action
          const result = await executeStrategyOption(option);

          // Acknowledge the button press
          await answerCallbackQuery(
            callbackId,
            result.success
              ? `Executed: ${result.message}`
              : `Failed: ${result.message}`,
          );

          // Edit the original message to show which option was selected
          const selectedLabel = isOptionA ? 'Option A' : 'Option B';
          const updatedText = originalText + `\n\n` +
            `\u{2705} <b>${selectedLabel} ausgefuehrt</b>\n` +
            `${result.message}\n` +
            `<i>${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`;

          await editTelegramMessage(messageId, updatedText);
        } else {
          await answerCallbackQuery(callbackId, 'Option nicht mehr verfuegbar.');
        }
      }

      // ── Approve & Execute Content Plan ──────────────────────
      if (callbackData.startsWith('approve:')) {
        // Extract date from callback_data: "approve:2025-01-15_1234567890"
        const approvePayload = callbackData.replace('approve:', '');
        const date = approvePayload.split('_')[0]; // YYYY-MM-DD

        // Immediately acknowledge to prevent Telegram timeout
        await answerCallbackQuery(
          callbackId,
          `\u{1F680} Content-Plan wird ausgefuehrt... Dies kann einige Minuten dauern.`,
        );

        // Update the message to show execution started
        const startedText = originalText + `\n\n` +
          `\u{23F3} <b>CONTENT-PLAN WIRD AUSGEFUEHRT...</b>\n` +
          `<i>Gestartet: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`;
        await editTelegramMessage(messageId, startedText);

        // Execute all planned items sequentially
        const result = await approvePlanAndExecute(date);

        // Build execution summary
        const completed = result.results.filter((r) => r.status === 'completed');
        const failed = result.results.filter((r) => r.status === 'failed');

        let summaryLines = [
          `\n\n\u{2705} <b>CONTENT-PLAN ABGESCHLOSSEN</b>`,
          `${completed.length}/${result.results.length} erfolgreich generiert`,
        ];

        if (completed.length > 0) {
          summaryLines.push(``);
          summaryLines.push(`<b>Erstellt:</b>`);
          for (const c of completed) {
            summaryLines.push(`  \u{2705} ${c.keyword}`);
          }
        }

        if (failed.length > 0) {
          summaryLines.push(``);
          summaryLines.push(`<b>Fehlgeschlagen:</b>`);
          for (const f of failed) {
            summaryLines.push(`  \u{274C} ${f.keyword}: ${f.error || 'Unbekannter Fehler'}`);
          }
        }

        summaryLines.push(``);
        summaryLines.push(
          `<i>Abgeschlossen: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`
        );

        // Update message with final results
        const finalText = originalText + summaryLines.join('\n');
        await editTelegramMessage(messageId, finalText);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[telegram-webhook] Error:', msg);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

/**
 * Resolve a strategy option from the stored digest.
 * Falls back to parsing the original message text for context.
 */
async function resolveOptionFromMessage(
  optionId: string,
  messageText: string,
  isOptionA: boolean,
): Promise<StrategyOption | null> {
  try {
    // Try to find the digest in the DB by the option timestamp
    const timestamp = optionId.replace(/opt_[ab]_/, '');
    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabase = createServiceClient();

    // Look up the most recent strategy digest
    const { data } = await supabase
      .from('genesis_pipeline_runs')
      .select('research_data')
      .eq('category', 'strategy-digest')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.research_data) {
      const digest = data.research_data as Record<string, unknown>;
      const option = isOptionA
        ? (digest.optionA as StrategyOption)
        : (digest.optionB as StrategyOption);
      if (option) return option;
    }

    // Fallback: parse from message text
    // Look for patterns like "CTR-Threshold" → lower_threshold action
    // or "Freshness Boost" / "boost" → boost_slug action
    // or "Genesis" → genesis_priority action
    const lowerMessage = messageText.toLowerCase();

    if (lowerMessage.includes('threshold') || lowerMessage.includes('schwelle')) {
      // Extract market and threshold from text heuristically
      const marketMatch = messageText.match(/\/(\w+)\//);
      return {
        id: optionId,
        label: isOptionA ? 'Option A' : 'Option B',
        description: 'Adjust CTR threshold',
        action: 'lower_threshold',
        params: { market: marketMatch?.[1] || 'us', new_threshold: 3.0 },
      };
    }

    if (lowerMessage.includes('boost') || lowerMessage.includes('freshness')) {
      const slugMatch = messageText.match(/`([^`]+)`/);
      return {
        id: optionId,
        label: isOptionA ? 'Option A' : 'Option B',
        description: 'Trigger freshness boost',
        action: 'boost_slug',
        params: { slug: slugMatch?.[1] || '', market: 'us' },
      };
    }

    if (lowerMessage.includes('genesis') || lowerMessage.includes('content')) {
      return {
        id: optionId,
        label: isOptionA ? 'Option A' : 'Option B',
        description: 'Prioritize Genesis content',
        action: 'genesis_priority',
        params: { keyword: 'trending topic', market: 'us', category: 'trading' },
      };
    }

    return null;
  } catch {
    return null;
  }
}

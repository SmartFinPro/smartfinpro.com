/**
 * LEGACY COMPATIBILITY SHIM — do NOT build new features on this file.
 *
 * Telegram is NOT a product channel. This module no longer talks to the
 * Telegram Bot API and has NO TELEGRAM_* env dependency. The exported functions
 * are thin compat shims kept ONLY so existing call-sites keep compiling;
 * internally they delegate to the channel-neutral alert layer
 * (lib/alerts/alert-delivery.ts) whose standard sink is the in-app Notification
 * Center.
 *
 * Success contract: sendTelegramAlert / sendTelegramWithKeyboard return
 * { success: true } whenever the alert is accepted by the neutral layer, so
 * producers that gate on `.success` are NEVER artificially degraded. The
 * interactive callback shims (answerCallbackQuery / editTelegramMessage) are
 * inert no-ops — the old interactive Telegram approval flow is deactivated;
 * use the in-app Approval Queue at /dashboard/content/planning instead.
 *
 * New code MUST import from '@/lib/alerts/alert-delivery' directly.
 */

import { sendAlert, sendAlertWithActions } from '@/lib/alerts/alert-delivery';

interface TelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

/**
 * Compat shim — records the alert in the Notification Center via the neutral
 * alert layer. No Telegram API call, no TELEGRAM_* dependency. Always resolves
 * { success: true } so producers gating on `.success` are never degraded.
 */
export async function sendTelegramAlert(message: string): Promise<TelegramResult> {
  await sendAlert({ message, source: 'legacy-alert' });
  return { success: true };
}

/**
 * Send a message with inline keyboard buttons via Telegram Bot API.
 * Used for interactive strategy digest with A/B option buttons.
 */
export async function sendTelegramWithKeyboard(
  message: string,
  buttons: InlineKeyboardButton[][],
): Promise<TelegramResult> {
  // Buttons map to in-app action hints (callback_data → href). No remote
  // interactivity; the neutral layer just records the alert + its actions.
  const actions = buttons.flat().map((b) => ({ label: b.text, href: b.callback_data }));
  await sendAlertWithActions({ message, source: 'legacy-alert' }, actions);
  return { success: true };
}

/**
 * Inert no-op — the interactive Telegram approval flow is deactivated.
 * Kept only so legacy imports compile.
 */
export async function answerCallbackQuery(
  _callbackQueryId: string,
  _text: string,
): Promise<TelegramResult> {
  return { success: true };
}

/**
 * Inert no-op — the interactive Telegram approval flow is deactivated.
 * Kept only so legacy imports compile.
 */
export async function editTelegramMessage(
  _messageId: number,
  _newText: string,
): Promise<TelegramResult> {
  return { success: true };
}

/**
 * Format a spike alert message with emoji-rich HTML.
 */
export function formatSpikeAlert({
  slug,
  market,
  clicksLastHour,
  avgHourly,
  spikeMultiplier,
  topProvider,
  dashboardUrl,
  potentialRevenue,
  cpaValue,
}: {
  slug: string;
  market: string;
  clicksLastHour: number;
  avgHourly: number;
  spikeMultiplier: number;
  topProvider: string | null;
  dashboardUrl: string;
  potentialRevenue?: number;
  cpaValue?: number;
}): string {
  const severity = spikeMultiplier >= 5 ? '🔴 CRITICAL' : '🟠 WARNING';
  const pctIncrease = Math.round((spikeMultiplier - 1) * 100);

  const revenueLines: string[] = [];
  if (potentialRevenue && potentialRevenue > 0) {
    revenueLines.push(``);
    revenueLines.push(`💰 <b>Potential Revenue:</b> +$${potentialRevenue.toFixed(0)} for this wave`);
    if (cpaValue) {
      revenueLines.push(`💵 <b>CPA:</b> $${cpaValue.toFixed(0)} × 3% conv rate`);
    }
  }

  return [
    `🚀 <b>SPIKE DETECTED</b>`,
    ``,
    `${severity} — <b>+${pctIncrease}%</b> above average`,
    ``,
    `📄 <b>Page:</b> <code>${slug}</code>`,
    `🌍 <b>Market:</b> ${market.toUpperCase()}`,
    `⚡ <b>Last Hour:</b> ${clicksLastHour} clicks`,
    `📊 <b>7d Avg/hr:</b> ${avgHourly.toFixed(1)}`,
    `📈 <b>Spike:</b> ${spikeMultiplier.toFixed(1)}x normal`,
    topProvider ? `🏆 <b>Top Provider:</b> ${topProvider}` : '',
    ...revenueLines,
    ``,
    `🔗 <a href="${dashboardUrl}">View Heatmap Dashboard</a>`,
    ``,
    `<i>${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Format an auto-pilot execution message.
 */
export function formatAutoPilotAlert({
  slug,
  market,
  clicksLastHour,
  spikeMultiplier,
  boostSuccess,
  deploySuccess,
  dashboardUrl,
}: {
  slug: string;
  market: string;
  clicksLastHour: number;
  spikeMultiplier: number;
  boostSuccess: boolean;
  deploySuccess: boolean;
  dashboardUrl: string;
}): string {
  const pctIncrease = Math.round((spikeMultiplier - 1) * 100);

  return [
    `🤖 <b>AUTO-PILOT EXECUTED</b>`,
    ``,
    `Spike auf <code>${slug}</code> erkannt (+${pctIncrease}%)`,
    `🌍 Market: ${market.toUpperCase()} | ⚡ ${clicksLastHour} clicks/hr | 📈 ${spikeMultiplier.toFixed(1)}x`,
    ``,
    boostSuccess
      ? `✅ <code>lastUpdated</code> aktualisiert`
      : `❌ <code>lastUpdated</code> Update fehlgeschlagen`,
    deploySuccess
      ? `⚙️ Cloudways Rebuild gestartet`
      : `⚠️ Deploy-Hook nicht ausgelöst (DEPLOY_HOOK_URL fehlt oder Fehler)`,
    ``,
    boostSuccess && deploySuccess
      ? `🚀 Seite wird in ~60s mit neuem Zeitstempel live gehen.`
      : `⚠️ Teilweise ausgeführt — prüfe Dashboard.`,
    ``,
    `🔗 <a href="${dashboardUrl}">View Heatmap Dashboard</a>`,
    `<i>${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`,
  ].join('\n');
}

/**
 * Format a CTR-below-threshold message (spike detected, but CTR too low for auto-pilot).
 */
export function formatCtrBelowThreshold({
  slug,
  market,
  clicksLastHour,
  spikeMultiplier,
  ctr,
  threshold,
  pageViews,
}: {
  slug: string;
  market: string;
  clicksLastHour: number;
  spikeMultiplier: number;
  ctr: number;
  threshold: number;
  pageViews: number;
}): string {
  const pctIncrease = Math.round((spikeMultiplier - 1) * 100);

  return [
    `🔒 <b>CTR-GATE: AUTO-PILOT BLOCKIERT</b>`,
    ``,
    `Spike auf <code>${slug}</code> erkannt (+${pctIncrease}%)`,
    `🌍 Market: ${market.toUpperCase()} | ⚡ ${clicksLastHour} clicks/hr | 📈 ${spikeMultiplier.toFixed(1)}x`,
    ``,
    `📊 <b>CTR:</b> ${ctr.toFixed(1)}% (Schwelle: ${threshold.toFixed(1)}%)`,
    `👁️ <b>Page Views (24h):</b> ${pageViews}`,
    `🔢 <b>CTA Clicks (24h):</b> ${clicksLastHour}`,
    ``,
    `⚠️ CTR unter Schwellenwert — kein Rebuild ausgelöst.`,
    `Nur Telegram-Alert gesendet.`,
    ``,
    `<i>${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`,
  ].join('\n');
}

/**
 * Format a high-priority boost message (CTR > 10%, immediate rebuild).
 */
export function formatHighPriorityBoost({
  slug,
  market,
  clicksLastHour,
  spikeMultiplier,
  ctr,
  pageViews,
  boostSuccess,
  deploySuccess,
  dashboardUrl,
}: {
  slug: string;
  market: string;
  clicksLastHour: number;
  spikeMultiplier: number;
  ctr: number;
  pageViews: number;
  boostSuccess: boolean;
  deploySuccess: boolean;
  dashboardUrl: string;
}): string {
  const pctIncrease = Math.round((spikeMultiplier - 1) * 100);

  return [
    `🔴 <b>HIGH-PRIORITY AUTO-PILOT</b>`,
    ``,
    `Starker Spike + hohe CTR auf <code>${slug}</code>`,
    `🌍 Market: ${market.toUpperCase()} | ⚡ ${clicksLastHour} clicks/hr | 📈 ${spikeMultiplier.toFixed(1)}x (+${pctIncrease}%)`,
    ``,
    `📊 <b>CTR:</b> ${ctr.toFixed(1)}% (HIGH PRIORITY)`,
    `👁️ <b>Page Views (24h):</b> ${pageViews}`,
    ``,
    boostSuccess
      ? `✅ <code>lastUpdated</code> aktualisiert`
      : `❌ <code>lastUpdated</code> Update fehlgeschlagen`,
    deploySuccess
      ? `⚙️ Cloudways Rebuild gestartet (SOFORT)`
      : `⚠️ Deploy-Hook nicht ausgelöst`,
    ``,
    boostSuccess && deploySuccess
      ? `🚀 HIGH-PRIORITY: Seite wird in ~60s mit neuem Zeitstempel live gehen.`
      : `⚠️ Teilweise ausgeführt — prüfe Dashboard.`,
    ``,
    `🔗 <a href="${dashboardUrl}">View Heatmap Dashboard</a>`,
    `<i>${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</i>`,
  ].join('\n');
}

/**
 * Format a cooldown skip message (informational, not an error).
 */
export function formatCooldownSkip({
  slug,
  lastTriggeredAt,
}: {
  slug: string;
  lastTriggeredAt: string;
}): string {
  const hoursAgo = Math.round(
    (Date.now() - new Date(lastTriggeredAt).getTime()) / (1000 * 60 * 60)
  );

  return [
    `⏸️ <b>AUTO-PILOT COOLDOWN</b>`,
    ``,
    `Spike auf <code>${slug}</code> erkannt, aber Auto-Pilot`,
    `wurde vor ${hoursAgo}h bereits ausgelöst.`,
    `24h-Sperre aktiv — kein erneuter Rebuild.`,
  ].join('\n');
}

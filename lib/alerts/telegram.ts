/**
 * Telegram Bot API — Alert Delivery + Interactive Keyboards
 *
 * ENVs required:
 *   TELEGRAM_BOT_TOKEN  — from @BotFather
 *   TELEGRAM_CHAT_ID    — your group/channel ID
 */

const TELEGRAM_API = 'https://api.telegram.org';

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
 * Send a message via Telegram Bot API (HTML parse mode).
 * Fire-and-forget friendly — never throws.
 */
export async function sendTelegramAlert(message: string): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return { success: false, error: 'Telegram not configured' };
  }

  try {
    const url = `${TELEGRAM_API}/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[Telegram] API error ${res.status}:`, body);
      return { success: false, error: `Telegram API ${res.status}` };
    }

    const result = await res.json();
    return { success: true, messageId: result.result?.message_id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Telegram] Send failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Send a message with inline keyboard buttons via Telegram Bot API.
 * Used for interactive strategy digest with A/B option buttons.
 */
export async function sendTelegramWithKeyboard(
  message: string,
  buttons: InlineKeyboardButton[][],
): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return { success: false, error: 'Telegram not configured' };
  }

  try {
    const url = `${TELEGRAM_API}/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: buttons,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[Telegram] Keyboard API error ${res.status}:`, body);
      return { success: false, error: `Telegram API ${res.status}` };
    }

    const result = await res.json();
    return { success: true, messageId: result.result?.message_id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Telegram] Keyboard send failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Answer a callback query (acknowledge button press in Telegram).
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text: string,
): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return { success: false, error: 'Bot token not configured' };

  try {
    const url = `${TELEGRAM_API}/bot${botToken}/answerCallbackQuery`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: true,
      }),
    });

    if (!res.ok) {
      return { success: false, error: `Telegram API ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/**
 * Edit an existing message (used to disable buttons after selection).
 */
export async function editTelegramMessage(
  messageId: number,
  newText: string,
): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return { success: false, error: 'Not configured' };

  try {
    const url = `${TELEGRAM_API}/bot${botToken}/editMessageText`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      return { success: false, error: `Telegram API ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
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

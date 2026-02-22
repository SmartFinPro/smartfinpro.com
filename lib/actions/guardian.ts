'use server';

import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import {
  testAnthropicConnection,
  testSerperConnection,
  testGoogleIndexing,
} from '@/lib/actions/settings';

// ════════════════════════════════════════════════════════════════
// GUARDIAN — API Connectivity Monitoring & Email Alerts
//
// checkAllApiConnectivities()  — Test all APIs, alert on failure
// sendTestNotification(email)  — Send test email to verify setup
// getGuardianStatus()          — Return last check results
//
// Designed to be FAIL-SAFE: errors here must never block the
// spike-monitor or any other system component.
// ════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export interface GuardianCheckResult {
  key: string;
  label: string;
  success: boolean;
  message: string;
  checkedAt: string;
}

export interface GuardianStatus {
  enabled: boolean;
  lastCheck: string | null;
  results: GuardianCheckResult[];
}

// ── Module-Level State (In-Memory) ────────────────────────────

/** Cooldown: max 1 alert email per key per 6 hours */
const alertCooldowns = new Map<string, number>();
const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

/** Cached results from last guardian run */
let lastGuardianResults: GuardianCheckResult[] = [];
let lastGuardianCheck: string | null = null;

/** Human-readable labels for each credential key */
const KEY_LABELS: Record<string, string> = {
  anthropic_api_key: 'Anthropic API',
  serper_api_key: 'Serper.dev API',
  google_indexing_json: 'Google Indexing API',
};

// ── Check All API Connectivities ──────────────────────────────

export async function checkAllApiConnectivities(): Promise<{
  checked: number;
  failures: number;
  alertsSent: number;
  results: GuardianCheckResult[];
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const supabase = createServiceClient();

    // 1. Check if Guardian is enabled
    const { data: enabledRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'guardian_enabled')
      .single();

    if (!enabledRow || enabledRow.value !== 'true') {
      return { checked: 0, failures: 0, alertsSent: 0, results: [], errors: [] };
    }

    // 2. Read notification email
    const { data: emailRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'notification_email')
      .single();

    const notificationEmail = emailRow?.value?.trim() || '';

    // 3. Read raw credential values to skip unconfigured keys
    const { data: credRows } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('category', 'credentials');

    const configuredKeys = new Set<string>();
    for (const row of credRows || []) {
      if (row.value && row.value.length > 0) {
        configuredKeys.add(row.key);
      }
    }

    // 4. Build test tasks only for configured keys
    const testTasks: Array<{
      key: string;
      fn: () => Promise<{ success: boolean; message: string }>;
    }> = [];

    if (configuredKeys.has('anthropic_api_key')) {
      testTasks.push({ key: 'anthropic_api_key', fn: () => testAnthropicConnection() });
    }
    if (configuredKeys.has('serper_api_key')) {
      testTasks.push({ key: 'serper_api_key', fn: () => testSerperConnection() });
    }
    if (configuredKeys.has('google_indexing_json')) {
      testTasks.push({ key: 'google_indexing_json', fn: () => testGoogleIndexing() });
    }

    if (testTasks.length === 0) {
      return { checked: 0, failures: 0, alertsSent: 0, results: [], errors: [] };
    }

    // 5. Run all tests in parallel
    const now = new Date().toISOString();
    const settled = await Promise.allSettled(testTasks.map((t) => t.fn()));

    const results: GuardianCheckResult[] = [];
    let failures = 0;
    let alertsSent = 0;

    for (let i = 0; i < testTasks.length; i++) {
      const task = testTasks[i];
      const outcome = settled[i];
      const label = KEY_LABELS[task.key] || task.key;

      let success = false;
      let message = '';

      if (outcome.status === 'fulfilled') {
        success = outcome.value.success;
        message = outcome.value.message;
      } else {
        success = false;
        message = outcome.reason instanceof Error
          ? outcome.reason.message
          : 'Unbekannter Fehler beim Test';
      }

      results.push({ key: task.key, label, success, message, checkedAt: now });

      // 6. Send alert email for failures (with cooldown)
      if (!success && notificationEmail) {
        const lastAlert = alertCooldowns.get(task.key);
        const cooldownActive = lastAlert && Date.now() - lastAlert < COOLDOWN_MS;

        if (!cooldownActive) {
          try {
            const emailResult = await sendGuardianAlert(
              notificationEmail,
              label,
              message,
              now,
            );
            if (emailResult.success) {
              alertCooldowns.set(task.key, Date.now());
              alertsSent++;
            } else {
              errors.push(`Email fuer ${label} fehlgeschlagen: ${emailResult.error}`);
            }
          } catch (emailErr) {
            const msg = emailErr instanceof Error ? emailErr.message : 'Unknown';
            errors.push(`Email-Versand fuer ${label} fehlgeschlagen: ${msg}`);
          }
        }

        failures++;
      }
    }

    // 7. Cache results
    lastGuardianResults = results;
    lastGuardianCheck = now;

    return {
      checked: testTasks.length,
      failures,
      alertsSent,
      results,
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[guardian] checkAllApiConnectivities failed:', msg);
    return {
      checked: 0,
      failures: 0,
      alertsSent: 0,
      results: [],
      errors: [`Guardian-Fehler: ${msg}`],
    };
  }
}

// ── Send Guardian Alert Email ─────────────────────────────────

async function sendGuardianAlert(
  to: string,
  keyLabel: string,
  errorMessage: string,
  timestamp: string,
): Promise<{ success: boolean; error?: string }> {
  const { html, text } = buildGuardianAlertEmail(keyLabel, errorMessage, timestamp);

  return sendEmail({
    to,
    subject: `\u26a0\ufe0f ACTION REQUIRED: SmartFinPro API Failure [${keyLabel}]`,
    html,
    text,
  });
}

function buildGuardianAlertEmail(
  keyLabel: string,
  errorMessage: string,
  timestamp: string,
): { html: string; text: string } {
  const formattedTime = new Date(timestamp).toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">
                \u26a0\ufe0f API Connectivity Failure
              </h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">
                SmartFinPro Guardian Alert
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 16px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 20px;">
                    <p style="color: #991b1b; margin: 0; font-size: 14px; font-weight: 600;">
                      \u274c ${keyLabel} — Nicht erreichbar
                    </p>
                    <p style="color: #b91c1c; margin: 8px 0 0; font-size: 13px; font-family: monospace;">
                      ${errorMessage}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #64748b;">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                          <strong style="color: #334155;">Zeitpunkt:</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                          ${formattedTime}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                          <strong style="color: #334155;">Betroffener Service:</strong>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                          ${keyLabel}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #334155;">Naechster Check:</strong>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          In 15 Minuten (automatisch)
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 24px;">
                    <p style="color: #475569; margin: 0; font-size: 13px; line-height: 1.6;">
                      <strong>Auswirkung:</strong> Der Auto-Pilot kann aktuell keine ${keyLabel}-abhaengigen Operationen ausfuehren
                      (z.B. AI-Optimization, Content-Generierung, Spike-Analyse).
                      Bitte pruefen Sie den API-Key unter <em>Dashboard &rarr; Settings &rarr; API Credentials</em>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                SmartFinPro Guardian &mdash; Automatische API-Ueberwachung
              </p>
              <p style="color: #cbd5e1; font-size: 10px; margin: 4px 0 0;">
                Max. 1 Alert pro Service alle 6 Stunden
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `
\u26a0\ufe0f SmartFinPro Guardian Alert — API Failure

Service: ${keyLabel}
Status: Nicht erreichbar
Fehler: ${errorMessage}
Zeitpunkt: ${formattedTime}

Auswirkung: Der Auto-Pilot kann aktuell keine ${keyLabel}-abhaengigen Operationen ausfuehren.
Bitte pruefen Sie den API-Key unter Dashboard > Settings > API Credentials.

---
SmartFinPro Guardian — Automatische API-Ueberwachung
Max. 1 Alert pro Service alle 6 Stunden
`.trim();

  return { html, text };
}

// ── Send Test Notification ────────────────────────────────────

export async function sendTestNotification(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return { success: false, error: 'Ungueltige E-Mail-Adresse.' };
    }

    const formattedTime = new Date().toLocaleString('de-DE', {
      timeZone: 'Europe/Berlin',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">
                \u2705 Guardian Test erfolgreich
              </h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">
                SmartFinPro E-Mail-System
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #334155; margin: 0 0 16px; font-size: 14px; line-height: 1.6;">
                Diese Test-E-Mail bestaetigt, dass das SmartFinPro Guardian E-Mail-System korrekt konfiguriert ist.
              </p>
              <div style="padding: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                <p style="color: #166534; margin: 0; font-size: 13px;">
                  \u2705 Resend API: Verbunden<br>
                  \u2705 E-Mail-Zustellung: Funktioniert<br>
                  \u2705 Guardian: Bereit fuer automatische Alerts
                </p>
              </div>
              <p style="color: #94a3b8; margin: 16px 0 0; font-size: 12px;">
                Gesendet am ${formattedTime}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                SmartFinPro Guardian &mdash; Automatische API-Ueberwachung
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    const text = `
\u2705 SmartFinPro Guardian — Test erfolgreich

Diese Test-E-Mail bestaetigt, dass das Guardian E-Mail-System korrekt konfiguriert ist.

- Resend API: Verbunden
- E-Mail-Zustellung: Funktioniert
- Guardian: Bereit fuer automatische Alerts

Gesendet am ${formattedTime}

---
SmartFinPro Guardian — Automatische API-Ueberwachung
`.trim();

    const result = await sendEmail({
      to: email.trim(),
      subject: '\u2705 SmartFinPro Guardian — Test erfolgreich',
      html,
      text,
    });

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[guardian] sendTestNotification failed:', msg);
    return { success: false, error: msg };
  }
}

// ── Get Guardian Status ───────────────────────────────────────

export async function getGuardianStatus(): Promise<GuardianStatus> {
  try {
    const supabase = createServiceClient();

    const { data: enabledRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'guardian_enabled')
      .single();

    return {
      enabled: enabledRow?.value === 'true',
      lastCheck: lastGuardianCheck,
      results: lastGuardianResults,
    };
  } catch {
    return {
      enabled: false,
      lastCheck: null,
      results: [],
    };
  }
}

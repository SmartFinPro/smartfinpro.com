'use server';

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging';

import { createServiceClient } from '@/lib/supabase/server';
import { createClaudeMessage } from '@/lib/claude/client';

// ════════════════════════════════════════════════════════════════
// SYSTEM SETTINGS — Read/Write for system_settings table
//
// getSettings()         — Returns all settings, masked credentials
// updateSettings(data)  — Upserts changed values
// clearAllData()        — Global reset: wipes simulation + test data
// ════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export interface SystemSettings {
  // Credentials
  anthropic_api_key: string;
  serper_api_key: string;
  google_indexing_json: string;

  // Guardrails
  spike_threshold: string;
  confidence_threshold: string;
  optimization_interval: string;

  // Controls
  simulation_mode: string;

  // Notifications (Guardian)
  notification_email: string;
  guardian_enabled: string;
}

export type SettingsKey = keyof SystemSettings;

/** Keys that are sensitive and should be masked on read */
const SENSITIVE_KEYS: SettingsKey[] = [
  'anthropic_api_key',
  'serper_api_key',
  'google_indexing_json',
];

const MASK = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';

// ── Get All Settings (masked) ────────────────────────────────

export async function getSettings(): Promise<SystemSettings> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .order('key');

  const defaults: SystemSettings = {
    anthropic_api_key: '',
    serper_api_key: '',
    google_indexing_json: '',
    spike_threshold: '300',
    confidence_threshold: '5',
    optimization_interval: '7',
    simulation_mode: 'false',
    notification_email: '',
    guardian_enabled: 'false',
  };

  if (error || !data) return defaults;

  const settings = { ...defaults };
  for (const row of data) {
    const key = row.key as SettingsKey;
    if (key in settings) {
      // Mask sensitive values that have been set
      if (SENSITIVE_KEYS.includes(key) && row.value && row.value.length > 0) {
        settings[key] = MASK;
      } else {
        settings[key] = row.value;
      }
    }
  }

  return settings;
}

// ── Check if a credential is configured (non-empty) ──────────

export async function getCredentialStatus(): Promise<Record<string, boolean>> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('category', 'credentials');

  const status: Record<string, boolean> = {
    anthropic_api_key: false,
    serper_api_key: false,
    google_indexing_json: false,
  };

  for (const row of (data || [])) {
    if (row.key in status) {
      status[row.key] = row.value !== null && row.value.length > 0;
    }
  }

  return status;
}

// ── Update Settings ──────────────────────────────────────────

export async function updateSettings(
  updates: Partial<SystemSettings>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  try {
    // Determine category for each key
    const categoryMap: Record<string, string> = {
      anthropic_api_key: 'credentials',
      serper_api_key: 'credentials',
      google_indexing_json: 'credentials',
      spike_threshold: 'guardrails',
      confidence_threshold: 'guardrails',
      optimization_interval: 'guardrails',
      simulation_mode: 'controls',
      notification_email: 'notifications',
      guardian_enabled: 'notifications',
    };

    for (const [key, value] of Object.entries(updates)) {
      // Skip masked values (user didn't change the field)
      if (value === MASK) continue;

      // Validate Google Indexing JSON if provided
      if (key === 'google_indexing_json' && value && value.trim().length > 0) {
        try {
          const parsed = JSON.parse(value);
          if (!parsed.client_email || !parsed.private_key) {
            return {
              success: false,
              error: 'Google JSON muss "client_email" und "private_key" enthalten.',
            };
          }
        } catch {
          return {
            success: false,
            error: 'Ungueltiges JSON-Format fuer Google Indexing Credentials.',
          };
        }
      }

      // Validate numeric guardrails
      if (key === 'spike_threshold') {
        const num = Number(value);
        if (isNaN(num) || num < 100 || num > 1000) {
          return { success: false, error: 'Spike-Threshold muss zwischen 100% und 1000% liegen.' };
        }
      }

      if (key === 'confidence_threshold') {
        const num = Number(value);
        if (isNaN(num) || num < 1 || num > 50) {
          return { success: false, error: 'Confidence-Threshold muss zwischen 1% und 50% liegen.' };
        }
      }

      // Validate notification email
      if (key === 'notification_email' && value && value.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          return { success: false, error: 'Ungueltige E-Mail-Adresse.' };
        }
      }

      const category = categoryMap[key] || 'general';

      const { error } = await supabase
        .from('system_settings')
        .upsert(
          {
            key,
            value: value ?? '',
            category,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' },
        );

      if (error) {
        logger.error(`[settings] Failed to update ${key}:`, error.message);
        return { success: false, error: `Fehler beim Speichern von "${key}": ${error.message}` };
      }
    }

    return { success: true };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[settings] updateSettings failed:', msg);
    return { success: false, error: msg };
  }
}

// ── Test Connections ─────────────────────────────────────────

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

/**
 * Test Anthropic API connection by sending a minimal prompt.
 * Uses the stored key from system_settings (or provided key if freshly entered).
 */
export async function testAnthropicConnection(
  keyOverride?: string,
): Promise<ConnectionTestResult> {
  const start = Date.now();

  try {
    // Get the key: prefer override (user just typed), fallback to stored
    let apiKey = keyOverride;
    if (!apiKey || apiKey === MASK) {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'anthropic_api_key')
        .single();
      apiKey = data?.value || '';
    }

    if (!apiKey) {
      return { success: false, message: 'Kein API-Key konfiguriert.' };
    }

    const response = await createClaudeMessage({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Ping' }],
    }, { apiKey, operation: 'settings_test_anthropic', maxAttempts: 2, backoffMs: [500, 1000] });

    const latencyMs = Date.now() - start;
    const hasContent = response.content.length > 0;

    return {
      success: hasContent,
      message: hasContent
        ? `Verbunden — ${response.model} (${latencyMs}ms)`
        : 'Keine Antwort erhalten.',
      latencyMs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const latencyMs = Date.now() - start;

    if (msg.includes('401') || msg.includes('authentication')) {
      return { success: false, message: 'Ungueltiger API-Key (401 Unauthorized).', latencyMs };
    }
    if (msg.includes('429')) {
      return { success: false, message: 'Rate Limit erreicht — Key ist gueltig, aber ueberlastet.', latencyMs };
    }

    return { success: false, message: `Fehler: ${msg}`, latencyMs };
  }
}

/**
 * Test Serper.dev API connection with a minimal search query.
 */
export async function testSerperConnection(
  keyOverride?: string,
): Promise<ConnectionTestResult> {
  const start = Date.now();

  try {
    let apiKey = keyOverride;
    if (!apiKey || apiKey === MASK) {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'serper_api_key')
        .single();
      apiKey = data?.value || '';
    }

    if (!apiKey) {
      return { success: false, message: 'Kein API-Key konfiguriert.' };
    }

    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: 'SmartFinPro', num: 1 }),
    });

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { success: false, message: `Ungueltiger API-Key (${res.status}).`, latencyMs };
      }
      return { success: false, message: `Serper API Fehler: HTTP ${res.status}`, latencyMs };
    }

    const data = await res.json();
    const resultCount = data.organic?.length || 0;

    return {
      success: true,
      message: `Verbunden — ${resultCount} Ergebnisse (${latencyMs}ms)`,
      latencyMs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, message: `Fehler: ${msg}`, latencyMs: Date.now() - start };
  }
}

/**
 * Test Google Indexing API credentials by validating JSON format
 * and checking the token_uri endpoint reachability.
 */
export async function testGoogleIndexing(
  jsonOverride?: string,
): Promise<ConnectionTestResult> {
  const start = Date.now();

  try {
    let jsonStr = jsonOverride;
    if (!jsonStr || jsonStr === MASK) {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'google_indexing_json')
        .single();
      jsonStr = data?.value || '';
    }

    if (!jsonStr || jsonStr.trim().length === 0) {
      return { success: false, message: 'Kein JSON konfiguriert.' };
    }

    // Step 1: Parse JSON
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return { success: false, message: 'Ungueltiges JSON-Format.', latencyMs: Date.now() - start };
    }

    // Step 2: Validate required fields
    if (!parsed.client_email || typeof parsed.client_email !== 'string') {
      return { success: false, message: 'Feld "client_email" fehlt oder ist ungueltig.', latencyMs: Date.now() - start };
    }
    if (!parsed.private_key || typeof parsed.private_key !== 'string') {
      return { success: false, message: 'Feld "private_key" fehlt oder ist ungueltig.', latencyMs: Date.now() - start };
    }
    if (!parsed.token_uri || typeof parsed.token_uri !== 'string') {
      return { success: false, message: 'Feld "token_uri" fehlt. Kein gueltiges Service Account JSON.', latencyMs: Date.now() - start };
    }

    // Step 3: Verify token_uri is reachable
    const tokenRes = await fetch(parsed.token_uri as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=invalid',  // intentionally invalid — just testing reachability
    });

    const latencyMs = Date.now() - start;

    // Google returns 400 for bad grant_type (expected), which proves reachability
    if (tokenRes.status === 400 || tokenRes.status === 401) {
      return {
        success: true,
        message: `JSON gueltig — ${parsed.client_email} (Token-Endpoint erreichbar, ${latencyMs}ms)`,
        latencyMs,
      };
    }

    return {
      success: true,
      message: `JSON gueltig — ${parsed.client_email} (${latencyMs}ms)`,
      latencyMs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, message: `Fehler: ${msg}`, latencyMs: Date.now() - start };
  }
}

// ── Global Reset ─────────────────────────────────────────────

export async function globalReset(): Promise<{
  success: boolean;
  deleted: Record<string, number>;
  error?: string;
}> {
  const supabase = createServiceClient();

  const deleted: Record<string, number> = {};

  try {
    // 1. Clear simulation data first
    try {
      const { clearSimulationData } = await import('@/lib/actions/simulator');
      const simResult = await clearSimulationData();
      if (simResult.success) {
        deleted.simulation_cta = simResult.deleted.ctaAnalytics;
        deleted.simulation_planning = simResult.deleted.planningQueue;
        deleted.simulation_optimization = simResult.deleted.optimizationTasks;
        deleted.simulation_cooldowns = simResult.deleted.autopilotCooldowns;
      }
    } catch {
      // Simulation module might not exist
    }

    // 2. Clear all optimization tasks
    const { data: optDeleted } = await supabase
      .from('optimization_tasks')
      .delete()
      .neq('status', '_never_match_')
      .select('id');
    deleted.optimization_tasks = optDeleted?.length || 0;

    // 3. Clear planning queue
    const { data: planDeleted } = await supabase
      .from('planning_queue')
      .delete()
      .neq('status', '_never_match_')
      .select('id');
    deleted.planning_queue = planDeleted?.length || 0;

    // 4. Clear autopilot cooldowns
    const { data: cooldownDeleted } = await supabase
      .from('autopilot_cooldowns')
      .delete()
      .neq('slug', '_never_match_')
      .select('slug');
    deleted.autopilot_cooldowns = cooldownDeleted?.length || 0;

    // 5. Reset system settings to defaults
    const defaults: Array<{ key: string; value: string; category: string }> = [
      { key: 'spike_threshold', value: '300', category: 'guardrails' },
      { key: 'confidence_threshold', value: '5', category: 'guardrails' },
      { key: 'optimization_interval', value: '7', category: 'guardrails' },
      { key: 'simulation_mode', value: 'false', category: 'controls' },
      { key: 'guardian_enabled', value: 'false', category: 'notifications' },
    ];

    for (const d of defaults) {
      await supabase
        .from('system_settings')
        .upsert({ ...d, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    deleted.settings_reset = defaults.length;

    return { success: true, deleted };
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[settings] globalReset failed:', msg);
    return { success: false, deleted, error: msg };
  }
}

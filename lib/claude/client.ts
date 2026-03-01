import Anthropic from '@anthropic-ai/sdk';
import { withRetry } from '@/lib/utils/retry';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_BACKOFF_MS = [1000, 2000, 4000];

export interface ClaudeCallOptions {
  apiKey?: string;
  maxAttempts?: number;
  backoffMs?: number[];
  timeoutMs?: number;
  operation?: string;
  client?: Anthropic;
}

function isRetryable(error: unknown): boolean {
  const err = error as { status?: number; name?: string; code?: string; message?: string } | null;
  const status = err?.status;
  const code = err?.code;
  const name = err?.name;
  const message = String(err?.message || '').toLowerCase();

  if (name === 'AbortError') return true;
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'EAI_AGAIN') return true;
  if (status === 429) return true;
  if (typeof status === 'number' && status >= 500) return true;
  if (message.includes('internal server error') || message.includes('timeout')) return true;

  return false;
}

function extractRequestId(error: unknown): string | undefined {
  const err = error as { request_id?: string; requestId?: string; headers?: Headers } | null;
  if (err?.request_id) return err.request_id;
  if (err?.requestId) return err.requestId;
  try {
    return err?.headers?.get?.('request-id') || undefined;
  } catch {
    return undefined;
  }
}

export async function createClaudeMessage(
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
  options: ClaudeCallOptions = {},
): Promise<Anthropic.Messages.Message> {
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_ANTHROPIC_IN_DEV === 'true') {
    throw new Error('Anthropic calls disabled in development (DISABLE_ANTHROPIC_IN_DEV=true)');
  }

  const operation = options.operation ?? 'anthropic_call';
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const client = options.client ?? new Anthropic({ apiKey });

  return withRetry(
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await client.messages.create(params, { signal: controller.signal });
        if (response._request_id) {
          console.info(`[anthropic] ${operation} success request_id=${response._request_id}`);
        }
        return response;
      } finally {
        clearTimeout(timer);
      }
    },
    {
      maxAttempts: options.maxAttempts ?? 3,
      backoffMs: options.backoffMs ?? DEFAULT_BACKOFF_MS,
      shouldRetry: (error) => isRetryable(error),
      onRetry: (error, attempt, delayMs) => {
        const reqId = extractRequestId(error);
        const err = error as { status?: number; message?: string } | null;
        const suffix = reqId ? ` request_id=${reqId}` : '';
        console.warn(
          `[anthropic] ${operation} retry attempt=${attempt + 1} in ${delayMs}ms status=${err?.status ?? 'n/a'} message="${err?.message ?? 'Unknown error'}"${suffix}`,
        );
      },
    },
  );
}

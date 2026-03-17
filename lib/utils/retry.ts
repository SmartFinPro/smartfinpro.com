export interface RetryOptions {
  maxAttempts?: number;
  backoffMs?: number[];
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, nextDelayMs: number) => void | Promise<void>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const backoffMs = options.backoffMs ?? [1000, 2000, 4000];
  const shouldRetry = options.shouldRetry ?? (() => true);

  let attempt = 1;
  for (;;) {
    try {
      return await fn(attempt);
    } catch (error) {
      const canRetry = attempt < maxAttempts && shouldRetry(error, attempt);
      if (!canRetry) throw error;

      const delay = backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 1000;
      if (options.onRetry) {
        await options.onRetry(error, attempt, delay);
      }
      await sleep(delay);
      attempt += 1;
    }
  }
}

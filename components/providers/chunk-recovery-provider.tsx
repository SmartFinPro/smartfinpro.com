'use client';

import { useEffect } from 'react';

const CHUNK_RETRY_PARAM = '__chunk_retry';
const RETRY_KEY_PREFIX = 'sfp_chunk_retry_';

function isChunkLikeError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('chunkloaderror') ||
    m.includes('loading chunk') ||
    m.includes('failed to fetch dynamically imported module') ||
    m.includes('module factory is not available') ||
    m.includes('/_next/static/chunks/')
  );
}

function getErrorMessage(input: unknown): string {
  if (!input) return '';
  if (typeof input === 'string') return input;
  if (input instanceof Error) return input.message || '';
  if (typeof input === 'object' && 'message' in input) {
    const maybe = (input as { message?: unknown }).message;
    return typeof maybe === 'string' ? maybe : '';
  }
  return '';
}

export function ChunkRecoveryProvider() {
  useEffect(() => {
    const maybeRecover = (message: string) => {
      if (!isChunkLikeError(message)) return;

      const url = new URL(window.location.href);
      const retryKey = `${RETRY_KEY_PREFIX}${url.pathname}${url.search}`;
      const retried = sessionStorage.getItem(retryKey) === '1';

      if (retried) {
        // Prevent reload loops: only one automatic retry per page URL/session.
        console.error('[ChunkRecovery] Chunk error persisted after retry:', message);
        return;
      }

      sessionStorage.setItem(retryKey, '1');
      url.searchParams.set(CHUNK_RETRY_PARAM, Date.now().toString());
      console.warn('[ChunkRecovery] Chunk error detected, reloading once:', message);
      window.location.replace(url.toString());
    };

    const onError = (event: ErrorEvent) => {
      maybeRecover(getErrorMessage(event.error) || event.message || '');
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      maybeRecover(getErrorMessage(event.reason));
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}


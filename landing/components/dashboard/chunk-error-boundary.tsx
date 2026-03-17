'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// ChunkErrorBoundary
//
// Catches ChunkLoadError / module factory missing errors that
// occur when Turbopack HMR invalidates compiled chunks.
// Auto-triggers a hard page refresh instead of crashing the UI.
// ════════════════════════════════════════════════════════════════

interface Props {
  children: ReactNode;
  /** Optional label for logging which component boundary caught the error */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

const MAX_RETRIES = 2;

export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message.includes('ChunkLoadError') ||
      error.message.includes('module factory is not available') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch dynamically imported module');

    const label = this.props.label || 'unknown';
    console.error(`[ChunkErrorBoundary:${label}]`, error.message);

    if (isChunkError && this.state.retryCount < MAX_RETRIES) {
      // Auto-reload after short delay to let Turbopack stabilize
      console.warn(
        `[ChunkErrorBoundary:${label}] Chunk error detected, auto-reloading (attempt ${this.state.retryCount + 1}/${MAX_RETRIES})...`,
      );
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }

  handleManualRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleHardReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-800">
                Module loading error
              </p>
              <p className="text-xs text-amber-600">
                A component failed to load — this is typically caused by a stale
                dev cache. Try reloading the page.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={this.handleHardReload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-400 transition-all"
                >
                  <RefreshCw className="h-3 w-3" />
                  Seite neu laden
                </button>
                <button
                  onClick={this.handleManualRetry}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 border border-amber-300 hover:bg-amber-100 transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

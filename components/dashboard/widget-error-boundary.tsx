'use client';

// components/dashboard/widget-error-boundary.tsx
// Generic error boundary for individual dashboard widgets.
// If a widget crashes (DB error, fetch failure, JS exception) it shows a
// compact "Widget unavailable" card instead of crashing the whole page.

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Used in error logs to identify which widget failed */
  label?: string;
  /** Override the fallback height (Tailwind class, e.g. 'h-32') */
  minHeight?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    const label = this.props.label || 'unknown';
    console.error(`[WidgetErrorBoundary:${label}]`, error.message);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { minHeight = 'h-24', label } = this.props;
      return (
        <div
          className={`flex flex-col items-center justify-center ${minHeight} rounded-xl border border-slate-200 bg-slate-50 p-4 text-center`}
        >
          <AlertTriangle className="h-5 w-5 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-500">
            {label ? `${label} unavailable` : 'Widget unavailable'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 mb-3">
            {process.env.NODE_ENV === 'development' && this.state.error
              ? this.state.error.message
              : 'Something went wrong loading this widget.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

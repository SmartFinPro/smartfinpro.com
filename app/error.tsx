'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sfp-gray)' }}>
      <div className="max-w-md mx-auto text-center px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-200"
          style={{ background: 'rgba(245,158,11,0.08)' }}
        >
          <AlertTriangle className="h-8 w-8" style={{ color: 'var(--sfp-gold)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--sfp-ink)' }}>
          Page Temporarily Unavailable
        </h2>
        <p className="mb-8 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
          We&apos;re having trouble loading this page. Please try again in a moment.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl hover:opacity-90 transition-colors font-semibold text-sm"
            style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium"
            style={{ color: 'var(--sfp-ink)' }}
          >
            <Home className="h-4 w-4" />
            Homepage
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <pre
            className="mt-8 p-4 rounded-xl text-left text-xs overflow-auto max-h-40 border border-gray-200"
            style={{ background: 'var(--sfp-gray)', color: 'var(--sfp-slate)' }}
          >
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}

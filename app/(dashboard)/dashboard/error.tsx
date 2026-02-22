'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-6">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Dashboard Unavailable
        </h2>
        <p className="text-slate-500 mb-6">
          {error.message.includes('timeout') || error.message.includes('Timeout')
            ? 'The database query timed out. This usually resolves itself — try again in a moment.'
            : error.message.includes('Supabase')
              ? 'Unable to connect to the database. Please check your Supabase configuration.'
              : 'Something went wrong loading the dashboard data. Please try again.'}
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-6 p-4 bg-slate-100 rounded-lg text-left text-xs text-slate-600 overflow-auto max-h-40">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}

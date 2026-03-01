import Link from 'next/link';
import { SearchX, Home, ArrowLeft } from 'lucide-react';

export default function MarketingNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--sfp-gray)' }}>
      <div className="max-w-xl text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-200"
          style={{ background: '#ffffff' }}
        >
          <SearchX className="h-8 w-8" style={{ color: 'var(--sfp-navy)' }} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--sfp-ink)' }}>
          Page Not Found
        </h1>
        <p className="mb-8 leading-relaxed" style={{ color: 'var(--sfp-slate)' }}>
          The page you requested does not exist or may have moved.
          Check the URL or continue from the homepage.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl hover:opacity-90 transition-colors font-semibold text-sm"
            style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
          >
            <Home className="h-4 w-4" />
            Homepage
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium"
            style={{ color: 'var(--sfp-ink)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Explore Tools
          </Link>
        </div>
      </div>
    </div>
  );
}

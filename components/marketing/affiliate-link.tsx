import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { getComplianceLabel } from '@/lib/affiliate/compliance-labels';
import type { Market, Category } from '@/types';

// ============================================================
// AffiliateLink — Smart affiliate link component
// ============================================================
// Automatically:
// a) Builds the /go/[slug] redirect URL
// b) Sets rel="nofollow noopener sponsored" attributes
// c) Shows regional compliance hint near the link
//
// Usage in MDX:
//   <AffiliateLink slug="etoro" market="uk" category="trading" variant="button">
//     Open eToro Account
//   </AffiliateLink>
// ============================================================

/** Shared rel attribute — every outgoing affiliate link must carry this */
const AFFILIATE_REL = 'nofollow noopener sponsored' as const;

interface AffiliateLinkProps {
  /** The /go/ slug for this affiliate link */
  slug: string;
  /** Market for compliance label (defaults to 'us') */
  market?: Market;
  /** Category for compliance label (defaults to 'ai-tools') */
  category?: Category;
  /** Visual variant */
  variant?: 'inline' | 'button' | 'card';
  /** Button label override */
  children?: React.ReactNode;
  /** Show compliance hint below/beside the link (default: true) */
  showCompliance?: boolean;
  /** Additional CSS class */
  className?: string;
}

/** Compliance disclaimer — consistent across all variants */
function ComplianceHint({
  text,
  layout = 'block',
}: {
  text: string;
  layout?: 'block' | 'inline';
}) {
  if (layout === 'inline') {
    return (
      <span className="text-[10px] text-slate-500 ml-1.5 leading-tight">
        ({text})
      </span>
    );
  }
  return (
    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
      {text}
    </p>
  );
}

export function AffiliateLink({
  slug,
  market = 'us',
  category = 'ai-tools',
  variant = 'inline',
  children,
  showCompliance = true,
  className = '',
}: AffiliateLinkProps) {
  const href = `/go/${slug}`;
  const complianceText = getComplianceLabel(market, category);

  // ── Button Variant ─────────────────────────────────────────
  if (variant === 'button') {
    return (
      <div className="my-4 not-prose">
        <Link
          href={href}
          target="_blank"
          rel={AFFILIATE_REL}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all text-sm px-6 py-3 text-white shadow-md hover:shadow-lg ${className}`}
          style={{ background: 'var(--sfp-gold)', color: '#ffffff' }}
        >
          {children || 'Get Started'}
          <ArrowRight className="h-4 w-4" />
        </Link>
        {showCompliance && <ComplianceHint text={complianceText} />}
      </div>
    );
  }

  // ── Card Variant ───────────────────────────────────────────
  if (variant === 'card') {
    return (
      <div
        className={`relative rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 shadow-sm not-prose ${className}`}
      >
        <Link
          href={href}
          target="_blank"
          rel={AFFILIATE_REL}
          className="flex items-center justify-between gap-3"
        >
          <span className="font-medium" style={{ color: 'var(--sfp-ink)' }}>
            {children || 'Visit Partner'}
          </span>
          <ExternalLink className="h-4 w-4 shrink-0" style={{ color: 'var(--sfp-navy)' }} />
        </Link>
        {showCompliance && <ComplianceHint text={complianceText} />}
      </div>
    );
  }

  // ── Inline Variant (default) ───────────────────────────────
  return (
    <span className={`inline ${className}`}>
      <Link
        href={href}
        target="_blank"
        rel={AFFILIATE_REL}
        className="underline underline-offset-2 transition-colors"
        style={{ color: 'var(--sfp-navy)' }}
      >
        {children || slug}
      </Link>
      {showCompliance && (
        <ComplianceHint text={complianceText} layout="inline" />
      )}
    </span>
  );
}

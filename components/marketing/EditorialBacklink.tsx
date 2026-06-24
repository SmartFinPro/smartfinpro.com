// components/marketing/EditorialBacklink.tsx
/**
 * EditorialBacklink — reverse bridge: a LIGHT trust inset placed on a dark
 * Protocol page that links back to the editorial review as the credibility source.
 *
 * Server-renderable (no 'use client', no hooks). Must be rendered by a Server
 * Component (e.g. page.tsx) and passed into the 'use client' FirewallClient via a
 * ReactNode slot — NEVER imported directly into firewall-client.tsx.
 *
 * Uses the light --sfp brand tokens (inline style, matching the Rating component
 * pattern) so the brand DNA shows through inside the dark world.
 */

import Link from 'next/link';
import Image from 'next/image';

export interface EditorialBacklinkProps {
  reviewer: { name: string; role: string; image: string };
  reviewHref: string;
  blurb?: string;
}

export function EditorialBacklink({ reviewer, reviewHref, blurb }: EditorialBacklinkProps) {
  return (
    <aside
      className="rounded-[1.25rem] border p-5"
      style={{ borderColor: 'rgba(27,79,140,0.20)', background: '#ffffff' }}
    >
      <div className="flex items-center gap-3">
        <Image
          src={reviewer.image}
          alt={reviewer.name}
          width={44}
          height={44}
          className="h-11 w-11 rounded-full object-cover"
          style={{ border: '1px solid rgba(27,79,140,0.20)' }}
        />
        <div className="leading-tight">
          <p className="text-sm font-bold" style={{ color: '#16233a' }}>
            Reviewed by {reviewer.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--sfp-slate)' }}>
            {reviewer.role}
          </p>
        </div>
        <span
          className="ml-auto rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: 'var(--sfp-green)', background: 'rgba(26,107,58,0.10)' }}
        >
          ✓ Independent
        </span>
      </div>
      <div className="mt-3 border-t pt-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--sfp-ink)' }}>
          {blurb ?? 'This protocol is backed by our hands-on, independent Mercury review — fees, FDIC coverage and onboarding tested in full.'}
        </p>
        <Link
          href={reviewHref}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold no-underline"
          style={{ color: 'var(--sfp-navy)', borderBottom: '2px solid var(--sfp-gold)', paddingBottom: '2px' }}
        >
          Read the full Mercury review →
        </Link>
      </div>
    </aside>
  );
}

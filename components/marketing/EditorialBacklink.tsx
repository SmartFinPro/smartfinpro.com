// components/marketing/EditorialBacklink.tsx
/**
 * EditorialBacklink — reverse bridge: a trust inset placed on a dark Protocol page
 * that links back to the editorial review as the credibility source.
 *
 * Server-renderable (no 'use client', no hooks). Must be rendered by a Server
 * Component (e.g. page.tsx) and passed into the 'use client' FirewallClient via a
 * ReactNode slot — NEVER imported directly into firewall-client.tsx.
 *
 * Styled in the firewall DARK palette (zinc/cyan utilities) to sit natively in the
 * Protocol page, with the node-card cyan hover. The gold underline keeps the brand
 * thread. Part of the documented dark BOFU exception — do NOT convert to light.
 */

import Image from 'next/image';
import { TrackedReviewLink } from '@/components/marketing/tracked-review-link';

export interface EditorialBacklinkProps {
  reviewer: { name: string; role: string; image: string };
  reviewHref: string;
  blurb?: string;
}

export function EditorialBacklink({ reviewer, reviewHref, blurb }: EditorialBacklinkProps) {
  return (
    <aside className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/50 hover:bg-cyan-950/20 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]">
      <div className="flex items-center gap-5">
        <Image
          src={reviewer.image}
          alt={reviewer.name}
          width={80}
          height={80}
          className="h-20 w-20 rounded-full border border-white/15 object-cover"
        />
        <div className="leading-tight">
          <p className="text-lg font-bold text-white">Reviewed by {reviewer.name}</p>
          <p className="mt-1 text-sm text-zinc-400">{reviewer.role}</p>
        </div>
        <span className="ml-auto rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-300">
          ✓ Independent
        </span>
      </div>
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-sm leading-relaxed text-zinc-300">
          {blurb ?? 'This protocol is backed by our hands-on, independent Mercury review — fees, FDIC coverage and onboarding tested in full.'}
        </p>
        <TrackedReviewLink
          href={reviewHref}
          eventName="firewall_review_backlink_click"
          className="mt-3 inline-flex items-center gap-2 border-b-2 border-[#F5A623] pb-0.5 text-base font-bold text-white no-underline"
        >
          Read the full Mercury review
          <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
            →
          </span>
        </TrackedReviewLink>
      </div>
    </aside>
  );
}

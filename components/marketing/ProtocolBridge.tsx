// components/marketing/ProtocolBridge.tsx
/**
 * ProtocolBridge — forward bridge from a light editorial review into the dark
 * BOFU "Protocol" landing page. Renders a dark portal card that gives readers a
 * controlled preview of the product world before they click.
 *
 * Uses the firewall DARK palette (zinc/cyan utilities) on purpose — it is a dark
 * block embedded in a light article. Do NOT "fix" this to the light --sfp tokens;
 * it is part of the documented dark BOFU exception.
 *
 * Client-safe — no server imports. (Rendered through the 'use client' MDX map.)
 */

import Link from 'next/link';

export interface ProtocolBridgeProps {
  href: string;
  title: string;
  kicker?: string;
  subtitle?: string;
  chips?: string[];
  cta?: string;
  /** Outer spacing/utility override. Defaults to `my-8` for in-article (MDX body) use;
   *  pass `''` when the parent already controls spacing (e.g. a sidebar with space-y). */
  className?: string;
}

export function ProtocolBridge({
  href,
  title,
  kicker = 'Implementation Protocol',
  subtitle,
  chips,
  cta = 'Open the build protocol',
  className = 'my-8',
}: ProtocolBridgeProps) {
  return (
    <Link
      href={href}
      className={`group not-prose block rounded-[1.5rem] border border-white/10 bg-[#0a0a0c] p-6 no-underline shadow-[0_0_40px_rgba(34,211,238,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/40 ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">{kicker}</p>
      <p className="mt-2 text-xl font-extrabold text-white">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
      {chips && chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      <span className="mt-5 inline-flex items-center gap-2 rounded-[1rem] border border-cyan-300/50 bg-black/80 px-5 py-2.5 text-sm font-bold text-white">
        {cta}
        <span className="text-cyan-300 transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
          →
        </span>
      </span>
    </Link>
  );
}

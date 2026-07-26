'use client';
// components/tools/shell/next-best-action-cta.tsx
// Client Tracker-Leaf for NextBestAction (SPEC 7.3), split out because a
// single file can't mix an RSC export with a 'use client' directive — same
// reason components/marketing/cockpit-verdict-cta.tsx is its own file.
// When kind === 'cockpit' this fires tool_next_action_click THEN
// tool_cockpit_cta_click (both immediate, per createToolTracker.
// trackNextAction). Never preventDefault — the navigation always proceeds.

import { useToolTracking } from '@/lib/analytics/tool-tracking';
import type { ToolContext, NextActionKind } from '@/lib/analytics/tool-events';

export interface NextBestActionCtaProps {
  href: string;
  label: string;
  kind: NextActionKind;
  ctx: ToolContext;
}

export function NextBestActionCta({ href, label, kind, ctx }: NextBestActionCtaProps) {
  const tracker = useToolTracking(ctx);
  return (
    <a
      href={href}
      onClick={() => tracker.trackNextAction(kind, href)}
      className="text-[15px] font-semibold text-[var(--sfp-navy)] no-underline hover:underline"
    >
      {label}
    </a>
  );
}

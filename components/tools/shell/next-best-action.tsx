// components/tools/shell/next-best-action.tsx
// RSC — exactly one bridge (result contract slot 6, SPEC 4.5). Renders the
// static `.next-action` frame server-side; the actual link + click tracking
// lives in the client Tracker-Leaf (next-best-action-cta.tsx), matching the
// components/marketing/cockpit-verdict-cta.tsx split pattern.

import type { ToolResult } from '@/lib/tools/shell-types';
import type { ToolContext } from '@/lib/analytics/tool-events';
import { NextBestActionCta } from './next-best-action-cta';

export interface NextBestActionProps {
  action: ToolResult['nextAction'];
  ctx: ToolContext;
}

export function NextBestAction({ action, ctx }: NextBestActionProps) {
  return (
    <div
      className="next-action flex flex-wrap items-center justify-between gap-3 rounded-tool-control border border-l-[3px] p-3.5"
      style={{ borderColor: 'var(--tool-border)', borderLeftColor: 'var(--sfp-navy)', background: 'var(--tool-surface)' }}
    >
      <NextBestActionCta href={action.href} label={action.label} kind={action.kind} ctx={ctx} />
    </div>
  );
}

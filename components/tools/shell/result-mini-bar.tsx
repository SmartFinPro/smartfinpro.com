'use client';
// components/tools/shell/result-mini-bar.tsx
// Mobile-only result summary bar (SPEC 6.2/6.6): fixed to the bottom, appears
// only after a belastbares (qualified) result, single-line summary
// (nowrap+ellipsis — High-Fi v2 fix: never 2-zeilig), never covers content
// (the page must reserve bottom padding — done by the consuming layout).

export interface ResultMiniBarProps {
  visible: boolean;
  summary: string;
  onJump: () => void;
}

export function ResultMiniBar({ visible, summary, onJump }: ResultMiniBarProps) {
  if (!visible) return null;
  return (
    <div
      className="mini-bar fixed inset-x-0 bottom-0 z-40 flex min-h-14 items-center justify-between gap-3 border-t px-4 py-2 sm:hidden"
      style={{ borderColor: 'var(--tool-border-strong)', background: 'var(--tool-surface)', boxShadow: '0 -1px 2px rgb(16 24 40 / 0.06)' }}
    >
      <span
        className="v min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-bold tabular-nums"
        style={{ color: 'var(--sfp-ink)' }}
      >
        {summary}
      </span>
      <button
        type="button"
        onClick={onJump}
        className="btn min-h-9 flex-none rounded-tool-control border px-3 text-sm font-semibold"
        style={{ borderColor: 'var(--sfp-navy)', color: 'var(--sfp-navy)', background: 'var(--tool-surface)' }}
      >
        View result
      </button>
    </div>
  );
}

'use client';
// components/tools/shell/share-result.tsx
// UI hull + preview contract only (PR 2.1) — the actual encodeShare/decodeShare
// codec ships in PR 2.3 (SPEC 8.7). This component demonstrates and exercises
// the calling contract (`buildPayload`) and renders a field-count preview,
// but does not yet produce a real shareable link.

import { useState } from 'react';
import type { ToolId } from '@/lib/tools/registry/types';

export interface ShareResultProps {
  toolId: ToolId;
  buildPayload: () => Record<string, number | string> | null;
}

export function ShareResult({ buildPayload }: ShareResultProps) {
  const [preview, setPreview] = useState<{ fieldCount: number } | null>(null);
  const [attempted, setAttempted] = useState(false);

  function handleClick(): void {
    setAttempted(true);
    const payload = buildPayload();
    setPreview(payload ? { fieldCount: Object.keys(payload).length } : null);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="btn inline-flex min-h-11 items-center justify-center gap-2 rounded-tool-control border px-4 text-[15px] font-semibold"
        style={{ borderColor: 'var(--tool-border-strong)', background: 'var(--tool-surface)', color: 'var(--sfp-ink)' }}
      >
        Share this scenario
      </button>
      {attempted ? (
        <p className="text-xs text-[var(--sfp-slate)]">
          {preview
            ? `Preview: ${preview.fieldCount} field${preview.fieldCount === 1 ? '' : 's'} will be included in the share link.`
            : 'Not enough inputs yet to build a share link.'}
        </p>
      ) : null}
    </div>
  );
}

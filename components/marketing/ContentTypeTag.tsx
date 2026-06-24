// components/marketing/ContentTypeTag.tsx
/**
 * ContentTypeTag — small pill labeling a link's content type so the hub IA
 * stays legible: light types (Review/Guide) vs dark types (Protocol/Playbook).
 *
 * Client-safe — no server imports.
 */

import { CONTENT_TYPE_META, type ContentType } from './content-type-meta';

export function ContentTypeTag({ type }: { type: ContentType }) {
  const meta = CONTENT_TYPE_META[type];
  return (
    <span
      className={`not-prose mr-2 inline-flex items-center rounded-full border px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-[0.12em] ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

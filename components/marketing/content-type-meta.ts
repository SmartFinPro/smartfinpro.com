// components/marketing/content-type-meta.ts
// Pure mapping for content-type labels — no JSX, no Next imports, so it stays
// trivially unit-testable. ContentTypeTag.tsx renders from this.

export type ContentType = 'review' | 'guide' | 'protocol' | 'playbook';

export const CONTENT_TYPES: ContentType[] = ['review', 'guide', 'protocol', 'playbook'];

export interface ContentTypeMeta {
  label: string;
  /** 'light' = editorial (Navy/Gold), 'dark' = BOFU protocol (cyan) */
  tone: 'light' | 'dark';
  /** Tailwind classes for the pill */
  className: string;
}

export const CONTENT_TYPE_META: Record<ContentType, ContentTypeMeta> = {
  review: {
    label: 'Review',
    tone: 'light',
    className: 'border-[rgba(27,79,140,0.25)] bg-[var(--sfp-sky)] text-[var(--sfp-navy)]',
  },
  guide: {
    label: 'Guide',
    tone: 'light',
    className: 'border-[rgba(212,139,26,0.35)] bg-[rgba(245,166,35,0.12)] text-[var(--sfp-gold-dark)]',
  },
  protocol: {
    label: 'Protocol',
    tone: 'dark',
    className: 'border-cyan-300/40 bg-[#0a0a0c] text-cyan-300',
  },
  playbook: {
    label: 'Playbook',
    tone: 'dark',
    className: 'border-cyan-300/40 bg-[#0a0a0c] text-cyan-300',
  },
};

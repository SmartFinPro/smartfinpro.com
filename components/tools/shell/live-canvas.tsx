// components/tools/shell/live-canvas.tsx
// RSC (grid) + client islands underneath — Money Leak / Sparrechner / Rewards
// / Gold ROI / AI ROI / Credit Utilization (SPEC 6.2). Inputs 5 columns,
// Result 7 columns at ≥1280 (4/8 at 1440 per spec table — simplified to a
// single 5/7 split here, matching the 1024/1280 rows; 1440-specific 4/8 is a
// presentational refinement for the page that mounts this, not a structural
// change). Result is ALWAYS visible (no accordion/tab hides it). Below 900px
// the grid collapses to one column (Tailwind `md:` breakpoint).

import type { ReactNode } from 'react';

export interface LiveCanvasLayoutProps {
  inputs: ReactNode;
  result: ReactNode;
}

export function LiveCanvasLayout({ inputs, result }: LiveCanvasLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
      <div className="md:col-span-5">{inputs}</div>
      {/* Sticky is pure-CSS: position:sticky is naturally inert once the
          (typically taller) input column finishes scrolling past — no JS
          height comparison needed, keeping this file RSC-safe. */}
      <div className="md:sticky md:top-4 md:col-span-7 md:self-start">{result}</div>
    </div>
  );
}
